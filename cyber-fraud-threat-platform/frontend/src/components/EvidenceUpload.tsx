import { CSSProperties } from "react";

interface EvidenceUploadProps {
  onUpload?: (files: FileList) => void;
}

const EvidenceUpload = ({ onUpload }: EvidenceUploadProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && onUpload) {
      onUpload(e.target.files);
    }
  };

  const styles: { [key: string]: CSSProperties } = {
    container: {
      width: "100%",
      padding: "24px",
      backgroundColor: "#1e293b",
      border: "2px dashed #475569",
      borderRadius: "8px",
      textAlign: "center",
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    uploadArea: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "12px",
    },
    label: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#f1f5f9",
      margin: 0,
      cursor: "pointer",
    },
    fileInput: {
      display: "none",
    },
    hint: {
      fontSize: "13px",
      color: "#94a3b8",
      margin: 0,
    },
  };

  return (
    <div style={styles.container} className="evidence-upload">
      <div style={styles.uploadArea} className="upload-area">
        <label htmlFor="fileInput" style={styles.label} className="upload-label">
          📎 Upload Evidence Files
        </label>
        <input
          id="fileInput"
          type="file"
          multiple
          onChange={handleFileChange}
          accept="image/*,.pdf,.doc,.docx"
          aria-label="Upload evidence files"
          style={styles.fileInput}
          className="file-input"
        />
        <p style={styles.hint} className="upload-hint">
          Drag and drop files or click to select
        </p>
      </div>
    </div>
  );
};

export default EvidenceUpload;
