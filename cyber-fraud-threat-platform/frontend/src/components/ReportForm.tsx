import { CSSProperties } from "react";

interface ReportFormProps {
  onSubmit?: (data: any) => void;
  onCancel?: () => void;
}

const ReportForm = ({ onSubmit, onCancel }: ReportFormProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit({});
    }
  };

  const styles: { [key: string]: CSSProperties } = {
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "16px",
    },
    formGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
    },
    label: {
      fontSize: "14px",
      fontWeight: "500",
      color: "#f1f5f9",
    },
    input: {
      padding: "10px 12px",
      backgroundColor: "#334155",
      border: "1px solid #475569",
      borderRadius: "4px",
      color: "#f1f5f9",
      fontSize: "14px",
      fontFamily: "inherit",
    },
    textarea: {
      padding: "10px 12px",
      backgroundColor: "#334155",
      border: "1px solid #475569",
      borderRadius: "4px",
      color: "#f1f5f9",
      fontSize: "14px",
      fontFamily: "inherit",
      minHeight: "100px",
      resize: "vertical" as const,
    },
    buttonGroup: {
      display: "flex",
      gap: "12px",
      justifyContent: "flex-end",
      marginTop: "8px",
    },
    submitBtn: {
      padding: "10px 16px",
      backgroundColor: "#10b981",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontWeight: "600",
      fontSize: "14px",
    },
    cancelBtn: {
      padding: "10px 16px",
      backgroundColor: "#475569",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontWeight: "600",
      fontSize: "14px",
    },
  };

  return (
    <form style={styles.form} className="report-form" aria-label="Report form" onSubmit={handleSubmit}>
      <div style={styles.formGroup}>
        <label style={styles.label}>Fraud Type</label>
        <input type="text" style={styles.input} placeholder="e.g., Phishing, Fake Website" />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Platform Affected</label>
        <input type="text" style={styles.input} placeholder="e.g., Facebook, Instagram, Email" />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Description</label>
        <textarea style={styles.textarea} placeholder="Describe the incident in detail..." />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Amount Lost (Optional)</label>
        <input type="number" style={styles.input} placeholder="Amount in INR" />
      </div>

      <div style={styles.buttonGroup}>
        {onCancel && (
          <button type="button" style={styles.cancelBtn} onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" style={styles.submitBtn}>
          Submit Report
        </button>
      </div>
    </form>
  );
};

export default ReportForm;