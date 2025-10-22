import { useState } from "react";
import Sidebar from "../components/sidebar";
import GenericTable, { type Column } from "../components/table";
import Button from "../components/button";
import ModalForm from "../components/Modal";
import type { AuditLogUI } from "../../domain/audit/models";
import "../styles/AuditPage.css";

type Props = {
  logs: AuditLogUI[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;

  action: string;
  setAction: (s: string) => void;
  entityType: string;
  setEntityType: (s: string) => void;
  actor: string;
  setActor: (s: string) => void;
  startDate: string;
  setStartDate: (s: string) => void;
  endDate: string;
  setEndDate: (s: string) => void;

  onFilter: () => void;
  onExport: () => void;
  autoRefresh: boolean;
  setAutoRefresh: (b: boolean) => void;
  stats: any;
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
  actor,
  setActor,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onFilter,
  onExport,
  autoRefresh,
  setAutoRefresh,
  stats,
}: Props) {
  // popup phụ
  const [showDescModal, setShowDescModal] = useState(false);
  const [selectedDesc, setSelectedDesc] = useState("");
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [selectedChange, setSelectedChange] = useState<{ before: any; after: any } | null>(null);
  const [showMetaModal, setShowMetaModal] = useState(false);
  const [selectedMeta, setSelectedMeta] = useState<any>(null);

  // columns
  const columns: Column<AuditLogUI>[] = [
    { key: "time", header: "Time", size: 0.15 },
    { key: "actorId", header: "Actor ID", size: 0.12 },
    { key: "actorName", header: "Actor Name", size: 0.15 },
    { key: "actorEmail", header: "Actor Email", size: 0.2 },
    {
      key: "action",
      header: "Action",
      size: 0.1,
      render: (row) => (
        <span
          style={{
            fontWeight: 600,
            color:
              row.action === "DELETE"
                ? "red"
                : row.action === "UPDATE"
                ? "orange"
                : row.action === "CREATE"
                ? "green"
                : "black",
          }}
        >
          {row.action}
        </span>
      ),
    },
    { key: "entityType", header: "Entity Type", size: 0.12 },
    { key: "entityId", header: "Entity ID", size: 0.15 },
    { key: "entityName", header: "Entity Name", size: 0.15 },
    { key: "projectId", header: "Project ID", size: 0.15 },
    { key: "ip", header: "IP Address", size: 0.15 },

    {
      key: "description",
      header: "Description",
      align: "center",
      render: (tb) =>
        tb.description ? (
          <Button
            variant="detail"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedDesc(tb.description ?? "");
              setShowDescModal(true);
            }}
          >
            View
          </Button>
        ) : (
          "—"
        ),
    },
    {
      key: "userAgent",
      header: "User Agent",
      align: "center",
      render: (tb) =>
        tb.userAgent ? (
          <Button
            variant="detail"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedAgent(tb.userAgent ?? "");
              setShowAgentModal(true);
            }}
          >
            View
          </Button>
        ) : (
          "—"
        ),
    },
    {
      key: "changes",
      header: "Changes",
      align: "center",
      render: (tb) =>
        tb.beforeData || tb.afterData ? (
          <Button
            variant="detail"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedChange({
                before: tb.beforeData ?? {},
                after: tb.afterData ?? {},
              });
              setShowChangeModal(true);
            }}
          >
            View
          </Button>
        ) : (
          "—"
        ),
    },
    {
      key: "metadata",
      header: "Metadata",
      align: "center",
      render: (tb) =>
        tb.metadata ? (
          <Button
            variant="detail"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedMeta(tb.metadata ?? {});
              setShowMetaModal(true);
            }}
          >
            View
          </Button>
        ) : (
          "—"
        ),
    },
    { key: "expiresAt", header: "Expires At", size: 0.15 },
  ];

  const totalFromStats =
    stats && typeof stats === "object" && typeof stats.total === "number"
      ? stats.total
      : total;

  return (
    <div className="AuditLogsPage">
      <aside className="sidebar-content">
        <Sidebar />
      </aside>

      <main className="main-content">
        <div className="content-body">
          {/* Summary */}
          <section className="audit-summary">
            <div><b>Total:</b> {totalFromStats}</div>
            <div>
              <b>Page:</b> {page} · <b>Page size:</b> {pageSize} · <b>Showing:</b>{" "}
              {logs.length ? (page - 1) * pageSize + 1 : 0}–
              {(page - 1) * pageSize + logs.length} of {total}
            </div>
          </section>

          {/* Stats */}
          {stats && typeof stats === "object" && (
            <section className="audit-stats">
              {stats.by_action && <p><b>By Action:</b> {JSON.stringify(stats.by_action)}</p>}
              {stats.by_entity && <p><b>By Entity:</b> {JSON.stringify(stats.by_entity)}</p>}
            </section>
          )}

          {/* Toolbar */}
{/* Toolbar */}
<section className="toolbar">
  <div className="filters">
    <select value={action} onChange={(e) => setAction(e.target.value)}>
      <option value="">All Actions</option>
      <option value="CREATE">CREATE</option>
      <option value="UPDATE">UPDATE</option>
      <option value="DELETE">DELETE</option>
      <option value="STATUS_CHANGE">STATUS_CHANGE</option>
      <option value="MEMBER_ADDED">MEMBER_ADDED</option>
      <option value="MEMBER_REMOVED">MEMBER_REMOVED</option>
    </select>
    <select value={entityType} onChange={(e) => setEntityType(e.target.value)}>
      <option value="">All Entities</option>
      <option value="PROJECT">PROJECT</option>
      <option value="WINDFARM">WINDFARM</option>
      <option value="TURBINE">TURBINE</option>
      <option value="PROJECT_MEMBER">PROJECT_MEMBER</option>
    </select>
    <input type="text" placeholder="Actor ID" value={actor} onChange={(e) => setActor(e.target.value)} />
    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
  </div>

  <div className="actions">
    <Button onClick={onFilter}>Apply</Button>
    <Button onClick={onExport}>Export CSV</Button>
    <label className="autorefresh">
      <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
      Auto Refresh
    </label>
  </div>
</section>


          {/* Table */}
          <section className="table-section">
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
          </section>

          {/* Popups */}
          <ModalForm
            isOpen={showDescModal}
            header="Description"
            fields={[{ key: "desc", label: "Description", type: "textarea", editable: false }]}
            values={{ desc: selectedDesc }}
            onChange={() => {}}
            onClose={() => setShowDescModal(false)}
          />
          <ModalForm
            isOpen={showAgentModal}
            header="User Agent"
            fields={[{ key: "ua", label: "User Agent", type: "textarea", editable: false }]}
            values={{ ua: selectedAgent }}
            onChange={() => {}}
            onClose={() => setShowAgentModal(false)}
          />
          <ModalForm
            isOpen={showChangeModal}
            header="Changes"
            fields={[
              {
                key: "before",
                label: "Before",
                type: "textarea",
                editable: false,
                render: () => (
                  <pre className="json-viewer">{JSON.stringify(selectedChange?.before, null, 2)}</pre>
                ),
              },
              {
                key: "after",
                label: "After",
                type: "textarea",
                editable: false,
                render: () => (
                  <pre className="json-viewer">{JSON.stringify(selectedChange?.after, null, 2)}</pre>
                ),
              },
            ]}
            values={{ before: "", after: "" }}
            onChange={() => {}}
            onClose={() => setShowChangeModal(false)}
          />
          <ModalForm
            isOpen={showMetaModal}
            header="Metadata"
            fields={[
              {
                key: "meta",
                label: "Metadata",
                type: "textarea",
                editable: false,
                render: () => (
                  <pre className="json-viewer">{JSON.stringify(selectedMeta, null, 2)}</pre>
                ),
              },
            ]}
            values={{ meta: "" }}
            onChange={() => {}}
            onClose={() => setShowMetaModal(false)}
          />
        </div>
      </main>
    </div>
  );
}

export default AuditLogsPage;
