"use client"

import * as React from "react"
import { Toast } from "radix-ui"

import {
  ToastRoot,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastViewport,
  type ToastRootProps,
} from "./toast"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ToastVariant = "success" | "error" | "warning" | "info"

interface ToastItem {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
  open: boolean
}

interface ToastOptions {
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ToastContext = React.createContext<ToastContextValue | null>(null)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

const MAX_VISIBLE = 3

function ToastProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = React.useState<ToastItem[]>([])

  const toast = React.useCallback((options: ToastOptions) => {
    const id = crypto.randomUUID()
    const item: ToastItem = {
      id,
      title: options.title,
      description: options.description,
      variant: options.variant ?? "info",
      duration: options.duration ?? 5000,
      open: true,
    }
    setQueue((prev) => [...prev, item])
  }, [])

  // Toasts that are currently rendered (open or animating out)
  const visible = queue.slice(0, MAX_VISIBLE)

  const handleOpenChange = React.useCallback((id: string, open: boolean) => {
    if (!open) {
      // Mark closed so Radix can animate out, then remove from queue
      setQueue((prev) =>
        prev.map((t) => (t.id === id ? { ...t, open: false } : t))
      )
      // Remove after animation (~300ms)
      setTimeout(() => {
        setQueue((prev) => prev.filter((t) => t.id !== id))
      }, 350)
    }
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      <Toast.Provider swipeDirection="right">
        {children}
        {visible.map((item) => (
          <ToastRoot
            key={item.id}
            variant={item.variant}
            open={item.open}
            onOpenChange={(open) => handleOpenChange(item.id, open)}
            duration={item.duration}
          >
            <div className="flex flex-col gap-1">
              <ToastTitle>{item.title}</ToastTitle>
              {item.description && (
                <ToastDescription>{item.description}</ToastDescription>
              )}
            </div>
            <ToastClose />
          </ToastRoot>
        ))}
        <ToastViewport />
      </Toast.Provider>
    </ToastContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// useToast hook
// ---------------------------------------------------------------------------

function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext)
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return ctx
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { ToastProvider, ToastContext, useToast }
export type { ToastOptions, ToastVariant }
