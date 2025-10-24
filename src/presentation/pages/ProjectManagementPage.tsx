import React, { useState } from "react";
import Sidebar from "../components/sidebar";
import ModalForm from "../components/Modal";
import Button from "../components/button";
import Toolbar from "../components/Toolbar";
import GenericTable, { type Column } from "../components/table";
import type { ProjectUI } from "../../domain/projects/models";
import "../styles/ProjectManagementPage.css";

type Props = {
  projects: ProjectUI[];
  searchTerm: string;
  setSearchTerm: (s: string) => void;

  // create
  showCreateModal: boolean;
  newName: string;
  setNewName: (s: string) => void;
  newDescription: string;
  setNewDescription: (s: string) => void;
  onCreateClick: () => void;
  onCancelCreate: () => void;
  onCreateSubmit: (name: string, description: string) => void;
  loadingCreate?: boolean;

  // edit
  showEditModal: boolean;
  editName: string;
  setEditName: (s: string) => void;
  editDescription: string;
  setEditDescription: (s: string) => void;
  onCancelEdit: () => void;
  onEditSubmit: (name: string, description: string) => void;
  loadingEdit?: boolean;

  // actions
  onManageClick?: (p: ProjectUI) => void;
  onEditClick?: (p: ProjectUI) => void;
  onDeleteClick?: (p: ProjectUI) => void;

  loadingList?: boolean;
  loadingDeleteId?: string | null;

  // pagination
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (next: number) => void;
};

// format: hh:mm:ss dd/mm/yy
const formatDate = (iso?: string | null) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(
    d.getSeconds()
  )} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${String(
    d.getFullYear()
  ).slice(-2)}`;
};

const ProjectManagementPage: React.FC<Props> = ({
  projects,
  searchTerm,
  setSearchTerm,
  // create
  showCreateModal,
  newName,
  setNewName,
  newDescription,
  setNewDescription,
  onCreateClick,
  onCancelCreate,
  onCreateSubmit,
  loadingCreate,
  // edit
  showEditModal,
  editName,
  setEditName,
  editDescription,
  setEditDescription,
  onCancelEdit,
  onEditSubmit,
  loadingEdit,
  // actions
  onManageClick,
  onEditClick,
  onDeleteClick,
  loadingList,
  loadingDeleteId,
  // paging
  total,
  page,
  pageSize,
  onPageChange,
}) => {
  const [showDescModal, setShowDescModal] = useState(false);
  const [selectedDesc, setSelectedDesc] = useState("");
  const [selectedProject, setSelectedProject] = useState<ProjectUI | null>(null);

  // fields for create
  const createFields = [
    { key: "name", label: "Project Name", editable: true },
    {
      key: "description",
      label: "Description",
      editable: true,
      type: "textarea" as const,
    },
  ];
  const createValues: Record<string, string> = {
    name: newName,
    description: newDescription,
  };

  // fields for edit
  const editFields = [
    { key: "id", label: "Project ID", editable: false },
    { key: "created_by", label: "Created By", editable: false },
    { key: "created_at", label: "Created At", editable: false },
    { key: "updated_at", label: "Updated At", editable: false },
    { key: "name", label: "Project Name", editable: true },
    {
      key: "description",
      label: "Description",
      editable: true,
      type: "textarea" as const,
    },
  ];
  const editValues: Record<string, string> = {
    id: selectedProject?.id ?? "",
    created_by: selectedProject?.created_by?.email ?? "—",
    created_at: formatDate(selectedProject?.created_at),
    updated_at: formatDate(selectedProject?.updated_at),
    name: editName,
    description: editDescription,
  };

    const columns: Column<ProjectUI>[] = [
    {
      key: "index",
      header: "#",
      size: 0.05,
      align: "center",
      render: (_row, index) => index + 1 + ((page ?? 1) - 1) * (pageSize ?? 10),
    },
    {
      key: "id",
      header: "ID",
      size: 0.2,
      render: (project) => <code>{project.id}</code>,
    },
    {
      key: "name",
      header: "Project",
      size: 0.2,
      sortable: true,
      sortAccessor: (row) => row.name.toLowerCase(),
    },
    {
      key: "created_at",
      header: "Created",
      size: 0.12,
      align: "right",
      render: (project) => formatDate(project.created_at),
    },
    {
      key: "updated_at",
      header: "Updated",
      size: 0.12,
      align: "right",
      render: (project) => formatDate(project.updated_at),
    },
    {
      key: "windfarm_count",
      header: "Windfarms",
      size: 0.08,
      align: "center",
      render: (project) => project.windfarm_count ?? 0,
    },
    {
      key: "member_count",
      header: "Members",
      size: 0.08,
      align: "center",
      render: (project) => project.member_count ?? 0,
    },
    {
      key: "turbine_count",
      header: "Turbines",
      size: 0.08,
      align: "center",
      render: (project) => project.turbine_count ?? 0,
    },
    {
      key: "created_by",
      header: "Created By",
      size: 0.15,
      render: (project) => project.created_by?.email ?? "-",
    },
    {
      key: "description",
      header: "Description",
      align: "center",
      render: (project) =>
        project.description ? (
          <Button
            variant="detail"
            onClick={(event) => {
              event.stopPropagation();
              setSelectedDesc(project.description ?? "");
              setShowDescModal(true);
            }}
          >
            View
          </Button>
        ) : (
          "-"
        ),
    },
    {
      key: "actions",
      header: "Action",
      size: 0.25,
      render: (project) => (
        <div className="project-page__actions">
          <Button
            variant="detail"
            onClick={(event) => {
              event.stopPropagation();
              onManageClick?.(project);
            }}
          >
            Member
          </Button>
          <Button
            variant="submit"
            onClick={(event) => {
              event.stopPropagation();
              setSelectedProject(project);
              onEditClick?.(project);
            }}
          >
            Edit
          </Button>
          <Button
            variant="delete"
            onClick={(event) => {
              event.stopPropagation();
              onDeleteClick?.(project);
            }}
            loading={loadingDeleteId === project.id}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="app-shell app-shell--viewport project-page">
      <aside className="page-sidebar">
        <Sidebar />
      </aside>

      <main className="page-main page-main--padded">
        <div className="page-body">
          <Toolbar justify="between">
            <Toolbar.Search>
              <Toolbar.SearchInput
                placeholder="Search project name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Toolbar.Search>
            <Toolbar.Actions>
              <Button
                variant="submit"
                onClick={onCreateClick}
                loading={!!loadingCreate}
              >
                + Create
              </Button>
            </Toolbar.Actions>
          </Toolbar>
          <div className="table-section">
            <GenericTable<ProjectUI>
              data={projects}
              columns={columns}
              loading={!!loadingList}
              emptyText="No projects"
              stickyHeader
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={onPageChange}
            />
          </div>
        </div>
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <ModalForm
          isOpen={showCreateModal}
          header="Create Project"
          fields={createFields}
          values={createValues}
          onChange={(key, v) => {
            if (key === "name") setNewName(v);
            if (key === "description") setNewDescription(v);
          }}
          onClose={onCancelCreate}
          onSave={() =>
            onCreateSubmit(newName.trim(), newDescription.trim())
          }
          footer={
            <>
              <Button variant="cancel" onClick={onCancelCreate}>
                Cancel
              </Button>
<Button
  variant="submit"
  onClick={() =>
    onCreateSubmit(newName.trim(), newDescription.trim())
  }
  loading={!!loadingCreate}
  disabled={!newName.trim()}   // 👈 chỉ disable khi name rỗng
>
  Create
</Button>

            </>
          }
        />
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <ModalForm
          isOpen={showEditModal}
          header="Edit Project"
          fields={editFields}
          values={editValues}
          onChange={(key, v) => {
            if (key === "name") setEditName(v);
            if (key === "description") setEditDescription(v);
          }}
          onClose={onCancelEdit}
          onSave={() =>
            onEditSubmit(editName.trim(), editDescription.trim())
          }
          footer={
            <>
              <Button variant="cancel" onClick={onCancelEdit}>
                Cancel
              </Button>
              <Button
                variant="submit"
                onClick={() =>
                  onEditSubmit(editName.trim(), editDescription.trim())
                }
                loading={!!loadingEdit}
                disabled={!editName.trim()}
              >
                Save
              </Button>
            </>
          }
        />
      )}

      {/* Description Modal */}
      {showDescModal && (
        <ModalForm
          isOpen={showDescModal}
          header="Project Description"
          fields={[
            {
              key: "description",
              label: "Description",
              type: "textarea",
              editable: false,
            },
          ]}
          values={{ description: selectedDesc }}
          onChange={() => {}}
          onClose={() => setShowDescModal(false)}
        />
      )}
    </div>
  );
};

export default ProjectManagementPage;

