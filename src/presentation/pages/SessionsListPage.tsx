import Sidebar from "../components/sidebar";
import "../styles/SessionsListPage.css";
type Session = {
  id: string;
  name: string;
  created: string;
  images: number;
  note: string;
};

type SessionPageProps = {
  sessions: Session[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;

  showCreateModal: boolean;
  detailData: Session | null;
  newName: string;
  setNewName: (name: string) => void;

  onRowClick: (ses: Session) => void;
  onOpenDetail: (ses: Session) => void;
  onDetailChange: (ses: Session) => void;

  onCreateClick: () => void;
  onCancelCreate: () => void;
  onCreateSubmit: (name: string) => void;

  onCloseDetail: () => void;
  onSaveDetail: () => void;
  onDeleteDetail: () => void;

  // --- Note view
  viewNoteData: Session | null;
  onOpenNoteView: (ses: Session) => void;
  onCloseNoteView: () => void;
  onEditNote: () => void;

  // --- Note edit
  editNoteData: Session | null;
  onCloseNoteEdit: () => void;
  onSaveNote: (newNote: string) => void;
  onDeleteNote: () => void;
};

function SessionsListPage({
  sessions,
  searchTerm,
  setSearchTerm,
  showCreateModal,
  detailData,
  newName,
  setNewName,
  onRowClick,
  onOpenDetail,
  onDetailChange,
  onCreateClick,
  onCancelCreate,
  onCreateSubmit,
  onCloseDetail,
  onSaveDetail,
  onDeleteDetail,
  // note
  viewNoteData,
  onOpenNoteView,
  onCloseNoteView,
  onEditNote,
  editNoteData,
  onCloseNoteEdit,
  onSaveNote,
  onDeleteNote,
}: SessionPageProps) {
  return (
    <div className="SessionPage">
      {/* Sidebar */}
      <aside className="sidebar-content">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-body">
          {/* Toolbar */}
          <div className="toolbar">
            <button className="btn-create" onClick={onCreateClick}>
              + Create
            </button>
            <input
              type="text"
              className="search-input"
              placeholder="Search session name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Table */}
          <div className="table-container">
            <table className="session-table">
              <thead>
                <tr>
                  <th>Created</th>
                  <th>Session</th>
                  <th>Images</th>
                  <th>Note</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="no-data">
                      No sessions found.
                    </td>
                  </tr>
                ) : (
                  sessions.map((ses) => (
                    <tr
                      key={ses.id}
                      className="table-row"
                      onClick={() => onRowClick(ses)}
                    >
                      <td>{ses.created}</td>
                      <td>{ses.name}</td>
                      <td>{ses.images}</td>
                      <td>
                        <span
                          className="note-view"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenNoteView(ses);
                          }}
                        >
                          View note
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-detail"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenDetail(ses);
                          }}
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 className="modal-title">Create Session</h3>
            <div className="modal-body">
              <input
                type="text"
                className="modal-input"
                placeholder="Session Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-cancel" onClick={onCancelCreate}>
                Cancel
              </button>
              <button
                className="btn btn-submit"
                onClick={() => onCreateSubmit(newName.trim())}
                disabled={!newName.trim()}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailData && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 className="modal-title">Session Detail</h3>
            <div className="modal-body">
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  className="modal-input"
                  value={detailData?.name ?? ""}
                  onChange={(e) =>
                    detailData &&
                    onDetailChange({ ...detailData, name: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label>Created</label>
                <input
                  type="text"
                  className="modal-input readonly"
                  value={detailData?.created ?? ""}
                  readOnly
                />
              </div>

              <div className="form-group">
                <label>Images</label>
                <input
                  type="text"
                  className="modal-input readonly"
                  value={String(detailData?.images ?? "")}
                  readOnly
                />
              </div>

              <div className="form-group">
                <label>Note</label>
                <input
                  type="text"
                  className="modal-input readonly"
                  value={detailData?.note ?? ""}
                  readOnly
                />
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-cancel" onClick={onCloseDetail}>
                Close
              </button>
              <button className="btn btn-delete" onClick={onDeleteDetail}>
                Delete
              </button>
              <button className="btn btn-submit" onClick={onSaveDetail}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note View Modal */}
      {viewNoteData && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 className="modal-title">View Note</h3>
            <div className="modal-body">
              <p>{viewNoteData.note || "No note yet"}</p>
            </div>
            <div className="modal-actions">
              <button className="btn btn-cancel" onClick={onCloseNoteView}>
                Close
              </button>
              <button className="btn btn-submit" onClick={onEditNote}>
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note Edit Modal */}
      {editNoteData && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 className="modal-title">Edit Note</h3>
            <div className="modal-body">
              <textarea
                className="modal-textarea"
                defaultValue={editNoteData.note}
                onChange={(e) =>
                  onDetailChange({ ...editNoteData, note: e.target.value })
                }
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-cancel" onClick={onCloseNoteEdit}>
                Cancel
              </button>
              <button
                className="btn btn-delete"
                onClick={onDeleteNote}
              >
                Delete
              </button>
              <button
                className="btn btn-submit"
                onClick={() =>
                  onSaveNote(editNoteData.note)
                }
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SessionsListPage;
