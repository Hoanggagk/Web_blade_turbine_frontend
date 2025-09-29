import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProjectPage from "../pages/ProjectPage";
import { projectService } from "../api/auth/projectService";
import type { ProjectUI, ProjectListResponse } from "../api/types/typesprojectService";
import { mapApiToUI } from "../api/types/typesprojectService";

const ProjectPageLogic: React.FC = () => {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<ProjectUI[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingList, setLoadingList] = useState(false);

  // 👇 state pagination
  const [page, setPage] = useState(1);
  const pageSize = 15; // số item mỗi trang

  const listReqIdRef = useRef(0);

  const fetchProjects = useCallback(async () => {
    setLoadingList(true);
    const reqId = ++listReqIdRef.current;

    const res = await projectService.list();
    if (reqId !== listReqIdRef.current) return;

    if (!res.ok) {
      alert(res.message || "Failed to fetch projects");
      setLoadingList(false);
      return;
    }

    const payload = res.data as ProjectListResponse;
    const mapped: ProjectUI[] = (payload?.projects ?? [])
      .map((p) => mapApiToUI(p))
      .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));

    setProjects(mapped);
    setLoadingList(false);
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchProjects();
    };
    window.addEventListener("visibilitychange", onVisible);
    return () => window.removeEventListener("visibilitychange", onVisible);
  }, [fetchProjects]);

  // filter theo search
  const filtered = useMemo(() => {
    const k = searchTerm.trim().toLowerCase();
    if (!k) return projects;
    return projects.filter((p) => p.name.toLowerCase().includes(k));
  }, [projects, searchTerm]);

  // pagination slice
  const total = filtered.length;
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const onRowClick = (p: ProjectUI) => {
    navigate(`/project/${p.id}/windfarms`, { state: { project: p } });
  };

  return (
    <ProjectPage
      projects={paged}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      loadingList={loadingList}
      onRowClick={onRowClick}
      // 👇 pagination props
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={setPage}
    />
  );
};

export default ProjectPageLogic;
