import React, { useState } from "react";

const projectsData = [
  {
    id: 1,
    name: "Project A",
    windfarms: [
      {
        id: 11,
        name: "Windfarm 1",
        turbines: [
          {
            id: 111,
            name: "Turbine X",
            sessions: ["Session 1", "Session 2"],
          },
        ],
      },
    ],
  },
];

type TreeModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const TreeModal: React.FC<TreeModalProps> = ({ isOpen, onClose }) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleNode = (key: string) => {
    const newSet = new Set(expandedNodes);
    if (newSet.has(key)) newSet.delete(key);
    else newSet.add(key);
    setExpandedNodes(newSet);
  };

  const renderSessions = (sessions: string[], parentKey: string) =>
    sessions.map((session, idx) => (
      <div
        key={`${parentKey}-session-${idx}`}
        style={{
          marginLeft: 40,
          border: "1px solid #ddd",
          padding: "2px 6px",
          borderRadius: 3,
          backgroundColor: "#f9f9f9",
        }}
      >
        {session}
      </div>
    ));

  const renderTurbines = (turbines: any[], parentKey: string) =>
    turbines.map((turbine) => {
      const key = `${parentKey}-turbine-${turbine.id}`;
      return (
        <div key={key}>
          <div
            style={{
              marginLeft: 20,
              border: "1px solid #ccc",
              padding: "4px 8px",
              borderRadius: 4,
              cursor: "pointer",
              backgroundColor: "#f1f1f1",
            }}
            onClick={() => toggleNode(key)}
          >
            {expandedNodes.has(key) ? "v " : "> "} {turbine.name}
          </div>
          {expandedNodes.has(key) && renderSessions(turbine.sessions, key)}
        </div>
      );
    });

  const renderWindfarms = (windfarms: any[], parentKey: string) =>
    windfarms.map((wf) => {
      const key = `${parentKey}-wf-${wf.id}`;
      return (
        <div key={key}>
          <div
            style={{
              border: "1px solid #bbb",
              padding: "6px 10px",
              borderRadius: 4,
              cursor: "pointer",
              backgroundColor: "#eaeaea",
            }}
            onClick={() => toggleNode(key)}
          >
            {expandedNodes.has(key) ? "v " : "> "} {wf.name}
          </div>
          {expandedNodes.has(key) && renderTurbines(wf.turbines, key)}
        </div>
      );
    });

  const renderProjects = () =>
    projectsData.map((project) => {
      const key = `project-${project.id}`;
      return (
        <div key={key}>
          <div
            style={{
              border: "1px solid #999",
              padding: "8px 12px",
              borderRadius: 4,
              cursor: "pointer",
              backgroundColor: "#ddd",
            }}
            onClick={() => toggleNode(key)}
          >
            {expandedNodes.has(key) ? "v " : "> "} {project.name}
          </div>
          {expandedNodes.has(key) && renderWindfarms(project.windfarms, key)}
        </div>
      );
    });

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.3)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: 20,
          width: 500,
          maxHeight: "80vh",
          overflowY: "auto",
          borderRadius: 6,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <h2 style={{ margin: 0 }}>Project Structure</h2>
          <button onClick={onClose}>Close</button>
        </div>

        <div>{renderProjects()}</div>
      </div>
    </div>
  );
};

export default TreeModal;
