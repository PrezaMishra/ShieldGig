# Phase 3 Changes — What We Fixed

## Pitch Deck

> **[Pitch Deck →](https://drive.google.com/your-link-here)** *(replace with your Google Drive link)*

---

## How to Run (Phase 3)

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

**New `requirements.txt` additions for Phase 3:**
```
scikit-learn>=1.4.0
pandas>=2.0.0
numpy>=1.26.0
joblib>=1.3.0
httpx>=0.27.0
python-dotenv>=1.0.0
```

**`.env` file (create in `/backend`):**
```
OPENWEATHER_API_KEY=your_free_key_from_openweathermap.org
PAYMENT_MODE=sandbox
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Phase 3 New Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `GET`  | `/api/v2/disruption/{zone}` | **Live** weather + AQI from OpenWeatherMap |
| `GET`  | `/api/v2/risk/{zone}` | ML zone risk (GradientBoosting model) |
| `POST` | `/api/v2/claims/submit` | Full claim → ML → fraud → payout pipeline |
| `GET`  | `/api/v2/dashboard/admin` | Insurer analytics dashboard |
| `GET`  | `/api/v2/dashboard/worker/{id}` | Rider personal dashboard |

---

## What Changed vs Phase 2

| Critique (Phase 2 feedback) | Phase 3 Fix |
|-----------------------------|-------------|
| "AI claims misleading — rule-based logic" | Replaced with **scikit-learn** RandomForest (income) + GradientBoosting (risk) |
| "No external API integrations" | **OpenWeatherMap** + **Open-Meteo AQI** live calls with 5-min cache |
| "All risk based on hardcoded data" | Zone risk is now ML-classified; weather from live APIs |
| "No payment integration" | Simulated **Razorpay payout** with realistic sandbox flow |
| "No fraud detection" | **5-signal fraud engine**: GPS spoofing, weather validation, peer comparison, claim history, device fingerprint |
