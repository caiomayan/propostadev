"use client";
import { useId, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { passwordStrength } from "@/lib/auth/password-strength";
import { useFieldError } from "./action-form";

// Campo de senha com botão acessível de mostrar/ocultar. Com `showStrength`, exibe o indicador de força
// coerente com a regra de 12 a 128 caracteres.
export function PasswordField({ label, hint, showStrength = false, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: string; hint?: string; showStrength?: boolean }) {
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState("");
  const errorId = useFieldError(props.name);
  const generatedId = useId();
  const id = props.id ?? generatedId;
  const hintId = hint ? `${id}-hint` : undefined;
  const strengthId = showStrength ? `${id}-strength` : undefined;
  const strength = passwordStrength(value);
  const describedBy = [errorId, hintId, strengthId].filter(Boolean).join(" ") || undefined;
  return <div className="field">
    <label htmlFor={id}>{label}</label>
    <div className="password-control">
      <Input {...props} id={id} type={visible ? "text" : "password"} aria-invalid={Boolean(errorId)} aria-describedby={describedBy} onChange={(event) => { setValue(event.target.value); props.onChange?.(event); }} />
      <button type="button" className="password-toggle" aria-pressed={visible} aria-label="Mostrar senha" aria-controls={id} onClick={() => setVisible((current) => !current)}>{visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</button>
    </div>
    {hint && <small id={hintId}>{hint}</small>}
    {showStrength && <div id={strengthId} className="password-strength" data-level={strength.level}>
      <div className="password-strength-bar" aria-hidden="true">{[1, 2, 3, 4].map((step) => <span key={step} data-on={strength.level >= step} />)}</div>
      <small role="status" aria-live="polite"><strong>{strength.label}.</strong> {strength.hint}</small>
    </div>}
  </div>;
}
