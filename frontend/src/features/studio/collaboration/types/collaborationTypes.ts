export type ExperienceStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface ExperienceDocument {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  currentVersion: number;
  status: ExperienceStatus;
  schemaVersion: number;
  serializedExperience: string; // ExperienceSchema JSON string
  publishedVersion?: number;
  publishedExperience?: string;
  lastModifiedBy: string;
  revision: number;
}

export interface ExperienceVersionRecord {
  versionId: string;
  experienceId: string;
  versionNumber: number;
  createdAt: string;
  createdBy: string;
  changeSummary: string;
  serializedExperience: string;
}

export interface CollaboratorPresence {
  userId: string;
  name: string;
  avatarUrl?: string;
  role?: string;
  lastActive: string;
  status: 'active' | 'idle';
  editingSection?: string; // e.g. "Timeline", "3D Viewport", "Canvas"
}

export type SaveStatus = 'saved' | 'saving' | 'error' | 'conflict' | 'offline';

export interface ConflictState {
  hasConflict: boolean;
  localRevision: number;
  serverRevision: number;
  serverLastModifiedBy?: string;
}

export interface RecoverySnapshot {
  experienceId: string;
  timestamp: number;
  serializedExperience: string;
  revision: number;
}
