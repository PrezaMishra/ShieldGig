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

@app.post("/api/admin/trigger-weather-event")
def trigger_event(trigger: schemas.WeatherTrigger, db: Session = Depends(get_db)):
    """
    Parametric Automation Trigger
    Simulates weather API pushing an event -> triggering instant payouts
    """
    print(f"TRIGGER INITIATED: {trigger.event_type} in {trigger.location}")
    
    # 1. Find all active workers in the impacted location
    impacted_workers = db.query(models.Worker).filter(models.Worker.location == trigger.location).all()
    if not impacted_workers:
        return {"status": "success", "message": "No active workers in this zone.", "payouts": 0}
        
    worker_ids = [w.id for w in impacted_workers]
    
    # 2. Find their active policies
    active_policies = db.query(models.Policy).filter(
        models.Policy.worker_id.in_(worker_ids),
        models.Policy.is_active == True
    ).all()
    
    payout_count = 0
    total_payout_amount = 0.0
    
    # 3. Automatically generate a claim (Zero-Touch)
    for policy in active_policies:
        claim = models.Claim(
            policy_id=policy.id,
            event_type=trigger.event_type,
            payout_amount=policy.coverage_daily,
            status="paid"
        )
        db.add(claim)
        payout_count += 1
        total_payout_amount += policy.coverage_daily
        
    db.commit()
    
    return {
        "status": "success", 
        "message": f"Parametric trigger processed. Identified {payout_count} affected policies.",
        "total_claims_generated": payout_count,
        "total_payouts_inr": total_payout_amount
    }
