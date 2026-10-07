"use client";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";
import { useFieldError } from "./action-form";
export function Field({ label, hint, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const errorId = useFieldError(props.name);
  return <label className="field"><span>{label}</span><input {...props} aria-invalid={Boolean(errorId)} aria-describedby={errorId ?? (hint ? `hint-${props.name}` : undefined)} />{hint && <small id={`hint-${props.name}`}>{hint}</small>}</label>;
}
export function SelectField({ label, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode }) {
  const errorId = useFieldError(props.name);
  return <label className="field"><span>{label}</span><select {...props} aria-invalid={Boolean(errorId)} aria-describedby={errorId}>{children}</select></label>;
}
export function TextAreaField({ label, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  const errorId = useFieldError(props.name);
  return <label className="field"><span>{label}</span><textarea {...props} aria-invalid={Boolean(errorId)} aria-describedby={errorId} /></label>;
}
