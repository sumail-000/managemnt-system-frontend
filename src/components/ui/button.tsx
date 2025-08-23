import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        gradient: "btn-gradient",
        hero: "btn-hero",
        success: "bg-success text-success-foreground hover:bg-success/90",
        warning: "bg-warning text-warning-foreground hover:bg-warning/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-lg px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /**
   * Explicitly allow this button to be enabled when the user is suspended.
   * Useful for support and logout related controls.
   */
  allowWhenSuspended?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, allowWhenSuspended = false, onClick, ...props }, ref) => {
    const { user } = useAuth()
    const isSuspended = Boolean((user as any)?.is_suspended)

    // Heuristics to allow support actions while suspended without changing each caller
    const ariaLabel = (props as any)?.["aria-label"] as string | undefined
    const routePath = (typeof window !== 'undefined' && window.location && window.location.pathname) ? window.location.pathname : ''
    const looksLikeSupport = Boolean(
      (ariaLabel && ariaLabel.toLowerCase().includes('support')) ||
      routePath.startsWith('/support') ||
      (props as any)?.["data-allow-when-suspended"]
    )

    const shouldForceDisable = isSuspended && !allowWhenSuspended && !looksLikeSupport

    const Comp: any = asChild ? Slot : "button"

    const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      if (shouldForceDisable) {
        e.preventDefault()
        e.stopPropagation()
        return
      }
      onClick?.(e)
    }

    // Add inert styling even for non-button (asChild) scenarios
    const inertClasses = shouldForceDisable ? "pointer-events-none opacity-50 cursor-not-allowed" : ""

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }), inertClasses)}
        ref={ref}
        aria-disabled={shouldForceDisable || props.disabled}
        disabled={(asChild ? undefined : (shouldForceDisable || props.disabled)) as any}
        onClick={handleClick}
        title={shouldForceDisable ? 'Action disabled while account is suspended' : props.title}
        data-disabled={shouldForceDisable || props.disabled ? true : undefined}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
