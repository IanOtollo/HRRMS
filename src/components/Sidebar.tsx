"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
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
  Briefcase,
  FileCheck2,
  Database,
  LockKeyhole
} from "lucide-react";
import { useState } from "react";

const navigationSections = [
  {
    title: "OPERATIONS",
    items: [
      { href: "/dashboard", label: "System Dashboard", icon: LayoutDashboard },
      { href: "/employees", label: "Employee Master Record", icon: Users },
      { href: "/digitization-queue", label: "Document Management Module", icon: FileDigit },
    ]
  },
  {
    title: "TALENT & HR",
    items: [
      { href: "/leave", label: "Leave Management Module", icon: CalendarDays },
      { href: "/performance", label: "Performance Management Module", icon: LineChart },
      { href: "/training", label: "Training Module", icon: GraduationCap },
    ]
  },
  {
    title: "COMPLIANCE & EXITS",
    items: [
      { href: "/disciplinary", label: "Disciplinary Module", icon: Scale },
      { href: "/retirement-exit", label: "Retirement and Exit Module", icon: DoorOpen },
    ]
  },
  {
    title: "ADMINISTRATION",
    adminOnly: true,
    items: [
      { href: "/reports", label: "Analytics & Reports", icon: FileBarChart },
      { href: "/roles", label: "RBAC & Permissions", icon: ShieldAlert },
      { href: "/audit-log", label: "System Audit Log", icon: Database },
      { href: "/settings", label: "Global Settings", icon: Settings },
    ]
  }
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  
  const role = "super_admin"; // Placeholder

  return (
    <aside
      className={`bg-[#202b5d] text-slate-300 flex flex-col transition-all duration-200 ease-out z-20 shrink-0 border-r border-slate-700/50 ${
        collapsed ? "w-[64px]" : "w-[260px]"
      }`}
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
          <span className="font-serif font-bold text-[16px] text-white leading-tight tracking-wide">HRRMS Master</span>
          <span className="text-[9px] text-[#9ECA3E] uppercase tracking-widest font-bold">Busia County Govt</span>
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`absolute transition-all duration-200 text-slate-400 hover:text-white p-1 hover:bg-slate-700/50 rounded-md ${
            collapsed ? "opacity-0 pointer-events-none" : "right-2 top-2"
          }`}
        >
          <ChevronLeft size={16} />
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
      <nav className="flex-1 overflow-y-auto py-4 hide-scrollbar">
        <div className="space-y-6">
          {navigationSections.map((section, idx) => {
            if (section.adminOnly && role !== "super_admin") return null;

            return (
              <div key={idx} className="px-3">
                {!collapsed && (
                  <h3 className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    {section.title}
                  </h3>
                )}
                
                <ul className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
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
                </ul>
              </div>
            );
          })}
        </div>
      </nav>

      {/* User Block */}
      <div className="h-[60px] border-t border-slate-700/50 relative flex items-center shrink-0 bg-black/20">
        <div className="absolute left-[16px] flex items-center">
          <div className="w-8 h-8 rounded bg-[#161f47] border border-slate-700 flex items-center justify-center font-bold text-white shrink-0 text-xs shadow-inner">
            JD
          </div>
        </div>
        
        <div className={`absolute left-[56px] flex flex-col transition-all duration-200 overflow-hidden whitespace-nowrap ${
          collapsed ? "opacity-0 w-0" : "opacity-100 w-[200px]"
        }`}>
          <span className="text-[13px] font-semibold text-white leading-tight">System Admin</span>
          <span className="text-[10px] text-slate-400">admin@busiacounty.go.ke</span>
        </div>
      </div>
    </aside>
  );
}
