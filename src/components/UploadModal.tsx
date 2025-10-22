import React, { useState } from "react";
import Button from "../components/button";
import "../styles/UploadPage.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (files: File[]) => void;
};

const UploadModal: React.FC<Props> = ({ isOpen, onClose, onConfirm }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  // ✅ Hợp lệ nếu là .zip (nhiều browser dùng "application/x-zip-compressed")
  const isValidFile = (file: File) =>
    file.type === "application/zip" || file.type === "application/x-zip-compressed";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFile = e.target.files?.[0];
    if (newFile && isValidFile(newFile)) {
      setFile(newFile);
    } else {
      setFile(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && isValidFile(droppedFile)) {
      setFile(droppedFile);
    } else {
      setFile(null);
    }
  };

  const handleConfirm = () => {
    if (file) {
      onConfirm([file]); // confirm vẫn trả về mảng
      setFile(null);
    }
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ width: "600px", maxWidth: "95vw" }}>
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>
        <h2 className="modal-header">Upload ZIP File</h2>

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
            <p>Drag and drop a .zip file here, or:</p>
            <input
              type="file"
              accept=".zip"
              style={{ display: "none" }}
              id="fileInputModal"
              onChange={handleFileChange}
            />
            <label htmlFor="fileInputModal" className="select-btn">
              Select .zip file
            </label>
            {file && (
              <p style={{ marginTop: "10px", fontSize: "14px" }}>
                📦 {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {/* Right panel chỉ còn định dạng */}
          <div className="right-panel">
            <div className="card">
              <p className="card-title">Supported Formats:</p>
              <p>.zip only</p>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <Button variant="cancel" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="submit" onClick={handleConfirm} disabled={!file}>
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
