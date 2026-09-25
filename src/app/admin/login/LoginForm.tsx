"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/admin/login/actions";
import { adminButtonClass, adminFieldClass, adminLinkClass } from "@/components/admin/AdminFrame";

const initialState: LoginState = {};

export function LoginForm({ disabled }: { disabled: boolean }) {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {state.formError ? (
        <p className="text-sm text-verde-oscuro" role="alert">
          {state.formError}
        </p>
      ) : null}

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

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm text-tinta">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={disabled || pending}
          aria-invalid={state.fieldErrors?.password ? true : undefined}
          aria-describedby={state.fieldErrors?.password ? "password-error" : undefined}
          className={adminFieldClass}
        />
        {state.fieldErrors?.password ? (
          <p id="password-error" className="mt-1 text-sm text-verde-oscuro" role="alert">
            {state.fieldErrors.password}
          </p>
        ) : null}
      </div>

      <button type="submit" className={adminButtonClass} disabled={disabled || pending}>
        {pending ? "Ingresando…" : "Ingresar"}
      </button>

      <Link href="/admin/recuperar" className={`${adminLinkClass} text-center`}>
        ¿Olvidaste tu contraseña?
      </Link>
    </form>
  );
}
