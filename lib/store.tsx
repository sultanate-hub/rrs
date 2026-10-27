"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEMO_CREDENTIALS } from "./demo-auth";
import { seedData } from "./seed";
import type {
  AppData,
  Arrest,
  CaseRecord,
  CaseStatus,
  Evidence,
  Hearing,
  Officer,
  Person,
  PersonGender,
  PersonRole,
  Priority,
} from "./types";

const STORAGE_KEY = "rrs-asv-demo-v1";

export interface NewCaseInput {
  offenceId: string;
  reportedAt: string;
  location: string;
  narrative: string;
  priority: Priority;
  sensitive: boolean;
  assignedOfficerId: string;
  complainantName: string;
  complainantPhone: string;
}

export interface NewPersonInput {
  fullName: string;
  alias?: string;
  gender: PersonGender;
  dob?: string;
  phone?: string;
  address?: string;
  nin?: string;
  notes?: string;
  role: PersonRole;
  photoUrl?: string;
  fingerprint?: Person["fingerprint"];
  religion?: string;
  nationality?: string;
  stateOfOrigin?: string;
  lga?: string;
  tribe?: string;
  occupation?: string;
  language?: string;
  interpreterNeeded?: boolean;
}

export interface NewEvidenceInput {
  type: Evidence["type"];
  description: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  hash: string;
  collectedBy: string;
  collectedAt: string;
  location: string;
  sealNumber: string;
}

export interface NewHearingInput {
  court: string;
  hearingAt: string;
  purpose: string;
  outcome: string;
  nextAt?: string;
}

export interface NewArrestInput {
  personId: string;
  arrestedAt: string;
  location: string;
  officerId: string;
  charges: string;
  custodyStatus: Arrest["custodyStatus"];
  notes?: string;
}

interface RRSContextValue {
  data: AppData;
  currentUser: Officer | null;
  visibleCases: CaseRecord[];
  pendingCount: number;
  offline: boolean;
  hydrated: boolean;
  login: (forceNumber: string, password: string) => boolean;
  logout: () => void;
  addCase: (input: NewCaseInput) => CaseRecord;
  addPersonToCase: (caseId: string, input: NewPersonInput) => void;
  addEvidence: (caseId: string, input: NewEvidenceInput) => void;
  addHearing: (caseId: string, input: NewHearingInput) => void;
  addArrest: (caseId: string, input: NewArrestInput) => void;
  setCaseStatus: (caseId: string, status: CaseStatus) => void;
  assignCase: (caseId: string, officerId: string) => void;
  logView: (caseId: string) => void;
  logExport: (detail: string) => void;
  toggleOffline: () => void;
  syncNow: () => void;
  resetDemo: () => void;
  getPerson: (id: string) => Person | undefined;
  getOfficer: (id: string) => Officer | undefined;
  getOffence: (id: string) => { id: string; code: string; name: string; category: string; law: string } | undefined;
  canEdit: boolean;
  canViewAudit: boolean;
  canAdmin: boolean;
  canAssign: boolean;
}

const RRSContext = createContext<RRSContextValue | null>(null);

function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
}

export function RRSProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(seedData);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setData(JSON.parse(raw) as AppData);
    } catch {
      /* ignore corrupt demo storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* storage full or blocked; demo continues in memory */
    }
  }, [data, hydrated]);

  const currentUser = useMemo(
    () => data.officers.find((o) => o.id === currentUserId) ?? null,
    [data.officers, currentUserId]
  );

  const getPerson = useCallback((id: string) => data.persons.find((p) => p.id === id), [data.persons]);
  const getOfficer = useCallback((id: string) => data.officers.find((o) => o.id === id), [data.officers]);
  const getOffence = useCallback((id: string) => data.offences.find((o) => o.id === id), [data.offences]);

  const visibleCases = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === "COMMANDER" || currentUser.role === "AUDITOR") return data.cases;
    if (currentUser.role === "SUPERVISOR") return data.cases.filter((c) => c.unitId === currentUser.unitId);
    if (currentUser.role === "IPO") return data.cases.filter((c) => c.assignedOfficerId === currentUser.id);
    return [];
  }, [currentUser, data.cases]);

  const audit = useCallback(
    (action: string, table: string, recordId: string, detail: string) => {
      if (!currentUser) return;
      setData((prev) => ({
        ...prev,
        audit: [
          {
            id: makeId("au"),
            at: new Date().toISOString(),
            actorId: currentUser.id,
            actorName: `${currentUser.rank} ${currentUser.name}`,
            action,
            table,
            recordId,
            detail,
            ip: "demo-console",
          },
          ...prev.audit,
        ],
      }));
    },
    [currentUser]
  );

  const login = useCallback(
    (forceNumber: string, password: string) => {
      const officer = data.officers.find((o) => o.forceNumber === forceNumber.trim() && o.active);
      if (!officer || DEMO_CREDENTIALS[officer.forceNumber] !== password) return false;
      setCurrentUserId(officer.id);
      setData((prev) => ({
        ...prev,
        audit: [
          {
            id: makeId("au"),
            at: new Date().toISOString(),
            actorId: officer.id,
            actorName: `${officer.rank} ${officer.name}`,
            action: "auth.login",
            table: "profiles",
            recordId: officer.id,
            detail: "Signed in (demo credential)",
            ip: "demo-console",
          },
          ...prev.audit,
        ],
      }));
      return true;
    },
    [data.officers]
  );

  const logout = useCallback(() => {
    if (currentUser) audit("auth.logout", "profiles", currentUser.id, "Signed out");
    setCurrentUserId(null);
  }, [audit, currentUser]);

  const addCase = useCallback(
    (input: NewCaseInput) => {
      if (!currentUser) throw new Error("Not signed in");
      const assigned = data.officers.find((o) => o.id === input.assignedOfficerId) ?? currentUser;
      const nextNumber =
        data.cases.reduce((max, c) => {
          const n = Number(c.caseNumber.split("/").pop());
          return Number.isFinite(n) ? Math.max(max, n) : max;
        }, 0) + 1;
      const now = new Date().toISOString();
      const record: CaseRecord = {
        id: makeId("case"),
        caseNumber: `RRS/ASV/2026/${String(nextNumber).padStart(3, "0")}`,
        offenceId: input.offenceId,
        reportedAt: input.reportedAt,
        location: input.location,
        status: "Open",
        priority: input.priority,
        sensitive: input.sensitive,
        narrative: input.narrative,
        assignedOfficerId: assigned.id,
        unitId: assigned.unitId,
        complainantName: input.complainantName,
        complainantPhone: input.complainantPhone,
        persons: [],
        arrests: [],
        evidence: [],
        charges: [],
        hearings: [],
        createdAt: now,
        updatedAt: now,
        syncStatus: offline ? "pending" : "synced",
      };
      setData((prev) => ({ ...prev, cases: [record, ...prev.cases] }));
      audit("case.created", "cases", record.id, `Case ${record.caseNumber} registered${offline ? " (offline draft)" : ""}`);
      return record;
    },
    [audit, currentUser, data.cases, data.officers, offline]
  );

  const addPersonToCase = useCallback(
    (caseId: string, input: NewPersonInput) => {
      const person: Person = {
        id: makeId("p"),
        fullName: input.fullName,
        alias: input.alias || undefined,
        gender: input.gender,
        dob: input.dob || undefined,
        phone: input.phone || undefined,
        address: input.address || undefined,
        nin: input.nin || undefined,
        notes: input.notes || undefined,
        photoUrl: input.photoUrl || undefined,
        fingerprint: input.fingerprint,
        religion: input.religion || undefined,
        nationality: input.nationality || undefined,
        stateOfOrigin: input.stateOfOrigin || undefined,
        lga: input.lga || undefined,
        tribe: input.tribe || undefined,
        occupation: input.occupation || undefined,
        language: input.language || undefined,
        interpreterNeeded: input.interpreterNeeded,
      };
      setData((prev) => ({
        ...prev,
        persons: [person, ...prev.persons],
        cases: prev.cases.map((c) =>
          c.id === caseId
            ? { ...c, persons: [...c.persons, { personId: person.id, role: input.role }], updatedAt: new Date().toISOString(), syncStatus: offline ? "pending" : c.syncStatus }
            : c
        ),
      }));
      audit("person.linked", "case_persons", caseId, `Linked ${input.role.toLowerCase()} ${input.fullName}`);
    },
    [audit, offline]
  );

  const addEvidence = useCallback(
    (caseId: string, input: NewEvidenceInput) => {
      const nextNumber = data.cases.reduce((sum, c) => sum + c.evidence.length, 0) + 1;
      const item: Evidence = {
        id: makeId("ev"),
        evidenceNumber: `EVD/2026/${String(nextNumber).padStart(3, "0")}`,
        type: input.type,
        description: input.description,
        fileName: input.fileName,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        hash: input.hash,
        collectedBy: input.collectedBy,
        collectedAt: input.collectedAt,
        location: input.location,
        sealNumber: input.sealNumber,
        custody: [
          {
            id: makeId("cu"),
            action: "Collected",
            from: input.collectedBy,
            to: "Exhibit Store",
            at: input.collectedAt,
            notes: "Initial collection recorded from demo upload.",
          },
        ],
      };
      setData((prev) => ({
        ...prev,
        cases: prev.cases.map((c) =>
          c.id === caseId ? { ...c, evidence: [...c.evidence, item], updatedAt: new Date().toISOString(), syncStatus: offline ? "pending" : c.syncStatus } : c
        ),
      }));
      audit("evidence.uploaded", "evidence", item.id, `${input.fileName} — SHA-256 ${input.hash.slice(0, 12)}…`);
    },
    [audit, data.cases, offline]
  );

  const addHearing = useCallback(
    (caseId: string, input: NewHearingInput) => {
      const item: Hearing = {
        id: makeId("hr"),
        court: input.court,
        hearingAt: input.hearingAt,
        purpose: input.purpose,
        outcome: input.outcome,
        nextAt: input.nextAt || undefined,
      };
      setData((prev) => ({
        ...prev,
        cases: prev.cases.map((c) =>
          c.id === caseId ? { ...c, hearings: [...c.hearings, item], status: "Court", updatedAt: new Date().toISOString() } : c
        ),
      }));
      audit("court.hearing_added", "hearings", item.id, `${input.court} — ${input.purpose}`);
    },
    [audit]
  );

  const addArrest = useCallback(
    (caseId: string, input: NewArrestInput) => {
      const item: Arrest = {
        id: makeId("ar"),
        personId: input.personId,
        arrestedAt: input.arrestedAt,
        location: input.location,
        officerId: input.officerId,
        charges: input.charges,
        custodyStatus: input.custodyStatus,
        notes: input.notes || undefined,
      };
      setData((prev) => ({
        ...prev,
        cases: prev.cases.map((c) =>
          c.id === caseId
            ? { ...c, arrests: [...c.arrests, item], updatedAt: new Date().toISOString(), syncStatus: offline ? "pending" : c.syncStatus }
            : c
        ),
      }));
      const officer = data.officers.find((o) => o.id === input.officerId);
      audit("arrest.recorded", "arrests", item.id, `${input.charges} — ${officer ? `${officer.rank} ${officer.name}` : "officer"}`);
    },
    [audit, data.officers, offline]
  );

  const setCaseStatus = useCallback(
    (caseId: string, status: CaseStatus) => {
      setData((prev) => ({
        ...prev,
        cases: prev.cases.map((c) => (c.id === caseId ? { ...c, status, updatedAt: new Date().toISOString() } : c)),
      }));
      audit("case.status_changed", "cases", caseId, `Status changed to ${status}`);
    },
    [audit]
  );

  const assignCase = useCallback(
    (caseId: string, officerId: string) => {
      const officer = data.officers.find((o) => o.id === officerId);
      if (!officer) return;
      setData((prev) => ({
        ...prev,
        cases: prev.cases.map((c) =>
          c.id === caseId ? { ...c, assignedOfficerId: officer.id, unitId: officer.unitId, updatedAt: new Date().toISOString() } : c
        ),
      }));
      audit("case.assigned", "cases", caseId, `Assigned to ${officer.rank} ${officer.name}`);
    },
    [audit, data.officers]
  );

  const logView = useCallback(
    (caseId: string) => {
      audit("case.viewed", "cases", caseId, "Opened case file");
    },
    [audit]
  );

  const logExport = useCallback(
    (detail: string) => {
      audit("report.exported", "reports", "export", detail);
    },
    [audit]
  );

  const toggleOffline = useCallback(() => setOffline((v) => !v), []);

  const syncNow = useCallback(() => {
    const pending = data.cases.filter((c) => c.syncStatus === "pending").length;
    setData((prev) => ({
      ...prev,
      cases: prev.cases.map((c) => (c.syncStatus === "pending" ? { ...c, syncStatus: "synced" } : c)),
    }));
    if (pending > 0) audit("sync.completed", "cases", "batch", `${pending} offline draft(s) synced`);
  }, [audit, data.cases]);

  const resetDemo = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setData(seedData);
    setCurrentUserId(null);
    setOffline(false);
  }, []);

  const canEdit = currentUser?.role === "IPO" || currentUser?.role === "SUPERVISOR" || currentUser?.role === "COMMANDER";
  const canViewAudit = currentUser?.role === "COMMANDER" || currentUser?.role === "AUDITOR" || currentUser?.role === "ADMIN";
  const canAdmin = currentUser?.role === "ADMIN";
  const canAssign = currentUser?.role === "COMMANDER" || currentUser?.role === "SUPERVISOR";

  const value: RRSContextValue = {
    data,
    currentUser,
    visibleCases,
    pendingCount: data.cases.filter((c) => c.syncStatus === "pending").length,
    offline,
    hydrated,
    login,
    logout,
    addCase,
    addPersonToCase,
    addEvidence,
    addHearing,
    addArrest,
    setCaseStatus,
    assignCase,
    logView,
    logExport,
    toggleOffline,
    syncNow,
    resetDemo,
    getPerson,
    getOfficer,
    getOffence,
    canEdit,
    canViewAudit,
    canAdmin,
    canAssign,
  };

  return <RRSContext.Provider value={value}>{children}</RRSContext.Provider>;
}

export function useRRS() {
  const ctx = useContext(RRSContext);
  if (!ctx) throw new Error("useRRS must be used inside RRSProvider");
  return ctx;
}
