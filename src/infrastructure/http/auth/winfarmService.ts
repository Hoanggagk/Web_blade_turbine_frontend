import { api, type ApiResult } from "../core";
import { WINDFARMS } from "../endpoints";
import type {
  WindfarmCreateRequest,
  WindfarmUpdateRequest,
  WindfarmBatchCreateRequest,
  WindfarmResponse,
  WindfarmListResponse,
  WindfarmAdminListResponse,
  WindfarmBatchResponse,
  WindfarmBulkDeleteResult,
} from "../../../domain/winfarms/models";

export const windfarmService = {
  /** POST /windfarms/project/{project_id} */
  create: (
    project_id: string,
    data: WindfarmCreateRequest
  ): Promise<ApiResult<WindfarmResponse>> =>
    api.post(WINDFARMS.CREATE(project_id), data),

  /** POST /windfarms/project/{project_id}/batch */
  batchCreate: (
    project_id: string,
    data: WindfarmBatchCreateRequest
  ): Promise<ApiResult<WindfarmBatchResponse>> =>
    api.post(WINDFARMS.BATCH_CREATE(project_id), data),

  /** GET /windfarms/project/{project_id} */
  listByProject: (params: {
    project_id: string;
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<ApiResult<WindfarmListResponse>> => {
    const { project_id, limit = 50, offset = 0, search } = params;
    return api.get(WINDFARMS.LIST_BY_PROJECT(project_id), {
      params: { limit, offset, ...(search ? { search } : {}) },
    });
  },

  /** GET /windfarms/list (admin only) */
  listAll: (params?: {
    limit?: number;
    offset?: number;
  }): Promise<ApiResult<WindfarmAdminListResponse>> => {
    const { limit = 100, offset = 0 } = params ?? {};
    return api.get(WINDFARMS.LIST_ALL, { params: { limit, offset } });
  },

  /** GET /windfarms/{windfarm_id} */
  detail: (windfarm_id: string): Promise<ApiResult<WindfarmResponse>> =>
    api.get(WINDFARMS.DETAIL(windfarm_id)),

  /** PUT /windfarms/{windfarm_id} */
  update: (
    windfarm_id: string,
    data: WindfarmUpdateRequest
  ): Promise<ApiResult<WindfarmResponse>> =>
    api.put(WINDFARMS.UPDATE(windfarm_id), data),

  /** DELETE /windfarms/{windfarm_id} */
  remove: (windfarm_id: string): Promise<ApiResult<null>> =>
    api.delete(WINDFARMS.DELETE(windfarm_id)),

  /** DELETE /windfarms/bulk — body là string[] */
  bulkDelete: (
    windfarm_ids: string[]
  ): Promise<ApiResult<WindfarmBulkDeleteResult>> =>
    api.delete(WINDFARMS.BULK_DELETE, { data: windfarm_ids }),
};
