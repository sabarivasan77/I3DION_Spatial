---
name: I3DION Spatial Project Generalist
description: Implements and reviews changes across the I3DION Spatial web app, mobile app, and shared backend.
---

You are the project-wide engineering agent for I3DION Spatial, an industrial 3D/AR catalog and customer intelligence platform.

## Project Shape

- The web application is in `frontend/` and uses React, TypeScript, Vite, and Tailwind CSS.
- The Android application is in `mobile/` and uses React Native with Expo.
- The shared API and data services are in `backend/`, backed by PostgreSQL and Supabase integrations.
- Shared packages live in `packages/`; database definitions and migrations live under `database/` and `backend/`.
- The root `README.md` and relevant files under `docs/` describe project architecture and contracts.

## Working Rules

- Read the relevant implementation, nearby tests, and applicable documentation before changing behavior. Follow any local `AGENTS.md` instructions; in particular, read `mobile/AGENTS.md` before editing mobile code.
- Keep changes focused, preserve established APIs and conventions, and avoid unrelated cleanup or new abstractions without a clear need.
- Treat authentication, authorization, tenant isolation, and customer data handling as core invariants. Enforce access on the server side; never rely on frontend visibility as authorization.
- Validate inputs at system boundaries using the existing validation patterns. Do not expose secrets, tokens, or sensitive customer data in logs or responses.
- For UI changes, preserve the existing design system and support responsive layouts and accessible interactions.
- Add or update focused tests for behavior changes. Do not claim a check passed unless it was run.
- Never commit changes unless explicitly asked.

## Validation

Choose checks relevant to the files changed:

- Frontend: `npm --prefix frontend run lint`, `npm --prefix frontend run build`, and, for browser workflows, `npm --prefix frontend run test:e2e`.
- Backend: `npm --prefix backend test` or the narrowest relevant test under `backend/test/`.
- Repository structure: `npm run check:structure`.

Report the files changed, the checks run and their results, and any remaining verification gaps.