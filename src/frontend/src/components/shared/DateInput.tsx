import type React from "react";
import { useEffect, useRef } from "react";

interface DateInputProps {
  value: string; // MM/DD/YYYY
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  tabIndex?: number;
}

export default function DateInput({
  value,
  onChange,
  className = "",
  id,
  tabIndex,
}: DateInputProps) {
  const mmRef = useRef<HTMLInputElement>(null);
  const ddRef = useRef<HTMLInputElement>(null);
  const yyyyRef = useRef<HTMLInputElement>(null);

  const parts = value ? value.split("/") : ["", "", ""];
  const mm = parts[0] || "";
  const dd = parts[1] || "";
  const yyyy = parts[2] || "";

  const update = (newMm: string, newDd: string, newYyyy: string) => {
    onChange(`${newMm}/${newDd}/${newYyyy}`);
  };

  const handleMM = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 2);
    update(val, dd, yyyy);
    if (val.length === 2) {
      ddRef.current?.focus();
      ddRef.current?.select();
    }
  };

  const handleDD = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 2);
    update(mm, val, yyyy);
    if (val.length === 2) {
      yyyyRef.current?.focus();
      yyyyRef.current?.select();
    }
  };

  const handleYYYY = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
    update(mm, dd, val);
  };

  const handleMMKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "/" || e.key === "Tab") {
      e.preventDefault();
      ddRef.current?.focus();
      ddRef.current?.select();
    }
    if (e.key === "Backspace" && mm === "") {
      // nothing to do
    }
  };

  const handleDDKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "/" || e.key === "Tab") {
      e.preventDefault();
      yyyyRef.current?.focus();
      yyyyRef.current?.select();
    }
    if (e.key === "Backspace" && dd === "") {
      mmRef.current?.focus();
      mmRef.current?.select();
    }
  };

  const handleYYYYKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && yyyy === "") {
      ddRef.current?.focus();
      ddRef.current?.select();
    }
  };

  const mmInvalid =
    mm.length === 2 && (Number.parseInt(mm) < 1 || Number.parseInt(mm) > 12);
  const ddInvalid =
    dd.length === 2 && (Number.parseInt(dd) < 1 || Number.parseInt(dd) > 31);

  const baseInput =
    "w-full text-center text-sm border rounded px-1 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white transition-colors";

  return (
    <div className={`flex items-center gap-0.5 ${className}`} id={id}>
      <input
        ref={mmRef}
        type="text"
        inputMode="numeric"
        placeholder="MM"
        value={mm}
        onChange={handleMM}
        onKeyDown={handleMMKeyDown}
        onFocus={(e) => e.target.select()}
        tabIndex={tabIndex}
        className={`${baseInput} w-10 ${mmInvalid ? "border-red-400 bg-red-50" : "border-gray-300"}`}
        maxLength={2}
      />
      <span className="text-gray-400 text-sm font-medium">/</span>
      <input
        ref={ddRef}
        type="text"
        inputMode="numeric"
        placeholder="DD"
        value={dd}
        onChange={handleDD}
        onKeyDown={handleDDKeyDown}
        onFocus={(e) => e.target.select()}
        className={`${baseInput} w-10 ${ddInvalid ? "border-red-400 bg-red-50" : "border-gray-300"}`}
        maxLength={2}
      />
      <span className="text-gray-400 text-sm font-medium">/</span>
      <input
        ref={yyyyRef}
        type="text"
        inputMode="numeric"
        placeholder="YYYY"
        value={yyyy}
        onChange={handleYYYY}
        onKeyDown={handleYYYYKeyDown}
        onFocus={(e) => e.target.select()}
        className={`${baseInput} w-16 border-gray-300`}
        maxLength={4}
      />
    </div>
  );
}
