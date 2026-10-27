"use client";

import { useMemo, useState } from "react";
import { useRRS } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import { Avatar, Badge, EmptyState, Icon } from "./ui";
import { PersonProfileModal } from "./PersonProfileModal";

function ageFrom(dob?: string) {
  if (!dob) return "—";
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return "—";
  return `${Math.floor((Date.now() - d.getTime()) / 31557600000)} yrs`;
}

export function PeopleView({ onOpenCase }: { onOpenCase: (id: string) => void }) {
  const { data, currentUser } = useRRS();
  const [query, setQuery] = useState("");
  const [wantedOnly, setWantedOnly] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.persons
      .filter((p) => (wantedOnly ? p.wanted : true))
      .filter((p) => {
        if (!q) return true;
        return [p.fullName, p.alias ?? "", p.phone ?? "", p.nin ?? "", p.address ?? ""].join(" ").toLowerCase().includes(q);
      })
      .map((p) => {
        const links = data.cases
          .filter((c) => c.persons.some((x) => x.personId === p.id))
          .map((c) => ({ caseRecord: c, role: c.persons.find((x) => x.personId === p.id)?.role ?? "" }));
        return { person: p, links };
      })
      .sort((a, b) => Number(b.person.wanted ?? false) - Number(a.person.wanted ?? false) || a.person.fullName.localeCompare(b.person.fullName));
  }, [data, query, wantedOnly]);

  if (currentUser?.role === "ADMIN") {
    return <EmptyState icon="lock" title="Restricted" text="Administration cannot browse person records." />;
  }

  return (
    <div className="stack">
      <section className="page-head">
        <div>
          <span className="eyebrow">Records</span>
          <h2>Persons of interest</h2>
          <p>{rows.length} persons linked to visible cases. Same person can appear in multiple cases.</p>
        </div>
        <div className="page-actions">
          <label className="check-inline">
            <input type="checkbox" checked={wantedOnly} onChange={(e) => setWantedOnly(e.target.checked)} />
            Wanted only
          </label>
        </div>
      </section>

      <section className="card filter-card">
        <div className="filter-row">
          <label className="search-box">
            <Icon name="search" size={17} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name, alias, phone, NIN or address" />
          </label>
        </div>
      </section>

      {rows.length === 0 ? <EmptyState icon="people" title="No persons match" text="Try a different name or phone number." /> : null}

      <div className="people-grid">
        {rows.map(({ person, links }) => (
          <article className="person-card person-card-lg" key={person.id}>
            <div className="person-card-head">
              <Avatar name={person.fullName} size={46} tone={person.wanted ? "red" : "navy"} src={person.photoUrl} />
              <div>
                <button type="button" className="person-name-btn" onClick={() => setProfileId(person.id)}>
                  {person.fullName}
                </button>
                <span>
                  {person.alias ? `“${person.alias}” · ` : ""}
                  {person.gender} · {ageFrom(person.dob)}
                </span>
              </div>
              {person.wanted ? <Badge tone="red">Wanted</Badge> : null}
            </div>

            <div className="person-meta">
              <span>
                <Icon name="user" size={14} /> {person.phone || "No phone"}
              </span>
              <span>
                <Icon name="map" size={14} /> {person.address || "No address"}
              </span>
              <span>
                <Icon name="file" size={14} /> {person.nin || "No NIN"}
              </span>
              <span>
                <Icon name="lock" size={14} /> {person.fingerprint ? `Fingerprint: ${person.fingerprint.status}` : "No fingerprint record"}
              </span>
              <span>
                <Icon name="map" size={14} /> {person.nationality || "Nationality not recorded"}
              </span>
              {person.stateOfOrigin ? (
                <span>
                  <Icon name="map" size={14} /> State of origin: {person.stateOfOrigin}
                </span>
              ) : null}
              {person.lga ? (
                <span>
                  <Icon name="map" size={14} /> LGA: {person.lga}
                </span>
              ) : null}
              {person.occupation ? (
                <span>
                  <Icon name="user" size={14} /> Occupation: {person.occupation}
                </span>
              ) : null}
              {person.tribe ? (
                <span>
                  <Icon name="shield" size={14} /> Tribe: {person.tribe}
                </span>
              ) : null}
              <span>
                <Icon name="scale" size={14} /> {person.language || "Language not recorded"}{person.interpreterNeeded ? " · Interpreter needed" : ""}
              </span>
              {person.religion && person.religion !== "Prefer not to say" ? (
                <span>
                  <Icon name="shield" size={14} /> Religion: {person.religion}
                </span>
              ) : null}
            </div>

            {person.notes ? <p className="person-note">{person.notes}</p> : null}

            <div className="person-linked">
              <strong>Linked cases ({links.length})</strong>
              {links.length === 0 ? <span className="muted small">No visible case link.</span> : null}
              <div className="case-chips">
                {links.map(({ caseRecord, role }) => (
                  <button key={caseRecord.id} type="button" className="case-chip" onClick={() => onOpenCase(caseRecord.id)}>
                    <span className="mono">{caseRecord.caseNumber}</span>
                    <span>{role}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="person-foot">
              <span className="muted small">Last case: {links[0] ? formatDate(links[0].caseRecord.reportedAt) : "—"}</span>
              <div className="flag-row">
                <button type="button" className="link-btn" onClick={() => setProfileId(person.id)}>
                  View profile
                </button>
                {links[0] ? <Badge tone="blue">{links[0].caseRecord.status}</Badge> : null}
              </div>
            </div>
          </article>
        ))}
      </div>

      <PersonProfileModal personId={profileId} open={!!profileId} onClose={() => setProfileId(null)} onOpenCase={onOpenCase} />
    </div>
  );
}
