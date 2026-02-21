# NEET JEE Global - Test Series Platform

## Overview

This is a full-stack web application for NEET and JEE exam preparation. It provides a test series platform where students can take timed practice tests with image-based questions, view detailed results with analytics charts, and interact through a chat feature. An admin panel allows creating tests and uploading question images. The platform targets medical (NEET) and engineering (JEE) entrance exam aspirants.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript, built using Vite
- **Routing**: Wouter (lightweight client-side router)
- **State Management**: TanStack React Query for server state; React hooks for local state
- **UI Components**: Shadcn/ui (new-york style) built on Radix UI primitives with Tailwind CSS
- **Animations**: Framer Motion for page transitions and UI animations
- **Charts**: Recharts for result analysis (pie charts, bar charts)
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support), custom fonts (Outfit, Plus Jakarta Sans)
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend
- **Runtime**: Node.js with Express
- **Language**: TypeScript, executed via TSX
- **API Pattern**: RESTful endpoints under `/api/` prefix
- **File Uploads**: Multer for handling image uploads, stored in local `uploads/` directory
- **Build**: Custom build script using esbuild for server + Vite for client, outputs to `dist/`

### Data Layer - Dual Storage Architecture
The app has a **hybrid data architecture** that's important to understand:

1. **PostgreSQL via Drizzle ORM** (server-side): The `shared/schema.ts` defines tables for users, tests, questions, attempts, and chat_messages. The server uses Drizzle with `node-postgres` for database operations. Schema is pushed via `drizzle-kit push`.

2. **Firebase (client-side)**: The frontend hooks (`use-auth.ts`, `use-tests.ts`, `use-attempts.ts`) directly use Firebase Auth (Google sign-in), Firestore (for tests, attempts, users), and Firebase Storage (for question images). The Firebase config falls back to mock values if env vars are missing.

**Key architectural note**: There's a tension between these two data layers. The server has PostgreSQL schema and storage implementation, but the client hooks primarily talk to Firebase directly. This means the Express API routes are minimal (just test listing and file upload) while most CRUD happens client-to-Firebase. When making changes, be aware of which data layer is being used for each feature.

### Database Schema (PostgreSQL/Drizzle)
- **users**: id, firebaseUid, name, email, role (default: "student")
- **tests**: id, title, section (NEET/JEE), subsection, duration (minutes)
- **questions**: id, testId, questionNumber, imageUrl, correctOption (1-4)
- **attempts**: id, userId, testId, score, correctCount, wrongCount, unattemptedCount, answers (JSON), timeSpent
- **chat_messages**: id, testId, userId, content, likes, createdAt

### Pages / Routes
- `/` - Home page with NEET and JEE section cards
- `/section/:type` - Section page showing subsections (PYQs, PW, Allen, Akash, Other) and test listings
- `/test/:id` - Test-taking interface with timer, question navigation, answer selection, mark-for-review
- `/result/:id` - Result page with score breakdown, pie/bar charts, accuracy stats
- `/admin` - Admin panel for creating tests and adding questions with image uploads

### Dev vs Production
- **Development**: Vite dev server with HMR, proxied through Express
- **Production**: Vite builds static files to `dist/public`, Express serves them; server bundled with esbuild to `dist/index.cjs`

## External Dependencies

### Firebase (Primary client-side backend)
- **Firebase Auth**: Google sign-in popup authentication
- **Cloud Firestore**: Document database for tests, attempts, users, chat messages
- **Firebase Storage**: Image hosting for question images
- **Required env vars**: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`
- Falls back to mock config if env vars are missing (allows UI preview without Firebase)

### PostgreSQL
- **Required env var**: `DATABASE_URL`
- Used via Drizzle ORM with `node-postgres` driver
- Schema management via `drizzle-kit push` (no migration files needed)

### Key NPM Packages
- `recharts` - Chart visualizations for test results
- `react-countdown` - Timer component for test interface
- `framer-motion` - Animations
- `wouter` - Client-side routing
- `multer` - Server-side file upload handling
- `zod` + `drizzle-zod` - Schema validation
- `connect-pg-simple` - PostgreSQL session store (available but session auth not fully implemented)