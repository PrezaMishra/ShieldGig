from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
import datetime

from database import Base

class Worker(Base):
    __tablename__ = "workers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    phone = Column(String, unique=True, index=True)
    platform = Column(String) # e.g., 'zepto', 'blinkit'
    location = Column(String) # e.g., 'Koramangala Dark Store 1'
    daily_income = Column(Float, default=900.0)  # Worker's avg daily earnings in INR
    trust_score = Column(Float, default=85.0)  # Trust score 0-100 for fraud detection
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    policies = relationship("Policy", back_populates="worker")


class Policy(Base):
    __tablename__ = "policies"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id"))
    plan_name = Column(String) # e.g., 'Standard Shield'
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    premium_amount = Column(Float)
    coverage_daily = Column(Float)
    is_active = Column(Boolean, default=True)

    worker = relationship("Worker", back_populates="policies")
    claims = relationship("Claim", back_populates="policy")


class Claim(Base):
    __tablename__ = "claims"

    id = Column(Integer, primary_key=True, index=True)
    policy_id = Column(Integer, ForeignKey("policies.id"))
    event_type = Column(String) # e.g., 'Heavy Rain', 'Curfew'
    trigger_date = Column(DateTime, default=datetime.datetime.utcnow)
    payout_amount = Column(Float)
    status = Column(String, default="auto-approved") # 'auto-approved', 'paid'
    
    policy = relationship("Policy", back_populates="claims")
