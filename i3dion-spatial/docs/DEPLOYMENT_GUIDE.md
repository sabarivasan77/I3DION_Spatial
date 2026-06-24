# I3DION Spatial Deployment Guide

## Prerequisites
- Node.js 22+
- Docker and Docker Compose
- PostgreSQL 16+
- MinIO (or AWS S3)

## Infrastructure Setup
1. Use `docker-compose.yml` to spin up the database and storage:
   ```bash
   docker compose up -d
   ```
2. The initial database schema will be automatically migrated via `backend/src/db/schema.sql` on the first API boot.

## Backend Deployment
1. Set the following environment variables:
   - `PORT=4000`
   - `NODE_ENV=production`
   - `APP_URL=https://your-frontend-domain.com`
   - `DATABASE_URL=postgres://user:pass@host:5432/db`
   - `JWT_SECRET=your_super_secret_key`
2. Start the API:
   ```bash
   cd backend
   npm install
   npm start
   ```

## Frontend Deployment
1. Build the React application:
   ```bash
   cd frontend
   npm install
   npm run build
   ```
2. Serve the `frontend/dist` directory using a web server like Nginx, or deploy to Vercel/Netlify. Ensure to set environment variable: `VITE_API_URL=https://api.yourdomain.com/api`
