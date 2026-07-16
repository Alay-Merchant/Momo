"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

export type AccountUser = {
  email: string;
  claims: { id: string; title: string; status: string; savedAt: string }[];
};

function savedWhen(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Saved recently"
    : `Saved ${date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      })}`;
}

export default function AccountPanel({
  onUserChange,
  onOpenClaim,
}: {
  onUserChange: (user: AccountUser | null) => void;
  onOpenClaim: (claimId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "register" | "reset">(
    "register",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [user, setUser] = useState<AccountUser | null>(null);
  const [message, setMessage] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const closeModal = () => {
    setOpen(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  };

  const update = useCallback(
    (next: AccountUser | null) => {
      setUser(next);
      onUserChange(next);
    },
    [onUserChange],
  );

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => update(data?.user ?? null))
      .catch(() => undefined);
  }, [update]);

  useEffect(() => {
    if (!open) return;
    const focusTimer = window.setTimeout(() => emailRef.current?.focus(), 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") return closeModal();
      if (event.key !== "Tab" || !dialogRef.current) return;
      const items = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button, input, a[href], select, textarea, [tabindex]:not([tabindex="-1"])')).filter((item) => !item.hasAttribute("disabled"));
      if (!items.length) return;
      const first = items[0]; const last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => { window.clearTimeout(focusTimer); window.removeEventListener("keydown", onKeyDown); };
  }, [open]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    const endpoint =
      mode === "reset" ? "reset" : mode === "login" ? "login" : "register";
    const response = await fetch(`/api/auth/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        mode === "reset"
          ? { email }
          : mode === "register"
            ? { email, password, termsAccepted }
            : { email, password },
      ),
    });
    const data = await response.json();
    if (!response.ok)
      return setMessage(data.error ?? "Something went wrong. Please try again.");
    if (mode === "reset")
      return setMessage(data.message ?? "Check your email for a password-reset link.");
    if (data.needsEmailConfirmation)
      return setMessage(data.message ?? "Check your email to confirm your account, then sign in.");
    update(data.user);
    setOpen(false);
    setPassword("");
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    update(null);
  };

  const withdrawWins = async () => {
    const response = await fetch("/api/social-proof/withdraw", { method: "POST" });
    const data = await response.json();
    setMessage(data.message ?? data.error ?? "Momo could not update this choice.");
  };

  if (user) {
    return (
      <div className="account">
        <span aria-label="Signed in">{"\u25cf"}</span>
        <details>
          <summary>{user.email}</summary>
          <div className="account-menu">
            <b>My saved claims</b>
            {user.claims.length ? (
              user.claims.map((claim) => (
                <article className="saved-claim" key={claim.id}>
                  <b>{claim.title}</b>
                  <small>{claim.status}</small>
                  <small>{savedWhen(claim.savedAt)}</small>
                  <button
                    className="secondary"
                    onClick={() => onOpenClaim(claim.id)}
                  >
                    Continue claim
                  </button>
                </article>
              ))
            ) : (
              <p>No saved claims yet.</p>
            )}
            <button onClick={withdrawWins}>Remove my public Momo wins</button>
            <button onClick={logout}>Sign out</button>
            {message && <small>{message}</small>}
          </div>
        </details>
      </div>
    );
  }

  return (
    <>
      <button className="account-button" onClick={() => setOpen(true)} ref={triggerRef}>
        Sign in or save a claim
      </button>
      {open && (
        <div className="modal-backdrop" role="presentation">
          <section
            aria-labelledby="account-title"
            aria-modal="true"
            className="auth-modal"
            ref={dialogRef}
            role="dialog"
          >
            <button
              aria-label="Close"
              className="close"
              onClick={closeModal}
            >
              {"\u00d7"}
            </button>
            <h2 id="account-title">
              {mode === "register"
                ? "Save your claim"
                : mode === "reset"
                  ? "Reset your password"
                  : "Welcome back"}
            </h2>
            <p>
              {mode === "register"
                ? "Create an account after your free estimate to save your claim and return to it later."
                : mode === "reset"
                  ? "Enter your email and Momo will send a secure password-reset link."
                  : "Sign in to see your saved claims."}
            </p>
            <form onSubmit={submit}>
              <label>
                Email address
                <input
                  autoComplete="email"
                  ref={emailRef}
                  maxLength={254}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  type="email"
                  value={email}
                />
              </label>
              {mode !== "reset" && (
                <label>
                  Password
                  <input
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                    maxLength={128}
                    minLength={12}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    type="password"
                    value={password}
                  />
                </label>
              )}
              {mode === "register" && (
                <>
                  <small>
                    Use at least 12 characters. Your password is never shown to
                    Momo.
                  </small>
                  <label className="terms-check">
                    <input
                      checked={termsAccepted}
                      onChange={(event) => setTermsAccepted(event.target.checked)}
                      required
                      type="checkbox"
                    />
                    I have read and accept the{" "}
                    <Link href="/terms" target="_blank">
                      Momo Terms
                    </Link>
                    .
                  </label>
                </>
              )}
              {message && (
                <p className="form-error" role="alert">
                  {message}
                </p>
              )}
              <button className="primary" type="submit">
                {mode === "register"
                  ? "Create account"
                  : mode === "reset"
                    ? "Send reset link"
                    : "Sign in"}
              </button>
            </form>
            {mode === "login" && (
              <button
                className="switch-auth"
                onClick={() => {
                  setMode("reset");
                  setMessage("");
                }}
              >
                Forgot your password?
              </button>
            )}
            <button
              className="switch-auth"
              onClick={() => {
                setMode(mode === "register" ? "login" : "register");
                setMessage("");
              }}
            >
              {mode === "register"
                ? "Already have an account? Sign in"
                : "New here? Create an account"}
            </button>
          </section>
        </div>
      )}
    </>
  );
}
