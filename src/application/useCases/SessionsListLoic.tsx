import { useState } from "react";
import SessionsListPage from "../../presentation/pages/SessionsListPage";
import { useNavigate } from "react-router-dom";

type Session = {
  id: string;
  name: string;
  created: string;
  images: number;
  note: string;
};

function SessionsListLogic() {
  // --- Data
  const [sessions, setSessions] = useState<Session[]>([
    {
      id: "1",
      name: "Session Alpha",
      created: "2025-08-19",
      images: 3,
      note: "Initial inspection",
    },
    {
      id: "2",
      name: "Session Beta",
      created: "2025-08-18",
      images: 5,
      note: "Follow-up check",
    },
  ]);
  const [searchTerm, setSearchTerm] = useState("");

  // --- Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");

  // --- Detail modal
  const [detailData, setDetailData] = useState<Session | null>(null);

  // --- Note view / edit modal
  const [viewNoteData, setViewNoteData] = useState<Session | null>(null);
  const [editNoteData, setEditNoteData] = useState<Session | null>(null);

  // --- Filtered list
  const filteredSessions = sessions.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

const navigate = useNavigate();

const handleRowClick = (ses: Session) => {
  navigate(`/dashboard/${ses.id}`);
};

  return (
    <SessionsListPage
  sessions={filteredSessions}
  searchTerm={searchTerm}
  setSearchTerm={setSearchTerm}
  // --- Create
  showCreateModal={showCreateModal}
  newName={newName}
  setNewName={setNewName}
  onCreateClick={() => setShowCreateModal(true)}
  onCancelCreate={() => setShowCreateModal(false)}
  onRowClick={handleRowClick}
  onCreateSubmit={(name) => {
    const newSes: Session = {
      id: Date.now().toString(),
      name,
      created: new Date().toISOString().slice(0, 10),
      images: 0,
      note: "No note yet",
    };
    setSessions([...sessions, newSes]);
    setShowCreateModal(false);
    setNewName("");
  }}
  // --- Detail modal
  detailData={detailData}
  onOpenDetail={(ses) => setDetailData(ses)}   // ✅ chỉ giữ 1 lần thôi
  onDetailChange={(ses) => setDetailData(ses)}
  onCloseDetail={() => setDetailData(null)}
  onSaveDetail={() => {
    if (detailData) {
      setSessions(
        sessions.map((s) =>
          s.id === detailData.id ? detailData : s
        )
      );
    }
    setDetailData(null);
  }}
  onDeleteDetail={() => {
    if (detailData) {
      setSessions(sessions.filter((s) => s.id !== detailData.id));
    }
    setDetailData(null);
  }}
  // --- Note view modal
  viewNoteData={viewNoteData}
  onOpenNoteView={(ses) => setViewNoteData(ses)}
  onCloseNoteView={() => setViewNoteData(null)}
  onEditNote={() => {
    if (viewNoteData) {
      setEditNoteData(viewNoteData);
      setViewNoteData(null);
    }
  }}
  // --- Note edit modal
  editNoteData={editNoteData}
  onCloseNoteEdit={() => setEditNoteData(null)}
  onSaveNote={(newNote) => {
    if (editNoteData) {
      const updated = { ...editNoteData, note: newNote };
      setSessions(
        sessions.map((s) => (s.id === updated.id ? updated : s))
      );
      setEditNoteData(null);
    }
  }}
  onDeleteNote={() => {
    if (editNoteData) {
      const updated = { ...editNoteData, note: "" };
      setSessions(
        sessions.map((s) => (s.id === updated.id ? updated : s))
      );
      setEditNoteData(null);
    }
  }}
/>
  );
}
export default SessionsListLogic;
