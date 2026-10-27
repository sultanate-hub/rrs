"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRRS } from "@/lib/store";
import type { CaseStatus, PersonRole } from "@/lib/types";
import { formatBytes, formatDate, formatDateTime, shortHash } from "@/lib/utils";
import { AddPersonModal } from "./AddPersonModal";
import { ArrestModal } from "./ArrestModal";
import { EvidenceModal } from "./EvidenceModal";
import { HearingModal } from "./HearingModal";
import { PersonProfileModal } from "./PersonProfileModal";
import { Avatar, Badge, EmptyState, Icon, PriorityBadge, StatusBadge } from "./ui";

type Tab = "overview" | "people" | "arrests" | "evidence" | "court" | "audit";

const roleOrder: PersonRole[] = ["Suspect", "Victim", "Complainant", "Witness"];

function ageFrom(dob?: string) {
  if (!dob) return "—";
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  return `${Math.floor(diff / 31557600000)} yrs`;
}

export function CaseDetail({ caseId, onBack, onOpenCase }: { caseId: string; onBack: () => void; onOpenCase?: (id: string) => void }) {
  const { data, currentUser, canEdit, canAssign, setCaseStatus, assignCase, logView } = useRRS();
  const record = data.cases.find((c) => c.id === caseId);
  const [tab, setTab] = useState<Tab>("overview");
  const [personOpen, setPersonOpen] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [arrestOpen, setArrestOpen] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [hearingOpen, setHearingOpen] = useState(false);
  const logged = useRef<string | null>(null);

  useEffect(() => {
    if (!record || logged.current === caseId) return;
    logged.current = caseId;
    logView(caseId);
  }, [caseId, record, logView]);

  const audit = useMemo(() => {
    if (!record) return [];
    const ids = new Set<string>([record.id, ...record.evidence.map((e) => e.id), ...record.hearings.map((h) => h.id)]);
    return data.audit.filter((a) => ids.has(a.recordId));
  }, [data.audit, record]);

  if (!record) {
    return (
      <div className="stack">
        <button type="button" className="link-btn" onClick={onBack}>
          <Icon name="arrowLeft" size={16} /> Back to register
        </button>
        <EmptyState title="Case not found" text="It may have been removed or you no longer have access." />
      </div>
    );
  }

  const offence = data.offences.find((o) => o.id === record.offenceId);
  const assigned = data.officers.find((o) => o.id === record.assignedOfficerId);
  const assignable = data.officers.filter((o) => o.active && (o.role === "IPO" || o.role === "SUPERVISOR"));
  const linkedPerson = (id: string) => data.persons.find((p) => p.id === id);

  const tabs: Array<{ id: Tab; label: string; count?: number }> = [
    { id: "overview", label: "Overview" },
    { id: "people", label: "Persons", count: record.persons.length },
    { id: "arrests", label: "Arrests", count: record.arrests.length },
    { id: "evidence", label: "Evidence", count: record.evidence.length },
    { id: "court", label: "Court", count: record.hearings.length },
    { id: "audit", label: "Audit", count: audit.length },
  ];

  return (
    <div className="stack">
      <button type="button" className="link-btn" onClick={onBack}>
        <Icon name="arrowLeft" size={16} /> Back to register
      </button>

      <section className="case-head">
        <div className="case-head-main">
          <span className="eyebrow">Case file</span>
          <div className="case-number-row">
            <h2 className="mono">{record.caseNumber}</h2>
            <StatusBadge status={record.status} />
            <PriorityBadge priority={record.priority} />
            {record.sensitive ? <Badge tone="red">Sensitive</Badge> : null}
            {record.syncStatus === "pending" ? <Badge tone="amber">Offline draft</Badge> : null}
          </div>
          <p>
            {offence?.name} <span className="dot-sep">·</span> {record.location} <span className="dot-sep">·</span> Reported {formatDate(record.reportedAt)}
          </p>
        </div>
        <div className="case-head-actions">
          <label className="inline-select">
            <span>Status</span>
            <select value={record.status} onChange={(e) => setCaseStatus(record.id, e.target.value as CaseStatus)} disabled={!canEdit}>
              {["Open", "Under Investigation", "Court", "Closed"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          {canAssign ? (
            <label className="inline-select">
              <span>Assign</span>
              <select value={record.assignedOfficerId} onChange={(e) => assignCase(record.id, e.target.value)}>
                {assignable.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.rank} {o.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {canEdit ? (
            <button type="button" className="btn btn-primary" onClick={() => setEvidenceOpen(true)}>
              <Icon name="upload" size={16} /> Evidence
            </button>
          ) : null}
        </div>
      </section>

      {record.persons.length === 0 && canEdit ? (
        <div className="banner banner-blue">
          <Icon name="people" size={18} />
          <span>
            <strong>No suspect linked yet.</strong> Register the suspect’s photograph, NIN, state of origin/LGA, fingerprint record and contact details.
          </span>
          <button type="button" className="btn btn-primary" onClick={() => setPersonOpen(true)}>
            <Icon name="plus" size={16} /> Register suspect
          </button>
        </div>
      ) : null}

      <div className="tabs" role="tablist" aria-label="Case sections">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`tab ${tab === t.id ? "tab-active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {typeof t.count === "number" ? <span className="tab-count">{t.count}</span> : null}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="grid-2-1">
          <section className="card">
            <div className="card-head">
              <div>
                <h3>Narrative</h3>
                <p>Recorded facts from the complainant and responding officer.</p>
              </div>
              <Badge tone={record.sensitive ? "red" : "gray"}>{record.sensitive ? "Restricted" : "Standard"}</Badge>
            </div>
            <p className="narrative">{record.narrative}</p>
            {record.sensitive ? (
              <div className="banner banner-red">
                <Icon name="lock" size={16} />
                <span>Sensitive case. Access should be limited to the assigned officer, supervisor, commander and auditor.</span>
              </div>
            ) : null}
          </section>

          <div className="stack">
            <section className="card">
              <div className="card-head">
                <div>
                  <h3>Case details</h3>
                  <p>Core identifiers and ownership.</p>
                </div>
              </div>
              <dl className="meta-grid">
                <div>
                  <dt>Offence</dt>
                  <dd>{offence?.name}</dd>
                </div>
                <div>
                  <dt>Law</dt>
                  <dd>{offence?.law}</dd>
                </div>
                <div>
                  <dt>Reported</dt>
                  <dd>{formatDateTime(record.reportedAt)}</dd>
                </div>
                <div>
                  <dt>Location</dt>
                  <dd>{record.location}</dd>
                </div>
                <div>
                  <dt>Assigned officer</dt>
                  <dd>{assigned ? `${assigned.rank} ${assigned.name}` : "—"}</dd>
                </div>
                <div>
                  <dt>Unit</dt>
                  <dd>{data.units.find((u) => u.id === record.unitId)?.name}</dd>
                </div>
                <div>
                  <dt>Complainant</dt>
                  <dd>{record.complainantName}</dd>
                </div>
                <div>
                  <dt>Phone</dt>
                  <dd>{record.complainantPhone || "—"}</dd>
                </div>
                <div>
                  <dt>Last updated</dt>
                  <dd>{formatDateTime(record.updatedAt)}</dd>
                </div>
                <div>
                  <dt>Case ID</dt>
                  <dd className="mono small">{record.id}</dd>
                </div>
              </dl>
            </section>

            <section className="card">
              <div className="card-head">
                <div>
                  <h3>Case health</h3>
                  <p>What is still missing.</p>
                </div>
              </div>
              <div className="health-list">
                <div className={record.persons.some((p) => p.role === "Suspect") ? "health-ok" : "health-missing"}>
                  <Icon name={record.persons.some((p) => p.role === "Suspect") ? "check" : "alert"} size={16} />
                  Suspect linked
                </div>
                <div className={record.evidence.length > 0 ? "health-ok" : "health-missing"}>
                  <Icon name={record.evidence.length > 0 ? "check" : "alert"} size={16} />
                  Evidence uploaded
                </div>
                <div className={record.charges.length > 0 ? "health-ok" : "health-missing"}>
                  <Icon name={record.charges.length > 0 ? "check" : "alert"} size={16} />
                  Charge recorded
                </div>
                <div className={record.hearings.length > 0 ? "health-ok" : "health-missing"}>
                  <Icon name={record.hearings.length > 0 ? "check" : "alert"} size={16} />
                  Court date set
                </div>
              </div>
            </section>
          </div>
        </div>
      ) : null}

      {tab === "people" ? (
        <section className="card">
          <div className="card-head">
            <div>
              <h3>Persons linked to this case</h3>
              <p>A person can be a suspect in one case and a witness in another.</p>
            </div>
            {canEdit ? (
              <button type="button" className="btn btn-ghost" onClick={() => setPersonOpen(true)}>
                <Icon name="plus" size={16} /> Link person
              </button>
            ) : null}
          </div>

          {record.persons.length === 0 ? <EmptyState icon="people" title="No persons linked" text="Link a suspect, victim, complainant or witness." /> : null}

          <div className="person-groups">
            {roleOrder.map((role) => {
              const rows = record.persons.filter((p) => p.role === role);
              if (!rows.length) return null;
              return (
                <div key={role} className="person-group">
                  <h4>
                    {role}s <span>{rows.length}</span>
                  </h4>
                  <div className="person-grid">
                    {rows.map((row) => {
                      const p = linkedPerson(row.personId);
                      if (!p) return null;
                      const linkedCases = data.cases.filter((c) => c.persons.some((x) => x.personId === p.id)).length;
                      return (
                        <article className="person-card" key={`${role}-${p.id}`}>
                          <div className="person-card-head">
                            <Avatar name={p.fullName} size={40} src={p.photoUrl} />
                            <div>
                              <button type="button" className="person-name-btn" onClick={() => setProfileId(p.id)}>
                                {p.fullName}
                              </button>
                              <span>
                                {p.alias ? `“${p.alias}” · ` : ""}
                                {p.gender} · {ageFrom(p.dob)}
                              </span>
                            </div>
                            {p.wanted ? <Badge tone="red">Wanted</Badge> : null}
                          </div>
                          <div className="person-meta">
                            <span>
                              <Icon name="user" size={14} /> {p.phone || "No phone"}
                            </span>
                            <span>
                              <Icon name="map" size={14} /> {p.address || "No address"}
                            </span>
                            <span>
                              <Icon name="file" size={14} /> {p.nin || "No NIN"}
                            </span>
                            <span>
                              <Icon name="lock" size={14} /> {p.fingerprint ? `Fingerprint: ${p.fingerprint.status}` : "No fingerprint record"}
                            </span>
                            <span>
                              <Icon name="map" size={14} /> {p.nationality || "Nationality not recorded"}
                            </span>
                            {p.stateOfOrigin ? (
                              <span>
                                <Icon name="map" size={14} /> State of origin: {p.stateOfOrigin}
                              </span>
                            ) : null}
                            {p.lga ? (
                              <span>
                                <Icon name="map" size={14} /> LGA: {p.lga}
                              </span>
                            ) : null}
                            {p.occupation ? (
                              <span>
                                <Icon name="user" size={14} /> Occupation: {p.occupation}
                              </span>
                            ) : null}
                            {p.tribe ? (
                              <span>
                                <Icon name="shield" size={14} /> Tribe: {p.tribe}
                              </span>
                            ) : null}
                            <span>
                              <Icon name="scale" size={14} /> {p.language || "Language not recorded"}{p.interpreterNeeded ? " · Interpreter needed" : ""}
                            </span>
                            {p.religion && p.religion !== "Prefer not to say" ? (
                              <span>
                                <Icon name="shield" size={14} /> Religion: {p.religion}
                              </span>
                            ) : null}
                          </div>
                          {row.notes ? <p className="person-note">{row.notes}</p> : null}
                          <div className="person-foot">
                            <Badge tone="blue">{role}</Badge>
                            <div className="flag-row">
                              <button type="button" className="link-btn" onClick={() => setProfileId(p.id)}>
                                View profile
                              </button>
                              <span className="muted small">{linkedCases} linked case{linkedCases === 1 ? "" : "s"}</span>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {tab === "arrests" ? (
        <section className="card">
          <div className="card-head">
            <div>
              <h3>Arrest records</h3>
              <p>Who was arrested, by whom, where, and the current custody status.</p>
            </div>
            {canEdit ? (
              <button type="button" className="btn btn-ghost" onClick={() => setArrestOpen(true)}>
                <Icon name="plus" size={16} /> Record arrest
              </button>
            ) : null}
          </div>

          {record.arrests.length === 0 ? <EmptyState icon="lock" title="No arrest recorded" text="Link a suspect, then record the arrest and custody status." /> : null}

          <div className="arrest-list">
            {record.arrests.map((a) => {
              const person = linkedPerson(a.personId);
              const officer = data.officers.find((o) => o.id === a.officerId);
              const tone = a.custodyStatus === "Remanded" || a.custodyStatus === "In custody" ? "red" : a.custodyStatus === "Released on bail" ? "blue" : "green";
              return (
                <article className="arrest-card" key={a.id}>
                  <div className="arrest-head">
                    <span className="arrest-icon">
                      <Icon name="lock" size={19} />
                    </span>
                    <div>
                      <strong>{person?.fullName ?? "Unknown person"}</strong>
                      <span>{a.charges}</span>
                    </div>
                    <Badge tone={tone}>{a.custodyStatus}</Badge>
                  </div>
                  <div className="arrest-meta">
                    <span>
                      <small>Arrested</small>
                      {formatDateTime(a.arrestedAt)}
                    </span>
                    <span>
                      <small>Location</small>
                      {a.location}
                    </span>
                    <span>
                      <small>Arresting officer</small>
                      {officer ? `${officer.rank} ${officer.name}` : "—"}
                    </span>
                  </div>
                  {a.notes ? <p className="person-note">{a.notes}</p> : null}
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {tab === "evidence" ? (
        <section className="card">
          <div className="card-head">
            <div>
              <h3>Evidence and exhibits</h3>
              <p>Each item is hashed and has a custody chain.</p>
            </div>
            {canEdit ? (
              <button type="button" className="btn btn-ghost" onClick={() => setEvidenceOpen(true)}>
                <Icon name="upload" size={16} /> Upload evidence
              </button>
            ) : null}
          </div>

          {record.evidence.length === 0 ? <EmptyState icon="file" title="No evidence yet" text="Upload photographs, documents, audio or video." /> : null}

          <div className="evidence-list">
            {record.evidence.map((ev) => {
              const collector = data.officers.find((o) => o.id === ev.collectedBy);
              const collectedLabel = collector ? `${collector.rank} ${collector.name}` : ev.collectedBy;
              return (
              <article className="evidence-card" key={ev.id}>
                <div className="evidence-head">
                  <span className="evidence-icon">
                    <Icon name={ev.type === "Audio" || ev.type === "Video" ? "camera" : ev.type === "Document" ? "file" : ev.type === "Statement" ? "scale" : "camera"} size={20} />
                  </span>
                  <div className="evidence-title">
                    <strong>
                      {ev.evidenceNumber} · {ev.type}
                    </strong>
                    <span>{ev.description}</span>
                  </div>
                  <Badge tone="green">Hash verified</Badge>
                </div>

                <div className="evidence-meta">
                  <span>
                    <small>File</small>
                    {ev.fileName} ({formatBytes(ev.fileSize)})
                  </span>
                  <span>
                    <small>Collected by</small>
                    {collectedLabel}
                  </span>
                  <span>
                    <small>Collected at</small>
                    {formatDateTime(ev.collectedAt)}
                  </span>
                  <span>
                    <small>Location</small>
                    {ev.location}
                  </span>
                  <span>
                    <small>Seal</small>
                    {ev.sealNumber}
                  </span>
                </div>

                <div className="hash-line">
                  <span>SHA-256</span>
                  <code title={ev.hash}>{shortHash(ev.hash, 40)}</code>
                </div>

                <div className="custody">
                  <strong>Custody chain</strong>
                  <div className="timeline">
                    {ev.custody.map((c) => (
                      <div className="timeline-row" key={c.id}>
                        <span className="timeline-dot" />
                        <div>
                          <strong>{c.action}</strong>
                          <span>
                            {c.from} → {c.to} · {formatDateTime(c.at)}
                          </span>
                          {c.notes ? <small>{c.notes}</small> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
              );
            })}
          </div>
          <p className="muted small">Demo stores file metadata and the SHA-256 fingerprint. Production uploads to private storage, scans for malware and logs every download.</p>
        </section>
      ) : null}

      {tab === "court" ? (
        <div className="grid-2">
          <section className="card">
            <div className="card-head">
              <div>
                <h3>Charges</h3>
                <p>Charges filed against the suspect(s).</p>
              </div>
              <Badge tone="purple">{record.charges.length}</Badge>
            </div>
            {record.charges.length === 0 ? <EmptyState icon="scale" title="No charges recorded" text="Charges can be added when the case is ready for court." /> : null}
            <div className="charge-list">
              {record.charges.map((ch) => (
                <div className="charge-row" key={ch.id}>
                  <span className="charge-icon">
                    <Icon name="scale" size={18} />
                  </span>
                  <div>
                    <strong>{ch.description}</strong>
                    <span>{ch.law}</span>
                  </div>
                  <Badge tone="purple">{data.offences.find((o) => o.id === ch.offenceId)?.code ?? "—"}</Badge>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <div>
                <h3>Court diary</h3>
                <p>Hearings, outcomes and next dates.</p>
              </div>
              {canEdit ? (
                <button type="button" className="btn btn-ghost" onClick={() => setHearingOpen(true)}>
                  <Icon name="plus" size={16} /> Add hearing
                </button>
              ) : null}
            </div>
            {record.hearings.length === 0 ? <EmptyState icon="court" title="No hearings yet" text="Add the first court date when the case is charged." /> : null}
            <div className="timeline">
              {record.hearings
                .slice()
                .sort((a, b) => +new Date(b.hearingAt) - +new Date(a.hearingAt))
                .map((h) => (
                  <div className="timeline-row" key={h.id}>
                    <span className="timeline-dot" />
                    <div>
                      <strong>
                        {h.court} · {h.purpose}
                      </strong>
                      <span>{formatDateTime(h.hearingAt)}</span>
                      <small>Outcome: {h.outcome}</small>
                      {h.nextAt ? <small>Next: {formatDateTime(h.nextAt)}</small> : null}
                    </div>
                  </div>
                ))}
            </div>
          </section>
        </div>
      ) : null}

      {tab === "audit" ? (
        <section className="card">
          <div className="card-head">
            <div>
              <h3>Case audit trail</h3>
              <p>Every action on this case, its evidence and its hearings.</p>
            </div>
            <Badge tone="green">Append-only</Badge>
          </div>
          {audit.length === 0 ? <EmptyState icon="audit" title="No audit entries" text="Actions on this case will appear here." /> : null}
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Detail</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {audit.map((a) => (
                  <tr key={a.id}>
                    <td>{formatDateTime(a.at)}</td>
                    <td>{a.actorName}</td>
                    <td>
                      <Badge tone={a.action.includes("viewed") ? "gray" : a.action.includes("evidence") ? "purple" : "blue"}>{a.action}</Badge>
                    </td>
                    <td>{a.detail}</td>
                    <td className="mono small">{a.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <AddPersonModal open={personOpen} onClose={() => setPersonOpen(false)} caseId={record.id} />
      <PersonProfileModal personId={profileId} open={!!profileId} onClose={() => setProfileId(null)} onOpenCase={onOpenCase} />
      <ArrestModal open={arrestOpen} onClose={() => setArrestOpen(false)} caseId={record.id} />
      <EvidenceModal open={evidenceOpen} onClose={() => setEvidenceOpen(false)} caseId={record.id} />
      <HearingModal open={hearingOpen} onClose={() => setHearingOpen(false)} caseId={record.id} />
    </div>
  );
}
