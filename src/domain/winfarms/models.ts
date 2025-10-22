/** ----- COMMON TYPES ----- */
export type ISODate = string;

export interface UserRef {
  id: string;
  name: string;
  email: string;
}

/** ----- RAW DB (theo table windfarms) ----- */
export interface WindfarmDB {
  id: string;
  name: string;
  description?: string | null;
  own_company?: string | null;
  location?: string | null;
  project_id: string;
  created_at?: ISODate | null;
  updated_at?: ISODate | null;
  created_by: string; // uuid (user.id)
}

/** ----- REQUESTS (FE gửi lên) ----- */
export interface WindfarmCreateRequest {
  name: string;
  location: string;
  description?: string;
  own_company?: string;
}

export interface WindfarmUpdateRequest {
  name?: string;
  location?: string;
  description?: string;
  own_company?: string;
}

export interface WindfarmBatchCreateRequest {
  count: number;
  name_prefix: string;
}

export type WindfarmBulkDeleteRequest = string[];

/** ----- RESPONSES (BE trả về) ----- */
export interface WindfarmItem {
  id: string;
  name: string;
  description?: string | null;
  own_company?: string | null;
  location?: string | null;
  project_id: string;
  project_name?: string | null;
  created_at?: ISODate | null;
  updated_at?: ISODate | null;
  created_by: UserRef; // BE luôn join ra object
  turbine_count?: number;
}

/** GET /windfarms/project/{project_id} */
export interface WindfarmListResponse {
  windfarms: WindfarmItem[];
  total: number;
  limit: number;
  offset: number;
}

/** GET /windfarms/list (admin only) */
export interface WindfarmAdminListResponse {
  windfarms: WindfarmItem[];
  total: number;
  limit: number;
  offset: number;
}

/** GET detail, POST create, PUT update */
export type WindfarmResponse = WindfarmItem;

/** POST batch create */
export interface WindfarmBatchResponse {
  created_windfarms: WindfarmItem[];
  total_created: number;
  errors?: string[];
}

/** DELETE bulk */
export interface WindfarmBulkDeleteResult {
  deleted_count: number;
  total_requested: number;
  errors?: string[];
}

/** ----- UI MODEL (FE normalize form) ----- */
export interface WindfarmUI
  extends Omit<WindfarmItem, "description" | "own_company" | "location"> {
  description: string;
  own_company: string;
  location: string;
}

/** Map API → UI */
export function mapApiToUI(w: WindfarmItem): WindfarmUI {
  return {
    ...w,
    description: w.description ?? "",
    own_company: w.own_company ?? "",
    location: w.location ?? "",
    project_name: w.project_name ?? "",
    turbine_count: w.turbine_count ?? 0,
  };
}
