// src/components/Breadcrumb.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/components/breadcrumb.css";

export type Crumb = {
  label: string;
  path?: string;
};

type Props = {
  items: Crumb[];
  hideFirstSeparator?: boolean;
};

const Breadcrumb: React.FC<Props> = ({ items, hideFirstSeparator }) => {
  const navigate = useNavigate();

  return (
    <nav className="breadcrumb">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        const showSep = !isLast && !(hideFirstSeparator && i === 0);

        return (
          <span
            key={i}
            className={`breadcrumb-item ${isLast ? "current" : ""}`}
          >
            {!isLast && item.path ? (
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.path!);
                }}
              >
                {item.label}
              </a>
            ) : (
              <span>{item.label}</span>
            )}
            {showSep && (
              <span className="breadcrumb-separator" aria-hidden="true">
                ›
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
};


export default Breadcrumb;
