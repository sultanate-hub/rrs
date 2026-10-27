"use client";

import { useState } from "react";
import { useRRS } from "@/lib/store";
import { Field, Icon, Modal } from "./ui";

function localNow() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function HearingModal({ open, onClose, caseId }: { open: boolean; onClose: () => void; caseId: string }) {
  const { addHearing } = useRRS();
  const [court, setCourt] = useState("Magistrate Court, Ikeja");
  const [hearingAt, setHearingAt] = useState(localNow());
  const [purpose, setPurpose] = useState("First mention");
  const [outcome, setOutcome] = useState("Adjourned");
  const [nextAt, setNextAt] = useState("");
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!court.trim() || !purpose.trim()) {
      setError("Court and purpose are required.");
      return;
    }
    addHearing(caseId, {
      court: court.trim(),
      hearingAt: new Date(hearingAt).toISOString(),
      purpose: purpose.trim(),
      outcome: outcome.trim(),
      nextAt: nextAt ? new Date(nextAt).toISOString() : undefined,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      title="Add court hearing"
      subtitle="The case status is set to Court automatically."
      onClose={onClose}
      footer={
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="hearing-form" className="btn btn-primary">
            <Icon name="court" size={16} /> Add hearing
          </button>
        </div>
      }
    >
      <form id="hearing-form" onSubmit={submit} className="form-grid">
        {error ? <div className="banner banner-red field-full">{error}</div> : null}
        <Field label="Court" full>
          <input value={court} onChange={(e) => setCourt(e.target.value)} required />
        </Field>
        <Field label="Hearing date and time">
          <input type="datetime-local" value={hearingAt} onChange={(e) => setHearingAt(e.target.value)} required />
        </Field>
        <Field label="Purpose">
          <input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="First mention, trial, ruling..." required />
        </Field>
        <Field label="Outcome">
          <input value={outcome} onChange={(e) => setOutcome(e.target.value)} placeholder="Adjourned, bail, convicted..." />
        </Field>
        <Field label="Next hearing">
          <input type="datetime-local" value={nextAt} onChange={(e) => setNextAt(e.target.value)} />
        </Field>
      </form>
    </Modal>
  );
}
