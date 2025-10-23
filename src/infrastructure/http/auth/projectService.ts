import { api, type ApiResult } from "../core";
import { PROJECTS } from "../endpoints";
import type {
  ProjectAdminListResponse,
  ProjectBulkDeleteRequest,
  ProjectBulkDeleteResult,
  ProjectCreateRequest,
  ProjectListResponse,
  ProjectResponse,
  ProjectUpdateRequest,
} from "../../../domain/projects/models";

export interface ListParams {
  limit?: number;
  offset?: number;
}

export const projectService = {
  create: (data: ProjectCreateRequest): Promise<ApiResult<ProjectResponse>> =>
    api.post<ProjectResponse>(PROJECTS.CREATE, data),

  list: (params?: ListParams): Promise<ApiResult<ProjectListResponse>> =>
    api.get<ProjectListResponse>(PROJECTS.LIST, { params }),

  listAll: (params?: ListParams): Promise<ApiResult<ProjectAdminListResponse>> =>
    api.get<ProjectAdminListResponse>(PROJECTS.LIST_ALL, { params }),

  detail: (
    projectId: string,
    signal?: AbortSignal
  ): Promise<ApiResult<ProjectResponse>> =>
    api.get<ProjectResponse>(PROJECTS.DETAIL(projectId), { signal }),

  update: (
    projectId: string,
    data: ProjectUpdateRequest
  ): Promise<ApiResult<ProjectResponse>> =>
    api.put<ProjectResponse>(PROJECTS.UPDATE(projectId), data),

  remove: (
    projectId: string
  ): Promise<ApiResult<{ message: string }>> =>
    api.delete<{ message: string }>(PROJECTS.DELETE(projectId)),

  bulkDelete: (
    request: ProjectBulkDeleteRequest
  ): Promise<ApiResult<ProjectBulkDeleteResult>> =>
    api.delete<ProjectBulkDeleteResult>(PROJECTS.BULK_DELETE, { data: request }),
};
