"use client";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Check } from "lucide-react";
import { resendVerification, verifyEmailCode } from "@/lib/auth/actions";
import type { ActionState } from "@/lib/auth/action-state";

const LENGTH = 6;
const COOLDOWN_SECONDS = 60;

// Etapa obrigatória depois do cadastro. Um único input real desenhado como seis casas
// mantém colar, autocompletar e leitor de tela funcionando.
export function EmailCodeForm({ email, destination, sendOnArrival }: { email: string; destination: string; sendOnArrival: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const arrived = useRef(false);
  const [code, setCode] = useState("");
  const [focused, setFocused] = useState(false);
  const [misses, setMisses] = useState(0);
  const [resendUntil, setResendUntil] = useState(0);
  const [now, setNow] = useState(0);
  const [resent, resend, resending] = useActionState<ActionState>(resendVerification, {});
  const [result, verify, checking] = useActionState<ActionState, FormData>(async (previous, data) => {
    const outcome = await verifyEmailCode(previous, data);
    if (outcome.error) { setCode(""); setMisses((count) => count + 1); input.current?.focus(); }
    // A animação de sucesso termina antes de seguir. Carga completa: o cliente pré-buscou /painel ainda sem confirmação
    // e guardou o redirecionamento para esta tela; o cabeçalho, no layout raiz, também precisa mudar.
    if (outcome.success) window.setTimeout(() => window.location.replace(destination), window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1400);
    return outcome;
  }, {});

  const startCooldown = () => { const time = Date.now(); setNow(time); setResendUntil(time + COOLDOWN_SECONDS * 1000); };

  // Quem volta depois de o código expirar recebe outro ao chegar; quem acabou de se cadastrar já recebeu o primeiro.
  useEffect(() => {
    if (arrived.current) return;
    arrived.current = true;
    startCooldown();
    if (sendOnArrival) startTransition(() => resend());
  }, [sendOnArrival, resend]);

  useEffect(() => {
    if (!resendUntil) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [resendUntil]);

  const remaining = resendUntil ? Math.max(0, Math.ceil((resendUntil - (now || resendUntil - COOLDOWN_SECONDS * 1000)) / 1000)) : 0;
  const state = result.success ? "done" : checking ? "checking" : misses > 0 && code === "" ? "wrong" : "idle";
  const change = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, LENGTH);
    flushSync(() => setCode(digits));
    if (digits.length === LENGTH) form.current?.requestSubmit();
  };

  return <div className="verification-notice" role="region" aria-label="Confirmação de e-mail" data-state={state}>
    <div className="verification-copy">
      <h1>{result.success ? "E-mail confirmado." : "Confirme seu e-mail."}</h1>
      <p>{result.success ? "Tudo certo com a sua conta. Abrindo…" : <>Último passo: digite o código de 6 dígitos que enviamos para <strong>{email}</strong>. Ele vale por 10 minutos.</>}</p>
    </div>
    <div className="verification-entry">
      <form ref={form} action={verify}>
        <div className="otp">
          <input ref={input} className="otp-input" name="code" value={code} onChange={(event) => change(event.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*" maxLength={LENGTH} aria-label="Código de confirmação" aria-describedby="otp-feedback" disabled={Boolean(result.success)} readOnly={checking} autoFocus/>
          <div className="otp-cells" key={misses} aria-hidden="true">{Array.from({ length: LENGTH }, (_, index) => <span key={index} className={`otp-cell${code[index] ? " filled" : ""}${focused && index === Math.min(code.length, LENGTH - 1) ? " active" : ""}`} style={{ "--i": index } as React.CSSProperties}>{code[index] && <b key={code[index]}>{code[index]}</b>}</span>)}</div>
          {result.success && <span className="otp-done" aria-hidden="true"><Check/></span>}
        </div>
        <button type="submit" className="sr-only" disabled={checking || Boolean(result.success)}>Confirmar código</button>
      </form>
      {!result.success && <div className="verification-foot">
        <p id="otp-feedback" className="otp-feedback">{checking ? <span role="status">Conferindo…</span> : result.error ? <span role="alert">{result.error}</span> : resending ? <span role="status">Enviando o código…</span> : resent.success ? <span role="status">{resent.success}</span> : resent.error ? <span role="alert">{resent.error}</span> : "Não chegou? Olhe a caixa de spam."}</p>
        <form action={resend} onSubmit={startCooldown}><button type="submit" className="otp-resend" disabled={resending || remaining > 0}>{resending ? "Enviando…" : remaining > 0 ? `Reenviar em ${remaining}s` : "Reenviar e-mail"}</button></form>
      </div>}
      {result.success && <p id="otp-feedback" role="status" className="sr-only">E-mail confirmado.</p>}
    </div>
  </div>;
}
