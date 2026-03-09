import { useNavigate } from "react-router-dom";
import { useEffect, useState, CSSProperties } from "react";

type ThreatData = {
  id: number;
  risk_score: number;
  risk_level: string;
  category: string;
  region: string;
  created_at: string;
};

type DashboardStats = {
  overallThreat: string;
  avgThreatScore: number;
  reportsToday: number;
  reportsThisWeek: number;
  totalReports: number;
  topFraudTypes: { fraud_type: string; count: number }[];
  topPlatforms: { platform: string; count: number }[];
};

type DashboardProps = {
  onReport: () => void;
};

// ============= COLORS & THEME =============
const COLORS = {
  dark: "#0f172a",
  darkSecond: "#1e293b",
  accent: "#ef4444",
  success: "#10b981",
  warning: "#f59e0b",
  info: "#3b82f6",
  critical: "#7c3aed",
  textPrimary: "#0f172a",
  textSecond: "#475569",
  textLight: "#64748b",
  bgLight: "#f8fafc",
  card: "rgba(255, 255, 255, 0.95)",
};

const SHADOWS = {
  sm: "0 1px 3px rgba(0, 0, 0, 0.08)",
  md: "0 4px 12px rgba(0, 0, 0, 0.12)",
  lg: "0 12px 28px rgba(0, 0, 0, 0.15)",
  xl: "0 20px 40px rgba(0, 0, 0, 0.18)",
};

// ============= REUSABLE STYLE OBJECTS =============
const styles = {
  container: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "48px 24px",
    backgroundColor: "var(--bg-light)",
    minHeight: "100vh",
  } as CSSProperties,

  header: {
    marginBottom: 40,
    paddingBottom: 24,
    borderBottom: "1px solid rgba(15, 23, 42, 0.08)",
  } as CSSProperties,

  heading: {
    fontSize: "2rem",
    fontWeight: 700,
    color: COLORS.textPrimary,
    letterSpacing: "-0.5px",
    margin: "0 0 8px 0",
  } as CSSProperties,

  subheading: {
    fontSize: "0.95rem",
    color: COLORS.textLight,
    marginTop: 8,
    fontWeight: 400,
    margin: 0,
  } as CSSProperties,

  actionBar: {
    display: "flex",
    gap: 16,
    marginBottom: 32,
    flexWrap: "wrap" as const,
    justifyContent: "space-between",
    alignItems: "center",
  } as CSSProperties,

  button: {
    padding: "12px 20px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.95rem",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: SHADOWS.sm,
  } as CSSProperties,

  btnPrimary: {
    background: `linear-gradient(135deg, ${COLORS.accent} 0%, #d946ef 100%)`,
    color: "white",
  } as CSSProperties,

  btnSecondary: {
    background: "white",
    color: COLORS.textPrimary,
    border: `1px solid #e2e8f0`,
  } as CSSProperties,

  btnAdmin: {
    background: COLORS.darkSecond,
    color: "white",
  } as CSSProperties,

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 20,
    marginBottom: 32,
  } as CSSProperties,

  card: {
    background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))",
    borderRadius: 12,
    padding: 24,
    boxShadow: "0 8px 24px rgba(2, 6, 23, 0.08)",
    border: "1px solid rgba(15, 23, 42, 0.04)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  } as CSSProperties,

  cardHover: {
    transform: "translateY(-6px)",
    boxShadow: "0 18px 40px rgba(2, 6, 23, 0.12)",
  } as CSSProperties,

  statCard: {
    padding: 24,
    borderRadius: 12,
    background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))",
    boxShadow: "0 8px 24px rgba(2, 6, 23, 0.08)",
    border: "1px solid rgba(15, 23, 42, 0.04)",
  } as CSSProperties,

  statLabel: {
    fontSize: "0.85rem",
    color: COLORS.textLight,
    marginBottom: 12,
    fontWeight: 500,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  } as CSSProperties,

  statValue: {
    fontSize: "2.2rem",
    fontWeight: 700,
    color: COLORS.textPrimary,
    lineHeight: 1.2,
  } as CSSProperties,

  alertCard: {
    display: "flex",
    gap: 14,
    alignItems: "flex-start",
    padding: 18,
    borderRadius: 10,
    background: "linear-gradient(90deg, rgba(255, 250, 240, 0.9), rgba(255, 248, 238, 0.9))",
    borderLeft: `4px solid ${COLORS.warning}`,
    boxShadow: "0 8px 24px rgba(245, 158, 11, 0.08)",
    marginBottom: 32,
  } as CSSProperties,

  chartsSection: {
    display: "grid",
    gridTemplateColumns: "1fr 420px",
    gap: 20,
    marginBottom: 32,
  } as CSSProperties,

  chartCard: {
    padding: 28,
    borderRadius: 12,
    background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))",
    boxShadow: "0 8px 24px rgba(2, 6, 23, 0.08)",
    border: "1px solid rgba(15, 23, 42, 0.04)",
  } as CSSProperties,

  chartTitle: {
    fontSize: "1.2rem",
    fontWeight: 700,
    marginBottom: 20,
    color: COLORS.textPrimary,
    letterSpacing: "-0.5px",
  } as CSSProperties,

  barChart: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 14,
  } as CSSProperties,

  barItem: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr auto",
    gap: 14,
    alignItems: "center",
  } as CSSProperties,

  barLabel: {
    fontSize: "0.95rem",
    fontWeight: 600,
    color: COLORS.textPrimary,
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  } as CSSProperties,

  barContainer: {
    height: 18,
    background: "rgba(0, 0, 0, 0.06)",
    borderRadius: 999,
    overflow: "hidden" as const,
  } as CSSProperties,

  barFill: {
    height: "100%",
    borderRadius: 999,
    background: `linear-gradient(90deg, ${COLORS.accent} 0%, ${COLORS.critical} 100%)`,
    transition: "width 400ms cubic-bezier(0.2, 0.8, 0.2, 1)",
    boxShadow: `0 4px 12px rgba(239, 68, 68, 0.2)`,
  } as CSSProperties,

  barCount: {
    fontSize: "0.95rem",
    fontWeight: 700,
    color: COLORS.textPrimary,
    minWidth: 48,
    textAlign: "right" as const,
  } as CSSProperties,

  threatList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 12,
  } as CSSProperties,

  threatItem: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 8,
    background: "rgba(0, 0, 0, 0.02)",
    border: "1px solid rgba(0, 0, 0, 0.04)",
    transition: "all 0.2s ease",
  } as CSSProperties,

  threatIndicator: {
    width: 10,
    height: 10,
    borderRadius: 2,
    flexShrink: 0,
    marginTop: 4,
  } as CSSProperties,

  threatTitle: {
    fontSize: "0.95rem",
    fontWeight: 600,
    color: COLORS.textPrimary,
  } as CSSProperties,

  threatMeta: {
    fontSize: "0.85rem",
    color: COLORS.textLight,
    marginTop: 4,
  } as CSSProperties,

  sectionTitle: {
    fontSize: "1.15rem",
    fontWeight: 700,
    color: COLORS.textPrimary,
    marginBottom: 16,
    marginTop: 0,
  } as CSSProperties,

  loadingContainer: {
    textAlign: "center" as const,
    padding: 60,
    fontSize: "1rem",
    color: COLORS.textSecond,
  } as CSSProperties,

  emptyState: {
    color: COLORS.textLight,
    fontSize: "0.95rem",
    padding: "20px 0",
    textAlign: "center" as const,
  } as CSSProperties,
};

const Dashboard = ({ onReport }: DashboardProps) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [threats, setThreats] = useState<ThreatData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8004/dashboard/summary");
        if (!res.ok) throw new Error('Failed to fetch dashboard summary');

        const data = await res.json();
        console.debug('dashboard/summary raw response:', data);

        const topFraud = (data.top_fraud_types ?? []).slice().sort((a: any, b: any) => b.count - a.count);
        const topPlat = (data.top_platforms ?? []).slice().sort((a: any, b: any) => b.count - a.count);

        setStats({
          overallThreat: data.overall_risk_level ?? 'LOW',
          avgThreatScore: data.average_threat_score ?? 0,
          reportsToday: data.reports_today ?? 0,
          reportsThisWeek: data.reports_this_week ?? 0,
          totalReports: data.total_reports ?? 0,
          topFraudTypes: topFraud,
          topPlatforms: topPlat,
        });

        setThreats(data.recent_threats ?? []);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getThreatColor = (level: string) => {
    if (level === "LOW") return COLORS.success;
    if (level === "MEDIUM") return COLORS.warning;
    if (level === "HIGH") return COLORS.accent;
    if (level === "CRITICAL") return COLORS.critical;
    return COLORS.textLight;
  };

  const renderButton = (
    text: string,
    onClick: () => void,
    variant: "primary" | "secondary" | "admin"
  ) => {
    let variantStyle = styles.btnPrimary;
    if (variant === "secondary") variantStyle = styles.btnSecondary;
    if (variant === "admin") variantStyle = styles.btnAdmin;

    const isHovered = hoveredButton === text;

    return (
      <button
        key={text}
        onClick={onClick}
        onMouseEnter={() => setHoveredButton(text)}
        onMouseLeave={() => setHoveredButton(null)}
        style={{
          ...styles.button,
          ...variantStyle,
          ...(isHovered && { transform: "translateY(-3px)", boxShadow: SHADOWS.lg }),
        }}
      >
        {text}
      </button>
    );
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.heading}>Cyber Threat Dashboard</h1>
        <p style={styles.subheading}>Real-time monitoring and analytics of cyber fraud threats</p>
      </div>

      {/* Action Buttons */}
      <div style={styles.actionBar}>
        {renderButton("📝 Report Incident", onReport, "primary")}
        {renderButton("📊 View History", () => navigate("/history"), "secondary")}
        {renderButton("🔐 Admin Analytics", () => navigate("/admin"), "admin")}
      </div>

      {/* Main Content */}
      {stats && (
        <>
          {/* Stats Grid */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Overall Threat Level</div>
              <div style={{ ...styles.statValue, color: getThreatColor(stats.overallThreat) }}>
                {stats.overallThreat}
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statLabel}>Avg Threat Score</div>
              <div style={styles.statValue}>{stats.avgThreatScore.toFixed(1)}</div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statLabel}>Reports Today</div>
              <div style={styles.statValue}>{stats.reportsToday}</div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statLabel}>Reports This Week</div>
              <div style={styles.statValue}>{stats.reportsThisWeek}</div>
            </div>
          </div>

          {/* Alert Card */}
          <div style={styles.alertCard}>
            <div style={{ fontSize: 20, flexShrink: 0 }}>⚠️</div>
            <div>
              <strong style={{ color: COLORS.textPrimary }}>Active Threats:</strong>
              <p style={{ marginTop: 4, color: COLORS.textSecond, fontSize: "0.95rem" }}>
                WhatsApp phishing and fake calls are currently increasing. Stay vigilant and report suspicious activity immediately.
              </p>
            </div>
          </div>

          {/* Charts Section */}
          <div style={styles.chartsSection}>
            {/* Top Fraud Types Chart */}
            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>Top Fraud Types</h3>
              <div style={styles.barChart}>
                {stats.topFraudTypes.length > 0 ? (
                  (() => {
                    const maxCount = Math.max(...stats.topFraudTypes.map((f) => f.count), 1);
                    return stats.topFraudTypes.map((item) => (
                      <div key={item.fraud_type} style={styles.barItem}>
                        <div style={styles.barLabel}>{item.fraud_type}</div>
                        <div style={styles.barContainer}>
                          <div style={{ ...styles.barFill, width: `${(item.count / maxCount) * 100}%` }} />
                        </div>
                        <div style={styles.barCount}>{item.count}</div>
                      </div>
                    ));
                  })()
                ) : (
                  <div style={styles.emptyState}>No fraud type data available</div>
                )}
              </div>
            </div>

            {/* Most Targeted Platforms Chart */}
            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>Most Targeted Platforms</h3>
              <div style={styles.barChart}>
                {stats.topPlatforms.length > 0 ? (
                  (() => {
                    const maxCount = Math.max(...stats.topPlatforms.map((p) => p.count), 1);
                    return stats.topPlatforms.map((item) => (
                      <div key={item.platform} style={styles.barItem}>
                        <div style={styles.barLabel}>{item.platform}</div>
                        <div style={styles.barContainer}>
                          <div style={{ ...styles.barFill, width: `${(item.count / maxCount) * 100}%` }} />
                        </div>
                        <div style={styles.barCount}>{item.count}</div>
                      </div>
                    ));
                  })()
                ) : (
                  <div style={styles.emptyState}>No platform data available</div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Threats */}
          {threats.length > 0 && (
            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>Recent Threats (Last 5)</h3>
              <div style={styles.threatList}>
                {threats.slice(0, 5).map((threat) => (
                  <div key={threat.id} style={styles.threatItem}>
                    <div
                      style={{
                        ...styles.threatIndicator,
                        background: getThreatColor(threat.risk_level),
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={styles.threatTitle}>{threat.category}</div>
                      <div style={styles.threatMeta}>
                        📍 {threat.region || "Unknown"} • Risk: <strong>{threat.risk_level}</strong> • Score: <strong>{threat.risk_score}/100</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Loading State */}
      {loading && <div style={styles.loadingContainer}>Loading threat data…</div>}
    </div>
  );
};

export default Dashboard;