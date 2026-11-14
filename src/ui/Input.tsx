import type { InputHTMLAttributes } from "react";

// Route-B port of videosdk-design forms/Input: 32px, hairline border, lavender focus ring.
export function Input({ className = "", ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={
        "h-8 w-full rounded-lg bg-card px-2.5 text-base text-ink shadow-hairline outline-none " +
        "placeholder:text-ink-tertiary transition duration-fast ease-standard " +
        `focus:shadow-[inset_0_0_0_1.5px_var(--focus-ring)] ${className}`
      }
      {...rest}
    />
  );
}
