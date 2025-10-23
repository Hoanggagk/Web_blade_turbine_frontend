import React, { useEffect, useRef } from "react";
import "../styles/components/Modal.css";

export type Field = {
  key: string;
  label: string;
  type?: "text" | "email" | "number" | "password" | "textarea" | "file";
  placeholder?: string;
  editable?: boolean;
  value?: string;
};

export type FieldColumn = Field & {
  render?: (value: string, onChange: (v: string) => void) => React.ReactNode;
};

type ModalFormProps = {
  isOpen: boolean;
  header?: string;
  fields: FieldColumn[];
  values: Record<string, string | undefined>;
  onChange: (key: string, value: string) => void;
  onClose: () => void;
  onSave?: () => void;
  footer?: React.ReactNode;
};

const CloseIcon: React.FC = () => (
  <svg
    viewBox="0 0 16 16"
    focusable="false"
    aria-hidden="true"
    width="12"
    height="12"
  >
    <path
      d="M3.22 3.22a.75.75 0 0 1 1.06 0L8 6.94l3.72-3.72a.75.75 0 1 1 1.06 1.06L9.06 8l3.72 3.72a.75.75 0 1 1-1.06 1.06L8 9.06l-3.72 3.72a.75.75 0 1 1-1.06-1.06L6.94 8 3.22 4.28a.75.75 0 0 1 0-1.06Z"
      fill="currentColor"
    />
  </svg>
);

const ModalForm = ({
  isOpen,
  header,
  fields,
  values,
  onChange,
  onClose,
  onSave,
  footer,
}: ModalFormProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close modal when the Escape key is pressed
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === overlayRef.current) {
          overlayRef.current!.dataset.closable = "true";
        }
      }}
      onMouseUp={(e) => {
        if (
          overlayRef.current?.dataset.closable === "true" &&
          e.target === overlayRef.current
        ) {
          onClose();
        }
        if (overlayRef.current) overlayRef.current.dataset.closable = "false";
      }}
    >
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button
          className="modal-close"
          onClick={onClose}
          type="button"
          aria-label="Close modal"
        >
          <CloseIcon />
        </button>

        {header && <h2 className="modal-header">{header}</h2>}

        <form
          className="modal-form"
          onSubmit={(e) => {
            e.preventDefault();
            onSave?.();
          }}
        >
          {fields.map((field) => {
            const value = values[field.key] ?? "";
            const handleChange = (v: string) => onChange(field.key, v);

            return (
              <div className="modal-field" key={field.key}>
                <label htmlFor={field.key}>{field.label}</label>

                {field.render ? (
                  field.render(value, handleChange)
                ) : field.type === "textarea" ? (
                  <textarea
                    id={field.key}
                    value={value}
                    placeholder={field.placeholder}
                    disabled={field.editable === false}
                    onChange={(e) => handleChange(e.target.value)}
                  />
                ) : field.type === "file" ? (
                  <input
                    id={field.key}
                    type="file"
                    multiple
                    disabled={field.editable === false}
                    onChange={(e) => {
                      // Collect file names for display; the actual file data is managed externally
                      const files = e.target.files
                        ? Array.from(e.target.files).map((f) => f.name).join(", ")
                        : "";
                      handleChange(files);
                    }}
                  />
                ) : (
                  <input
                    id={field.key}
                    type={field.type || "text"}
                    value={value}
                    placeholder={field.placeholder}
                    disabled={field.editable === false}
                    onChange={(e) => handleChange(e.target.value)}
                  />
                )}
              </div>
            );
          })}

          {footer && <div className="modal-footer">{footer}</div>}
        </form>
      </div>
    </div>
  );
};

export default ModalForm;
