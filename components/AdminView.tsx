"use client";

import { useRRS } from "@/lib/store";
import { roleLabel } from "@/lib/utils";
import { Avatar, Badge, Icon, RoleBadge } from "./ui";

export function AdminView() {
  const { data, resetDemo } = useRRS();

  return (
    <div className="stack">
      <section className="page-head">
        <div>
          <span className="eyebrow">ICT administration</span>
          <h2>Administration</h2>
          <p>Accounts, units and offence taxonomy. Case narratives are not visible to this role.</p>
        </div>
        <div className="page-actions">
          <Badge tone="green">Separation of duties</Badge>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <h3>Officer accounts</h3>
            <p>Individual accounts only. Shared logins are not permitted.</p>
          </div>
          <button type="button" className="btn btn-ghost" disabled title="Demo only">
            <Icon name="plus" size={16} /> Add account
          </button>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Officer</th>
                <th>Force No.</th>
                <th>Rank</th>
                <th>Unit</th>
                <th>Role</th>
                <th>MFA</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.officers.map((o) => (
                <tr key={o.id}>
                  <td>
                    <div className="user-cell">
                      <Avatar name={o.name} size={32} />
                      <strong>{o.name}</strong>
                    </div>
                  </td>
                  <td className="mono">{o.forceNumber}</td>
                  <td>{o.rank}</td>
                  <td>{data.units.find((u) => u.id === o.unitId)?.short}</td>
                  <td>
                    <RoleBadge role={o.role} />
                  </td>
                  <td>
                    {o.role === "IPO" ? <Badge tone="gray">Optional</Badge> : <Badge tone="green">Required</Badge>}
                  </td>
                  <td>
                    <Badge tone={o.active ? "green" : "red"}>{o.active ? "Active" : "Disabled"}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid-2">
        <section className="card">
          <div className="card-head">
            <div>
              <h3>Units</h3>
              <p>Case visibility is scoped by unit.</p>
            </div>
          </div>
          <div className="admin-list">
            {data.units.map((u) => (
              <div className="admin-row" key={u.id}>
                <span className="admin-icon">
                  <Icon name="map" size={17} />
                </span>
                <div>
                  <strong>{u.name}</strong>
                  <span>{u.short}</span>
                </div>
                <Badge tone="blue">{data.officers.filter((o) => o.unitId === u.id).length} officers</Badge>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <div>
              <h3>Offence taxonomy</h3>
              <p>Legal names, codes and references.</p>
            </div>
          </div>
          <div className="admin-list">
            {data.offences.map((o) => (
              <div className="admin-row" key={o.id}>
                <span className="admin-icon">
                  <Icon name="scale" size={17} />
                </span>
                <div>
                  <strong>{o.name}</strong>
                  <span className="mono">{o.code} · {o.law}</span>
                </div>
                <Badge tone="purple">{o.category}</Badge>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card">
        <div className="card-head">
          <div>
            <h3>Security posture</h3>
            <p>What the production build must enforce.</p>
          </div>
        </div>
        <div className="security-grid">
          {[
            ["Individual accounts", "No shared logins; disable on transfer."],
            ["MFA", "Required for admin, supervisor, commander."],
            ["Least privilege", "Admin cannot read case narratives."],
            ["Audit", "Views, edits, downloads and exports are logged."],
            ["Evidence", "SHA-256 + chain of custody, private storage."],
            ["Backups", "Daily encrypted backup + restore test."],
          ].map(([title, text]) => (
            <div className="security-item" key={title}>
              <Icon name="shield" size={18} />
              <div>
                <strong>{title}</strong>
                <span>{text}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card danger-zone">
        <div className="card-head">
          <div>
            <h3>Demo controls</h3>
            <p>Reset all synthetic cases, persons and audit entries to the seed set.</p>
          </div>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => {
              if (window.confirm("Reset the demo data? All demo changes will be lost.")) resetDemo();
            }}
          >
            Reset demo data
          </button>
        </div>
        <p className="muted small">
          This resets only the local demo store. It does not touch Supabase or any production data.
        </p>
      </section>

      <p className="muted small">
        Signed in as {data.officers.find((o) => o.role === "ADMIN")?.name} · {roleLabel("ADMIN")} · Demo build
      </p>
    </div>
  );
}
