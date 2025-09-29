import { api, type ApiResult } from "../core";
import { TURBINES } from "../endpoints";
import type {
  TurbineItem,
  TurbineResponse,
  TurbineListByWindfarmResponse,
  TurbineListAllResponse,
  TurbineCreateRequest,
  TurbineUpdateRequest,
  TurbineDeleteResponse,
  UUID,
} from "../types/typeturbineService";

/** Query params */
export type ListByWindfarmParams = {
  limit?: number;   // default 50 on server
  offset?: number;  // default 0
  search?: string;  // search by name or serial_no
};

export type ListAllParams = {
  limit?: number;   // default 100 on server
  offset?: number;  // default 0
};

export const turbineService = {
  /** 1) Create Turbine in a windfarm */
  create: (
    windfarm_id: UUID,
    data: TurbineCreateRequest
  ): Promise<ApiResult<TurbineResponse>> =>
    api.post(TURBINES.CREATE_BY_WINDFARM(windfarm_id), data),

  /** 2) List Turbines by windfarm (Viewer+) */
  listByWindfarm: (
    windfarm_id: UUID,
    params?: ListByWindfarmParams,
    signal?: AbortSignal
  ): Promise<ApiResult<TurbineListByWindfarmResponse>> =>
    api.get(TURBINES.LIST_BY_WINDFARM(windfarm_id), { params, signal }),

  /** 3) Admin: List All Turbines */
  listAll: (
    params?: ListAllParams,
    signal?: AbortSignal
  ): Promise<ApiResult<TurbineListAllResponse>> =>
    api.get(TURBINES.LIST_ALL, { params, signal }),

  /** 4) Optional: detail (nếu backend có GET /turbines/{id}) */
  detail: (
    turbine_id: UUID,
    signal?: AbortSignal
  ): Promise<ApiResult<TurbineItem>> =>
    api.get(TURBINES.DETAIL(turbine_id), { signal }),

  /** 5) Update Turbine */
  update: (
    turbine_id: UUID,
    data: TurbineUpdateRequest
  ): Promise<ApiResult<TurbineResponse>> =>
    api.put(TURBINES.UPDATE(turbine_id), data),

  /** 6) Delete Turbine (soft delete) — 204 */
  delete: (
    turbine_id: UUID
  ): Promise<ApiResult<TurbineDeleteResponse>> =>
    api.delete(TURBINES.DELETE(turbine_id)),
};
