"use client"

import * as React from "react"
import { Toast } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Variant styles
// ---------------------------------------------------------------------------

const toastVariants = cva(
  [
    "group pointer-events-auto relative flex w-full items-center justify-between gap-3",
    "overflow-hidden rounded-md border p-4 pr-8 shadow-lg",
    "transition-all",
    "data-[swipe=cancel]:translate-x-0",
    "data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]",
    "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]",
    "data-[swipe=move]:transition-none",
    "data-[state=open]:animate-in data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
    "data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full",
  ],
  {
    variants: {
      variant: {
        success:
          "border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100",
        error:
          "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100",
        warning:
          "border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100",
        info:
          "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
)

// ---------------------------------------------------------------------------
// ToastViewport
// ---------------------------------------------------------------------------

function ToastViewport({ className, ...props }: React.ComponentProps<typeof Toast.Viewport>) {
  return (
    <Toast.Viewport
      className={cn(
        "fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:max-w-[420px]",
        className
      )}
      {...props}
    />
  )
}

// ---------------------------------------------------------------------------
// ToastRoot
// ---------------------------------------------------------------------------

interface ToastRootProps
  extends React.ComponentProps<typeof Toast.Root>,
    VariantProps<typeof toastVariants> {}

function ToastRoot({ className, variant, ...props }: ToastRootProps) {
  return (
    <Toast.Root
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
}

// ---------------------------------------------------------------------------
// ToastTitle
// ---------------------------------------------------------------------------

function ToastTitle({ className, ...props }: React.ComponentProps<typeof Toast.Title>) {
  return (
    <Toast.Title
      className={cn("text-sm font-semibold leading-tight", className)}
      {...props}
    />
  )
}

// ---------------------------------------------------------------------------
// ToastDescription
// ---------------------------------------------------------------------------

function ToastDescription({ className, ...props }: React.ComponentProps<typeof Toast.Description>) {
  return (
    <Toast.Description
      className={cn("text-sm opacity-90", className)}
      {...props}
    />
  )
}

// ---------------------------------------------------------------------------
// ToastClose
// ---------------------------------------------------------------------------

function ToastClose({ className, ...props }: React.ComponentProps<typeof Toast.Close>) {
  return (
    <Toast.Close
      className={cn(
        "absolute right-2 top-2 rounded-sm p-0.5 opacity-60 transition-opacity",
        "hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring",
        "group-data-[variant=success]:text-green-900 dark:group-data-[variant=success]:text-green-100",
        className
      )}
      aria-label="Close notification"
      {...props}
    >
      <X className="size-4" />
    </Toast.Close>
  )
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export {
  ToastRoot,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastViewport,
  toastVariants,
}
export type { ToastRootProps }
