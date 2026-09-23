import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Google Gill Design System Button Component
 * - 4px/8px incremental grid sizing
 * - Strict 2x horizontal-to-vertical padding ratio
 * - High-contrast WCAG AA accessible color hierarchy
 * - Offset focus-visible rings for keyboard navigation
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-emerald-700 text-white hover:bg-emerald-800 active:bg-emerald-900 shadow-xs active:scale-[0.98]",
        destructive:
          "bg-rose-700 text-white hover:bg-rose-800 active:bg-rose-900 shadow-xs active:scale-[0.98]",
        outline:
          "border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs",
        secondary:
          "bg-slate-100 text-slate-900 hover:bg-slate-200 active:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700",
        ghost:
          "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300",
        link:
          "text-emerald-700 dark:text-emerald-400 underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        // Gill 4px/8px standard rhythm
        default: "h-10 px-5 py-2.5 rounded-lg text-sm",
        sm: "h-8 px-4 py-2 rounded-md text-xs",
        lg: "h-12 px-6 py-3 rounded-xl text-base",
        icon: "h-10 w-10 p-2.5 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
