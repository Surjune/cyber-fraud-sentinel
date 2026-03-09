import { useState } from "react";

type Props = {
  onBack: () => void;
};

type SubmissionResult = {
  incident_id: number;
  severity: string;
  threat_score: number;
  risk_level: string;
  repeat_attack: boolean;
  evidence_saved: boolean;
  pattern_analysis?: {
    pattern_status: string;
    threat_level: string;
    similarity_score: number;
    similar_reports_count: number;
  };
};

const getThreatColor = (score: number): string => {
  if (score <= 30) return "#10b981";
  if (score <= 60) return "#f59e0b";
  if (score <= 80) return "#ef4444";
  return "#7c3aed";
};

const getRiskColor = (level: string): string => {
  switch (level.toUpperCase()) {
    case "LOW":
      return "#10b981";
    case "MEDIUM":
      return "#f59e0b";
    case "HIGH":
      return "#ef4444";
    case "CRITICAL":
      return "#7c3aed";
    default:
      return "#94a3b8";
  }
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  backgroundColor: "#334155",
  border: "1px solid #475569",
  borderRadius: "4px",
  color: "#f1f5f9",
  fontSize: "14px",
  boxSizing: "border-box" as const,
  fontFamily: "inherit"
};

const ReportIncident = ({ onBack }: Props) => {
  const [fraudType, setFraudType] = useState("");
  const [platform, setPlatform] = useState("");
  const [source, setSource] = useState("");
  const [description, setDescription] = useState("");
  const [amountLost, setAmountLost] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [evidence, setEvidence] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("fraud_type", fraudType);
    formData.append("attack_classification", fraudType);
    formData.append("platform", platform);
    formData.append("description", description);
    formData.append("source", "user");
    formData.append("phone_number", source);
    formData.append("amount_lost", amountLost || "0");
    formData.append("payment_method", paymentMethod || "Not Applicable");

    if (evidence) {
      formData.append("evidence_file", evidence);
    }

    setSubmitting(true);
    try {
      const response = await fetch("http://127.0.0.1:8004/report", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to save report");
      }

      const data = await response.json();

      setResult({
        incident_id: data.incident_id,
        severity: data.severity,
        threat_score: data.threat_score,
        risk_level: data.risk_level,
        repeat_attack: data.repeat_attack,
        evidence_saved: data.evidence_saved,
        pattern_analysis: data.pattern_analysis,
      });
    } catch (error) {
      console.error(error);
      alert("Error saving report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Result Page
  if (result) {
    return (
      <div style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "48px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "28px",
      }}>
        {/* Success Header */}
        <div style={{ borderBottom: "1px solid rgba(16, 185, 129, 0.2)", paddingBottom: 24 }}>
          <h1 style={{ fontSize: "2rem", fontWeight: "bold", margin: "0 0 8px 0", color: "#10b981", letterSpacing: "-0.5px" }}>
            ✓ Report Submitted
          </h1>
          <p style={{ fontSize: "0.95rem", color: "#64748b", margin: 0 }}>
            Your threat assessment has been processed and added to our intelligence database
          </p>
        </div>

        {/* Assessment Results Card */}
        <div style={{
          backgroundColor: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))",
          border: "1px solid rgba(15, 23, 42, 0.04)",
          borderRadius: "12px",
          padding: "28px",
          boxShadow: "0 8px 24px rgba(2, 6, 23, 0.08)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "24px"
        }}>
          <div>
            <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>
              Incident ID
            </div>
            <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#0f172a" }}>
              #{result.incident_id}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>
              Risk Level
            </div>
            <div style={{
              fontSize: "0.95rem",
              fontWeight: "700",
              padding: "8px 12px",
              backgroundColor: getRiskColor(result.risk_level),
              color: "#fff",
              borderRadius: "8px",
              width: "fit-content",
              textAlign: "center"
            }}>
              {result.risk_level}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>
              Evidence
            </div>
            <div style={{ fontSize: "1rem", color: result.evidence_saved ? "#10b981" : "#94a3b8", fontWeight: "600" }}>
              {result.evidence_saved ? "📁 Saved" : "—"}
            </div>
          </div>
        </div>

        {/* Threat Score Bar */}
        <div style={{
          backgroundColor: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))",
          border: "1px solid rgba(15, 23, 42, 0.04)",
          borderRadius: "12px",
          padding: "28px",
          boxShadow: "0 8px 24px rgba(2, 6, 23, 0.08)"
        }}>
          <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "#0f172a", marginBottom: "16px" }}>
            Threat Score
          </div>
          <div style={{
            height: "16px",
            backgroundColor: "#e5e7eb",
            borderRadius: "8px",
            overflow: "hidden",
            marginBottom: "12px"
          }}>
            <div style={{
              height: "100%",
              backgroundColor: getThreatColor(result.threat_score),
              width: `${result.threat_score}%`,
              transition: "width 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)"
            }} />
          </div>
          <div style={{
            fontSize: "1.2rem",
            fontWeight: "bold",
            color: getThreatColor(result.threat_score)
          }}>
            {result.threat_score} / 100
          </div>
        </div>

        {/* Attack Pattern Alert */}
        <div style={{
          backgroundColor: result.repeat_attack ? "rgba(239, 68, 68, 0.08)" : "rgba(59, 130, 246, 0.08)",
          border: `1px solid ${result.repeat_attack ? "#fecaca" : "#bfdbfe"}`,
          borderRadius: "12px",
          padding: "20px",
          color: result.repeat_attack ? "#7f1d1d" : "#1e40af"
        }}>
          {result.repeat_attack ? (
            <>
              <div style={{ fontWeight: "700", marginBottom: "6px", fontSize: "1rem" }}>⚠️ Repeat Attack Detected</div>
              <div style={{ fontSize: "0.95rem", color: result.repeat_attack ? "#991b1b" : "#1e3a8a" }}>
                This attacker or similar attack pattern has been reported before. Enhanced monitoring is recommended.
              </div>
            </>
          ) : (
            <>
              <div style={{ fontWeight: "700", marginBottom: "6px", fontSize: "1rem" }}>ℹ️ New Attacker</div>
              <div style={{ fontSize: "0.95rem", color: result.repeat_attack ? "#991b1b" : "#1e3a8a" }}>
                First report of this attack pattern in our database.
              </div>
            </>
          )}
        </div>

        {/* Pattern Matching Analysis */}
        {result.pattern_analysis && (
          <div style={{
            backgroundColor: "linear-gradient(135deg, rgba(168, 85, 247, 0.08), rgba(139, 92, 246, 0.08))",
            border: "1px solid rgba(168, 85, 247, 0.2)",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 8px 24px rgba(2, 6, 23, 0.08)"
          }}>
            <div style={{ fontSize: "1rem", fontWeight: "700", color: "#0f172a", marginBottom: "16px" }}>
              📊 Pattern Matching Analysis
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", marginBottom: "20px" }}>
              {/* Pattern Status */}
              <div>
                <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>
                  Pattern Type
                </div>
                <div style={{
                  fontSize: "0.95rem",
                  fontWeight: "700",
                  padding: "10px 12px",
                  backgroundColor: (
                    result.pattern_analysis.pattern_status === "Known" ? "rgba(239, 68, 68, 0.1)" :
                    result.pattern_analysis.pattern_status === "Emerging" ? "rgba(245, 158, 11, 0.1)" :
                    "rgba(34, 197, 94, 0.1)"
                  ),
                  color: (
                    result.pattern_analysis.pattern_status === "Known" ? "#991b1b" :
                    result.pattern_analysis.pattern_status === "Emerging" ? "#92400e" :
                    "#15803d"
                  ),
                  borderRadius: "8px",
                  border: `1px solid ${
                    result.pattern_analysis.pattern_status === "Known" ? "rgba(239, 68, 68, 0.2)" :
                    result.pattern_analysis.pattern_status === "Emerging" ? "rgba(245, 158, 11, 0.2)" :
                    "rgba(34, 197, 94, 0.2)"
                  }`,
                  textAlign: "center"
                }}>
                  {result.pattern_analysis.pattern_status === "Known" ? "🔴 Known" :
                   result.pattern_analysis.pattern_status === "Emerging" ? "🟡 Emerging" :
                   "🟢 New"}
                </div>
              </div>

              {/* Threat Level */}
              <div>
                <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>
                  Threat Level
                </div>
                <div style={{
                  fontSize: "0.95rem",
                  fontWeight: "700",
                  padding: "10px 12px",
                  backgroundColor: (
                    result.pattern_analysis.threat_level === "Critical" ? "rgba(239, 68, 68, 0.1)" :
                    result.pattern_analysis.threat_level === "High" ? "rgba(249, 115, 22, 0.1)" :
                    result.pattern_analysis.threat_level === "Medium" ? "rgba(245, 158, 11, 0.1)" :
                    "rgba(34, 197, 94, 0.1)"
                  ),
                  color: (
                    result.pattern_analysis.threat_level === "Critical" ? "#991b1b" :
                    result.pattern_analysis.threat_level === "High" ? "#92400e" :
                    result.pattern_analysis.threat_level === "Medium" ? "#92400e" :
                    "#15803d"
                  ),
                  borderRadius: "8px",
                  border: `1px solid ${
                    result.pattern_analysis.threat_level === "Critical" ? "rgba(239, 68, 68, 0.2)" :
                    result.pattern_analysis.threat_level === "High" ? "rgba(249, 115, 22, 0.2)" :
                    result.pattern_analysis.threat_level === "Medium" ? "rgba(245, 158, 11, 0.2)" :
                    "rgba(34, 197, 94, 0.2)"
                  }`,
                  textAlign: "center"
                }}>
                  {result.pattern_analysis.threat_level === "Critical" ? "⚠️ Critical" :
                   result.pattern_analysis.threat_level === "High" ? "⚠️ High" :
                   result.pattern_analysis.threat_level === "Medium" ? "⚠️ Medium" :
                   "✓ Low"}
                </div>
              </div>

              {/* Similarity Score */}
              <div>
                <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>
                  Match Score
                </div>
                <div style={{
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  color: "#6366f1",
                  textAlign: "center",
                  padding: "10px"
                }}>
                  {result.pattern_analysis.similarity_score.toFixed(0)}%
                </div>
              </div>

              {/* Similar Reports Count */}
              <div>
                <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>
                  Similar Reports
                </div>
                <div style={{
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  color: "#0f172a",
                  textAlign: "center",
                  padding: "10px"
                }}>
                  {result.pattern_analysis.similar_reports_count}
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div style={{
              fontSize: "0.9rem",
              color: "#0f172a",
              lineHeight: "1.6",
              padding: "12px",
              backgroundColor: "rgba(255, 255, 255, 0.4)",
              borderRadius: "6px"
            }}>
              {result.pattern_analysis.pattern_status === "Known"
                ? `This is part of a known fraud wave. ${result.pattern_analysis.similar_reports_count} similar incidents have been reported. Authorities may already be tracking these events.`
                : result.pattern_analysis.pattern_status === "Emerging"
                ? `This matches a growing trend. ${result.pattern_analysis.similar_reports_count} similar reports suggest this pattern is becoming more common.`
                : `This is a newly identified fraud pattern. No previous similar incidents found. This will be flagged for monitoring and detection of future occurrences.`
              }
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "12px", paddingTop: "8px" }}>
          <button
            onClick={() => setResult(null)}
            style={{
              flex: 1,
              padding: "12px 16px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500"
            }}
          >
            Report Another Incident
          </button>
          <button
            onClick={onBack}
            style={{
              flex: 1,
              padding: "10px 16px",
              backgroundColor: "#6b7280",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500"
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Form Page
  return (
    <div style={{
      maxWidth: "900px",
      margin: "0 auto",
      padding: "48px 24px",
      display: "flex",
      flexDirection: "column",
      gap: "32px",
    }}>
      {/* Page Header */}
      <div style={{ borderBottom: "1px solid rgba(15, 23, 42, 0.08)", paddingBottom: 24 }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "bold", margin: "0 0 8px 0", color: "#0f172a", letterSpacing: "-0.5px" }}>
          Report Fraud Incident
        </h1>
        <p style={{ fontSize: "0.95rem", color: "#64748b", margin: 0 }}>
          Submit details of cyber fraud and fraudulent activities. Your report will be analyzed and added to our threat intelligence database.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
        {/* Incident Details Section */}
        <div style={{
          backgroundColor: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))",
          border: "1px solid rgba(15, 23, 42, 0.04)",
          borderRadius: "12px",
          padding: "28px",
          boxShadow: "0 8px 24px rgba(2, 6, 23, 0.08)",
        }}>
          <h3 style={{ margin: "0 0 20px 0", fontSize: "1.15rem", fontWeight: "700", color: "#0f172a" }}>
            📋 Incident Details
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.95rem", fontWeight: "500", color: "#0f172a", marginBottom: "8px" }}>
                Fraud Type *
              </label>
              <select
                value={fraudType}
                onChange={(e) => setFraudType(e.target.value)}
                required
                style={{...inputStyle, backgroundColor: "#f8fafc", color: "#0f172a"}}
              >
                <option value="">Select Fraud Type</option>
                <option value="Phishing">Phishing</option>
                <option value="Scam">Scam</option>
                <option value="Fraudulent Link">Fraudulent Link</option>
                <option value="Fake Call">Fake Call</option>
                <option value="Digital Deception">Digital Deception</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.95rem", fontWeight: "500", color: "#0f172a", marginBottom: "8px" }}>
                Platform *
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                required
                style={{...inputStyle, backgroundColor: "#f8fafc", color: "#0f172a"}}
              >
                <option value="">Select Platform</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="SMS">SMS</option>
                <option value="Website">Website</option>
                <option value="Email">Email</option>
                <option value="Instagram">Instagram</option>
                <option value="Facebook">Facebook</option>
                <option value="Telegram">Telegram</option>
                <option value="Phone Call">Phone Call</option>
                <option value="Mobile App">Mobile App</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.95rem", fontWeight: "500", color: "#0f172a", marginBottom: "8px" }}>
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="Describe what happened, what messages/links were sent, etc."
                rows={4}
                style={{
                  ...inputStyle,
                  backgroundColor: "#f8fafc",
                  color: "#0f172a",
                  minHeight: "120px",
                  resize: "vertical"
                }}
              />
            </div>
          </div>
        </div>

        {/* Attack Source Section */}
        <div style={{
          backgroundColor: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))",
          border: "1px solid rgba(15, 23, 42, 0.04)",
          borderRadius: "12px",
          padding: "28px",
          boxShadow: "0 8px 24px rgba(2, 6, 23, 0.08)",
        }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "1.15rem", fontWeight: "700", color: "#0f172a" }}>
            🔗 Attack Source
          </h3>
          <p style={{ margin: "0 0 20px 0", fontSize: "0.9rem", color: "#64748b" }}>
            Provide details about the attacker's contact information or URLs
          </p>

          <div>
            <label style={{ display: "block", fontSize: "0.95rem", fontWeight: "500", color: "#0f172a", marginBottom: "8px" }}>
              Phone / Email / URL *
            </label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              required
              placeholder="+91XXXXXXXXXX or scam-site.com"
              style={{...inputStyle, backgroundColor: "#f8fafc", color: "#0f172a"}}
            />
          </div>
        </div>

        {/* Financial Impact Section */}
        <div style={{
          backgroundColor: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))",
          border: "1px solid rgba(15, 23, 42, 0.04)",
          borderRadius: "12px",
          padding: "28px",
          boxShadow: "0 8px 24px rgba(2, 6, 23, 0.08)",
        }}>
          <h3 style={{ margin: "0 0 20px 0", fontSize: "1.15rem", fontWeight: "700", color: "#0f172a" }}>
            💰 Financial Impact
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.95rem", fontWeight: "500", color: "#0f172a", marginBottom: "8px" }}>
                Amount Lost (₹)
              </label>
              <input
                type="number"
                value={amountLost}
                onChange={(e) => setAmountLost(e.target.value)}
                min="0"
                placeholder="0"
                style={{...inputStyle, backgroundColor: "#f8fafc", color: "#0f172a"}}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.95rem", fontWeight: "500", color: "#0f172a", marginBottom: "8px" }}>
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={{...inputStyle, backgroundColor: "#f8fafc", color: "#0f172a"}}
              >
                <option value="">Not Applicable</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
          </div>
        </div>

        {/* Evidence Upload Section */}
        <div style={{
          backgroundColor: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))",
          border: "1px solid rgba(15, 23, 42, 0.04)",
          borderRadius: "12px",
          padding: "28px",
          boxShadow: "0 8px 24px rgba(2, 6, 23, 0.08)",
        }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "1.15rem", fontWeight: "700", color: "#0f172a" }}>
            📸 Evidence Upload
          </h3>
          <p style={{ margin: "0 0 20px 0", fontSize: "0.9rem", color: "#64748b" }}>
            Upload screenshots, audio recordings, or PDFs (optional)
          </p>

          <div>
            <input
              type="file"
              accept="image/*,audio/*,.pdf"
              onChange={(e) => setEvidence(e.target.files?.[0] || null)}
              style={{
                display: "block",
                width: "100%",
                padding: "8px",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                backgroundColor: "#f8fafc",
              }}
            />
            {evidence && (
              <div style={{
                marginTop: "12px",
                fontSize: "0.9rem",
                color: "#10b981",
                fontWeight: "600"
              }}>
                ✓ {evidence.name}
              </div>
            )}
          </div>
        </div>

        {/* Submit Buttons */}
        <div style={{ display: "flex", gap: "12px", paddingTop: "8px" }}>
          <button
            type="submit"
            disabled={submitting}
            style={{
              flex: 1,
              padding: "12px 16px",
              backgroundColor: submitting ? "#cbd5e1" : "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: submitting ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "600",
              opacity: submitting ? 0.7 : 1
            }}
          >
            {submitting ? "Submitting…" : "Submit Report"}
          </button>
          <button
            type="button"
            onClick={onBack}
            style={{
              flex: 1,
              padding: "10px 16px",
              backgroundColor: "#6b7280",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600"
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportIncident;