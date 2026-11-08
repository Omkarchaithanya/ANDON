# ANDON Developer Setup & Troubleshooting Guide (DEV_SETUP.md)

## 1. Windows Development Troubleshooting Guide

When building Atlassian Forge apps on Windows with PowerShell, be aware of these documented platform behaviors:

### Issue A: Windows Credential Manager / Keychain Hangs
- **Symptom:** `forge login` hangs or fails with credential manager errors on Windows.
- **Resolution:** Set environment variables directly in your PowerShell session:
  ```powershell
  $env:FORGE_EMAIL = "developer@company.com"
  $env:FORGE_API_TOKEN = "<token>"
  ```

### Issue B: Corporate VPN / TLS Certificate Interception
- **Symptom:** `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` or SSL errors during `forge deploy`.
- **Resolution:** Configure Node.js to trust the corporate CA bundle or use the standard Forge network flag:
  ```powershell
  $env:NODE_EXTRA_CA_CERTS = "C:\path\to\corporate-ca.crt"
  ```

### Issue C: `NODE_ENV` Set to Development
- **Symptom:** Forge CLI fails or skips dev dependencies.
- **Resolution:** Ensure `NODE_ENV` is unset or explicitly cleared:
  ```powershell
  Remove-Item Env:\NODE_ENV -ErrorAction SilentlyContinue
  ```

### Issue D: Running CLI Outside App Root
- **Symptom:** `Error: No manifest.yml file found`.
- **Resolution:** Verify current working directory is the project root containing `manifest.yml`.

---

## 2. Dev Site vs Demo Development Site Evaluation (ADR Decision)

Forge supports provisioning a temporary demo development site via `forge install --demo-site` (active for ~90 days with sample records).
- **Decision:** We use a dedicated, permanent Atlassian Developer Cloud site (`https://your-dev-site.atlassian.net`) rather than a temporary demo site.
- **Rationale:** The ANDON clearance radar requires deterministic verification against real, versioned Confluence pages (Page 10483 rev 3) and real Jira tickets (`FAC-1042`). Demo sites with pre-populated synthetic noise can introduce ungrounded schema drifts.

---

## 3. Local Custom UI Preview vs Live Forge Bridge
- **Live Forge Execution:** When running inside Atlassian Cloud (`jira:issuePanel`), the app communicates via native `@forge/bridge` calling Forge backend resolvers.
- **Local Dev Preview:** When running `npm run dev` at `http://localhost:5173`, a developer harness polyfill provides fixture responses strictly for component layout testing. The UI loudly badges this state: `[DEV HARNESS ONLY — SIMULATING RESOLVERS FOR LOCAL UI DEVELOPMENT — NOT PRODUCTION RUNTIME]`.
