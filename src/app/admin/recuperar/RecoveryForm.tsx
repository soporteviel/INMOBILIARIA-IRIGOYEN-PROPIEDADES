"use client";

import Link from "next/link";
import { useActionState } from "react";
import { recoveryAction, type RecoveryState } from "@/app/admin/recuperar/actions";
import { adminButtonClass, adminFieldClass, adminLinkClass } from "@/components/admin/AdminFrame";

const initialState: RecoveryState = {};

export function RecoveryForm({ disabled }: { disabled: boolean }) {
  const [state, action, pending] = useActionState(recoveryAction, initialState);

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {state.formError ? (
        <p className="text-sm text-verde-oscuro" role="alert">
          {state.formError}
        </p>
      ) : null}
      {state.message ? (
        <p className="text-sm leading-relaxed text-tinta" role="status">
          {state.message}
        </p>
      ) : (
        <p className="text-sm leading-relaxed text-muted">
          Ingresá el email de la cuenta. Te vamos a indicar el siguiente paso para elegir una
          contraseña.
        </p>
      )}

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm text-tinta">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          disabled={disabled || pending}
          aria-invalid={state.fieldErrors?.email ? true : undefined}
          aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
          className={adminFieldClass}
        />
        {state.fieldErrors?.email ? (
          <p id="email-error" className="mt-1 text-sm text-verde-oscuro" role="alert">
            {state.fieldErrors.email}
          </p>
        ) : null}
      </div>

      <button type="submit" className={adminButtonClass} disabled={disabled || pending}>
        {pending ? "Enviando…" : "Pedir enlace"}
      </button>
      <Link href="/admin/login" className={`${adminLinkClass} text-center`}>
        Volver al ingreso
      </Link>
    </form>
  );
}
