export function IconMenu({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      {open ? (
        <path d="M6 6l12 12M18 6L6 18" />
      ) : (
        <path d="M4 7h16M4 12h16M4 17h16" />
      )}
    </svg>
  );
}

export function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M7.2 3.8h2.6l1.2 3.2-2 1.2a11 11 0 0 0 5.6 5.6l1.2-2 3.2 1.2v2.6c0 .7-.6 1.2-1.3 1.2C10 18.8 5.2 14 5.2 6.1c0-.7.5-1.3 1.2-1.3H7.2z" />
    </svg>
  );
}

export function IconMail() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="13" rx="1.2" />
      <path d="M4 7l8 6 8-6" />
    </svg>
  );
}

export function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <circle cx="12" cy="12" r="3.6" />
      <circle cx="17.2" cy="6.8" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconCheck({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M3.2 8.2 6.4 11.4 12.8 4.6" />
    </svg>
  );
}

export function IconChevron({ open = false }: { open?: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <path d="M3.5 6l4.5 4.5L12.5 6" />
    </svg>
  );
}

export function IconPlay({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="currentColor" aria-hidden="true">
      <path d="M4.5 2.8v10.4L13.2 8 4.5 2.8z" />
    </svg>
  );
}

export function IconPause({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="currentColor" aria-hidden="true">
      <path d="M4 3h3v10H4V3zm5 0h3v10H9V3z" />
    </svg>
  );
}

export function IconWhatsApp({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M19.05 4.91A9.9 9.9 0 0 0 12.04 2C6.58 2 2.14 6.43 2.14 11.88c0 1.74.46 3.44 1.32 4.94L2 22l5.32-1.4a9.9 9.9 0 0 0 4.72 1.2h.01c5.46 0 9.9-4.43 9.9-9.88 0-2.64-1.03-5.12-2.9-6.99zM12.05 20.13h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.16.83.84-3.08-.2-.32a8.18 8.18 0 0 1-1.26-4.37c0-4.52 3.68-8.2 8.22-8.2 2.19 0 4.25.85 5.8 2.4a8.15 8.15 0 0 1 2.4 5.8c0 4.53-3.69 8.21-8.15 8.21zm4.5-6.15c-.25-.12-1.46-.72-1.68-.8-.23-.08-.4-.12-.56.12-.17.25-.64.8-.79.97-.14.16-.3.18-.55.06-.25-.12-1.06-.39-2.02-1.24-.75-.67-1.25-1.49-1.4-1.74-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.42h-.48c-.17 0-.43.06-.66.31-.23.25-.86.84-.86 2.05 0 1.21.88 2.38 1 2.54.12.17 1.73 2.64 4.2 3.7.59.25 1.04.4 1.4.52.59.19 1.13.16 1.56.1.48-.07 1.46-.6 1.67-1.17.2-.58.2-1.07.14-1.17-.06-.1-.23-.16-.48-.29z" />
    </svg>
  );
}
