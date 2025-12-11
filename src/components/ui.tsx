import { ComponentProps, ReactNode } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---- Badge Component ----
type BadgeProps = {
  children: ReactNode;
  tone?: "primary" | "muted" | "accent";
  className?: string; // className prop 추가
};

export function Badge({ children, tone = "primary", className }: BadgeProps) {
  const baseStyles =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

  const toneStyles = {
    primary: "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200",
    muted: "border-transparent bg-slate-100 text-slate-800 hover:bg-slate-200",
    accent: "border-transparent bg-red-100 text-red-800 hover:bg-red-200",
  };

  return (
    <span className={cn(baseStyles, toneStyles[tone], className)}>
      {children}
    </span>
  );
}

// ---- Button Component ----
type ButtonProps = ComponentProps<"button"> & {
  variant?: "primary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg"; // size prop 추가
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50";

  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm shadow-blue-200",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    outline: "border border-slate-200 bg-white hover:bg-slate-50 text-slate-900",
  };

  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 py-2 text-sm",
    lg: "h-12 px-8 text-base",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}

// ---- Card Component ----
type CardProps = ComponentProps<"div">;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm",
        className
      )}
      {...props}
    />
  );
}
