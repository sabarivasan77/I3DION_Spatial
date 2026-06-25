# I3DION Spatial API Documentation

## Authentication (`/api/auth`)
- `POST /signup`: Create a new user and company.
- `POST /login`: Authenticate with email and password.
- `POST /logout`: Revoke active session token.
- `POST /forgot-password`: Generate password reset link.
- `POST /reset-password`: Reset password using token.

## Products (`/api/products`)
- `GET /`: List all products for the authenticated company.
- `GET /:id`: Retrieve details of a specific product.
- `POST /`: Create a new product.
- `PUT /:id`: Update an existing product.
- `DELETE /:id`: Delete a product and its associations.

## Catalogs (`/api/catalogs`)
- `GET /`: List all catalogs.
- `POST /`: Create a new catalog.
- `PUT /:id`: Update an existing catalog.
- `DELETE /:id`: Delete a catalog.

## Files (`/api/uploads`)
- `POST /`: Upload a file to MinIO storage. Returns a URL.
- `DELETE /:id`: Delete a file from MinIO storage.

## Leads & Analytics (`/api/leads`, `/api/analytics`)
- `GET /leads`: List all leads captured from QR or catalog forms.
- `POST /leads`: Create a new lead.
- `POST /analytics/events`: Track an interaction (e.g. `ar_view`).
- `GET /analytics/summary`: Get summarized counts of events and leads.

## QR Engine (`/api/qr`)
- `POST /qr/:type/:id`: Generate a tracking QR code for a `product` or `catalog`.
