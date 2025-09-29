import Sidebar from "../components/sidebar";
import GenericTable, { type Column } from "../components/table";
import Button from "../components/button";
import type { AuditLogUI } from "../api/types/typeautditService";
import "../styles/AuditPage.css";

type AuditLogsPageProps = {
  logs: AuditLogUI[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;

  // filter
  action: string;
  setAction: (s: string) => void;
  entityType: string;
  setEntityType: (s: string) => void;
  onFilter: () => void;
};

function AuditLogsPage({
  logs,
  loading,
  page,
  pageSize,
  total,
  onPageChange,
  action,
  setAction,
  entityType,
  setEntityType,
  onFilter,
}: AuditLogsPageProps) {
  // --- Định nghĩa cột bảng ---
  const columns: Column<AuditLogUI>[] = [
    { key: "index", header: "#", size: 0.05, render: (_r, i) => i + 1 },
    {
      key: "timestamp",
      header: "Time",
      size: 0.15,
      render: (r) =>
        r.timestamp ? new Date(r.timestamp).toLocaleString() : "",
    },
    { key: "actor_name", header: "Actor", size: 0.15 },
    { key: "action", header: "Action", size: 0.1 },
    { key: "entity_type", header: "Entity", size: 0.1 },
    { key: "entity_id", header: "Entity ID", size: 0.2 },
    { key: "ip_address", header: "IP", size: 0.1 },
  ];

  return (
    <div className="AuditLogsPage">
      <aside className="sidebar-content">
        <Sidebar />
      </aside>

      <main className="main-content">
        <div className="content-body">
          {/* Toolbar filter */}
          <div className="toolbar">
            <select value={action} onChange={(e) => setAction(e.target.value)}>
              <option value="">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="STATUS_CHANGE">STATUS_CHANGE</option>
            </select>

            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
            >
              <option value="">All Entities</option>
              <option value="PROJECT">PROJECT</option>
              <option value="WINDFARM">WINDFARM</option>
              <option value="TURBINE">TURBINE</option>
              <option value="INVITATION">INVITATION</option>
            </select>

            <Button onClick={onFilter} variant="submit">
              Apply
            </Button>
          </div>

          {/* Table */}
          <GenericTable<AuditLogUI>
            data={logs}
            columns={columns}
            loading={loading}
            emptyText="No logs found"
            stickyHeader
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={onPageChange}
          />
        </div>
      </main>
    </div>
  );
}

export default AuditLogsPage;
