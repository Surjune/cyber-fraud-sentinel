/**
 * Fraud Threat Platform Type Definitions
 * Central location for all TypeScript interfaces and types
 */

// ============= API RESPONSE TYPES =============

/**
 * Attack source information (phone, email, URL, etc.)
 */
export interface AttackSource {
  id?: number;
  report_id?: number;
  phone_number?: string | null;
  email?: string | null;
  url?: string | null;
  ip_address?: string | null;
  country?: string | null;
}

/**
 * Pattern analysis result from backend
 */
export interface PatternAnalysis {
  pattern_status: string; // 'New' | 'Emerging' | 'Known'
  threat_level: string; // 'Low' | 'Medium' | 'High' | 'Critical'
  similarity_score: number; // 0.0-1.0
  similar_reports_count: number;
}

/**
 * Threat assessment details
 */
export interface ThreatAssessment {
  fraud_type_severity?: string;
  financial_impact?: string;
  evidence_strength?: string;
  repeat_pattern?: string;
  geographic_spread?: string;
  platform_risk?: string;
  composite_score?: number;
  reason?: string;
}

/**
 * Fraud report with all fields
 */
export interface Report {
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
  risk_level?: string | null;
  created_at?: string | null;
  integrity_hash?: string | null;
  // Pattern analysis fields
  pattern_status?: string | null;
  threat_level?: string | null;
  similarity_score?: number | null;
  similar_reports_count?: number | null;
  // Attack source relations
  sources?: AttackSource[];
  attack_sources?: AttackSource[];
  // Associated data
  evidence?: string | null;
  repeat_attack?: boolean;
  repeat_count?: number;
}

/**
 * Report submission result from backend
 */
export interface ReportSubmissionResult {
  message?: string;
  incident_id: number;
  severity: string;
  threat_score: number;
  risk_level: string;
  repeat_attack: boolean;
  repeat_count?: number;
  evidence_saved: boolean;
  pattern_analysis?: PatternAnalysis;
  threat_assessment?: ThreatAssessment;
}

/**
 * Dashboard statistics summary
 */
export interface DashboardSummary {
  overallThreat: string;
  avgThreatScore: number;
  reportsToday: number;
  reportsThisWeek: number;
  totalReports: number;
  topFraudTypes: Array<{ fraud_type: string; count: number }>;
  topPlatforms: Array<{ platform: string; count: number }>;
  recentThreats?: ThreatData[];
}

/**
 * Threat data for display in dashboards
 */
export interface ThreatData {
  id: number;
  risk_score: number;
  risk_level: string;
  category: string;
  region?: string;
  created_at: string;
}

/**
 * Admin dashboard statistics
 */
export interface AdminStats {
  threat_trend?: Array<{ date: string; threat: number }>;
  fraud_types?: Array<{ fraud_type: string; count: number }>;
  platforms?: Array<{ platform: string; count: number }>;
  total_reports?: number;
  reports_today?: number;
  avg_threat_score?: number;
  risk_breakdown?: Record<string, number>;
}

// ============= FORM DATA TYPES =============

/**
 * Report form submission data
 */
export interface ReportFormData {
  fraud_type: string;
  platform: string;
  description: string;
  attack_classification?: string;
  source?: string;
  phone_number?: string;
  amount_lost?: string | number;
  payment_method?: string;
  evidence_file?: File;
}

// ============= UI STATE TYPES =============

/**
 * Loading and error states
 */
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Pagination state
 */
export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

// ============= ENUM-LIKE CONSTANTS =============

export const FRAUD_TYPES = [
  { label: "Scam", value: "Scam" },
  { label: "Phishing", value: "Phishing" },
  { label: "Fraudulent Link", value: "Fraudulent Link" },
  { label: "Fake Call", value: "Fake Call" },
  { label: "Digital Deception", value: "Digital Deception" },
] as const;

export const PLATFORMS = [
  { label: "WhatsApp", value: "WhatsApp" },
  { label: "SMS", value: "SMS" },
  { label: "Email", value: "Email" },
  { label: "Website", value: "Website" },
  { label: "Instagram", value: "Instagram" },
  { label: "Facebook", value: "Facebook" },
  { label: "Telegram", value: "Telegram" },
  { label: "Phone Call", value: "Phone Call" },
  { label: "Mobile App", value: "Mobile App" },
  { label: "Other", value: "Other" },
] as const;

export const THREAT_LEVELS = ["Low", "Medium", "High", "Critical"] as const;

export const RISK_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export const PATTERN_STATUS = ["New", "Emerging", "Known"] as const;

// ============= UTILITY TYPE GUARDS =============

export function isReport(obj: any): obj is Report {
  return typeof obj === "object" && obj !== null && "fraud_type" in obj;
}

export function isPatternAnalysis(obj: any): obj is PatternAnalysis {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "pattern_status" in obj &&
    "threat_level" in obj
  );
}

export function isReportSubmissionResult(obj: any): obj is ReportSubmissionResult {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "incident_id" in obj &&
    "threat_score" in obj
  );
}
