import React, { useState } from "react";
import Sidebar from "../components/sidebar";
import ModalForm, { type FieldColumn } from "../components/Modal";
import Button from "../components/button";
import GenericTable, { type Column } from "../components/table";
import Breadcrumb from "../components/breadcrumb";
import type { WindfarmUI } from "../api/types/typewinfarmService";
import "../styles/ProjectManagementPage.css";

type CreateValues = { name: string; location: string };

type Props = {
  projectId?: string;
  projectName?: string;
  windfarms: WindfarmUI[];
  loadingList?: boolean;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  total?: number;
  limit?: number;
  offset?: number;
  onOffsetChange?: (nextOffset: number) => void;

  showCreateModal: boolean;
  onOpenCreate: () => void;
  onCloseCreate: () => void;
  createValues: CreateValues;
  setCreateValues: (k: keyof CreateValues, v: string) => void;
  onCreateSubmit: () => void;
  loadingCreate?: boolean;

  showDetailModal: boolean;
  onOpenDetail: (wf: WindfarmUI) => void;
  onCloseDetail: () => void;
  detailValues: Record<string, string>;
  setDetailValue: (k: string, v: string) => void;
  onDetailSave: () => void;
  loadingUpdate?: boolean;

  onDelete: (wf: WindfarmUI) => void;
  loadingDeleteId?: string | null;
  onRowClick?: (wf: WindfarmUI) => void;
};

const formatDate = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(
    d.getSeconds()
  )} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${String(
    d.getFullYear()
  ).slice(-2)}`;
};

const WindfarmPage: React.FC<Props> = ({
  projectId,
  projectName,
  windfarms,
  loadingList,
  searchTerm,
  setSearchTerm,
  total = 0,
  limit = 50,
  offset = 0,
  onOffsetChange,
  showCreateModal,
  onOpenCreate,
  onCloseCreate,
  createValues,
  setCreateValues,
  onCreateSubmit,
  loadingCreate,
  showDetailModal,
  onOpenDetail,
  onCloseDetail,
  detailValues,
  setDetailValue,
  onDetailSave,
  loadingUpdate,
  onDelete,
  loadingDeleteId,
  onRowClick,
}) => {
  // modal xem description riêng
  const [showDescModal, setShowDescModal] = useState(false);
  const [selectedDesc, setSelectedDesc] = useState("");

  const columns: Column<WindfarmUI>[] = [
    {
      key: "index",
      header: "#",
      align: "center",
      render: (_r, i) => i + 1 + (offset || 0),
    },
    {
      key: "name",
      header: "Windfarm",
      sortable: true,
      sortAccessor: (r) => r.name.toLowerCase(),
    },
    { key: "project_name", header: "Project", render: (r) => r.project_name || "—" },
    { key: "own_company", header: "Company", render: (r) => r.own_company || "—" },
    { key: "location", header: "Location", render: (r) => r.location || "—" },
    {
      key: "turbine_count",
      header: "Turbines",
      align: "center",
      render: (r) => r.turbine_count ?? 0,
    },
    {
      key: "created_at",
      header: "Created",
      render: (r) => formatDate(r.created_at),
    },
    {
      key: "updated_at",
      header: "Updated",
      render: (r) => formatDate(r.updated_at),
    },
    {
      key: "description",
      header: "Description",
      align: "center",
      render: (wf) =>
        wf.description ? (
          <Button
            variant="detail"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedDesc(wf.description ?? "");
              setShowDescModal(true);
            }}
          >
            View
          </Button>
        ) : (
          "—"
        ),
    },
    {
      key: "actions",
      header: "Action",
      align: "center",
      render: (wf) => (
        <>
          <Button
            variant="detail"
            style={{ marginRight: 6 }}
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail(wf);
            }}
          >
            Detail
          </Button>
          <Button
            variant="delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(wf);
            }}
            loading={loadingDeleteId === wf.id}
          >
            Delete
          </Button>
        </>
      ),
    },
  ];

  const pageSize = limit || 50;
  const page = Math.floor((offset || 0) / pageSize) + 1;
  const handlePageChange = (nextPage: number) =>
    onOffsetChange?.((nextPage - 1) * pageSize);

  const createFields: FieldColumn[] = [
    { key: "name", label: "Name", type: "text", editable: true },
    { key: "location", label: "Location", type: "text", editable: true },
  ];

  const detailFields: FieldColumn[] = [
    { key: "name", label: "Name", editable: true },
    { key: "project_name", label: "Project", editable: false },
    { key: "own_company", label: "Company", editable: true },
    { key: "location", label: "Location", editable: true },
    { key: "description", label: "Description", type: "textarea", editable: true },
    { key: "turbine_count", label: "Turbines", editable: false },
    { key: "created_at", label: "Created At", editable: false },
    { key: "updated_at", label: "Updated At", editable: false },
  ];

  const canCreate = createValues.name.trim() && createValues.location.trim();
  const canSaveDetail =
    detailValues.name?.trim() && detailValues.location?.trim();

  return (
    <div className="ProjectManagementPage">
      <aside className="sidebar-content">
        <Sidebar />
      </aside>
      <main className="main-content">
        <div className="content-body">
          <div className="page-title">
            <Breadcrumb
              items={
                [
                  { label: "Projects", path: "/project-management" },
                  projectName
                    ? {
                        label: projectName,
                        path: projectId ? `/project/${projectId}` : undefined,
                      }
                    : undefined,
                  { label: "Windfarms" },
                ].filter(Boolean) as any
              }
            />
          </div>

          <div className="toolbar">
            <input
              type="text"
              className="search-input"
              placeholder="Search windfarms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="toolbar-actions">
              <Button variant="submit" onClick={onOpenCreate}>
                + Create
              </Button>
            </div>
          </div>

          <div className="table-section">
            <GenericTable<WindfarmUI>
              data={windfarms}
              columns={columns}
              loading={!!loadingList}
              emptyText="No windfarms"
              stickyHeader
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={handlePageChange}
              onRowClick={onRowClick}
            />
          </div>
        </div>
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <ModalForm
          isOpen={showCreateModal}
          header="Create Windfarm"
          fields={createFields}
          values={createValues}
          onChange={(k, v) => setCreateValues(k as keyof CreateValues, v)}
          onClose={onCloseCreate}
          onSave={onCreateSubmit}
          footer={
            <>
              <Button variant="cancel" onClick={onCloseCreate}>
                Cancel
              </Button>
              <Button
                variant="submit"
                onClick={onCreateSubmit}
                loading={!!loadingCreate}
                disabled={!canCreate}
              >
                Create
              </Button>
            </>
          }
        />
      )}

      {/* Detail Modal */}
      {showDetailModal && (
        <ModalForm
          isOpen={showDetailModal}
          header="Windfarm Detail"
          fields={detailFields}
          values={detailValues}
          onChange={(k, v) => setDetailValue(k, v)}
          onClose={onCloseDetail}
          onSave={onDetailSave}
          footer={
            <>
              <Button variant="cancel" onClick={onCloseDetail}>
                Close
              </Button>
              <Button
                variant="submit"
                onClick={onDetailSave}
                loading={!!loadingUpdate}
                disabled={!canSaveDetail}
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
          header="Windfarm Description"
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

export default WindfarmPage;
