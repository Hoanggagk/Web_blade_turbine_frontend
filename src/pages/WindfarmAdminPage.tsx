import React, { useState } from "react";
import Sidebar from "../components/sidebar";
import Button from "../components/button";
import GenericTable, { type Column } from "../components/table";
import ModalForm, { type FieldColumn } from "../components/Modal";
import Breadcrumb from "../components/breadcrumb";
import "../styles/ProjectManagementPage.css";
import "../styles/WindfarmAdminPage.css";

import type { WindfarmUI } from "../api/types/typewinfarmService";

type Props = {
  windfarms: WindfarmUI[];
  loadingList?: boolean;

  searchTerm: string;
  setSearchTerm: (s: string) => void;

  total?: number;
  limit?: number;
  offset?: number;
  onOffsetChange?: (next: number) => void;

  showDetailModal: boolean;
  onOpenDetail: (wf: WindfarmUI) => void;
  onCloseDetail: () => void;
  detailValues: Record<string, string>;
  setDetailValue: (k: string, v: string) => void;
  onDetailSave: () => void;
  loadingUpdate?: boolean;

  onDelete: (wf: WindfarmUI) => void;
  loadingDeleteId?: string | null;
};

const formatDate = (iso?: string | null) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString("vi-VN");
};

const WindfarmAdminPage: React.FC<Props> = ({
  windfarms,
  loadingList,
  searchTerm,
  setSearchTerm,
  total = 0,
  limit = 50,
  offset = 0,
  onOffsetChange,

  showDetailModal,
  onOpenDetail,
  onCloseDetail,
  detailValues,
  setDetailValue,
  onDetailSave,
  loadingUpdate,

  onDelete,
  loadingDeleteId,
}) => {
  const [showDescModal, setShowDescModal] = useState(false);
  const [selectedDesc, setSelectedDesc] = useState("");

  const columns: Column<WindfarmUI>[] = [
    {
      key: "index",
      header: "#",
      align: "center",
      render: (_r, i) => (offset || 0) + i + 1,
    },
    { key: "id", header: "ID", render: (r) => <code>{r.id}</code> },
    { key: "name", header: "Windfarm", render: (r) => r.name },
    { key: "project_name", header: "Project", render: (r) => r.project_name || "-" },
    { key: "own_company", header: "Company", render: (r) => r.own_company || "-" },
    { key: "location", header: "Location", render: (r) => r.location || "-" },
    { key: "turbine_count", header: "Turbines", align: "right", render: (r) => r.turbine_count ?? 0 },
    { key: "created_by", header: "Created By", render: (r) => r.created_by?.name ?? "-" },
    { key: "created_at", header: "Created", render: (r) => formatDate(r.created_at) },
    { key: "updated_at", header: "Updated", render: (r) => formatDate(r.updated_at) },
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
      header: "Actions",
      render: (wf) => (
        <>
          <Button
            variant="detail"
            style={{ marginRight: 8 }}
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
  const handlePageChange = (p: number) => onOffsetChange?.((p - 1) * pageSize);

  const detailFields: FieldColumn[] = [
    { key: "id", label: "ID", editable: false },
    { key: "name", label: "Name", editable: true },
    { key: "project_name", label: "Project", editable: false },
    { key: "own_company", label: "Company", editable: true },
    { key: "location", label: "Location", editable: true },
    { key: "description", label: "Description", type: "textarea", editable: true },
    { key: "turbine_count", label: "Turbines", editable: false },
    { key: "created_by_name", label: "Created By", editable: false },
    { key: "created_at", label: "Created", editable: false },
    { key: "updated_at", label: "Updated", editable: false },
  ];

  return (
    <div className="ProjectManagementPage">
      <aside className="sidebar-content">
        <Sidebar />
      </aside>
      <main className="main-content">
        <div className="content-body">
          <div className="page-title">
            <Breadcrumb items={[{ label: "Admin" }, { label: "Windfarms" }]} />
          </div>
          <div className="toolbar">
            <input
              type="text"
              className="search-input"
              placeholder="Search by name / company / location / project..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
            />
          </div>
        </div>
      </main>

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
          fields={[{ key: "description", label: "Description", type: "textarea", editable: false }]}
          values={{ description: selectedDesc }}
          onChange={() => {}}
          onClose={() => setShowDescModal(false)}
        />
      )}
    </div>
  );
};

export default WindfarmAdminPage;
