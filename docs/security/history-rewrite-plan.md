# I3DION Spatial — Secret Rotation Register & Git History Rewrite Plan
**Document ID:** SEC-PLAN-REWRITE-01  
**Classification:** HIGH RISK // AWAITING OWNER EXECUTION SIGN-OFF  
**Date:** October 18, 2026  

---

## 1. Executive Summary

During historical development of the I3DION Spatial Platform prior to Phase S0, several credentials and API keys were committed into git commits. In accordance with Non-Negotiable #2 and Finding SEC-01 of the Security-First Master Prompt v2.0:
1. Every committed secret is treated as **compromised**.
2. Live production credentials must be rotated immediately in provider dashboards.
3. A formal history-rewrite procedure is prepared for explicit owner approval before execution.

---

## 2. Compromised Key Class Register & Rotation Actions

| Secret Class | Historical Location in Repo | Compromise Impact | Owner Rotation Action Required | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Razorpay Key ID & Secret** | `backend/.env`, historical commits | Unauthorized access to payment order generation, webhook manipulation, merchant refund risk. | Log in to Razorpay Dashboard $\rightarrow$ Settings $\rightarrow$ API Keys. Generate new Key ID & Secret. Revoke old keys immediately. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in production environment store. | **ROTATION REQUIRED BY OWNER** |
| **Razorpay Webhook Secret** | Historical commit logs | Ability for attackers to forge webhook payloads if raw secret is compromised. | Generate new Webhook Secret in Razorpay Webhook Configuration. Update `RAZORPAY_WEBHOOK_SECRET` in production env. | **ROTATION REQUIRED BY OWNER** |
| **JWT Secrets** | `backend/src/config.js`, `backend/.env` | Session forgery; attacker can mint arbitrary tokens for any tenant user ID. | Generate high-entropy 256-bit random secret (`openssl rand -hex 32`). Set `JWT_SECRET` in env. App now fails fast if missing. | **ROTATION REQUIRED BY OWNER** |
| **Supabase Service Role Key** | `backend/.env`, `config.js` | Full administrative bypass of Supabase database and storage policies. | Rotate service-role key in Supabase Project Settings $\rightarrow$ API. Revoke old service key. | **ROTATION REQUIRED BY OWNER** |
| **SMTP / Email Credentials** | `backend/.env` | Unauthorized email relaying, spam reputation damage. | Change SMTP password in email service provider dashboard (SendGrid / AWS SES / Resend / Google Workspace). | **ROTATION REQUIRED BY OWNER** |
| **AI / Provider API Keys** | Historical scratch scripts | Unauthorized API billing and token consumption. | Revoke and regenerate all OpenAI / Anthropic / HuggingFace API keys. | **ROTATION REQUIRED BY OWNER** |

---

## 3. Pre-Commit & CI Secret Scanning (.gitleaks.toml)

To permanently prevent secrets from being committed in the future, `.gitleaks.toml` is installed at repository root with automated detection rules for:
- Razorpay API keys (`rzp_live_[a-zA-Z0-9]{14}`, `rzp_test_[a-zA-Z0-9]{14}`)
- High-entropy private keys and JWT secrets
- Supabase service role tokens
- Generic API tokens and password strings

---

## 4. Proposed Git History Rewrite Plan (Requires Explicit Owner Approval)

> [!CAUTION]
> **WARNING: Rewriting git history modifies commit SHAs across the entire repository.**
> Existing clones, active feature branches, and pull requests will require a hard reset (`git fetch && git reset --hard origin/main`).
> **DO NOT EXECUTE THIS SCRIPT WITHOUT EXPLICIT WRITTEN OWNER SIGN-OFF.**

### Recommended Tool: `git-filter-repo`

1. **Prerequisites & Backup:**
   ```bash
   # Create a clean mirror backup of the repository before any rewrite
   cd "d:/I3DION COMPANY FILES"
   git clone --mirror "d:/I3DION COMPANY FILES/i3dion-spatial/I3DION_Spatial" i3dion_spatial_pre_rewrite_backup.git
   ```

2. **File & Pattern Removal List (`expressions.txt`):**
   ```text
   # Patterns to scrub from history
   regex:rzp_(live|test)_[a-zA-Z0-9]{14}==>REDACTED_RAZORPAY_KEY
   regex:sbp_[a-zA-Z0-9]{30,}==>REDACTED_SUPABASE_KEY
   regex:jwt_secret_.*==>REDACTED_JWT_SECRET
   ```

3. **Execution Command:**
   ```bash
   git-filter-repo --replace-text expressions.txt --invert-paths --path backend/.env --path .env
   ```

4. **Verification & Force Push:**
   ```bash
   # Run gitleaks across entire rewritten history
   gitleaks detect --source . --verbose
   # Only after owner confirms and all branches are aligned:
   git push origin main --force
   ```
