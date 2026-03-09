import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

type AttackSource = {
  id?: number;
  phone_number?: string | null;
  email?: string | null;
  url?: string | null;
  ip_address?: string | null;
  country?: string | null;
};

type Report = {
  id?: number;
  fraud_type?: string;
  attack_classification?: string | null;
  platform?: string | null;
  description?: string | null;
  source?: string | null;
  amount_lost?: number | null;
  payment_method?: string | null;
  severity?: string | null;
  threat_score?: number | null;
  created_at?: string | null;
  integrity_hash?: string | null;
  // Pattern analysis fields
  pattern_status?: string | null;
  threat_level?: string | null;
  similarity_score?: number | null;
  similar_reports_count?: number | null;
  sources?: AttackSource[];
  attack_sources?: AttackSource[];
};

const History = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedHashId, setCopiedHashId] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchReports = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("http://127.0.0.1:8004/reports");
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        const data = await res.json();
        if (mounted) setReports(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message || "Failed to load incident history");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchReports();
    return () => {
      mounted = false;
    };
  }, []);

  const looksHashed = (val: string | null) => {
    return !!val && /^([a-f0-9]{64})$/i.test(val);
  };

  const copyHashToClipboard = async (hash: string | null | undefined, reportId: number | undefined) => {
    if (!hash || !reportId) return;
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedHashId(reportId);
      setTimeout(() => setCopiedHashId(null), 2000);
    } catch (err) {
      console.error("Failed to copy hash:", err);
    }
  };

  return (
    <div style={{
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "48px 24px",
      display: "flex",
      flexDirection: "column",
      gap: "28px",
    }}>
      {/* Page Header */}
      <div style={{ borderBottom: "1px solid rgba(15, 23, 42, 0.08)", paddingBottom: 24 }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "bold", margin: "0 0 8px 0", color: "#0f172a", letterSpacing: "-0.5px" }}>
          Incident History
        </h1>
        <p style={{ fontSize: "0.95rem", color: "#64748b", margin: 0 }}>
          All reported fraud incidents and threats in the system
        </p>
      </div>

      {/* Back Button */}
      <button
        onClick={() => navigate("/")}
        style={{
          alignSelf: "flex-start",
          padding: "10px 16px",
          backgroundColor: "#64748b",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "0.95rem",
          fontWeight: "600",
          transition: "all 0.2s ease",
        }}
      >
        ← Back to Dashboard
      </button>

      {/* Loading State */}
      {loading && (
        <div style={{
          padding: "60px 20px",
          textAlign: "center",
          color: "#94a3b8"
        }}>
          <p style={{ fontSize: "1rem", margin: 0 }}>Loading incident history…</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div style={{
          backgroundColor: "linear-gradient(90deg, rgba(239, 68, 68, 0.08), rgba(239, 68, 68, 0.04))",
          border: "1px solid #fecaca",
          borderRadius: "12px",
          padding: "20px",
          color: "#7f1d1d",
          boxShadow: "0 8px 24px rgba(239, 68, 68, 0.08)",
        }}>
          <div style={{ fontWeight: "700", marginBottom: "6px", fontSize: "1rem" }}>⚠️ Error Loading History</div>
          <div style={{ fontSize: "0.95rem", color: "#991b1b" }}>{error}</div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && reports.length === 0 && (
        <div style={{
          backgroundColor: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))",
          border: "1px solid rgba(15, 23, 42, 0.04)",
          padding: "60px 20px",
          borderRadius: "12px",
          textAlign: "center",
          color: "#94a3b8",
          boxShadow: "0 8px 24px rgba(2, 6, 23, 0.08)",
        }}>
          <p style={{ margin: 0, fontSize: "1rem" }}>No incidents recorded yet.</p>
        </div>
      )}

      {/* Reports List */}
      {!loading && !error && reports.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {reports.map((report, idx) => (
            <div
              key={report.id ?? idx}
              style={{
                backgroundColor: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))",
                border: "1px solid rgba(15, 23, 42, 0.04)",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 8px 24px rgba(2, 6, 23, 0.08)",
                transition: "all 0.2s ease",
              }}
            >
              {/* Report Header */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                gap: "20px",
                padding: "20px",
                borderBottom: "1px solid rgba(15, 23, 42, 0.08)",
                backgroundColor: "rgba(15, 23, 42, 0.02)"
              }}>
                <div>
                  <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "6px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Incident ID
                  </div>
                  <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0f172a" }}>
                    #{report.id ?? "—"}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "6px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Platform
                  </div>
                  <div style={{ fontSize: "0.95rem", color: "#0f172a", fontWeight: "500" }}>
                    {report.platform ?? "—"}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "6px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Fraud Type
                  </div>
                  <div style={{ fontSize: "0.95rem", color: "#0f172a", fontWeight: "500" }}>
                    {report.fraud_type ?? report.attack_classification ?? "—"}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "6px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Date
                  </div>
                  <div style={{ fontSize: "0.95rem", color: "#0f172a", fontWeight: "500" }}>
                    {report.created_at 
                      ? new Date(report.created_at).toLocaleDateString()
                      : "—"
                    }
                  </div>
                </div>

                {report.threat_score !== undefined && (
                  <div>
                    <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "6px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Threat Score
                    </div>
                    <div style={{ fontSize: "1rem", fontWeight: "700", color: "#f97316" }}>
                      {report.threat_score}/100
                    </div>
                  </div>
                )}
              </div>

              {/* Report Details */}
              <div style={{ padding: "20px" }}>
                {report.description && (
                  <div style={{ marginBottom: "18px" }}>
                    <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "8px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Description
                    </div>
                    <div style={{ fontSize: "0.95rem", color: "#0f172a", lineHeight: "1.6" }}>
                      {report.description}
                    </div>
                  </div>
                )}

                {/* Integrity Hash Section */}
                {report.integrity_hash && (
                  <div style={{
                    backgroundColor: "linear-gradient(135deg, rgba(63, 131, 248, 0.04), rgba(99, 102, 241, 0.04))",
                    border: "1px solid rgba(99, 102, 241, 0.15)",
                    borderRadius: "10px",
                    padding: "16px",
                    marginBottom: "18px",
                  }}>
                    <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "8px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      🔐 SHA-256 Integrity Hash
                    </div>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      flexWrap: "wrap",
                    }}>
                      <div style={{
                        fontFamily: "'Courier New', monospace",
                        fontSize: "0.85rem",
                        color: "#3f83f8",
                        fontWeight: "600",
                        letterSpacing: "0.5px",
                        padding: "8px 12px",
                        backgroundColor: "rgba(63, 131, 248, 0.08)",
                        borderRadius: "6px",
                        border: "1px solid rgba(63, 131, 248, 0.2)",
                        userSelect: "all",
                        flex: "0 1 auto",
                        maxWidth: "100%",
                        wordBreak: "break-all",
                      }}>
                        {report.integrity_hash.substring(0, 12)}…
                      </div>
                      <button
                        onClick={() => copyHashToClipboard(report.integrity_hash, report.id)}
                        title="Copy full SHA-256 hash"
                        style={{
                          padding: "8px 12px",
                          backgroundColor: copiedHashId === report.id ? "#10b981" : "#3f83f8",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "0.85rem",
                          fontWeight: "600",
                          transition: "all 0.2s ease",
                          whiteSpace: "nowrap",
                        }}
                        onMouseEnter={(e) => {
                          if (copiedHashId !== report.id) {
                            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#2563eb";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (copiedHashId !== report.id) {
                            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#3f83f8";
                          }
                        }}
                      >
                        {copiedHashId === report.id ? "✓ Copied" : "Copy Hash"}
                      </button>
                    </div>
                    <div style={{
                      fontSize: "0.8rem",
                      color: "#64748b",
                      marginTop: "10px",
                      fontStyle: "italic",
                    }}>
                      This hash verifies the report has not been altered. Used to validate report integrity across the system.
                    </div>
                  </div>
                )}

                {/* Pattern Analysis Section */}
                {report.pattern_status && (
                  <div style={{
                    backgroundColor: "linear-gradient(135deg, rgba(168, 85, 247, 0.04), rgba(139, 92, 246, 0.04))",
                    border: "1px solid rgba(168, 85, 247, 0.15)",
                    borderRadius: "10px",
                    padding: "16px",
                    marginBottom: "18px",
                  }}>
                    <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      📊 Pattern Analysis
                    </div>
                    
                    {/* Pattern Status + Threat Level Badges */}
                    <div style={{
                      display: "flex",
                      gap: "12px",
                      flexWrap: "wrap",
                      marginBottom: "12px",
                    }}>
                      {/* Pattern Status Badge */}
                      <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        backgroundColor: (
                          report.pattern_status === "Known" ? "rgba(239, 68, 68, 0.1)" :
                          report.pattern_status === "Emerging" ? "rgba(245, 158, 11, 0.1)" :
                          "rgba(34, 197, 94, 0.1)"
                        ),
                        border: `1px solid ${
                          report.pattern_status === "Known" ? "rgba(239, 68, 68, 0.3)" :
                          report.pattern_status === "Emerging" ? "rgba(245, 158, 11, 0.3)" :
                          "rgba(34, 197, 94, 0.3)"
                        }`,
                      }}>
                        <span style={{
                          fontSize: "0.9rem",
                          fontWeight: "600",
                          color: (
                            report.pattern_status === "Known" ? "#991b1b" :
                            report.pattern_status === "Emerging" ? "#92400e" :
                            "#15803d"
                          ),
                        }}>
                          {report.pattern_status === "Known" ? "🔴 Known Pattern" :
                           report.pattern_status === "Emerging" ? "🟡 Emerging Pattern" :
                           "🟢 New Pattern"}
                        </span>
                      </div>

                      {/* Threat Level Badge */}
                      <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        backgroundColor: (
                          report.threat_level === "Critical" ? "rgba(239, 68, 68, 0.1)" :
                          report.threat_level === "High" ? "rgba(249, 115, 22, 0.1)" :
                          report.threat_level === "Medium" ? "rgba(245, 158, 11, 0.1)" :
                          "rgba(34, 197, 94, 0.1)"
                        ),
                        border: `1px solid ${
                          report.threat_level === "Critical" ? "rgba(239, 68, 68, 0.3)" :
                          report.threat_level === "High" ? "rgba(249, 115, 22, 0.3)" :
                          report.threat_level === "Medium" ? "rgba(245, 158, 11, 0.3)" :
                          "rgba(34, 197, 94, 0.3)"
                        }`,
                      }}>
                        <span style={{
                          fontSize: "0.9rem",
                          fontWeight: "600",
                          color: (
                            report.threat_level === "Critical" ? "#991b1b" :
                            report.threat_level === "High" ? "#92400e" :
                            report.threat_level === "Medium" ? "#92400e" :
                            "#15803d"
                          ),
                        }}>
                          {report.threat_level === "Critical" ? "⚠️ Critical" :
                           report.threat_level === "High" ? "⚠️ High" :
                           report.threat_level === "Medium" ? "⚠️ Medium" :
                           "✓ Low"}
                        </span>
                      </div>
                    </div>

                    {/* Similarity Details */}
                    {report.similar_reports_count !== undefined && (
                      <div style={{
                        fontSize: "0.9rem",
                        color: "#0f172a",
                        lineHeight: "1.6",
                      }}>
                        <div style={{ marginBottom: "8px" }}>
                          <strong>Pattern Match Strength:</strong>{" "}
                          {report.similarity_score ? report.similarity_score.toFixed(0) : "0"}%
                        </div>
                        <div style={{ color: "#64748b", fontSize: "0.85rem" }}>
                          {report.similar_reports_count === 0 
                            ? "No similar incidents found. Flagged for monitoring." 
                            : report.similar_reports_count === 1
                            ? `Matches 1 similar incident in the system.`
                            : `Matches ${report.similar_reports_count} similar incidents in the system.`
                          }
                        </div>
                      </div>
                    )}

                    {/* Explanation Text */}
                    <div style={{
                      fontSize: "0.8rem",
                      color: "#64748b",
                      marginTop: "10px",
                      fontStyle: "italic",
                      paddingTop: "10px",
                      borderTop: "1px solid rgba(15, 23, 42, 0.1)",
                    }}>
                      {report.pattern_status === "Known" 
                        ? "This is part of a known fraud wave. Authorities may already be tracking these incidents."
                        : report.pattern_status === "Emerging"
                        ? "This matches a growing trend. Pattern becoming more common recently."
                        : "This is a newly identified fraud pattern. Being monitored for future occurrences."
                      }
                    </div>
                  </div>
                )}

                {/* Additional Info Grid */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                  gap: "18px",
                  marginTop: "12px"
                }}>
                  {report.amount_lost !== undefined && (
                    <div>
                      <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Amount Lost</div>
                      <div style={{ fontSize: "0.95rem", color: "#0f172a", marginTop: "6px", fontWeight: "500" }}>
                        ₹{report.amount_lost?.toLocaleString() ?? "—"}
                      </div>
                    </div>
                  )}

                  {report.payment_method && (
                    <div>
                      <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Payment Method</div>
                      <div style={{ fontSize: "0.95rem", color: "#0f172a", marginTop: "6px", fontWeight: "500" }}>
                        {report.payment_method}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sources Section */}
                {((report.sources && report.sources.length > 0) || 
                  (report.attack_sources && report.attack_sources.length > 0)) && (
                  <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #334155" }}>
                    <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "600", color: "#f1f5f9" }}>
                      Attack Sources
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {(report.sources ?? report.attack_sources ?? []).map((source, srcIdx) => (
                        <div
                          key={srcIdx}
                          style={{
                            backgroundColor: "#0f172a",
                            padding: "12px",
                            borderRadius: "4px",
                            borderLeft: "3px solid #3b82f6"
                          }}
                        >
                          {source.url && (
                            <div style={{ marginBottom: "8px" }}>
                              <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "2px" }}>
                                URL
                              </div>
                              <div style={{ fontSize: "13px", color: "#cbd5e1", wordBreak: "break-all" }}>
                                {source.url}
                              </div>
                            </div>
                          )}

                          {source.phone_number && (
                            <div style={{ marginBottom: "8px" }}>
                              <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "2px" }}>
                                Phone Number
                              </div>
                              <div style={{ fontSize: "13px", color: "#cbd5e1" }}>
                                {looksHashed(source.phone_number)
                                  ? "🔒 Hashed (redacted)"
                                  : source.phone_number
                                }
                              </div>
                            </div>
                          )}

                          {source.email && (
                            <div>
                              <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "2px" }}>
                                Email
                              </div>
                              <div style={{ fontSize: "13px", color: "#cbd5e1" }}>
                                {looksHashed(source.email)
                                  ? "🔒 Hashed (redacted)"
                                  : source.email
                                }
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;