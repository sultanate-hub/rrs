"use client";

import { useState } from "react";
import { useRRS } from "@/lib/store";
import type { Priority } from "@/lib/types";
import { Field, Icon, Modal } from "./ui";

function localNow() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function NewCaseModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (caseId: string) => void;
}) {
  const { data, currentUser, addCase } = useRRS();
  const [offenceId, setOffenceId] = useState(data.offences[0]?.id ?? "");
  const [reportedAt, setReportedAt] = useState(localNow());
  const [location, setLocation] = useState("");
  const [complainantName, setComplainantName] = useState("");
  const [complainantPhone, setComplainantPhone] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [sensitive, setSensitive] = useState(false);
  const [assignedOfficerId, setAssignedOfficerId] = useState(currentUser?.id ?? data.officers[0]?.id ?? "");
  const [narrative, setNarrative] = useState("");
  const [error, setError] = useState("");

  const officers = currentUser?.role === "IPO" ? [currentUser] : data.officers.filter((o) => o.active && o.role !== "ADMIN" && o.role !== "AUDITOR");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offenceId || !location.trim() || !narrative.trim() || !complainantName.trim()) {
      setError("Offence, location, complainant and narrative are required.");
      return;
    }
    const record = addCase({
      offenceId,
      reportedAt: new Date(reportedAt).toISOString(),
      location: location.trim(),
      narrative: narrative.trim(),
      priority,
      sensitive,
      assignedOfficerId,
      complainantName: complainantName.trim(),
      complainantPhone: complainantPhone.trim(),
    });
    onClose();
    onCreated(record.id);
  };

  return (
    <Modal
      open={open}
      title="Register new case"
      subtitle="A case number is generated automatically."
      onClose={onClose}
      wide
      footer={
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="new-case-form" className="btn btn-primary">
            <Icon name="plus" size={16} /> Register case
          </button>
        </div>
      }
    >
      <form id="new-case-form" onSubmit={submit} className="form-grid">
        {error ? <div className="banner banner-red field-full">{error}</div> : null}
        <Field label="Offence type">
          <select value={offenceId} onChange={(e) => setOffenceId(e.target.value)} required>
            {data.offences.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} ({o.code})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date and time reported">
          <input type="datetime-local" value={reportedAt} onChange={(e) => setReportedAt(e.target.value)} required />
        </Field>
        <Field label="Location" full>
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Area, street, landmark" required />
        </Field>
        <Field label="Complainant name">
          <input value={complainantName} onChange={(e) => setComplainantName(e.target.value)} placeholder="Full name" required />
        </Field>
        <Field label="Complainant phone">
          <input value={complainantPhone} onChange={(e) => setComplainantPhone(e.target.value)} placeholder="0803 000 0000" />
        </Field>
        <Field label="Priority">
          <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            {["Low", "Medium", "High", "Critical"].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Field>
        <Field label="Assign to">
          <select value={assignedOfficerId} onChange={(e) => setAssignedOfficerId(e.target.value)}>
            {officers.map((o) => (
              <option key={o.id} value={o.id}>
                {o.rank} {o.name} ({o.forceNumber})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Narrative" hint="Facts only. Do not record opinions, confessions or sensitive personal data here." full>
          <textarea rows={5} value={narrative} onChange={(e) => setNarrative(e.target.value)} placeholder="What happened, who reported it, what was seen or recovered..." required />
        </Field>
        <label className="check-row field-full">
          <input type="checkbox" checked={sensitive} onChange={(e) => setSensitive(e.target.checked)} />
          <span>
            <strong>Mark as sensitive</strong>
            <small>Restrict to assigned officer, supervisor, commander and auditor.</small>
          </span>
        </label>
      </form>
    </Modal>
  );
}
