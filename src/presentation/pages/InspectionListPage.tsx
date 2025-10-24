import React, { useMemo, useRef, useState } from "react";
import Sidebar from "../components/sidebar";
import Button from "../components/button";
import GenericTable, { type Column } from "../components/table";
import "../styles/ProjectManagementPage.css";
import type { InspectionSummary } from "../../infrastructure/http/auth/inspectionService";

export type FilterStatus = "all" | "checked" | "unchecked";

type Props = {
  turbineId?: string;
  turbineName?: string;
  inspections: InspectionSummary[];
  loadingList?: boolean;
  uploading?: boolean;
  deletingId?: string | null;
  statusFilter: FilterStatus;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onStatusFilterChange: (value: FilterStatus) => void;
  onUploadZip: (file: File) => Promise<void> | void;
  onRefresh: () => void;
  onOpenInspection: (inspectionId: string) => void;
  onDeleteInspection: (inspectionId: string) => void;
  uploadCapturedAt: string;
  onUploadCapturedAtChange: (value: string) => void;
};

const formatTimestamp = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const CHECKED_LABELS = new Set([
  "checked",
  "completed",
  "done",
  "analysis complete",
  "analysis_complete",
  "analyzed",
  "processed",
  "ready",
  "true",
  "1",
]);

const UNCHECKED_LABELS = new Set([
  "unchecked",
  "uncheck",
  "uploaded",
  "processing",
  "failed",
  "in progress",
  "pending",
  "new",
  "created",
  "false",
  "0",
]);

const resolveChecklistStatus = (
  row: InspectionSummary,
): { normalized: "checked" | "unchecked"; label: "Checked" | "Unchecked" } => {
  const totalImages =
    typeof row.total_images === "number" ? Math.max(row.total_images, 0) : undefined;
  if (
    typeof row.processed_images === "number" &&
    totalImages &&
    totalImages > 0 &&
    row.processed_images >= totalImages
  ) {
    return { normalized: "checked", label: "Checked" };
  }

  const raw = (row.status || "").trim().toLowerCase();
  if (CHECKED_LABELS.has(raw)) {
    return { normalized: "checked", label: "Checked" };
  }
  if (UNCHECKED_LABELS.has(raw)) {
    return { normalized: "unchecked", label: "Unchecked" };
  }

  return { normalized: "unchecked", label: "Unchecked" };
};

const InspectionListPage: React.FC<Props> = ({
  turbineId,
  turbineName,
  inspections,
  loadingList,
  uploading,
  deletingId,
  statusFilter,
  searchTerm,
  onSearchTermChange,
  onStatusFilterChange,
  onUploadZip,
  onRefresh,
  onOpenInspection,
  onDeleteInspection,
  uploadCapturedAt,
  onUploadCapturedAtChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "cards">("cards");
  const turbineLabel = useMemo(
    () => (turbineName?.trim() ? turbineName.trim() : turbineId || "Unknown"),
    [turbineId, turbineName],
  );

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await onUploadZip(file);
    } finally {
      event.target.value = "";
    }
  };

  const resolveStatusBadge = (row: InspectionSummary) => resolveChecklistStatus(row);

  const columns: Column<InspectionSummary>[] = useMemo(
    () => [
      {
        key: "inspection_code",
        header: "Inspection",
        render: (row) => (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontWeight: 600 }}>
              {row.inspection_code ?? row.code ?? row.name ?? row.id ?? "-"}
            </span>
            <span style={{ fontSize: 12, color: "#6b7280" }}>
              {row.id ? `#${row.id.slice(0, 8)}` : ""}
            </span>
          </div>
        ),
      },
      {
        key: "total_images",
        header: "Images",
        className: "col-center",
        headerClassName: "col-center",
        render: (row) => {
          const total = row.total_images ?? 0;
          const processed = row.processed_images ?? 0;
          if (!total) return "No images";
          const clampedProcessed = Math.min(processed, total);
          const percentage = total > 0 ? Math.round((clampedProcessed / total) * 100) : 0;
          return (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <span>
                {clampedProcessed} / {total}
              </span>
              <span style={{ fontSize: 12, color: "#6b7280" }}>{percentage}%</span>
            </div>
          );
        },
      },
      {
        key: "status",
        header: "Status",
        className: "col-center",
        headerClassName: "col-center",
        render: (row) => {
          const { normalized, label } = resolveStatusBadge(row);
          return <span className={`status-badge status-${normalized}`}>{label}</span>;
        },
      },
      {
        key: "created_at",
        header: "Created",
        render: (row) => formatTimestamp(row.created_at),
      },
      {
        key: "actions",
        header: "Actions",
        className: "action-cell",
        render: (row) => (
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button
              variant="detail"
              onClick={(event: React.MouseEvent) => {
                event.stopPropagation();
                onOpenInspection(row.id);
              }}
            >
              View
            </Button>
            <Button
              variant="delete"
              onClick={(event: React.MouseEvent) => {
                event.stopPropagation();
                onDeleteInspection(row.id);
              }}
              loading={deletingId === row.id}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [deletingId, onDeleteInspection, onOpenInspection, resolveStatusBadge],
  );

  return (
    <div className="ProjectManagementPage">
      <aside className="sidebar-content">
        <Sidebar />
      </aside>
      <main className="main-content">
        <div className="content-body">
          <div className="page-title">
            <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
              Inspections
            </h1>
            <p style={{ margin: "4px 0 0", color: "#555", fontSize: 13 }}>
              Turbine: {turbineLabel}
            </p>
          </div>

          <div className="toolbar">
            <input
              type="text"
              className="search-input"
              placeholder="Search inspection..."
              value={searchTerm}
              onChange={(event) => onSearchTermChange(event.target.value)}
            />
            <select
              className="search-input"
              style={{ flex: "unset", width: 180 }}
              value={statusFilter}
              onChange={(event) =>
                onStatusFilterChange(event.target.value as FilterStatus)
              }
            >
              <option value="all">All statuses</option>
              <option value="checked">Checked</option>
              <option value="unchecked">Unchecked</option>
            </select>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="datetime-local"
                className="search-input"
                style={{ width: 200 }}
                value={uploadCapturedAt}
                onChange={(event) => onUploadCapturedAtChange(event.target.value)}
              />
            </div>
            <div className="toolbar-view-toggle" role="group" aria-label="Toggle inspection view">
              <button
                type="button"
                className={`view-toggle__btn ${viewMode === "cards" ? "is-active" : ""}`}
                onClick={() => setViewMode("cards")}
                aria-pressed={viewMode === "cards"}
              >
                Cards
              </button>
              <button
                type="button"
                className={`view-toggle__btn ${viewMode === "table" ? "is-active" : ""}`}
                onClick={() => setViewMode("table")}
                aria-pressed={viewMode === "table"}
              >
                Table
              </button>
            </div>
            <div className="toolbar-actions" style={{ gap: 8 }}>
              <Button variant="submit" onClick={handleOpenFilePicker} loading={uploading}>
                Upload ZIP
              </Button>
              <Button variant="detail" onClick={onRefresh} loading={loadingList}>
                Refresh
              </Button>
            </div>
          </div>

          {viewMode === "cards" ? (
            loadingList ? (
              <div className="inspection-grid inspection-grid--loading">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div className="inspection-card inspection-card--skeleton" key={index} />
                ))}
              </div>
            ) : inspections.length === 0 ? (
              <div className="list-empty">No inspections</div>
            ) : (
              <div className="inspection-grid">
                {inspections.map((row) => {
                  const total = row.total_images ?? 0;
                  const processed = row.processed_images ?? 0;
                  const clampedProcessed = Math.min(processed, total);
                  const percentage =
                    total > 0 ? Math.round((clampedProcessed / total) * 100) : 0;
                  const { normalized, label } = resolveStatusBadge(row);
                  const code = row.inspection_code ?? row.code ?? row.name ?? row.id ?? "Inspection";
                  return (
                    <article
                      key={row.id}
                      className="inspection-card"
                      role="button"
                      tabIndex={0}
                      onClick={() => onOpenInspection(row.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onOpenInspection(row.id);
                        }
                      }}
                      aria-label={`Open inspection ${code}`}
                    >
                      <header className="inspection-card__header">
                        <div className="inspection-card__title">
                          <span className="inspection-card__code">{code}</span>
                          {row.id && (
                            <span className="inspection-card__id">#{row.id.slice(0, 8)}</span>
                          )}
                        </div>
                        <span className={`status-badge status-${normalized}`}>{label}</span>
                      </header>
                      <div className="inspection-card__meta">
                        <div>
                          <span className="inspection-card__meta-label">Created</span>
                          <span className="inspection-card__meta-value">
                            {formatTimestamp(row.created_at)}
                          </span>
                        </div>
                      </div>
                      <div className="inspection-card__progress">
                        <div className="inspection-card__progress-bar" aria-hidden="true">
                          <span style={{ width: `${percentage}%` }} />
                        </div>
                        <span className="inspection-card__progress-label">
                          {clampedProcessed} / {total} images · {percentage}%
                        </span>
                      </div>
                      <footer className="inspection-card__footer">
                        <Button
                          variant="detail"
                          onClick={(event: React.MouseEvent) => {
                            event.stopPropagation();
                            onOpenInspection(row.id);
                          }}
                        >
                          View
                        </Button>
                        <Button
                          variant="delete"
                          onClick={(event: React.MouseEvent) => {
                            event.stopPropagation();
                            onDeleteInspection(row.id);
                          }}
                          loading={deletingId === row.id}
                        >
                          Delete
                        </Button>
                      </footer>
                    </article>
                  );
                })}
              </div>
            )
          ) : (
            <div className="table-section">
              <GenericTable<InspectionSummary>
                data={inspections}
                columns={columns}
                loading={loadingList}
                emptyText="No inspections"
                onRowClick={(row) => onOpenInspection(row.id)}
                cellProps={(_row, col) =>
                  col.key === "actions"
                    ? {
                        onClick: (event) => event.stopPropagation(),
                      }
                    : {}
                }
              />
            </div>
          )}
        </div>
      </main>

      <input
        ref={fileInputRef}
        type="file"
        accept=".zip"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </div>
  );
};

export default InspectionListPage;


