# NSRTMS — National Sample Collection & Real-Time Monitoring System
### Presentation Brief

---

## 1. What this software is (one-sentence pitch)

> **NSRTMS gives the National Medical Laboratory Directorate end-to-end, real-time
> visibility of every medical sample — from the moment it is collected at a clinic,
> through dispatch and transit hubs, all the way to lab analysis and result — on one
> connected platform.**

Today, in most settings, this journey is tracked on **paper forms and phone calls**.
Samples get lost, delays are invisible until it's too late, and nobody has a single
source of truth. NSRTMS replaces that with a digital chain of custody.

---

## 2. What it actually does for the organization

Think of it as **package tracking (like DHL), but for medical samples** — built
specifically for a national health system.

| Capability | What it means for the organization |
|---|---|
| **Sample registration + QR code** | Every sample gets a unique QR label at collection. No more illegible handwriting or duplicate IDs. |
| **Chain-of-custody tracking** | Records each hand-off through 6 stages: **Collected → Hub Received → In Transit → Lab Received → Analysis Queue → Completed**. Accountability at every step. |
| **Dispatch + rider PIN verification** | Riders confirm pickup/drop-off with a PIN — proving who held the sample and when. |
| **Real-time dashboard + charts** | Managers see live counts, bottlenecks, turnaround times, and volume by facility. |
| **Role-based access (5 roles)** | Admin, Collector, Dispatcher (Rider), Hub Officer, Lab Officer — each sees only what their job needs. |
| **Offline-first mobile app** | Works in rural clinics with no internet; auto-syncs when connectivity returns. |
| **SMS + push notifications** | Alerts when a sample is delayed, received, or a result is ready. |
| **Web admin portal** | Headquarters staff manage users, roles, facilities, and review everything from a browser. |

**The organizational value, in plain terms:**
- 🩺 **Faster diagnoses** — fewer lost/delayed samples means patients get results sooner.
- 📊 **Accountability** — you know exactly who had each sample and where delays happen.
- 📈 **Data for decisions** — leadership gets real metrics on lab capacity and turnaround.
- 🏛️ **National scalability** — built to cover the whole country, facility by facility.

---

## 3. How it's built (architecture)

The system is **three connected applications** sharing one secure database:

```
   ┌─────────────────────┐     ┌─────────────────────┐
   │  📱 Field App        │     │  💻 Admin Portal     │
   │  (Flutter PWA)       │     │  (React web)         │
   │  Collectors, Riders, │     │  HQ managers,        │
   │  Hub & Lab officers  │     │  administrators      │
   └──────────┬──────────┘     └──────────┬──────────┘
              │                            │
              └────────────┬───────────────┘
                           │
                ┌──────────▼──────────┐
                │  ⚙️  Backend API      │
                │  (NestJS / Node)     │
                │  Auth, business rules │
                └──────────┬──────────┘
                           │
                ┌──────────▼──────────┐
                │  🗄️  Database         │
                │  (Supabase /         │
                │   PostgreSQL)        │
                └─────────────────────┘
```

- **Field App (Flutter):** runs on phones *and* in a browser; works offline.
- **Admin Portal (React):** the management cockpit at headquarters.
- **Backend (NestJS):** the brain — enforces security, roles, and the sample workflow.
- **Database (Supabase/PostgreSQL):** the single secure store of all data, cloud-hosted.

> **Talking point:** "We chose modern, widely-supported, open technologies — so the
> system is maintainable long-term and not locked to one vendor."

---

## 4. The sample journey (great visual for a slide)

```
 Collected ──▶ Hub Received ──▶ In Transit ──▶ Lab Received ──▶ Analysis Queue ──▶ Completed
  (Collector)    (Hub Officer)    (Rider)        (Lab Officer)     (Lab Officer)     (Lab Officer)
```

Each transition is timestamped and attributed to a person — that is the digital
chain of custody.

---

## 5. Build phases & timeline

> **A working prototype already exists** (registration, QR codes, the 5 roles,
> dispatch, dashboard, offline sync, and the admin portal are all functional).
> The plan below takes it from prototype to a **production-grade national system**.

### Recommended team (4–5 people)

| Role | Responsibility |
|---|---|
| **Project Lead / You** | Coordination, stakeholder liaison, requirements |
| **Backend Engineer** | API, database, security, integrations |
| **Mobile/Frontend Engineer** | Flutter field app + React admin portal |
| **QA / Tester** | Testing, field validation |
| **(Part-time) DevOps / Field Trainer** | Deployment + training health workers |

### Phased timeline — ~5–6 months to national-ready

| Phase | What happens | Duration |
|---|---|---|
| **Phase 0 — Discovery & Sign-off** | Confirm requirements with NMLD, map real facility workflows, finalize roles & data needs | **2 weeks** |
| **Phase 1 — Core platform hardening** | Solidify backend, database, authentication & security | **3–4 weeks** |
| **Phase 2 — Field app + QR/offline** | Polish collector/rider/hub/lab flows, QR scanning, offline sync reliability | **4–5 weeks** |
| **Phase 3 — Admin portal + dashboards** | Complete user/role management, live dashboards, reporting | **3–4 weeks** |
| **Phase 4 — Notifications & integrations** | SMS gateway, push notifications, external systems | **2–3 weeks** |
| **Phase 5 — Testing & QA** | End-to-end testing, security review, fix field-test issues | **3 weeks** |
| **Phase 6 — Pilot deployment** | Roll out to a few facilities, train staff, gather feedback | **3–4 weeks** |
| **Phase 7 — National rollout & support** | Scale to all facilities, monitoring, ongoing support | **Ongoing** |

**Bottom line:**
- ⏱️ **Working pilot:** ~3 months
- ⏱️ **Production-ready, multi-facility:** ~5–6 months
- ⏱️ **Then:** continuous improvement & support

> ⚠️ **Presenter's caveat:** timelines assume a small dedicated team, stable
> requirements, and timely access to facilities for testing. The biggest
> *non-technical* risks are **field training, connectivity, and SMS-gateway
> procurement** — not the software itself.

---

## 6. Suggested slide order

1. **The problem** — paper-based sample tracking loses time and samples
2. **The solution** — NSRTMS, one-line pitch
3. **What it does** — the capabilities table
4. **Who uses it** — the 5 roles
5. **The sample journey** — Collected → … → Completed
6. **How it's built** — the 3-app architecture diagram
7. **Where we are today** — prototype already works (shows momentum)
8. **Build phases & timeline** — the phase table
9. **The team** — roles you need
10. **Risks & asks** — budget, facility access, SMS gateway
