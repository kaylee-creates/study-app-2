import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-small font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-theme-accent text-white hover:bg-theme-accent-dark shadow-sm",
        secondary:
          "bg-theme-surface text-theme-text border border-theme-accent/20 hover:bg-theme-accent/10",
        outline:
          "border border-theme-accent/20 bg-transparent hover:bg-theme-surface",
        ghost: "hover:bg-theme-surface",
        destructive: "bg-red-500 text-white hover:opacity-90",
      },
      size: {
        sm: "h-8 px-3 text-caption",
        default: "h-10 px-4",
        lg: "h-11 px-6 text-body",
        icon: "h-10 w-10",
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
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
