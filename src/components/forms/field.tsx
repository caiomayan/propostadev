"use client";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";
import { useId } from "react";
import { Input } from "@/components/ui/input";
import { useFieldError } from "./action-form";
export function Field({ label, hint, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const errorId = useFieldError(props.name);
  const generatedId = useId();
  const id = props.id ?? generatedId;
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;
  return <div className="field"><label htmlFor={id}>{label}</label><Input {...props} id={id} aria-invalid={Boolean(errorId)} aria-describedby={describedBy} />{hint && <small id={hintId}>{hint}</small>}</div>;
}
export function SelectField({ label, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode }) {
  const errorId = useFieldError(props.name);
  const generatedId = useId();
  const id = props.id ?? generatedId;
  return <div className="field"><label htmlFor={id}>{label}</label><select {...props} id={id} aria-invalid={Boolean(errorId)} aria-describedby={errorId}>{children}</select></div>;
}
export function TextAreaField({ label, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  const errorId = useFieldError(props.name);
  const generatedId = useId();
  const id = props.id ?? generatedId;
  return <div className="field"><label htmlFor={id}>{label}</label><textarea {...props} id={id} aria-invalid={Boolean(errorId)} aria-describedby={errorId} /></div>;
}
