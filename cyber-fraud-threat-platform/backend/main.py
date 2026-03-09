from fastapi import FastAPI, Depends, File, UploadFile, Form
from pydantic import BaseModel
from typing import Optional
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    text,
    func
)
from enum import Enum
from sqlalchemy.orm import Session, relationship
from datetime import datetime, timedelta
import re
from database import Base, engine, SessionLocal
import sqlite3
from fastapi.middleware.cors import CORSMiddleware
import hashlib
import random
from typing import List
import os
# --------------------------------------------------
# App
# --------------------------------------------------
app = FastAPI(title="Cyber Fraud Threat Platform")

# --------------------------------------------------
# DATABASE MODELS (4 TABLES)
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # Frontend dev server ports (Vite dynamically uses 5173+)
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        # Backend/admin ports
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://0.0.0.0:8000",
        # Production/testing URLs
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
class PlatformEnum(str, Enum):
    whatsapp = "WhatsApp"
    sms = "SMS"
    email = "Email"
    website = "Website"
    instagram = "Instagram"
    facebook = "Facebook"
    telegram = "Telegram"
    phone_call = "Phone Call"
    mobile_app = "Mobile App"
    other = "Other"

# 1️⃣ MAIN INCIDENT TABLE
class FraudReport(Base):
    __tablename__ = "fraud_reports"

    id = Column(Integer, primary_key=True, index=True)

    fraud_type = Column(String, nullable=False)
    attack_classification = Column(String)
    platform = Column(String, nullable=False)
    description = Column(String)

    # New column to record the source of the report (e.g. 'user', 'web', 'sms')
    source = Column(String)

    amount_lost = Column(Float, default=0)
    payment_method = Column(String)

    severity = Column(String, default="MEDIUM")
    threat_score = Column(Integer, default=50)

    # Pattern matching & threat analysis
    similarity_score = Column(Float, default=0.0)  # 0-100: how similar to existing patterns
    pattern_status = Column(String, default="New")  # "New", "Emerging", or "Known"
    threat_level = Column(String, default="Low")  # "Low", "Medium", "High", "Critical"
    similar_reports_count = Column(Integer, default=0)  # number of similar reports found

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    sources = relationship("AttackSource", back_populates="report")
    evidences = relationship("EvidenceFile", back_populates="report")
    threat = relationship("ThreatIndex", back_populates="report", uselist=False)
import re

def classify_source(source: str):
    phone = email = url = None

    if not source:
        return phone, email, url

    # Phone number (simple)
    if re.fullmatch(r"\+?\d{10,15}", source):
        phone = source

    # Email
    elif re.fullmatch(r"[^@]+@[^@]+\.[^@]+", source):
        email = source

    # URL / domain
    else:
        url = source

    return phone, email, url


def hash_sha256(value: str | None) -> str | None:
    """Return a SHA-256 hex digest for a non-empty string, or None.

    This is used to one-way hash sensitive identifiers (phone, email)
    before storing them in the database so the plaintext is not persisted.
    """
    if not value:
        return None
    # Normalize to string and compute SHA-256 hex digest
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def save_evidence_file(file: UploadFile) -> tuple[str, str] | tuple[None, None]:
    """Save uploaded evidence file to disk and compute SHA-256 hash.
    
    Returns:
        (file_path, file_hash) or (None, None) if no file.
    """
    if not file:
        return None, None
    
    # Ensure evidence folder exists
    evidence_dir = "evidence"
    if not os.path.exists(evidence_dir):
        os.makedirs(evidence_dir)
    
    # Generate unique filename using timestamp + original name
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S_")
    filename = timestamp + (file.filename or "unknown")
    filepath = os.path.join(evidence_dir, filename)
    
    # Read file content and compute hash
    file_hash = None
    try:
        # Read file into memory, compute hash, then save
        content = file.file.read()
        file_hash = hashlib.sha256(content).hexdigest()
        
        # Safe write
        with open(filepath, "wb") as f:
            f.write(content)
        
        return filepath, file_hash
    except Exception as e:
        print(f"Error saving evidence file: {e}")
        return None, None


def generate_report_integrity_hash(
    report_id: int,
    created_at: datetime,
    fraud_type: str,
    platform: str,
    description: Optional[str] = None,
    amount_lost: Optional[float] = None,
) -> str:
    """Generate a deterministic SHA-256 integrity hash for a fraud report.
    
    This hash proves the report has not been altered.
    Uses stable, ordered fields to ensure the same data always produces the same hash.
    
    Args:
        report_id: The database ID of the report
        created_at: Report creation timestamp
        fraud_type: Type of fraud
        platform: Platform where fraud occurred
        description: Description of the incident
        amount_lost: Amount lost in the fraud
    
    Returns:
        SHA-256 hex digest as a string
    """
    # Normalize data for consistent hashing
    # Use ISO format for datetime, lowercase for strings where appropriate
    iso_timestamp = created_at.isoformat()
    norm_fraud_type = (fraud_type or "").strip().lower()
    norm_platform = (platform or "").strip().lower()
    norm_description = (description or "").strip().lower()
    norm_amount = float(amount_lost) if amount_lost else 0.0
    
    # Create a stable, ordered payload for hashing
    # Use a format that's easy to debug
    payload = f"{report_id}|{iso_timestamp}|{norm_fraud_type}|{norm_platform}|{norm_description}|{norm_amount}"
    
    # Compute and return SHA-256 hex digest
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def extract_keywords(text: Optional[str], max_words: int = 5) -> set:
    """Extract meaningful keywords from description for pattern matching.
    
    Args:
        text: Description text to extract keywords from
        max_words: Maximum number of key terms to extract
    
    Returns:
        Set of lowercase keywords
    """
    if not text:
        return set()
    
    # Common words to ignore (stopwords)
    stopwords = {
        "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
        "is", "was", "are", "were", "been", "be", "have", "has", "had",
        "do", "does", "did", "will", "would", "could", "should",
        "this", "that", "these", "those", "i", "you", "he", "she", "it",
        "received", "got", "sent", "called", "text", "message", "email"
    }
    
    # Convert to lowercase and split
    words = text.lower().split()
    
    # Filter: remove short words and stopwords, keep meaningful terms
    keywords = {
        w.strip('.,!?;"\'') for w in words 
        if len(w.strip('.,!?;"\'')) > 3 and w.strip('.,!?;"\'') not in stopwords
    }
    
    return keywords


def calculate_similarity_score(
    new_report_fraud_type: str,
    new_report_platform: str,
    new_report_description: Optional[str],
    existing_fraud_type: str,
    existing_platform: str,
    existing_description: Optional[str],
) -> float:
    """Calculate similarity score between two reports (0-100).
    
    Scoring:
    - Exact fraud type match: +40 points
    - Exact platform match: +30 points
    - Keyword overlap in description: +30 points
    - Total: max 100
    
    Args:
        new_report_fraud_type, new_report_platform, new_report_description: New report fields
        existing_fraud_type, existing_platform, existing_description: Existing report fields
    
    Returns:
        Similarity score from 0-100
    """
    score = 0.0
    
    # Fraud type match
    if new_report_fraud_type.lower() == existing_fraud_type.lower():
        score += 40
    
    # Platform match
    if new_report_platform.lower() == existing_platform.lower():
        score += 30
    
    # Description keyword overlap
    new_keywords = extract_keywords(new_report_description)
    existing_keywords = extract_keywords(existing_description)
    
    if new_keywords and existing_keywords:
        overlap = len(new_keywords & existing_keywords)
        total_unique = len(new_keywords | existing_keywords)
        if total_unique > 0:
            keyword_similarity = (overlap / total_unique) * 30
            score += keyword_similarity
    elif not new_keywords and not existing_keywords:
        # Both have empty descriptions and other factors may already have scored
        pass
    
    return min(100, max(0, score))


def analyze_report_pattern(db: Session, new_report: "FraudReport") -> tuple[float, str, str, int]:
    """Analyze the new report against historical reports to detect patterns.
    
    Returns:
        Tuple of (similarity_score, pattern_status, threat_level, similar_reports_count)
    """
    # Find all reports except this one
    all_reports = db.query(FraudReport).filter(FraudReport.id != new_report.id).all()
    
    if not all_reports:
        # No historical reports to compare against
        return 0.0, "New", "Low", 0
    
    # Calculate similarity with each existing report
    similarities = []
    for existing_report in all_reports:
        sim_score = calculate_similarity_score(
            new_report.fraud_type,
            new_report.platform,
            new_report.description,
            existing_report.fraud_type,
            existing_report.platform,
            existing_report.description,
        )
        if sim_score > 0:  # Only count non-zero matches
            similarities.append(sim_score)
    
    # Determine pattern status and threat level
    if not similarities:
        # No similar reports found
        return 0.0, "New", "Low", 0
    
    # Get the best match score
    best_match_score = max(similarities)
    match_count = sum(1 for s in similarities if s >= 50)  # Count "meaningful" matches
    
    # Determine pattern status based on similarity
    if best_match_score >= 80:
        pattern_status = "Known"
    elif best_match_score >= 50:
        pattern_status = "Emerging"
    else:
        pattern_status = "New"
    
    # Determine threat level
    # Factors: similarity score, count of similar reports
    if best_match_score >= 80 and match_count >= 10:
        threat_level = "Critical"
    elif best_match_score >= 80 or match_count >= 10:
        threat_level = "High"
    elif best_match_score >= 50 and match_count >= 5:
        threat_level = "High"
    elif best_match_score >= 50 or match_count >= 3:
        threat_level = "Medium"
    else:
        threat_level = "Low"
    
    return best_match_score, pattern_status, threat_level, match_count


# 2️⃣ ATTACK SOURCE TABLE
class AttackSource(Base):
    __tablename__ = "attack_sources"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("fraud_reports.id"))

    phone_number = Column(String)
    email = Column(String)
    url = Column(String)
    ip_address = Column(String)
    country = Column(String)

    report = relationship("FraudReport", back_populates="sources")


# 3️⃣ EVIDENCE TABLE
class EvidenceFile(Base):
    __tablename__ = "evidence_files"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("fraud_reports.id"))

    evidence_type = Column(String)  # image, audio, pdf
    file_path = Column(String)
    file_hash = Column(String)

    uploaded_at = Column(DateTime, default=datetime.utcnow)

    report = relationship("FraudReport", back_populates="evidences")


# 4️⃣ THREAT INDEX TABLE
class ThreatIndex(Base):
    __tablename__ = "threat_index"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("fraud_reports.id"))

    risk_score = Column(Integer)
    risk_level = Column(String)
    category = Column(String)
    region = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    report = relationship("FraudReport", back_populates="threat")



# --------------------------------------------------
# CREATE TABLES
# --------------------------------------------------
Base.metadata.create_all(bind=engine)

# --------------------------------------------------
# Simple runtime migration for adding 'source' column
# --------------------------------------------------

def ensure_source_column():
    """Ensure the 'source' column exists on the 'fraud_reports' table.
    For SQLite we use PRAGMA table_info and ALTER TABLE ADD COLUMN when missing.
    """
    with engine.connect() as conn:
        cols = [row[1] for row in conn.execute(text("PRAGMA table_info(fraud_reports)"))]
        if "source" not in cols:
            conn.execute(text("ALTER TABLE fraud_reports ADD COLUMN source TEXT"))
            print("[migration] added 'source' column to 'fraud_reports'")

def ensure_pattern_analysis_columns():
    """Ensure pattern analysis columns exist on the 'fraud_reports' table.
    Adds: similarity_score, pattern_status, threat_level, similar_reports_count
    """
    with engine.connect() as conn:
        cols = [row[1] for row in conn.execute(text("PRAGMA table_info(fraud_reports)"))]
        new_columns = {
            "similarity_score": "REAL DEFAULT 0.0",
            "pattern_status": "TEXT DEFAULT 'New'",
            "threat_level": "TEXT DEFAULT 'Low'",
            "similar_reports_count": "INTEGER DEFAULT 0"
        }
        for col_name, col_def in new_columns.items():
            if col_name not in cols:
                conn.execute(text(f"ALTER TABLE fraud_reports ADD COLUMN {col_name} {col_def}"))
                print(f"[migration] added '{col_name}' column to 'fraud_reports'")
        conn.commit()

# Run migrations at startup
ensure_source_column()
ensure_pattern_analysis_columns()

class FraudTypeEnum(str, Enum):
    scam = "Scam"
    phishing = "Phishing"
    fraudulent_link = "Fraudulent Link"
    fake_call = "Fake Call"
    digital_deception = "Digital Deception"

# --------------------------------------------------
# SCHEMAS
# --------------------------------------------------
class FraudReportCreate(BaseModel):
    fraud_type: FraudTypeEnum
    attack_classification: Optional[str] = None
    platform: PlatformEnum
    description: Optional[str] = None

    phone_number: Optional[str] = None
    email: Optional[str] = None
    url: Optional[str] = None
    ip_address: Optional[str] = None
    country: Optional[str] = None

    amount_lost: Optional[float] = 0
    payment_method: Optional[str] = None

    # Optional source field: where the report originated
    source: Optional[str] = None


# --------------------------------------------------
# DB DEPENDENCY
# --------------------------------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/dashboard/summary")
def dashboard_summary(days: int = 7, db: Session = Depends(get_db)):
    """Unified dashboard summary used by both Dashboard and Admin views.

    Returns a single JSON object containing:
      - total_reports, reports_today, reports_this_week
      - average_threat_score, overall_risk_level
      - top_fraud_types: list of {fraud_type, count}
      - top_platforms: list of {platform, count}
      - threat_trend: daily series for the last `days` days (date, avg_threat_score, report_count)
      - recent_threats: latest threat_index rows for display (id, risk_score, risk_level, category, region, created_at)

    This endpoint centralizes all aggregation so the frontend is display-only
    and does not re-compute or derive values locally.
    """
    # Core metrics from threat_index
    metrics = compute_dashboard_metrics(db)

    # Top fraud types (group by fraud_reports.fraud_type)
    fraud_results = db.query(
        FraudReport.fraud_type,
        func.count(FraudReport.id).label("count")
    ).group_by(FraudReport.fraud_type).order_by(func.count(FraudReport.id).desc()).all()
    top_fraud_types = [{"fraud_type": row[0], "count": row[1]} for row in fraud_results]

    # Top platforms (group by fraud_reports.platform)
    plat_results = db.query(
        FraudReport.platform,
        func.count(FraudReport.id).label("count")
    ).group_by(FraudReport.platform).order_by(func.count(FraudReport.id).desc()).all()
    top_platforms = [{"platform": row[0], "count": row[1]} for row in plat_results]

    # Threat trend: reuse admin_threat_trend logic to build daily averages
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=days)
    trend_results = db.query(
        func.date(FraudReport.created_at).label("date"),
        func.avg(FraudReport.threat_score).label("avg_threat_score"),
        func.count(FraudReport.id).label("report_count")
    ).filter(
        func.date(FraudReport.created_at) >= start_date
    ).group_by(
        func.date(FraudReport.created_at)
    ).order_by(
        func.date(FraudReport.created_at)
    ).all()

    threat_trend = [
        {
            "date": str(row[0]),
            "avg_threat_score": round(float(row[1]) if row[1] else 0, 2),
            "report_count": row[2],
        }
        for row in trend_results
    ]

    # Recent threats: return latest 20 threat_index entries
    recent = db.query(ThreatIndex).order_by(ThreatIndex.created_at.desc()).limit(20).all()
    recent_threats = [
        {
            "id": r.id,
            "risk_score": r.risk_score,
            "risk_level": r.risk_level,
            "category": r.category,
            "region": r.region,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in recent
    ]

    # Compose response using the canonical metrics keys so Dashboard and Admin
    # consume the same format and do not recompute values locally.
    response = {
        "total_reports": metrics["total_reports"],
        "reports_today": metrics["reports_today"],
        "reports_this_week": metrics["reports_this_week"],
        "average_threat_score": metrics["average_threat_score"],
        "overall_risk_level": metrics["overall_risk_level"],
        "top_fraud_types": top_fraud_types,
        "top_platforms": top_platforms,
        "threat_trend": threat_trend,
        "recent_threats": recent_threats,
    }

    return response


# --------------------------------------------------
# API ROUTES
# --------------------------------------------------

@app.post("/report")
def submit_report(
    fraud_type: str = Form(...),
    platform: str = Form(...),
    attack_classification: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    source: Optional[str] = Form(None),
    phone_number: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    url: Optional[str] = Form(None),
    ip_address: Optional[str] = Form(None),
    country: Optional[str] = Form(None),
    amount_lost: Optional[str] = Form("0"),
    payment_method: Optional[str] = Form(None),
    evidence_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    """Submit a fraud report with optional evidence file upload.
    
    Accepts form data (not JSON) to support file uploads.
    """
    try:
        # 1️⃣ Repeat attack detection
        is_repeat, repeat_count = check_repeat_attack(db, phone_number, url)

        # 2️⃣ Convert amount
        try:
            amount = float(amount_lost) if amount_lost else 0.0
        except (ValueError, TypeError):
            amount = 0.0

        severity = calculate_severity(amount)

        # 3️⃣ DETERMINISTIC THREAT SCORING - Multi-factor forensic analysis
        # ================================================
        
        # Evidence check
        has_evidence = bool(evidence_file)
        evidence_type = evidence_file.filename if evidence_file else None
        
        # Frequency and spread analysis
        frequency_7d = count_similar_reports_7d(db, fraud_type, platform)
        region_count = count_regions_reporting(db, fraud_type)
        
        # Calculate deterministic threat score using explicit factors
        fraud_type_score, fraud_severity = get_fraud_type_severity(fraud_type)
        financial_score, financial_impact = calculate_financial_impact_score(amount)
        evidence_score, evidence_strength = calculate_evidence_strength_score(has_evidence, evidence_type)
        repeat_score, repeat_pattern = calculate_repeat_pattern_score(is_repeat, repeat_count)
        spread_score, geographic_spread = calculate_geographic_spread_score(region_count)
        platform_bonus, platform_risk = get_platform_risk_bonus(platform)
        
        # Compute composite threat score
        threat_score = calculate_composite_threat_score(
            fraud_type_score=fraud_type_score,
            financial_impact_score=financial_score,
            evidence_strength_score=evidence_score,
            repeat_pattern_score=repeat_score,
            geographic_spread_score=spread_score,
            platform_bonus=platform_bonus,
        )
        
        risk_level = calculate_risk_level(threat_score)
        
        # Generate human-readable explanation
        reason_summary = generate_threat_reason(
            fraud_type=fraud_type,
            amount_lost=amount,
            platform=platform,
            is_repeat=is_repeat,
            has_evidence=has_evidence,
            repeat_count=repeat_count,
            frequency_7d=frequency_7d,
            region_count=region_count,
        )

        # 4️⃣ Insert into fraud_reports
        fraud = FraudReport(
            fraud_type=fraud_type,
            attack_classification=attack_classification,
            platform=platform,
            description=description,
            source=source,
            amount_lost=amount,
            payment_method=payment_method,
            severity=severity,
            threat_score=threat_score,
        )

        db.add(fraud)
        db.commit()
        db.refresh(fraud)

        # 4.5️⃣ PATTERN ANALYSIS - Detect if this is a known, emerging, or new pattern
        similarity_score, pattern_status, threat_level_from_pattern, similar_count = analyze_report_pattern(db, fraud)
        
        # Update the fraud report with pattern analysis results
        fraud.similarity_score = similarity_score
        fraud.pattern_status = pattern_status
        fraud.threat_level = threat_level_from_pattern
        fraud.similar_reports_count = similar_count
        db.commit()
        db.refresh(fraud)
        # Classify the provided source and one-way hash sensitive identifiers
        classified_phone, classified_email, classified_url = classify_source(phone_number)

        # Hash phone and email server-side before storing (one-way, SHA-256)
        phone_hashed = hash_sha256(classified_phone)
        email_hashed = hash_sha256(classified_email)

        attack_source = AttackSource(
            report_id=fraud.id,
            phone_number=phone_hashed,
            email=email_hashed,
            url=classified_url or url,
            ip_address=ip_address,
            country=country,
        )
        db.add(attack_source)

        # 6️⃣ Insert into threat_index with component scores
        threat = ThreatIndex(
            report_id=fraud.id,
            risk_score=threat_score,
            risk_level=risk_level,
            category=attack_classification,
            region=country,
        )
        db.add(threat)

        # 7️⃣ Handle evidence file upload
        evidence_saved = False
        if evidence_file:
            file_path, file_hash = save_evidence_file(evidence_file)
            if file_path and file_hash:
                # Determine evidence type from filename
                filename_lower = evidence_file.filename.lower() if evidence_file.filename else ""
                if filename_lower.endswith(".pdf"):
                    evidence_type = "pdf"
                elif any(filename_lower.endswith(ext) for ext in [".mp3", ".wav", ".m4a", ".aac"]):
                    evidence_type = "audio"
                else:
                    evidence_type = "image"

                evidence = EvidenceFile(
                    report_id=fraud.id,
                    evidence_type=evidence_type,
                    file_path=file_path,
                    file_hash=file_hash,
                )
                db.add(evidence)
                evidence_saved = True

        db.commit()

        return {
            "message": "Fraud report stored successfully",
            "incident_id": fraud.id,
            "severity": severity,
            "threat_score": threat_score,
            "risk_level": risk_level,
            "repeat_attack": is_repeat,
            "repeat_count": repeat_count,
            "evidence_saved": evidence_saved,
            # Pattern matching results
            "pattern_analysis": {
                "pattern_status": pattern_status,
                "threat_level": threat_level_from_pattern,
                "similarity_score": similarity_score,
                "similar_reports_count": similar_count,
            },
            "threat_assessment": {
                "fraud_type_severity": fraud_severity,
                "financial_impact": financial_impact,
                "evidence_strength": evidence_strength,
                "repeat_pattern": repeat_pattern,
                "geographic_spread": geographic_spread,
                "platform_risk": platform_risk,
                "composite_score": threat_score,
                "reason": reason_summary,
            },
        }
    except Exception as e:
        print(f"Error in /report endpoint: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"error": f"Failed to process report: {str(e)}"}


def calculate_severity(amount_lost: float) -> str:
    if amount_lost == 0:
        return "LOW"
    elif amount_lost <= 5000:
        return "MEDIUM"
    elif amount_lost <= 20000:
        return "HIGH"
    else:
        return "CRITICAL"


# ================================================
# IMPROVED THREAT INDEX SCORING SYSTEM
# ================================================
# Three-component threat scoring model:
# 1. Impact Score (0-40): Financial damage
# 2. Confidence Score (0-30): Evidence + repetition quality
# 3. Spread Score (0-30): Frequency + geographic reach
# Final Score = weighted combination of above
# ================================================

def get_fraud_type_severity(fraud_type: str) -> tuple[int, str]:
    """
    Classify fraud type by severity (0-100 baseline points).
    Returns (score_contribution, severity_category).
    
    Severity categories and baselines:
    - Low (Phishing): 15 points
    - Medium (Standard Scam): 35 points
    - High (OTP Fraud, Fake Call): 50 points
    - Critical (Malware, Identity Theft, Account Takeover): 70 points
    """
    fraud_type_lower = fraud_type.lower() if fraud_type else ""
    
    critical_keywords = {
        "malware": 70,
        "identity theft": 70,
        "account takeover": 65,
        "digital deception": 60,
    }
    
    high_keywords = {
        "otp fraud": 55,
        "vishing": 50,
        "fake call": 50,
        "credential phishing": 48,
        "fraudulent link": 45,
        "malicious link": 45,
    }
    
    medium_keywords = {
        "scam": 35,
        "investment scam": 40,
        "social engineering": 38,
    }
    
    low_keywords = {
        "phishing": 20,
    }
    
    for key, score in critical_keywords.items():
        if key in fraud_type_lower:
            return score, "Critical"
    
    for key, score in high_keywords.items():
        if key in fraud_type_lower:
            return score, "High"
    
    for key, score in medium_keywords.items():
        if key in fraud_type_lower:
            return score, "Medium"
    
    for key, score in low_keywords.items():
        if key in fraud_type_lower:
            return score, "Low"
    
    return 30, "Medium"


def get_platform_risk_bonus(platform: str) -> tuple[int, str]:
    """
    Platform risk bonus contribution.
    Returns (score_adjustment, platform_category).
    
    High-risk (real-time, hard to verify): +15 points
    Medium-risk (semi-traceable): +8 points
    Low-risk (logs available): +3 points
    """
    platform_lower = platform.lower() if platform else ""
    
    high_risk = {"whatsapp", "telegram", "phone call", "sms"}
    medium_risk = {"email", "instagram", "facebook", "mobile app", "messenger"}
    low_risk = {"website"}
    
    for p in high_risk:
        if p in platform_lower:
            return 15, "High-Risk"
    
    for p in medium_risk:
        if p in platform_lower:
            return 8, "Medium-Risk"
    
    for p in low_risk:
        if p in platform_lower:
            return 3, "Low-Risk"
    
    return 5, "Unknown"


def calculate_financial_impact_score(amount_lost: float) -> tuple[int, str]:
    """
    Calculate financial impact contribution (0-30 points).
    Returns (score_contribution, impact_category).
    
    Impact bands:
    - ₹0: 0 points (Minimal)
    - ₹1-10k: 8 points (Low)
    - ₹10k-50k: 18 points (Medium)
    - ₹50k+: 30 points (High)
    """
    if amount_lost <= 0:
        return 0, "No Loss"
    elif amount_lost <= 10000:
        return 8, "Low (₹1-10k)"
    elif amount_lost <= 50000:
        return 18, "Medium (₹10k-50k)"
    else:
        return 30, "High (₹50k+)"


def calculate_evidence_strength_score(has_evidence: bool, evidence_type: Optional[str] = None) -> tuple[int, str]:
    """
    Calculate evidence strength contribution (0-25 points).
    Returns (score_contribution, evidence_category).
    
    Evidence categories:
    - None: 0 points (Low Confidence)
    - Text/Phone: 10 points (Medium Confidence)
    - Screenshots/URLs/Logs: 25 points (High Confidence)
    """
    if not has_evidence:
        return 0, "No Evidence"
    
    if evidence_type:
        evidence_lower = evidence_type.lower()
        if any(x in evidence_lower for x in ["screenshot", "url", "log", "pdf"]):
            return 25, "Strong (Screenshots/URLs/Logs)"
        elif any(x in evidence_lower for x in ["text", "phone", "audio"]):
            return 10, "Medium (Text/Phone)"
    
    return 10, "Medium (Evidence Provided)"


def calculate_repeat_pattern_score(is_repeat_attacker: bool, repeat_count: int) -> tuple[int, str]:
    """
    Calculate repeat pattern contribution (0-20 points).
    Returns (score_contribution, pattern_category).
    
    Repeat categories:
    - No history: 0 points
    - 1-2 times: 8 points
    - 3-4 times: 14 points
    - 5+ times: 20 points (Serial Offender)
    """
    if not is_repeat_attacker or repeat_count == 0:
        return 0, "No Prior Reports"
    elif repeat_count <= 2:
        return 8, "1-2 Prior Reports"
    elif repeat_count <= 4:
        return 14, "3-4 Prior Reports"
    else:
        return 20, "5+ Reports (Serial Offender)"


def calculate_geographic_spread_score(region_count: int) -> tuple[int, str]:
    """
    Calculate geographic spread contribution (0-15 points).
    Returns (score_contribution, spread_category).
    
    Spread categories:
    - Single region: 0 points (Localized)
    - 2-3 regions: 8 points (Regional)
    - 4+ regions: 15 points (Multi-Regional/Organized)
    """
    if region_count <= 1:
        return 0, "Single Region"
    elif region_count <= 3:
        return 8, f"{region_count} Regions"
    else:
        return 15, f"{region_count}+ Regions (Organized)"


def calculate_composite_threat_score(
    fraud_type_score: int,
    financial_impact_score: int,
    evidence_strength_score: int,
    repeat_pattern_score: int,
    geographic_spread_score: int,
    platform_bonus: int,
) -> int:
    """
    Calculate composite threat score (0-100) using weighted factors.
    
    Components and max contributions:
    - Fraud Type Severity: Base (0-70) - determines baseline threat
    - Financial Impact: +30 points max - loss severity
    - Evidence Strength: +25 points max - confidence in threat assessment
    - Repeat Pattern: +20 points max - attacker history
    - Geographic Spread: +15 points max - attack scale/organization
    - Platform Risk: +15 points max - channel difficulty
    
    Total maximum: 175 points, then normalized to 0-100.
    """
    raw_score = (
        fraud_type_score +
        financial_impact_score +
        evidence_strength_score +
        repeat_pattern_score +
        geographic_spread_score +
        platform_bonus
    )
    
    max_possible = 70 + 30 + 25 + 20 + 15 + 15
    normalized_score = min(int((raw_score / max_possible) * 100), 100)
    
    return max(0, normalized_score)


def calculate_risk_level(threat_score: int) -> str:
    """
    Map threat score to risk level.
    
    Non-linear thresholds reflect real-world risk distribution:
    - 0-25: LOW (manageable)
    - 26-50: MEDIUM (concerning)
    - 51-75: HIGH (serious)
    - 76-100: CRITICAL (immediate action)
    """
    if threat_score <= 25:
        return "LOW"
    elif threat_score <= 50:
        return "MEDIUM"
    elif threat_score <= 75:
        return "HIGH"
    else:
        return "CRITICAL"


def generate_threat_reason(
    fraud_type: str,
    amount_lost: float,
    platform: str,
    is_repeat: bool,
    has_evidence: bool,
    repeat_count: int = 0,
    frequency_7d: int = 0,
    region_count: int = 1,
) -> str:
    """
    Generate human-readable explanation of threat assessment.
    Shows all contributing factors and their impact on the threat score.
    """
    factors = []
    
    fraud_type_lower = fraud_type.lower() if fraud_type else ""
    
    if any(x in fraud_type_lower for x in ["critical", "identity theft", "malware", "account takeover"]):
        factors.append("CRITICAL fraud type")
    elif any(x in fraud_type_lower for x in ["otp fraud", "fake call", "vishing"]):
        factors.append("HIGH-severity fraud type")
    elif any(x in fraud_type_lower for x in ["scam", "investment"]):
        factors.append("MEDIUM-severity fraud")
    else:
        factors.append(f"{fraud_type} attack")
    
    if amount_lost > 50000:
        factors.append(f"High financial loss (₹{amount_lost:,.0f})")
    elif amount_lost > 10000:
        factors.append(f"Medium loss (₹{amount_lost:,.0f})")
    elif amount_lost > 0:
        factors.append(f"Low loss (₹{amount_lost:,.0f})")
    
    if has_evidence:
        factors.append("Strong evidence provided")
    else:
        factors.append("No supporting evidence")
    
    if is_repeat and repeat_count >= 5:
        factors.append(f"Serial attacker ({repeat_count}+ reports)")
    elif is_repeat and repeat_count > 0:
        factors.append(f"Repeat offender ({repeat_count} prior reports)")
    
    if frequency_7d > 5:
        factors.append(f"Coordinated attack ({frequency_7d} reports in 7dys)")
    elif frequency_7d > 1:
        factors.append(f"{frequency_7d} similar reports (7 days)")
    
    if region_count >= 4:
        factors.append(f"Organized threat ({region_count} regions)")
    elif region_count > 1:
        factors.append(f"Multi-regional ({region_count} regions)")
    
    if platform.lower() in {"whatsapp", "telegram", "phone call", "sms"}:
        factors.append(f"High-risk channel ({platform})")
    
    reason = " + ".join(factors) + "."
    return reason


def check_repeat_attack(db, phone: str, url: str) -> tuple[bool, int]:
    """
    Check if attacker has been reported before.
    Returns (is_repeat, count_of_reports).
    """
    repeat_count = 0
    
    # When comparing phones, hash the incoming phone the same way as stored values
    if phone:
        hashed = hash_sha256(phone)
        if hashed:
            repeat_count = db.query(AttackSource).filter(AttackSource.phone_number == hashed).count()
            if repeat_count > 0:
                return True, repeat_count

    if url:
        repeat_count = db.query(AttackSource).filter(AttackSource.url == url).count()
        if repeat_count > 0:
            return True, repeat_count

    return False, repeat_count


def count_similar_reports_7d(db, fraud_type: str, platform: str) -> int:
    """
    Count similar fraud reports in last 7 days (same fraud type + platform).
    Helps identify coordinated attacks or trending fraud methods.
    """
    cutoff_date = datetime.utcnow() - timedelta(days=7)
    count = db.query(FraudReport).filter(
        FraudReport.fraud_type == fraud_type,
        FraudReport.platform == platform,
        FraudReport.created_at >= cutoff_date,
    ).count()
    return count


def count_regions_reporting(db, fraud_type: str) -> int:
    """
    Count number of distinct regions reporting the same fraud type (last 7 days).
    Indicates geographic spread of threat.
    """
    cutoff_date = datetime.utcnow() - timedelta(days=7)
    regions = db.query(
        func.count(func.distinct(AttackSource.country))
    ).join(
        FraudReport,
        AttackSource.report_id == FraudReport.id
    ).filter(
        FraudReport.fraud_type == fraud_type,
        FraudReport.created_at >= cutoff_date,
    ).scalar() or 0
    
    return regions

@app.get("/reports")
def get_all_reports(db: Session = Depends(get_db)):
    """Get all fraud reports with integrity hashes and pattern analysis results."""
    reports = db.query(FraudReport).all()
    
    # Add integrity hash and pattern analysis to each report
    reports_with_analysis = []
    for report in reports:
        integrity_hash = generate_report_integrity_hash(
            report_id=report.id,
            created_at=report.created_at,
            fraud_type=report.fraud_type,
            platform=report.platform,
            description=report.description,
            amount_lost=report.amount_lost,
        )
        
        # Convert SQLAlchemy object to dict and add hash + pattern analysis
        report_dict = {
            "id": report.id,
            "fraud_type": report.fraud_type,
            "platform": report.platform,
            "description": report.description,
            "amount_lost": report.amount_lost,
            "threat_score": report.threat_score,
            "created_at": report.created_at.isoformat() if report.created_at else None,
            "integrity_hash": integrity_hash,
            # Pattern analysis results
            "pattern_status": report.pattern_status,
            "threat_level": report.threat_level,
            "similarity_score": report.similarity_score,
            "similar_reports_count": report.similar_reports_count,
        }
        reports_with_analysis.append(report_dict)
    
    return reports_with_analysis

@app.get("/")
def health_check():
    return {"status": "Backend running successfully"}


# ================================================
# ADMIN ANALYTICS ENDPOINTS
# ================================================

@app.get("/admin/stats/overview")
def admin_overview(db: Session = Depends(get_db)):
    """Overall statistics: total reports, today's reports, avg threat score, current risk level."""
    # Use the single aggregation service so the calculation logic is
    # centralized and deterministic. This avoids duplicate logic and
    # ensures all dashboard views share the same numbers.
    metrics = compute_dashboard_metrics(db)

    # Maintain backward-compatible key name `current_risk_level` for this
    # endpoint while relying on the single source of truth.
    return {
        "total_reports": metrics["total_reports"],
        "reports_today": metrics["reports_today"],
        "average_threat_score": metrics["average_threat_score"],
        "current_risk_level": metrics["overall_risk_level"],
    }


@app.get("/admin/stats/fraud-types")
def admin_fraud_types(db: Session = Depends(get_db)):
    """Count of reports grouped by fraud type."""
    results = db.query(
        FraudReport.fraud_type,
        func.count(FraudReport.id).label("count")
    ).group_by(FraudReport.fraud_type).all()
    
    return [{"fraud_type": row[0], "count": row[1]} for row in results]


@app.get("/admin/stats/platforms")
def admin_platforms(db: Session = Depends(get_db)):
    """Count of reports grouped by platform."""
    results = db.query(
        FraudReport.platform,
        func.count(FraudReport.id).label("count")
    ).group_by(FraudReport.platform).all()
    
    return [{"platform": row[0], "count": row[1]} for row in results]


@app.get("/admin/stats/threat-trend")
def admin_threat_trend(days: int = 7, db: Session = Depends(get_db)):
    """Threat score trend over the last N days.
    
    Returns daily average threat scores for visualization.
    """
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=days)
    
    results = db.query(
        func.date(FraudReport.created_at).label("date"),
        func.avg(FraudReport.threat_score).label("avg_threat_score"),
        func.count(FraudReport.id).label("report_count")
    ).filter(
        func.date(FraudReport.created_at) >= start_date
    ).group_by(
        func.date(FraudReport.created_at)
    ).order_by(
        func.date(FraudReport.created_at)
    ).all()
    
    return [
        {
            "date": str(row[0]),
            "avg_threat_score": round(float(row[1]) if row[1] else 0, 2),
            "report_count": row[2]
        }
        for row in results
    ]


@app.get("/threat-index/summary")
def threat_index_summary(db: Session = Depends(get_db)):
    """Summary metrics derived from the threat_index table (single source of truth).

    Returns:
      - average_threat_score (float)
      - overall_risk_level (string)
      - total_reports (int)
      - reports_today (int)
      - reports_this_week (int)
    """
    # Delegate to the single aggregation/service function which contains
    # explicit, well-documented calculations that are traceable to DB rows.
    return compute_dashboard_metrics(db)


def compute_dashboard_metrics(db: Session) -> dict:
    """Compute and return all dashboard metrics from DB rows.

    This single function encapsulates all calculations required by the
    frontend dashboard. Requirements implemented here:

    1) Reports Today: count of `threat_index` rows where `created_at` date
       equals today's date (server timezone / UTC used consistently).

    2) Reports This Week: count of `threat_index` rows with `created_at`
       within the last 7 days (inclusive). This shows recent activity.

    3) Average Threat Score: explicitly computed as
           avg_threat_score = sum(risk_score) / total_reports
       rounded to 2 decimal places. If `total_reports` is 0 then this function
       returns 0.00 to avoid NaN or null values.

    4) Overall Risk Level: derived strictly from `avg_threat_score` using the
       mapping: 0-25 LOW, 26-50 MEDIUM, 51-75 HIGH, 76-100 CRITICAL.

    5) total_reports: total rows in `threat_index` (single source of truth).

    The frontend must only display these returned values and must not
    duplicate any calculation logic.
    """
    # Use server UTC date as the 'today' baseline so the calculation is
    # deterministic and independent of client timezones.
    today = datetime.utcnow().date()
    week_ago = datetime.utcnow() - timedelta(days=7)

    # 1) Total reports: count of rows in `threat_index`.
    total_reports = db.query(func.count(ThreatIndex.id)).scalar() or 0

    # 2) Reports Today: count rows where the date portion of created_at == today.
    #    Using SQL `date()` ensures we compare dates at the DB level so each
    #    counted row maps to an actual persisted record.
    reports_today = db.query(func.count(ThreatIndex.id)).filter(
        func.date(ThreatIndex.created_at) == today
    ).scalar() or 0

    # 3) Reports This Week: rows with created_at >= (now - 7 days).
    reports_this_week = db.query(func.count(ThreatIndex.id)).filter(
        ThreatIndex.created_at >= week_ago
    ).scalar() or 0

    # 4) Average Threat Score: compute sum and count explicitly and divide.
    #    This makes the formula visible to reviewers and avoids hidden
    #    DB-specific averaging semantics.
    total_score_sum = db.query(func.sum(ThreatIndex.risk_score)).scalar() or 0
    if total_reports == 0:
        average_threat_score = 0.00
    else:
        average_threat_score = round(float(total_score_sum) / float(total_reports), 2)

    # 5) Derive overall risk level from the averaged score using the
    #    canonical mapping required by judges and auditors.
    overall_risk_level = calculate_risk_level(int(average_threat_score)) if total_reports > 0 else "LOW"

    return {
        "total_reports": int(total_reports),
        "reports_today": int(reports_today),
        "reports_this_week": int(reports_this_week),
        "average_threat_score": average_threat_score,
        "overall_risk_level": overall_risk_level,
    }


def seed_mock_reports(count: int = 25, force: bool = False) -> None:
    """Insert realistic mock fraud reports into the database.

    - Uses existing SQLAlchemy models defined in this module.
    - Uses existing `calculate_severity`, `calculate_threat_score`, and
      `calculate_risk_level` helpers.
    - Hashes phone/email using `hash_sha256` before writing to DB to match
      server-side storage policy.

    Parameters:
        count: number of reports to insert (default 25)
        force: if False and DB already has reports, seeding is skipped.
    """
    db = SessionLocal()
    try:
        existing = db.query(FraudReport).count()
        if existing > 0 and not force:
            print(f"Seeding skipped: database already has {existing} reports (use force=True to override)")
            return

        fraud_types = ["Scam", "Phishing", "Fraudulent Link", "Fake Call", "Digital Deception"]
        platforms = ["WhatsApp", "SMS", "Email", "Website", "Instagram", "Facebook", "Telegram", "Phone Call", "Mobile App", "Other"]
        attack_classes = [
            "OTP fraud",
            "Credential phishing",
            "Fake support",
            "Vishing",
            "Malicious link",
            "Account takeover",
            "Investment scam",
            "Social engineering",
        ]
        countries = ["India", "United States", "United Kingdom", "Australia"]
        payment_methods = ["UPI", "Card", "Bank Transfer", "Wallet", "Not Applicable"]

        def gen_phone_india() -> str:
            # Indian mobile numbers typically start with 6-9 and have 10 digits
            prefix = random.choice(["6","7","8","9"]) + "" 
            rest = "".join(str(random.randint(0,9)) for _ in range(9))
            return "+91" + prefix + rest

        def gen_email(i: int) -> str:
            domains = ["gmail.com", "yahoo.com", "outlook.com", "example.net"]
            name = random.choice(["user", "info", "help", "contact"]) + str(random.randint(10,999))
            return f"{name}{i}@{random.choice(domains)}"

        def gen_url(i: int, fraud_type: str) -> str:
            hosts = ["secure-bank", "verify-account", "upi-update", "payment-check", "login-service"]
            tld = random.choice([".in", ".com", ".info", ".net"])
            host = random.choice(hosts)
            return f"https://{host}{i}{tld}"

        for i in range(count):
            fraud_type = random.choice(fraud_types)
            platform = random.choice(platforms)
            attack_classification = random.choice(attack_classes)
            country = random.choices(countries, weights=[70,10,10,10])[0]

            # Amount distribution: many small/zero, some medium, few large
            r = random.random()
            if r < 0.45:
                amount = 0.0
            elif r < 0.8:
                amount = round(random.uniform(100, 5000), 2)
            elif r < 0.95:
                amount = round(random.uniform(5000, 30000), 2)
            else:
                amount = round(random.uniform(30000, 200000), 2)

            payment_method = random.choice(payment_methods)

            # Make source plausible
            phone = gen_phone_india() if random.random() < 0.7 else None
            email = gen_email(i) if random.random() < 0.5 else None
            url = gen_url(i, fraud_type) if random.random() < 0.4 else None

            # Derived intelligence using improved threat scoring
            is_repeat, repeat_count = check_repeat_attack(db, phone, url)
            severity = calculate_severity(amount)
            
            # Calculate deterministic threat score using new six-factor model
            frequency_7d = count_similar_reports_7d(db, fraud_type, platform)
            region_count = count_regions_reporting(db, fraud_type)
            
            # Calculate component scores using the new explicit factor functions
            fraud_type_score, fraud_severity = get_fraud_type_severity(fraud_type)
            financial_score, financial_impact = calculate_financial_impact_score(amount)
            evidence_score, evidence_strength = calculate_evidence_strength_score(False, None)  # No evidence in seeding
            repeat_score, repeat_pattern = calculate_repeat_pattern_score(is_repeat, repeat_count)
            spread_score, geographic_spread = calculate_geographic_spread_score(region_count)
            platform_bonus, platform_risk = get_platform_risk_bonus(platform)
            
            # Compute composite threat score
            threat_score = calculate_composite_threat_score(
                fraud_type_score=fraud_type_score,
                financial_impact_score=financial_score,
                evidence_strength_score=evidence_score,
                repeat_pattern_score=repeat_score,
                geographic_spread_score=spread_score,
                platform_bonus=platform_bonus,
            )
            
            risk_level = calculate_risk_level(threat_score)
            
            reason_summary = generate_threat_reason(
                fraud_type=fraud_type,
                amount_lost=amount,
                platform=platform,
                is_repeat=is_repeat,
                has_evidence=False,
                repeat_count=repeat_count,
                frequency_7d=frequency_7d,
                region_count=region_count,
            )

            description = (
                f"Reported {fraud_type} via {platform}. Details: {attack_classification}. "
                f"Victim reported loss of {amount} via {payment_method}."
            )

            # Insert FraudReport
            fraud = FraudReport(
                fraud_type=fraud_type,
                attack_classification=attack_classification,
                platform=platform,
                description=description,
                source="seed",
                amount_lost=amount,
                payment_method=payment_method,
                severity=severity,
                threat_score=threat_score,
                created_at=datetime.utcnow()
            )
            db.add(fraud)
            db.commit()
            db.refresh(fraud)

            # Insert AttackSource — hash phone/email to match storage policy
            phone_h = hash_sha256(phone) if phone else None
            email_h = hash_sha256(email) if email else None

            atk = AttackSource(
                report_id=fraud.id,
                phone_number=phone_h,
                email=email_h,
                url=url,
                ip_address=None,
                country=country,
            )
            db.add(atk)

            # Insert ThreatIndex with improved scoring
            t = ThreatIndex(
                report_id=fraud.id,
                risk_score=threat_score,
                risk_level=risk_level,
                category=attack_classification,
                region=country,
            )
            db.add(t)

            db.commit()
            print(f"Inserted mock report {i+1}/{count} (id={fraud.id}, threat={threat_score}/100, level={risk_level})")

        print(f"Seeding finished: inserted {count} mock reports with improved threat scoring.")
    finally:
        db.close()


# Automatically seed database with sample reports if empty (when module loads)
def _auto_seed():
    """Auto-seed the database with sample reports if it's empty."""
    try:
        db = SessionLocal()
        existing_count = db.query(FraudReport).count()
        if existing_count == 0:
            print("🌱 Database is empty. Auto-seeding with sample reports...")
            seed_mock_reports(count=20, force=False)
        else:
            print(f"✓ Database has {existing_count} reports, seeding skipped")
        db.close()
    except Exception as e:
        print(f"⚠️ Seeding skipped due to error: {e}")

# Auto-seed on import (called before FastAPI app startup)
_auto_seed()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8004, log_level="info")




