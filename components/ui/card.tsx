import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "flex flex-col overflow-hidden rounded-[var(--radius-card,1rem)] bg-card text-card-foreground transition-shadow",
  {
    variants: {
      variant: {
        default: "border border-border shadow-sm",
        elevated: "shadow-[var(--shadow-card)]",
        outlined: "border-2 border-border shadow-none",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Card({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardVariants>) {
  return (
    <div
      data-slot="card"
      data-variant={variant}
      className={cn(cardVariants({ variant, className }))}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col gap-1.5 p-6", className)}
      {...props}
    />
  )
}

function CardImage({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-image"
      className={cn("relative w-full overflow-hidden", className)}
      {...props}
    />
  )
}

function CardBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-body"
      className={cn("flex flex-col gap-2 p-6 pt-0", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  )
}

export { Card, cardVariants, CardHeader, CardImage, CardBody, CardFooter }
