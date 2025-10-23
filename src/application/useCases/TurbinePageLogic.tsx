import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import TurbinePage from "../../presentation/pages/TurbinePage";
import { turbineService } from "../../infrastructure/http/auth/turbineService";
import { projectService } from "../../infrastructure/http/auth/projectService";
import { windfarmService } from "../../infrastructure/http/auth/winfarmService";
import type {
  TurbineCreateRequest,
  TurbineUpdateRequest,
  TurbineUI,
} from "../../domain/turbines/models";
import { mapApiToUI } from "../../domain/turbines/models";

type RouteParams = {
  projectId?: string;
  windfarmId?: string;
};

type LocationState = {
  project?: { id: string; name?: string };
  windfarm?: { id: string; name?: string };
};

type CreateValues = {
  name: string;
  serialNo?: string;
  capacityMw?: string;
  coordinates?: string;
  description?: string;
};

const useDebounced = (value: string, delay = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
};

const mapUIToUpdatePayload = (
  values: Record<string, string>
): TurbineUpdateRequest => {
  const payload: TurbineUpdateRequest = {};
  if (values.name) payload.name = values.name;
  if (values.description !== undefined) payload.description = values.description;
  if (values.serialNo !== undefined) payload.serial_no = values.serialNo;
  if (values.coordinates !== undefined) payload.coordinates = values.coordinates;
  if (values.capacityMw !== undefined && values.capacityMw.trim() !== "") {
    const parsed = Number(values.capacityMw);
    if (!Number.isNaN(parsed)) payload.capacity_mw = parsed;
  }
  return payload;
};

const TurbinePageLogic: React.FC = () => {
  const { projectId = "", windfarmId = "" } = useParams<RouteParams>();
  const location = useLocation() as { state?: LocationState };
  const navigate = useNavigate();
  const locationState = location.state ?? {};

  const [projectName, setProjectName] = useState(locationState.project?.name ?? "");
  const [windfarmName, setWindfarmName] = useState(locationState.windfarm?.name ?? "");

  const [turbines, setTurbines] = useState<TurbineUI[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounced(searchTerm, 350);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [listRevision, setListRevision] = useState(0);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createValues, setCreateValues] = useState<CreateValues>({ name: "" });
  const [loadingCreate, setLoadingCreate] = useState(false);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailValues, setDetailValues] = useState<Record<string, string>>({});
  const [loadingUpdate, setLoadingUpdate] = useState(false);

  const [loadingDeleteId, setLoadingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (locationState.project?.name) {
      setProjectName(locationState.project.name);
    }
  }, [locationState.project?.name]);

  useEffect(() => {
    if (locationState.windfarm?.name) {
      setWindfarmName(locationState.windfarm.name);
    }
  }, [locationState.windfarm?.name]);

  useEffect(() => {
    if (!projectId || projectName) return;
    let active = true;
    const controller = new AbortController();

    projectService.detail(projectId, controller.signal).then((res) => {
      if (!active) return;
      if (res.ok && res.data?.name) {
        setProjectName(res.data.name);
      }
    });

    return () => {
      active = false;
      controller.abort();
    };
  }, [projectId, projectName]);

  useEffect(() => {
    if (!windfarmId || windfarmName) return;
    let active = true;
    const controller = new AbortController();

    windfarmService.detail(windfarmId, controller.signal).then((res) => {
      if (!active) return;
      if (res.ok && res.data?.name) {
        setWindfarmName(res.data.name);
      }
      if (res.ok && res.data?.project_name && !projectName) {
        setProjectName(res.data.project_name);
      }
    });

    return () => {
      active = false;
      controller.abort();
    };
  }, [windfarmId, windfarmName, projectName]);

  useEffect(() => {
    if (!windfarmId) {
      setTurbines([]);
      setTotal(0);
      setLoadingList(false);
      return;
    }

    let active = true;
    const controller = new AbortController();

    const load = async () => {
      setLoadingList(true);
      try {
        const res = await turbineService.listByWindfarm(
          windfarmId,
          {
            limit,
            offset,
            search: debouncedSearch || undefined,
          },
          controller.signal
        );

        if (!active) return;
        if (!res.ok) {
          if (res.message?.toLowerCase() !== "canceled") {
            alert(res.message || "Failed to load turbines");
          }
          return;
        }

        const payload = res.data;
        const list = Array.isArray(payload?.turbines)
          ? payload.turbines.map(mapApiToUI)
          : [];
        setTurbines(list);
        setTotal(
          typeof payload?.total === "number" ? payload.total : list.length
        );
        if (
          typeof payload?.limit === "number" &&
          payload.limit > 0 &&
          payload.limit !== limit
        ) {
          setLimit(payload.limit);
        }
      } finally {
        if (active) {
          setLoadingList(false);
        }
      }
    };

    load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [windfarmId, limit, offset, debouncedSearch, listRevision]);

  useEffect(() => {
    if (!windfarmId) return;
    setOffset(0);
    setListRevision((rev) => rev + 1);
  }, [windfarmId]);

  const refreshList = useCallback((options?: { resetPage?: boolean }) => {
    if (options?.resetPage) {
      setOffset((prev) => (prev === 0 ? prev : 0));
    }
    setListRevision((rev) => rev + 1);
  }, []);

  const onOpenCreate = () => setShowCreateModal(true);
  const onCloseCreate = () => setShowCreateModal(false);

  const updateCreateValue = (key: keyof CreateValues, value: string) => {
    setCreateValues((prev) => ({ ...prev, [key]: value }));
  };

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
        setCreateValues({ name: "" });
        refreshList({ resetPage: true });
      })
      .finally(() => setLoadingCreate(false));
  };

  const onOpenDetail = (turbine: TurbineUI) => {
    setDetailValues({
      id: turbine.id,
      windfarmId: turbine.windfarm_id,
      windfarmName: turbine.windfarm_name ?? "",
      name: turbine.name,
      serialNo: turbine.serial_no ?? "",
      capacityMw: String(turbine.capacity_mw ?? ""),
      coordinates: turbine.coordinates ?? "",
      description: turbine.description ?? "",
      createdAt: turbine.created_at ?? "",
      updatedAt: turbine.updated_at ?? "",
      createdByName: turbine.created_by?.name ?? "",
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
        refreshList();
        setShowDetailModal(false);
      })
      .finally(() => setLoadingUpdate(false));
  };

  const onDelete = (turbine: TurbineUI) => {
    if (!confirm(`Delete turbine "${turbine.name}"?`)) return;
    setLoadingDeleteId(turbine.id);
    turbineService
      .delete(turbine.id)
      .then((res) => {
        if (!res.ok) {
          alert(res.message || "Delete turbine failed");
          return;
        }
        refreshList();
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
      setCreateValues={updateCreateValue}
      onCreateSubmit={onCreateSubmit}
      loadingCreate={loadingCreate}
      showDetailModal={showDetailModal}
      onOpenDetail={onOpenDetail}
      onCloseDetail={onCloseDetail}
      detailValues={detailValues}
      setDetailValue={(key, value) =>
        setDetailValues((prev) => ({ ...prev, [key]: value }))
      }
      onDetailSave={onDetailSave}
      loadingUpdate={loadingUpdate}
      onDelete={onDelete}
      loadingDeleteId={loadingDeleteId}
      onRowClick={(row) => navigate(`/turbine/${row.id}`)}
    />
  );
};

export default TurbinePageLogic;
