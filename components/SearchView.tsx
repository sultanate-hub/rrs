"use client";

import { useMemo } from "react";
import { useRRS } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import { Avatar, Badge, EmptyState, Icon, PriorityBadge, StatusBadge } from "./ui";

export function SearchView({
  query,
  setQuery,
  onOpenCase,
}: {
  query: string;
  setQuery: (value: string) => void;
  onOpenCase: (id: string) => void;
}) {
  const { visibleCases, data } = useRRS();
  const q = query.trim().toLowerCase();

  const visiblePersonIds = useMemo(() => {
    const ids = new Set<string>();
    visibleCases.forEach((c) => c.persons.forEach((p) => ids.add(p.personId)));
    return ids;
  }, [visibleCases]);

  const cases = useMemo(() => {
    if (!q) return [];
    return visibleCases
      .filter((c) => {
        const off = data.offences.find((o) => o.id === c.offenceId);
        const officer = data.officers.find((o) => o.id === c.assignedOfficerId);
        const people = c.persons.map((p) => data.persons.find((x) => x.id === p.personId)).filter(Boolean);
        const haystack = [
          c.caseNumber,
          c.location,
          c.complainantName,
          c.complainantPhone,
          c.narrative,
          off?.name ?? "",
          off?.code ?? "",
          officer?.name ?? "",
          ...people.map((p) => `${p?.fullName} ${p?.alias ?? ""} ${p?.phone ?? ""} ${p?.nin ?? ""}`),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, 12);
  }, [q, visibleCases, data]);

  const persons = useMemo(() => {
    if (!q) return [];
    return data.persons
      .filter((p) => visiblePersonIds.has(p.id))
      .filter((p) => [p.fullName, p.alias ?? "", p.phone ?? "", p.nin ?? "", p.address ?? ""].join(" ").toLowerCase().includes(q))
      .slice(0, 10);
  }, [q, data.persons, visiblePersonIds]);

  const total = cases.length + persons.length;

  return (
    <div className="stack">
      <section className="search-hero">
        <span className="eyebrow">Search</span>
        <h2>Find a case, person or phone number</h2>
        <p>Search is limited to records your role can see. Every sensitive view is audit-logged.</p>
        <label className="search-box search-box-lg">
          <Icon name="search" size={20} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. RRS/ASV/2026/006, Chinedu, 0803 000 0012"
            autoFocus
          />
        </label>
        <div className="search-hints">
          <span>Try:</span>
          {["Cultism", "Chinedu", "Surulere", "0803 000 0012", "RRS/ASV/2026/004"].map((h) => (
            <button key={h} type="button" className="chip chip-gray" onClick={() => setQuery(h)}>
              {h}
            </button>
          ))}
        </div>
      </section>

      {!q ? (
        <section className="card">
          <div className="card-head">
            <div>
              <h3>Search rules</h3>
              <p>What the system checks.</p>
            </div>
          </div>
          <div className="search-rules">
            <div>
              <Icon name="cases" size={18} />
              <strong>Cases</strong>
              <span>Case number, offence, location, narrative, complainant, assigned officer.</span>
            </div>
            <div>
              <Icon name="people" size={18} />
              <strong>Persons</strong>
              <span>Name, alias, phone, NIN, address — only persons linked to your visible cases.</span>
            </div>
            <div>
              <Icon name="audit" size={18} />
              <strong>Audited</strong>
              <span>Searches of sensitive records are recorded with actor, time and IP.</span>
            </div>
          </div>
        </section>
      ) : (
        <>
          <div className="search-count">
            <strong>{total}</strong> result{total === 1 ? "" : "s"} for “{query}”
          </div>

          {cases.length > 0 ? (
            <section className="card">
              <div className="card-head">
                <div>
                  <h3>Cases</h3>
                  <p>Matching case records.</p>
                </div>
                <Badge tone="blue">{cases.length}</Badge>
              </div>
              <div className="search-results">
                {cases.map((c) => (
                  <button key={c.id} type="button" className="search-result" onClick={() => onOpenCase(c.id)}>
                    <span className="result-icon">
                      <Icon name="cases" size={18} />
                    </span>
                    <span className="result-main">
                      <strong className="mono">{c.caseNumber}</strong>
                      <span>
                        {data.offences.find((o) => o.id === c.offenceId)?.name} · {c.location} · {formatDate(c.reportedAt)}
                      </span>
                    </span>
                    <StatusBadge status={c.status} />
                    <PriorityBadge priority={c.priority} />
                    <Icon name="chevron" size={16} />
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {persons.length > 0 ? (
            <section className="card">
              <div className="card-head">
                <div>
                  <h3>Persons</h3>
                  <p>Matching persons linked to your visible cases.</p>
                </div>
                <Badge tone="blue">{persons.length}</Badge>
              </div>
              <div className="search-results">
                {persons.map((p) => {
                  const links = visibleCases.filter((c) => c.persons.some((x) => x.personId === p.id));
                  return (
                    <div className="search-result search-result-static" key={p.id}>
                      <Avatar name={p.fullName} size={36} />
                      <span className="result-main">
                        <strong>{p.fullName}</strong>
                        <span>
                          {p.alias ? `“${p.alias}” · ` : ""}
                          {p.phone || "No phone"} · {p.address || "No address"}
                        </span>
                      </span>
                      {p.wanted ? <Badge tone="red">Wanted</Badge> : null}
                      <div className="case-chips">
                        {links.map((c) => (
                          <button key={c.id} type="button" className="case-chip" onClick={() => onOpenCase(c.id)}>
                            <span className="mono">{c.caseNumber}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          {total === 0 ? <EmptyState icon="search" title="No match" text="Try a case number, surname, phone number or location." /> : null}
        </>
      )}
    </div>
  );
}
