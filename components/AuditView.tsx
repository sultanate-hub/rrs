"use client";

import { useMemo, useState } from "react";
import { useRRS } from "@/lib/store";
import { downloadCsv, formatDateTime } from "@/lib/utils";
import { Badge, EmptyState, Icon } from "./ui";

const groups = ["All", "case", "person", "evidence", "court", "auth", "report", "sync"];

export function AuditView() {
  const { data, currentUser, logExport } = useRRS();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("All");
  const [actor, setActor] = useState("All");

  const actors = useMemo(() => Array.from(new Set(data.audit.map((a) => a.actorName))).sort(), [data.audit]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.audit.filter((a) => {
      if (group !== "All" && !a.action.startsWith(`${group}.`)) return false;
      if (actor !== "All" && a.actorName !== actor) return false;
      if (!q) return true;
      return [a.actorName, a.action, a.table, a.recordId, a.detail, a.ip].join(" ").toLowerCase().includes(q);
    });
  }, [data.audit, query, group, actor]);

  if (currentUser?.role === "IPO" || currentUser?.role === "SUPERVISOR") {
    return <EmptyState icon="lock" title="Audit restricted" text="Audit trail is available to the Commander, Auditor and ICT Administrator." />;
  }

  const exportCsv = () => {
    logExport("Audit trail CSV exported");
    downloadCsv(
      "rrs-audit-trail.csv",
      rows.map((a) => ({
        time: formatDateTime(a.at),
        actor: a.actorName,
        action: a.action,
        table: a.table,
        record: a.recordId,
        detail: a.detail,
        ip: a.ip,
      }))
    );
  };

  return (
    <div className="stack">
      <section className="page-head">
        <div>
          <span className="eyebrow">Oversight</span>
          <h2>Audit trail</h2>
          <p>Every view, change, upload and export. Append-only; no user can edit or delete an entry.</p>
        </div>
        <div className="page-actions">
          <Badge tone="green">Append-only</Badge>
          <button type="button" className="btn btn-ghost" onClick={exportCsv}>
            <Icon name="download" size={16} /> Export CSV
          </button>
        </div>
      </section>

      <section className="card filter-card">
        <div className="filter-row">
          <label className="search-box">
            <Icon name="search" size={17} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Actor, action, case, detail or IP" />
          </label>
          <select value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Filter action group">
            {groups.map((g) => (
              <option key={g} value={g}>
                {g === "All" ? "All actions" : g}
              </option>
            ))}
          </select>
          <select value={actor} onChange={(e) => setActor(e.target.value)} aria-label="Filter actor">
            <option>All</option>
            {actors.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <h3>{rows.length} audit entries</h3>
            <p>Demo log is stored locally. Production uses an append-only database table with a hash chain.</p>
          </div>
        </div>
        {rows.length === 0 ? <EmptyState icon="audit" title="No audit entries match" /> : null}
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Table</th>
                <th>Record</th>
                <th>Detail</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td>{formatDateTime(a.at)}</td>
                  <td>{a.actorName}</td>
                  <td>
                    <Badge tone={a.action.includes("viewed") ? "gray" : a.action.includes("evidence") ? "purple" : a.action.includes("export") ? "amber" : "blue"}>
                      {a.action}
                    </Badge>
                  </td>
                  <td className="mono small">{a.table}</td>
                  <td className="mono small">{a.recordId}</td>
                  <td>{a.detail}</td>
                  <td className="mono small">{a.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="banner banner-blue">
        <Icon name="shield" size={18} />
        <span>
          Production adds a hash chain to every audit row, exports to immutable storage, and alerts on bulk downloads or after-hours access.
        </span>
      </div>
    </div>
  );
}
