/** ----- COMMON TYPES ----- */
export type UUID = string;
export type ISODate = string;

export interface UserRef {
  id: UUID;
  name: string;
  email: string;
}

/** ----- RAW DB (theo table turbines) ----- */
export interface TurbineDB {
  id: UUID;
  name: string;
  description?: string | null;
  windfarm_id: UUID;
  capacity_mw?: number | null;
  coordinates?: string | null;  // "lat,lng"
  serial_no?: string | null;
  created_at?: ISODate | null;
  updated_at?: ISODate | null;
  created_by: UUID; // user.id
}

/** ----- REQUESTS (FE gửi lên) ----- */

// POST /api/v1/turbines/windfarm/{windfarm_id}
export interface TurbineCreateRequest {
  name: string;
  description?: string;
  capacity_mw?: number;
  serial_no?: string;
  coordinates?: string;
}

// PUT /api/v1/turbines/{turbine_id}
export interface TurbineUpdateRequest {
  name?: string;
  description?: string;
  capacity_mw?: number;
  serial_no?: string;
  coordinates?: string;
}

// DELETE bulk (nếu có)
export type TurbineBulkDeleteRequest = UUID[];

/** ----- RESPONSES (BE trả về) ----- */
export interface TurbineItem {
  id: UUID;
  name: string;
  description?: string | null;
  windfarm_id: UUID;
  windfarm_name?: string | null;
  capacity_mw?: number | null;
  coordinates?: string | null;
  serial_no?: string | null;
  created_at: ISODate;
  updated_at: ISODate;
  created_by: UserRef;
}

/** GET /turbines/windfarm/{windfarm_id} */
export interface TurbineListByWindfarmResponse {
  turbines: TurbineItem[];
  total: number;
  limit: number;
  offset: number;
}

/** GET /turbines/list (admin only) */
export interface TurbineListAllResponse {
  turbines: TurbineItem[];
  total: number;
  limit: number;
  offset: number;
}

/** GET detail, POST create, PUT update */
export type TurbineResponse = TurbineItem;

/** DELETE */
export type TurbineDeleteResponse = string | null;

/** ----- UI MODEL (FE normalize form) ----- */
export interface TurbineUI
  extends Omit<TurbineItem, "description" | "capacity_mw" | "coordinates"> {
  description: string;
  capacity_mw: number;
  coordinates: string;
}

export function mapApiToUI(t: TurbineItem): TurbineUI {
  return {
    ...t,
    description: t.description ?? "",
    capacity_mw: t.capacity_mw ?? 0,
    coordinates: t.coordinates ?? "",
  };
}
