import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-gray-100 text-gray-900",
        primary: "border-transparent bg-brand-100 text-brand-700",
        success: "border-transparent bg-success-100 text-success-700",
        warning: "border-transparent bg-warning-100 text-warning-700",
        danger: "border-transparent bg-danger-100 text-danger-700",
        info: "border-transparent bg-info-100 text-info-700",
        outline: "border-gray-300 text-gray-700",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
  pill?: boolean
}

function Badge({
  className,
  variant,
  size,
  dot = false,
  pill = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        badgeVariants({ variant, size }),
        pill && "rounded-full",
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn(
          "inline-block size-1.5 rounded-full",
          variant === "success" && "bg-success-500",
          variant === "warning" && "bg-warning-500",
          variant === "danger" && "bg-danger-500",
          variant === "info" && "bg-info-500",
          variant === "primary" && "bg-brand-500",
          (!variant || variant === "default") && "bg-gray-500",
        )} />
      )}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
