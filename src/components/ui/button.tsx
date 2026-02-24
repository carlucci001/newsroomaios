import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-brand-blue-600 text-white hover:bg-brand-blue-700 shadow-sm hover:shadow-md focus-visible:ring-brand-blue-500",
        primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm hover:shadow-md focus-visible:ring-brand-500",
        destructive: "bg-danger-500 text-white hover:bg-danger-600 shadow-sm hover:shadow-md focus-visible:ring-danger-500",
        danger: "bg-danger-500 text-white hover:bg-danger-600 shadow-sm hover:shadow-md focus-visible:ring-danger-500",
        outline: "border-2 border-gray-200 bg-transparent text-gray-900 shadow-sm hover:bg-black/5 hover:border-gray-300 focus-visible:ring-brand-500",
        "outline-dark": "border-2 border-white text-white bg-transparent hover:bg-white/10 hover:border-white focus-visible:ring-white/50",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 shadow-sm focus-visible:ring-gray-400",
        ghost: "hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-400",
        link: "text-brand-600 underline-offset-4 hover:underline hover:text-brand-700",
        success: "bg-success-500 text-white hover:bg-success-600 shadow-sm hover:shadow-md focus-visible:ring-success-500",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 text-xs",
        md: "h-10 px-4 py-2 has-[>svg]:px-3",
        lg: "h-12 rounded-lg px-6 has-[>svg]:px-4 text-base",
        icon: "size-10",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
