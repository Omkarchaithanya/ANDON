# ANDON: Setup and Deployment Guide

## Prerequisites

1. **Node.js**: v18.0.0 or later (Node 20+ recommended)
2. **Forge CLI**: Install via npm:
   ```bash
   npm install -g @forge/cli
   ```
3. **Atlassian Developer Account**: Registered at [developer.atlassian.com](https://developer.atlassian.com)
4. **Atlassian Cloud Site**: A Jira Cloud and Confluence Cloud site where you have administrator privileges.

---

## Installation & Deployment

### 1. Register the Forge App
Navigate to the root directory `andon` and log in to Forge:
```bash
forge login
forge register
```

### 2. Install Dependencies & Build Frontend
Install backend and frontend packages:
```bash
# In the root andon folder:
npm install

# Build the Custom UI frontend:
cd static/frontend
npm install
npm run build
cd ../..
```

### 3. Deploy to Atlassian Cloud
Deploy the Forge manifest, resolvers, and Custom UI static bundle to the development environment:
```bash
forge deploy
```

### 4. Install into your Jira Cloud Site
Install the deployed app onto your test site:
```bash
forge install
```
Select **Jira** as the product and provide your cloud domain (e.g. `your-domain.atlassian.net`).

---

## Seeding Synthetic Demonstration Data

To verify the app immediately in your development environment:
1. Open any Jira issue in a project (or create a task with summary: *"Apply high-gloss clear finish to Aisle 7 next Saturday"*).
2. Open the **ANDON Shadow Radar** issue panel.
3. Click the **"Seed Synthetic Demo"** button in the header.
4. The app populates Forge SQL with:
   - **Site**: Warehouse Alpha
   - **Zone**: Aisle 7
   - **Deployment**: AMR-12 (autonomous mobile robot)
   - **Condition**: `surface_finish = matte_epoxy`
   - **Evidence**: AMR-12 Commissioning Record v3
5. Click **"Run Discovery"** to trigger the Teamwork Graph and LLM pipeline.

