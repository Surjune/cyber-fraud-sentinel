import { CSSProperties } from "react";

interface Incident {
  id: number;
  title: string;
  type: string;
  risk_level: string;
  date: string;
}

interface IncidentListProps {
  incidents?: Incident[];
  loading?: boolean;
}

const getRiskLevelBadgeStyle = (risk_level: string): CSSProperties => {
  const colors: { [key: string]: { bg: string; text: string } } = {
    critical: { bg: "#7c3aed", text: "#e9d5ff" },
    high: { bg: "#ef4444", text: "#fecaca" },
    medium: { bg: "#f59e0b", text: "#fcd34d" },
    low: { bg: "#10b981", text: "#a7f3d0" },
  };
  const riskLevelLower = risk_level?.toLowerCase() || "low";
  const color = colors[riskLevelLower] || colors.low;
  return {
    padding: "4px 8px",
    backgroundColor: color.bg,
    color: color.text,
    borderRadius: "3px",
    fontSize: "11px",
    fontWeight: "600",
    whiteSpace: "nowrap",
  };
};

const IncidentList = ({ incidents = [], loading = false }: IncidentListProps) => {
  const styles: { [key: string]: CSSProperties } = {
    container: {
      display: "flex",
      flexDirection: "column",
      gap: "12px",
    },
    heading: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#f1f5f9",
      margin: 0,
    },
    emptyState: {
      padding: "24px",
      textAlign: "center",
      color: "#94a3b8",
      fontSize: "14px",
      backgroundColor: "#1e293b",
      borderRadius: "4px",
    },
    incidentItem: {
      padding: "12px",
      backgroundColor: "#1e293b",
      border: "1px solid #334155",
      borderRadius: "4px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    incidentInfo: {
      flex: 1,
    },
    incidentTitle: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#f1f5f9",
      margin: "0 0 4px 0",
    },
    incidentMeta: {
      fontSize: "12px",
      color: "#94a3b8",
      margin: 0,
    },
  };

  return (
    <div style={styles.container} className="incident-list" role="region" aria-label="Recent incidents list">
      <h2 style={styles.heading}>Recent Incidents</h2>

      {loading && (
        <div style={styles.emptyState}>
          <p style={{ margin: 0 }}>Loading incidents...</p>
        </div>
      )}

      {!loading && incidents.length === 0 && (
        <div style={styles.emptyState}>
          <p style={{ margin: 0 }}>No incidents recorded yet.</p>
        </div>
      )}

      {!loading && incidents.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {incidents.map((incident) => (
            <div key={incident.id} style={styles.incidentItem}>
              <div style={styles.incidentInfo}>
                <h3 style={styles.incidentTitle}>{incident.title}</h3>
                <p style={styles.incidentMeta}>
                  {incident.type} • {new Date(incident.date).toLocaleDateString()}
                </p>
              </div>
              <div style={getRiskLevelBadgeStyle(incident.risk_level)}>
                {incident.risk_level.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default IncidentList;