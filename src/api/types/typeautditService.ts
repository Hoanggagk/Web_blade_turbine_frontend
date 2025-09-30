// src/types/audit.ts

// -------------------- API Types --------------------
export type AuditLog = {
  id: string;
  actor_id: string;
  actor_name: string;
  actor_email: string;
  action: string;
  entity_type: string;
  entity_id: string;
  entity_name?: string | null;
  description?: string | null;
  project_id?: string | null;
  before_data?: Record<string, any> | null;
  after_data?: Record<string, any> | null;
  changes?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
  timestamp: string;   // ISO
  ip_address?: string | null;
  user_agent?: string | null;
  expires_at?: string | null;
};

export type AuditLogsResponse = {
  logs: AuditLog[];
  total: number;
  limit: number;
  offset: number;
};

export type AuditLogsQuery = {
  limit?: number;
  offset?: number;
  actor_id?: string;
  project_id?: string;
  entity_type?: string;
  action?: string;
  start_date?: string;
  end_date?: string;
};

// -------------------- UI Types --------------------
// -------------------- UI Types --------------------
export type AuditLogUI = {
  id: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  projectId?: string;
  time: string;
  description?: string;
  ip?: string;
  userAgent?: string;
  expiresAt?: string;
  beforeData?: Record<string, any> | null;
  afterData?: Record<string, any> | null;
  changes?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
  raw: AuditLog;
};


// -------------------- Mapper --------------------
export function mapAuditToUI(log: AuditLog): AuditLogUI {
  return {
    id: log.id,
    actorId: log.actor_id,
    actorName: log.actor_name,
    actorEmail: log.actor_email,
    action: log.action,
    entityType: log.entity_type,
    entityId: log.entity_id,
    entityName: log.entity_name ?? undefined,
    projectId: log.project_id ?? undefined,
    time: new Date(log.timestamp).toLocaleString(),
    description: log.description ?? undefined,
    ip: log.ip_address ?? undefined,
    userAgent: log.user_agent ?? undefined,
    expiresAt: log.expires_at ?? undefined,
    beforeData: log.before_data,
    afterData: log.after_data,
    changes: log.changes,
    metadata: log.metadata,
    raw: log,
  };
}

