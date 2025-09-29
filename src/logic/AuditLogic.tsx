import { useEffect, useState } from "react";
import { auditService } from "../api/auth/auditService";
import AuditLogsPage from "../pages/AuditPage";
import type { AuditLogUI } from "../api/types/typeautditService";

function AuditLogsLogic() {
  const [logs, setLogs] = useState<AuditLogUI[]>([]);
  const [loading, setLoading] = useState(false);

  // filter state
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");

  // pagination
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [total, setTotal] = useState(0);

  const loadLogs = async () => {
    setLoading(true);
    const res = await auditService.listByProject("", {
      action: action || undefined,
      entity_type: entityType || undefined,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    if (res.ok) {
      setLogs(res.data.logs);
      setTotal(res.data.total);
    } else {
      alert(res.message || "Failed to load logs");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

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
      onFilter={() => {
        setPage(1);
        loadLogs();
      }}
    />
  );
}

export default AuditLogsLogic;
