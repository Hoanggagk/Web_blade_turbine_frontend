/** ----- COMMON TYPES ----- */
export type ISODate = string;

/** ----- ENTITY (chuẩn theo DB) ----- */
export interface AuditEntity {
  id: string;                        // uuid (PK)
  project_id?: string | null;        // uuid NULL (FK → projects)
  actor_id: string;                  // uuid (FK → users)
  action: string;                    // varchar(50)
  entity_type: string;               // varchar(30)
  entity_id: string;                 // uuid
  before_data?: Record<string, any> | null; // jsonb NULL
  after_data?: Record<string, any> | null;  // jsonb NULL
  metadata?: Record<string, any> | null;    // jsonb NULL
  timestamp?: ISODate | null;        // timestamptz DEFAULT now()
  ip_address?: string | null;        // inet NULL
}

/** ----- UI MODEL (Entity + extra fields từ BE join) ----- */
export interface AuditLogUI extends AuditEntity {
  actor_name?: string | null;        // JOIN từ users
}

/** ----- RESPONSES ----- */
export interface AuditListResponse {
  logs: AuditLogUI[];
  total: number;
  limit: number;
  offset: number;
  project_id?: string;
}

export interface AuditStatsResponse {
  total_actions: number;
  actions_by_type: Record<string, number>;
  actions_by_entity: Record<string, number>;
  top_actors: Array<Record<string, any>>; // tuỳ BE định nghĩa chi tiết
  recent_activity_count: number;
  date_range: Record<string, string>;
}
