import { useEffect, useMemo, useRef, useState } from "react";
import { auditService } from "../../infrastructure/http/auth/auditService";
import type { AuditLog, AuditLogsQuery } from "../../domain/audit/models";
import { mapAuditToUI, type AuditLogUI } from "../../domain/audit/models";
import AuditLogsPage from "../../presentation/pages/AuditPage";

const csvCell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
};

function AuditLogsLogic() {
  const [logs, setLogs] = useState<AuditLogUI[]>([]);
  const [loading, setLoading] = useState(false);

  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [actor, setActor] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [total, setTotal] = useState(0);

  const [autoRefresh, setAutoRefresh] = useState(false);
  const timerRef = useRef<number | null>(null);

  const [stats, setStats] = useState<any>(null);

  const query = useMemo<AuditLogsQuery>(
    () => ({
      action: action || undefined,
      entity_type: entityType || undefined,
      actor_id: actor || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    [action, entityType, actor, startDate, endDate, page]
  );

  const loadLogs = async () => {
    setLoading(true);
    const res = await auditService.getLogs(query);
    if (res.ok) {
      setLogs(res.data.logs.map((l: AuditLog) => mapAuditToUI(l)));
      setTotal(res.data.total);
    } else {
      alert(res.message || "Failed to load logs");
    }
    setLoading(false);
  };

  const exportLogs = () => {
    if (!logs.length) return;
    const allKeys = Object.keys(logs[0].raw);
    const header = allKeys.map(csvCell).join(",");
    const rows = logs.map((l) =>
      allKeys.map((k) => csvCell((l.raw as any)[k])).join(",")
    );
    const csv = header + "\n" + rows.join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit-logs-full.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadStats = async () => {
    const res = await auditService.getStats();
    if (res.ok) setStats(res.data);
  };

  useEffect(() => {
    loadLogs();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    if (!autoRefresh) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = window.setInterval(() => {
      loadLogs();
      loadStats();
    }, 30000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [autoRefresh, query]);

  const applyFilter = () => {
    setPage(1);
    loadLogs();
    loadStats();
  };

  return (
    <AuditLogsPage
      logs={logs}
      loading={loading}
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={setPage}
      action={action}
      setAction={setAction}
      entityType={entityType}
      setEntityType={setEntityType}
      actor={actor}
      setActor={setActor}
      startDate={startDate}
      setStartDate={setStartDate}
      endDate={endDate}
      setEndDate={setEndDate}
      onFilter={applyFilter}
      onExport={exportLogs}
      autoRefresh={autoRefresh}
      setAutoRefresh={setAutoRefresh}
      stats={stats}
    />
  );
}

export default AuditLogsLogic;
