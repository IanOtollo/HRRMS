"use client";

import { Settings, Save } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-[#202b5d]">Global Settings</h1>
          <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold mt-1">System Configurations</p>
        </div>
        <div className="flex items-center space-x-2">
          <button className="h-8 px-4 text-[12px] font-bold bg-[#9ECA3E] text-white rounded hover:bg-[#7A9E2D] flex items-center transition-colors shadow-sm">
            <Save size={14} className="mr-2" /> Save Configuration
          </button>
        </div>
      </div>

      <div className="bg-white border border-paper-200 shadow-sm rounded p-6">
        <h3 className="text-[13px] font-bold text-[#202b5d] mb-4 border-b border-paper-100 pb-2">Authentication & Security</h3>
        
        <div className="space-y-4 max-w-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-slate-700">Enforce Multi-Factor Authentication</p>
              <p className="text-[11px] text-slate-500">Require MFA for all HR Director and Admin roles</p>
            </div>
            <input type="checkbox" className="h-4 w-4 text-[#202b5d] rounded border-slate-300" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-slate-700">Strict IP Whitelisting</p>
              <p className="text-[11px] text-slate-500">Restrict access to official county government IPs only</p>
            </div>
            <input type="checkbox" className="h-4 w-4 text-[#202b5d] rounded border-slate-300" />
          </div>
        </div>
      </div>
    </div>
  );
}
