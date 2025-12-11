import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
};

export const Button = ({ variant = "primary", className, ...props }: ButtonProps) => {
  let variantClass = "btn-primary";
  if (variant === "ghost") variantClass = "btn-ghost";
  if (variant === "outline") variantClass = "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm";

  return (
    <button
      {...props}
      className={`btn ${variantClass} ${className || ""}`}
    />
  );
};

type BadgeProps = {
  children: React.ReactNode;
  tone?: "primary" | "muted" | "success" | "warning";
};

export const Badge = ({ children, tone = "primary" }: BadgeProps) => {
  let styleClass = "bg-blue-50 text-blue-700 ring-blue-700/10";
  if (tone === "muted") styleClass = "bg-slate-100 text-slate-600 ring-slate-500/10";
  if (tone === "success") styleClass = "bg-green-50 text-green-700 ring-green-600/10";
  if (tone === "warning") styleClass = "bg-yellow-50 text-yellow-800 ring-yellow-600/20";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${styleClass}`}
    >
      {children}
    </span>
  );
};

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export const Card = ({ children, className }: CardProps) => (
  <div className={`card ${className || ""}`}>{children}</div>
);
