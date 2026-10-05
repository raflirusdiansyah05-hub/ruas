import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.985] min-h-[44px]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white hover:bg-primary-hover shadow-card hover:shadow-card-hover border border-primary/20 active:bg-primary-active",
        outline:
          "border border-border bg-base text-text-primary hover:bg-surface-hover hover:border-text-muted/40 shadow-subtle",
        secondary:
          "bg-primary-soft text-primary hover:bg-primary-soft/80 border border-primary/15 font-semibold",
        ghost: "hover:bg-surface text-text-secondary hover:text-text-primary",
        link: "text-primary underline-offset-4 hover:underline p-0 min-h-0 font-medium",
        destructive:
          "bg-feedback-error text-white hover:bg-feedback-error/90 shadow-card border border-feedback-error/20",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-lg px-3.5 text-xs min-h-[36px]",
        lg: "h-12 rounded-xl px-7 text-base min-h-[48px]",
        icon: "h-10 w-10 p-0 rounded-xl",
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
