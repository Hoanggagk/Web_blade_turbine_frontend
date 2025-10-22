import React, { useState } from "react";
import Sidebar from "../components/sidebar";
import Button from "../components/button";
import GenericTable, { type Column } from "../components/table";
import ModalForm, { type FieldColumn } from "../components/Modal";
import "../styles/ProjectManagementPage.css";
import Breadcrumb from "../components/breadcrumb";
import type { TurbineUI } from "../../domain/turbines/models";

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
  loadingUpdate?: boolean;

  onDelete: (tb: TurbineUI) => void;
  loadingDeleteId?: string | null;

  onRowClick?: (tb: TurbineUI) => void;
};

const formatDateTime = (s?: string) => {
  if (!s) return "";
  const d = new Date(s);
  const pad = (n: number) => n.toString().padStart(2, "0");
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  const DD = pad(d.getDate());
  const MM = pad(d.getMonth() + 1);
  const YY = d.getFullYear().toString().slice(-2);
  return `${hh}:${mm}:${ss} ${DD}/${MM}/${YY}`;
};

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
  const [showDescModal, setShowDescModal] = useState(false);
  const [selectedDesc, setSelectedDesc] = useState("");

  const columns: Column<TurbineUI>[] = [
    { key: "index", header: "#", align: "center", render: (_r, i) => i + 1 },
    { key: "name", header: "Turbine", sortable: true },
    { key: "serial_no", header: "Serial No.", sortable: true },
    {
      key: "capacity_mw",
      header: "Capacity (MW)",
      align: "right",
      sortable: true,
      sortAccessor: (r) => r.capacity_mw ?? 0,
    },
    { key: "coordinates", header: "Coordinates" },
    {
      key: "created_at",
      header: "Created At",
      render: (r) => formatDateTime(r.created_at),
      sortable: true,
      sortAccessor: (r) => r.created_at || "",
    },
    {
      key: "updated_at",
      header: "Updated At",
      render: (r) => formatDateTime(r.updated_at),
      sortable: true,
      sortAccessor: (r) => r.updated_at || "",
    },
    {
      key: "windfarm_name",
      header: "Windfarm",
      sortable: true,
      sortAccessor: (r) => (r.windfarm_name ?? "").toLowerCase(),
    },
    {
      key: "description",
      header: "Description",
      align: "center",
      render: (tb) =>
        tb.description ? (
          <Button
            variant="detail"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedDesc(tb.description ?? "");
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
    { key: "windfarmName", label: "Windfarm", type: "text", editable: false },
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
      key: "createdByName",
      label: "Created By",
      type: "text",
      editable: false,
      render: () => detailValues.createdByName || "-",
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
                  ? { label: projectName, path: projectId ? `/project/${projectId}` : undefined }
                  : undefined,
                windfarmName
                  ? { label: windfarmName, path: windfarmId ? `/windfarm/${windfarmId}` : undefined }
                  : undefined,
                { label: "Turbines" },
              ].filter(Boolean) as any}
            />
          </div>

          <div className="toolbar">
            <input
              type="text"
              className="search-input"
              placeholder={`Search by name/serial${windfarmName ? ` in ${windfarmName}` : ""}...`}
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

      {/* Detail Modal */}
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
                loading={!!loadingUpdate}
                disabled={!!loadingUpdate || !canSaveDetail}
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
          header="Description"
          fields={[
            {
              key: "desc",
              label: "Description",
              type: "textarea",
              editable: false,
            },
          ]}
          values={{ desc: selectedDesc }}
          onChange={() => {}} // readonly
          onClose={() => setShowDescModal(false)}
        />
      )}
    </div>
  );
};

export default TurbinePage;
