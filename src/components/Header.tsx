"use client";

import { Search, LogOut, Menu, Plus } from "lucide-react";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import NotificationBell from "@/components/NotificationBell";

type CurrentUser = {
  name?: string;
  email?: string;
  role?: string;
} | null | undefined;

export default function Header({
  currentUser,
  onMenuClick,
}: {
  currentUser?: CurrentUser;
  onMenuClick?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuthActions();
  const recordLogout = useMutation(api.users.recordLogout);
  const [searchQuery, setSearchQuery] = useState("");

  const breadcrumbs = pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/employees?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSignOut = async () => {
    await recordLogout({}).catch(() => {});
    await signOut();
    router.push("/login");
  };

  return (
    <header className="print:hidden h-16 bg-white border-b border-paper-200 sticky top-0 z-10 flex items-center justify-between px-3 sm:px-4 md:px-8 gap-2">
      <div className="flex items-center min-w-0 flex-1 gap-2 sm:gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden shrink-0 text-text-secondary hover:text-text-primary transition-colors p-1.5 -ml-1.5"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>

        <div className="hidden lg:flex text-text-secondary text-sm font-medium truncate mr-4 shrink-0">
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

        <form onSubmit={handleSearch} className="relative min-w-0 flex-1 max-w-[360px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
          <input
            type="text"
            placeholder="Search name, P/F No, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-paper-50 border border-paper-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-county-blue focus:border-transparent transition-all placeholder:text-text-secondary"
          />
        </form>
      </div>

      <div className="flex items-center shrink-0 gap-3 sm:gap-4 md:gap-5">
        <NotificationBell />

        <div className="hidden sm:block w-[1px] h-8 bg-paper-200" />

        <Link
          href="/employees/add"
          className="h-10 px-2.5 sm:px-4 bg-county-blue hover:bg-[#0f345e] text-white text-sm font-medium rounded flex items-center transition-colors shadow-flat shrink-0"
        >
          <Plus size={16} className="sm:mr-1.5" />
          <span className="hidden sm:inline">Add Employee</span>
        </Link>

        <button
          onClick={handleSignOut}
          title="Sign out"
          className="text-text-secondary hover:text-rust-700 transition-colors shrink-0"
        >
          <LogOut size={19} />
        </button>
      </div>
    </header>
  );
}
