from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class WorkerCreate(BaseModel):
    name: str
    phone: str
    platform: str
    location: str
    daily_income: float = 900.0  # Average daily earnings in INR

class WorkerOut(BaseModel):
    id: int
    name: str
    phone: str
    platform: str
    location: str
    daily_income: float
    trust_score: float
    created_at: datetime
    class Config:
        from_attributes = True

class PolicyCreate(BaseModel):
    worker_id: int
    plan_name: str
    premium_amount: float
    coverage_daily: float

class PolicyOut(BaseModel):
    id: int
    worker_id: int
    plan_name: str
    start_date: datetime
    end_date: datetime
    premium_amount: float
    coverage_daily: float
    is_active: bool
    class Config:
        from_attributes = True

class ClaimOut(BaseModel):
    id: int
    policy_id: int
    event_type: str
    trigger_date: datetime
    payout_amount: float
    status: str
    class Config:
        from_attributes = True

class WeatherTrigger(BaseModel):
    location: str
    event_type: str
