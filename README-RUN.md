# I3DION Spatial - Run Guide

This is the shortest path to run the project locally.

## What You Need

- Node.js 18 or newer
- PostgreSQL running locally
- A terminal with `npm`

## Environment

The backend reads environment values from the project root `.env` automatically.
You can also add `backend/.env` if you want to override anything locally.

Create or update `.env` at the project root with:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/i3dion_spatial
JWT_SECRET=your_super_secret_jwt_key_here
PORT=4000
```

Optional settings:

```env
APP_URL=http://localhost:5173
API_URL=http://localhost:4000
UPLOAD_DIR=uploads
```

## Install Dependencies

Run these once from the project root:

```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

## Start the Project

### Option 1: Start both apps together

```bash
npm run dev
```

This runs:

- Backend on `http://localhost:4000`
- Frontend on `http://127.0.0.1:5173`

### Option 2: Start them separately

Backend:

```bash
npm run dev:backend
```

Frontend:

```bash
npm run dev:frontend
```

### Option 3: Use the Python launcher

```bash
python start.py
```

### Option 4: Use Docker

Start PostgreSQL and the backend together:

```bash
docker compose up --build
```

This exposes:

- Backend API on `http://localhost:4000`
- PostgreSQL on `localhost:5432`

If you only want the database and API services in the background:

```bash
docker compose up -d --build
```

To stop them:

```bash
docker compose down
```

## Production Build

Build the frontend with:

```bash
npm run build
```

## Main Flow

- Log in as an admin
- Create a product
- Upload the thumbnail, images, and GLB model
- QR is generated automatically
- Scan the QR on mobile
- Open the public product page
- Tap `View In AR`

## Storage

Uploaded files are saved under:

- `uploads/images/`
- `uploads/models/`
- `uploads/qr/`
- `uploads/documents/`

## If The Backend Does Not Start

- Check that PostgreSQL is running
- Check that the root `.env` has the right `DATABASE_URL`
- Confirm the database name in `DATABASE_URL`
- Re-run the backend after fixing the connection
- If using Docker, run `docker compose logs -f backend` to see the API startup output

If `http://localhost:4000/api/health` returns `503`, the backend is reachable but PostgreSQL is still offline or misconfigured.

## Useful URLs

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4000`
- Health check: `http://localhost:4000/api/health`
