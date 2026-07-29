"use client";

import Link from "next/link";
import { Building2, Users, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import PageHeader from "@/components/PageHeader";

export default function DepartmentsPage() {
  const departments = useQuery(api.departments.list) || [];
  const employees = useQuery(api.employees.list, {}) || [];

  const countFor = (deptId: string) => employees.filter((e) => e.departmentId === deptId).length;

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        icon={Building2}
        title="Departments"
        subtitle="Busia County Departments"
        stats={[
          { label: "Total Departments", value: departments.length },
          { label: "Total Employees", value: employees.length },
        ]}
      />

      {departments.length === 0 ? (
        <div className="bg-white border border-paper-200 shadow-sm rounded-xl p-16 text-center text-slate-400">
          <Building2 size={32} className="mx-auto mb-3 opacity-20" />
          <p className="text-[14px] font-bold text-slate-600">No departments found</p>
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {departments.map((dept) => {
            const count = countFor(dept._id);
            return (
              <motion.div
                key={dept._id}
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.25 }}
              >
                <Link
                  href={`/employees?department=${dept._id}`}
                  className="relative flex flex-col bg-white rounded-xl border border-paper-200 shadow-sm p-5 pb-9 min-h-[140px] h-full overflow-hidden group hover:border-[#202b5d]/30 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#202b5d]/5 flex items-center justify-center text-[#202b5d] shrink-0 mb-3">
                    <Building2 size={16} />
                  </div>
                  <h3 className="text-[13px] font-bold text-[#202b5d] leading-snug pr-2">{dept.name}</h3>
                  <div className="mt-auto pt-3 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                    <Users size={12} />
                    {count} {count === 1 ? "employee" : "employees"}
                  </div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#202b5d] rounded-tl-lg flex items-center justify-center text-white group-hover:bg-[#161f47] transition-colors">
                    <ArrowUpRight size={13} />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
