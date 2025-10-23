import { api, type ApiResult } from "../core";
import { WINDFARMS } from "../endpoints";
import type {
  WindfarmAdminListResponse,
  WindfarmBatchCreateRequest,
  WindfarmBatchResponse,
  WindfarmBulkDeleteResult,
  WindfarmCreateRequest,
  WindfarmListResponse,
  WindfarmResponse,
  WindfarmUpdateRequest,
} from "../../../domain/winfarms/models";

export const windfarmService = {
  create: (
    projectId: string,
    data: WindfarmCreateRequest
  ): Promise<ApiResult<WindfarmResponse>> =>
    api.post(WINDFARMS.CREATE(projectId), data),

  batchCreate: (
    projectId: string,
    data: WindfarmBatchCreateRequest
  ): Promise<ApiResult<WindfarmBatchResponse>> =>
    api.post(WINDFARMS.BATCH_CREATE(projectId), data),

  listByProject: (params: {
    project_id: string;
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<ApiResult<WindfarmListResponse>> => {
    const { project_id, limit = 50, offset = 0, search } = params;
    return api.get(WINDFARMS.LIST_BY_PROJECT(project_id), {
      params: {
        limit,
        offset,
        ...(search ? { search } : {}),
      },
    });
  },

  listAll: (params?: {
    limit?: number;
    offset?: number;
  }): Promise<ApiResult<WindfarmAdminListResponse>> => {
    const { limit = 100, offset = 0 } = params ?? {};
    return api.get(WINDFARMS.LIST_ALL, { params: { limit, offset } });
  },

  detail: (
    windfarmId: string,
    signal?: AbortSignal
  ): Promise<ApiResult<WindfarmResponse>> =>
    api.get(WINDFARMS.DETAIL(windfarmId), { signal }),

  update: (
    windfarmId: string,
    data: WindfarmUpdateRequest
  ): Promise<ApiResult<WindfarmResponse>> =>
    api.put(WINDFARMS.UPDATE(windfarmId), data),

  remove: (windfarmId: string): Promise<ApiResult<null>> =>
    api.delete(WINDFARMS.DELETE(windfarmId)),

  bulkDelete: (
    windfarmIds: string[]
  ): Promise<ApiResult<WindfarmBulkDeleteResult>> =>
    api.delete(WINDFARMS.BULK_DELETE, { data: windfarmIds }),
};
