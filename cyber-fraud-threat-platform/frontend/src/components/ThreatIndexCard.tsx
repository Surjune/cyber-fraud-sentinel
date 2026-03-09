import { CSSProperties } from "react";

interface ThreatIndexCardProps {
  level?: "high" | "medium" | "low";
  children?: React.ReactNode;
}

const ThreatIndexCard = ({ level = "medium", children }: ThreatIndexCardProps) => {
  const getLevelStyles = (level: string): CSSProperties => {
    const baseStyles: CSSProperties = {
      padding: "16px",
      borderRadius: "8px",
      border: "1px solid",
    };

    switch (level) {
      case "high":
        return {
          ...baseStyles,
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          borderColor: "#ef4444",
          color: "#fecaca",
        };
      case "medium":
        return {
          ...baseStyles,
          backgroundColor: "rgba(245, 158, 11, 0.1)",
          borderColor: "#f59e0b",
          color: "#fcd34d",
        };
      case "low":
        return {
          ...baseStyles,
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          borderColor: "#10b981",
          color: "#a7f3d0",
        };
      default:
        return baseStyles;
    }
  };

  return (
    <div
      style={getLevelStyles(level)}
      role="article"
      aria-label={`Threat card with ${level} severity`}
      className={`threat-card ${level}`}
    >
      {children}
    </div>
  );
};

export default ThreatIndexCard;
