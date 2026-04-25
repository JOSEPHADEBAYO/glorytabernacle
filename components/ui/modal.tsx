"use client"

import * as React from "react"
import { Dialog } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Variant styles
// ---------------------------------------------------------------------------

const modalContentVariants = cva(
  // Base styles shared across all variants
  [
    "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
    "w-full max-h-[90vh] overflow-y-auto",
    "bg-background text-foreground shadow-lg",
    "rounded-[var(--radius-card,1rem)]",
    "focus:outline-none",
    "data-[state=open]:animate-in data-[state=closed]:animate-out",
    "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
    "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
    "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
    "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
  ],
  {
    variants: {
      variant: {
        confirmation: "max-w-md p-6",
        form: "max-w-lg p-6",
        alert: "max-w-sm p-6 border-2 border-destructive/30",
      },
    },
    defaultVariants: {
      variant: "confirmation",
    },
  }
)

// ---------------------------------------------------------------------------
// Overlay
// ---------------------------------------------------------------------------

function ModalOverlay({ className, ...props }: React.ComponentProps<typeof Dialog.Overlay>) {
  return (
    <Dialog.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  )
}

// ---------------------------------------------------------------------------
// Root — re-export Dialog.Root as Modal
// ---------------------------------------------------------------------------

const Modal = Dialog.Root

// ---------------------------------------------------------------------------
// Trigger
// ---------------------------------------------------------------------------

const ModalTrigger = Dialog.Trigger

// ---------------------------------------------------------------------------
// Close
// ---------------------------------------------------------------------------

const ModalClose = Dialog.Close

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

interface ModalContentProps
  extends React.ComponentProps<typeof Dialog.Content>,
    VariantProps<typeof modalContentVariants> {
  /** id used for aria-labelledby — must match the ModalTitle id */
  titleId?: string
  /** id used for aria-describedby — must match the ModalDescription id */
  descriptionId?: string
  /** Whether to show the default close (×) button in the top-right corner */
  showCloseButton?: boolean
}

function ModalContent({
  className,
  variant,
  titleId = "modal-title",
  descriptionId = "modal-description",
  showCloseButton = true,
  children,
  ...props
}: ModalContentProps) {
  return (
    <Dialog.Portal>
      <ModalOverlay />
      <Dialog.Content
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={cn(modalContentVariants({ variant }), className)}
        {...props}
      >
        {children}
        {showCloseButton && (
          <Dialog.Close
            className={cn(
              "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity",
              "hover:opacity-100",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "disabled:pointer-events-none"
            )}
            aria-label="Close dialog"
          >
            <X className="size-4" />
          </Dialog.Close>
        )}
      </Dialog.Content>
    </Dialog.Portal>
  )
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function ModalHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 pb-4", className)}
      {...props}
    />
  )
}

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------

interface ModalTitleProps extends React.ComponentProps<typeof Dialog.Title> {
  id?: string
}

function ModalTitle({ className, id = "modal-title", ...props }: ModalTitleProps) {
  return (
    <Dialog.Title
      id={id}
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
}

// ---------------------------------------------------------------------------
// Description
// ---------------------------------------------------------------------------

interface ModalDescriptionProps extends React.ComponentProps<typeof Dialog.Description> {
  id?: string
}

function ModalDescription({ className, id = "modal-description", ...props }: ModalDescriptionProps) {
  return (
    <Dialog.Description
      id={id}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

function ModalFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  )
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalClose,
}
