import type { ButtonHTMLAttributes } from "react";

// Route-B port of videosdk-design buttons/Button + buttons/IconButton.
// Prop and variant names match the source components.
const BASE =
  "inline-flex select-none items-center justify-center whitespace-nowrap font-medium " +
  "transition duration-fast ease-standard active:scale-[0.98] cursor-pointer " +
  "disabled:pointer-events-none disabled:opacity-45";

const VARIANTS = {
  primary: "bg-accent text-accent-fg shadow-hairline-filled hover:bg-accent-hover",
  secondary: "bg-raised text-ink shadow-hairline hover:bg-inset",
  outlined: "bg-transparent text-ink shadow-hairline hover:bg-inset",
  ghost: "bg-transparent text-ink-secondary hover:bg-inset hover:text-ink",
  destructive: "bg-danger-solid text-white hover:bg-danger-hover",
};

type Variant = keyof typeof VARIANTS;
type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, string> = {
  sm: "h-6 gap-1 rounded-md px-2 text-sm",
  md: "h-8 gap-1.5 rounded-md px-3 text-base",
  lg: "h-10 gap-2 rounded-lg px-4 text-base",
};
const ICON_SIZES: Record<Size, string> = {
  sm: "size-6 rounded-md",
  md: "size-8 rounded-md",
  lg: "size-10 rounded-lg",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size };

export function Button({ variant = "primary", size = "md", className = "", ...rest }: Props) {
  return <button className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`} {...rest} />;
}

export function IconButton({
  variant = "secondary",
  size = "md",
  className = "",
  ...rest
}: Props & { "aria-label": string }) {
  return <button className={`${BASE} ${VARIANTS[variant]} ${ICON_SIZES[size]} ${className}`} {...rest} />;
}
