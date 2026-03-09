import sqlite3
import os
import json
import random
from datetime import datetime, timedelta
try:
    import requests
except ImportError:
    requests = None

# Get API key from environment - no default fallback for security
API_KEY = os.getenv("AI_API_KEY", None)
DB_PATH = "fraud_data.db"

FRAUD_TYPES = [
    "Scam", "Phishing", "Fraudulent Link",
    "Fake Call", "Digital Deception", "OTP Fraud",
    "Investment Scam", "Account Takeover", "Malicious Link",
    "Credential Phishing", "Vishing", "Social Engineering"
]

PLATFORMS = [
    "WhatsApp", "SMS", "Email", "Website",
    "Instagram", "Facebook", "Telegram", "Phone Call",
    "Mobile App", "Other"
]

REGIONS = [
    "India", "United States", "United Kingdom",
    "Australia", "Canada", "Singapore", "UAE", "Malaysia"
]

def get_db_columns():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(threat_index)")
        columns = {row[1]: row[2] for row in cursor.fetchall()}
        conn.close()
        return columns
    except Exception:
        return {}

def generate_ai_data():
    if not requests:
        return None
    
    try:
        url = "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent"
        
        prompt = f"""Generate realistic cyber fraud trend data in JSON format.
Return ONLY valid JSON, no markdown, no code blocks, no extra text.

Required fields:
- total_incidents: integer (15-450)
- high_risk_count: integer (0 to total_incidents)
- most_common_fraud: string (choose from: {', '.join(FRAUD_TYPES)})
- most_targeted_platform: string (choose from: {', '.join(PLATFORMS)})
- threat_level: string (choose from: ["LOW", "MEDIUM", "HIGH", "CRITICAL"])
- affected_regions_count: integer (1-8)

Logic:
- If high_risk_count > total_incidents * 0.6, threat_level = CRITICAL
- Else if high_risk_count > total_incidents * 0.4, threat_level = HIGH
- Else if high_risk_count > total_incidents * 0.15, threat_level = MEDIUM
- Else threat_level = LOW

Generate unique, realistic data representing a cyber fraud threat scenario. Return valid JSON only."""
        
        payload = {
            "contents": [{"parts": [{"text": prompt}]}]
        }
        
        response = requests.post(
            f"{url}?key={API_KEY}",
            json=payload,
            timeout=10
        )
        
        if response.status_code == 200:
            content = response.json()
            if "candidates" in content and len(content["candidates"]) > 0:
                text_content = content["candidates"][0]["content"]["parts"][0]["text"]
                text_content = text_content.strip()
                if text_content.startswith("```"):
                    text_content = text_content.split("```")[1]
                    if text_content.startswith("json"):
                        text_content = text_content[4:]
                try:
                    data = json.loads(text_content)
                    return data
                except json.JSONDecodeError:
                    return None
        return None
    except Exception:
        return None

def generate_fallback_data():
    total = random.randint(15, 450)
    high_risk = random.randint(0, total)
    
    ratio = high_risk / max(1, total)
    
    if ratio > 0.6:
        threat_level = "CRITICAL"
    elif ratio > 0.4:
        threat_level = "HIGH"
    elif ratio > 0.15:
        threat_level = "MEDIUM"
    else:
        threat_level = "LOW"
    
    return {
        "total_incidents": total,
        "high_risk_count": high_risk,
        "most_common_fraud": random.choice(FRAUD_TYPES),
        "most_targeted_platform": random.choice(PLATFORMS),
        "threat_level": threat_level,
        "affected_regions_count": random.randint(1, 8)
    }

def calculate_risk_score_from_data(data):
    if data.get("total_incidents", 0) == 0:
        return 50
    ratio = data.get("high_risk_count", 0) / max(1, data.get("total_incidents", 1))
    return max(0, min(100, int(ratio * 100)))

def validate_risk_level(threat_level):
    valid_levels = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    return threat_level if threat_level in valid_levels else "MEDIUM"

def insert_threat_index_record(data):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        columns = get_db_columns()
        if not columns:
            conn.close()
            return False
        
        insert_fields = []
        insert_values = []
        
        now = datetime.utcnow().isoformat()
        
        if "risk_score" in columns:
            risk_score = calculate_risk_score_from_data(data)
            insert_fields.append("risk_score")
            insert_values.append(risk_score)
        
        if "risk_level" in columns:
            risk_level = validate_risk_level(data.get("threat_level", "MEDIUM"))
            insert_fields.append("risk_level")
            insert_values.append(risk_level)
        
        if "impact_score" in columns:
            impact = max(0, min(40, int(data.get("high_risk_count", 0) / max(1, data.get("total_incidents", 1)) * 40)))
            insert_fields.append("impact_score")
            insert_values.append(impact)
        
        if "confidence_score" in columns:
            confidence = random.randint(15, 30)
            insert_fields.append("confidence_score")
            insert_values.append(confidence)
        
        if "spread_score" in columns:
            regions = data.get("affected_regions_count", 1)
            spread = max(0, min(30, (regions * 3) + random.randint(0, 5)))
            insert_fields.append("spread_score")
            insert_values.append(spread)
        
        if "category" in columns:
            insert_fields.append("category")
            insert_values.append(data.get("most_common_fraud", "Other"))
        
        if "region" in columns:
            insert_fields.append("region")
            insert_values.append(random.choice(REGIONS))
        
        if "reason_summary" in columns:
            summary = f"Trend: {data.get('total_incidents', 0)} incidents ({data.get('high_risk_count', 0)} high-risk). Primary fraud type: {data.get('most_common_fraud', 'Unknown')}. Top platform: {data.get('most_targeted_platform', 'Unknown')}. Affected regions: {data.get('affected_regions_count', 1)}."
            insert_fields.append("reason_summary")
            insert_values.append(summary)
        
        if "factors" in columns:
            factors = f"total={data.get('total_incidents', 0)};high_risk={data.get('high_risk_count', 0)};fraud_type={data.get('most_common_fraud', 'N/A')};platform={data.get('most_targeted_platform', 'N/A')};regions={data.get('affected_regions_count', 1)};generated={datetime.utcnow().strftime('%Y-%m-%d')}"
            insert_fields.append("factors")
            insert_values.append(factors)
        
        if "created_at" in columns:
            insert_fields.append("created_at")
            insert_values.append(now)
        
        if insert_fields:
            placeholders = ",".join(["?" for _ in insert_fields])
            insert_sql = f"INSERT INTO threat_index ({','.join(insert_fields)}) VALUES ({placeholders})"
            cursor.execute(insert_sql, insert_values)
            conn.commit()
            conn.close()
            return True
        else:
            conn.close()
            return False
    except Exception as e:
        return False

def main():
    data = generate_ai_data()
    if data is None:
        data = generate_fallback_data()
    
    if insert_threat_index_record(data):
        print(f"Threat Index Updated | Level: {data.get('threat_level', 'UNKNOWN')} | Incidents: {data.get('total_incidents', 0)} | High-Risk: {data.get('high_risk_count', 0)} | Primary Fraud: {data.get('most_common_fraud', 'N/A')} | Top Platform: {data.get('most_targeted_platform', 'N/A')}")
    else:
        print("Failed to update threat index")

if __name__ == "__main__":
    main()
