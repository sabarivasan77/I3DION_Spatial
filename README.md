# I3DION Spatial - Enterprise Intelligence Platform

I3DION Spatial is an advanced Industrial AR Catalog, Sales Visualization, and Customer Intelligence Platform. It seamlessly blends spatial visualization (AR), AI-powered analytics, and Zero Trust security to turn technical products into sales-ready catalogs and continuously generate intelligent business leads.

---

## 🏗 Core Architecture: One Platform, Two Interfaces

I3DION Spatial operates under a **Unified Ecosystem** model:
*   **Web Application (Primary):** The administrative backbone. Used for managing catalogs, security, users, AI insights, and support flows.
*   **Android Mobile Application:** The mobile-first AR interface built directly on top of the shared backend via React Native (Expo) and styled with NativeWind.
*   **Shared Backend Engine:** Both interfaces share a unified PostgreSQL database, authentication service, and AI processing engine for a true single-source-of-truth.

---

## 🔒 Security Architecture & Access Control

The platform enforces robust security and authentication controls designed for multi-tenant B2B isolation:

*   **Explicit Authentication:** Every request is authenticated using signed JWT tokens and verified against active user records.
*   **Centralized Identity Service:** Built-in Google Single Sign-On (SSO) alongside secure Email/Password.
*   **Multi-Factor Authentication (MFA):** TOTP-based authentication for administrative and high-risk account management.
*   **Rate Limiting & Security Headers:** Integrated express-rate-limit and Helmet security protection.
*   **Security Dashboard:** Comprehensive admin dashboard to monitor live Active Sessions, view granular Audit Logs (tracking IP, device, and action), and revoke sessions globally.
*   **Role-Based Access Control (RBAC):** Strict multi-tenant organization isolation and explicit permission enforcement via dedicated auth middleware.
*   **Mobile Secure Storage:** Secure native persistence of JWTs inside Android's encrypted Keychain using `expo-secure-store`.

---

## 🧠 AI Recommendation & Intelligence Engine

The platform is powered by a Self-Learning AI Engine that continuously observes user behavior to surface predictive insights.

*   **Behavioral Tracking:** Every search query, catalog view, AR launch, and filter click is tracked as an actionable business event.
*   **Semantic Search Engine:** Matches natural language queries directly to product features using Vector embeddings and NLP.
*   **Intelligent Recommendations:** "Customers also viewed" and "Similar Specifications" sections are generated dynamically based on historical AR engagement data.
*   **Dynamic Lead Scoring:** The system builds automatic customer profiles by tracking engagement times, resulting in a quantified intent-to-buy score.
*   **Automated Data Tagging:** Product descriptions and 3D models are automatically enriched with relevant AI tags.

---

## 📊 Customer Intelligence & Smart Lead Generation

Moving beyond simple forms, the platform tracks continuous engagement to map the buyer journey.

*   **Implicit Intent Tracking:** Every touchpoint in the product catalog and 3D viewer contributes to building an intent profile.
*   **Smart Analytics Dashboard:** Real-time visibility into overall scan volume, geographical engagement hotspots, AR session duration, and feature heatmaps.
*   **Automated Lead Pipeline:** The system generates rich lead cards displaying the buyer's organization, specific products viewed, and their overall lead score, drastically improving sales efficiency.
*   **Conversion Metrics:** Analyze exactly which products drive the most physical AR launches compared to generic web views.

---

## 💬 AI Support Center & Intelligent Chatbot

A centralized hub for automated customer assistance and enterprise support routing.

*   **Conversational AI Assistant:** A Microsoft Copilot-style AI Chatbot capable of understanding natural language inquiries and returning answers sourced from the internal knowledge base.
*   **Automated Ticket Creation:** Seamlessly escalates unresolved queries into support tickets, capturing the conversational context.
*   **Support Dashboard:** Provides administrators with a unified inbox to manage active support tickets, view recent chatbot conversations, and monitor support resolution speeds.
*   **Self-Healing Knowledge Base:** As agents resolve edge-case tickets, the AI integrates the solution into its learning model to automatically resolve future similar queries.

---

## 🛠 Tech Stack

*   **Frontend (Web):** React, TypeScript, Vite, Tailwind CSS, Recharts, Lucide Icons, `@react-oauth/google`.
*   **Mobile (Android):** React Native, Expo, NativeWind, Expo Secure Store, Expo Camera.
*   **Backend:** Node.js, Express, PostgreSQL, Zod (Schema Validation), OTP (MFA).
*   **Security:** JSON Web Tokens (JWT), bcrypt, Helmet, Rate-Limiting.

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   PostgreSQL
*   A Google Cloud Project (for OAuth Client ID)

### Setup Instructions

1.  **Clone the repository.**
2.  **Backend Setup:**
    *   Navigate to `/backend`
    *   Create a `.env` file referencing `.env.example`
    *   Run `npm install` and `npm start`
    *   *The server will automatically run database schema migrations on start.*
3.  **Frontend Setup:**
    *   Navigate to `/frontend`
    *   Run `npm install` and `npm run dev`
4.  **Mobile Setup:**
    *   Navigate to `/mobile`
    *   Run `npm install` and `npm start`
    *   Scan the generated QR code using the Expo Go app on your Android device.

---
*Developed for I3DION Spatial - The Future of Industrial Visualization.*
