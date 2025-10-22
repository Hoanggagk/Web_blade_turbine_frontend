export type ProjectRole = "owner" | "editor" | "viewer";

export type ProjectMemberResponse = {
  project_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  role: ProjectRole;
  can_invite: boolean;
  joined_at: string;
};

export type ProjectMember = ProjectMemberResponse; // UI dùng cùng shape

export type ProjectMemberListResponse = {
  members: ProjectMemberResponse[];
  total: number;
  limit: number;
  offset: number;
};

export type AdminUserLite = {
  id: string;
  name: string;
  email: string;
};

export type AddMemberRequest = {
  email: string;
  role: ProjectRole;   // BE yêu cầu "owner" | "editor" | "viewer"
  can_invite: boolean;
};

export type UpdateMemberRequest = {
  role: ProjectRole;
  can_invite: boolean;
};

export type MyRoleResponse = ProjectRole;
