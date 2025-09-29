import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import WindfarmAdminPage from "../pages/WindfarmAdminPage";
import { windfarmService } from "../api/auth/winfarmService";
import type {
  WindfarmUI,
  WindfarmAdminListResponse,
  WindfarmUpdateRequest,
} from "../api/types/typewinfarmService";
import { mapApiToUI } from "../api/types/typewinfarmService";

const useDebounce = <T,>(value: T, delay = 400) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
};

const WindfarmAdminPageLogic: React.FC = () => {
  const [items, setItems] = useState<WindfarmUI[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [limit] = useState(15); // test phân trang nhỏ
  const [loadingList, setLoadingList] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailValues, setDetailValues] = useState<Record<string, string>>({});
  const [loadingUpdate, setLoadingUpdate] = useState(false);

  const [loadingDeleteId, setLoadingDeleteId] = useState<string | null>(null);

  // Bulk delete state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loadingBulkDelete, setLoadingBulkDelete] = useState(false);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  /** fetch list windfarms (admin) */
  const fetchList = useCallback(async () => {
    setLoadingList(true);
    const res = await windfarmService.listAll({ limit, offset });
    if (!mounted.current) return;
    setLoadingList(false);
    if (!res.ok) {
      if (res.message) alert(res.message);
      return;
    }
    const payload = res.data as WindfarmAdminListResponse;
    const arr = (payload.windfarms ?? []).map(mapApiToUI);
    setItems(arr);
    setTotal(payload.total ?? arr.length);
  }, [limit, offset]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  /** open detail modal */
  const onOpenDetail = (wf: WindfarmUI) => {
    setShowDetailModal(true);
    setDetailId(wf.id);
    setDetailValues({
      id: wf.id,
      name: wf.name,
      description: wf.description ?? "",
      own_company: wf.own_company ?? "",
      location: wf.location ?? "",
      project_name: wf.project_name ?? "",
      turbine_count: String(wf.turbine_count ?? 0),
      created_at: wf.created_at ?? "",
      updated_at: wf.updated_at ?? "",
      created_by_name: wf.created_by?.name ?? "",
    });
  };
  const onCloseDetail = () => {
    setShowDetailModal(false);
    setDetailId(null);
    setDetailValues({});
  };
  const setDetailValue = (k: string, v: string) =>
    setDetailValues((s) => ({ ...s, [k]: v }));

  /** save detail (update windfarm) */
  const onDetailSave = async () => {
    if (!detailId) return;
    const body: WindfarmUpdateRequest = {
      name: detailValues.name?.trim() || undefined,
      location: detailValues.location?.trim() || undefined,
      description: detailValues.description?.trim() || undefined,
      own_company: detailValues.own_company?.trim() || undefined,
    };
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

  /** delete windfarm */
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
    const remaining = items.length - 1;
    if (remaining <= 0 && offset > 0) setOffset(Math.max(0, offset - limit));
    else fetchList();
  };

  /** bulk delete */
  const onBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} windfarms?`)) return;

    setLoadingBulkDelete(true);
    const res = await windfarmService.bulkDelete(selectedIds);
    if (!mounted.current) return;
    setLoadingBulkDelete(false);

    if (!res.ok) {
      if (res.message) alert(res.message);
      return;
    }
    setSelectedIds([]);
    fetchList();
  };

  /** toggle row select */
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === items.length) setSelectedIds([]);
    else setSelectedIds(items.map((x) => x.id));
  };

  /** filter with search */
  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (x) =>
        x.name.toLowerCase().includes(q) ||
        (x.own_company ?? "").toLowerCase().includes(q) ||
        (x.location ?? "").toLowerCase().includes(q) ||
        (x.project_name ?? "").toLowerCase().includes(q)
    );
  }, [items, debouncedSearch]);

  return (
    <WindfarmAdminPage
      windfarms={filtered}
      loadingList={loadingList}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      total={total}
      limit={limit}
      offset={offset}
      onOffsetChange={setOffset}
      showDetailModal={showDetailModal}
      onOpenDetail={onOpenDetail}
      onCloseDetail={onCloseDetail}
      detailValues={detailValues}
      setDetailValue={setDetailValue}
      onDetailSave={onDetailSave}
      loadingUpdate={loadingUpdate}
      onDelete={onDelete}
      loadingDeleteId={loadingDeleteId}
      selectedIds={selectedIds}
      toggleSelect={toggleSelect}
      toggleSelectAll={toggleSelectAll}
      onBulkDelete={onBulkDelete}
      loadingBulkDelete={loadingBulkDelete}
    />
  );
};

export default WindfarmAdminPageLogic;
