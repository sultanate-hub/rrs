"use client";

import { useRef, useState } from "react";
import { useRRS } from "@/lib/store";
import type { Evidence } from "@/lib/types";
import { formatBytes } from "@/lib/utils";
import { Field, Icon, Modal } from "./ui";

function localNow() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function sha256(file: File): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const buffer = await file.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  // Non-cryptographic fallback for an insecure demo context only.
  const raw = `${file.name}|${file.size}|${file.lastModified}`;
  let h = 0;
  for (let i = 0; i < raw.length; i++) h = (h * 31 + raw.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, "0").repeat(8);
}

export function EvidenceModal({ open, onClose, caseId }: { open: boolean; onClose: () => void; caseId: string }) {
  const { data, currentUser, addEvidence } = useRRS();
  const record = data.cases.find((c) => c.id === caseId);
  const [type, setType] = useState<Evidence["type"]>("Photograph");
  const [description, setDescription] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [mimeType, setMimeType] = useState("");
  const [hash, setHash] = useState("");
  const [hashing, setHashing] = useState(false);
  const [hashNote, setHashNote] = useState("");
  const [collectedBy, setCollectedBy] = useState(currentUser ? `${currentUser.rank} ${currentUser.name}` : "");
  const [collectedAt, setCollectedAt] = useState(localNow());
  const [location, setLocation] = useState(record?.location ?? "");
  const [sealNumber, setSealNumber] = useState(`SEAL-${Math.floor(Math.random() * 900 + 100)}`);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    setHashing(true);
    setHashNote("");
    try {
      const digest = await sha256(file);
      setFileName(file.name);
      setFileSize(file.size);
      setMimeType(file.type || "application/octet-stream");
      setHash(digest);
      if (!crypto.subtle) setHashNote("Demo context only — production uses a server-verified SHA-256.");
    } catch {
      setError("Could not read that file. Try a smaller file.");
    } finally {
      setHashing(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hash || !description.trim()) {
      setError("Choose a file and describe the evidence.");
      return;
    }
    addEvidence(caseId, {
      type,
      description: description.trim(),
      fileName,
      fileSize,
      mimeType,
      hash,
      collectedBy,
      collectedAt: new Date(collectedAt).toISOString(),
      location,
      sealNumber,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      title="Upload evidence"
      subtitle="The file is hashed, sealed and added to the custody chain."
      onClose={onClose}
      wide
      footer={
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="evidence-form" className="btn btn-primary" disabled={hashing}>
            <Icon name="upload" size={16} /> Add to case
          </button>
        </div>
      }
    >
      <form id="evidence-form" onSubmit={submit} className="form-grid">
        {error ? <div className="banner banner-red field-full">{error}</div> : null}

        <div className="upload-box field-full">
          <div className="upload-icon">
            <Icon name="file" size={24} />
          </div>
          <div>
            <strong>{fileName || "Choose a file or take a photo"}</strong>
            <span>{fileName ? `${formatBytes(fileSize)} · ${mimeType}` : "Photo, PDF, audio or video. Demo stores metadata + hash only."}</span>
          </div>
          <div className="upload-actions">
            <button type="button" className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
              <Icon name="upload" size={16} /> Choose file
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => cameraRef.current?.click()}>
              <Icon name="camera" size={16} /> Camera
            </button>
            <input
              ref={fileRef}
              type="file"
              hidden
              onChange={(e) => handleFile(e.target.files?.[0])}
              accept="image/*,application/pdf,audio/*,video/*"
            />
            <input
              ref={cameraRef}
              type="file"
              hidden
              accept="image/*"
              capture="environment"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>
        </div>

        {hashing ? <div className="banner banner-blue field-full">Computing SHA-256…</div> : null}
        {hash ? (
          <div className="hash-box field-full">
            <div>
              <span className="hash-label">SHA-256 fingerprint</span>
              <code>{hash}</code>
            </div>
            <span className="chip chip-green">Hash ready</span>
            {hashNote ? <span className="muted small">{hashNote}</span> : null}
          </div>
        ) : null}

        <Field label="Evidence type">
          <select value={type} onChange={(e) => setType(e.target.value as Evidence["type"])}>
            {["Photograph", "Document", "Statement", "Audio", "Video", "Physical item"].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Seal number">
          <input value={sealNumber} onChange={(e) => setSealNumber(e.target.value)} />
        </Field>
        <Field label="Collected by">
          <input value={collectedBy} onChange={(e) => setCollectedBy(e.target.value)} />
        </Field>
        <Field label="Collected at">
          <input type="datetime-local" value={collectedAt} onChange={(e) => setCollectedAt(e.target.value)} />
        </Field>
        <Field label="Collection location" full>
          <input value={location} onChange={(e) => setLocation(e.target.value)} />
        </Field>
        <Field label="Description" full>
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is it, where was it found, why is it relevant..." required />
        </Field>
      </form>
    </Modal>
  );
}
