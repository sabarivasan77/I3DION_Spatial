# I3DION Spatial - Project Audit (V1 MVP)

## 1. Working Features
- **Frontend Architecture**: React + Vite setup is structurally sound.
- **Routing**: `react-router-dom` is configured with public and protected layouts.
- **Database Schema**: The `schema.sql` file contains a robust, well-defined PostgreSQL schema covering all V1 MVP entities (users, companies, products, files, catalogs, leads, analytics).
- **Basic APIs**: CRUD operations for products, catalogs, leads, and analytics are present in `backend/src/routes/resources.js`.
- **UI Framework**: Tailwind CSS and basic UI components (Cards, Buttons, Tables) are present.
- **File Upload Base**: MinIO storage layer and `/uploads` API route are partially implemented.
- **QR Code Base**: Basic QR generation logic is present in the backend.

## 2. Broken Features
- **Authentication Flow**: The frontend currently relies on mock data and a dummy `offline-dev-token`. The real JWT integration and session handling need to be wired up tightly between frontend and backend.
- **Product Image/File Uploads**: The frontend product creation form doesn't seamlessly integrate with the actual `/uploads` endpoint for media and 3D models.
- **Database Connection**: Hardcoded offline fallbacks hide database connection failures. Need strict enforcement of DB connectivity.

## 3. Missing Features
- **File Management**: Missing APIs to delete, update, and manage previously uploaded files.
- **Complete Public Product Experience**: A dedicated customer-facing public page that dynamically loads product specs, 3D models, and lead capture forms.
- **Forgot/Reset Password**: Backend logic for email/token generation and password reset needs finalizing.
- **Advanced 3D Model System**: Handling GLB/GLTF loading states, error boundaries, thumbnail generation, and orbit controls.
- **Catalog Builder UI**: Full drag-and-drop or selection interface for assigning products to catalogs.

## 4. Duplicate/Unused Code
- There may be unused placeholder pages, mock data (`services/mockData.ts`), and temporary UI components that need to be purged.
- Unused experimental AR features (like hotspots and animations logic) need to be removed as they are slated for V2.

## 5. Security Risks
- **Authentication**: Ensure bcrypt is used for password hashing and JWTs are securely signed and verified. 
- **Upload Validation**: File uploads need strict MIME-type validation to prevent malicious uploads.
- **Role Permissions**: API routes must strictly enforce role-based access control (Admin, Manager, Sales, Viewer).

## 6. Performance Risks
- **3D Asset Loading**: Large GLB/GLTF files could block the main thread. Needs optimized loading strategies (compression/lazy loading).
- **Frontend Bundle Size**: The monolithic `Pages.tsx` file is very large (over 1200 lines). We should consider code-splitting routes using `React.lazy()` or at least separating page components into distinct files.
