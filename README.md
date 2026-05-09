<div align="center">

<h1>🌾 AgriSentinel</h1>

<p><strong>AI-Powered Agriculture Intelligence Platform</strong></p>

<p>Real-time crop health prediction · Yield forecasting · Blockchain-verified farm scoring</p>

<p>
  <a href="https://agrisentinel-nu.vercel.app/">
    <img src="https://img.shields.io/badge/Live%20Demo-agrisentinel--nu.vercel.app-brightgreen?style=flat-square&logo=vercel" alt="Live Demo" />
  </a>
  <img src="https://img.shields.io/badge/Next.js-16.2.2-black?style=flat-square&logo=nextdotjs" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Python-ML%20Models-3776AB?style=flat-square&logo=python" alt="Python" />
  <img src="https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat-square&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Blockchain-Smart%20Contracts-F7931A?style=flat-square" alt="Blockchain" />
  <img src="https://img.shields.io/badge/Status-Active-success?style=flat-square" alt="Status" />
</p>

</div>

---

## Overview

AgriSentinel is an end-to-end AI/ML platform that brings data-driven intelligence to agriculture. It processes real-time soil conditions, weather patterns, and crop data through machine learning models to predict yield, detect disease risk early, and generate a standardized **AgriScore** — a single, interpretable trust metric for any farm.

AgriScore outputs are stored on-chain via smart contracts, making farm intelligence tamper-proof and auditable across the supply chain — from farmers and buyers to financial institutions and insurers.

> **This project is actively being developed and improved.**

---

## The Problem

Modern agriculture suffers from a fundamental data gap:

- Farmers make high-stakes decisions without real-time, accurate soil or weather intelligence
- Crop diseases are identified too late — after losses have already compounded
- There is no standardized, verifiable way to evaluate farm productivity or reliability
- Banks, insurers, and FMCG buyers cannot trust unverified farm data, so they price in the uncertainty
- Existing agritech tools are siloed, fragmented, and not built for the actual farmer

---

## AI/ML Core

This is the technical heart of AgriSentinel. The intelligence pipeline runs in three stages:

### 1. Data Ingestion
The Farm Intelligence API aggregates real-time inputs:
- Soil parameters — pH, moisture, nitrogen/phosphorus/potassium levels
- Weather data — temperature, rainfall, humidity, wind
- Crop metadata — variety, growth stage, historical yield records
- Satellite and field sensor readings *(in progress)*

### 2. Prediction Models

| Model | Task | Approach |
|---|---|---|
| Yield Predictor | Estimate harvest output per acre | Regression on soil + weather features |
| Disease Risk Classifier | Early-stage disease flag | Classification on crop + environmental signals |
| AgriScore Engine | Composite 0–100 farm score | Weighted multi-factor scoring model |

All models are built in Python and served via API routes integrated into the Next.js backend.

### 3. Blockchain Verification
AgriScore outputs are written to Solidity smart contracts — creating an immutable, on-chain record of each farm's intelligence snapshot. This makes the AI output trustworthy, not just accurate.

---

## AgriScore

AgriScore is the platform's core output — a single number between 0 and 100 that reflects:

- **Crop health** — current disease risk and plant condition
- **Yield potential** — predicted harvest performance vs. historical average
- **Sustainability** — soil health trends and environmental impact signals
- **Reliability** — data completeness and consistency of farm records

Farmers use it to identify where to improve. Lenders and buyers use it to make trusted decisions without on-site visits.

---

## System Architecture

```
User / Farmer
      │
      ▼
 Next.js 16 Frontend  ◄──── React 19, Tailwind CSS v4, Framer Motion
      │
      ▼
 Supabase Backend  ◄──────── Auth, Postgres DB, real-time subscriptions
      │
      ├──► Farm Intelligence API  ◄── Real-time weather, soil & field data
      │
      ├──► Python ML Pipeline  ◄───── Yield prediction + disease detection
      │         │
      │         └──► AgriScore Engine  ◄── Composite scoring logic
      │
      └──► Smart Contracts  ◄──────── On-chain AgriScore storage (Solidity)
```

---

## Tech Stack

**Frontend**
- [Next.js 16](https://nextjs.org/) with App Router and server components
- [React 19](https://react.dev/) with concurrent rendering
- [Tailwind CSS v4](https://tailwindcss.com/) for utility-first styling
- [Framer Motion](https://www.framer.com/motion/) for animations
- [Lenis](https://lenis.darkroom.engineering/) for smooth scroll

**Backend & Database**
- [Supabase](https://supabase.com/) — Postgres, auth, real-time
- Next.js API routes for server-side logic

**AI / ML**
- Python — core ML models for yield prediction and disease classification
- Scikit-learn / custom scoring logic for AgriScore computation

**Blockchain**
- Solidity smart contracts — on-chain AgriScore storage and tamper-proof verification

**Infrastructure**
- [Vercel](https://vercel.com/) — deployment and hosting

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+
- A [Supabase](https://supabase.com/) project

### Installation

```bash
git clone https://github.com/aryansingh0617/AgriSentinel.git
cd AgriSentinel
npm install
```

### Environment Setup

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Run Database Migrations

```bash
supabase db push
```

### Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
AgriSentinel/
├── src/                    # Next.js app source
│   ├── app/                # App Router pages and layouts
│   ├── components/         # Reusable UI components
│   └── lib/                # Supabase client, utilities
├── contracts/              # Solidity smart contracts
├── supabase/
│   └── migrations/         # Database schema migrations
└── public/                 # Static assets
```

---

## Roadmap

- [x] Farm Intelligence API integration
- [x] Yield prediction ML model
- [x] Disease risk classification
- [x] AgriScore engine
- [x] Blockchain-verified score storage
- [x] Real-time dashboard
- [ ] Satellite imagery integration for large-scale field monitoring
- [ ] IoT sensor pipeline for automated real-time data ingestion
- [ ] Model accuracy benchmarking and evaluation report
- [ ] Mobile app (React Native) for on-field farmer access
- [ ] Multi-language support for rural accessibility

---

## Why This Matters

India has 140 million farming households. Most of them make decisions based on experience and guesswork — not data. AgriSentinel is an attempt to change that with tools that are genuinely useful on the ground, not just impressive in a pitch deck.

The blockchain layer exists not for novelty but for a real reason: farm data needs to be trusted by parties who weren't there. An AI prediction means nothing to a bank or insurer if the underlying data can be manipulated. On-chain AgriScore solves that.

---

## About

Built and maintained by **Aryan Singh** — CS student with a focus on applied AI/ML and full-stack development.

- GitHub: [@aryansingh0617](https://github.com/aryansingh0617)
- Live: [agrisentinel-nu.vercel.app](https://agrisentinel-nu.vercel.app)

---

## License

This project is open source. See [LICENSE](./LICENSE) for details.
