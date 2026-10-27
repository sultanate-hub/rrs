"use client";

import { useRRS } from "@/lib/store";
import { formatDate, formatDateTime } from "@/lib/utils";
import { Avatar, Badge, Icon, Modal, StatusBadge } from "./ui";

function ageFrom(dob?: string) {
  if (!dob) return "—";
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return "—";
  return `${Math.floor((Date.now() - d.getTime()) / 31557600000)} yrs`;
}

export function PersonProfileModal({
  personId,
  open,
  onClose,
  onOpenCase,
}: {
  personId: string | null;
  open: boolean;
  onClose: () => void;
  onOpenCase?: (id: string) => void;
}) {
  const { data } = useRRS();
  const person = data.persons.find((p) => p.id === personId);

  if (!person) return null;

  const links = data.cases
    .filter((c) => c.persons.some((p) => p.personId === person.id))
    .map((c) => ({ caseRecord: c, role: c.persons.find((p) => p.personId === person.id)?.role ?? "" }));

  const fp = person.fingerprint;

  return (
    <Modal
      open={open}
      title="Person profile"
      subtitle="Full identity, origin, contact, biometric record and linked cases."
      onClose={onClose}
      wide
      footer={
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
            <Icon name="print" size={16} /> Print profile
          </button>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      }
    >
      <div className="profile-grid">
        <aside className="profile-photo-card">
          {person.photoUrl ? (
            <img className="profile-photo" src={person.photoUrl} alt={`${person.fullName} photograph`} />
          ) : (
            <div className="profile-photo profile-photo-empty">
              <Icon name="user" size={42} />
              <span>No photograph on file</span>
            </div>
          )}
          <h3>{person.fullName}</h3>
          {person.alias ? <p className="profile-alias">“{person.alias}”</p> : null}
          <div className="profile-badges">
            {person.wanted ? <Badge tone="red">Wanted</Badge> : null}
            <Badge tone={fp?.status === "Recorded" ? "green" : fp?.status === "Pending" ? "amber" : "gray"}>
              Fingerprint: {fp?.status ?? "Not recorded"}
            </Badge>
          </div>
          <div className="profile-nin">
            <small>National ID (NIN)</small>
            <strong className="mono">{person.nin || "Not recorded"}</strong>
          </div>
        </aside>

        <div className="profile-sections">
          <section className="profile-section">
            <h4>Identity</h4>
            <dl className="meta-grid">
              <div>
                <dt>Full name</dt>
                <dd>{person.fullName}</dd>
              </div>
              <div>
                <dt>Alias</dt>
                <dd>{person.alias || "—"}</dd>
              </div>
              <div>
                <dt>Gender</dt>
                <dd>{person.gender}</dd>
              </div>
              <div>
                <dt>Date of birth / age</dt>
                <dd>{person.dob ? `${formatDate(person.dob)} · ${ageFrom(person.dob)}` : "—"}</dd>
              </div>
              <div>
                <dt>NIN</dt>
                <dd className="mono">{person.nin || "—"}</dd>
              </div>
              <div>
                <dt>Nationality</dt>
                <dd>{person.nationality || "—"}</dd>
              </div>
            </dl>
          </section>

          <section className="profile-section">
            <h4>Origin, work and language</h4>
            <dl className="meta-grid">
              <div>
                <dt>State of origin</dt>
                <dd>{person.stateOfOrigin || "—"}</dd>
              </div>
              <div>
                <dt>LGA / city</dt>
                <dd>{person.lga || "—"}</dd>
              </div>
              <div>
                <dt>Tribe / ethnic group</dt>
                <dd>{person.tribe || "—"}</dd>
              </div>
              <div>
                <dt>Occupation</dt>
                <dd>{person.occupation || "—"}</dd>
              </div>
              <div>
                <dt>Religion</dt>
                <dd>{person.religion || "—"}</dd>
              </div>
              <div>
                <dt>Preferred language</dt>
                <dd>
                  {person.language || "—"}
                  {person.interpreterNeeded ? " · Interpreter needed" : ""}
                </dd>
              </div>
            </dl>
          </section>

          <section className="profile-section">
            <h4>Contact</h4>
            <dl className="meta-grid">
              <div>
                <dt>Phone</dt>
                <dd>{person.phone || "—"}</dd>
              </div>
              <div>
                <dt>Address</dt>
                <dd>{person.address || "—"}</dd>
              </div>
            </dl>
          </section>

          <section className="profile-section">
            <h4>Fingerprint record</h4>
            <dl className="meta-grid">
              <div>
                <dt>Status</dt>
                <dd>{fp?.status ?? "Not recorded"}</dd>
              </div>
              <div>
                <dt>Scanner reference</dt>
                <dd className="mono">{fp?.reference || "—"}</dd>
              </div>
              <div>
                <dt>Captured by</dt>
                <dd>{fp?.capturedBy || "—"}</dd>
              </div>
              <div>
                <dt>Captured at</dt>
                <dd>{fp?.capturedAt ? formatDateTime(fp.capturedAt) : "—"}</dd>
              </div>
              <div>
                <dt>Device / scanner</dt>
                <dd>{fp?.device || "—"}</dd>
              </div>
              <div>
                <dt>Notes</dt>
                <dd>{fp?.notes || "—"}</dd>
              </div>
            </dl>
            {fp?.status === "Pending" ? (
              <div className="banner banner-amber">
                <Icon name="alert" size={16} />
                <span>Fingerprint capture is pending. Live capture needs a compatible scanner and biometric SDK.</span>
              </div>
            ) : null}
          </section>

          <section className="profile-section">
            <h4>Linked cases ({links.length})</h4>
            {links.length === 0 ? <p className="muted small">No visible case link.</p> : null}
            <div className="profile-case-list">
              {links.map(({ caseRecord, role }) => (
                <button
                  key={caseRecord.id}
                  type="button"
                  className="profile-case-row"
                  onClick={() => {
                    if (onOpenCase) {
                      onClose();
                      onOpenCase(caseRecord.id);
                    }
                  }}
                >
                  <span className="mono">{caseRecord.caseNumber}</span>
                  <span>{data.offences.find((o) => o.id === caseRecord.offenceId)?.name}</span>
                  <Badge tone="blue">{role}</Badge>
                  <StatusBadge status={caseRecord.status} />
                  <span className="muted small">{formatDate(caseRecord.reportedAt)}</span>
                  {onOpenCase ? <Icon name="chevron" size={15} /> : null}
                </button>
              ))}
            </div>
          </section>

          {person.notes ? (
            <section className="profile-section">
              <h4>Notes</h4>
              <p className="profile-notes">{person.notes}</p>
            </section>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
