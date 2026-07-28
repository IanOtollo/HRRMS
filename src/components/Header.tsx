"use client";

import { Bell, Search } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function Header() {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");

  const breadcrumbs = pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1));

  return (
    <header className="h-16 bg-white border-b border-paper-200 sticky top-0 z-10 flex items-center justify-between px-4 md:px-8">
      <div className="flex items-center min-w-0">
        <div className="hidden md:flex text-text-secondary text-sm font-medium truncate mr-8">
          <Link href="/dashboard" className="hover:text-county-blue transition-colors">Home</Link>
          {breadcrumbs.map((crumb, idx) => (
            <span key={idx} className="flex items-center">
              <span className="mx-2 text-paper-200">/</span>
              <span className={idx === breadcrumbs.length - 1 ? "text-text-primary" : "hover:text-county-blue transition-colors cursor-pointer"}>
                {crumb}
              </span>
            </span>
          ))}
        </div>
        
        <div className="relative w-full max-w-[360px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
          <input
            type="text"
            placeholder="Search name, P/F No, National ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-[360px] h-10 pl-10 pr-4 bg-paper-50 border border-paper-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-county-blue focus:border-transparent transition-all placeholder:text-text-secondary"
          />
        </div>
      </div>

      <div className="flex items-center ml-4 shrink-0 space-x-6">
        <button className="relative text-text-secondary hover:text-text-primary transition-colors">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-rust-700 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white">
            3
          </span>
        </button>
        
        <div className="w-[1px] h-8 bg-paper-200" />
        
        <Link
          href="/employees/add"
          className="h-10 px-4 bg-county-blue hover:bg-[#0f345e] text-white text-sm font-medium rounded flex items-center transition-colors shadow-flat"
        >
          + Add Employee
        </Link>
      </div>
    </header>
  );
}
