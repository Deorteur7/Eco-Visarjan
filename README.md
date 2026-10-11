# EcoVisarjan

**Celebrate Ganesh Chaturthi. Protect the water.**

A Hyderabad-focused web app that helps people choose safer, designated immersion and flower-waste disposal options, so less idol material and festival waste reaches vulnerable water bodies.

Flow: upload idol photo, classify (clay / plaster of Paris), choose home or designated immersion, get the best-suited site, navigate, dispose of flowers properly, track impact.

---

## Contents

1. [Quick start (5 minutes, no accounts needed)](#1-quick-start)
2. [Requirements](#2-requirements)
3. [Full setup: DynamoDB, Gemini, routing](#3-full-setup)
4. [Running, building, testing](#4-running-building-testing)
5. [Architecture](#5-architecture)
6. [Data sources and honesty rules](#6-data-sources-and-honesty-rules)
7. [Gemini usage](#7-gemini-usage)
8. [ML methodology and limitations](#8-ml-methodology-and-limitations)
9. [Impact dashboard method](#9-impact-dashboard-method)
10. [Deploying on AWS](#10-deploying-on-aws)
11. [API reference](#11-api-reference)
12. [Troubleshooting](#12-troubleshooting)
13. [Known limitations](#13-known-limitations)

---

## 1. Quick start

This runs everything locally with an in-memory data store. Gemini (photo recognition) is optional: without a key the app asks you to pick the material manually.

```bash
# 1. install JavaScript dependencies (root, server and client together)
npm install

# 2. create the server config
cp server/.env.example server/.env          # Windows PowerShell: copy server\.env.example server\.env

# 3. set up the Python ML service (creates ml-service/.venv, installs packages, trains the model; ~1-2 min)
npm run ml:setup

# 4. start API + web app + ML service
npm run dev:all
```

Open **http://localhost:5173**.

If you skip step 3, use `npm run dev` instead of `npm run dev:all`. The app still works: the pollution estimate falls back to a built-in formula and says so on screen.

---

## 2. Requirements

| Tool | Version | Check |
|---|---|---|
| Node.js | **22.22 or newer** (22 LTS) | `node -v` |
| npm | 10 or newer (ships with Node 22) | `npm -v` |
| Python | 3.11 or newer (tested on 3.13) | `python3 --version` (Windows: `py --version`) |

Everything else installs from `package.json` / `requirements.txt`. Dependency versions were the latest available when this project was built, and installing them produces no deprecation warnings and no known vulnerabilities.

---

## 3. Full setup

Each part below is optional and independent. Do the ones you want.

### 3.1 Gemini API key (idol photo recognition)

1. Go to <https://aistudio.google.com/apikey> and sign in with a Google account.
2. Choose **Create API key**. Copy it.
3. Open `server/.env` and set:
   ```
   GEMINI_API_KEY=paste-your-key-here
   ```
4. Restart the server. The startup log should say `gemini : enabled (gemini-2.5-flash)`.

If Google retires the default model name, set `GEMINI_MODEL` in `server/.env` to a current vision-capable Gemini model from <https://ai.google.dev/gemini-api/docs/models>.

The key stays on the server and is never sent to the browser. Never commit `server/.env` (it is in `.gitignore`).

### 3.2 AWS DynamoDB (persistent data)

By default `DATA_STORE=memory`: data resets on every restart. To use DynamoDB:

**a) Create an AWS account and an IAM user**

1. Sign in to the AWS console, open **IAM**, then **Users**, then **Create user** (for example `ecovisarjan-app`). Do not enable console access.
2. Attach permissions. Simplest for a hackathon: the managed policy **AmazonDynamoDBFullAccess**. Tighter alternative: a custom policy allowing `dynamodb:CreateTable`, `DescribeTable`, `PutItem`, `GetItem`, `Scan`, `BatchWriteItem` on `arn:aws:dynamodb:ap-south-1:*:table/ecovisarjan-*`.
3. Open the user, **Security credentials**, **Create access key**, choose **Command Line Interface (CLI)**, and copy the access key ID and secret.

**b) Give the app the credentials** (pick one)

- Install the AWS CLI (<https://aws.amazon.com/cli/>) and run `aws configure`. Enter the key, secret, region `ap-south-1` (Mumbai) and output `json`. The SDK picks these up automatically. **Recommended.**
- Or put them in `server/.env`:
  ```
  AWS_ACCESS_KEY_ID=...
  AWS_SECRET_ACCESS_KEY=...
  ```

**c) Switch the data store and create the tables**

In `server/.env`:
```
DATA_STORE=dynamodb
AWS_REGION=ap-south-1
```
Then:
```bash
npm run db:create    # creates 3 pay-per-request tables: ecovisarjan-immersion-points, -flower-points, -activity
npm run db:seed      # loads the seed immersion and flower points
```
Restart the server. `GET /api/health` should report `"dataStore": {"ok": true, "kind": "dynamodb"}`.

Cost: tables use on-demand billing and this app's traffic is tiny, so a demo costs very little. Delete the tables from the DynamoDB console when finished.

**Free local alternative: DynamoDB Local** (needs Docker):
```bash
docker run -p 8000:8000 amazon/dynamodb-local
```
Set `DYNAMODB_ENDPOINT=http://localhost:8000` and `DATA_STORE=dynamodb`, then run `db:create` and `db:seed`. The ML service also defaults to port 8000, so start it on another port with `ML_PORT=8001 npm run ml:dev` and set `ML_SERVICE_URL=http://127.0.0.1:8001`.

> The DynamoDB code path was written against the AWS SDK documentation and verified to load and build, but it could not be run against a real AWS account or DynamoDB Local in the environment this project was built in. The in-memory store uses the same interface and is covered by the tests. If `npm run db:create` fails, the error message names the cause (usually credentials or permissions, see Troubleshooting).

### 3.3 Routing (directions)

Works with **no setup**: the public OSRM demo server (OpenStreetMap data) is used. It is fine for demos but has no uptime guarantee and must not be used for heavy traffic.

Optional, more reliable: a free OpenRouteService key.
1. Sign up at <https://openrouteservice.org/dev/#/signup> and create a token.
2. Set `ORS_API_KEY=...` in `server/.env`. OpenRouteService is tried first, with OSRM as the fallback.

If both are unreachable the app shows a clearly labelled straight-line estimate instead of failing. For production, self-host OSRM or use a paid routing plan.

### 3.3b Map (MapLibre + mapcn)

The map uses [mapcn](https://github.com/AnmolSaini16/mapcn) (MIT), which is a set of React components on top of **MapLibre GL**. The component is copied into the project at `client/src/components/ui/map.tsx` (licence: `MAPCN_LICENSE.txt` beside it), so there is nothing extra to install or configure.

* **Basemap:** [OpenFreeMap](https://openfreemap.org) "positron" style (OpenStreetMap data, free, no API key). To use a different MapLibre style (MapTiler, Stadia, self-hosted), create `client/.env` containing `VITE_MAP_STYLE_URL=https://your-style-url`, and add that host to `img-src` and `connect-src` in `server/src/app.js`.
* **Automatic fallback:** if the vector style cannot be loaded (host unreachable, blocked), the map switches to plain OpenStreetMap raster tiles.
* **Worker files:** MapLibre needs two worker files. They are copied from `node_modules` into `client/public` automatically after `npm install` and before `npm run dev` / `npm run build` (`scripts/copy-maplibre-worker.mjs`). They are not committed to git.
* **Icons:** drawn in `client/src/components/Pins.jsx`: temple pin (lakes and tanks), waves pin (artificial and baby ponds), flower pin (flower disposal), water-drop (sensitive water bodies), pulsing dot (you).
* **Route preview:** after "Get directions" the full path is drawn, a dot travels from your location to the site, and "Replay preview" plays it again.
* **Usage note:** the OpenFreeMap public service is free for normal use. For heavy production traffic, consider a paid tile provider or self-hosting.

### 3.4 Loading real, verified locations

The shipped seed contains **no officially verified coordinates** (see section 6). To load real data from a GHMC / HYDRAA / municipal notice:

1. Copy `server/data/imports/immersion-points.template.json` (and `flower-points.template.json`) and fill in real records. `source` is mandatory; `sourceUrl` is strongly recommended. Use `"coordinateAccuracy": "SURVEYED"` only if you checked the coordinates.
2. Import:
   ```bash
   npm run db:import -- immersion path/to/your-immersion-points.json
   npm run db:import -- flower path/to/your-flower-points.json
   ```
   Records are validated before writing. Imports require `DATA_STORE=dynamodb`.
3. To remove demo placeholders, delete the `demo-*` items from the DynamoDB tables (console, "Explore items"). The API also accepts `includeDemo=false`.

### 3.5 Optional: simulated dashboard data

```bash
npm run db:seed-demo-activity
```
Writes about 65 records tagged `SIMULATED_DEMO` (DynamoDB mode only). They show in a separate, clearly red-labelled "Simulated demo data" section and never in the app-generated numbers.

### 3.6 All environment variables

All live in `server/.env` (template: `server/.env.example`).

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | 8080 | API port |
| `DATA_STORE` | memory | `memory` or `dynamodb` |
| `AWS_REGION` | ap-south-1 | DynamoDB region |
| `DYNAMODB_TABLE_PREFIX` | ecovisarjan | Table name prefix |
| `DYNAMODB_ENDPOINT` | empty | DynamoDB Local URL |
| `GEMINI_API_KEY` | empty | Enables photo recognition |
| `GEMINI_MODEL` | gemini-2.5-flash | Vision model name |
| `ORS_API_KEY` | empty | OpenRouteService key (optional) |
| `OSRM_BASE_URL` | public demo server | Self-hosted OSRM URL |
| `ML_SERVICE_URL` | http://127.0.0.1:8000 | Python service URL |
| `HOME_IMMERSION_MAX_HEIGHT_FT` | 2 | Home-immersion height limit for clay |
| `CORS_ORIGIN` | empty | Only if the frontend is on another origin |

---

## 4. Running, building, testing

| Command | What it does |
|---|---|
| `npm run dev` | API (8080) + web app (5173) |
| `npm run dev:all` | The above plus the ML service (8000) |
| `npm run build` | Builds the React app into `client/dist` |
| `npm start` | Production: the API serves the built app on `PORT` (run `npm run build` first) |
| `npm test` | Server tests (26 tests, no network needed) |
| `npm run ml:test` | Python ML tests |
| `npm run lint` | ESLint for client and server |

**One-process production run:**
```bash
npm run build
npm start          # open http://localhost:8080
```

---

## 5. Architecture

```
React (Vite, Tailwind, MapLibre GL via mapcn)
        |  /api  (Vite proxy in dev, same origin in production)
Express REST API  (zod validation, rate limits, helmet)
   Services
   |- geminiService          photo -> CLAY | PLASTER_OF_PARIS | UNKNOWN (validated)
   |- recommendationService  ranks sites (suitability.js, pure and unit tested)
   |- routingService         OpenRouteService / OSRM / labelled fallback
   |- pollutionService  ---> Python FastAPI service (RandomForest), JS formula fallback
   |- locationService        reads points, adds distances, filters
   |- activityService / dashboardService
   |
   Data store: AWS DynamoDB (or in-memory), 3 tables
```

```
client/      React app. Pages only render; business logic is on the server.
server/      Express API, services, DynamoDB layer, scripts, tests
ml-service/  FastAPI + scikit-learn, synthetic data generator, training script
scripts/     Cross-platform helper for the Python service
```

Recommendation scoring (`server/src/services/suitability.js`) is a transparent weighted score, not a learned model: distance 35%, facility type 25%, idol-size fit 15%, material fit 15%, availability 10%. Sites that cannot take the idol (too tall, wrong material, inactive) are excluded outright. Plaster-of-Paris and unverified idols strongly prefer contained artificial ponds. Fields a source does not publish score neutrally and produce a visible warning; nothing is guessed. All weights are labelled constants at the top of the file.

---

## 6. Data sources and honesty rules

The app distinguishes these kinds of information everywhere:

| Kind | Label in the app |
|---|---|
| Official import (you load it) | "Official data" |
| Named in press coverage | "Named in press report" |
| Fictional placeholder | "Demo placeholder" |
| ML output | "ML estimate (synthetic training data)" |
| App activity | "Prototype / estimated impact" |
| Authority figures | "Government-reported statistics" |

**What ships in the seed data, and its limits (please read):**

* **7 named lakes** (Hussain Sagar, Saroor Nagar, Safilguda, IDL, Sunnam Cheruvu, Shamirpet, Edulabad). Their **existence as immersion sites** comes from press coverage of civic arrangements ([Siasat](https://www.siasat.com/hyderabad-sees-elaborate-arrangements-for-ganesh-chaturthi-3265020/), [Telangana Today](https://telanganatoday.com/arrangements-in-place-for-ganesh-idol-immersion-across-hyderabad)). The **coordinates are approximate lake centres entered by the developer, not official survey points**, and are marked "approximate". Idol-size limits and accepted materials were not published in those sources, so they show as "Not published".
* **3 artificial ponds and 5 flower drop-offs are fictional placeholders.** The sources found name no individual artificial ponds or flower-collection points (they only give counts, such as 74 artificial ponds). They exist to demonstrate the flow and are labelled "Demo placeholder" everywhere. Replace them using section 3.4.
* **Sensitive water bodies layer:** well-known water bodies (Osman Sagar, Himayat Sagar, Durgam Cheruvu) with approximate positions. It is informational only, not a legal protected-area boundary.
* **Government-reported statistics** (74 artificial ponds, 40+ lakes, 39 and 53 immersion points for two municipal corporations) are as reported in press coverage. The retrieved text did not state a year. Verify against the primary notice before quoting them.

Before any real-world or public use, load verified data from GHMC, HYDRAA or your municipal corporation.

---

## 7. Gemini usage

* The image is resized in the browser, uploaded to your server (never stored), and sent to Gemini with a strict system instruction and prompt.
* Gemini is constrained with a **JSON response schema** whose `material` field is an enum of `CLAY`, `PLASTER_OF_PARIS`, `UNKNOWN`, at temperature 0.
* The server **re-validates** the response with zod. Invalid JSON, an unknown material string, a non-idol photo, or confidence below 0.6 all become `UNKNOWN`, and the user is asked to verify the material manually.
* The user always confirms the material. A photograph cannot reliably tell clay from plaster of Paris, and the UI says so.
* If Gemini is not configured, rate limited, times out, or errors, the UI shows a friendly message and offers manual selection.
* Uploads are checked by file signature (JPEG, PNG, WebP), limited to 6 MB, and rate limited.
* The response validation logic is unit tested. The live call to Gemini was not exercised in the build environment (no API key), so test it once with your key.

---

## 8. ML methodology and limitations

* **What it predicts:** a relative pollution-risk **index** from 0 to 100 and a LOW / MEDIUM / HIGH level (below 33, 33 to 66, above 66). It is not a prediction of real water chemistry.
* **Inputs:** number of idols, material, height, flower waste (kg), water-body type (natural lake, artificial pond, home container), and optional baseline BOD and dissolved oxygen.
* **Model:** scikit-learn `RandomForestRegressor` (200 trees).
* **Training data: synthetic.** No public dataset links idol counts and materials to measured water-quality change in a usable form, so `ml-service/generate_data.py` generates 20,000 labelled scenarios. Targets come from the documented formula in `ml-service/risk_formula.py` (idol load scales with count, material factor and height squared; flower load per kg; multiplied by water-body vulnerability and baseline stress; squashed to 0-100) plus 10% multiplicative noise. Baseline stress uses CPCB-style reference values (BOD above 3 mg/L, dissolved oxygen below 5 mg/L). **All constants are assumptions chosen for plausibility, not measurements.**
* **Metrics** (`ml-service/model/metrics.json` after training): holdout R2 about 0.99 and level accuracy about 97%. These measure agreement with the synthetic formula, **not real-world accuracy**.
* **Explainability:** each prediction returns "what-if" comparisons (remove idols, remove flowers, use an artificial pond, use clay), and `/model-info` returns feature importances.
* **Fallback:** if the ML service is down, the API uses the same formula in JavaScript and the UI states that.
* **Improving it:** replace the `generate_data.py` output with real measurements (for example pre- and post-immersion lake readings from the Telangana State Pollution Control Board), keep the same feature columns, and rerun `npm run ml:setup`.

---

## 9. Impact dashboard method

* **Idols redirected** counts idols sent to an artificial pond or immersed at home, assuming they would otherwise have gone to an open natural water body (an assumption, stated on the page).
* **Risk reduction** is the difference between two ML index scores for the same idol: natural lake versus the actual destination. It is in index points, not kilograms of pollutant.
* **Flower waste** is the quantity the user typed, not a weighed figure.
* Counts come from "Count it" actions in the app and are self-reported. Nothing verifies that a visit happened.
* App metrics, simulated demo metrics and government statistics are three separate sections and are never summed.

---

## 10. Deploying on AWS

These steps were **not executed during development** (no AWS account was available), so treat them as a guide and adjust as needed.

**Simplest: one EC2 instance serving everything**

1. Create the DynamoDB tables as in section 3.2 (run the scripts from your laptop pointing at the same region).
2. Launch an EC2 instance (Amazon Linux 2023 or Ubuntu; t3.small is enough). Attach an **IAM role** with the DynamoDB permissions from 3.2, so no access keys are needed on the server. Open ports 80/443 in the security group (and 22 for you only).
3. Install Node 22 and Python 3.11+, copy the project, then:
   ```bash
   npm install
   npm run build
   npm run ml:setup
   cp server/.env.example server/.env   # set DATA_STORE=dynamodb, GEMINI_API_KEY, PORT=8080
   ```
4. Run the two processes under a supervisor (systemd or pm2): `npm start` and `npm run ml:dev`. Put nginx or an Application Load Balancer in front, with HTTPS.
5. **Geolocation and the camera require HTTPS** in browsers (except on localhost), so use a certificate (ACM with a load balancer, or Let's Encrypt with nginx).

**Alternatives:** Express as a container on AWS App Runner or ECS, the ML service as a second container, DynamoDB as above. Store the Gemini key in AWS Secrets Manager or SSM Parameter Store rather than in a file.

---

## 11. API reference

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/idol/classify` | multipart: `image`, `heightFt`. Returns validated classification and options |
| POST | `/api/idol/options` | `{material, heightFt}` returns home-immersion eligibility |
| GET | `/api/immersion-points` | query: `lat,lng,material,heightFt,maxDistanceKm,onlySuitable,includeDemo,type` |
| GET | `/api/flower-points` | query: `lat,lng,maxDistanceKm,includeDemo` |
| GET | `/api/water-bodies` | sensitive water-body layer |
| POST | `/api/recommendation` | `{lat,lng,material,heightFt}` returns ranked sites with explanation |
| GET | `/api/route` | `fromLat,fromLng,toLat,toLng` returns geometry, distance, time, navigation links |
| POST | `/api/pollution/predict` | pollution-risk index and what-if |
| POST | `/api/activity` | record `HOME_IMMERSION`, `DESIGNATED_GUIDED` or `FLOWER_DISPOSAL` |
| GET | `/api/dashboard` | app, simulated and government sections |
| GET | `/api/health` | store, ML and Gemini status |

Errors are always `{ "error": { "code", "message", "details?" } }`.

---

## 12. Troubleshooting

| Symptom | Fix |
|---|---|
| `npm install` says engine mismatch | Install Node 22.22 or newer (`node -v`) |
| `npm run ml:setup` cannot find Python | Install Python 3.11+ from python.org. On Windows tick "Add to PATH" |
| Pollution page says "Using the built-in formula" | The ML service is not running. Run `npm run ml:dev` (or use `dev:all`) |
| "Port 8000 already in use" | Another program uses it. Run the ML service with `ML_PORT=8001` and set `ML_SERVICE_URL` |
| Photo recognition says "not configured" | Set `GEMINI_API_KEY` in `server/.env` and restart |
| Gemini "model was not found" | Set `GEMINI_MODEL` to a current model name |
| Gemini rate limited | The free tier has limits. Wait a minute or choose the material manually |
| DynamoDB "tables are not ready" | Run `npm run db:create` then `npm run db:seed` |
| `AccessDeniedException` | The IAM user or role lacks DynamoDB permissions (section 3.2) |
| Location button does nothing on a deployed site | Geolocation needs HTTPS. Or pick an area from the dropdown |
| Directions show "Straight-line estimate" | The routing server was unreachable. Retry, add an `ORS_API_KEY`, or check your network |
| Map stays blank or shows a spinner | No internet access to tiles.openfreemap.org. After a few seconds it falls back to OpenStreetMap tiles. Check your network, VPN or firewall |
| Map shows an error about the worker | Run `npm install` again (it copies the MapLibre worker files), or run `node scripts/copy-maplibre-worker.mjs` |
| Data disappears on restart | You are on `DATA_STORE=memory`. Use DynamoDB |

---

## 13. Known limitations

* No official, surveyed immersion or flower-collection coordinates ship with the project (section 6). Loading them is the most important step before real use.
* Live availability or crowding of sites is not known. The "active" flag is static data.
* The public OSRM server is rate limited and ignores festival-day road closures.
* Idol-material classification from a single photo is inherently uncertain; the user confirms it.
* The ML model is trained on synthetic data and gives a relative index only.
* Activity counts are self-reported, there is no authentication, and the dashboard is not tamper-proof.
* Rate limits are per server instance (in-memory).
* English only.

## Credits

Map data (c) OpenStreetMap contributors. Basemap: OpenFreeMap. Maps: MapLibre GL and mapcn (MIT). Routing: OSRM / OpenRouteService. Vision: Google Gemini.
