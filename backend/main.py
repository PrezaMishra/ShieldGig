from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import datetime
import random

import models
import schemas
from database import SessionLocal, engine, get_db

# Create DB tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="ShieldGig AI-Powered Insurance API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Since it's a hackathon demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/register", response_model=schemas.WorkerOut)
def register_worker(worker: schemas.WorkerCreate, db: Session = Depends(get_db)):
    db_worker = db.query(models.Worker).filter(models.Worker.phone == worker.phone).first()
    if db_worker:
        return db_worker # Return existing instead of error for easy testing
    
    new_worker = models.Worker(
        name=worker.name,
        phone=worker.phone,
        platform=worker.platform,
        location=worker.location,
        daily_income=worker.daily_income
    )
    db.add(new_worker)
    db.commit()
    db.refresh(new_worker)
    return new_worker

@app.get("/api/workers/{phone}", response_model=schemas.WorkerOut)
def get_worker(phone: str, db: Session = Depends(get_db)):
    db_worker = db.query(models.Worker).filter(models.Worker.phone == phone).first()
    if not db_worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    return db_worker

@app.patch("/api/workers/{worker_id}/income", response_model=schemas.WorkerOut)
def update_worker_income(worker_id: int, daily_income: float, db: Session = Depends(get_db)):
    """Allow a worker to update their declared daily income at any time."""
    db_worker = db.query(models.Worker).filter(models.Worker.id == worker_id).first()
    if not db_worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    if daily_income <= 0:
        raise HTTPException(status_code=400, detail="Income must be greater than 0")
    db_worker.daily_income = daily_income
    
    # Synchronize the active policy if one exists
    active_policy = db.query(models.Policy).filter(
        models.Policy.worker_id == worker_id, 
        models.Policy.is_active == True
    ).first()
    
    if active_policy:
        active_policy.coverage_daily = daily_income
        base_rate = 0.125
        rate = base_rate * 1.15 if "Koramangala" in db_worker.location else base_rate * 0.95 if "Indiranagar" in db_worker.location else base_rate
        active_policy.premium_amount = round(daily_income * rate, 2)

    db.commit()
    db.refresh(db_worker)
    return db_worker

@app.get("/api/premium/calculate")
def calculate_premium(location: str, daily_income: float = 900.0):
    """
    Simulated AI Engine: Dynamic Premium Calculation
    Adjusts the weekly premium based on hyper-local risk factors
    and the worker's actual declared daily income.
    """
    # Premium is ~12.5% of the daily income per week, adjusted by zone risk
    base_rate = 0.125  # 12.5% of daily income = weekly premium

    if "Koramangala" in location:
        # High rain-logging historical zone: +15% surcharge
        rate = base_rate * 1.15
    elif "Indiranagar" in location:
        # Lower risk zone: -5% discount
        rate = base_rate * 0.95
    else:
        rate = base_rate

    premium = round(daily_income * rate, 2)

    return {
        "location": location,
        "weekly_premium_inr": premium,
        "max_daily_payout_inr": daily_income,  # Cover equals declared income
        "plan_name": "Standard Shield",
        "rationale": f"AI Risk Model: ₹{daily_income}/day income × {round(rate*100, 1)}% zone rate for {location}."
    }

@app.post("/api/policies/create", response_model=schemas.PolicyOut)
def create_policy(policy: schemas.PolicyCreate, db: Session = Depends(get_db)):
    # Deactivate existing active policies
    db.query(models.Policy).filter(
        models.Policy.worker_id == policy.worker_id,
        models.Policy.is_active == True
    ).update({"is_active": False})
    
    start_time = datetime.datetime.utcnow()
    end_time = start_time + datetime.timedelta(days=7) # Weekly policy
    
    new_policy = models.Policy(
        worker_id=policy.worker_id,
        plan_name=policy.plan_name,
        start_date=start_time,
        end_date=end_time,
        premium_amount=policy.premium_amount,
        coverage_daily=policy.coverage_daily,
        is_active=True
    )
    db.add(new_policy)
    db.commit()
    db.refresh(new_policy)
    return new_policy

@app.get("/api/policies/active/{worker_id}", response_model=schemas.PolicyOut)
def get_active_policy(worker_id: int, db: Session = Depends(get_db)):
    policy = db.query(models.Policy).filter(
        models.Policy.worker_id == worker_id, 
        models.Policy.is_active == True
    ).first()
    if not policy:
        raise HTTPException(status_code=404, detail="No active policy found")
    return policy

@app.get("/api/claims/{worker_id}", response_model=list[schemas.ClaimOut])
def get_claims(worker_id: int, db: Session = Depends(get_db)):
    policies = db.query(models.Policy).filter(models.Policy.worker_id == worker_id).all()
    policy_ids = [p.id for p in policies]
    
    claims = db.query(models.Claim).filter(models.Claim.policy_id.in_(policy_ids)).all()
    return claims


# ── AI Risk Assessment ──────────────────────────────────────────────────────────
@app.get("/api/risk-assessment/{location}")
def get_risk_assessment(location: str):
    """
    AI Risk Model: Hyper-local zone risk assessment.
    Uses historical disruption data, weather patterns, and infrastructure quality
    to produce a zone risk score.
    """
    risk_profiles = {
        "Koramangala": {
            "risk_level": "High", "risk_score": 82,
            "factors": [
                {"name": "Flood History", "severity": "High", "score": 90, "detail": "12 flood events in last monsoon season"},
                {"name": "Road Quality", "severity": "Medium", "score": 65, "detail": "Waterlogging on 4 major delivery routes"},
                {"name": "AQI Exposure", "severity": "Medium", "score": 60, "detail": "Average AQI 180 during winter months"},
                {"name": "Heatwave Risk", "severity": "Low", "score": 35, "detail": "Below city average for extreme heat days"},
            ],
            "active_triggers": ["Heavy Rain Warning", "Waterlogging Alert"],
            "premium_multiplier": 1.15,
        },
        "Indiranagar": {
            "risk_level": "Medium", "risk_score": 55,
            "factors": [
                {"name": "Flood History", "severity": "Low", "score": 30, "detail": "2 minor incidents in last monsoon"},
                {"name": "Road Quality", "severity": "Low", "score": 25, "detail": "Well-maintained arterial roads"},
                {"name": "AQI Exposure", "severity": "Medium", "score": 58, "detail": "Average AQI 145, occasional spikes"},
                {"name": "Heatwave Risk", "severity": "Medium", "score": 50, "detail": "Moderate heat island effect"},
            ],
            "active_triggers": [],
            "premium_multiplier": 0.95,
        },
        "HSR Layout": {
            "risk_level": "Medium", "risk_score": 60,
            "factors": [
                {"name": "Flood History", "severity": "Medium", "score": 55, "detail": "5 waterlogging events recorded"},
                {"name": "Road Quality", "severity": "Medium", "score": 50, "detail": "Mixed quality, construction zones"},
                {"name": "AQI Exposure", "severity": "Low", "score": 40, "detail": "Generally good air quality"},
                {"name": "Heatwave Risk", "severity": "Medium", "score": 45, "detail": "Open area, moderate exposure"},
            ],
            "active_triggers": ["Construction Zone Advisory"],
            "premium_multiplier": 1.05,
        },
    }

    # Fuzzy match: check if any known zone name is in the location string
    matched_zone = None
    for zone_key in risk_profiles:
        if zone_key.lower() in location.lower():
            matched_zone = zone_key
            break

    if matched_zone:
        profile = risk_profiles[matched_zone]
    else:
        # Default profile for unknown zones
        profile = {
            "risk_level": "Low", "risk_score": 35,
            "factors": [
                {"name": "Flood History", "severity": "Low", "score": 20, "detail": "No significant events recorded"},
                {"name": "Road Quality", "severity": "Low", "score": 25, "detail": "Standard infrastructure"},
                {"name": "AQI Exposure", "severity": "Low", "score": 30, "detail": "Within safe limits"},
                {"name": "Heatwave Risk", "severity": "Low", "score": 28, "detail": "Normal temperature range"},
            ],
            "active_triggers": [],
            "premium_multiplier": 1.0,
        }

    return {
        "location": location,
        **profile,
        "data_sources": ["IMD Weather", "CPCB AQI", "Google Maps Traffic", "IoT Sensors"],
        "last_updated": datetime.datetime.utcnow().isoformat(),
    }


# ── Trust Score System ──────────────────────────────────────────────────────────
@app.get("/api/trust-score/{worker_id}")
def get_trust_score(worker_id: int, db: Session = Depends(get_db)):
    """
    Multi-signal trust score breakdown.
    Evaluates behavioral consistency, device authenticity, claim accuracy,
    and cross-rider analysis to produce a composite trust score.
    """
    worker = db.query(models.Worker).filter(models.Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    # Simulated multi-signal breakdown based on worker's trust_score
    base = worker.trust_score
    random.seed(worker_id)  # deterministic per worker

    behavioral = min(100, max(0, base + random.uniform(-5, 10)))
    device_auth = min(100, max(0, base + random.uniform(-3, 8)))
    claim_accuracy = min(100, max(0, base + random.uniform(-8, 12)))
    peer_comparison = min(100, max(0, base + random.uniform(-6, 6)))

    # Determine decision tier
    if base >= 80:
        tier = "instant_payout"
        tier_label = "Instant Payout"
        tier_description = "High trust — all claims are auto-approved and paid instantly."
    elif base >= 50:
        tier = "partial_review"
        tier_label = "Partial Payout + Monitoring"
        tier_description = "Moderate trust — partial payout issued, behavior monitored for next cycle."
    else:
        tier = "flagged_review"
        tier_label = "Flagged for Review"
        tier_description = "Low trust — claim queued for manual review before payout."

    return {
        "worker_id": worker_id,
        "composite_score": round(base, 1),
        "tier": tier,
        "tier_label": tier_label,
        "tier_description": tier_description,
        "breakdown": {
            "behavioral_consistency": round(behavioral, 1),
            "device_authenticity": round(device_auth, 1),
            "claim_accuracy": round(claim_accuracy, 1),
            "peer_comparison": round(peer_comparison, 1),
        },
        "signals_analyzed": [
            "Delivery frequency patterns",
            "GPS route consistency",
            "Device ID & emulator detection",
            "Cross-rider behavioral clustering",
            "Historical claim vs actual disruption correlation",
        ],
        "last_evaluated": datetime.datetime.utcnow().isoformat(),
    }


# ── Fraud Detection Intelligence ────────────────────────────────────────────────
@app.get("/api/fraud-detection/summary")
def fraud_detection_summary():
    """
    System-wide fraud ring detection summary.
    Provides an overview of the adversarial defense posture.
    """
    return {
        "system_status": "Operational",
        "total_riders_monitored": 10247,
        "fraud_rings_detected": 3,
        "fraud_rings_neutralized": 3,
        "false_positive_rate": "0.8%",
        "genuine_riders_affected": 0,
        "detection_layers": [
            {"name": "Behavioral Analysis", "status": "Active", "description": "Delivery frequency, session duration, earnings pattern matching"},
            {"name": "Geo-Spatial Verification", "status": "Active", "description": "Route continuity, speed consistency, GPS spoof detection"},
            {"name": "Device Fingerprinting", "status": "Active", "description": "Device ID tracking, emulator detection, IP clustering"},
            {"name": "Cross-Rider Clustering", "status": "Active", "description": "Detecting synchronized inactivity and coordinated claims"},
            {"name": "External Data Correlation", "status": "Active", "description": "Weather API cross-check, platform activity verification"},
        ],
        "recent_incidents": [
            {"date": "2026-03-28", "type": "Coordinated GPS Spoofing", "riders_involved": 7, "status": "Neutralized", "savings": 14000},
            {"date": "2026-03-15", "type": "Fake Inactivity Ring", "riders_involved": 4, "status": "Neutralized", "savings": 8000},
            {"date": "2026-02-22", "type": "Device Emulation Cluster", "riders_involved": 12, "status": "Neutralized", "savings": 24000},
        ],
        "safeguards": [
            "No instant bans — graded response only",
            "Partial payouts for uncertain cases",
            "Continuous re-evaluation after every cycle",
            "Peer comparison within same zone",
        ],
    }


# ── Parametric Automation Trigger ────────────────────────────────────────────────
@app.post("/api/admin/trigger-weather-event")
def trigger_event(trigger: schemas.WeatherTrigger, db: Session = Depends(get_db)):
    """
    Parametric Automation Trigger with Trust Score integration.
    Simulates weather API pushing an event -> triggering payouts adjusted by trust score.
    """
    print(f"TRIGGER INITIATED: {trigger.event_type} in {trigger.location}")
    
    # 1. Find all active workers in the impacted location
    impacted_workers = db.query(models.Worker).filter(models.Worker.location == trigger.location).all()
    if not impacted_workers:
        return {"status": "success", "message": "No active workers in this zone.", "payouts": 0}
        
    worker_ids = [w.id for w in impacted_workers]
    worker_map = {w.id: w for w in impacted_workers}
    
    # 2. Find their active policies
    active_policies = db.query(models.Policy).filter(
        models.Policy.worker_id.in_(worker_ids),
        models.Policy.is_active == True
    ).all()
    
    payout_count = 0
    total_payout_amount = 0.0
    payout_details = []
    
    # 3. Trust-score-adjusted payouts (Zero-Touch)
    for policy in active_policies:
        worker = worker_map.get(policy.worker_id)
        trust = worker.trust_score if worker else 85.0

        # Trust-based payout multiplier
        if trust >= 80:
            multiplier = 1.0
            status = "paid"
        elif trust >= 50:
            multiplier = 0.6
            status = "partial-paid"
        else:
            multiplier = 0.0
            status = "flagged-review"

        payout = round(policy.coverage_daily * multiplier, 2)

        claim = models.Claim(
            policy_id=policy.id,
            event_type=trigger.event_type,
            payout_amount=payout,
            status=status
        )
        db.add(claim)
        payout_count += 1
        total_payout_amount += payout
        payout_details.append({
            "worker_id": policy.worker_id,
            "trust_score": trust,
            "payout": payout,
            "status": status,
        })
        
    db.commit()
    
    return {
        "status": "success", 
        "message": f"Parametric trigger processed. Identified {payout_count} affected policies.",
        "total_claims_generated": payout_count,
        "total_payouts_inr": total_payout_amount,
        "trust_score_breakdown": payout_details,
    }
