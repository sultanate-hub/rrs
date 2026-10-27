"use client";

import { useMemo, useState } from "react";
import { useRRS } from "@/lib/store";
import { downloadCsv, formatDate } from "@/lib/utils";
import { Badge, EmptyState, Icon, PriorityBadge, StatusBadge } from "./ui";

export function CaseList({ onOpenCase, onNewCase }: { onOpenCase: (id: string) => void; onNewCase: () => void }) {
  const { visibleCases, data, canEdit, currentUser, logExport } = useRRS();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [offence, setOffence] = useState("All");
  const [priority, setPriority] = useState("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visibleCases
      .filter((c) => (status === "All" ? true : c.status === status))
      .filter((c) => (offence === "All" ? true : c.offenceId === offence))
      .filter((c) => (priority === "All" ? true : c.priority === priority))
      .filter((c) => {
        if (!q) return true;
        const officer = data.officers.find((o) => o.id === c.assignedOfficerId);
        const off = data.offences.find((o) => o.id === c.offenceId);
        const personNames = c.persons
          .map((p) => data.persons.find((x) => x.id === p.personId)?.fullName ?? "")
          .join(" ");
        return [c.caseNumber, c.location, c.complainantName, c.complainantPhone, officer?.name ?? "", off?.name ?? "", personNames]
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => +new Date(b.reportedAt) - +new Date(a.reportedAt));
  }, [visibleCases, data, query, status, offence, priority]);

  const exportCsv = () => {
    logExport("Case register CSV exported");
    downloadCsv(
      "rrs-case-register.csv",
      filtered.map((c) => ({
        case_number: c.caseNumber,
        offence: data.offences.find((o) => o.id === c.offenceId)?.name ?? "",
        location: c.location,
        reported: formatDate(c.reportedAt),
        assigned: data.officers.find((o) => o.id === c.assignedOfficerId)?.name ?? "",
        status: c.status,
        priority: c.priority,
        sensitive: c.sensitive ? "Yes" : "No",
      }))
    );
  };

  return (
    <div className="stack">
      <section className="page-head">
        <div>
          <span className="eyebrow">Register</span>
          <h2>Case register</h2>
          <p>
            {filtered.length} of {visibleCases.length} cases visible to {currentUser?.role === "IPO" ? "you" : "your role"}.
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-ghost" onClick={exportCsv}>
            <Icon name="download" size={16} /> Export CSV
          </button>
          {canEdit ? (
            <button type="button" className="btn btn-primary" onClick={onNewCase}>
              <Icon name="plus" size={16} /> New case
            </button>
          ) : null}
        </div>
      </section>

      <section className="card filter-card">
        <div className="filter-row">
          <label className="search-box">
            <Icon name="search" size={17} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Case no., offence, location, name or phone" />
          </label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter status">
            {["All", "Open", "Under Investigation", "Court", "Closed"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select value={offence} onChange={(e) => setOffence(e.target.value)} aria-label="Filter offence">
            <option value="All">All offences</option>
            {data.offences.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Filter priority">
            {["All", "Critical", "High", "Medium", "Low"].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="card">
        <div className="table-wrap">
          <table className="table table-cases">
            <thead>
              <tr>
                <th>Case</th>
                <th>Offence</th>
                <th>Reported</th>
                <th>Assigned</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Flags</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const officer = data.officers.find((o) => o.id === c.assignedOfficerId);
                const off = data.offences.find((o) => o.id === c.offenceId);
                return (
                  <tr key={c.id} className="row-click" onClick={() => onOpenCase(c.id)}>
                    <td>
                      <strong className="mono">{c.caseNumber}</strong>
                      <span className="cell-sub">{c.location}</span>
                    </td>
                    <td>
                      {off?.name}
                      <span className="cell-sub">{off?.code}</span>
                    </td>
                    <td>{formatDate(c.reportedAt)}</td>
                    <td>
                      {officer ? `${officer.rank} ${officer.name}` : "—"}
                      <span className="cell-sub">{data.units.find((u) => u.id === officer?.unitId)?.short}</span>
                    </td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td>
                      <PriorityBadge priority={c.priority} />
                    </td>
                    <td>
                      <div className="flag-row">
                        {c.sensitive ? <Badge tone="red">Sensitive</Badge> : null}
                        {c.syncStatus === "pending" ? <Badge tone="amber">Offline</Badge> : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 ? <EmptyState title="No cases match" text="Adjust the filters or register a new case." /> : null}
      </section>
    </div>
  );
}
