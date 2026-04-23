# Vite

**Every dose recorded. Every record trusted. Every grant verified.**

A universal, offline first vaccination record system with an optional conditional funding layer built on XION.

---

## Overview

Vite is a digital health infrastructure protocol designed for real world deployment in Africa and emerging markets.

It solves two critical failures in public health systems:

* unreliable and non-portable vaccination records
* inefficient, slow, and fraud prone conditional health grant distribution

The system works as a **standalone vaccination record platform** and becomes more powerful when integrated with conditional funding programs.

> Built on XION | Aligned with Blockchain for Good Alliance | Global Impact Accelerator 2026 

---

## Core Idea

Vite separates infrastructure into two layers:

### 1. Universal Vaccination Record System

* Offline first data capture
* Syncs to blockchain when connectivity is available
* Patient records accessible via:

  * QR code
  * phone number (SMS access)
* No smartphone or app required for patients

### 2. Optional Conditional Funding Layer

* NGOs or governments define health milestones
* Smart contracts automatically release funds when milestones are met
* Vaccination records act as **cryptographic proof**
* No manual verification required

---

## Problem

### 1. Broken Vaccination Records

* Paper cards are lost, destroyed, or falsified
* Millions of children start but do not complete vaccination schedules
* Example: Nigeria shows ~25% dropout between DTP1 and DTP3 

### 2. Records Do Not Travel

* High migration rates across Africa
* Clinic systems are siloed
* Leads to:

  * revaccination
  * wasted resources
  * incorrect clinical decisions

### 3. Conditional Grants Fail at Scale

* Manual verification
* 3–6 month delays
* 15–40% fraud rates
* High administrative costs

---

## Solution

### Offline First Health Recording

* Health workers record vaccinations without internet
* Data stored locally and synced later
* Each record includes:

  * vaccine type
  * dose number
  * lot number
  * timestamp
  * GPS data

### Portable Patient Identity

* Identity linked to phone number
* Persistent across all clinics
* Accessible anywhere

### Automated Grant Disbursement

* Smart contracts validate milestones
* Funds released instantly upon verification
* Eliminates intermediaries

---

## System Flow

1. **Clinic Registration**
2. **Health Worker Credentialing**
3. **Patient Registration (phone-based identity)**
4. **Offline Vaccination Recording**
5. **Batch Sync to XION**
6. **Cross-Clinic Record Access**
7. **Automated Milestone Validation**
8. **Instant Grant Payment**
9. **Real-Time Donor Reporting**

---

## Architecture

### Actors

* **Patient / Parent** → accesses records via QR or SMS
* **Health Worker** → records vaccinations offline
* **Clinic** → manages staff and vaccine stock
* **NGO / Government** → defines programs and funds escrow
* **Program Manager** → handles exceptions

---

## XION Integration

Vite relies on XION for specific capabilities:

| Feature               | Usage                         | Without It                       |
| --------------------- | ----------------------------- | -------------------------------- |
| Account Abstraction   | Phone/email onboarding        | Users cannot access system       |
| Gas Abstraction       | Zero-cost transactions        | System becomes unusable at scale |
| Persistent Identity   | Cross-clinic records          | Data becomes siloed              |
| Smart Contract Escrow | Automated payments            | Manual verification returns      |
| Permissioned Issuance | Trusted health worker records | Fraud increases                  |
| Batch Transactions    | Offline sync efficiency       | Costs and failures increase      |

---

## Benefits

### For Patients

* Permanent, portable health records
* No app or wallet required
* Faster grant payments (same day to 7 days)

### For Health Workers

* Reduced administrative workload
* No manual reconciliation
* Accurate patient history instantly available

### For NGOs & Governments

* Real-time reporting
* 2–3% admin cost vs 15–25%
* Fraud reduced below 5% target

---

## Fraud Prevention

Automated checks after every sync:

* stock reconciliation
* volume anomaly detection
* geographic inconsistency detection

Combined with periodic field audits.


## MVP Status

### Prototype Complete

* XION smart contracts deployed
* Offline-first PWA
* QR-based patient access
* Donor dashboard
* SMS notifications

### In Progress

* Mobile money integration (M-Pesa, OPay)
* Fraud detection engine
* Native mobile app
* biometric identity layer

---

## Roadmap

### Phase 1 – Prototype (Completed)

* Offline recording
* Blockchain sync
* Simulated grant flow

### Phase 2 – Integration

* Payment APIs
* fraud detection
* mobile app

### Phase 3 – Deployment

* regulatory compliance
* pilot rollout
* NGO partnerships

---

## Use Cases Beyond Vaccination

* antenatal care incentives
* school enrollment verification
* nutrition programs
* agricultural funding milestones
* education grants

---

## Why This Matters

Millions of children miss vaccinations not because vaccines do not exist, but because systems fail to track and support them.

Millions of dollars in health funding fail to reach recipients due to inefficiency and fraud.

Vite replaces both broken systems with a single infrastructure layer that is:

* verifiable
* portable
* automated
* accessible

---

## Tech Stack (High-Level)

* Next.js (frontend)
* Offline-first storage (local DB / IndexedDB / SQLite)
* XION blockchain (Testnet-2)
* Smart contracts:

  * IssuerRegistry
  * VaccinationRecord
  * MilestoneChecker
  * GrantEscrow
* SMS integration (Twilio)
* QR-based identity access

## License

MIT

---

**Built on XION. Designed for real-world impact.**
