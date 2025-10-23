import React, { useEffect, useState } from "react";
import TurbinePage from "../../presentation/pages/TurbinePage";
import { turbineService } from "../../infrastructure/http/auth/turbineService";
import type {
  TurbineUI,
  TurbineCreateRequest,
  TurbineUpdateRequest,
} from "../../domain/turbines/models";
import { mapApiToUI } from "../../domain/turbines/models";
import { useParams, useLocation, useNavigate } from "react-router-dom";


type LocationState = {
  project?: { id: string; name: string };
  windfarm?: { id: string; name: string };
};

type CreateValues = {
  name: string;
  serialNo?: string;
  capacityMw?: string;
  coordinates?: string;
  description?: string;
};

function mapUIToUpdatePayload(values: Record<string, string>): TurbineUpdateRequest {
  const payload: TurbineUpdateRequest = {};
  if (values.name) payload.name = values.name;
  if (values.description !== undefined) payload.description = values.description;
  if (values.serialNo !== undefined) payload.serial_no = values.serialNo;
  if (values.coordinates !== undefined) payload.coordinates = values.coordinates;
  if (values.capacityMw !== undefined && values.capacityMw !== "") {
    const n = Number(values.capacityMw);
    if (!Number.isNaN(n)) payload.capacity_mw = n;
  }
  return payload;
}
/** debounce hook */
const useDebounced = (value: string, delay = 300) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
};

const TurbinePageLogic: React.FC = () => {
  const params = useParams<{ windfarmId?: string }>();
  const location = useLocation();
  const locState = (location.state || {}) as LocationState;
  const navigate = useNavigate();
  const windfarmId = params.windfarmId || locState.windfarm?.id || "";
  const windfarmName = locState.windfarm?.name || "";
  const projectId = locState.project?.id || "";
  const projectName = locState.project?.name || "";

  /** list state */
  const [turbines, setTurbines] = useState<TurbineUI[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounced(searchTerm, 350);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);

  /** create state */
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createValues, setCreateValuesState] = useState<CreateValues>({ name: "" });
  const updateCreateValues = (k: keyof CreateValues, v: string) =>
    setCreateValuesState((s) => ({ ...s, [k]: v }));
  const [loadingCreate, setLoadingCreate] = useState(false);

  /** detail state */
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailValues, setDetailValues] = useState<Record<string, string>>({});
  const [loadingUpdate, setLoadingUpdate] = useState(false);

  /** delete state */
  const [loadingDeleteId, setLoadingDeleteId] = useState<string | null>(null);

  /** fetch list dÃ¹ng chung */
  const fetchList = (opts?: { resetPage?: boolean }) => {
    if (!windfarmId) return;
    const ctrl = new AbortController();
    setLoadingList(true);
    const newOffset = opts?.resetPage ? 0 : offset;

    turbineService
      .listByWindfarm(
        windfarmId,
        { limit, offset: newOffset, search: debouncedSearch || undefined },
        ctrl.signal
      )
      .then((res) => {
        if (res.message === "canceled") return;
        if (!res.ok) {
          alert(res.message || "Failed to load turbines");
          return;
        }
        const d = res.data;
        const list = Array.isArray(d?.turbines) ? d.turbines.map(mapApiToUI) : [];
        setTurbines(list);
        setTotal(typeof d?.total === "number" ? d.total : list.length);
        setLimit(typeof d?.limit === "number" && d.limit > 0 ? d.limit : 50);
        if (opts?.resetPage) setOffset(0);
      })
      .finally(() => setLoadingList(false));

    return () => ctrl.abort();
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windfarmId, limit, offset, debouncedSearch]);

  /** create */
  const onOpenCreate = () => setShowCreateModal(true);
  const onCloseCreate = () => setShowCreateModal(false);

  const onCreateSubmit = () => {
    if (!windfarmId) return;
    if (!createValues.name.trim()) return;
    setLoadingCreate(true);

    const payload: TurbineCreateRequest = {
      name: createValues.name.trim(),
      description: createValues.description?.trim() || undefined,
      serial_no: createValues.serialNo?.trim() || undefined,
      coordinates: createValues.coordinates?.trim() || undefined,
      capacity_mw:
        createValues.capacityMw && createValues.capacityMw.trim() !== ""
          ? Number(createValues.capacityMw)
          : undefined,
    };

    turbineService
      .create(windfarmId, payload)
      .then((res) => {
        if (!res.ok) {
          alert(res.message || "Create turbine failed");
          return;
        }
        setShowCreateModal(false);
        setCreateValuesState({ name: "" });
        fetchList({ resetPage: true });
      })
      .finally(() => setLoadingCreate(false));
  };

  /** detail */
  const onOpenDetail = (tb: TurbineUI) => {
    setDetailValues({
      id: tb.id,
      windfarmId: tb.windfarm_id,
      windfarmName: tb.windfarm_name ?? "",
      name: tb.name,
      serialNo: tb.serial_no ?? "",
      capacityMw: String(tb.capacity_mw ?? ""),
      coordinates: tb.coordinates ?? "",
      description: tb.description ?? "",
      createdAt: tb.created_at ?? "",
      updatedAt: tb.updated_at ?? "",
      createdByName: tb.created_by?.name ?? "",
    });
    setShowDetailModal(true);
  };

  const onCloseDetail = () => setShowDetailModal(false);

  const onDetailSave = () => {
    const id = detailValues.id;
    if (!id) return;
    setLoadingUpdate(true);

    const payload = mapUIToUpdatePayload(detailValues);

    turbineService
      .update(id, payload)
      .then((res) => {
        if (!res.ok) {
          alert(res.message || "Update turbine failed");
          return;
        }
        fetchList();
        setShowDetailModal(false);
      })
      .finally(() => setLoadingUpdate(false));
  };

  /** delete */
  const onDelete = (tb: TurbineUI) => {
    if (!confirm(`Delete turbine "${tb.name}"?`)) return;
    setLoadingDeleteId(tb.id);
    turbineService
      .delete(tb.id)
      .then((res) => {
        if (!res.ok) {
          alert(res.message || "Delete turbine failed");
          return;
        }
        fetchList();
      })
      .finally(() => setLoadingDeleteId(null));
  };

return (
  <TurbinePage
    projectId={projectId}
    projectName={projectName}
    windfarmId={windfarmId}
    windfarmName={windfarmName}
    turbines={turbines}
    loadingList={loadingList}
    searchTerm={searchTerm}
    setSearchTerm={setSearchTerm}
    total={total}
    limit={limit}
    offset={offset}
    onOffsetChange={setOffset}
    showCreateModal={showCreateModal}
    onOpenCreate={onOpenCreate}
    onCloseCreate={onCloseCreate}
    createValues={createValues}
    setCreateValues={updateCreateValues}
    onCreateSubmit={onCreateSubmit}
    loadingCreate={loadingCreate}
    showDetailModal={showDetailModal}
    onOpenDetail={onOpenDetail}
    onCloseDetail={onCloseDetail}
    detailValues={detailValues}
    setDetailValue={(k, v) => setDetailValues((s) => ({ ...s, [k]: v }))}
    onDetailSave={onDetailSave}
    loadingUpdate={loadingUpdate}
    onDelete={onDelete}
    loadingDeleteId={loadingDeleteId}
    onRowClick={(tb) => navigate(`/turbine/${tb.id}`)} // âœ… thÃªm dÃ²ng nÃ y
  />
);

};

export default TurbinePageLogic;
