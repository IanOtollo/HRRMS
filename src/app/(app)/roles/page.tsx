"use client";

import { useState } from "react";
import { ShieldAlert, Plus, ShieldOff, Power, UserCog } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id, Doc } from "../../../../convex/_generated/dataModel";
import PageHeader from "@/components/PageHeader";
import SlideOver from "@/components/SlideOver";
import ErrorState from "@/components/ErrorState";
import Select from "@/components/Select";
import EmployeePicker from "@/components/EmployeePicker";

const ROLE_OPTIONS = Object.entries({
  super_admin: "Super Administrator",
  hr_director: "HR Director",
  records_officer: "Records Officer",
  department_viewer: "Department Viewer",
}).map(([value, label]) => ({ value, label }));

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Administrator",
  hr_director: "HR Director",
  records_officer: "Records Officer",
  department_viewer: "Department Viewer",
};

const roleBadge: Record<string, string> = {
  super_admin: "bg-red-100 text-red-700",
  hr_director: "bg-blue-100 text-blue-700",
  records_officer: "bg-emerald-100 text-emerald-700",
  department_viewer: "bg-slate-100 text-slate-600",
};

export default function RolesPage() {
  const currentUser = useQuery(api.users.me);
  const isSuperAdmin = currentUser?.role === "super_admin";
  const canView = currentUser?.role === "super_admin" || currentUser?.role === "hr_director";

  const users = useQuery(api.users.list, canView ? {} : "skip") || [];
  const departments = useQuery(api.departments.list) || [];
  const createUser = useAction(api.users.create);
  const setActive = useMutation(api.users.setActive);
  const updateRole = useMutation(api.users.updateRole);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Doc<"employees"> | null>(null);
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("records_officer");
  const [departmentId, setDepartmentId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");

  const departmentName = (id?: string) => departments.find((d) => d._id === id)?.name ?? "—";

  if (currentUser === undefined) return null;

  if (!canView) {
    return (
      <div className="p-4 md:p-6">
        <ErrorState
          code={403}
          icon={ShieldOff}
          title="Access Restricted"
          message="User & role management is only available to Super Administrators and HR Directors."
        />
      </div>
    );
  }

  const resetForm = () => {
    setSelectedEmployee(null); setPassword(""); setRole("records_officer"); setDepartmentId(""); setActionError("");
  };

  const alreadyInvitedEmails = new Set(users.map((u) => u.email?.toLowerCase()).filter(Boolean));

  const handleCreate = async () => {
    if (!selectedEmployee) {
      setActionError("Select an employee to invite");
      return;
    }
    if (!selectedEmployee.emailAddress) {
      setActionError(`${selectedEmployee.fullName} has no work email on file — add one to their profile first`);
      return;
    }
    if (alreadyInvitedEmails.has(selectedEmployee.emailAddress.toLowerCase())) {
      setActionError(`${selectedEmployee.fullName} already has a user account`);
      return;
    }
    if (password.length < 8) {
      setActionError("Set a temporary password of at least 8 characters");
      return;
    }
    if (role === "department_viewer" && !departmentId) {
      setActionError("Department Viewer accounts require a department");
      return;
    }
    setSubmitting(true);
    try {
      await createUser({
        name: selectedEmployee.fullName,
        email: selectedEmployee.emailAddress,
        password,
        role: role as any,
        departmentId: departmentId ? (departmentId as Id<"departments">) : undefined,
      });
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      setActionError(err?.data?.message ?? err?.message ?? "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  const activeCount = users.filter((u) => u.isActive).length;
  const adminCount = users.filter((u) => u.role === "super_admin" || u.role === "hr_director").length;

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        icon={ShieldAlert}
        title="Users & Roles"
        subtitle="Role-Based Access Control"
        stats={[
          { label: "Total Users", value: users.length },
          { label: "Active", value: activeCount, accentClass: "text-emerald-600" },
          { label: "Deactivated", value: users.length - activeCount, accentClass: "text-slate-500" },
          { label: "Admins", value: adminCount, accentClass: "text-red-700" },
        ]}
        action={
          isSuperAdmin ? (
            <button
              onClick={() => setIsModalOpen(true)}
              className="h-9 px-4 text-[12px] font-bold bg-[#202b5d] text-white rounded-lg hover:bg-[#161f47] flex items-center transition-colors shadow-sm"
            >
              <Plus size={14} className="mr-2" /> Invite User
            </button>
          ) : undefined
        }
      />

      <div className="bg-white border border-paper-200 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-paper-200">
                <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">Name</th>
                <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">Email</th>
                <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">Role</th>
                <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">Department</th>
                <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">Status</th>
                {isSuperAdmin && <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-100">
              {users.map((u, i) => (
                <motion.tr
                  key={u._id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i, 10) * 0.02 }}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3 text-[12px] font-bold text-[#202b5d]">{u.name}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-600">{u.email}</td>
                  <td className="px-4 py-3">
                    {isSuperAdmin && u._id !== currentUser?._id ? (
                      <div className="w-44">
                        <Select
                          value={u.role ?? ""}
                          onChange={(value) => updateRole({ id: u._id, role: value as any, departmentId: u.departmentId })}
                          options={ROLE_OPTIONS}
                          className="h-7 text-[11px] font-bold"
                        />
                      </div>
                    ) : (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${roleBadge[u.role ?? ""] ?? "bg-slate-100 text-slate-600"}`}>
                        {ROLE_LABELS[u.role ?? ""] ?? "—"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-slate-500">{departmentName(u.departmentId)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${u.isActive ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-500"}`}>
                      {u.isActive ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  {isSuperAdmin && (
                    <td className="px-4 py-3">
                      {u._id !== currentUser?._id && (
                        <button
                          onClick={() => setActive({ id: u._id, isActive: !u.isActive })}
                          className="h-7 px-2.5 flex items-center gap-1 border border-slate-300 rounded text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          <Power size={12} /> {u.isActive ? "Deactivate" : "Activate"}
                        </button>
                      )}
                    </td>
                  )}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <SlideOver
        open={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetForm(); }}
        title="Invite User"
        icon={UserCog}
        footer={
          <>
            <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="px-4 h-9 text-[12px] font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
            <button onClick={handleCreate} disabled={submitting} className="px-4 h-9 text-[12px] font-bold bg-[#202b5d] text-white hover:bg-[#161f47] rounded-lg transition-colors shadow-sm disabled:opacity-60">
              {submitting ? "Creating..." : "Create Account"}
            </button>
          </>
        }
      >
        {actionError && <div className="text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5">{actionError}</div>}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Employee</label>
          <EmployeePicker value={selectedEmployee} onChange={setSelectedEmployee} placeholder="Search by name, ID, or P/F number..." />
          <p className="text-[11px] text-slate-400 mt-1">Only existing employee records can be invited as system users.</p>
        </div>
        {selectedEmployee && (
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Work Email</label>
            <input value={selectedEmployee.emailAddress ?? "No email on file"} disabled className="w-full border border-slate-300 rounded-lg h-9 px-3 text-[13px] bg-slate-50 text-slate-500" />
          </div>
        )}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Temporary Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-slate-300 rounded-lg h-9 px-3 text-[13px] focus:ring-1 focus:ring-[#202b5d] focus:outline-none" placeholder="Min. 8 characters" />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Role</label>
          <Select value={role} onChange={setRole} options={ROLE_OPTIONS} />
        </div>
        {role === "department_viewer" && (
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Department</label>
            <Select
              value={departmentId}
              onChange={setDepartmentId}
              placeholder="Select..."
              options={departments.map((d) => ({ value: d._id, label: d.name }))}
            />
          </div>
        )}
      </SlideOver>
    </div>
  );
}
