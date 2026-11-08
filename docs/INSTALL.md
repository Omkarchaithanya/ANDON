# ANDON Installation & Deployment Guide (INSTALL.md)

This guide documents the installation, environment configuration, and deployment lifecycle of ANDON on the Atlassian Forge platform per official documentation (`https://developer.atlassian.com/platform/forge/getting-started/`).

---

## 1. Prerequisites & Environment Compatibility

- **Node.js LTS:** Node.js `22.x` (>= `22.23.4`) or `24.x` (>= `24.18.0`). Check with `node --version`.
- **Package Manager:** `npm` (>= `10.x`). Check with `npm --version`.
- **Forge CLI:** Installed globally or run via `npx @forge/cli`. Verify with:
  ```powershell
  npx @forge/cli --version
  ```
- **Atlassian Cloud Site:** A Jira Cloud site with Jira Work Management / Jira Software and Confluence Cloud.

---

## 2. Authentication & Credentials (Secure Configuration)

Authentication uses an **Atlassian API token** with Forge app scopes. Never commit secrets to version control.

### Interactive Local Setup
```powershell
npx @forge/cli login
```

### Non-Interactive / CI / Windows Environment
For automated pipelines or headless Windows environments where OS keychain access is restricted:
```powershell
$env:FORGE_EMAIL = "your-developer-email@domain.com"
$env:FORGE_API_TOKEN = "your-atlassian-api-token"
```

> **Windows PowerShell Note:** In PowerShell, environment variables are set with `$env:VAR = "value"` and removed with `Remove-Item Env:\VAR` (do not use Unix `export` or `unset`).

---

## 3. Standard Deployment Lifecycle

Always run commands from the root directory of the application:

```powershell
# 1. Install dependencies
npm install
cd static/frontend
npm install
npm run build
cd ../..

# 2. Deploy Forge application to Development environment
npx @forge/cli deploy -e development

# 3. Install on your target Atlassian Cloud site
npx @forge/cli install -e development --site "https://your-domain.atlassian.net" --product jira

# 4. (Optional) Run real-time local tunnel for frontend & resolver development
npx @forge/cli tunnel
```

---

## 4. Multi-Environment Promotion Strategy

Forge provides isolated environments: `development`, `staging`, and `production`.

| Environment | Purpose | Deployment Command | Installation Command |
|---|---|---|---|
| **Development** | Feature development and automated CI regression tests | `npx @forge/cli deploy -e development` | `npx @forge/cli install -e development` |
| **Staging** | Pre-release validation against sanitized staging datasets | `npx @forge/cli deploy -e staging` | `npx @forge/cli install -e staging` |
| **Production** | Live tenant deployment for authorized facilities teams | `npx @forge/cli deploy -e production` | `npx @forge/cli install -e production` |

> **Strict Rule:** Code is never deployed or tested directly against the production environment without passing development and staging gates.
