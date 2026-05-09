<div align="center">

<h1>🌾 AgriSentinel</h1>

<p><strong>The Intelligence Layer of Agriculture</strong></p>

<p>AI-powered crop intelligence · Blockchain-verified farm data · Real-time AgriScore</p>

<p>
  <a href="https://agrisentinel-nu.vercel.app/">
    <img src="https://img.shields.io/badge/Live%20Demo-agrisentinel--nu.vercel.app-brightgreen?style=flat-square&logo=vercel" alt="Live Demo" />
  </a>
  <img src="https://img.shields.io/badge/Next.js-16.2.2-black?style=flat-square&logo=nextdotjs" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat-square&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Blockchain-Smart%20Contracts-F7931A?style=flat-square" alt="Blockchain" />
</p>


</div>

---

## What is AgriSentinel?

AgriSentinel is an AI and blockchain-powered agriculture intelligence platform. It ingests real-time soil, weather, and crop data through a **Farm Intelligence API**, runs machine learning models to predict yield and detect disease risk, and produces a standardized **AgriScore** — a single, verifiable trust metric for any farm.

Every AgriScore is written to a smart contract, making farm insights tamper-proof and auditable by anyone in the supply chain — from banks and insurers to FMCG buyers and government bodies.

---

## The Problem

Agriculture runs on gut feeling and fragmented data.

- Farmers make critical decisions without real-time, accurate soil or weather intelligence
- Crop diseases are caught too late — after losses have already happened
- There is no standardized, trustworthy way to evaluate farm productivity
- Buyers, insurers, and financial institutions can't verify farm data — so they price in the risk
- Existing agritech tools are siloed and don't talk to each other

---

## The Solution

AgriSentinel brings together four layers in one platform:

| Layer | What it does |
|---|---|
| **Farm Intelligence API** | Pulls real-time weather, soil, and field data |
| **AI/ML Engine** | Predicts yield, flags disease risk, scores crop health |
| **AgriScore** | Single composite metric — 0 to 100 — for any farm |
| **Blockchain Layer** | Stores AgriScore on-chain for immutable verification |

---

## Key Features

### AgriScore System
A composite 0–100 score reflecting crop health, yield potential, and environmental risk. Farmers use it to improve; lenders and buyers use it to trust.

### Crop Health & Yield Prediction
ML models process soil type, moisture levels, weather patterns, and crop variety to predict yield and surface risks before they become losses.

### Disease Detection
Early-stage disease identification from input data allows timely intervention — before a bad patch becomes a failed harvest.

### Farm Intelligence API
A B2B data API delivering live farm insights to enterprises. Government bodies, FMCG companies, and insurers subscribe for real-time AgriScore analytics on the farms they care about.

> **Business model:** Data-as-a-Service with B2B subscriptions and institutional licensing. Estimated early-stage ARR of ₹5–10 Crore, scaling across agritech, finance, and supply chain sectors.

### Blockchain-Verified Records
AgriScore and critical farm outputs are stored on-chain via smart contracts — immutable, transparent, and independently verifiable.

### Real-Time Dashboard
A clean, data-dense interface with actionable insights for farmers and stakeholders. No noise, just decisions.

---

## System Architecture

```
User / Farmer
      │
      ▼
 Next.js Frontend  ◄──── Framer Motion UI, Tailwind CSS v4
      │
      ▼
 Supabase Backend  ◄──── Auth, Database, Real-time subscriptions
      │
      ├──► Farm Intelligence API  ◄── Weather, soil, field data (real-time)
      │
      ├──► Python ML Models  ◄──────── Yield prediction, disease detection
      │
      ├──► AgriScore Engine  ◄──────── Composite scoring logic
      │
      └──► Smart Contracts  ◄──────── On-chain AgriScore storage (blockchain)
```

---

## Tech Stack

**Frontend**
- [Next.js 16](https://nextjs.org/) — App Router, server components
- [React 19](https://react.dev/) — Latest concurrent features
- [Tailwind CSS v4](https://tailwindcss.com/) — Utility-first styling
- [Framer Motion](https://www.framer.com/motion/) — Animations
- [Lenis](https://lenis.darkroom.engineering/) — Smooth scrolling

**Backend & Database**
- [Supabase](https://supabase.com/) — Postgres database, auth, real-time
- Node.js — API routes via Next.js

**AI / ML**
- Python — Crop yield prediction and disease detection models

**Blockchain**
- Solidity smart contracts — On-chain AgriScore storage and verification

**Infrastructure**
- [Vercel](https://vercel.com/) — Deployment and hosting

---

## Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com/) project
- Supabase CLI (for running migrations)

### Installation

```bash
git clone https://github.com/aryansingh0617/AgriSentinel.git
cd AgriSentinel
npm install
```

### Environment Setup

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Run Database Migrations

```bash
supabase db push
```

### Start the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## How It Works

1. The farmer or operator submits farm data via the dashboard
2. The Farm Intelligence API fetches real-time weather and soil context
3. Python ML models analyze the combined data and generate predictions
4. The AgriScore engine computes a composite 0–100 score
5. The score and key outputs are written to a smart contract on-chain
6. The dashboard surfaces insights and recommendations in real time

---

## Impact

- **Farmers** — make data-driven decisions instead of guessing
- **Crop loss reduction** — early disease detection before damage spreads
- **Supply chain trust** — buyers get verifiable, tamper-proof farm data
- **Financial inclusion** — banks and insurers can assess farm risk accurately
- **Sustainability** — data-backed guidance promotes responsible farming practices

---

## Roadmap

- [ ] Satellite imagery integration for large-scale field monitoring
- [ ] IoT sensor pipeline for automated real-time data ingestion
- [ ] Mobile app (React Native) for on-field farmer access
- [ ] Multi-language support for rural accessibility
- [ ] Government and agricultural institution partnerships

---

## Team

Built by **Aryan Singh** at a Hackathon.

---

## License

This project is open source. See [LICENSE](./LICENSE) for details.
