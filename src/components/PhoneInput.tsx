"use client";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

// Normalizes any of +254700000000 / 254700000000 / 0700000000 / 700000000
// down to the 9 digits after the country code, so the field always renders
// and stores the same +254XXXXXXXXX shape.
function toLocalDigits(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("254")) digits = digits.slice(3);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, 9);
}

export default function PhoneInput({ value, onChange, className }: PhoneInputProps) {
  const digits = toLocalDigits(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextDigits = toLocalDigits(e.target.value);
    onChange(nextDigits ? `+254${nextDigits}` : "");
  };

  return (
    <div className={`flex h-[32px] ${className ?? ""}`}>
      <span className="flex items-center px-2.5 text-[13px] font-medium text-slate-500 bg-slate-50 border border-r-0 border-paper-200 rounded-l shrink-0">
        +254
      </span>
      <input
        type="tel"
        inputMode="numeric"
        maxLength={9}
        value={digits}
        onChange={handleChange}
        placeholder="700000000"
        className="w-full min-w-0 h-[32px] px-2.5 text-[13px] border border-paper-200 rounded-r focus:ring-2 focus:ring-[#202b5d] outline-none bg-white"
      />
    </div>
  );
}
