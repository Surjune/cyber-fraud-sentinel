const API_BASE_URL = "http://127.0.0.1:8000";

// ============= TYPES =============

export interface AttackSource {
  id?: number;
  phone_number?: string | null;
  email?: string | null;
  url?: string | null;
  ip_address?: string | null;
  country?: string | null;
}

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
  sources?: AttackSource[];
  attack_sources?: AttackSource[];
}

export interface DashboardSummary {
  overallThreat: string;
  avgThreatScore: number;
  reportsToday: number;
  reportsThisWeek: number;
  totalReports: number;
  topFraudTypes: Array<{ fraud_type: string; count: number }>;
  topPlatforms: Array<{ platform: string; count: number }>;
  recentThreats?: Array<{
    id: number;
    category: string;
    risk_level: string;
    risk_score: number;
    region: string;
    created_at: string;
  }>;
}

export interface AdminStats {
  threat_trend?: Array<{ date: string; threat: number }>;
  fraud_types?: Array<{ fraud_type: string; count: number }>;
  platforms?: Array<{ platform: string; count: number }>;
  total_reports?: number;
  reports_today?: number;
  avg_threat_score?: number;
  risk_breakdown?: { [key: string]: number };
}

export interface SubmissionResult {
  incident_id: number;
  severity: string;
  threat_score: number;
  risk_level: string;
  repeat_attack: boolean;
  evidence_saved: boolean;
}

// ============= API FUNCTIONS =============

/**
 * Fetch the dashboard summary statistics
 */
export const fetchDashboardSummary = async (): Promise<DashboardSummary> => {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/summary`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch dashboard summary:", error);
    throw error;
  }
};

/**
 * Fetch all fraud reports
 */
export const fetchReports = async (): Promise<Report[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/reports`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Failed to fetch reports:", error);
    throw error;
  }
};

/**
 * Submit a new fraud report
 */
export const submitReport = async (reportData: any): Promise<SubmissionResult> => {
  try {
    const response = await fetch(`${API_BASE_URL}/report`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reportData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to submit report:", error);
    throw error;
  }
};

/**
 * Fetch admin statistics
 */
export const fetchAdminStats = async (timeframe: string = "7d"): Promise<AdminStats> => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/stats/${timeframe}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch admin stats:", error);
    throw error;
  }
};

/**
 * Health check for the backend
 */
export const healthCheck = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error("Health check failed:", error);
    return false;
  }
};

// ============= UTILITY FUNCTIONS =============

/**
 * Format currency values
 */
export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(value);
};

/**
 * Format date strings
 */
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Get color for threat level
 */
export const getThreatColor = (score: number): string => {
  if (score <= 30) return "#10b981";
  if (score <= 60) return "#f59e0b";
  if (score <= 80) return "#ef4444";
  return "#7c3aed";
};

/**
 * Get risk level color
 */
export const getRiskLevelColor = (level: string): string => {
  switch (level?.toUpperCase()) {
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
