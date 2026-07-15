"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (password !== confirm) return setMessage("The two passwords do not match.");
    const response = await fetch("/api/auth/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error ?? "Momo could not update your password.");
    setDone(true);
  };
  return <main className="reset-page"><header className="topbar"><Link className="brand" href="/"><span role="img" aria-label="Momo the panda">🐼</span><span>Momo</span></Link></header><section className="reset-card"><span className="reset-panda" role="img" aria-label="Helpful panda">🐼</span><h1>{done ? "Your password is updated" : "Choose a new password"}</h1>{done ? <><p>You can now sign in to Momo with your new password.</p><Link className="primary reset-link" href="/">Back to Momo</Link></> : <><p>Choose a long password that you do not use elsewhere.</p><form onSubmit={submit}><label>New password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={12} maxLength={128} required autoComplete="new-password"/></label><label>Repeat new password<input type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} minLength={12} maxLength={128} required autoComplete="new-password"/></label>{message && <p className="form-error" role="alert">{message}</p>}<button className="primary" type="submit">Update password</button></form></>}</section></main>;
}
