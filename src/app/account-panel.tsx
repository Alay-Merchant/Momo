"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

export type AccountUser = { email: string; claims: { id: string; title: string; status: string; savedAt: string }[] };

export default function AccountPanel({ onUserChange }: { onUserChange: (user: AccountUser | null) => void }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<AccountUser | null>(null);
  const [message, setMessage] = useState("");

  const update = useCallback((next: AccountUser | null) => { setUser(next); onUserChange(next); }, [onUserChange]);
  useEffect(() => { fetch("/api/auth/me").then((response) => response.ok ? response.json() : null).then((data) => update(data?.user ?? null)).catch(() => undefined); }, [update]);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setMessage("");
    const response = await fetch(`/api/auth/${mode === "login" ? "login" : "register"}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error ?? "Something went wrong. Please try again.");
    update(data.user); setOpen(false); setPassword("");
  };
  const logout = async () => { await fetch("/api/auth/logout", { method: "POST" }); update(null); };
  if (user) return <div className="account"><span aria-label="Signed in">●</span><details><summary>{user.email}</summary><div className="account-menu"><b>My saved claims</b>{user.claims.length ? user.claims.map((claim) => <p key={claim.id}>{claim.title}<small>{claim.status}</small></p>) : <p>No saved claims yet.</p>}<button onClick={logout}>Sign out</button></div></details></div>;
  return <><button className="account-button" onClick={() => setOpen(true)}>Sign in or save a claim</button>{open && <div className="modal-backdrop" role="presentation"><section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="account-title"><button className="close" onClick={() => setOpen(false)} aria-label="Close">×</button><h2 id="account-title">{mode === "register" ? "Save your claim" : "Welcome back"}</h2><p>{mode === "register" ? "Create an account after your free estimate to save your claim and return to it later." : "Sign in to see your saved claims."}</p><form onSubmit={submit}><label>Email address<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254}/></label><label>Password<input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={12} maxLength={128}/></label>{mode === "register" && <small>Use at least 12 characters. Your password is never shown to Momo.</small>}{message && <p className="form-error" role="alert">{message}</p>}<button className="primary" type="submit">{mode === "register" ? "Create account" : "Sign in"}</button></form><button className="switch-auth" onClick={() => { setMode(mode === "login" ? "register" : "login"); setMessage(""); }}>{mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}</button></section></div>}</>;
}
