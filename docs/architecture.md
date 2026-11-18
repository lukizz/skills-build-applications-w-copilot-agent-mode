# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Use React Router routes and feature components in `frontend/src/components`, with `frontend/src/api/client.ts` as the only API URL/fetch layer. Each capability will explicitly render loading, empty, success, and accessible error states.
- Logic tier decision: Keep Express routes thin and implement validation and business behavior in explicit service functions under `backend/src/services`. Services will translate invalid references or missing records into deliberate 4xx responses rather than allowing Mongoose cast errors or placeholder `501` responses.
- Data tier decision: Define required fields and relationships in Mongoose schemas under `backend/src/models`. Seed data with stable upserts and reconcile existing demo users' team memberships without deleting unrelated records.
- Activity tracking approach: Validate ObjectIds and verify that the referenced user and team exist before creation. Store the submitted references, type, and minutes; compute positive points and set `occurredAt` in the service or model. Return both direct and listed activity shapes with serialized IDs.
- Team management approach: Require a team name and mascot through the Mongoose schema and service validation; default members to an empty array and expose team members in both create and list responses.
- Leaderboard approach: Aggregate activity `points` by team, join or look up team names, sort descending, and assign a 1-based rank. Use a stable team-name tie-breaker when two teams have the same total.
- Workout suggestions approach: Resolve a seeded user by exact email, derive the preferred focus from the user's fitness goal or most recent matching activity, and return matching workouts ordered by relevance with a reason. Return `404` for an unknown email.

## Test plan

- Run data-tier contracts first: `npm run test:data --prefix octofit-tracker/backend`. Failures mean Mongoose validation, defaults, relationships, or idempotent seed behavior is incomplete.
- Run API contracts second: `npm run test:api --prefix octofit-tracker/backend`. Failures mean route/service behavior differs from the API contract, including status codes, payload shapes, references, aggregation, or workout matching.
- Run frontend contracts third: `npm test --prefix octofit-tracker/frontend`. Failures mean presentation behavior, API URL construction, loading/empty/error states, or rendered capability data is incomplete.
- Run backend type/build validation: `npm run build --prefix octofit-tracker/backend`. Failures mean TypeScript types or backend compilation are inconsistent.
- Run frontend type/build validation: `npm run build --prefix octofit-tracker/frontend`. Failures mean React/TypeScript types or the Vite production bundle are inconsistent.
- Implementation order: data schemas and seed, teams and activities, leaderboard and workout services, shared frontend fetching, then presentation components. Re-run the smallest failing suite after each change, followed by all backend and frontend builds.
