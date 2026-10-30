# ClassCrib

ClassCrib is a school-oriented classroom and financial-literacy simulation built with Next.js, MongoDB, and NextAuth.

## Local development

1. Install dependencies with `npm install`.
2. Configure the required environment variables below in `.env.local`.
3. Run `npm run dev`.

Run `npx tsc --noEmit` and `npm run build` before deploying.

## Environment and infrastructure

Required in production:

- `MONGODB_URI` — MongoDB deployment. Multi-record workflows use transactions; production must use a replica set (MongoDB Atlas is suitable).
- `NEXTAUTH_SECRET` — a unique, high-entropy secret. Production startup fails if this is missing.
- `NEXTAUTH_URL` — the canonical HTTPS origin used for authentication and parent invite links.
- `OPENAI_API_KEY` — required for Cribby chat and teacher AI tools. Student prompts and optional images are sent to OpenAI; chat text is stored in ClassCrib. Review the provider contract, retention, region, and school consent before enabling the feature.
- `SCHOOL_BOOTSTRAP_TOKEN` — temporary secret for the one-time initial school administrator setup endpoint. Remove it after the first administrator is provisioned.
- `PLATFORM_ADMIN_USERNAMES` — optional legacy allowlist for existing `SchoolAdmin` accounts that need operator access to review signup requests. New operators use the separate `PlatformAdmin` role.
- `CRON_SECRET` — secret bearer token used by the scheduled school-jobs endpoint.

Optional:

- `RESEND_API_KEY` and `SCHOOL_EMAIL_FROM` — enable parent invitations, weekly digests, and school signup decision emails. Do not enable until the school has approved the email provider, data transfers, and processing terms.

Configure the deployment scheduler to invoke `/api/cron/school-jobs` daily with `Authorization: Bearer <CRON_SECRET>`. The included Vercel schedule runs daily at 07:00 UTC. Scheduled reminders and digests do not run without the scheduler and secret.

## School signup and operator review

1. Sign in as an existing `SchoolAdmin` and open `/platform-admin/setup`. The page requires an authenticated school administrator; a one-time transaction permits only the first operator account to be created across the platform.
2. Enter the operator display name, username, and a password of at least 12 characters. After creation, sign out and sign in with those operator credentials. The separate `PlatformAdmin` role grants access to `/platform-admin/schools`.
3. Prospective schools use `/signup`, choose **School**, and submit school/contact details and proposed administrator credentials. This creates a pending request only; it does not create an active school or grant access.
4. The operator opens `/platform-admin/schools` and verifies the school's identity/contact independently before approving.
5. Approval transactionally creates the school and its `SchoolAdmin` account. Rejection creates neither. The pending password hash is removed after a decision, which is recorded with reviewer and timestamp.
6. Decision emails require `RESEND_API_KEY` and `SCHOOL_EMAIL_FROM`. Without those settings, the operator must contact the requester manually.

## School setup and production rollout

1. Back up the database and remove demo accounts, test records, and anomalous balances using an authorized, reviewed data-cleanup procedure. This repository does not automatically delete production data.
2. Have an existing school administrator create the initial ClassCrib operator at `/platform-admin/setup`. `SCHOOL_BOOTSTRAP_TOKEN` remains available for the separate one-time direct school-admin bootstrap flow.
3. Migrate legacy classes and users to their correct school and year groups before enabling cross-class features. Review duplicate usernames, existing indexes, and existing chat-report records before index creation.
4. Configure each school's reward rules, feature switches, and classes. School administrators can create teacher accounts individually or import up to 500 teacher accounts from CSV at `/school-admin`; CSV files require `username`, `displayName`, and `password` columns, and the import is all-or-nothing. Share initial passwords with staff through a secure channel. Verify that administrative approval workflows and daily limits match the school's policy.
5. Supply school-approved Terms and Privacy Policy text. The current pages are placeholders and must not be treated as legal advice or as evidence of PDPL compliance.
6. Confirm UAE hosting/data residency, retention and deletion procedures, incident response, subprocessors, consent, and provider agreements with qualified counsel and school decision-makers before enrolling students.
7. Test a staging deployment with school-owned accounts and a replica-set database. Verify authentication, account recovery, class membership, assignments, approvals, scheduled jobs, backups, and monitoring before production use.

## Known operational boundaries

- Assignment files are stored in MongoDB GridFS (PDF, PNG, JPEG, WebP, or plain text; up to 4 MB), protected by class/assignment authorization, and downloaded as attachments. There is no malware-scanning service; schools should accept files only from trusted sources.
- Parent email is optional and requires the provider configuration above. A failed delivery leaves a copyable invite link for the teacher.
- This project has no configured automated test runner. A successful type-check or production build is not a substitute for workflow, concurrency, migration, privacy, or deployment testing.
- Do not describe the service as accredited, certified, compliant, endorsed, or production-ready without independent verification and school approval.
