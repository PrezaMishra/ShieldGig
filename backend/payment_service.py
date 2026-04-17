"""
payment_service.py — Simulated instant payout for ShieldGig
Implements mock Razorpay + UPI payout flow for demo purposes.

In production, replace _razorpay_transfer() with real Razorpay Payout API calls.
The interface is identical — no other code needs to change.

Setup:
  pip install httpx
  Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env for real mode
  Set PAYMENT_MODE=sandbox for simulated mode (default)
"""

import os
import uuid
import time
import random
import asyncio
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

PAYMENT_MODE = os.getenv("PAYMENT_MODE", "sandbox")   # "sandbox" | "live"


class PayoutStatus(str, Enum):
    PENDING    = "PENDING"
    PROCESSING = "PROCESSING"
    SUCCESS    = "SUCCESS"
    FAILED     = "FAILED"
    REVERSED   = "REVERSED"


class PayoutMethod(str, Enum):
    UPI       = "UPI"
    BANK_NEFT = "BANK_NEFT"
    WALLET    = "WALLET"


# ─── In-memory payout ledger (replace with DB table in production) ──────────
_payout_ledger: dict[str, dict] = {}


# ─── Simulated Razorpay payout ────────────────────────────────────────────────
async def _razorpay_transfer(
    amount_inr: float,
    rider_id: str,
    upi_id: Optional[str],
    bank_account: Optional[str],
    ifsc: Optional[str],
) -> dict:
    """
    Sandbox: simulates a Razorpay Payout API call with realistic latency.
    Production: replace body with real httpx call to api.razorpay.com/v1/payouts
    """
    await asyncio.sleep(random.uniform(0.3, 0.9))  # simulate network latency

    # 98% success rate in sandbox (mirrors real-world performance)
    if random.random() < 0.02:
        return {
            "status": "failed",
            "error_code": "BENEFICIARY_BANK_DOWN",
            "error_desc": "Simulated bank downtime",
        }

    payout_id = "pout_" + uuid.uuid4().hex[:16]

    return {
        "id":          payout_id,
        "status":      "processing",
        "amount":      int(amount_inr * 100),  # Razorpay works in paise
        "currency":    "INR",
        "mode":        "UPI" if upi_id else "NEFT",
        "purpose":     "payout",
        "created_at":  int(time.time()),
        "fund_account": {
            "id":       "fa_" + uuid.uuid4().hex[:12],
            "vpa":      upi_id or None,
            "bank_acc": bank_account or None,
        },
        "fees":        100,    # ₹1 fee in paise
        "tax":         18,     # GST in paise
        "source":      "sandbox" if PAYMENT_MODE == "sandbox" else "live",
    }


# ─── UPI instant transfer ─────────────────────────────────────────────────────
async def initiate_upi_payout(
    rider_id: str,
    amount_inr: float,
    upi_id: str,
    claim_id: str,
    trust_score: float,
) -> dict:
    """
    Initiates a UPI payout for a validated claim.
    Returns payout_record with tracking ID and status.
    """
    if amount_inr < 1:
        return {
            "success": False,
            "error": "Minimum payout is ₹1",
            "payout_id": None,
        }

    payout_record = {
        "payout_id":   "sg_" + uuid.uuid4().hex[:12],
        "claim_id":    claim_id,
        "rider_id":    rider_id,
        "amount_inr":  round(amount_inr, 2),
        "method":      PayoutMethod.UPI,
        "upi_id":      upi_id,
        "trust_score": trust_score,
        "status":      PayoutStatus.PROCESSING,
        "initiated_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None,
        "gateway_ref":  None,
        "source":       PAYMENT_MODE,
    }

    _payout_ledger[payout_record["payout_id"]] = payout_record

    try:
        gateway_resp = await _razorpay_transfer(
            amount_inr   = amount_inr,
            rider_id     = rider_id,
            upi_id       = upi_id,
            bank_account = None,
            ifsc         = None,
        )

        if gateway_resp.get("status") in ("processing", "success"):
            payout_record["status"]       = PayoutStatus.SUCCESS
            payout_record["gateway_ref"]  = gateway_resp.get("id")
            payout_record["completed_at"] = datetime.now(timezone.utc).isoformat()
            payout_record["fees_inr"]     = round(gateway_resp.get("fees", 0) / 100, 2)
            return {"success": True, **payout_record}
        else:
            payout_record["status"] = PayoutStatus.FAILED
            payout_record["error"]  = gateway_resp.get("error_desc", "Payment failed")
            return {"success": False, **payout_record}

    except Exception as exc:
        payout_record["status"] = PayoutStatus.FAILED
        payout_record["error"]  = str(exc)
        return {"success": False, **payout_record}


# ─── Full claim → payout flow ─────────────────────────────────────────────────
async def process_claim_payout(
    rider_id: str,
    claim_id: str,
    loss_assessment: dict,   # from ml_models.assess_income_loss()
    fraud_result: dict,      # from fraud_detection.evaluate_claim_fraud_risk()
    upi_id: Optional[str],
    bank_account: Optional[str] = None,
    ifsc: Optional[str] = None,
) -> dict:
    """
    End-to-end: take ML loss assessment + fraud result and trigger payout.
    Trust score drives the payout amount and routing.
    """
    trust_score  = fraud_result.get("trust_score", 0)
    decision     = fraud_result.get("decision", "FLAG_FOR_REVIEW")
    payout_ratio = fraud_result.get("payout_ratio", 0.0)
    base_payout  = loss_assessment.get("capped_payout_inr", 0)
    final_amount = round(base_payout * payout_ratio, 2)

    if decision == "FLAG_FOR_REVIEW" or final_amount < 1:
        return {
            "success":        False,
            "decision":       decision,
            "trust_score":    trust_score,
            "payout_amount":  0,
            "message":        "Claim flagged for manual review. Rider will be notified within 24 hours.",
            "claim_id":       claim_id,
            "rider_id":       rider_id,
        }

    if not upi_id:
        return {
            "success":   False,
            "decision":  decision,
            "message":   "No UPI ID on file — please update payment details.",
            "claim_id":  claim_id,
        }

    payout_result = await initiate_upi_payout(
        rider_id    = rider_id,
        amount_inr  = final_amount,
        upi_id      = upi_id,
        claim_id    = claim_id,
        trust_score = trust_score,
    )

    return {
        **payout_result,
        "decision":         decision,
        "trust_score":      trust_score,
        "loss_inr":         loss_assessment.get("income_loss_inr", 0),
        "base_payout_inr":  base_payout,
        "payout_ratio":     payout_ratio,
        "final_payout_inr": final_amount,
        "message":          (
            f"₹{final_amount:.0f} sent to {upi_id} via UPI"
            if payout_result["success"]
            else "Payment failed. Will retry automatically."
        ),
    }


# ─── Payout status check ─────────────────────────────────────────────────────
def get_payout_status(payout_id: str) -> Optional[dict]:
    return _payout_ledger.get(payout_id)


# ─── CLI demo ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import json

    async def demo():
        result = await process_claim_payout(
            rider_id       = "rider_001",
            claim_id       = "claim_abc123",
            loss_assessment = {
                "income_loss_inr":  900,
                "capped_payout_inr": 720,
                "expected_income_inr": 1500,
                "actual_income_inr": 600,
            },
            fraud_result    = {
                "trust_score": 88,
                "decision": "INSTANT_PAYOUT",
                "payout_ratio": 1.0,
            },
            upi_id          = "rider001@upi",
        )
        print(json.dumps(result, indent=2))

    asyncio.run(demo())
