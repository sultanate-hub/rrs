"use client";

import { useRef, useState } from "react";
import { useRRS } from "@/lib/store";
import lgaData from "@/lib/nigeria-lgas.json";
import countryData from "@/lib/countries.json";
import type { FingerprintRecord, PersonGender, PersonRole } from "@/lib/types";

const LGA_BY_STATE: Record<string, string[]> = Object.fromEntries(lgaData.map((s) => [s.state, s.lgas]));
const STATES = Object.keys(LGA_BY_STATE);
const COUNTRY_OPTIONS = ["Nigeria", ...countryData.map((c) => c.name).filter((n) => n !== "Nigeria")];
import { Badge, Field, Icon, Modal } from "./ui";

function localNow() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

async function compressPhoto(file: File): Promise<string> {
  const original = await readAsDataUrl(file);
  if (typeof createImageBitmap === "undefined") return original;
  try {
    const bitmap = await createImageBitmap(file);
    const max = 720;
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return original;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } catch {
    return original;
  }
}

export function AddPersonModal({ open, onClose, caseId }: { open: boolean; onClose: () => void; caseId: string }) {
  const { currentUser, addPersonToCase } = useRRS();
  const [role, setRole] = useState<PersonRole>("Suspect");
  const [fullName, setFullName] = useState("");
  const [alias, setAlias] = useState("");
  const [gender, setGender] = useState<PersonGender>("Male");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  const [nationality, setNationality] = useState("Nigeria");
  const [stateOfOrigin, setStateOfOrigin] = useState("");
  const [lga, setLga] = useState("");
  const [tribe, setTribe] = useState("");
  const [occupation, setOccupation] = useState("");
  const [religion, setReligion] = useState("Prefer not to say");
  const [language, setLanguage] = useState("English");
  const [interpreterNeeded, setInterpreterNeeded] = useState(false);
  const [address, setAddress] = useState("");
  const [nin, setNin] = useState("");
  const [notes, setNotes] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const [fpStatus, setFpStatus] = useState<FingerprintRecord["status"]>("Pending");
  const [fpReference, setFpReference] = useState("");
  const [fpDevice, setFpDevice] = useState("");
  const [fpAt, setFpAt] = useState(localNow());
  const [fpBy, setFpBy] = useState(currentUser ? `${currentUser.rank} ${currentUser.name}` : "");
  const [fpNotes, setFpNotes] = useState("");
  const [error, setError] = useState("");
  const photoRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handlePhoto = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setError("Photo is too large. Use a file under 8 MB.");
      return;
    }
    setPhotoBusy(true);
    setError("");
    try {
      setPhotoUrl(await compressPhoto(file));
    } catch {
      setError("Could not read that image. Try a JPEG or PNG.");
    } finally {
      setPhotoBusy(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    if (role === "Suspect") {
      if (!photoUrl) {
        setError("A suspect photograph is required. Use camera or choose a file.");
        return;
      }
      if (!nin.trim()) {
        setError("A suspect NIN is required.");
        return;
      }
      if (fpStatus === "Recorded" && !fpReference.trim()) {
        setError("Enter the fingerprint scanner reference, or set the status to Pending.");
        return;
      }
    }

    addPersonToCase(caseId, {
      fullName: fullName.trim(),
      alias: alias.trim() || undefined,
      gender,
      dob: dob || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      nin: nin.trim() || undefined,
      notes: notes.trim() || undefined,
      role,
      photoUrl: photoUrl || undefined,
      religion,
      nationality: nationality.trim() || undefined,
      stateOfOrigin: stateOfOrigin || undefined,
      lga: lga || undefined,
      tribe: tribe.trim() || undefined,
      occupation: occupation.trim() || undefined,
      language,
      interpreterNeeded,
      fingerprint: {
        status: fpStatus,
        reference: fpReference.trim() || undefined,
        capturedAt: fpStatus === "Recorded" ? new Date(fpAt).toISOString() : undefined,
        capturedBy: fpBy.trim() || undefined,
        device: fpDevice.trim() || undefined,
        notes: fpNotes.trim() || undefined,
      },
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      title="Link a person to this case"
      subtitle="The same person can appear in another case with a different role."
      onClose={onClose}
      wide
      footer={
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="add-person-form" className="btn btn-primary">
            <Icon name="people" size={16} /> Link person
          </button>
        </div>
      }
    >
      <form id="add-person-form" onSubmit={submit} className="form-grid">
        {error ? <div className="banner banner-red field-full">{error}</div> : null}

        <div className="banner banner-blue field-full">
          <Icon name="alert" size={16} />
          <span>Suspects need a photograph, NIN, state of origin/LGA and fingerprint record. Use the section links below to jump.</span>
        </div>

        <div className="requirement-strip field-full">
          <span className={`requirement ${photoUrl ? "requirement-ok" : "requirement-missing"}`}>
            <Icon name={photoUrl ? "check" : "camera"} size={13} /> Photo {photoUrl ? "attached" : "required"}
          </span>
          <span className={`requirement ${nin.trim() ? "requirement-ok" : "requirement-missing"}`}>
            <Icon name={nin.trim() ? "check" : "file"} size={13} /> NIN {nin.trim() ? "added" : "required"}
          </span>
          <span className={`requirement ${fpStatus === "Recorded" ? "requirement-ok" : "requirement-missing"}`}>
            <Icon name={fpStatus === "Recorded" ? "check" : "clock"} size={13} /> Fingerprint: {fpStatus}
          </span>
        </div>

        <div className="form-section-nav field-full">
          {[
            ["person-identity", "Identity & photo"],
            ["person-origin", "Origin & personal"],
            ["person-contact", "Contact"],
            ["person-fingerprint", "Fingerprint"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              className="chip chip-gray"
              onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
            >
              {label}
            </button>
          ))}
        </div>

        <div id="person-identity" className="form-section-title field-full">Identity</div>

        <Field label="Role in this case">
          <select value={role} onChange={(e) => setRole(e.target.value as PersonRole)}>
            {["Suspect", "Victim", "Complainant", "Witness"].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </Field>
        <Field label="Full name">
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Surname first" required />
        </Field>
        <Field label="Alias / nickname">
          <input value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="Optional" />
        </Field>

        <div className="photo-row field-full">
          <div className="photo-preview">{photoUrl ? <img src={photoUrl} alt="Suspect photograph preview" /> : <Icon name="user" size={28} />}</div>
          <div>
            <strong>{photoUrl ? "Photograph attached" : `Photograph${role === "Suspect" ? " required" : " (optional)"}`}</strong>
            <span>{photoBusy ? "Processing image…" : "Capture with the camera or choose a JPEG/PNG. Demo compresses to 720px."}</span>
          </div>
          <div className="upload-actions">
            <button type="button" className="btn btn-ghost" onClick={() => cameraRef.current?.click()}>
              <Icon name="camera" size={16} /> Camera
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => photoRef.current?.click()}>
              <Icon name="upload" size={16} /> Choose photo
            </button>
            {photoUrl ? (
              <button type="button" className="link-btn" onClick={() => setPhotoUrl("")}>
                Remove
              </button>
            ) : null}
            <input ref={cameraRef} type="file" hidden accept="image/*" capture="environment" onChange={(e) => handlePhoto(e.target.files?.[0])} />
            <input ref={photoRef} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={(e) => handlePhoto(e.target.files?.[0])} />
          </div>
        </div>

        <Field label={`National ID (NIN)${role === "Suspect" ? " *" : ""}`}>
          <input value={nin} onChange={(e) => setNin(e.target.value)} placeholder="NIN-0000000000" required={role === "Suspect"} />
        </Field>

        <Field label="Gender">
          <select value={gender} onChange={(e) => setGender(e.target.value as PersonGender)}>
            {["Male", "Female", "Non-binary", "Other", "Prefer not to say"].map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </Field>
        <div id="person-origin" className="form-section-title field-full">Origin and personal details</div>

        <Field label="Nationality">
          <select
            value={nationality}
            onChange={(e) => {
              setNationality(e.target.value);
              setStateOfOrigin("");
              setLga("");
            }}
          >
            {COUNTRY_OPTIONS.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </Field>
        <Field label="Date of birth">
          <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
        </Field>
        <Field
          label={nationality === "Nigeria" ? "State of origin" : "State / province / region"}
          hint="Sensitive. Use for identification and operational purposes only."
        >
          {nationality === "Nigeria" ? (
            <select
              value={stateOfOrigin}
              onChange={(e) => {
                setStateOfOrigin(e.target.value);
                setLga("");
              }}
            >
              <option value="">Select state</option>
              {STATES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          ) : (
            <input value={stateOfOrigin} onChange={(e) => setStateOfOrigin(e.target.value)} placeholder="State / province / region" />
          )}
        </Field>
        <Field
          label={nationality === "Nigeria" ? "Local Government Area (LGA)" : "City / district"}
          hint={
            nationality === "Nigeria"
              ? stateOfOrigin
                ? "Select the local government area."
                : "Select the state first."
              : "Free text for foreign addresses."
          }
        >
          {nationality === "Nigeria" ? (
            <select value={lga} onChange={(e) => setLga(e.target.value)} disabled={!stateOfOrigin}>
              <option value="">{stateOfOrigin ? "Select LGA" : "Select state first"}</option>
              {(LGA_BY_STATE[stateOfOrigin] ?? []).map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          ) : (
            <input value={lga} onChange={(e) => setLga(e.target.value)} placeholder="City / district / local government" />
          )}
        </Field>
        <Field label="Occupation" hint="Free text. Do not force a dropdown; jobs vary.">
          <input value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="e.g. Tailor, driver, trader, student" />
        </Field>
        <Field label="Tribe / ethnic group" hint="Sensitive. Never use for biased treatment or profiling.">
          <input value={tribe} onChange={(e) => setTribe(e.target.value)} placeholder="e.g. Yoruba" list="tribe-options" />
          <datalist id="tribe-options">
            <option value="Yoruba" />
            <option value="Igbo" />
            <option value="Hausa" />
            <option value="Fulani" />
            <option value="Ijaw" />
            <option value="Kanuri" />
            <option value="Tiv" />
            <option value="Ibibio" />
            <option value="Efik" />
            <option value="Urhobo" />
            <option value="Itsekiri" />
            <option value="Edo" />
            <option value="Nupe" />
            <option value="Berom" />
            <option value="Other" />
          </datalist>
        </Field>
        <Field label="Religion (optional)" hint="Sensitive. Collect only for a documented operational purpose.">
          <select value={religion} onChange={(e) => setReligion(e.target.value)}>
            {["Prefer not to say", "Christianity", "Islam", "Traditional", "Other"].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </Field>
        <div id="person-contact" className="form-section-title field-full">Contact</div>

        <Field label="Phone number">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0803 000 0000" />
        </Field>
        <Field label="Preferred language">
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            {["English", "Hausa", "Yoruba", "Igbo", "Nigerian Pidgin", "Arabic", "French", "Other"].map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </Field>
        <label className="check-row">
          <input type="checkbox" checked={interpreterNeeded} onChange={(e) => setInterpreterNeeded(e.target.checked)} />
          <span>
            <strong>Interpreter needed</strong>
            <small>For statements, interviews or court.</small>
          </span>
        </label>
        <Field label="Address" full>
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, area, city" />
        </Field>

        <div id="person-fingerprint" className="fingerprint-box field-full">
          <div className="fingerprint-head">
            <strong>Fingerprint record {role === "Suspect" ? "(required field)" : "(optional)"}</strong>
            <Badge tone={fpStatus === "Recorded" ? "green" : fpStatus === "Pending" ? "amber" : "gray"}>{fpStatus}</Badge>
          </div>
          <p>
            Live fingerprint capture requires a compatible scanner and biometric SDK. V1 stores the status, scanner reference and capture details so the record is ready for the biometric phase.
          </p>
          <div className="form-grid">
            <Field label="Fingerprint status">
              <select value={fpStatus} onChange={(e) => setFpStatus(e.target.value as FingerprintRecord["status"])}>
                {["Recorded", "Pending", "Not available"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Scanner reference">
              <input value={fpReference} onChange={(e) => setFpReference(e.target.value)} placeholder="e.g. FP-2026-00123" />
            </Field>
            <Field label="Captured by">
              <input value={fpBy} onChange={(e) => setFpBy(e.target.value)} />
            </Field>
            <Field label="Captured at">
              <input type="datetime-local" value={fpAt} onChange={(e) => setFpAt(e.target.value)} disabled={fpStatus !== "Recorded"} />
            </Field>
            <Field label="Device / scanner" full>
              <input value={fpDevice} onChange={(e) => setFpDevice(e.target.value)} placeholder="Make, model or serial number" />
            </Field>
            <Field label="Fingerprint notes" full>
              <textarea rows={2} value={fpNotes} onChange={(e) => setFpNotes(e.target.value)} placeholder="Finger position, quality, scanner operator..." />
            </Field>
          </div>
        </div>

        <Field label="Other notes" hint="Facts and identifying details only." full>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Distinguishing marks, known addresses, caution notes..." />
        </Field>
      </form>
    </Modal>
  );
}
