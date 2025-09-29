// src/api/services/auditService.ts
import { api, type ApiResult } from "../core";
import { AUDIT } from "../endpoints";
import type {
  AuditListResponse,
  AuditStatsResponse,
} from "../types/typeautditService";

export const auditService = {
  // -----------------
  // Project audit logs
  // -----------------
  listByProject: (
    project_id: string,
    params?: {
      action?: string;
      entity_type?: string;
      actor_id?: string;
      start_date?: string;
      end_date?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<ApiResult<AuditListResponse>> =>
    api.get<AuditListResponse>(AUDIT.PROJECT_LOGS(project_id), { params }),

  statsByProject: (
    project_id: string,
    days?: number
  ): Promise<ApiResult<AuditStatsResponse>> =>
    api.get<AuditStatsResponse>(AUDIT.PROJECT_STATS(project_id), {
      params: { days },
    }),

  exportProject: (
    project_id: string,
    format: "json" | "csv" = "json",
    params?: { start_date?: string; end_date?: string }
  ): Promise<ApiResult<string>> =>
    api.get<string>(AUDIT.PROJECT_EXPORT(project_id), {
      params: { format, ...params },
    }),

  // -----------------
  // User audit logs
  // -----------------
  listMyActivity: (params?: {
    project_id?: string;
    action?: string;
    entity_type?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResult<AuditListResponse>> =>
    api.get<AuditListResponse>(AUDIT.MY_ACTIVITY, { params }),

  // -----------------
  // Entity audit logs
  // -----------------
  listByEntity: (
    entity_type: string,
    entity_id: string,
    params?: { limit?: number; offset?: number }
  ): Promise<ApiResult<AuditListResponse>> =>
    api.get<AuditListResponse>(AUDIT.ENTITY_LOGS(entity_type, entity_id), {
      params,
    }),

  // -----------------
  // Global audit stats (admin only)
  // -----------------
  globalStats: (
    days?: number
  ): Promise<ApiResult<AuditStatsResponse>> =>
    api.get<AuditStatsResponse>(AUDIT.GLOBAL_STATS, {
      params: { days },
    }),
};
