# Backend — Test Suite Documentation

## Test stack

| Package | Purpose |
|---------|---------|
| `jest` ^30 | Test runner and assertion library |
| `ts-jest` | TypeScript compilation for Jest |
| `supertest` | HTTP integration testing against Express |
| `mongodb-memory-server` | In-process MongoDB instance for DB tests |
| `jsonwebtoken` | Token generation in test helpers |
| `bcryptjs` | Password hashing in test helpers |

### Jest configuration (`jest.config.ts`)

```ts
{
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  clearMocks: true,     // clears call records before each test
  resetMocks: true,     // removes mock implementations before each test
  restoreMocks: true,   // restores spies before each test
  setupFiles: ['dotenv/config'],
  forceExit: true,
}
```

`resetMocks: true` is particularly significant: every `jest.fn()` has its implementation removed before each test, which forces every test to be explicit about what it expects from its dependencies. Tests that rely on module-level mocks (Stripe singleton, OpenAI client) re-apply implementations in `beforeEach`.

---

## Test categories

The suite is organized into three categories:

| Category | Files | Tests |
|----------|-------|-------|
| Unit | 13 files in `src/test/` | 270 |
| Integration (HTTP) | 6 files in `src/test/integration/` | 89 |
| Total | 20 suites | 359 |

---

## Unit tests (`src/test/`)

Unit tests isolate a single module using `jest.mock()` for all external dependencies (database models, external APIs, mailer). No real network or database connections are made.

### `agents.test.ts` — 36 tests

Controller: `src/app/agents/controller.ts`

Mocks: `AgentModel`, `UserModel`, `../index` (Socket.IO)

| Describe block | Tests | What is verified |
|----------------|-------|-----------------|
| `getAllAgents()` | 4 | 200 with agent list, category filter, availability filter, 500 on DB error |
| `getAgentById()` | 3 | 404 when not found, 200 with agent data, 500 on DB error |
| `createAgent()` | 4 | 401 no user, 403 non-admin, 201 admin success, 500 on DB error |
| `updateAgent()` | 4 | 401 no user, 404 not found, 403 not owner/admin, 200 owner updates |
| `deleteAgent()` | 4 | 401 no user, 404 not found, 403 not owner/admin, 204 admin deletes |
| `searchAgent()` | 3 | all agents returned without query, regex search, 500 on DB error |
| `rentAgent()` | 8 | insufficient credits, agent already rented, credit deduction, timer setup |
| `getMyRentedAgents()` | 3 | 401 no user, 200 with rental list, empty list |
| `releaseAgent()` | 3 | 404 not found, 403 wrong owner, 200 successful release |

---

### `auth.test.ts` — 30 tests

Controller: `src/app/auth/controller.ts`

Mocks: `UserModel`, `passport`, mailer functions

| Describe block | Tests | What is verified |
|----------------|-------|-----------------|
| `login()` | 5 | 401 unknown email, 400 Google account, 401 wrong password, 200 with token, 500 DB error |
| `signup()` | 6 | 400 missing fields, 400 invalid email, 409 duplicate email, 409 duplicate name, 201 created, 500 error |
| `forgotPassword()` | 4 | 400 no email, 200 nonexistent user (no enumeration), 200 user found + email sent, 500 error |
| `resetPassword()` | 7 | 400 missing fields, 400 invalid JWT, 400 wrong token type, 400 user not found, 400 token expired, 200 password updated, 500 error |
| `googleAuthController()` | 2 | state=register when mode=register, state=login as default |
| `googleCallbackController()` | 6 | redirect on OAuth error, redirect when no user, redirect when not new user, redirect new user with token, redirect on sign error |

---

### `chat.test.ts` — 8 tests

Controller: `src/app/chat/controller.ts`

Mocks: `AgentModel`, `openai` (class-level mock)

| Test | What is verified |
|------|-----------------|
| 400 missing agentId or message | Validates both fields are required |
| 400 missing agentId | Validates agentId specifically |
| 400 missing message | Validates message specifically |
| 404 agent not found | Correct 404 when agent does not exist |
| 403 agent unavailable | `availability: false` blocks the request |
| 200 with agent response | OpenAI response forwarded correctly |
| 500 on OpenAI error | Error propagation from API layer |
| 500 on empty choices | Guards against `choices[0]` being undefined |

---

### `database.test.ts` — 8 tests

Module: `src/database/index.ts`

Mocks: `mongoose` (fully replaced, `connect` is `jest.fn()`)

| Test | What is verified |
|------|-----------------|
| Successful connection | `connect` called with MONGO_URL, resolves |
| Connection failure | Promise rejects when `connect` rejects |
| Correct URL from env | MONGO_URL value forwarded verbatim to connect |
| Multiple URL formats | Standard, SRV, and auth URL formats all work |
| Error propagation | Specific connection errors are caught and rejected |
| Idempotency | Multiple consecutive calls each invoke `connect` |
| Missing MONGO_URL | Connects with `undefined` (no crash) |
| Slow connection (100 ms delay) | Timer-based mock resolves within expected window |

---

### `documents.test.ts` — 17 tests

Controller: `src/app/documents/controller.ts`

Mocks: `s3` module, `FileModel`, `mongoose`

| Describe block | Tests | What is verified |
|----------------|-------|-----------------|
| `uploadFile()` | 4 | 401 no user, 400 no file, 201 file created, 500 DB error |
| `listMyFiles()` | 3 | 401 no user, 200 with file list, 500 DB error |
| `downloadFile()` | 4 | 400 invalid ID, 404 not found, 500 S3 error, 200 stream piped |
| `deleteFile()` | 6 | 401 no user, 400 invalid ID, 404 not found, 403 not owner, 204 success, 204 even when S3 fails |

---

### `functionality.test.ts` — 16 tests

Controllers: `agents/controller.ts`, `middlewares/auth.ts`

Mocks: `UserModel`, `AgentModel`, `mailer/controller`

Focus: business logic edge cases not easily triggered through HTTP.

| Describe block | Tests | What is verified |
|----------------|-------|-----------------|
| `rentAgent()` — duration math | 5 | `days` multiplies by 24, `months` by 720, unknown unit defaults to 1, empty body defaults to 1 hour, exact-credit boundary allows rental |
| `searchAgent()` | 3 | empty query returns all agents, no match returns `[]`, DB error returns 500 |
| `releaseAgent()` | 3 | 404 not found, 403 wrong owner, 200 owner releases successfully |
| `verifyAdmin()` | 3 | 401 no `req.user`, 403 role is `user`, passes for `admin` |
| `getMyRentedAgents()` | 2 | 401 no userId, uses `user.sub` as fallback when `user.id` absent |

---

### `google.test.ts` — 10 tests

Controller: `src/app/auth/google.ts`

Mocks: `passport`, `UserModel`, `jsonwebtoken`

Tests cover the Google OAuth 2.0 callback flow: user creation vs login, JWT signing, redirection on errors, and the `isNewUser` flag behavior.

---

### `mailer.test.ts` — 11 tests

Controller: `src/app/mailer/controller.ts`

Mocks: `mailer.sendMail` (the nodemailer transport)

| Describe block | Tests | What is verified |
|----------------|-------|-----------------|
| `sendEmail()` | 3 | Success path, SMTP error path, recipient taken from query param |
| `sendWelcomeEmail()` | 3 | Correct recipient, user name in HTML, error propagation |
| `sendPasswordResetEmail()` | 5 | Correct subject, reset link in HTML, user name in HTML, reset link in plain text, error propagation |

---

### `middleware.test.ts` — 16 tests

Module: `src/app/middlewares/auth.ts`

Mocks: `UserModel`, `jsonwebtoken`

| Describe block | Tests | What is verified |
|----------------|-------|-----------------|
| `authMiddleware()` | 5 | 401 no token, Bearer1234 bypass, invalid JWT, valid JWT calls `next()`, token extracted correctly |
| `verifyToken()` | 8 | 401 no header, 401 empty token after split, 401 invalid JWT, 401 expired JWT, 401 no sub/id in payload, 401 user not found in DB, 403 user blocked, 200 valid token sets `req.user` |
| `verifyAdmin()` | 3 | 401 no `req.user`, 403 role is `user`, calls `next()` for admin |

---

### `payments.test.ts` — 11 tests

Controller: `src/app/payments/controller.ts`

Mocks: `stripe` (constructor mock with lazy-singleton pattern)

| Describe block | Tests | What is verified |
|----------------|-------|-----------------|
| `createCheckoutSession()` | 6 | 400 no amount, 400 amount < 10, 400 amount = 0, 200 with Stripe URL, metadata includes userId + creditsAmount, 500 on Stripe error |
| `verifyPaymentSuccess()` | 5 | 400 no session_id, 400 payment unpaid, 200 credits added to user, 400 user not found, 500 on Stripe retrieve error |

Note: Because `getStripe()` uses a module-level singleton, the Stripe mock constructor is re-applied in `beforeEach` to ensure isolation across tests despite `resetMocks: true`.

---

### `schema.test.ts` — 47 tests

Models: `UserModel`, `AgentModel`, `FileModel`

Infrastructure: own `MongoMemoryServer` instance; `syncIndexes()` called in `beforeAll` to guarantee unique index enforcement.

| Describe block | Tests | What is verified |
|----------------|-------|-----------------|
| `UserModel` schema | 16 | Valid creation, `role`/`status`/`provider`/`credits` defaults, enum rejections, credits min:0, required fields, conditional passwordHash, email uniqueness, delete cascade, timestamps |
| `AgentModel` schema | 14 | Valid creation, `category`/`availability`/`language` defaults, enum rejection, all 5 valid categories, `ratings.average` min/max, `pricePerHour` min, all required fields, timestamps, `updatedAt` changes on update |
| `FileModel` schema | 9 | Valid creation, `public` default, all required fields, `key` uniqueness, timestamps, `ownerId` is ObjectId |
| CastError behavior | 3 | `findById('invalid')` throws `Cast to ObjectId failed` for User, valid-but-nonexistent ID returns `null`, same CastError for AgentModel |

---

### `storage.test.ts` — 15 tests

Module: `src/app/storage/s3.ts`

Mocks: `@aws-sdk/client-s3`, `multer`, `multer-s3`

| Describe block | Tests | What is verified |
|----------------|-------|-----------------|
| `bucketName` | 2 | Exported as string, reads from `S3_BUCKET` at module load |
| `deleteObject()` | 3 | Throws when `S3_BUCKET` missing, sends `DeleteObjectCommand`, propagates S3 error |
| `getObject()` | 3 | Throws when `S3_BUCKET` missing, sends `GetObjectCommand` with response, propagates error |
| `uploadBuffer()` | 2 | Throws when `S3_BUCKET` missing, sends `PutObjectCommand` |
| `s3Client / s3` | 1 | Both exports refer to the same instance |
| `createImageUpload()` | 4 | Returns middleware, default 5 MB limit, configurable limit, uses `AUTO_CONTENT_TYPE` |

---

### `users.test.ts` — 41 tests

Controller: `src/app/users/controller.ts`

Mocks: `UserModel`, `bcrypt`, `jsonwebtoken`

| Describe block | Tests | What is verified |
|----------------|-------|-----------------|
| Registration / Login (top-level) | 7 | 400 invalid email, 201 user created, 401 wrong password, 400 missing fields, 409 duplicate email, 409 duplicate name, 400 Google account on login |
| CRUD operations | 5 | 200 list users, 500 DB error on list, 404 user by ID, 400 no update data, 500 DB error on get |
| Admin operations | 3 | Role updated to admin, invalid status rejected, invalid credits rejected |
| `login()` additional | 2 | 401 unknown email, 200 with token and user data |
| `deleteUser()` | 4 | 400 invalid ID, 404 not found, 204 deleted, 500 DB error |
| `getFavoriteAgents()` | 1 | Returns fixed agent list |
| `getUserById()` additional | 1 | 400 on malformed ID |
| Additional edge cases | 18 | Update name, credits, role, status; 404/500 error paths; ID validation; bcrypt comparison |

---

## Integration tests (`src/test/integration/`)

Integration tests make real HTTP requests against the Express app using `supertest`. Each suite:

- Starts a `MongoMemoryServer` in `beforeAll` (shared helpers in `setup/db.ts`)
- Clears all collections in `afterEach`
- Mocks only external third-party services (S3, Stripe, OpenAI, mailer) — the database, JWT, and bcrypt are real

### Shared test infrastructure

**`setup/db.ts`**

```ts
connectTestDb()    // starts MongoMemoryServer, connects mongoose
disconnectTestDb() // drops DB, closes connection, stops server
clearTestDb()      // deleteMany on all collections (afterEach)
```

**`setup/helpers.ts`**

```ts
createUser(overrides?)  // creates a user in DB with bcrypt-hashed password
authHeader(user)        // returns { Authorization: 'Bearer <jwt>' }
signToken(payload)      // signs a JWT with the test secret
```

The JWT secret used in helpers matches `process.env.SECRET_KEY ?? process.env.JWT_KEY ?? 'dev-secret'`, guaranteeing that tokens generated in tests are accepted by `verifyToken`.

---

### `auth.integration.test.ts` — 12 tests

Routes: `POST /auth/signup`, `POST /auth/login`, `POST /auth/forgot-password`

Mocks: `sendWelcomeEmail`, `sendPasswordResetEmail`, `sendEmail`

| Route | Tests | Scenarios |
|-------|-------|-----------|
| `POST /auth/signup` | 5 | 201 valid user, 400 missing fields, 400 invalid email, 409 duplicate email, 409 duplicate name |
| `POST /auth/login` | 4 | 200 correct credentials, 401 wrong password, 401 unknown email, 400 Google-only account |
| `POST /auth/forgot-password` | 3 | 200 nonexistent email (no enumeration), 200 existing email + token saved, 400 missing email |

---

### `agents.integration.test.ts` — 16 tests

Routes: `GET /agents`, `GET /agents/search`, `GET /agents/:id`, `POST /agents`, `POST /agents/:id/rent`, `GET /agents/my-rentals`, `POST /agents/:id/release`

Mocks: mailer functions

| Route | Tests | Scenarios |
|-------|-------|-----------|
| `GET /agents` | 3 | 200 with list, 401 no token, 200 filtered by availability |
| `GET /agents/search` | 2 | 200 found by name, 200 all agents without query |
| `GET /agents/:id` | 2 | 200 by ID, 404 not found |
| `POST /agents` | 2 | 403 non-admin, 201 admin creates |
| `POST /agents/:id/rent` | 3 | 200 credits deducted, 402 insufficient credits, 400 already rented |
| `GET /agents/my-rentals` | 2 | 200 with rentals, 200 empty list |
| `POST /agents/:id/release` | 2 | 200 owner releases, 403 non-owner blocked |

---

### `chat.integration.test.ts` — 5 tests

Route: `POST /chat`

Mocks: `openai` module, mailer functions

| Test | Scenario |
|------|---------|
| 200 agent response | OpenAI returns choices, response forwarded |
| 400 missing fields | Validation before model/API access |
| 404 agent not found | Correct DB miss handling |
| 403 agent unavailable | `availability: false` gate |
| 401 no token | Auth guard enforced |

---

### `documents.integration.test.ts` — 19 tests

Routes: `GET /files`, `POST /files/upload`, `GET /files/:id/download`, `DELETE /files/:id`

Mocks: `src/app/storage/s3` — the multer middleware factory is replaced with a plain function (not `jest.fn()`) so `resetMocks: true` cannot clear it between tests. `getObject` uses `PassThrough` streams created fresh per call to avoid stream exhaustion.

| Route | Tests | Scenarios |
|-------|-------|-----------|
| `GET /files` | 5 | 200 user files, 200 empty list, 200 own files only (isolation), 401 no token, no sensitive fields exposed |
| `POST /files/upload` | 3 | 201 metadata returned, 201 persisted in DB, 401 no token |
| `GET /files/:id/download` | 5 | 200 correct content-type header, 404 not found, 400 invalid ID, 500 S3 error, accessible without token (documented gap) |
| `DELETE /files/:id` | 6 | 204 owner deletes, 204 DB deleted even when S3 fails, 403 non-owner, 404 not found, 400 invalid ID, 401 no token |

---

### `payments.integration.test.ts` — 8 tests

Routes: `POST /payments/create-checkout-session`, `POST /payments/verify-success`

Mocks: `stripe` module (constructor + session methods)

| Route | Tests | Scenarios |
|-------|-------|-----------|
| `POST /payments/create-checkout-session` | 4 | 200 Stripe URL returned, 400 amount < 10, 400 missing amount, 401 no token |
| `POST /payments/verify-success` | 4 | 200 credits added on paid session, 400 unpaid session, 400 missing session_id, 401 no token |

---

### `security.integration.test.ts` — 17 tests

These tests treat the API as a black box and verify security properties end-to-end.

| Describe block | Tests | What is verified |
|----------------|-------|-----------------|
| Token validation | 6 | 401 expired JWT (with "expirado" message), 401 tampered signature, 401 deleted user, 403 blocked user, lowercase `bearer` header handled, 401 no Authorization header |
| Privilege escalation | 3 | 403 non-admin cannot reach admin routes, `role` field not changeable via `PUT /users/:id` body, forged admin JWT rejected by signature check |
| Data exposure | 2 | `passwordHash`, `resetPasswordToken`, `resetPasswordExpires`, `googleId` absent from all responses |
| Input injection | 2 | Regex injection `.*` does not crash server, invalid regex `[` handled gracefully |
| Cross-user access | 2 | Current (insecure) behavior documented: any authenticated user can view/edit any profile |
| Email enumeration | 2 | `POST /auth/forgot-password` returns 200 regardless of whether email exists |

---

### `users.integration.test.ts` — 16 tests

Routes: `GET /users`, `GET /users/:id`, `PUT /users/:id`, `DELETE /users/:id`, `PUT /users/:id/role`, `PUT /users/:id/credits`

Mocks: mailer functions

| Route | Tests | Scenarios |
|-------|-------|-----------|
| `GET /users` | 3 | 200 list, 401 no token, 403 blocked user |
| `GET /users/:id` | 3 | 200 by ID, 404 valid ID not found, 400 malformed ID |
| `PUT /users/:id` | 3 | 200 name updated, 400 empty body, 409 email taken by other user |
| `DELETE /users/:id` | 2 | 204 admin deletes, 403 non-admin |
| `PUT /users/:id/role` | 3 | 200 admin changes role, 400 invalid role, 403 non-admin |
| `PUT /users/:id/credits` | 2 | 200 admin adds credits, 400 negative amount |

---

## Running the tests

```bash
# Run all tests
npm test

# Run only unit tests (excludes integration/)
npm run test:unit

# Run only integration tests
npm run test:integration

# Run with coverage report
npx jest --coverage

# Run a single file
npx jest --testPathPatterns='schema'
```

## CI pipeline

Tests run automatically on every pull request via `.github/workflows/jest-test.yml`:

- **Node.js**: 22
- **Runner**: `ubuntu-latest`
- **MongoDB binary**: cached in `~/.cache/mongodb-binaries` across runs
- **Flags**: `--runInBand` (serial execution), `--coverage`, `--passWithNoTests`
- **Required env vars injected at the step level** (all dummy values — every external service is mocked):

| Variable | Purpose |
|----------|---------|
| `SECRET_KEY` / `JWT_KEY` | JWT signing/verification |
| `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET` | S3 module initialization |
| `STRIPE_SECRET_KEY` | Stripe lazy-singleton guard |
| `OPENAI_API_KEY` | OpenAI client initialization |
| `EMAIL_USER`, `EMAIL_PASSWORD` | Nodemailer transport creation |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Passport Google strategy |
| `MONGO_URL` | `dbConnect()` unit tests |

A separate job in `.github/workflows/pre-commit.yml` runs ESLint (`--max-warnings=0`) and `tsc --noEmit` on every pull request.