import { Lock, Construction } from "lucide-react";
import Image from "next/image";

export default function ModuleLocked({ title }: { title: string }) {
  return (
    <div className="h-[calc(100vh-120px)] flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-xl border border-paper-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative">
        {/* Top Accent Bar */}
        <div className="h-1.5 w-full bg-county-blue absolute top-0 left-0" />
        
        <div className="p-8 flex flex-col items-center text-center">
          
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-full bg-paper-50 border-2 border-paper-200 flex items-center justify-center shadow-inner relative z-10">
              <Lock size={32} className="text-county-blue" />
            </div>
            {/* Decorative background circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-county-blue/5 rounded-full z-0 animate-pulse" />
          </div>

          <h2 className="font-serif text-display-m font-bold text-text-primary mb-2">
            {title}
          </h2>
          
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-seal-bronze/10 text-seal-bronze border border-seal-bronze/20">
              <Construction size={12} className="mr-1.5" />
              Provisioning
            </span>
          </div>

          <p className="text-sm text-text-secondary leading-relaxed">
            This module is currently being configured and secured. Access will be granted once the Core HR framework rollout is complete.
          </p>

        </div>
        
        <div className="bg-paper-50 px-6 py-4 border-t border-paper-200 flex items-center justify-center gap-2">
           <Image src="/logo.png" alt="County Logo" width={20} height={20} className="opacity-60" />
           <span className="text-[10px] uppercase tracking-widest font-bold text-text-secondary">Busia County Enterprise System</span>
        </div>
      </div>
    </div>
  );
}
