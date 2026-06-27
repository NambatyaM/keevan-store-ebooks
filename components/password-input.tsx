"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type PasswordInputProps = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  autoComplete?: string;
  minLength?: number;
  required?: boolean;
  placeholder?: string;
  id?: string;
};

export function PasswordInput({
  value,
  onChange,
  autoComplete,
  minLength,
  required,
  placeholder,
  id
}: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        className="focus-ring w-full rounded-md border border-neutral-300 px-4 py-3 pr-11"
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        minLength={minLength}
        required={required}
        placeholder={placeholder}
        id={id}
      />
      <button
        type="button"
        onClick={() => setShow((p) => !p)}
        className="focus-ring absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-800"
        aria-label={show ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {show ? <EyeOff size={19} aria-hidden /> : <Eye size={19} aria-hidden />}
      </button>
    </div>
  );
}
