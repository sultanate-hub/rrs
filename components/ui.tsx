"use client";

import React from "react";
import { initials } from "@/lib/utils";

export type IconName =
  | "dashboard"
  | "cases"
  | "people"
  | "search"
  | "audit"
  | "admin"
  | "logout"
  | "plus"
  | "camera"
  | "file"
  | "court"
  | "alert"
  | "check"
  | "clock"
  | "menu"
  | "close"
  | "chevron"
  | "sync"
  | "wifi"
  | "wifiOff"
  | "download"
  | "user"
  | "map"
  | "lock"
  | "arrowLeft"
  | "eye"
  | "upload"
  | "shield"
  | "scale"
  | "filter"
  | "print";

const paths: Record<IconName, React.ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  cases: (
    <>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
      <path d="M3 10h18" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.5a3 3 0 0 1 0 5.8" />
      <path d="M17.5 14.6A5.5 5.5 0 0 1 21 20" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  audit: (
    <>
      <path d="M12 3 4.5 6v6c0 4.5 3.2 7.4 7.5 9 4.3-1.6 7.5-4.5 7.5-9V6Z" />
      <path d="m8.8 12 2.1 2.1 4.3-4.3" />
    </>
  ),
  admin: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.1 2.1-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V20h-3v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1L6.6 16.6l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H5v-3h.5a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 2.1-2.1.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V4h3v.5a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 2.1 2.1-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.5v3h-.5a1.7 1.7 0 0 0-1.5 1Z" />
    </>
  ),
  logout: (
    <>
      <path d="M10 4H5a1.5 1.5 0 0 0-1.5 1.5v13A1.5 1.5 0 0 0 5 20h5" />
      <path d="M15 8l4 4-4 4" />
      <path d="M19 12H9" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8h3l1.5-2h7L17 8h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z" />
      <circle cx="12" cy="13" r="3.2" />
    </>
  ),
  file: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h4" />
    </>
  ),
  court: (
    <>
      <path d="M3 21h18" />
      <path d="M5 21V9M19 21V9" />
      <path d="M4 9h16" />
      <path d="M12 3 4 7h16Z" />
      <path d="M8 21v-7h8v7" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4 3 20h18Z" />
      <path d="M12 9v5" />
      <path d="M12 17.2v.1" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12 2.3 2.3 4.7-4.7" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </>
  ),
  close: (
    <>
      <path d="M6 6l12 12M18 6 6 18" />
    </>
  ),
  chevron: (
    <>
      <path d="m9 6 6 6-6 6" />
    </>
  ),
  sync: (
    <>
      <path d="M20 11a8 8 0 0 0-14.9-4L3 9" />
      <path d="M3 4v5h5" />
      <path d="M4 13a8 8 0 0 0 14.9 4L21 15" />
      <path d="M21 20v-5h-5" />
    </>
  ),
  wifi: (
    <>
      <path d="M3 9a13 13 0 0 1 18 0" />
      <path d="M6 12.5a9 9 0 0 1 12 0" />
      <path d="M9 16a5 5 0 0 1 6 0" />
      <path d="M12 20v.1" />
    </>
  ),
  wifiOff: (
    <>
      <path d="M3 3l18 18" />
      <path d="M8.5 12.8a6 6 0 0 1 5.7-1.1" />
      <path d="M5.5 9.2a11 11 0 0 1 4-1.7" />
      <path d="M14.5 7.8a11 11 0 0 1 4 1.5" />
      <path d="M12 20v.1" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v11" />
      <path d="m8 10 4 4 4-4" />
      <path d="M4 20h16" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  map: (
    <>
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  arrowLeft: (
    <>
      <path d="M19 12H5" />
      <path d="m11 6-6 6 6 6" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  upload: (
    <>
      <path d="M12 20V9" />
      <path d="m8 13 4-4 4 4" />
      <path d="M4 20h16" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 6v6c0 4.2 3 7 7 8.5 4-1.5 7-4.3 7-8.5V6Z" />
    </>
  ),
  scale: (
    <>
      <path d="M12 3v18" />
      <path d="M7 21h10" />
      <path d="M5 7h14" />
      <path d="m5 7-3 6h6Z" />
      <path d="m19 7-3 6h6Z" />
    </>
  ),
  filter: (
    <>
      <path d="M3 5h18l-7 8v6l-4-2v-4Z" />
    </>
  ),
  print: (
    <>
      <path d="M7 8V3h10v5" />
      <rect x="4" y="8" width="16" height="8" rx="2" />
      <path d="M7 13h10v8H7Z" />
    </>
  ),
};

export function Icon({ name, size = 18, className = "" }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export function Badge({ children, tone = "gray" }: { children: React.ReactNode; tone?: "gray" | "blue" | "green" | "amber" | "red" | "purple" | "navy" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const tone = status === "Open" ? "blue" : status === "Under Investigation" ? "amber" : status === "Court" ? "purple" : status === "Closed" ? "green" : "gray";
  return <Badge tone={tone}>{status}</Badge>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const tone = priority === "Critical" ? "red" : priority === "High" ? "amber" : priority === "Medium" ? "blue" : "gray";
  return <Badge tone={tone}>{priority}</Badge>;
}

export function RoleBadge({ role }: { role: string }) {
  const tone = role === "COMMANDER" ? "navy" : role === "SUPERVISOR" ? "purple" : role === "AUDITOR" ? "green" : role === "ADMIN" ? "gray" : "blue";
  return <Badge tone={tone}>{role}</Badge>;
}

export function Avatar({ name, size = 36, tone = "navy", src }: { name: string; size?: number; tone?: string; src?: string }) {
  return (
    <span className={`avatar avatar-${tone}`} style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {src ? <img src={src} alt="" /> : initials(name)}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "blue",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: IconName;
  tone?: "blue" | "green" | "amber" | "red" | "purple" | "navy";
}) {
  return (
    <div className="stat-card">
      <div className={`stat-icon stat-icon-${tone}`}>
        <Icon name={icon} size={20} />
      </div>
      <div className="stat-body">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {hint ? <div className="stat-hint">{hint}</div> : null}
      </div>
    </div>
  );
}

export function Modal({
  open,
  title,
  subtitle,
  onClose,
  children,
  wide = false,
  footer,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
  footer?: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? "modal-wide" : ""}`}>
        <div className="modal-head">
          <div>
            <h3>{title}</h3>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>
  );
}

export function Field({ label, hint, children, full = false }: { label: string; hint?: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`field ${full ? "field-full" : ""}`}>
      <span className="field-label">{label}</span>
      {children}
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

export function EmptyState({ icon = "file", title, text }: { icon?: IconName; title: string; text?: string }) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon name={icon} size={24} />
      </div>
      <strong>{title}</strong>
      {text ? <span>{text}</span> : null}
    </div>
  );
}
