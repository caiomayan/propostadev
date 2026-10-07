"use client";
import { useId, type ReactNode } from "react";

export function FilterSelect({ label, name, defaultValue = "", children }: { label: string; name: string; defaultValue?: string | number; children: ReactNode }) {
  const id = useId();
  return <div className="field"><label htmlFor={id}>{label}</label><select id={id} name={name} defaultValue={defaultValue}>{children}</select></div>;
}
