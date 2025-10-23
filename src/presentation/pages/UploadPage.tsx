import { useCallback, useEffect, useRef, useState } from "react";
import Sidebar from "../components/sidebar";
import "../styles/UploadPage.css";

type UploadItem = {
  file: File;
  previewUrl?: string;
};

const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "application/zip",
]);

const isValidFile = (file: File) =>
  ACCEPTED_TYPES.has(file.type) || file.name.toLowerCase().endsWith(".zip");

const createPreviewUrl = (file: File) =>
  file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;

const revokePreviewUrl = (url?: string) => {
  if (url) {
    URL.revokeObjectURL(url);
  }
};

export default function UploadPage() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const itemsRef = useRef<UploadItem[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(
    () => () => {
      itemsRef.current.forEach((item) => revokePreviewUrl(item.previewUrl));
    },
    []
  );

  const appendFiles = useCallback((files: File[]) => {
    if (!files.length) return;
    setItems((prev) => {
      const next: UploadItem[] = [...prev];
      files.forEach((file) => {
        if (!isValidFile(file)) return;
        next.push({ file, previewUrl: createPreviewUrl(file) });
      });
      return next;
    });
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = event.target.files;
      if (!fileList) return;
      appendFiles(Array.from(fileList));
      event.target.value = "";
    },
    [appendFiles]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      const validFiles = Array.from(event.dataTransfer.files).filter(isValidFile);
      appendFiles(validFiles);
    },
    [appendFiles]
  );

  const removeItem = useCallback((index: number) => {
    setItems((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      revokePreviewUrl(removed?.previewUrl);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    itemsRef.current.forEach((item) => revokePreviewUrl(item.previewUrl));
    setItems([]);
  }, []);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="UploadPage">
      <aside className="sidebar-content">
        <Sidebar />
      </aside>

      <main className="main-content">
        <div className="upload-header">
          <div>
            <h1>Turbine Upload</h1>
            <p className="subtitle">
              Drag and drop inspection files or choose them from your device.
            </p>
          </div>
          <button className="btn-primary" onClick={openFilePicker} type="button">
            Select files
          </button>
        </div>

        <div
          className={`upload-dropzone${isDragging ? " is-dragging" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <p className="dropzone-title">
            Drop folders or files here, or click to browse.
          </p>
          <p className="dropzone-hint">Supported: ZIP, JPG, PNG</p>
          <button className="btn-link" type="button" onClick={openFilePicker}>
            Select files
          </button>
          <input
            ref={fileInputRef}
            id="upload-input"
            type="file"
            multiple
            accept=".zip,.jpg,.jpeg,.png"
            style={{ display: "none" }}
            onChange={handleFileChange}
            // @ts-ignore allow selecting directories in chromium
            webkitdirectory=""
            // @ts-ignore allow selecting directories in chromium
            directory=""
          />
        </div>

        <section className="upload-summary">
          <header className="summary-header">
            <h2>Selected files</h2>
            <span>{items.length}</span>
          </header>

          {items.length === 0 ? (
            <div className="empty-state">No files selected yet.</div>
          ) : (
            <>
              <ul className="uploaded-list">
                {items.map((item, index) => (
                  <li key={`${item.file.name}-${index}`} className="upload-item">
                    {item.previewUrl ? (
                      <img
                        src={item.previewUrl}
                        alt={item.file.name}
                        className="upload-thumb"
                      />
                    ) : (
                      <span className="upload-icon" aria-hidden="true">
                        📦
                      </span>
                    )}
                    <div className="upload-meta">
                      <span className="upload-name">{item.file.name}</span>
                      <span className="upload-size">
                        {(item.file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <button
                      type="button"
                      className="upload-remove"
                      onClick={() => removeItem(index)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="btn-secondary"
                onClick={clearAll}
              >
                Clear all
              </button>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
