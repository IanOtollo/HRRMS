"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

// Radix disallows an Item value of "" (it's reserved to mean "no selection"),
// but several call sites use "" to represent a real, selectable option (e.g.
// "All Departments"). This sentinel lets those keep working transparently —
// callers never see it, only "".
const EMPTY_VALUE = "__empty__";

export type SelectOption = { value: string; label: string };

export default function Select({
  value,
  onChange,
  options,
  placeholder = "Select...",
  disabled = false,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const radixValue = value === "" ? EMPTY_VALUE : value;

  return (
    <SelectPrimitive.Root
      value={radixValue}
      onValueChange={(v) => onChange(v === EMPTY_VALUE ? "" : v)}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        className={`w-full h-9 px-3 flex items-center justify-between gap-2 text-[13px] border border-slate-300 rounded-lg bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#202b5d] disabled:opacity-60 disabled:cursor-not-allowed transition-colors ${className}`}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown size={14} className="text-slate-400 shrink-0" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className="z-50 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1"
          style={{ width: "var(--radix-select-trigger-width)" }}
        >
          <SelectPrimitive.Viewport className="max-h-60 overflow-y-auto p-1">
            {options.map((opt) => (
              <SelectPrimitive.Item
                key={opt.value || EMPTY_VALUE}
                value={opt.value === "" ? EMPTY_VALUE : opt.value}
                className="relative flex items-center justify-between px-2.5 h-8 rounded text-[13px] text-slate-700 hover:bg-slate-50 focus:bg-slate-50 outline-none cursor-pointer data-[highlighted]:bg-slate-50 data-[state=checked]:bg-[#202b5d]/5 data-[state=checked]:text-[#202b5d] data-[state=checked]:font-bold"
              >
                <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator>
                  <Check size={13} className="text-[#202b5d]" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
