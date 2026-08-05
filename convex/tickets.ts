import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { getCurrentUser, requireRole } from "./lib/rbac";
import { audited } from "./lib/audit";
import { Id } from "./_generated/dataModel";

// Ticket handling is ICT Support's job, not HR Director's — every other
// account (including super_admin/hr_director) is just another submitter and
// only ever sees its own tickets, never anyone else's.
const STAFF_ROLES = ["ict_support"];

const ticketTypeValidator = v.union(
  v.literal("inquiry"),
  v.literal("problem"),
  v.literal("suggestion"),
  v.literal("password_reset")
);

const preferredContactValidator = v.union(
  v.literal("in_app"),
  v.literal("whatsapp"),
  v.literal("sms"),
  v.literal("phone_call")
);

// Works logged-in or logged-out — a locked-out user can't sign in to file
// the one ticket type that would get them unlocked. When logged in, the
// account's own name/email are trusted over whatever was typed, so a
// submission can't be spoofed as someone else while authenticated.
export const submit = mutation({
  args: {
    type: ticketTypeValidator,
    subject: v.string(),
    description: v.string(),
    submitterName: v.string(),
    submitterEmail: v.string(),
    submitterPhone: v.optional(v.string()),
    // Not applicable to password_reset — that flow always goes through ICT
    // setting a temp password directly, not back-and-forth contact.
    preferredContact: v.optional(preferredContactValidator),
  },
  handler: async (ctx, args) => {
    return audited(ctx, { action: "ticket.submit", recordType: "supportTickets" }, async () => {
      const userId = await getAuthUserId(ctx);
      const account = userId ? await ctx.db.get(userId) : null;

      const submitterName = account?.name ?? args.submitterName;
      const submitterEmail = account?.email ?? args.submitterEmail;

      if (!submitterName.trim() || !submitterEmail.trim()) {
        throw new ConvexError("Name and email are required");
      }
      if (!args.subject.trim() || !args.description.trim()) {
        throw new ConvexError("Subject and description are required");
      }
      if (
        args.preferredContact &&
        args.preferredContact !== "in_app" &&
        !args.submitterPhone?.trim()
      ) {
        throw new ConvexError("A phone number is required for that contact method");
      }

      const now = Date.now();
      const ticketId = await ctx.db.insert("supportTickets", {
        type: args.type,
        subject: args.subject,
        description: args.description,
        status: "open",
        submitterUserId: account?._id,
        submitterName,
        submitterEmail,
        submitterPhone: args.submitterPhone,
        preferredContact: args.type === "password_reset" ? undefined : args.preferredContact,
        createdAt: now,
        updatedAt: now,
      });

      await ctx.db.insert("ticketMessages", {
        ticketId,
        senderUserId: account?._id,
        senderName: submitterName,
        body: args.description,
        createdAt: now,
      });

      return { result: ticketId, recordId: ticketId, details: { type: args.type, subject: args.subject } };
    });
  },
});

export const myTickets = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    return await ctx.db
      .query("supportTickets")
      .withIndex("by_submitterUserId", (q) => q.eq("submitterUserId", user._id))
      .order("desc")
      .collect();
  },
});

export const listForSupport = query({
  args: { status: v.optional(v.union(v.literal("open"), v.literal("in_progress"), v.literal("resolved"), v.literal("closed"))) },
  handler: async (ctx, args) => {
    await requireRole(ctx, STAFF_ROLES);
    let tickets = await ctx.db.query("supportTickets").withIndex("by_status").order("desc").collect();
    if (args.status) tickets = tickets.filter((t) => t.status === args.status);
    return tickets.sort((a, b) => b.createdAt - a.createdAt);
  },
});

async function requireTicketAccess(ctx: QueryCtx | MutationCtx, ticketId: Id<"supportTickets">) {
  const user = await getCurrentUser(ctx);
  const ticket = await ctx.db.get(ticketId);
  if (!ticket) throw new ConvexError("Ticket not found");

  const isStaff = user.role && STAFF_ROLES.includes(user.role);
  const isSubmitter = ticket.submitterUserId === user._id;
  if (!isStaff && !isSubmitter) {
    throw new ConvexError("Access denied");
  }
  return { user, ticket, isStaff };
}

export const getTicket = query({
  args: { ticketId: v.id("supportTickets") },
  handler: async (ctx, args) => {
    const { ticket } = await requireTicketAccess(ctx, args.ticketId);
    const messages = await ctx.db
      .query("ticketMessages")
      .withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId))
      .order("asc")
      .collect();
    return { ticket, messages };
  },
});

export const sendMessage = mutation({
  args: { ticketId: v.id("supportTickets"), body: v.string() },
  handler: async (ctx, args) => {
    return audited(ctx, { action: "ticket.sendMessage", recordType: "supportTickets", recordId: args.ticketId }, async () => {
      const { user, ticket, isStaff } = await requireTicketAccess(ctx, args.ticketId);

      if (!args.body.trim()) throw new ConvexError("Message cannot be empty");

      await ctx.db.insert("ticketMessages", {
        ticketId: args.ticketId,
        senderUserId: user._id,
        senderName: user.name ?? user.email ?? "Unknown",
        body: args.body,
        createdAt: Date.now(),
      });

      await ctx.db.patch(args.ticketId, {
        updatedAt: Date.now(),
        status: ticket.status === "open" ? "in_progress" : ticket.status,
      });

      // Notify "the other side" — the submitter if staff replied (and they
      // have an account to be notified on), nobody specific if the
      // submitter replied (staff watch the queue rather than getting a
      // per-message ping).
      if (isStaff && ticket.submitterUserId && ticket.submitterUserId !== user._id) {
        await ctx.db.insert("notifications", {
          userId: ticket.submitterUserId,
          message: `ICT Support replied to your ticket: ${ticket.subject}`,
          linkPath: `/support/${args.ticketId}`,
          isRead: false,
          createdAt: Date.now(),
        });
      }

      return { result: null };
    });
  },
});

export const updateStatus = mutation({
  args: {
    ticketId: v.id("supportTickets"),
    status: v.union(v.literal("open"), v.literal("in_progress"), v.literal("resolved"), v.literal("closed")),
  },
  handler: async (ctx, args) => {
    return audited(ctx, { action: "ticket.updateStatus", recordType: "supportTickets", recordId: args.ticketId }, async () => {
      await requireRole(ctx, STAFF_ROLES);
      const ticket = await ctx.db.get(args.ticketId);
      if (!ticket) throw new ConvexError("Ticket not found");

      await ctx.db.patch(args.ticketId, {
        status: args.status,
        updatedAt: Date.now(),
        resolvedAt: args.status === "resolved" || args.status === "closed" ? Date.now() : ticket.resolvedAt,
      });

      return { result: null, details: { fromStatus: ticket.status, toStatus: args.status } };
    });
  },
});

export const assignToMe = mutation({
  args: { ticketId: v.id("supportTickets") },
  handler: async (ctx, args) => {
    return audited(ctx, { action: "ticket.assignToMe", recordType: "supportTickets", recordId: args.ticketId }, async () => {
      const user = await requireRole(ctx, STAFF_ROLES);
      const ticket = await ctx.db.get(args.ticketId);
      if (!ticket) throw new ConvexError("Ticket not found");

      await ctx.db.patch(args.ticketId, { assignedTo: user._id, updatedAt: Date.now() });

      return { result: null };
    });
  },
});
