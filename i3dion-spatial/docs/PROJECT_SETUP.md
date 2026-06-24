# I3DION Spatial Project Setup

## Overview

The "I3DION Spatial" project has been refactored into a clear, enterprise-grade architecture. The codebase is separated into a Vite-React `frontend` and an Express-Node `backend`. 

## Installation & Quick Start

A single setup and startup script is provided to simplify development and onboarding.

1. Ensure you have **Python 3.8+**, **Node.js (18+)**, and **PostgreSQL** installed.
2. Open your terminal at the root of the project.
3. Run the following command:

```bash
python start.py
```

This script will automatically:
- Check for `.env` (and create it from `.env.example` if missing).
- Install any missing `node_modules` for both frontend and backend.
- Start the frontend and backend servers concurrently.
- Perform a health check.
- Open the application in your default browser.

## Development

If you prefer to run services individually:

**Frontend**:
```bash
cd frontend
npm install
npm run dev
```

**Backend**:
```bash
cd backend
npm install
npm run dev
```

## Folder Structure

```
i3dion-spatial/
├── frontend/          # React/Vite frontend application
│   ├── src/           # Source code (components, pages, hooks, etc.)
│   └── package.json   # Frontend dependencies
├── backend/           # Node/Express backend API
│   ├── src/           # Source code (routes, controllers, models, etc.)
│   └── package.json   # Backend dependencies
├── database/          # Database migrations, seeds, and schema
├── storage/           # Asset storage (images, videos, documents, models)
├── docs/              # Documentation
├── scripts/           # Python automation scripts
├── logs/              # Log files
├── .env               # Environment variables
├── start.py           # Master startup script
└── README.md          # Project overview
```

## Troubleshooting

- **Servers not starting**: Ensure nothing is currently using ports `5173` (Frontend) or `4000` (Backend).
- **Missing modules**: If you add new dependencies, run `npm install` inside the respective folder (`frontend` or `backend`). 
- **Database errors**: Check your `.env` file to ensure `DATABASE_URL` is pointing to a running instance of PostgreSQL.

## Common Commands

- `python start.py` - Starts everything.
- `python scripts/install.py` - Installs missing `node_modules`.
- `python scripts/check_env.py` - Validates basic environment requirements.
