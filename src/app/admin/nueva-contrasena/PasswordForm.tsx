"use client";

import { useActionState } from "react";
import {
  updatePasswordAction,
  type PasswordState,
} from "@/app/admin/nueva-contrasena/actions";
import { adminButtonClass, adminFieldClass } from "@/components/admin/AdminFrame";

const initialState: PasswordState = {};

export function PasswordForm() {
  const [state, action, pending] = useActionState(updatePasswordAction, initialState);

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {state.formError ? (
        <p className="text-sm text-verde-oscuro" role="alert">
          {state.formError}
        </p>
      ) : null}
      <p className="text-sm leading-relaxed text-muted">
        Elegí la contraseña de esta cuenta. Si la invitación ya te autorizó como administrador,
        vas a entrar al panel.
      </p>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm text-tinta">
          Nueva contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          disabled={pending}
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

      <div>
        <label htmlFor="confirm" className="mb-1.5 block text-sm text-tinta">
          Repetir contraseña
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          disabled={pending}
          aria-invalid={state.fieldErrors?.confirm ? true : undefined}
          aria-describedby={state.fieldErrors?.confirm ? "confirm-error" : undefined}
          className={adminFieldClass}
        />
        {state.fieldErrors?.confirm ? (
          <p id="confirm-error" className="mt-1 text-sm text-verde-oscuro" role="alert">
            {state.fieldErrors.confirm}
          </p>
        ) : null}
      </div>

      <button type="submit" className={adminButtonClass} disabled={pending}>
        {pending ? "Guardando…" : "Guardar contraseña"}
      </button>
    </form>
  );
}
