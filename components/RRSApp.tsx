"use client";

import { useEffect, useState } from "react";
import { useRRS } from "@/lib/store";
import { AdminView } from "./AdminView";
import { AuditView } from "./AuditView";
import { CaseDetail } from "./CaseDetail";
import { CaseList } from "./CaseList";
import { Dashboard } from "./Dashboard";
import { Login } from "./Login";
import { NewCaseModal } from "./NewCaseModal";
import { PeopleView } from "./PeopleView";
import { SearchView } from "./SearchView";
import { Shell, type View } from "./Shell";
import { Icon } from "./ui";

export function RRSApp() {
  const { currentUser, hydrated } = useRRS();
  const [view, setView] = useState<View>("dashboard");
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [newCaseOpen, setNewCaseOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setView("dashboard");
      setSelectedCaseId(null);
      setQuery("");
      setNewCaseOpen(false);
    }
  }, [currentUser]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view, currentUser]);

  if (!hydrated) {
    return (
      <main className="loading-screen">
        <span className="brand-crest">
          <Icon name="shield" size={28} />
        </span>
        <strong>RRS Anti-Social Vices</strong>
        <span>Preparing demo workspace…</span>
      </main>
    );
  }

  if (!currentUser) return <Login />;

  const navigate = (next: View) => {
    if (next === "case" && !selectedCaseId) {
      setView("cases");
      return;
    }
    setView(next);
    if (next === "cases") setSelectedCaseId(null);
  };

  const openCase = (id: string) => {
    setSelectedCaseId(id);
    setView("case");
  };

  const onCreated = (id: string) => {
    setNewCaseOpen(false);
    openCase(id);
  };

  return (
    <>
      <Shell
        view={view}
        onNavigate={navigate}
        onSearch={(q) => {
          setQuery(q);
          if (q.trim()) setView("search");
        }}
        query={query}
        setQuery={setQuery}
      >
        {view === "dashboard" ? (
          <Dashboard onOpenCase={openCase} onNewCase={() => setNewCaseOpen(true)} onNavigate={navigate} />
        ) : null}
        {view === "cases" ? <CaseList onOpenCase={openCase} onNewCase={() => setNewCaseOpen(true)} /> : null}
        {view === "case" && selectedCaseId ? (
          <CaseDetail caseId={selectedCaseId} onBack={() => navigate("cases")} onOpenCase={openCase} />
        ) : null}
        {view === "people" ? <PeopleView onOpenCase={openCase} /> : null}
        {view === "search" ? <SearchView query={query} setQuery={setQuery} onOpenCase={openCase} /> : null}
        {view === "audit" ? <AuditView /> : null}
        {view === "admin" ? <AdminView /> : null}
      </Shell>
      <NewCaseModal open={newCaseOpen} onClose={() => setNewCaseOpen(false)} onCreated={onCreated} />
    </>
  );
}
