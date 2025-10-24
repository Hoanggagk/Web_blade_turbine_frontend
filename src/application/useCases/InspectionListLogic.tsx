import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import InspectionListPage, {
  type FilterStatus,
} from "../../presentation/pages/InspectionListPage";
import {
  inspectionService,
  type InspectionSummary,
} from "../../infrastructure/http/auth/inspectionService";

type RouteParams = {
  turbineId?: string;
};

type LocationState = {
  turbine?: {
    id: string;
    name?: string;
  };
};

const DEFAULT_LIMIT = 50;

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
  "pending",
  "new",
  "created",
  "false",
  "0",
]);

const mapStatusToFilter = (row: InspectionSummary): FilterStatus => {
  const totalImages =
    typeof row.total_images === "number" ? Math.max(row.total_images, 0) : undefined;
  if (
    typeof row.processed_images === "number" &&
    totalImages &&
    totalImages > 0 &&
    row.processed_images >= totalImages
  ) {
    return "checked";
  }
  const normalized = (row.status || "").trim().toLowerCase();
  if (CHECKED_LABELS.has(normalized)) return "checked";
  if (UNCHECKED_LABELS.has(normalized)) return "unchecked";
  return "unchecked";
};

const mapFilterToApiStatus = (_filter: FilterStatus): string | undefined => undefined;

const InspectionListLogic: React.FC = () => {
  const { turbineId = "" } = useParams<RouteParams>();
  const navigate = useNavigate();
  const location = useLocation() as { state?: LocationState };

  const [inspections, setInspections] = useState<InspectionSummary[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadCapturedAt, setUploadCapturedAt] = useState("");
  const [turbineName, setTurbineName] = useState(location.state?.turbine?.name ?? "");

  useEffect(() => {
    if (location.state?.turbine?.name) {
      setTurbineName(location.state.turbine.name);
    }
  }, [location.state?.turbine?.name]);

  const turbineNavState = useMemo(
    () =>
      turbineId
        ? {
            turbine: {
              id: turbineId,
              name: turbineName || undefined,
            },
          }
        : undefined,
    [turbineId, turbineName],
  );
  const fetchInspections = useCallback(async () => {
    if (!turbineId) return;
    setLoadingList(true);
    try {
      const apiStatus = mapFilterToApiStatus(statusFilter);
      const result = await inspectionService.listByTurbine(turbineId, {
        status: apiStatus,
        limit: DEFAULT_LIMIT,
        offset: 0,
      });
      if (!result.ok) {
        alert(result.message || "Failed to load inspections");
        setInspections([]);
        return;
      }
      const list = Array.isArray(result.data) ? result.data : [];
      setInspections(list);
    } catch (error) {
      console.error("Failed to load inspections:", error);
      alert("Failed to load inspections");
      setInspections([]);
    } finally {
      setLoadingList(false);
    }
  }, [turbineId, statusFilter]);

  useEffect(() => {
    fetchInspections();
  }, [fetchInspections]);

  const displayInspections = useMemo(() => {
    const lowered = searchTerm.trim().toLowerCase();
    return inspections.filter((ins) => {
      const statusMatch =
        statusFilter === "all" || mapStatusToFilter(ins) === statusFilter;
      const label = ins.code || ins.name || ins.id || "";
      const matchesSearch = !lowered || label.toLowerCase().includes(lowered);
      return statusMatch && matchesSearch;
    });
  }, [inspections, searchTerm, statusFilter]);

  const handleUploadZip = useCallback(
    async (file: File) => {
      if (!turbineId) {
        alert("Missing turbine ID");
        return;
      }
      setUploading(true);
      try {
        const result = await inspectionService.uploadZip(turbineId, file, {
          captured_at: uploadCapturedAt
            ? new Date(uploadCapturedAt).toISOString()
            : undefined,
        });
        if (!result.ok) {
          alert(result.message || "Upload failed");
          return;
        }
        await fetchInspections();
        if (result.data?.inspection_id) {
          navigate(`/turbine/${turbineId}/inspection/${result.data.inspection_id}`, {
            state: turbineNavState,
          });
        }
        setUploadCapturedAt("");
      } catch (error) {
        console.error("Upload failed:", error);
        alert("Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [turbineId, fetchInspections, navigate, turbineNavState, uploadCapturedAt],
  );

  const handleDeleteInspection = useCallback(
    async (inspectionId: string) => {
      if (!inspectionId) return;
      if (!window.confirm("Delete this inspection?")) return;
      setDeletingId(inspectionId);
      try {
        const result = await inspectionService.deleteInspection(inspectionId);
        if (!result.ok) {
          alert(result.message || "Delete failed");
          return;
        }
        await fetchInspections();
      } catch (error) {
        console.error("Delete failed:", error);
        alert("Delete failed");
      } finally {
        setDeletingId(null);
      }
    },
    [fetchInspections],
  );

  const handleStatusFilterChange = useCallback((next: FilterStatus) => {
    setStatusFilter(next);
  }, []);

  const handleRefresh = useCallback(() => {
    fetchInspections();
  }, [fetchInspections]);

  const handleOpenInspection = useCallback(
    (inspectionId: string) => {
      navigate(`/turbine/${turbineId}/inspection/${inspectionId}`, {
        state: turbineNavState,
      });
    },
    [navigate, turbineId, turbineNavState],
  );

  return (
    <InspectionListPage
      turbineId={turbineId}
      inspections={displayInspections}
      loadingList={loadingList}
      uploading={uploading}
      deletingId={deletingId}
      statusFilter={statusFilter}
      searchTerm={searchTerm}
      onSearchTermChange={setSearchTerm}
      onStatusFilterChange={handleStatusFilterChange}
      onUploadZip={handleUploadZip}
      onRefresh={handleRefresh}
      onOpenInspection={handleOpenInspection}
      onDeleteInspection={handleDeleteInspection}
      turbineName={turbineName}
      uploadCapturedAt={uploadCapturedAt}
      onUploadCapturedAtChange={setUploadCapturedAt}
    />
  );
};

export default InspectionListLogic;
