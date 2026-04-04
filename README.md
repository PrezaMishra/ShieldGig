# ShieldGig – AI Powered Income Protection for Delivery Riders

**“We don’t process claims — we predict loss and pay instantly.”**

---

## What Makes ShieldGig Unique

- Zero-touch insurance for gig workers  
- Multi-signal fraud detection instead of basic GPS validation  
- Fraud ring detection using cross-rider behavioral analysis  
- Trust score system ensuring fairness without penalizing honest riders  
- Designed to remain financially stable during large-scale coordinated attacks  

---

## Problem Statement

Gig delivery workers (Zomato, Swiggy, Zepto, Amazon, etc.) rely on daily earnings to sustain their livelihoods. External disruptions such as heavy rain, extreme heat, pollution, curfews, or road blockages can suddenly reduce their working hours and income.

Currently, there is no real-time financial protection system for these workers. When disruptions occur, riders are forced to bear income loss on their own.

---

## Proposed Solution

ShieldGig is an AI-powered parametric insurance platform that automatically compensates delivery riders when external disruptions impact their earnings.

Instead of manual claims, the system:

- Detects disruptions using real-time external data  
- Predicts expected rider income using AI  
- Calculates income loss  
- Automatically triggers compensation payouts  

This creates a zero-touch, instant claim system designed specifically for gig workers.

---

## Target Persona

Delivery riders working in:

- Zepto  
- Blinkit  
- Swiggy Instamart  
- Amazon Flex  

---

## Key Features

### 1. AI Risk Assessment

| Area            | Risk Level |
|-----------------|-----------|
| Whitefield      | High      |
| Indiranagar     | Medium    |
| Electronic City | Low       |

---

### 2. Dynamic Weekly Premium Model

| Plan     | Weekly Premium | Max Payout |
|----------|---------------|-----------|
| Basic    | ₹10           | ₹500      |
| Standard | ₹20           | ₹1000     |
| Premium  | ₹30           | ₹2000     |

---

### 3. Parametric Disruption Triggers

| Disruption | Trigger Condition |
|------------|------------------|
| Heavy Rain | Rainfall > 25mm  |
| Heatwave   | Temperature > 42°C |
| Pollution  | AQI > 300        |
| Curfew     | Government alert |
| Flooding   | Road closure     |

---

### 4. AI Income Loss Estimator

- Normal income = ₹1500/day  
- Disruption income = ₹500  
- Loss = ₹1000  
- Compensation ≈ ₹800  

---

### 5. Automated Claim Processing

- No manual claim filing  
- Fully automated payout system  
- Instant compensation  

---

## System Workflow

1. Rider selects insurance plan  
2. System monitors disruption data  
3. AI predicts expected earnings  
4. Disruption detected  
5. Income loss calculated  
6. Claim triggered automatically  
7. Compensation credited  

---

## Adversarial Defense & Anti-Spoofing Strategy

### Threat Scenario

A coordinated fraud ring may attempt to exploit the system using GPS spoofing, fake inactivity, and synchronized claims to trigger false payouts. Since ShieldGig operates on a zero-touch automated payout system, it must ensure strong defenses without blocking genuine riders.

---

### 1. The Differentiation: Real vs Spoofed Rider

ShieldGig differentiates between a genuinely stranded rider and a bad actor using multi-signal behavioral intelligence, not just GPS.

#### Genuine Rider Signals

- Gradual drop in deliveries due to real disruption  
- Consistent historical work patterns  
- Nearby riders also affected  
- Weather or traffic APIs confirm disruption  

#### Fraudulent Rider Signals

- Sudden complete inactivity with no prior pattern  
- Normal activity in same area by other riders  
- Repeated claim behavior across events  
- Unrealistic movement patterns such as teleportation or abnormal speeds  

**Core Logic:**  
The system evaluates context, behavior, and environment together rather than relying on a single data point.

---

### 2. The Data: Beyond GPS

To detect fraud rings, ShieldGig analyzes multiple data layers:

- Behavioral data (deliveries/hour, session time, earnings trends)  
- Geo-spatial data (route continuity, speed consistency)  
- Device and network data (device ID, emulator detection, IP similarity)  
- Cross-rider data (clustered inactivity patterns)  
- External data (weather, AQI, traffic, platform-wide activity)  

**Fraud Ring Insight:**  
If multiple riders show identical patterns across behavior, device, and timing, the system flags a coordinated attack.

---

### 3. The UX Balance: Fairness for Honest Riders

ShieldGig ensures that fraud detection does not harm genuine users by using a graded response system.

#### Trust Score System (0–100)

- Historical reliability  
- Behavioral consistency  
- Device authenticity  
- Claim accuracy  

---

#### Decision Workflow

| Trust Score | Action |
|------------|-------|
| 80–100     | Instant payout |
| 50–80      | Partial payout + monitoring |
| <50        | Flag for review |

---

#### Safeguards

- No instant bans or hard rejections  
- Partial payouts for uncertain cases  
- Peer comparison within same zone  
- Continuous re-evaluation  

---

### Defense Philosophy

ShieldGig does not rely on a single signal like GPS. It builds trust using patterns across behavior, devices, and real-world data.

---

## Tech Stack
### Frontend (User Interface)
- Framework: React (v19) powered by Vite  
- Language: TypeScript  
- Styling: Tailwind CSS (with PostCSS and Autoprefixer)  
- Routing: React Router v7  
- HTTP Client: Axios  
- Icons: Lucide React  

### Backend (API Service)
- Framework: FastAPI (Python)  
- ORM (Object-Relational Mapping): SQLAlchemy  
- Database: SQLite (shieldgig.db)  
- Data Validation and Schemas: Pydantic (handled via FastAPI)  

### Project Structure
- Monorepo-style setup  
- Contains separate `/frontend` and `/backend` directories  
- Enables organized and independent development within a single workspace  
## AI Model Design

### Model 1: Income Prediction

Inputs:

- Historical earnings  
- Time of day  
- Location  
- Weather  
- Number of deliveries  

Models:

- Linear Regression  
- Random Forest  

Output:

- Expected income  

---

### Model 2: Risk Prediction

Inputs:

- Rainfall history  
- AQI levels  
- Traffic data  
- Flood zones  

Output:

- Zone risk score  

---

## Impact

- Financial stability for gig workers  
- Instant compensation during disruptions  
- Protection against unpredictable income loss  

---

## Conclusion

ShieldGig is not just an insurance platform — it is a resilient, AI-driven financial protection system built to withstand real-world fraud while ensuring fairness for genuine gig workers.
