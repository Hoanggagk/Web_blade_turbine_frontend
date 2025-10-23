import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/sidebar";
import Button from "../components/button";
import GenericTable, { type Column } from "../components/table";
import "../styles/ProjectManagementPage.css";
import {
  inspectionService,
  type InspectionSummary,
} from "../../infrastructure/http/auth/inspectionService";

type FilterStatus = "all" | "uploaded" | "processing" | "completed" | "failed";

const formatTimestamp = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const normalizeStatus = (status?: string) => (status || "").trim().toLowerCase();

const InspectionListPage: React.FC = () => {
  const { turbineId } = useParams<{ turbineId: string }>();
  const navigate = useNavigate();

  const [inspections, setInspections] = useState<InspectionSummary[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchInspections = useCallback(async () => {
    if (!turbineId) return;
    setLoadingList(true);
    try {
      const result = await inspectionService.listByTurbine(turbineId);
      if (!result.ok) {
        alert(result.message || "Failed to load inspections");
        setInspections([]);
        return;
      }
      const list = Array.isArray(result.data) ? result.data : [];
      setInspections(list);
    } catch (err) {
      console.error("Failed to load inspections:", err);
      alert("Failed to load inspections");
      setInspections([]);
    } finally {
      setLoadingList(false);
    }
  }, [turbineId]);

  useEffect(() => {
    fetchInspections();
  }, [fetchInspections]);

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
  };

  const uploadZip = async (file: File | null) => {
    if (!file) return;
    if (!turbineId) {
      alert("Missing turbine ID");
      return;
    }

    setUploading(true);
    try {
      const result = await inspectionService.uploadZip(turbineId, file);
      if (!result.ok) {
        alert(result.message || "Upload failed");
        return;
      }
      await fetchInspections();
      if (result.data?.inspection_id) {
        navigate(`/turbine/${turbineId}/inspection/${result.data.inspection_id}`);
      }
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const deleteInspection = useCallback(
    async (inspectionId: string) => {
      if (!inspectionId) return;
      if (!window.confirm("Delete this inspection?")) return;
      setDeletingId(inspectionId);
      try {
        const result = await inspectionService.delete(inspectionId);
        if (!result.ok) {
          alert(result.message || "Delete failed");
          return;
        }
        await fetchInspections();
      } catch (err) {
        console.error("Delete failed:", err);
        alert("Delete failed");
      } finally {
        setDeletingId(null);
      }
    },
    [fetchInspections],
  );

  const filteredInspections = useMemo(() => {
    const lowered = searchTerm.trim().toLowerCase();
    return inspections.filter((ins) => {
      const statusMatch =
        statusFilter === "all" ||
        normalizeStatus(ins.status) === statusFilter;

      const label =
        ins.code || ins.name || ins.id || "";
      const matchesSearch =
        !lowered || label.toLowerCase().includes(lowered);

      return statusMatch && matchesSearch;
    });
  }, [inspections, searchTerm, statusFilter]);

  const columns: Column<InspectionSummary>[] = useMemo(
    () => [
      {
        key: "index",
        header: "#",
        align: "center",
        render: (_row, index) => index + 1,
        headerClassName: "col-center",
        className: "col-center",
      },
      {
        key: "label",
        header: "Inspection",
        render: (row) => row.code || row.name || row.id,
      },
      {
        key: "images",
        header: "Images",
        render: (row) => {
          const total = row.total_images ?? 0;
          const processed = row.processed_images ?? 0;
          return `${total} images (${processed} processed)`;
        },
      },
      {
        key: "status",
        header: "Status",
        className: "col-center",
        headerClassName: "col-center",
        render: (row) => row.status ?? "-",
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
                navigate(`/turbine/${turbineId}/inspection/${row.id}`);
              }}
            >
              View
            </Button>
            <Button
              variant="delete"
              onClick={(event: React.MouseEvent) => {
                event.stopPropagation();
                deleteInspection(row.id);
              }}
              loading={deletingId === row.id}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [deleteInspection, deletingId, navigate, turbineId],
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
              Turbine ID: {turbineId || "Unknown"}
            </p>
          </div>

          <div className="toolbar">
            <input
              type="text"
              className="search-input"
              placeholder="Search inspection..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <select
              className="search-input"
              style={{ flex: "unset", width: 180 }}
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as FilterStatus)
              }
            >
              <option value="all">All statuses</option>
              <option value="uploaded">Uploaded</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
            <div className="toolbar-actions" style={{ gap: 8 }}>
              <Button variant="submit" onClick={handleOpenFilePicker} loading={uploading}>
                Upload ZIP
              </Button>
              <Button variant="detail" onClick={fetchInspections} loading={loadingList}>
                Refresh
              </Button>
            </div>
          </div>

          <div className="table-section">
            <GenericTable<InspectionSummary>
              data={filteredInspections}
              columns={columns}
              loading={loadingList}
              emptyText="No inspections"
              onRowClick={(row) =>
                navigate(`/turbine/${turbineId}/inspection/${row.id}`)
              }
              cellProps={(_row, col) =>
                col.key === "actions"
                  ? {
                      onClick: (event) => event.stopPropagation(),
                    }
                  : {}
              }
            />
          </div>
        </div>
      </main>

      <input
        ref={fileInputRef}
        type="file"
        accept=".zip"
        style={{ display: "none" }}
        onChange={(event) => uploadZip(event.target.files?.[0] ?? null)}
      />
    </div>
  );
};

export default InspectionListPage;
