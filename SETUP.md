# Project Setup Guide (End-to-End)

This guide provides end-to-end setup instructions for any AI agent or developer to run the SHIV ERP system on any machine.

## Prerequisites
- Docker & Docker Compose (for the Odoo + Postgres + Redis backend)
- Node.js (v18+) & npm (for the React/Vite frontend)
- Python 3 (for executing the demo data script locally)

## 1. Backend Setup (Docker)
The entire backend stack is containerized.

1. Navigate to the project root directory.
2. Build and start the containers in detached mode:
   ```bash
   docker compose up -d --build
   ```
3. Wait for the containers to fully initialize. You can verify their health using `docker ps`. The `shiv_odoo` and `shiv_postgres` containers should show a `(healthy)` status.

## 2. Initialize Demo Data
To populate the database with customers, products, stock summaries, and active sales/manufacturing orders:

1. Execute the initialization script inside the Odoo container:
   ```bash
   docker exec -i shiv_odoo python3 < backend/init_demo_data.py
   ```
   *Note: This script dynamically provisions demo data across the models and creates relational dependencies correctly. It will print "Demo data initialized successfully with multiple records" upon completion.*

## 3. Frontend Setup (Local Development)
The frontend is a React application utilizing Vite, Tailwind CSS (v4), and Playwright for tests.

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the required Node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will typically run on `http://localhost:5174` (or `5173`).*

## 4. End-to-End Testing (Playwright)
To verify that the frontend and backend communicate correctly and all creation flows are functional:

1. From the `frontend/` directory, ensure the backend and frontend servers are running.
2. Run the Playwright test suite:
   ```bash
   npx playwright test
   ```
3. If this is the first time running Playwright on the machine, you may need to install the browser binaries first:
   ```bash
   npx playwright install --with-deps
   ```

## Architecture Notes for AI Agents
- **Odoo Communication**: The frontend communicates with Odoo via a custom JSON-RPC wrapper found in `frontend/src/utils/api.ts`.
- **Modals & UI**: All popups and modals use a solid overlay background `bg-[rgba(15,23,42,0.5)]` and enforce strict max widths (e.g., `max-w-[450px]`) due to Tailwind v4 spacing overrides.
- **Computed Fields**: In Odoo models (`backend/shiv_*/models/`), `@api.depends` for relational display fields MUST explicitly reference the relation's field (e.g., `product_id.name` instead of just `product_id`) to prevent caching bugs.