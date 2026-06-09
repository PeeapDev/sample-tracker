# NSRTMS - National Sample Collection & Real-Time Monitoring System

A comprehensive sample tracking system for Sierra Leone's National Medical Laboratory Directorate, enabling end-to-end visibility from collection to lab analysis.

## Tech Stack

- **Backend:** NestJS (TypeScript) + TypeORM + Supabase (PostgreSQL)
- **Frontend:** Flutter PWA (web + mobile)
- **Auth:** JWT with refresh tokens, RBAC (5 roles)
- **Real-time:** Supabase subscriptions

## Features

- Sample registration with QR code generation
- Role-based access (Admin, Collector, Dispatcher, Hub Officer, Lab Officer)
- Dispatch management with rider PIN verification
- Real-time sample status tracking & timeline
- Dashboard with operational metrics and charts
- Offline-capable PWA with auto-sync
- SMS and push notifications

## Getting Started

### Prerequisites
- Node.js 20+
- Flutter SDK 3.2+
- Supabase project

### Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in your Supabase credentials
npm install
npm run start:dev
```

### Frontend Setup

```bash
cd frontend
flutter pub get
flutter run -d chrome
```

### Seed Database

```bash
cd backend
npm run seed
```

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@nsrtms.gov.sl | password123 |
| Collector | collector@nsrtms.gov.sl | password123 |
| Dispatcher | rider@nsrtms.gov.sl | password123 (PIN: 1234) |
| Hub Officer | hub@nsrtms.gov.sl | password123 |
| Lab Officer | lab@nsrtms.gov.sl | password123 |

## License

Proprietary - Ministry of Health, Sierra Leone
