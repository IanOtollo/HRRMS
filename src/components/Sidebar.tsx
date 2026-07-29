"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  LineChart,
  GraduationCap,
  Scale,
  DoorOpen,
  FileDigit,
  FileBarChart,
  ShieldAlert,
  Settings,
  ChevronLeft,
  ChevronDown,
  Database,
  User,
  X,
} from "lucide-react";
import { useState } from "react";

type CurrentUser = {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
} | null | undefined;

const navigationSections = [
  {
    title: "Operations",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/employees", label: "Employees", icon: Users },
      { href: "/digitization-queue", label: "Documents", icon: FileDigit },
    ],
  },
  {
    title: "Talent & HR",
    items: [
      { href: "https://uatleave.busiacounty.go.ke/", label: "Leave", icon: CalendarDays, external: true },
      { href: "/performance", label: "Performance", icon: LineChart },
      { href: "/training", label: "Training", icon: GraduationCap },
    ],
  },
  {
    title: "Compliance & Exits",
    items: [
      { href: "/disciplinary", label: "Disciplinary", icon: Scale },
      { href: "/retirement-exit", label: "Retirement & Exit", icon: DoorOpen },
    ],
  },
  {
    title: "Administration",
    adminOnly: true,
    items: [
      { href: "/reports", label: "Reports", icon: FileBarChart },
      { href: "/roles", label: "Users & Roles", icon: ShieldAlert },
      { href: "/audit-log", label: "Audit Log", icon: Database },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function Sidebar({
  currentUser,
  mobileOpen = false,
  onCloseMobile,
}: {
  currentUser?: CurrentUser;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [closedSections, setClosedSections] = useState<Record<string, boolean>>({});

  const role = currentUser?.role ?? "";

  const toggleSection = (title: string) => {
    setClosedSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden print:hidden"
        />
      )}
      <aside
        className={`print:hidden bg-[#202b5d] text-slate-300 flex flex-col transition-all duration-300 ease-out shrink-0 border-r border-slate-700/50 fixed md:static inset-y-0 left-0 z-50 md:z-20 w-[260px] ${
          collapsed ? "md:w-[64px]" : "md:w-[260px]"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
      {/* Header / Logo Zone */}
      <div className={`relative flex flex-col items-center justify-center border-b border-slate-700/50 shrink-0 bg-black/20 transition-all duration-200 ${
        collapsed ? "h-[80px]" : "h-[105px] pt-2"
      }`}>
        <div className="flex items-center shrink-0 mb-1">
          <Image
            src="/logo.png"
            alt="Busia County Logo"
            width={collapsed ? 40 : 100}
            height={collapsed ? 30 : 40}
            className="object-contain"
            priority
          />
        </div>

        <div
          className={`flex flex-col items-center transition-all duration-200 overflow-hidden whitespace-nowrap ${
            collapsed ? "opacity-0 h-0" : "opacity-100 h-[36px]"
          }`}
        >
          <span className="font-serif font-bold text-[16px] text-white leading-tight tracking-wide">HRRMS</span>
          <span className="text-[9px] text-[#9ECA3E] uppercase tracking-widest font-bold">Busia County Govt</span>
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`hidden md:block absolute transition-all duration-200 text-slate-400 hover:text-white p-1 hover:bg-slate-700/50 rounded-md ${
            collapsed ? "opacity-0 pointer-events-none" : "right-2 top-2"
          }`}
        >
          <ChevronLeft size={16} />
        </button>

        <button
          onClick={onCloseMobile}
          className="md:hidden absolute right-2 top-2 text-slate-400 hover:text-white p-1 hover:bg-slate-700/50 rounded-md"
        >
          <X size={16} />
        </button>

        {collapsed && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute left-[16px] top-[90px] z-50 text-slate-400 hover:text-white p-1 hover:bg-slate-700/50 rounded-md rotate-180 bg-[#161f47] border border-slate-700 shadow-xl"
          >
            <ChevronLeft size={14} />
          </button>
        )}
      </div>

      {/* Navigation Modules */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-dark">
        <div className="space-y-1">
          {navigationSections.map((section) => {
            if (section.adminOnly && role !== "super_admin" && role !== "hr_director") return null;
            const isClosed = closedSections[section.title];

            return (
              <div key={section.title} className="px-3">
                {!collapsed && (
                  <button
                    onClick={() => toggleSection(section.title)}
                    className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <span>{section.title}</span>
                    <motion.span
                      animate={{ rotate: isClosed ? -90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown size={12} />
                    </motion.span>
                  </button>
                )}

                <AnimatePresence initial={false}>
                  {(!isClosed || collapsed) && (
                    <motion.ul
                      initial={collapsed ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
                      className="space-y-0.5 overflow-hidden"
                    >
                      {section.items.map((item) => {
                        const isExternal = "external" in item && item.external;
                        const isActive = !isExternal && (pathname === item.href || pathname.startsWith(item.href + "/"));
                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              target={isExternal ? "_blank" : undefined}
                              rel={isExternal ? "noopener noreferrer" : undefined}
                              onClick={() => !isExternal && onCloseMobile?.()}
                              className={`flex items-center h-[32px] w-full relative transition-colors rounded group/item ${
                                isActive ? "bg-white/10 text-white font-medium" : "text-slate-300 hover:bg-white/5 hover:text-white"
                              }`}
                            >
                              {isActive && !collapsed && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[2px] bg-[#9ECA3E] rounded-r-full" />
                              )}
                              {isActive && collapsed && (
                                <div className="absolute left-0.5 top-1/2 -translate-y-1/2 h-[28px] w-[2px] bg-[#9ECA3E] rounded-full" />
                              )}

                              <div className={`flex justify-center shrink-0 ${collapsed ? "w-full" : "w-[36px]"}`}>
                                <item.icon size={15} className={isActive ? "text-[#9ECA3E]" : "text-slate-400"} />
                              </div>

                              {!collapsed && (
                                <span className="text-[13px] truncate pr-2">
                                  {item.label}
                                </span>
                              )}

                              {collapsed && (
                                <div className="absolute left-[48px] top-1/2 -translate-y-1/2 px-2 py-1.5 bg-[#161f47] text-white text-[11px] font-medium rounded opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all duration-200 z-50 whitespace-nowrap shadow-xl border border-slate-700 pointer-events-none flex items-center">
                                  <div className="absolute top-1/2 -translate-y-1/2 -left-[4px] w-0 h-0 border-t-[4px] border-t-transparent border-r-[4px] border-r-slate-700 border-b-[4px] border-b-transparent"></div>
                                  {item.label}
                                </div>
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </nav>

      {/* User Block */}
      <div className="h-[60px] border-t border-slate-700/50 relative flex items-center shrink-0 bg-black/20">
        <div className="absolute left-[16px] flex items-center">
          <div className="w-8 h-8 rounded bg-[#161f47] border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 shadow-inner">
            <User size={16} />
          </div>
        </div>

        <div className={`absolute left-[56px] flex flex-col transition-all duration-200 overflow-hidden whitespace-nowrap ${
          collapsed ? "opacity-0 w-0" : "opacity-100 w-[180px]"
        }`}>
          <span className="text-[13px] font-semibold text-white leading-tight truncate">{currentUser?.name || "..."}</span>
          <span className="text-[10px] text-slate-400 truncate">{currentUser?.email || ""}</span>
        </div>
      </div>
      </aside>
    </>
  );
}
