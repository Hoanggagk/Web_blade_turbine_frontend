// src/api/services/auditService.ts
import { api } from "../core";
import type { ApiResult } from "../core";
import type { AuditLogsResponse, AuditLogsQuery } from "../types/typeautditService";
import { AUDIT } from "../endpoints";

export const auditService = {
  async getLogs(query?: AuditLogsQuery): Promise<ApiResult<AuditLogsResponse>> {
    const params = query ? { params: query } : undefined;
    return api.get<AuditLogsResponse>(AUDIT.LOGS, params);
  },

  async cleanup(): Promise<ApiResult<string>> {
    return api.post<string>(AUDIT.CLEANUP);
  },

  async getStats(): Promise<ApiResult<any>> {
    return api.get<any>(AUDIT.STATS);
  },
};
