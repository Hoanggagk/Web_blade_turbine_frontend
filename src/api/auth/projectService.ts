import { api, type ApiResult } from "../core";
import { PROJECTS } from "../endpoints";
import type {
  ProjectCreateRequest,
  ProjectUpdateRequest,
  ProjectResponse,
  ProjectListResponse,
  ProjectAdminListResponse,
  ProjectBulkDeleteRequest,
  ProjectBulkDeleteResult,
} from "../types/typesprojectService";

// Common params
export interface ListParams {
  limit?: number;
  offset?: number;
}

export const projectService = {
  /** Tạo project — POST /projects/ */
  create: (data: ProjectCreateRequest): Promise<ApiResult<ProjectResponse>> =>
    api.post<ProjectResponse>(PROJECTS.CREATE, data),

  /** Danh sách project của current user — GET /projects?limit=&offset= */
  list: (params?: ListParams): Promise<ApiResult<ProjectListResponse>> =>
    api.get<ProjectListResponse>(PROJECTS.LIST, { params }),

  /** (Admin) Danh sách tất cả project — GET /projects/list?limit=&offset= */
  listAll: (params?: ListParams): Promise<ApiResult<ProjectAdminListResponse>> =>
    api.get<ProjectAdminListResponse>(PROJECTS.LIST_ALL, { params }),

  /** Chi tiết project — GET /projects/{project_id} */
  detail: (project_id: string): Promise<ApiResult<ProjectResponse>> =>
    api.get<ProjectResponse>(PROJECTS.DETAIL(project_id)),

  /** Cập nhật project — PUT /projects/{project_id} */
  update: (
    project_id: string,
    data: ProjectUpdateRequest
  ): Promise<ApiResult<ProjectResponse>> =>
    api.put<ProjectResponse>(PROJECTS.UPDATE(project_id), data),

  /** Xoá project — DELETE /projects/{project_id} */
  remove: (project_id: string): Promise<ApiResult<{ message: string }>> =>
    api.delete<{ message: string }>(PROJECTS.DELETE(project_id)),

  /** Bulk delete projects (admin) — DELETE /projects (body: ids[]) */
  bulkDelete: (
    data: ProjectBulkDeleteRequest
  ): Promise<ApiResult<ProjectBulkDeleteResult>> =>
    api.delete<ProjectBulkDeleteResult>(PROJECTS.BULK_DELETE, { data }),
};
