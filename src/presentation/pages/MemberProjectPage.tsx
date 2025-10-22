import React from "react";
import Sidebar from "../components/sidebar";
import GenericTable from "../components/table";
import type { Column } from "../components/table";
import Button from "../components/button";
import "../styles/MemberProjectPage.css";

/** Types khớp BE */
export type ProjectMember = {
  project_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  role: "owner" | "editor" | "viewer";
  can_invite: boolean;
  joined_at: string; // ISO
};

export type AdminUserLite = {
  id: string;
  name: string;
  email: string;
};

type MemberProjectPageProps = {
  projectTitle: string;
  onBack: () => void;
  canManage?: boolean;

  // Invite
  suggestQuery: string;
  onSuggestQueryChange: (v: string) => void;
  suggestions: AdminUserLite[];
  suggestLoading?: boolean;
  inviteLoading?: boolean;
  onInviteUserId: (userIdOrEmail: string) => void;

  // Filter
  searchTerm: string;
  onSearchTermChange: (v: string) => void;

  // Table + paging
  members: ProjectMember[];
  total?: number;
  limit?: number;
  offset?: number;
  onPageChange?: (nextOffset: number) => void;

  // Actions
  onRemove: (m: ProjectMember) => void;
  deleteLoading?: string | null;

  // Update role
  onUpdate: (m: ProjectMember, updates: Partial<Pick<ProjectMember, "role">>) => void;
  updateLoading?: string | null;

  // Loading list
  loadingList?: boolean;
};

const formatDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
};

const MemberProjectPage: React.FC<MemberProjectPageProps> = ({
  projectTitle,
  onBack,
  canManage = false,
  suggestQuery,
  onSuggestQueryChange,
  suggestions,
  suggestLoading,
  inviteLoading,
  onInviteUserId,
  searchTerm,
  onSearchTermChange,
  members,
  total = 0,
  limit = 50,
  offset = 0,
  onPageChange,
  onRemove,
  deleteLoading,
  onUpdate,
  updateLoading,
  loadingList,
}) => {
  const data = members.map((m) => ({ ...m, id: `${m.project_id}:${m.user_id}` }));

  const columns: Column<typeof data[number]>[] = [
    {
      key: "user",
      header: "Member",
      size: 0.4,
      sortable: true,
      sortAccessor: (m) => m.user_name.toLowerCase(),
      render: (m) => (
        <div>
          <div style={{ fontWeight: 600 }}>{m.user_name}</div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>{m.user_email}</div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      size: 0.2,
      align: "center",
      sortable: true,
      sortAccessor: (m) => m.role,
      headerClassName: "col-center",
      className: "col-center",
      render: (m) => {
        const isUpdating = updateLoading === m.user_id;
        return (
          <select
            value={m.role}
            disabled={!canManage || isUpdating || m.role === "owner"}
            onChange={(e) => onUpdate(m, { role: e.target.value as ProjectMember["role"] })}
          >
            <option value="owner">Owner</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
        );
      },
    },
    {
      key: "joined_at",
      header: "Joined",
      size: 0.2,
      align: "right",
      sortable: true,
      sortAccessor: (m) => m.joined_at || "",
      headerClassName: "col-right",
      className: "col-right",
      render: (m) => <span>{formatDate(m.joined_at)}</span>,
    },
    {
      key: "actions",
      header: "Action",
      size: 0.2,
      render: (m) => {
        const isOwner = m.role === "owner";
        const isDeleting = deleteLoading === m.user_id;
        const cannotDelete = !canManage || isOwner || isDeleting;

        return (
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              variant="delete"
              onClick={() => onRemove(m)}
              disabled={cannotDelete}
              loading={isDeleting}
              title={isOwner ? "Owner cannot be removed" : "Remove from project"}
            >
              Remove
            </Button>
          </div>
        );
      },
    },
  ];

  const pageSize = limit || 50;
  const page = Math.floor((offset || 0) / pageSize) + 1;
  const handlePageChange = (nextPage: number) => {
    if (!onPageChange) return;
    onPageChange((nextPage - 1) * pageSize);
  };

  return (
    <div className="MemberProjectPage">
      <aside className="sidebar-content">
        <Sidebar />
      </aside>

      <main className="main-content">
        <div className="content-body">
          {/* Header */}
          <div className="page-header">
            <div className="page-title">{projectTitle}</div>
            <Button variant="cancel" onClick={onBack}>Back</Button>
          </div>

          {/* Invite */}
          <section className="invite-section">
            <div className="invite-label">Invite team members</div>
            <div className="invite-row-wrap">
              <div className="invite-row">
                <input
                  type="text"
                  className="invite-input"
                  placeholder="Type email or name..."
                  value={suggestQuery}
                  onChange={(e) => onSuggestQueryChange(e.target.value)}
                  disabled={!canManage}
                />
                <Button
                  className="invite-add-btn"
                  variant="submit"
                  onClick={() => suggestQuery.trim() && onInviteUserId(suggestQuery.trim())}
                  disabled={!canManage || !suggestQuery.trim() || !!inviteLoading}
                  loading={!!inviteLoading}
                >
                  Add
                </Button>
              </div>

              {/* 🔽 Dropdown gợi ý */}
              {(suggestLoading || suggestions.length > 0) && (
                <div className="suggest-dropdown">
                  {suggestLoading && <div className="suggest-loading">Loading...</div>}
                  {!suggestLoading && suggestions.length === 0 && (
                    <div className="suggest-empty">No users found</div>
                  )}
                  {!suggestLoading &&
                    suggestions.map((s) => (
                      <div
                        key={s.id}
                        className="suggest-item"
                        onClick={() => onInviteUserId(s.id)}
                      >
                        <div className="suggest-name">{s.name}</div>
                        <div className="suggest-email">{s.email}</div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </section>

          {/* Filter */}
          <section className="filter-section">
            <div className="filter-label">Team Members with Access</div>
            <input
              type="text"
              className="filter-input"
              placeholder="Search name or email"
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
            />
          </section>

          {/* Table */}
          <div className="table-wrap">
            <GenericTable<typeof data[number]>
              data={data}
              columns={columns}
              loading={!!loadingList}
              emptyText="No members"
              stickyHeader
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default MemberProjectPage;
