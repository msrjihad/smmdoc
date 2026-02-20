import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:h-4 [&_svg:not([class*='size-'])]:w-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-purple-700 to-purple-500 text-white shadow-lg hover:from-purple-800 hover:to-purple-600",
        primary:
          "bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus-visible:ring-blue-500/20",
        secondary:
          "bg-white text-gray-700 border border-gray-300 shadow-xs hover:bg-gray-50",
        destructive:
          "bg-red-600 text-white shadow-lg hover:bg-red-700 focus-visible:ring-red-500/20",
        outline:
          "border border-gray-300 bg-white text-gray-700 shadow-xs hover:bg-gray-50",
        ghost:
          "hover:bg-gray-100 text-gray-700",
        link: "text-blue-600 underline-offset-4 hover:underline hover:text-blue-800",
        gradient: {
          yellow: "bg-gradient-to-r from-yellow-600 to-yellow-400 text-white shadow-lg",
          blue: "bg-gradient-to-r from-blue-600 to-blue-400 text-white shadow-lg",
          green: "bg-gradient-to-r from-green-600 to-green-400 text-white shadow-lg",
          orange: "bg-gradient-to-r from-orange-600 to-orange-400 text-white shadow-lg",
          red: "bg-gradient-to-r from-red-600 to-red-400 text-white shadow-lg",
          purple: "bg-gradient-to-r from-purple-700 to-purple-500 text-white shadow-lg",
        }
      },
      size: {
        default: "px-4 py-2 text-sm",
        sm: "px-3 py-1.5 text-sm gap-1.5",
        lg: "px-6 py-3 text-base",
        icon: "h-9 w-9 p-2",
        xs: "px-2 py-1 text-xs gap-1",
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
  variant,
  gradientColor,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    gradientColor?: 'yellow' | 'blue' | 'green' | 'orange' | 'red' | 'purple'
  }) {
  const Comp = asChild ? Slot : "button"
  const actualVariant = gradientColor ? `gradient.${gradientColor}` as any : variant

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant: actualVariant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }