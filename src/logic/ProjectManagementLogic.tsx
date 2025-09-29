import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProjectManagementPage from "../pages/ProjectManagementPage";
import { projectService } from "../api/auth/projectService";
import type {
  ProjectUI,
  ProjectResponse,
  ProjectListResponse,
} from "../api/types/typesprojectService";
import { mapApiToUI } from "../api/types/typesprojectService";

const ProjectManagementLogic: React.FC = () => {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<ProjectUI[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingList, setLoadingList] = useState(false);

  // Create
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [loadingCreate, setLoadingCreate] = useState(false);

  // Update
  const [showEditModal, setShowEditModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [loadingEdit, setLoadingEdit] = useState(false);

  // Delete
  const [loadingDeleteId, setLoadingDeleteId] = useState<string | null>(null);

  // Pagination (client-side)
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const listReqIdRef = useRef(0);

  // ====== Fetch Projects ======
  const fetchProjects = useCallback(async () => {
    setLoadingList(true);
    const reqId = ++listReqIdRef.current;

    const res = await projectService.listAll();
    if (reqId !== listReqIdRef.current) return;

    if (!res.ok) {
      alert(res.message || "Failed to fetch projects");
      setLoadingList(false);
      return;
    }

    const payload = res.data as ProjectListResponse;
    const mapped = (payload?.projects ?? [])
      .map(mapApiToUI)
      .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));

    setProjects(mapped);
    setLoadingList(false);
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Refresh khi quay lại tab
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchProjects();
    };
    window.addEventListener("visibilitychange", onVisible);
    return () => window.removeEventListener("visibilitychange", onVisible);
  }, [fetchProjects]);

  // ====== Derived ======
  const filtered = useMemo(() => {
    const k = searchTerm.trim().toLowerCase();
    if (!k) return projects;
    return projects.filter((p) => p.name.toLowerCase().includes(k));
  }, [projects, searchTerm]);

  const total = filtered.length;
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  // ====== Create ======
  const onCreateClick = () => setShowCreateModal(true);
  const onCancelCreate = () => {
    setShowCreateModal(false);
    setNewName("");
    setNewDescription("");
  };

  const onCreateSubmit = async (name: string, description: string) => {
    if (!name.trim()) return;
    setLoadingCreate(true);
    const res = await projectService.create({
      name: name.trim(),
      description: description.trim(),
    });
    setLoadingCreate(false);

    if (!res.ok) {
      alert(res.message || "Create project failed");
      return;
    }

    const created = mapApiToUI(res.data as ProjectResponse);
    setProjects((prev) => [created, ...prev]);
    onCancelCreate();
  };

  // ====== Update ======
  const onEditClick = (p: ProjectUI) => {
    setEditId(p.id);
    setEditName(p.name);
    setEditDescription(p.description);
    setShowEditModal(true);
  };

  const onCancelEdit = () => {
    setShowEditModal(false);
    setEditId(null);
    setEditName("");
    setEditDescription("");
  };

  const onEditSubmit = async (name: string, description: string) => {
    if (!editId) return;
    setLoadingEdit(true);
    const res = await projectService.update(editId, {
      name: name.trim(),
      description: description.trim(),
    });
    setLoadingEdit(false);

    if (!res.ok) {
      alert(res.message || "Update project failed");
      return;
    }

    const updated = mapApiToUI(res.data as ProjectResponse);
    setProjects((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
    onCancelEdit();
  };

  // ====== Delete ======
  const onDeleteClick = async (p: ProjectUI) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete project "${p.name}"?`
    );
    if (!confirmDelete) return;

    setLoadingDeleteId(p.id);
    const res = await projectService.remove(p.id);
    setLoadingDeleteId(null);

    if (!res.ok) {
      alert(res.message || "Delete project failed");
      return;
    }

    setProjects((prev) => prev.filter((x) => x.id !== p.id));
  };

  const onManageClick = (p: ProjectUI) => {
    navigate(`/project-management/${p.id}/members`, { state: { project: p } });
  };

  return (
    <ProjectManagementPage
      projects={paged}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      // create
      showCreateModal={showCreateModal}
      newName={newName}
      setNewName={setNewName}
      newDescription={newDescription}
      setNewDescription={setNewDescription}
      onCreateClick={onCreateClick}
      onCancelCreate={onCancelCreate}
      onCreateSubmit={onCreateSubmit}
      loadingCreate={loadingCreate}
      // edit
      showEditModal={showEditModal}
      editName={editName}
      setEditName={setEditName}
      editDescription={editDescription}
      setEditDescription={setEditDescription}
      onCancelEdit={onCancelEdit}
      onEditSubmit={onEditSubmit}
      loadingEdit={loadingEdit}
      // actions
      onManageClick={onManageClick}
      onEditClick={onEditClick}
      onDeleteClick={onDeleteClick}
      loadingDeleteId={loadingDeleteId}
      loadingList={loadingList}
      // paging
      total={total}
      page={page}
      pageSize={pageSize}
      onPageChange={setPage}   // 👈 bạn bị thiếu dòng này
    />
  );
};

export default ProjectManagementLogic;