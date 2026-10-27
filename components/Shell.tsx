"use client";

import React, { useState } from "react";
import { useRRS } from "@/lib/store";
import { roleLabel } from "@/lib/utils";
import { Avatar, Icon, RoleBadge, type IconName } from "./ui";

export type View = "dashboard" | "cases" | "case" | "people" | "search" | "audit" | "admin";

const titles: Record<View, string> = {
  dashboard: "Command dashboard",
  cases: "Case register",
  case: "Case file",
  people: "Persons of interest",
  search: "Search records",
  audit: "Audit trail",
  admin: "Administration",
};

export function Shell({
  view,
  onNavigate,
  onSearch,
  query,
  setQuery,
  children,
}: {
  view: View;
  onNavigate: (view: View) => void;
  onSearch: (query: string) => void;
  query: string;
  setQuery: (value: string) => void;
  children: React.ReactNode;
}) {
  const { currentUser, pendingCount, offline, toggleOffline, syncNow, logout, canViewAudit, canAdmin } = useRRS();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!currentUser) return null;

  const nav: Array<{ view: View; label: string; icon: IconName; show: boolean }> = [
    { view: "dashboard", label: "Dashboard", icon: "dashboard", show: true },
    { view: "cases", label: "Cases", icon: "cases", show: currentUser.role !== "ADMIN" },
    { view: "people", label: "Persons", icon: "people", show: currentUser.role !== "ADMIN" },
    { view: "search", label: "Search", icon: "search", show: currentUser.role !== "ADMIN" },
    { view: "audit", label: "Audit trail", icon: "audit", show: canViewAudit },
    { view: "admin", label: "Administration", icon: "admin", show: canAdmin },
  ];

  const go = (next: View) => {
    onNavigate(next);
    setMobileOpen(false);
  };

  const refreshApp = async () => {
    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((reg) => reg.unregister()));
      }
    } finally {
      window.location.reload();
    }
  };

  return (
    <div className={`app-shell ${mobileOpen ? "nav-open" : ""}`}>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-crest brand-crest-sm">
            <Icon name="shield" size={20} />
          </span>
          <div>
            <strong>RRS · ASV</strong>
            <span>Case Management</span>
          </div>
        </div>

        <nav className="nav" aria-label="Main navigation">
          {nav
            .filter((n) => n.show)
            .map((item) => (
              <button
                key={item.view}
                type="button"
                className={`nav-item ${view === item.view || (view === "case" && item.view === "cases") ? "nav-item-active" : ""}`}
                onClick={() => go(item.view)}
              >
                <Icon name={item.icon} size={19} />
                <span>{item.label}</span>
                {item.view === "cases" && pendingCount > 0 ? <span className="nav-count">{pendingCount}</span> : null}
              </button>
            ))}
        </nav>

        <div className="sidebar-status">
          <div className={`sync-chip ${offline ? "sync-chip-offline" : "sync-chip-online"}`}>
            <Icon name={offline ? "wifiOff" : "wifi"} size={15} />
            <span>{offline ? "Offline mode" : "Online"}</span>
          </div>
          <div className="sync-row">
            <span className="muted">{pendingCount} pending draft{pendingCount === 1 ? "" : "s"}</span>
            <button type="button" className="link-btn" onClick={syncNow} disabled={pendingCount === 0}>
              Sync now
            </button>
          </div>
          <button type="button" className="subtle-btn" onClick={toggleOffline}>
            {offline ? "Go online" : "Simulate offline"}
          </button>
          <button type="button" className="subtle-btn" onClick={refreshApp}>
            Refresh app
          </button>
        </div>

        <div className="sidebar-user">
          <Avatar name={currentUser.name} size={38} />
          <div className="sidebar-user-body">
            <strong>
              {currentUser.rank} {currentUser.name}
            </strong>
            <span>{currentUser.forceNumber} · {roleLabel(currentUser.role)}</span>
          </div>
          <button type="button" className="icon-btn icon-btn-dark" onClick={logout} aria-label="Exit demo">
            <Icon name="logout" size={18} />
          </button>
        </div>
      </aside>

      {mobileOpen ? <button type="button" className="nav-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} /> : null}

      <div className="main">
        <header className="topbar">
          <button type="button" className="icon-btn mobile-only" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
            <Icon name="menu" />
          </button>
          <div className="topbar-title">
            <span className="topbar-kicker">RRS Anti-Social Vices</span>
            <h1>{titles[view]}</h1>
          </div>

          <div className="topbar-search">
            <Icon name="search" size={17} />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value.trim()) onNavigate("search");
              }}
              placeholder="Search case no., name or phone"
              aria-label="Search records"
            />
          </div>

          <div className="topbar-actions">
            <span className="chip chip-amber">DEMO DATA</span>
            <span className={`chip ${offline ? "chip-red" : "chip-green"}`}>
              <span className="dot" /> {offline ? "Offline" : "Live"}
            </span>
            <div className="topbar-user">
              <div>
                <strong>{currentUser.rank} {currentUser.name.split(" ")[0]}</strong>
                <RoleBadge role={currentUser.role} />
              </div>
              <Avatar name={currentUser.name} size={34} />
            </div>
          </div>
        </header>

        <div className="content">{children}</div>

        <footer className="foot">
          <span>RRS Anti-Social Vices Management System · Demo build</span>
          <span>Synthetic data only · Not for operational use</span>
        </footer>
      </div>
    </div>
  );
}
