import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import WindfarmPage from "../pages/WinfarmPage";
import { windfarmService } from "../api/auth/winfarmService";
import type {
  WindfarmUI,
  WindfarmListResponse,
  WindfarmCreateRequest,
  WindfarmUpdateRequest,
} from "../api/types/typewinfarmService";
import { mapApiToUI } from "../api/types/typewinfarmService";
import { useParams, useLocation, useNavigate } from "react-router-dom";

type LocationState = { project?: { id: string; name: string } };

const useDebounce = <T,>(value: T, delay = 400) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
};

const WindfarmLogic: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const projectNameFromState = (location.state as LocationState | undefined)?.project?.name;

  // state
  const [items, setItems] = useState<WindfarmUI[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [limit] = useState(50);
  const [loadingList, setLoadingList] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createValues, setCreateValues] = useState({ name: "", location: "" });
  const [loadingCreate, setLoadingCreate] = useState(false);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailValues, setDetailValues] = useState<Record<string, string>>({});
  const [loadingUpdate, setLoadingUpdate] = useState(false);

  const [loadingDeleteId, setLoadingDeleteId] = useState<string | null>(null);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    setOffset(0);
  }, [debouncedSearch]);

  useEffect(() => {
    setOffset(0);
    setItems([]);
    setTotal(0);
    setSearchTerm("");
  }, [projectId]);

  const fetchList = useCallback(async () => {
    if (!projectId) return;
    setLoadingList(true);
    const res = await windfarmService.listByProject({
      project_id: projectId,
      limit,
      offset,
      search: debouncedSearch.trim() || undefined,
    });
    if (!mounted.current) return;
    setLoadingList(false);

    if (!res.ok) {
      if (res.message) alert(res.message);
      return;
    }
    const payload = res.data as WindfarmListResponse;
    const arr = (payload.windfarms ?? []).map(mapApiToUI);
    setItems(arr);
    setTotal(payload.total ?? arr.length);
  }, [projectId, limit, offset, debouncedSearch]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // Create
  const onOpenCreate = () => setShowCreateModal(true);
  const onCloseCreate = () => {
    setShowCreateModal(false);
    setCreateValues({ name: "", location: "" });
  };
  const onCreateSubmit = async () => {
    if (loadingCreate || !projectId) return;

    const body: WindfarmCreateRequest = {
      name: createValues.name.trim(),
      location: createValues.location.trim(),
    };
    if (!body.name || !body.location) return;

    setLoadingCreate(true);
    const res = await windfarmService.create(projectId, body);
    if (!mounted.current) return;
    setLoadingCreate(false);

    if (!res.ok) {
      if (res.message) alert(res.message);
      return;
    }
    onCloseCreate();
    fetchList();
  };

  // Detail
  const onOpenDetail = (wf: WindfarmUI) => {
    setShowDetailModal(true);
    setDetailId(wf.id);
    setDetailValues({
      id: wf.id,
      name: wf.name,
      description: wf.description,
      own_company: wf.own_company,
      location: wf.location,
      project_name: wf.project_name ?? "",
      turbine_count: String(wf.turbine_count ?? 0),
      created_by_display: `${wf.created_by.name} (${wf.created_by.email})`, // ✅ chỉ hiển thị
    });
  };
  const onCloseDetail = () => {
    setShowDetailModal(false);
    setDetailId(null);
    setDetailValues({});
  };
  const setDetailValue = (k: string, v: string) =>
    setDetailValues((s) => ({ ...s, [k]: v }));

  const onDetailSave = async () => {
    if (!detailId) return;

    const body: WindfarmUpdateRequest = {
      name: detailValues.name?.trim() || undefined,
      location: detailValues.location?.trim() || undefined,
      description: detailValues.description?.trim() || undefined,
      own_company: detailValues.own_company?.trim() || undefined,
    };
    if (!body.name || !body.location) return;

    setLoadingUpdate(true);
    const res = await windfarmService.update(detailId, body);
    if (!mounted.current) return;
    setLoadingUpdate(false);

    if (!res.ok) {
      if (res.message) alert(res.message);
      return;
    }
    onCloseDetail();
    fetchList();
  };

  // Delete
  const onDelete = async (wf: WindfarmUI) => {
    if (!window.confirm(`Delete windfarm "${wf.name}"?`)) return;
    setLoadingDeleteId(wf.id);
    const res = await windfarmService.remove(wf.id);
    if (!mounted.current) return;
    setLoadingDeleteId(null);

    if (!res.ok) {
      if (res.message) alert(res.message);
      return;
    }
    fetchList();
  };

  const computedProjectName = useMemo(() => {
    if (projectNameFromState?.trim()) return projectNameFromState;
    const fromList = items.find((x) => x.project_name?.trim())?.project_name;
    return fromList ?? "";
  }, [projectNameFromState, items]);

  const handleRowClick = (wf: WindfarmUI) => {
    if (!projectId) return;
    navigate(`/project/${projectId}/windfarms/${wf.id}/turbines`, {
      state: {
        project: { id: projectId, name: computedProjectName || "" },
        windfarm: { id: wf.id, name: wf.name },
      },
    });
  };

  return (
    <WindfarmPage
      projectId={projectId}
      projectName={computedProjectName}
      windfarms={items}
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
      setCreateValues={(k, v) => setCreateValues((s) => ({ ...s, [k]: v }))}
      onCreateSubmit={onCreateSubmit}
      loadingCreate={loadingCreate}
      showDetailModal={showDetailModal}
      onOpenDetail={onOpenDetail}
      onCloseDetail={onCloseDetail}
      detailValues={detailValues}
      setDetailValue={setDetailValue}
      onDetailSave={onDetailSave}
      loadingUpdate={loadingUpdate}
      onDelete={onDelete}
      loadingDeleteId={loadingDeleteId}
      onRowClick={handleRowClick}
    />
  );
};

export default WindfarmLogic;
