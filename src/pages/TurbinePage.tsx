// src/pages/TurbinePage.tsx
import React from "react";
import Sidebar from "../components/sidebar";
import Button from "../components/button";
import GenericTable, { type Column } from "../components/table";
import ModalForm, { type FieldColumn } from "../components/Modal";
import "../styles/ProjectManagementPage.css";
import Breadcrumb from "../components/breadcrumb";

// 👉 dùng type-only import cho model
import type { TurbineUI } from "../api/types/typeturbineService";

type CreateValues = {
  name: string;
  serialNo?: string;
  capacityMw?: string;
  coordinates?: string;
  description?: string;
};

type Props = {
  projectId?: string;
  projectName?: string;
  windfarmId?: string;
  windfarmName?: string;

  turbines: TurbineUI[];
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
  onOpenDetail: (tb: TurbineUI) => void;
  onCloseDetail: () => void;
  detailValues: Record<string, string>;
  setDetailValue: (k: string, v: string) => void;
  onDetailSave: () => void;
  loadingDetail?: boolean;
  loadingUpdate?: boolean;

  onDelete: (tb: TurbineUI) => void;
  loadingDeleteId?: string | null;

  onRowClick?: (tb: TurbineUI) => void;
};

const truncate = (s?: string | null, n = 120) =>
  (s ?? "").length > n ? `${(s ?? "").slice(0, n)}…` : (s ?? "");

const formatDateTime = (s?: string) =>
  s ? new Date(s).toLocaleString("vi-VN") : "";

const TurbinePage: React.FC<Props> = ({
  projectId,
  projectName,
  windfarmId,
  windfarmName,
  turbines,
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
  loadingDetail,
  loadingUpdate,
  onDelete,
  loadingDeleteId,
  onRowClick,
}) => {
  const columns: Column<TurbineUI>[] = [
    { key: "index", header: "#", align: "center", render: (_r, i) => i + 1 },
    {
      key: "name",
      header: "Turbine",
      sortable: true,
      sortAccessor: (r) => r.name.toLowerCase(),
    },
    {
      key: "serial_no",
      header: "Serial No.",
      sortable: true,
      sortAccessor: (r) => (r.serial_no ?? "").toLowerCase(),
    },
    {
      key: "capacity_mw",
      header: "Capacity (MW)",
      align: "right",
      sortable: true,
      sortAccessor: (r) => r.capacity_mw ?? 0,
    },
    {
      key: "coordinates",
      header: "Coordinates",
      sortable: true,
      sortAccessor: (r) => (r.coordinates ?? "").toLowerCase(),
    },
    {
      key: "description",
      header: "Description",
      render: (r) => truncate(r.description ?? "", 100),
    },
    {
      key: "windfarm_name",
      header: "Windfarm",
      sortable: true,
      sortAccessor: (r) => (r.windfarm_name ?? "").toLowerCase(),
    },
    {
      key: "actions",
      header: "Action",
      render: (tb) => (
        <>
          <Button
            variant="detail"
            style={{ marginRight: 8 }}
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail(tb);
            }}
          >
            Detail
          </Button>
          <Button
            variant="delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(tb);
            }}
            loading={loadingDeleteId === tb.id}
          >
            Delete
          </Button>
        </>
      ),
    },
  ];

  const pageSize = 15;
  const page = Math.floor((offset || 0) / pageSize) + 1;
  const handlePageChange = (nextPage: number) =>
    onOffsetChange?.((nextPage - 1) * pageSize);

  const createFields: FieldColumn[] = [
    { key: "name", label: "Name", type: "text", editable: true },
    { key: "serialNo", label: "Serial No.", type: "text", editable: true },
    { key: "capacityMw", label: "Capacity (MW)", type: "number", editable: true },
    { key: "coordinates", label: "Coordinates (lat,lng)", type: "text", editable: true },
    { key: "description", label: "Description", type: "textarea", editable: true },
  ];

  const detailFields: FieldColumn[] = [
    { key: "id", label: "ID", type: "text", editable: false },
    { key: "windfarm_name", label: "Windfarm", type: "text", editable: false },
    { key: "name", label: "Name", type: "text", editable: true },
    { key: "serialNo", label: "Serial No.", type: "text", editable: true },
    { key: "capacityMw", label: "Capacity (MW)", type: "number", editable: true },
    { key: "coordinates", label: "Coordinates", type: "text", editable: true },
    { key: "description", label: "Description", type: "textarea", editable: true },
    {
      key: "createdAt",
      label: "Created At",
      type: "text",
      editable: false,
      render: () => formatDateTime(detailValues.createdAt),
    },
    {
      key: "updatedAt",
      label: "Updated At",
      type: "text",
      editable: false,
      render: () => formatDateTime(detailValues.updatedAt),
    },
    {
      key: "createdBy",
      label: "Created By",
      type: "text",
      editable: false,
      render: () => detailValues.createdByName || detailValues.createdBy,
    },
  ];

  const canCreate = createValues.name.trim();
  const canSaveDetail = (detailValues.name ?? "").trim();

  return (
    <div className="ProjectManagementPage">
      <aside className="sidebar-content">
        <Sidebar />
      </aside>
      <main className="main-content">
        <div className="content-body">
          <div className="page-title">
            <Breadcrumb
              items={[
                { label: "Projects", path: "/project-management" },
                projectName
                  ? {
                      label: projectName,
                      path: projectId ? `/project/${projectId}` : undefined,
                    }
                  : undefined,
                windfarmName
                  ? {
                      label: windfarmName,
                      path: windfarmId ? `/windfarm/${windfarmId}` : undefined,
                    }
                  : undefined,
                { label: "Turbines" },
              ].filter(Boolean) as any}
            />
          </div>

          <div className="toolbar">
            <input
              type="text"
              className="search-input"
              placeholder={`Search by name/serial${
                windfarmName ? ` in ${windfarmName}` : ""
              }...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="toolbar-actions" style={{ display: "flex", gap: 8 }}>
              <Button variant="submit" onClick={onOpenCreate}>
                + Create
              </Button>
            </div>
          </div>

          <div className="table-section">
            <GenericTable<TurbineUI>
              data={turbines}
              columns={columns}
              loading={!!loadingList}
              emptyText="No turbines"
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

      {showCreateModal && (
        <ModalForm
          isOpen={showCreateModal}
          header="Create Turbine"
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
                disabled={!canCreate || !!loadingCreate}
              >
                Create
              </Button>
            </>
          }
        />
      )}

      {showDetailModal && (
        <ModalForm
          isOpen={showDetailModal}
          header="Turbine Detail"
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
                loading={!!loadingUpdate || !!loadingDetail}
                disabled={!!loadingDetail || !!loadingUpdate || !canSaveDetail}
              >
                Save
              </Button>
            </>
          }
        />
      )}
    </div>
  );
};

export default TurbinePage;
