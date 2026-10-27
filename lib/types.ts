export type Role = "IPO" | "SUPERVISOR" | "COMMANDER" | "AUDITOR" | "ADMIN";
export type CaseStatus = "Open" | "Under Investigation" | "Court" | "Closed";
export type Priority = "Low" | "Medium" | "High" | "Critical";
export type PersonRole = "Suspect" | "Victim" | "Complainant" | "Witness";
export type SyncStatus = "synced" | "pending";

export interface Unit {
  id: string;
  name: string;
  short: string;
}

export interface Officer {
  id: string;
  forceNumber: string;
  name: string;
  rank: string;
  unitId: string;
  role: Role;
  active: boolean;
}

export interface Offence {
  id: string;
  code: string;
  name: string;
  category: string;
  law: string;
}

export type PersonGender = "Male" | "Female" | "Non-binary" | "Other" | "Prefer not to say";

export interface Person {
  id: string;
  fullName: string;
  alias?: string;
  gender: PersonGender;
  dob?: string;
  phone?: string;
  address?: string;
  nin?: string;
  notes?: string;
  wanted?: boolean;
  photoUrl?: string;
  fingerprint?: FingerprintRecord;
  religion?: string;
  nationality?: string;
  stateOfOrigin?: string;
  lga?: string;
  tribe?: string;
  occupation?: string;
  language?: string;
  interpreterNeeded?: boolean;
}

export interface FingerprintRecord {
  status: "Recorded" | "Pending" | "Not available";
  reference?: string;
  capturedAt?: string;
  capturedBy?: string;
  device?: string;
  notes?: string;
}

export interface CasePerson {
  personId: string;
  role: PersonRole;
  notes?: string;
}

export interface Arrest {
  id: string;
  personId: string;
  arrestedAt: string;
  location: string;
  officerId: string;
  charges: string;
  custodyStatus: "In custody" | "Released on bail" | "Remanded" | "Released";
  notes?: string;
}

export interface CustodyEvent {
  id: string;
  action: "Collected" | "Transferred" | "Returned" | "Disposed";
  from: string;
  to: string;
  at: string;
  notes?: string;
}

export interface Evidence {
  id: string;
  evidenceNumber: string;
  type: "Photograph" | "Document" | "Statement" | "Audio" | "Video" | "Physical item";
  description: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  hash: string;
  collectedBy: string;
  collectedAt: string;
  location: string;
  sealNumber: string;
  custody: CustodyEvent[];
}

export interface Charge {
  id: string;
  offenceId: string;
  description: string;
  law: string;
}

export interface Hearing {
  id: string;
  court: string;
  hearingAt: string;
  purpose: string;
  outcome: string;
  nextAt?: string;
}

export interface CaseRecord {
  id: string;
  caseNumber: string;
  offenceId: string;
  reportedAt: string;
  location: string;
  lat?: number;
  lng?: number;
  status: CaseStatus;
  priority: Priority;
  sensitive: boolean;
  narrative: string;
  assignedOfficerId: string;
  unitId: string;
  complainantName: string;
  complainantPhone: string;
  persons: CasePerson[];
  arrests: Arrest[];
  evidence: Evidence[];
  charges: Charge[];
  hearings: Hearing[];
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface AuditEntry {
  id: string;
  at: string;
  actorId: string;
  actorName: string;
  action: string;
  table: string;
  recordId: string;
  detail: string;
  ip: string;
}

export interface AppData {
  units: Unit[];
  officers: Officer[];
  offences: Offence[];
  persons: Person[];
  cases: CaseRecord[];
  audit: AuditEntry[];
}
