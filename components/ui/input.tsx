import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Base input styles shared across text / email / password / textarea / select
// ---------------------------------------------------------------------------
const inputVariants = cva(
  [
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground",
    "placeholder:text-muted-foreground",
    "transition-colors outline-none",
    "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
  ].join(" "),
  {
    variants: {
      inputSize: {
        default: "h-10",
        sm: "h-8 text-xs",
        lg: "h-12 text-base",
      },
    },
    defaultVariants: {
      inputSize: "default",
    },
  }
)

// ---------------------------------------------------------------------------
// Shared option type for <select>
// ---------------------------------------------------------------------------
export interface SelectOption {
  value: string
  label: string
}

// ---------------------------------------------------------------------------
// Core Input props
// ---------------------------------------------------------------------------
type BaseInputProps = {
  /** Unique id — required for label association */
  id: string
  /** Accessible label text (used by FormField; also accepted standalone) */
  label?: string
  /** Error message — when set, adds aria-invalid + aria-describedby */
  error?: string
  /** Additional class names */
  className?: string
  inputSize?: VariantProps<typeof inputVariants>["inputSize"]
}

type TextLikeInputProps = BaseInputProps &
  Omit<React.ComponentProps<"input">, "id" | "type"> & {
    type?: "text" | "email" | "password"
  }

type TextareaInputProps = BaseInputProps &
  Omit<React.ComponentProps<"textarea">, "id"> & {
    type: "textarea"
  }

type SelectInputProps = BaseInputProps &
  Omit<React.ComponentProps<"select">, "id"> & {
    type: "select"
    options: SelectOption[]
  }

type CheckboxInputProps = BaseInputProps &
  Omit<React.ComponentProps<"input">, "id" | "type"> & {
    type: "checkbox"
  }

type RadioInputProps = BaseInputProps &
  Omit<React.ComponentProps<"input">, "id" | "type"> & {
    type: "radio"
  }

export type InputProps =
  | TextLikeInputProps
  | TextareaInputProps
  | SelectInputProps
  | CheckboxInputProps
  | RadioInputProps

// ---------------------------------------------------------------------------
// Input component
// ---------------------------------------------------------------------------
function Input(props: InputProps) {
  const { id, error, className, inputSize } = props
  const errorId = error ? `${id}-error` : undefined

  const ariaProps = error
    ? { "aria-invalid": true as const, "aria-describedby": errorId }
    : {}

  if (props.type === "textarea") {
    const { type: _type, inputSize: _is, label: _l, error: _e, ...textareaRest } = props
    return (
      <textarea
        id={id}
        className={cn(
          inputVariants({ inputSize }),
          "min-h-[6rem] resize-y",
          className
        )}
        {...ariaProps}
        {...(textareaRest as React.ComponentProps<"textarea">)}
      />
    )
  }

  if (props.type === "select") {
    const { type: _type, options, inputSize: _is, label: _l, error: _e, ...selectRest } = props
    return (
      <select
        id={id}
        className={cn(inputVariants({ inputSize }), "cursor-pointer", className)}
        {...ariaProps}
        {...(selectRest as React.ComponentProps<"select">)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    )
  }

  if (props.type === "checkbox" || props.type === "radio") {
    const { type, inputSize: _is, label: _l, error: _e, ...toggleRest } = props
    return (
      <input
        id={id}
        type={type}
        className={cn(
          "h-4 w-4 cursor-pointer rounded-sm border border-input accent-[var(--church-green,#1B6D24)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "aria-invalid:border-destructive",
          className
        )}
        {...ariaProps}
        {...(toggleRest as React.ComponentProps<"input">)}
      />
    )
  }

  // text | email | password (default)
  const { type = "text", inputSize: _is, label: _l, error: _e, ...inputRest } = props as TextLikeInputProps
  return (
    <input
      id={id}
      type={type}
      className={cn(inputVariants({ inputSize }), className)}
      {...ariaProps}
      {...(inputRest as React.ComponentProps<"input">)}
    />
  )
}

// ---------------------------------------------------------------------------
// FormField — label + input + error message wrapper
// ---------------------------------------------------------------------------
export type FormFieldProps = InputProps & {
  /** Override label text (falls back to InputProps.label) */
  label: string
  /** Additional class names for the wrapper div */
  wrapperClassName?: string
}

function FormField({ wrapperClassName, ...inputProps }: FormFieldProps) {
  const id = (inputProps as BaseInputProps).id
  const label = (inputProps as BaseInputProps).label ?? ''
  const error = (inputProps as BaseInputProps).error
  const errorId = error ? `${id}-error` : undefined

  const isToggle =
    (inputProps as { type?: string }).type === "checkbox" || (inputProps as { type?: string }).type === "radio"

  return (
    <div
      className={cn("flex flex-col gap-1.5", isToggle && "flex-row items-center gap-2", wrapperClassName)}
    >
      {!isToggle && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-foreground"
        >
          {label}
        </label>
      )}

      <Input {...inputProps} />

      {isToggle && (
        <label
          htmlFor={id}
          className="cursor-pointer text-sm font-medium text-foreground"
        >
          {label}
        </label>
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-xs text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  )
}

export { Input, FormField, inputVariants }
