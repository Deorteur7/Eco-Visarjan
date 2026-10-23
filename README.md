# EcoVisarjan

## Description

EcoVisarjan is a Hyderabad-focused web app for finding safer Ganesh idol immersion and flower-disposal locations. It helps a user identify an idol material, find a suitable destination, get directions, and understand the estimated environmental impact.

## Why and what it is used for

Festival waste and unsuitable idol immersion can pollute lakes and water bodies. EcoVisarjan is a decision-support tool for citizens: it promotes home immersion where suitable, contained artificial ponds, and proper flower disposal. It is a prototype, not an official municipal directory; use verified location data before public use.

## Features

- Upload an idol photo for optional Gemini material classification.
- Find, filter, and recommend immersion points by material, height, and distance.
- View immersion, flower-disposal, and sensitive-water-body layers on a map.
- Get route guidance to a selected location.
- Estimate relative pollution risk with a Python ML service, with a built-in fallback.
- Record activity and view an impact dashboard.

## Tech stack

| Area | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS, MapLibre GL |
| Backend | Node.js, Express, Zod |
| Database | AWS DynamoDB or local in-memory store |
| Image classification | Google Gemini API |
| ML service | Python, FastAPI, scikit-learn |
| Maps and routing | OpenFreeMap / OpenStreetMap, OSRM or OpenRouteService |

## Installation and setup

Requirements: Node.js 22.22+, npm, and Python 3.11+.

```bash
npm install
npm run ml:setup
npm run dev:all
```

Open `http://localhost:5173`.

For a quick run without the ML service, use:

```bash
npm run dev
```

The app uses in-memory data by default and loads points from `server/src/data/immersionPoints.js` and `server/src/data/flowerPoints.js` every time the server starts.

Useful commands:

| Command | Purpose |
|---|---|
| `npm run dev` | Start frontend and API |
| `npm run dev:all` | Start frontend, API, and ML service |
| `npm run build` | Build the frontend for production |
| `npm start` | Run the production Express server |
| `npm run test` | Run backend tests |
| `npm run lint` | Lint frontend and backend |

## Environment and keys

Create `server/.env` for local configuration:

```env
PORT=8080
NODE_ENV=development
DATA_STORE=memory
AWS_REGION=ap-southeast-2
DYNAMODB_TABLE_PREFIX=ecovisarjan
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
ORS_API_KEY=
ML_SERVICE_URL=http://127.0.0.1:8000
CORS_ORIGIN=
```

`GEMINI_API_KEY` enables photo classification. `ORS_API_KEY` is optional; without it the app uses OSRM routing. Keep keys out of Git.

### DynamoDB

To persist the points in DynamoDB, set `DATA_STORE=dynamodb`, configure AWS credentials locally, then run:

```bash
npm run db:create
npm run db:seed
```

`db:seed` uploads the records from `immersionPoints.js` and `flowerPoints.js`. On AWS EC2, use an IAM role for DynamoDB access instead of placing AWS keys in `.env`.

## Architecture

```text
React frontend
      │ /api
Express API
 ├── DynamoDB (or memory store)
 ├── Gemini API (optional photo classification)
 ├── Routing service (OSRM / OpenRouteService)
 └── Python FastAPI ML service
```

In production, build the React client with `npm run build`; the Express server then serves both the frontend and API from one origin. CORS is only needed when the frontend is hosted separately.

## Impact dashboard

The dashboard displays app-recorded activities, including idols guided to artificial ponds or home immersion and flower waste reported by users. The pollution score is a relative index, not measured water quality. ML outputs use synthetic training data and are labelled as estimates.

## API reference

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Check data store, ML, Gemini, and routing status |
| `POST` | `/api/idol/classify` | Classify an uploaded idol image |
| `POST` | `/api/idol/options` | Check home-immersion options |
| `GET` | `/api/immersion-points` | List immersion points |
| `GET` | `/api/flower-points` | List flower-disposal points |
| `GET` | `/api/water-bodies` | List sensitive water bodies |
| `POST` | `/api/recommendation` | Get ranked immersion recommendations |
| `GET` | `/api/route` | Get route information between two coordinates |
| `POST` | `/api/pollution/predict` | Get estimated pollution risk |
| `POST` | `/api/activity` | Record a disposal or immersion activity |
| `GET` | `/api/dashboard` | Get impact-dashboard data |

## Deployment note

The simplest AWS deployment is one EC2 instance running the Express server and ML service, with DynamoDB for persistent data. Put Nginx or a load balancer with HTTPS in front of it; HTTPS is required for browser location and camera access.
