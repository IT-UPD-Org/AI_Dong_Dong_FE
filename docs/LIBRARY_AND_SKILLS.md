# Shared library and system skills

## User access

- Open **Thêm… → Kho tri thức** (`/knowledge`) to browse shared documents.
- Students can browse and download. Teachers and administrators can also upload,
  edit title/description and delete shared documents. The backend enforces these
  permissions; hiding buttons is not the security boundary.
- Administrators also have **Kho tài liệu** at `/admin?tab=library`, using the
  same library component and API. Personal files under `/documents` are separate.
- Uploads convert the original document, build its shared RAG index, store its
  original file and save metadata. The UI waits for completion; it does not
  fabricate indexing progress. The existing backend per-file size limit applies.
- The quick title/filename/description filter applies only to the loaded page.
  The agent's existing `search_library` tool performs content retrieval across
  the shared indexed library.

## System skill administration

Open **Quản trị → Skills hệ thống** (`/admin?tab=skills`). Administrators can
create, edit, search and enable/disable instruction playbooks. A skill has:

- `slug`: lowercase letters/numbers separated by single hyphens, maximum 80 chars;
- `name`: 1–200 chars;
- `description`: 1–1000 chars explaining when to use it;
- `instructions`: 1–30000 chars of plain-text workflow instructions;
- `enabled`, creation time and update time.

Text is trimmed and required fields cannot be blank. Slugs are unique. Disabling
is the supported lifecycle operation; no permanent-delete action was added.
No default or sample skills are inserted automatically.

Skills are **not executable code or dynamically installed tools**. An enabled
skill is advisory guidance: it cannot override system/security rules or grant
permissions. The agent uses `list_skills` to retrieve bounded summaries and
`read_skill` to load only a relevant enabled skill. These tools read the database
on demand, so disabled skills are not served from a long-lived local cache.
Already-read instructions in an active conversation cannot be retroactively
removed from that conversation's context.

## API contracts

Existing library endpoints:

- `GET /api/library/documents?page=1&limit=20`
- `GET /api/library/documents/{id}`
- `POST /api/library/documents` (`multipart/form-data`: file, title, description)
- `PATCH /api/library/documents/{id}` (title and/or description)
- `DELETE /api/library/documents/{id}` (204)

Library list/detail/upload/update responses expose only the user-approved fields:
`id`, `title`, `description`, `filename`, `content_type`, `size`, `file_url`.
`uploaded_by` and `object_key` stay hidden.

New administrator-only skill endpoints:

- `GET /api/admin/skills?page=1&limit=20&q=...`
- `GET /api/admin/skills/{id}`
- `POST /api/admin/skills`
- `PATCH /api/admin/skills/{id}`

Each returns the approved DTO fields `id`, `slug`, `name`, `description`,
`instructions`, `enabled`, `created_at`, `updated_at`. Internal actor IDs remain
hidden. Duplicate slugs return 409; missing/invalid IDs return 404; malformed
fields and explicit null updates are rejected by validation. Omitted PATCH
fields are unchanged, including `enabled=false` being a valid explicit update.

## Deployment

1. Publish the shared DB library commit and update its submodule pointers in BE
   and Core (included in this change).
2. Deploy/restart BE and Core. Existing Beanie model registration creates the
   skill collection/indexes; no destructive data migration or seed is required.
3. Deploy the frontend. Its repository tracks generated `dist/` assets.

BE and Core must use the same configured MongoDB database for saved skills to be
available to the worker. No new configuration variables or runtime dependencies
are required. Core discovers the new tools during worker startup. The existing
library upload/indexing services (conversion, S3 and Qdrant) must be healthy.

## Verification results

- Shared DB: `uv run ruff check dongdong_db`, format check and `uv run ty check` passed.
- BE: `uv run ruff check src main.py` and `uv run ty check` passed after the DB update.
- Core: `uv run ruff check src`, format check for new skill tools, and `uv run ty check` passed.
- Manual BE schema/route inspection confirmed all four routes use the existing
  admin guard and return exactly the approved response fields. Null PATCH values
  and invalid slugs were rejected; `enabled=false` was retained correctly.
- Manual Core registry inspection found `list_skills` and `read_skill` without
  starting a worker or querying/mutating a database.
- Frontend: `corepack pnpm build` passed; `corepack pnpm test` passed **97 tests
  in 7 files**, including 12 focused library/skill regression checks.
- Local browser inspection with isolated mocked API data confirmed the teacher
  library list/upload form, accessible labels, Light/Dark modal/input colors and
  no root overflow at 320px. This is not a live storage/indexing integration test.
- Existing Vite large-chunk advisory remains; no TypeScript build errors.

## Verification boundaries

DB, BE and Core use Ruff/type checking and targeted manual schema/registration
inspection only; no tests are added or run in those repositories. Frontend
regression checks use mocked API responses and assert role visibility and
management behavior. A production document upload or saved skill was not created
as part of automated verification: end-to-end MongoDB/S3/Qdrant/worker behavior
must be confirmed after deployment with an administrator's intended content.
