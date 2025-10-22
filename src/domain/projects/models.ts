/** ----- COMMON TYPES ----- */
export type ISODate = string;

export interface UserRef {
  id: string;
  name: string;
  email: string;
}

/** ----- ENUM ROLES ----- */
export const ProjectRole = {
  OWNER: "owner",
  MANAGER: "manager",
  EDITOR: "editor",
  VIEWER: "viewer",
} as const;
export type ProjectRoleEnum = typeof ProjectRole[keyof typeof ProjectRole];

/** ----- RAW DB (theo table projects) ----- */
export interface ProjectDB {
  id: string;             // uuid
  name: string;           // varchar(255)
  description?: string | null;
  created_at?: ISODate | null;  // default CURRENT_TIMESTAMP
  updated_at?: ISODate | null;  // default CURRENT_TIMESTAMP
  created_by: string;     // uuid (user.id)
}

/** ----- REQUESTS (FE gửi lên) ----- */
export interface ProjectCreateRequest {
  name: string;
  description?: string;
}

export interface ProjectUpdateRequest {
  name?: string;
  description?: string;
}

export type ProjectBulkDeleteRequest = string[];

/** ----- RESPONSES (BE trả về) ----- */
export interface ProjectItem {
  id: string;
  name: string;
  description?: string | null;
  created_at?: ISODate | null;
  updated_at?: ISODate | null;
  created_by: UserRef;

  // Optional stats
  member_count?: number;
  windfarm_count?: number;
  turbine_count?: number;

  // Optional role info (chỉ khi gọi /projects/)
  user_role?: ProjectRoleEnum;
  user_joined_at?: ISODate | null;
}

/** GET /projects/ */
export interface ProjectListResponse {
  projects: ProjectItem[];
  total: number;
  limit: number;
  offset: number;
}

/** GET /projects/list (admin only) */
export interface ProjectAdminListResponse {
  projects: ProjectItem[];
  total: number;
  limit: number;
  offset: number;
}

/** GET detail, POST create, PUT update */
export type ProjectResponse = ProjectItem;

/** DELETE bulk */
export interface ProjectBulkDeleteResult {
  deleted_count: number;
  total_requested: number;
  errors?: string[];
}

/** ----- UI MODEL (FE normalize form) ----- */
export interface ProjectUI
  extends Omit<ProjectItem, "description"> {
  description: string;
}

export function mapApiToUI(p: ProjectItem): ProjectUI {
  return {
    ...p,
    description: p.description ?? "",
    member_count: p.member_count ?? 0,
    windfarm_count: p.windfarm_count ?? 0,
    turbine_count: p.turbine_count ?? 0,
    user_role: p.user_role ?? undefined,
    user_joined_at: p.user_joined_at ?? null,
  };
}
