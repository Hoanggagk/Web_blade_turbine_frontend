import { api, type ApiResult } from "../../api/core";
import { MEMBERS } from "../../api/endpoints";
import type {
  ProjectMember,
  ProjectMemberResponse,
  ProjectMemberListResponse,
  AdminUserLite,
  AddMemberRequest,
  ProjectRole,
} from "../types/typesmemberService";

function mapMember(m: ProjectMemberResponse): ProjectMember {
  return {
    project_id: m.project_id,
    user_id: m.user_id,
    user_name: m.user_name,
    user_email: m.user_email,
    role: m.role,
    can_invite: m.can_invite,
    joined_at: m.joined_at,
  };
}

export const memberService = {
  list: async (
    projectId: string,
    params: { limit: number; offset: number },
    signal?: AbortSignal
  ): Promise<
    ApiResult<{ members: ProjectMember[]; total: number; limit: number; offset: number }>
  > => {
    const res = await api.get<ProjectMemberListResponse>(
      MEMBERS.LIST(projectId),
      { params, signal }
    );
    if (!res.ok) return res as any;
    return {
      ok: true,
      status: res.status,
      message: res.message,
      data: {
        members: res.data.members.map(mapMember),
        total: res.data.total,
        limit: res.data.limit,
        offset: res.data.offset,
      },
    };
  },

  searchUsers: async (
    projectId: string,
    query: string,
    limit = 10,
    signal?: AbortSignal
  ): Promise<ApiResult<AdminUserLite[]>> => {
    return api.get<AdminUserLite[]>(MEMBERS.SEARCH_USERS(projectId), {
      params: { query, limit },
      signal,
    });
  },

  add: async (
    projectId: string,
    payload: AddMemberRequest
  ): Promise<ApiResult<ProjectMember>> => {
    const res = await api.post<ProjectMemberResponse>(MEMBERS.ADD(projectId), payload);
    if (!res.ok) return res as any;
    return { ok: true, status: res.status, message: res.message, data: mapMember(res.data) };
  },

  /** 🔹 Update member role/can_invite */
  update: async (
    projectId: string,
    userId: string,
    updates: Partial<Pick<ProjectMember, "role" | "can_invite">>
  ): Promise<ApiResult<ProjectMember>> => {
    const res = await api.put<ProjectMemberResponse>(
      MEMBERS.UPDATE(projectId, userId),
      updates
    );
    if (!res.ok) return res as any;
    return { ok: true, status: res.status, message: res.message, data: mapMember(res.data) };
  },

  remove: async (projectId: string, userId: string): Promise<ApiResult<null>> => {
    return api.delete<null>(MEMBERS.REMOVE(projectId, userId));
  },

  /** 🔹 Get my role in project */
  myRole: async (projectId: string): Promise<ApiResult<ProjectRole>> => {
    return api.get<ProjectRole>(MEMBERS.MY_ROLE(projectId));
  },
};
