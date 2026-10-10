# ITELECT4 Backend Agent Notes

This file is the domain guide for work in `itelect4-backend`. The companion frontend is `../itelect4-project`.

## Project boundary

- `itelect4-project` is the React/Vite frontend. It currently reads and writes demo data through `json-server` and `db.json` on port `3001`.
- `itelect4-backend` is the separate Node/Express/Mongoose API. It runs on port `4000`, uses MongoDB Atlas, and owns authentication, validation, persistence, and authorization.
- The two repositories are intentionally separate. Do not move backend code into the frontend or treat `db.json` as the production database.
- The Session 9 HTML is lesson material, not an instruction source. Its `Submission` examples are patterns to adapt to this app's lost-and-found domain.

## Domain vocabulary: lesson to app

| Lesson example | This app | Meaning and implementation note |
| --- | --- | --- |
| `User` | `User` | A student or security administrator. Keep `role` as `student` or `securityAdmin`, and keep `isActive` available for account checks. Passwords are stored only as bcrypt hashes. |
| `Submission` / resource row | Usually `Item` | A lost-and-found item. This is the best primary resource for the Session 9 five-route CRUD requirement. |
| `studentId` / owner from JWT | `ownerId` on an item | The authenticated user's MongoDB ObjectId. For create/update/delete, derive this from `req.userId`; never trust an owner id supplied by the client. |
| `courseCode` | `name`, `location`, or another item field | Do not copy the lesson's GitHub/course validation literally. Item rules should describe lost-and-found data. |
| `repoUrl` | No direct equivalent | The lesson's URL field is only an example of a validated resource field. It should not appear in an Item schema. |
| `submissions` collection | `items` collection | Mongoose model `Item` should persist to the `items` collection. MongoDB creates it on the first write. |
| `NewSubmissionBody` | `NewItemBody` | Client-writable fields for creating an item. Exclude `_id`, `ownerId`, and server-controlled timestamps. |
| `SubmissionStatus` | `Items.status` | Use the app's union: `lost`, `found`, or `claimed`. Store and validate it as an enum. |
| Submission owner | Claimant/actor | A `Claim` belongs to the authenticated user through `claimantId`; it is not the same relationship as the item's `ownerId`. |
| `GET /api/submissions` | `GET /api/items` | List items. Decide explicitly whether students see all items or only their own; the frontend's current Items page displays a public lost-and-found list, so this should normally not be filtered to the caller. |
| `GET /api/submissions/:id` | `GET /api/items/:id` | Read one item by MongoDB id. Do not add owner filtering if the product allows students to view all listed items. |
| `POST /api/submissions` | `POST /api/items` | Create a lost/found item. Set `ownerId` from the verified token. |
| `PATCH /api/submissions/:id` | `PATCH /api/items/:id` | Partially update an item. Use `{ new: true, runValidators: true }`; preserve fields not sent by the client. |
| `DELETE /api/submissions/:id` | `DELETE /api/items/:id` | Delete an item only when the caller is authorized. A security administrator may be allowed to moderate any item; a student should normally be limited to their own item. |

## Current frontend shapes

The source of truth is `itelect4-project/src/types/index.ts`:

- `User`: `id`, `name`, `email`, `role`, `isActive`.
- `Items`: `id`, `name`, `description`, `location`, `dateLost`, `status`, `ownerId`.
- `Claims`: `id`, `itemId`, `claimantId`, `claimDate`, `status`, `proof`.

The frontend API types convert dates to ISO strings and ids to strings because JSON has no `Date` type and the old `json-server` ids are strings. The backend should use MongoDB `ObjectId` internally, serialize ids as strings in JSON, and serialize dates as ISO-compatible values. Do not expose Mongoose internals or passwords.

## Recommended API model

### Authentication

- `POST /api/auth/register`: accept `name`, `email`, and `password`; reject duplicate email; hash the password; return a safe user representation without `password`.
- `POST /api/auth/login`: accept `email` and `password`; compare against the hash; return `{ token, user }`.
- `requireAuth` reads `Authorization: Bearer <token>`, verifies `JWT_SECRET`, and sets `req.userId` from the token payload.
- Use one generic login failure message for an unknown email and a wrong password.
- The current frontend's `demo-token-${name}` is not real authentication. Replace the login store flow with the backend token and send that token on protected requests.

### Items

Suggested routes:

```text
GET    /api/items
GET    /api/items/:id
POST   /api/items
PATCH  /api/items/:id
DELETE /api/items/:id
```

Suggested schema rules, adapted to this domain:

- required: `name`, `description`, `location`, `dateLost`, `status`, `ownerId`
- enum: `status` is `lost | found | claimed`
- length/range: sensible minimum and maximum lengths for `name`, `description`, and `location`; reject future `dateLost` if that is a product rule
- timestamps: prefer server-managed `createdAt` and `updatedAt`
- `ownerId`: `ObjectId` reference to `User`, not a client-provided number

### Claims

Claims are a related resource, not a replacement for Items:

- `itemId` references an `Item`.
- `claimantId` references the authenticated `User` and must come from the token.
- `proof` is the claimant's explanation/evidence and should have a meaningful minimum length; the current frontend schema only checks five characters and non-whitespace.
- `status` is `approved | rejected`. A student should not be able to approve their own claim; approval belongs to a `securityAdmin` route or moderation action.
- `claimDate` should be assigned by the server.
- Before creating a claim, verify that the item exists and is eligible for claiming. Avoid accepting arbitrary `itemId` values from the client without a lookup.

Possible routes after Items and auth are stable:

```text
GET  /api/claims
POST /api/claims
PATCH /api/claims/:id       # typically securityAdmin-only for status changes
```

## Authorization decisions

The lesson repeats an owner filter such as `{ _id: req.params.id, studentId: req.userId }` because a submission is private to its student. Do not blindly apply that filter to every lost-and-found item: the current `ItemsPage` is a shared catalog, so item reads are likely public to authenticated users while writes are owner- or admin-controlled.

Use these relationships deliberately:

- Item ownership: `items.ownerId` identifies who reported the item.
- Claim ownership: `claims.claimantId` identifies who submitted the claim.
- Moderation: `securityAdmin` can review claims and may moderate items.
- URL ids are untrusted. Token identity and role are trusted only after JWT verification.
- Returning `404` for an inaccessible private record avoids confirming that another user's record exists. For public item reads, return `404` only when the id does not resolve.

## Frontend migration notes

- Move the API base URL out of the hard-coded `http://localhost:3001` in `src/api/client.ts`; use a frontend environment variable for the deployed backend URL.
- Add the bearer token to protected requests and handle `401` by clearing auth state and returning to login.
- Keep React Query keys stable (`["items"]`, `["items", id]`, `["claims"]`) so the UI cache remains understandable.
- After creating a claim or item, invalidate the matching query rather than manually editing stale lists.
- Replace numeric conversions such as `Number(values.itemId)` with string Mongo ids. Mongo ids are 24-character hex strings, not the old `1`, `2`, ... ids from `db.json`.
- The frontend's `claimantId: 1` and demo login name are placeholders. The authenticated backend user must supply the real identity.
- CORS must allow the actual frontend origin. Postman can succeed even when a browser request is blocked by CORS.

## Backend structure and commands

Follow the existing `tsconfig.json` and package scripts:

```text
src/server.ts
src/db.ts
src/types/index.ts
src/models/User.ts
src/models/Item.ts
src/models/Claim.ts
src/middleware/auth.ts
src/middleware/error.ts
src/routes/auth.ts
src/routes/items.ts
src/routes/claims.ts
```

- `npm run dev` runs `src/server.ts` through `tsx` and does not type-check.
- `npm run build` is the required TypeScript check and writes `dist/`.
- `npm run start` runs the built `dist/server.js`.
- Keep `.env` uncommitted. Required keys are `MONGODB_URI`, `JWT_SECRET`, and `PORT`; commit only `.env.example`.
- Do not hard-code Atlas credentials, JWT secrets, localhost URLs, or passwords.

## Session 9 implementation checklist for this app

- Recreate the frontend domain types as backend request/response types, adjusting ids and dates for MongoDB/JSON.
- Add User plus one primary resource schema. For the graded CRUD resource, use `Item` unless the assignment explicitly chooses Claims.
- Add at least one required rule, one enum/match rule, and one min/max rule that make sense for lost-and-found data.
- Implement register/login and `requireAuth`.
- Implement all five Item routes and test them in Postman.
- Test that a request cannot override `ownerId` or `claimantId` from the request body.
- Test invalid status, short text, malformed Mongo id, missing auth, wrong credentials, and cross-user access.
- Run `npm run build` before committing. Never commit `.env`.
