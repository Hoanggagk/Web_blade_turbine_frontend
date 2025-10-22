import { useState } from "react";
import "../styles/UploadPage.css";
import Sidebar from "../components/sidebar";

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // validate loại file hợp lệ
  const isValidFile = (file: File) => {
    const validTypes = ["image/jpeg", "image/png", "application/zip"];
    return validTypes.includes(file.type);
  };

  // chọn file / thư mục
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = e.target.files ? Array.from(e.target.files) : [];
    const validFiles = newFiles.filter(isValidFile);
    setFiles((prev) => [...prev, ...validFiles]);
  };

  // kéo thả file hoặc folder
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(isValidFile);
    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  // xoá 1 file
  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // xoá tất cả file
  const clearAll = () => setFiles([]);

  return (
    <div className="UploadPage">
      {/* Sidebar */}
      <aside className="sidebar-content">
        <Sidebar />
      </aside>

      {/* Main */}
      <main className="main-content">
        <div className="content-container">
          {/* Header */}
          <div className="header">
            <div className="turbine">Turbine: A01</div>
            <div className="session">Session name: Test-01</div>
          </div>

          {/* Body */}
          <div className="body">
            {/* Upload box */}
            <div
              className={`upload-box ${isDragging ? "drag-over" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <p>Drag and drop file(s) or folders here, or:</p>
              <input
                type="file"
                multiple
                // @ts-ignore cho phép chọn folder
                webkitdirectory=""
                // @ts-ignore cho phép chọn folder
                directory=""
                accept=".jpg,.jpeg,.png,.zip"
                style={{ display: "none" }}
                id="fileInput"
                onChange={handleFileChange}
              />
              <label htmlFor="fileInput" className="select-btn">
                Select file / folder
              </label>
            </div>

            {/* Right panel */}
            <div className="right-panel">
              <div className="card files-card">
                <p className="card-title">Uploaded Files</p>
                {files.length === 0 ? (
                  <p>No files uploaded yet</p>
                ) : (
                  <>
                    <ul className="file-list">
                      {files.map((file, i) => (
                        <li key={i} className="file-item">
                          {file.type.startsWith("image/") ? (
                            <img
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              className="file-preview"
                            />
                          ) : (
                            <span className="file-icon">📦</span>
                          )}
                          <span className="file-name">{file.name}</span>
                          <span className="file-size">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                          <button
                            className="remove-btn"
                            onClick={() => removeFile(i)}
                          >
                            ❌
                          </button>
                        </li>
                      ))}
                    </ul>
                    <button className="clear-all" onClick={clearAll}>
                      Clear All
                    </button>
                  </>
                )}
              </div>

              <div className="card">
                <p className="card-title">Supported Formats:</p>
                <p>folder, .zip, .jpg, .png</p>
                <p className="learn-more">Learn more</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
