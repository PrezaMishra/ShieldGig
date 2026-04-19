# ShieldGig – AI-Powered Income Protection for Delivery Riders

## Overview
ShieldGig is an AI-powered parametric insurance platform designed to protect gig delivery workers from income loss caused by external disruptions such as heavy rain, extreme heat, pollution, curfews, and road blockages.

Instead of manual claim filing, ShieldGig automatically detects disruptions, estimates income loss using AI, and triggers compensation payouts—creating a **zero-touch claims system**.

---

## Problem Statement
Delivery riders working for platforms like Zomato, Swiggy, Zepto, and Amazon rely on daily earnings.

External factors such as:
- Heavy rainfall
- Heatwaves
- Pollution spikes
- Curfews or strikes
- Flooding and road closures  

can significantly reduce their working hours and income.

Currently, there is **no financial protection system**, forcing riders to absorb these losses.

---

## Solution
ShieldGig introduces a **parametric insurance model** where payouts are triggered automatically based on predefined conditions.

The system:
1. Monitors real-time external data (weather, AQI, etc.)
2. Predicts expected income using AI
3. Detects disruptions
4. Calculates income loss
5. Automatically credits compensation

No claims, no paperwork, no delays.

---

## Key Features

### 1. AI-Based Risk Assessment
Analyzes historical disruption data to assign risk levels to delivery zones.

| Area            | Risk Level |
|-----------------|-----------|
| Whitefield      | High      |
| Indiranagar     | Medium    |
| Electronic City | Low       |

Used to dynamically adjust insurance premiums.

---

### 2. Dynamic Weekly Premium Plans

| Plan     | Weekly Premium | Max Payout |
|----------|----------------|------------|
| Basic    | ₹10            | ₹500       |
| Standard | ₹20            | ₹1000      |
| Premium  | ₹30            | ₹2000      |

Designed to align with gig workers' weekly earning cycles.

---

### 3. Parametric Disruption Triggers

Automatic payouts are triggered when thresholds are exceeded:

| Disruption  | Trigger Condition      |
|-------------|------------------------|
| Heavy Rain  | Rainfall > 25mm        |
| Heatwave    | Temperature > 42°C     |
| Pollution   | AQI > 300              |
| Flooding    | Road closures detected |
| Curfew      | Government alerts      |

---

### 4. AI Income Loss Estimation

Predicts expected earnings and calculates loss:

Example:
- Normal income: ₹1500/day  
- Disrupted income: ₹500/day  
- Loss: ₹1000  
- Compensation: ~₹800  

---

### 5. Fraud Detection System

Prevents misuse through:
- GPS location validation  
- Delivery activity verification  
- Duplicate claim detection  

---

## System Workflow

1. Rider registers and selects a plan  
2. System continuously monitors external APIs  
3. AI predicts expected income  
4. Disruption is detected  
5. Income loss is calculated  
6. Claim is automatically triggered  
7. Compensation is credited  

---

## System Architecture

---

## AI Models

### 1. Income Prediction Model

**Purpose:** Estimate expected daily income

**Inputs:**
- Historical earnings  
- Time of day  
- Delivery zone  
- Weather conditions  
- Number of deliveries  

**Models Used:**
- Linear Regression  
- Random Forest  

**Output:**
- Predicted daily income  

---

### 2. Risk Prediction Model

**Purpose:** Determine disruption risk for zones

**Inputs:**
- Rainfall history  
- AQI levels  
- Flood-prone zones  
- Traffic data  

**Output:**
- Risk score (used for premium calculation)


---

## Innovation

- Zero-touch insurance claims  
- AI-driven income estimation  
- Parametric trigger-based payouts  
- Fraud-resistant system design  
- Tailored specifically for gig workers  

---

## Impact

ShieldGig aims to:
- Provide financial stability to delivery riders  
- Reduce income uncertainty  
- Enable trust in gig-based work ecosystems  
- Scale to millions of gig workers across India  

---

## Future Improvements

- Real-time model updates using live data  
- Integration with delivery platforms (Swiggy/Zomato APIs)  
- Mobile app with rider dashboard  
- Advanced fraud detection using behavioral analytics  
- Expansion to other gig sectors  

---

## Hackathon Context

Developed as part of **Guidewire DEVTrails University Hackathon 2026 (in partnership with EY)**.

The project progressed till the **SOAR phase**, focusing on scalability, system design, and real-world feasibility.

---

## License

This project is for educational and hackathon purposes.
