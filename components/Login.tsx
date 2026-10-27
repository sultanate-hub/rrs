"use client";

import { useState } from "react";
import { useRRS } from "@/lib/store";
import { Icon } from "./ui";

export function Login() {
  const { login } = useRRS();
  const [forceNumber, setForceNumber] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!forceNumber.trim() || !password) {
      setError("Enter your force number and password.");
      return;
    }
    setBusy(true);
    const ok = login(forceNumber, password);
    setBusy(false);
    if (!ok) setError("Invalid force number or password. Contact ICT if your account is locked.");
  };

  return (
    <main className="login-page">
      <section className="login-brand">
        <div className="brand-mark">
          <span className="brand-crest">
            <Icon name="shield" size={28} />
          </span>
          <div>
            <div className="brand-kicker">Rapid Response Squad</div>
            <h1>Anti-Social Vices Management System</h1>
          </div>
        </div>
        <p className="login-lede">
          One secure record for cases, suspects, evidence, court follow-up and command reporting.
        </p>
        <div className="login-points">
          <div>
            <Icon name="lock" size={18} />
            <span>Individual accounts, role-based access and a full audit trail</span>
          </div>
          <div>
            <Icon name="camera" size={18} />
            <span>Suspect photograph, NIN and fingerprint record</span>
          </div>
          <div>
            <Icon name="shield" size={18} />
            <span>Evidence hash and chain of custody</span>
          </div>
          <div>
            <Icon name="court" size={18} />
            <span>Court diary and command dashboard</span>
          </div>
        </div>
        <div className="login-disclaimer">
          <strong>Demo environment.</strong> All names, cases, phone numbers and evidence are synthetic. No real police data is stored here.
        </div>
      </section>

      <section className="login-panel">
        <div className="login-panel-head">
          <div>
            <h2>Authorised sign-in</h2>
            <p>Use the force number and password issued to you by ICT.</p>
          </div>
          <span className="chip chip-green">
            <span className="dot" /> Demo online
          </span>
        </div>

        <form className="login-form-card" onSubmit={submit}>
          <label className="login-field">
            <span>Force number</span>
            <input
              name="forceNumber"
              inputMode="numeric"
              autoComplete="username"
              value={forceNumber}
              onChange={(e) => setForceNumber(e.target.value)}
              placeholder="e.g. 51234"
              autoFocus
            />
          </label>

          <label className="login-field">
            <span>Password</span>
            <div className="password-wrap">
              <input
                name="password"
                type={show ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
              <button type="button" className="password-toggle" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"}>
                <Icon name="eye" size={17} />
              </button>
            </div>
          </label>

          {error ? (
            <div className="banner banner-red" role="alert">
              <Icon name="alert" size={16} />
              <span>{error}</span>
            </div>
          ) : null}

          <button type="submit" className="btn btn-primary btn-lg login-submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"} <Icon name="chevron" size={16} />
          </button>
        </form>

        <div className="login-security">
          <Icon name="lock" size={17} />
          <span>
            Production enforces individual accounts, hashed passwords, MFA for supervisors and commanders, and logs every sign-in. Shared accounts are not permitted.
          </span>
        </div>

        <p className="login-footnote">
          Demo credentials are provided separately to the demo operator. Do not enter real police data in this build.
        </p>
      </section>
    </main>
  );
}
