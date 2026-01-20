# Finança Familiar

## Overview
A family finance SaaS application (desktop-first) for managing monthly income and expenses. Built with React frontend and Express/PostgreSQL backend.

## Project Structure
- `client/` - React frontend (Vite)
- `server/` - Express backend API
- `shared/` - Shared types and database schema (Drizzle ORM)
- `docs/` - Design documentation and specifications

## Tech Stack
- **Frontend**: React 18, Wouter (routing), Vite
- **Backend**: Express.js, Node.js 20
- **Database**: PostgreSQL with Drizzle ORM
- **Build**: TypeScript, Vite

## Development
Run `npm run dev` to start both frontend and backend concurrently:
- Frontend: http://localhost:5000
- Backend API: http://localhost:3001/api

## Database
PostgreSQL database managed via Drizzle ORM. Run `npm run db:push` to sync schema changes.

## API Endpoints
See `docs/API_CONTRACT.md` for full API documentation.

Main endpoints:
- `GET /api/months/{month}/summary` - Monthly summary
- `GET /api/transactions` - List transactions with filters
- `POST /api/transactions` - Create transaction
- `GET /api/categories` - List categories
- `GET /api/payment-methods` - List payment methods
- `GET /api/years/{year}/summary` - Annual summary

## Recent Changes
- 2026-01-19: Initial project setup from documentation-only repository
  - Created full-stack application structure
  - Implemented React frontend with all main views
  - Built Express API following API contract
  - Set up PostgreSQL database with Drizzle ORM
  - Added error handling and proper date filtering
- 2026-01-20: Added new transaction modal on the dashboard
  - Created the launch modal form with category and payment method loading
  - Wired dashboard button, submission flow, and data refresh after save
  - Documented the modal behavior in the UX blueprint
