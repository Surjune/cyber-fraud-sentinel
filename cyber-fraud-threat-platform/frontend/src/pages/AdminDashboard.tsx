import { useState, useEffect, CSSProperties } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useNavigate } from 'react-router-dom';

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
const adminStyles = {
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
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap" as const,
    gap: 20,
  } as CSSProperties,

  heading: {
    fontSize: "2rem",
    fontWeight: 700,
    color: COLORS.textPrimary,
    letterSpacing: "-0.5px",
    margin: 0,
  } as CSSProperties,

  subheading: {
    fontSize: "0.95rem",
    color: COLORS.textLight,
    marginTop: 8,
    margin: 0,
  } as CSSProperties,

  button: {
    padding: "12px 20px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.95rem",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 8px 24px rgba(2, 6, 23, 0.08)",
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

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 20,
    marginBottom: 32,
  } as CSSProperties,

  statCard: {
    padding: 24,
    borderRadius: 12,
    background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))",
    boxShadow: "0 8px 24px rgba(2, 6, 23, 0.08)",
    border: "1px solid rgba(15, 23, 42, 0.04)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  } as CSSProperties,

  statLabel: {
    fontSize: "0.85rem",
    color: COLORS.textLight,
    marginBottom: 12,
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  } as CSSProperties,

  statValue: {
    fontSize: "2.2rem",
    fontWeight: 700,
    color: COLORS.textPrimary,
    lineHeight: 1.2,
  } as CSSProperties,

  chartsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
    gap: 20,
    marginBottom: 24,
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

  loadingContainer: {
    textAlign: "center" as const,
    padding: 60,
    fontSize: "1rem",
    color: COLORS.textSecond,
  } as CSSProperties,

  errorBox: {
    padding: 18,
    borderRadius: 12,
    background: "linear-gradient(90deg, rgba(239, 68, 68, 0.08), rgba(239, 68, 68, 0.04))",
    borderLeft: `4px solid ${COLORS.accent}`,
    color: COLORS.textPrimary,
    marginBottom: 24,
    boxShadow: "0 8px 24px rgba(239, 68, 68, 0.08)",
  } as CSSProperties,

  footerButton: {
    padding: 12,
    marginTop: 24,
  } as CSSProperties,
};

// ============================================
// TYPES
// ============================================

interface StatsOverview {
  total_reports: number;
  reports_today: number;
  average_threat_score: number;
  overall_risk_level: string;
}

interface FraudTypeData {
  fraud_type: string;
  count: number;
}

interface PlatformData {
  platform: string;
  count: number;
}

interface ThreatTrendData {
  date: string;
  avg_threat_score: number;
  report_count: number;
}

// ============================================
// ADMIN DASHBOARD COMPONENT
// ============================================

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [fraudTypes, setFraudTypes] = useState<FraudTypeData[]>([]);
  const [platforms, setPlatforms] = useState<PlatformData[]>([]);
  const [threatTrend, setThreatTrend] = useState<ThreatTrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://127.0.0.1:8004/dashboard/summary');
      if (!res.ok) throw new Error('Failed to fetch dashboard summary');

      const data = await res.json();
      console.debug('dashboard/summary raw response:', data);

      setStats({
        total_reports: data.total_reports ?? 0,
        reports_today: data.reports_today ?? 0,
        average_threat_score: data.average_threat_score ?? 0,
        overall_risk_level: data.overall_risk_level ?? 'LOW',
      });
      setFraudTypes((data.top_fraud_types ?? []).slice().sort((a: any, b: any) => b.count - a.count));
      setPlatforms((data.top_platforms ?? []).slice().sort((a: any, b: any) => b.count - a.count));
      setThreatTrend(data.threat_trend ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getThreatColor = (level: string): string => {
    const colors: { [key: string]: string } = {
      'LOW': COLORS.success,
      'MEDIUM': COLORS.warning,
      'HIGH': COLORS.accent,
      'CRITICAL': COLORS.critical,
    };
    return colors[level] || COLORS.info;
  };

  const getColorForIndex = (index: number): string => {
    const colors = [COLORS.info, COLORS.critical, '#ec4899', COLORS.warning, COLORS.success];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div style={adminStyles.container}>
        <div style={adminStyles.loadingContainer}>⚙️ Loading threat intelligence dashboard…</div>
      </div>
    );
  }

  return (
    <div style={adminStyles.container}>
      {/* HEADER */}
      <div style={adminStyles.header}>
        <div>
          <h1 style={adminStyles.heading}>🔐 Threat Intelligence Dashboard</h1>
          <p style={adminStyles.subheading}>Advanced analytics and threat monitoring</p>
        </div>
        <button
          style={{
            ...adminStyles.button,
            ...adminStyles.btnPrimary,
            ...(hoveredBtn === 'back' && { transform: 'translateY(-3px)', boxShadow: SHADOWS.lg }),
          }}
          onMouseEnter={() => setHoveredBtn('back')}
          onMouseLeave={() => setHoveredBtn(null)}
          onClick={() => navigate('/')}
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* ERROR STATE */}
      {error && <div style={adminStyles.errorBox}>⚠️ {error}</div>}

      {/* STATS CARDS */}
      {stats && (
        <div style={adminStyles.statsGrid}>
          <div style={adminStyles.statCard}>
            <div style={adminStyles.statLabel}>📊 Total Reports</div>
            <div style={adminStyles.statValue}>{stats.total_reports}</div>
          </div>
          <div style={adminStyles.statCard}>
            <div style={adminStyles.statLabel}>📈 Reports Today</div>
            <div style={adminStyles.statValue}>{stats.reports_today}</div>
          </div>
          <div style={adminStyles.statCard}>
            <div style={adminStyles.statLabel}>⚡ Avg Threat Score</div>
            <div style={adminStyles.statValue}>{stats.average_threat_score.toFixed(1)}</div>
          </div>
          <div style={adminStyles.statCard}>
            <div style={adminStyles.statLabel}>🎯 Risk Level</div>
            <div style={{ ...adminStyles.statValue, color: getThreatColor(stats.overall_risk_level) }}>
              {stats.overall_risk_level}
            </div>
          </div>
        </div>
      )}

      {/* CHARTS GRID */}
      <div style={adminStyles.chartsGrid}>
        {/* THREAT TREND LINE CHART */}
        <div style={adminStyles.chartCard}>
          <h3 style={adminStyles.chartTitle}>📉 7-Day Threat Trend</h3>
          {threatTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={threatTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke={COLORS.textLight} />
                <YAxis stroke={COLORS.textLight} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#f8fafc',
                    border: `1px solid #e2e8f0`,
                    borderRadius: '8px',
                    boxShadow: SHADOWS.md,
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avg_threat_score"
                  stroke={COLORS.accent}
                  dot={{ fill: COLORS.accent, r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Avg Threat Score"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: COLORS.textLight }}>No trend data available</p>
          )}
        </div>

        {/* FRAUD TYPES BAR CHART */}
        <div style={adminStyles.chartCard}>
          <h3 style={adminStyles.chartTitle}>🎯 Top Fraud Types</h3>
          {fraudTypes.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={fraudTypes.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="fraud_type" stroke={COLORS.textLight} angle={-45} textAnchor="end" height={80} />
                <YAxis stroke={COLORS.textLight} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#f8fafc',
                    border: `1px solid #e2e8f0`,
                    borderRadius: '8px',
                    boxShadow: SHADOWS.md,
                  }}
                />
                <Bar dataKey="count" fill={COLORS.info} radius={[8, 8, 0, 0]}>
                  {fraudTypes.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={getColorForIndex(idx)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: COLORS.textLight }}>No fraud type data available</p>
          )}
        </div>

        {/* PLATFORMS BAR CHART */}
        <div style={adminStyles.chartCard}>
          <h3 style={adminStyles.chartTitle}>📱 Attack Platforms</h3>
          {platforms.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={platforms.slice(0, 6)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke={COLORS.textLight} />
                <YAxis dataKey="platform" type="category" stroke={COLORS.textLight} width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#f8fafc',
                    border: `1px solid #e2e8f0`,
                    borderRadius: '8px',
                    boxShadow: SHADOWS.md,
                  }}
                />
                <Bar dataKey="count" fill={COLORS.warning} radius={[0, 8, 8, 0]}>
                  {platforms.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={getColorForIndex(idx)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: COLORS.textLight }}>No platform data available</p>
          )}
        </div>
      </div>

      {/* REFRESH BUTTON */}
      <div style={{ textAlign: 'center' as const, marginTop: 32 }}>
        <button
          style={{
            ...adminStyles.button,
            ...adminStyles.btnSecondary,
            ...(hoveredBtn === 'refresh' && { transform: 'translateY(-3px)', boxShadow: SHADOWS.lg }),
          }}
          onMouseEnter={() => setHoveredBtn('refresh')}
          onMouseLeave={() => setHoveredBtn(null)}
          onClick={fetchAdminData}
        >
          🔄 Refresh Analytics
        </button>
      </div>
    </div>
  );
}
