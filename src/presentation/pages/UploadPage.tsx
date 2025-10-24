import { useCallback, useEffect, useRef, useState } from "react";
import Sidebar from "../components/sidebar";
import Button from "../components/button";
import "../styles/UploadPage.css";

type UploadItem = {
  file: File;
  previewUrl?: string;
};

const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "application/zip"]);

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
    <div className="app-shell app-shell--viewport upload-page">
      <aside className="page-sidebar">
        <Sidebar />
      </aside>

      <main className="page-main page-main--padded">
        <div className="page-body">
          <header className="upload-page__header">
            <div className="upload-page__title-block">
              <h1 className="upload-page__title">Turbine Upload</h1>
              <p className="upload-page__subtitle">
                Drag and drop inspection files or choose them from your device.
              </p>
            </div>
            <Button variant="submit" onClick={openFilePicker} type="button">
              Select files
            </Button>
          </header>

          <div
            className={`upload-page__dropzone${isDragging ? " is-dragging" : ""}`}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <p className="upload-page__dropzone-title">Drop folders or files here, or click to browse.</p>
            <p className="upload-page__dropzone-hint">Supported: ZIP, JPG, PNG</p>
            <button className="upload-page__link" type="button" onClick={openFilePicker}>
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
              // @ts-ignore allow selecting directories
              webkitdirectory=""
              // @ts-ignore allow selecting directories
              directory=""
            />
          </div>

          <section className="upload-page__summary">
            <header className="upload-page__summary-header">
              <h2 className="upload-page__summary-title">Selected files</h2>
              <span className="upload-page__summary-count">{items.length}</span>
            </header>

            {items.length === 0 ? (
              <div className="upload-page__empty">No files selected yet.</div>
            ) : (
              <>
                <ul className="upload-page__list">
                  {items.map((item, index) => (
                    <li key={`${item.file.name}-${index}`} className="upload-page__item">
                      {item.previewUrl ? (
                        <img src={item.previewUrl} alt={item.file.name} className="upload-page__thumb" />
                      ) : (
                        <span className="upload-page__icon" aria-hidden="true">
                          ZIP
                        </span>
                      )}
                      <div className="upload-page__meta">
                        <span className="upload-page__name">{item.file.name}</span>
                        <span className="upload-page__size">{(item.file.size / 1024).toFixed(1)} KB</span>
                      </div>
                      <button
                        type="button"
                        className="upload-page__remove"
                        onClick={() => removeItem(index)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="upload-page__footer">
                  <Button variant="ghost" type="button" onClick={clearAll}>
                    Clear all
                  </Button>
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
