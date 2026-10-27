"use client";

import { useMemo } from "react";
import { useRRS } from "@/lib/store";
import { downloadCsv, formatDate, formatDateTime, monthKey, roleLabel } from "@/lib/utils";
import { Badge, Icon, PriorityBadge, StatCard, StatusBadge } from "./ui";
import type { View } from "./Shell";

export function Dashboard({ onOpenCase, onNewCase, onNavigate }: { onOpenCase: (id: string) => void; onNewCase: () => void; onNavigate: (view: View) => void }) {
  const { currentUser, visibleCases, data, pendingCount, canEdit, canViewAudit, logExport } = useRRS();

  const stats = useMemo(() => {
    const cases = currentUser?.role === "ADMIN" ? [] : visibleCases;
    const active = cases.filter((c) => c.status === "Open" || c.status === "Under Investigation").length;
    const closed = cases.filter((c) => c.status === "Closed").length;
    const arrests = cases.reduce((sum, c) => sum + c.arrests.length, 0);
    const evidence = cases.reduce((sum, c) => sum + c.evidence.length, 0);
    const currentMonth = "2026-10";
    const thisMonth = cases.filter((c) => monthKey(c.reportedAt) === currentMonth).length;
    const visiblePersonIds = new Set<string>();
    cases.forEach((c) => c.persons.forEach((p) => visiblePersonIds.add(p.personId)));
    const wanted = data.persons.filter((p) => p.wanted && visiblePersonIds.has(p.id)).length;
    const byOffence = data.offences
      .map((o) => ({ ...o, count: cases.filter((c) => c.offenceId === o.id).length }))
      .filter((o) => o.count > 0)
      .sort((a, b) => b.count - a.count);
    return { total: cases.length, active, closed, arrests, evidence, thisMonth, wanted, byOffence };
  }, [currentUser, visibleCases, data]);

  const priorityCases = useMemo(
    () =>
      visibleCases
        .filter((c) => c.priority === "Critical" || c.priority === "High")
        .sort((a, b) => (a.priority === "Critical" ? -1 : 1) - (b.priority === "Critical" ? -1 : 1))
        .slice(0, 5),
    [visibleCases]
  );

  const recent = useMemo(() => [...visibleCases].sort((a, b) => +new Date(b.reportedAt) - +new Date(a.reportedAt)).slice(0, 6), [visibleCases]);

  const exportMonthly = () => {
    logExport("Monthly case CSV exported");
    downloadCsv(
      "rrs-monthly-cases-2026-10.csv",
      visibleCases.map((c) => ({
        case_number: c.caseNumber,
        offence: data.offences.find((o) => o.id === c.offenceId)?.name ?? "",
        status: c.status,
        priority: c.priority,
        assigned: data.officers.find((o) => o.id === c.assignedOfficerId)?.name ?? "",
        reported: formatDate(c.reportedAt),
      }))
    );
  };

  if (currentUser?.role === "ADMIN") {
    return (
      <div className="stack">
        <section className="hero-card">
          <div>
            <span className="eyebrow">Administration</span>
            <h2>ICT console</h2>
            <p>Manage accounts, units and offence types. Administration is deliberately separated from case narratives.</p>
          </div>
          <button className="btn btn-primary" type="button" onClick={() => onNavigate("admin")}>
            Open administration <Icon name="chevron" size={16} />
          </button>
        </section>
        <div className="grid-3">
          <StatCard label="Officer accounts" value={data.officers.length} hint="All units" icon="people" tone="blue" />
          <StatCard label="Units" value={data.units.length} hint="Active structure" icon="map" tone="navy" />
          <StatCard label="Offence types" value={data.offences.length} hint="Legal taxonomy" icon="scale" tone="purple" />
        </div>
        <section className="card">
          <div className="card-head">
            <div>
              <h3>Separation of duties</h3>
              <p>ICT cannot read case narratives or evidence by default.</p>
            </div>
            <Badge tone="green">Enforced</Badge>
          </div>
          <p className="muted">
            In production, an administrator can manage accounts and audit system health, but case content is restricted to operational roles. Any admin access to a case requires a written approval and is logged.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="stack">
      {pendingCount > 0 ? (
        <div className="banner banner-amber">
          <Icon name="sync" size={18} />
          <span>
            <strong>{pendingCount} offline draft{pendingCount === 1 ? "" : "s"}</strong> waiting to sync. Switch online and use “Sync now”.
          </span>
        </div>
      ) : null}

      <section className="hero-card">
        <div>
          <span className="eyebrow">{currentUser?.role === "COMMANDER" ? "Command overview" : currentUser?.role === "SUPERVISOR" ? "Unit overview" : currentUser?.role === "AUDITOR" ? "Oversight" : "My caseload"}</span>
          <h2>
            Good evening, {currentUser?.rank} {currentUser?.name.split(" ")[0]}.
          </h2>
          <p>
            {currentUser?.role === "COMMANDER"
              ? "Live picture of anti-social vices cases, arrests, evidence and court activity across the command."
              : currentUser?.role === "SUPERVISOR"
                ? "Your unit's cases, priority matters and officer workload."
                : currentUser?.role === "AUDITOR"
                  ? "Read-only oversight of records, access and evidence handling."
                  : "Your assigned cases, priority matters and pending actions."}
          </p>
        </div>
        <div className="hero-actions">
          {canEdit ? (
            <button className="btn btn-primary" type="button" onClick={onNewCase}>
              <Icon name="plus" size={16} /> New case
            </button>
          ) : null}
          <button className="btn btn-ghost" type="button" onClick={() => onNavigate("search")}>
            <Icon name="search" size={16} /> Search
          </button>
          <button className="btn btn-ghost" type="button" onClick={exportMonthly}>
            <Icon name="download" size={16} /> Monthly CSV
          </button>
        </div>
      </section>

      <div className="grid-6">
        <StatCard label="Total cases" value={stats.total} hint="Visible to your role" icon="cases" tone="blue" />
        <StatCard label="Active" value={stats.active} hint="Open + under investigation" icon="clock" tone="amber" />
        <StatCard label="Closed" value={stats.closed} hint="Resolved / no further action" icon="check" tone="green" />
        <StatCard label="Arrests" value={stats.arrests} hint="Linked to visible cases" icon="lock" tone="navy" />
        <StatCard label="Evidence items" value={stats.evidence} hint="Hashed + chain of custody" icon="file" tone="purple" />
        <StatCard label="Wanted persons" value={stats.wanted} hint="Active warrant / wanted flag" icon="alert" tone="red" />
      </div>

      <div className="grid-2-1">
        <section className="card">
          <div className="card-head">
            <div>
              <h3>Recent cases</h3>
              <p>Latest reports visible to your role.</p>
            </div>
            <button className="link-btn" type="button" onClick={() => onNavigate("cases")}>
              View register <Icon name="chevron" size={14} />
            </button>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Case</th>
                  <th>Offence</th>
                  <th>Reported</th>
                  <th>Status</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((c) => (
                  <tr key={c.id} className="row-click" onClick={() => onOpenCase(c.id)}>
                    <td>
                      <strong className="mono">{c.caseNumber}</strong>
                      <span className="cell-sub">{c.location}</span>
                    </td>
                    <td>{data.offences.find((o) => o.id === c.offenceId)?.name}</td>
                    <td>{formatDate(c.reportedAt)}</td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td>
                      <PriorityBadge priority={c.priority} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <div>
              <h3>Cases by offence</h3>
              <p>Visible caseload mix.</p>
            </div>
          </div>
          <div className="bars">
            {stats.byOffence.slice(0, 7).map((o) => {
              const max = Math.max(...stats.byOffence.map((x) => x.count), 1);
              return (
                <div className="bar-row" key={o.id}>
                  <div className="bar-label">
                    <span>{o.name}</span>
                    <strong>{o.count}</strong>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${Math.max(8, (o.count / max) * 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="grid-2">
        <section className="card">
          <div className="card-head">
            <div>
              <h3>Priority queue</h3>
              <p>Critical and high-priority cases.</p>
            </div>
            <Badge tone="red">{priorityCases.length} open</Badge>
          </div>
          <div className="priority-list">
            {priorityCases.length === 0 ? <p className="muted">No high-priority cases in your view.</p> : null}
            {priorityCases.map((c) => (
              <button key={c.id} type="button" className="priority-row" onClick={() => onOpenCase(c.id)}>
                <span className={`priority-dot ${c.priority === "Critical" ? "dot-red" : "dot-amber"}`} />
                <span className="priority-main">
                  <strong>{c.caseNumber}</strong>
                  <span>
                    {data.offences.find((o) => o.id === c.offenceId)?.name} · {c.location}
                  </span>
                </span>
                <PriorityBadge priority={c.priority} />
              </button>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <div>
              <h3>{currentUser?.role === "SUPERVISOR" ? "Unit snapshot" : currentUser?.role === "AUDITOR" ? "Audit watch" : "My actions"}</h3>
              <p>{currentUser?.role === "SUPERVISOR" ? "Workload and court dates." : currentUser?.role === "AUDITOR" ? "Recent access and export events." : "What needs your attention."}</p>
            </div>
            {canViewAudit ? (
              <button className="link-btn" type="button" onClick={() => onNavigate("audit")}>
                Audit <Icon name="chevron" size={14} />
              </button>
            ) : null}
          </div>
          {currentUser?.role === "AUDITOR" || currentUser?.role === "COMMANDER" ? (
            <div className="mini-list">
              {data.audit.slice(0, 5).map((a) => (
                <div className="mini-row" key={a.id}>
                  <span className="mini-icon">
                    <Icon name="eye" size={15} />
                  </span>
                  <div>
                    <strong>{a.action.replaceAll(".", " · ")}</strong>
                    <span>
                      {a.actorName} · {formatDateTime(a.at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mini-list">
              <div className="mini-row">
                <span className="mini-icon">
                  <Icon name="clock" size={15} />
                </span>
                <div>
                  <strong>{stats.active} active cases</strong>
                  <span>Keep statements and evidence current.</span>
                </div>
              </div>
              <div className="mini-row">
                <span className="mini-icon">
                  <Icon name="court" size={15} />
                </span>
                <div>
                  <strong>{visibleCases.filter((c) => c.status === "Court").length} cases in court</strong>
                  <span>Confirm next hearing dates.</span>
                </div>
              </div>
              <div className="mini-row">
                <span className="mini-icon">
                  <Icon name="file" size={15} />
                </span>
                <div>
                  <strong>{stats.evidence} evidence items</strong>
                  <span>Each item is hashed and logged.</span>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      <p className="muted small">
        Role: {roleLabel(currentUser?.role ?? "IPO")} · Unit: {data.units.find((u) => u.id === currentUser?.unitId)?.name} · Visible cases: {stats.total}
      </p>
    </div>
  );
}
