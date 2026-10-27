"use client";

import { useState } from "react";
import { useRRS } from "@/lib/store";
import type { Arrest } from "@/lib/types";
import { Field, Icon, Modal } from "./ui";

function localNow() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ArrestModal({ open, onClose, caseId }: { open: boolean; onClose: () => void; caseId: string }) {
  const { data, currentUser, addArrest } = useRRS();
  const record = data.cases.find((c) => c.id === caseId);
  const suspects = (record?.persons ?? []).filter((p) => p.role === "Suspect");
  const [personId, setPersonId] = useState(suspects[0]?.personId ?? "");
  const [arrestedAt, setArrestedAt] = useState(localNow());
  const [location, setLocation] = useState(record?.location ?? "");
  const [officerId, setOfficerId] = useState(currentUser?.id ?? data.officers[0]?.id ?? "");
  const [charges, setCharges] = useState("");
  const [custodyStatus, setCustodyStatus] = useState<Arrest["custodyStatus"]>("In custody");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const officers = data.officers.filter((o) => o.active && (o.role === "IPO" || o.role === "SUPERVISOR"));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personId) {
      setError("Link a suspect to this case first.");
      return;
    }
    if (!charges.trim() || !location.trim()) {
      setError("Charges and arrest location are required.");
      return;
    }
    addArrest(caseId, {
      personId,
      arrestedAt: new Date(arrestedAt).toISOString(),
      location: location.trim(),
      officerId,
      charges: charges.trim(),
      custodyStatus,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      title="Record arrest"
      subtitle="Arrest records link a suspect to this case and the arresting officer."
      onClose={onClose}
      wide
      footer={
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="arrest-form" className="btn btn-primary" disabled={!suspects.length}>
            <Icon name="lock" size={16} /> Record arrest
          </button>
        </div>
      }
    >
      <form id="arrest-form" onSubmit={submit} className="form-grid">
        {error ? <div className="banner banner-red field-full">{error}</div> : null}
        {!suspects.length ? (
          <div className="banner banner-amber field-full">
            <Icon name="alert" size={16} />
            <span>No suspect is linked to this case. Add the suspect under the Persons tab first.</span>
          </div>
        ) : null}
        <Field label="Suspect">
          <select value={personId} onChange={(e) => setPersonId(e.target.value)} disabled={!suspects.length}>
            {suspects.map((s) => {
              const p = data.persons.find((x) => x.id === s.personId);
              return (
                <option key={s.personId} value={s.personId}>
                  {p?.fullName ?? s.personId}
                </option>
              );
            })}
          </select>
        </Field>
        <Field label="Arresting officer">
          <select value={officerId} onChange={(e) => setOfficerId(e.target.value)}>
            {officers.map((o) => (
              <option key={o.id} value={o.id}>
                {o.rank} {o.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Arrest date and time">
          <input type="datetime-local" value={arrestedAt} onChange={(e) => setArrestedAt(e.target.value)} required />
        </Field>
        <Field label="Custody status">
          <select value={custodyStatus} onChange={(e) => setCustodyStatus(e.target.value as Arrest["custodyStatus"])}>
            {["In custody", "Released on bail", "Remanded", "Released"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Arrest location" full>
          <input value={location} onChange={(e) => setLocation(e.target.value)} required />
        </Field>
        <Field label="Charges / reason" full>
          <input value={charges} onChange={(e) => setCharges(e.target.value)} placeholder="e.g. Cultism, assault occasioning harm" required />
        </Field>
        <Field label="Notes" full>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Circumstances, caution, property recovered..." />
        </Field>
      </form>
    </Modal>
  );
}
