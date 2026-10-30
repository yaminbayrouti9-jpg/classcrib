# ClassCrib Client Operations Guide

This guide describes the features available in the ClassCrib application and gives school staff practical setup steps. The instructions apply after the version containing commit `db94041` has been deployed to the school's ClassCrib site.

ClassCrib's coins, home, bills, and market are educational simulations. They do not process real payments, hold real money, or provide investment advice.

## 1. Roles and access

- **Student:** views and submits assignments; uses the virtual learning and economy features allowed by their school.
- **Teacher:** manages their classes and assignments, reviews submissions, awards permitted rewards, and can use teacher AI tools.
- **School administrator:** manages school settings, staff accounts, classes, reward rules, behaviour rules, reports, parent invitations, and approvals.
- **Platform operator:** reviews prospective school signup requests. This is a separate account from a school administrator.
- **Parent or guardian:** sees read-only homework and behaviour information for the linked student.

Sign in at `https://classcrib.ae/login`. The app routes signed-in roles to their appropriate portal. If a role does not have access to a page, ask the relevant school administrator or platform operator to confirm the account role.

## 2. Establish the platform operator and onboard a school

### If a school administrator account already exists

1. Sign in as a **SchoolAdmin**.
2. Visit `/platform-admin/setup`.
3. If the initial operator has not been created, enter the operator's display name, username, and a password of at least 12 characters, then create the account.
4. Sign out and sign in with the operator credentials.
5. Open `/platform-admin/schools` to review incoming school applications.
6. Only one initial operator can be created. The setup page checks whether setup is already complete, and the server independently prevents a second creation.

### Approve a new school

1. The school contact visits `/signup`, selects **School**, and submits the school name, contact email, and proposed administrator account details.
2. The request is pending; it does not yet create an active school or administrator account.
3. A platform operator signs in and opens `/platform-admin/schools`.
4. Verify the school and contact details outside the application. Review each pending request and choose **Approve** or **Reject**. Add an internal review note if useful.
5. Approval creates the school and its SchoolAdmin account. Rejection does not create either account.
6. Tell the proposed administrator to sign in with the username and password provided in the application.
7. Decision emails are sent only if the email service is configured. If no email is sent, contact the requester securely.

### Important initial-provisioning prerequisite

The one-time operator setup does not require an operator setup token, but it does require an existing SchoolAdmin account. If the platform has neither a school administrator nor an operator, a hosting/database administrator must provision the initial administrator using the deployment's existing bootstrap process. School users cannot bypass that prerequisite from the public signup page.

## 3. School administrator: create teachers and classes

### Create one teacher

1. Sign in as a SchoolAdmin and open `/school-admin`.
2. In **Create teacher account**, enter the teacher's name, a unique username, and a temporary password of at least 10 characters.
3. Select **Create teacher**.
4. Give the teacher their username and temporary password through a secure channel. Passwords are stored as hashes; the portal does not display a password-recovery link.
5. Assign the teacher to a class when creating the class.

### Import multiple teachers from CSV

1. In `/school-admin`, go to **Import teacher accounts from CSV**.
2. Download the CSV template or prepare a UTF-8 CSV with these required headers:

   ```csv
   username,displayName,password
   teacher01,Teacher One,TemporaryPassword123
   teacher02,"Teacher, Two",AnotherTemporary123
   ```

3. Each username must be unique and use letters, numbers, periods, underscores, or hyphens. Each password must be 10–128 characters.
4. Either choose the `.csv` file or paste its contents into the text box. Imports are limited to 500 accounts and 250 KB.
5. Select **Import teachers**. A bad row or username conflict prevents the whole import; correct the CSV and submit it again.
6. Distribute the imported temporary passwords securely. Do not send a CSV containing passwords through an unapproved channel or leave it in a shared folder.

The dedicated teacher importer creates Teacher accounts only. It cannot grant SchoolAdmin access. The separate student import section can import students and assign them to selected classes.

### Create one student

1. On `/school-admin`, use **Create student account**.
2. Enter the student's name, a unique username, and a temporary password of at least 10 characters.
3. Optionally enter the year group and house/team.
4. Select at least one class in the school, then choose **Create student account**.
5. Give the student their username and temporary password through a secure channel. Their account is added to the selected class or classes.

Create the class first if it is not listed. For multiple students, use the CSV import section, select the classes, and import the student records together.

### Create a class

1. On `/school-admin`, use **Create a class**.
2. Enter the class name, choose a teacher from the school roster, and optionally enter a year group.
3. Select **Create class**.
4. Repeat for each class. Teachers can then work with the classes assigned to them.

## 4. Teacher: assignments and class workflow

### Create and assign work

1. Sign in as a Teacher and open **Assignment Manager** (`/tasks`).
2. Start a new assignment.
3. Enter its title, instructions, assignment type, due date/time, and any reward amounts.
4. Choose one or more classes. If needed, target individual students instead of the whole class.
5. Optionally choose an assignment template or copy the last assignment.
6. Add attachments. Uploaded files support PDF, PNG, JPEG, WebP, or plain text and are limited to 4 MB each. Up to ten attachments can be added. HTTPS links are also supported.
7. Optionally choose a daily or weekly recurrence and an end date. Recurring copies are generated by the scheduled school job.
8. Optionally enable **Post assignment announcement to each selected class chat**.
9. Review the details, then publish the assignment.

Students see assignments for their classes and only assignments targeted to them or to the whole class. Teachers can review submissions from the assignment/class workflow.

### Assignment states and reminders

- **Active:** not overdue and still open.
- **Overdue:** past its due time and still outstanding.
- **Completed:** completed/submitted according to the student task workflow.
- Upcoming assignment reminders are generated by the scheduled school job. Assignment status updates in the app; reminder delivery timing depends on the deployment's scheduler.

### AI assistance for teachers

1. Open **AI Assistance** (`/teacher/assistant`).
2. Choose **Draft an assignment**, **Suggest rewards**, or **Summarize class progress**.
3. Select a class and, for a draft or reward suggestion, an assignment type and prompt.
4. Review the suggestion. AI output is advisory; the teacher decides what to publish or award.
5. For a draft, open Assignment Manager to edit and publish it.

AI requires the school's approved provider configuration. Do not enter sensitive student information into prompts. Student prompts and optional images may be sent to the configured AI provider; chat text is stored by ClassCrib. The AI tools are not a substitute for teacher judgment or financial advice.

### Reward students

1. Open the teacher reward workflow for a class.
2. Select the students, enter the reward amounts and a reason, then submit.
3. Review any AI reward suggestion as guidance only; the teacher chooses the amount.
4. Awards within the school's configured limits are processed and logged.
5. Awards over configured caps are held for SchoolAdmin approval; do not promise a student that an over-cap award is granted until approved.

The school administrator can review pending approvals and the reward audit log from `/school-admin`.

### Behaviour points

1. Open **Behaviour** (`/behavior`) as a teacher.
2. Select the student/class, choose a configured category, enter positive or negative points, and provide a reason.
3. Submit the entry. If the configured rules require approval, it remains pending for the SchoolAdmin.
4. Approved points contribute to the relevant student, class, year, school, or team totals. Configured negative-point coin deductions and positive-point coin bonuses are virtual and remain subject to school caps.
5. Corrections should use the reversal workflow so the original entry and reversal remain auditable.

## 5. School administrator: settings, reports, and approvals

Open `/school-admin` to:

- Review student, teacher, class, assignment, completion, engagement, and overdue metrics.
- View the seven-day activity pulse, Hall of Fame, and school-wide behaviour totals.
- Set the leaderboard audience to class, year group, or school.
- Turn school-level switches on or off for username search, coin gifting, class chat, the trading terminal, Cribby AI, leaderboards, and weekly parent email.
- Set reward caps per assignment type and per student/day.
- Configure behaviour categories, point limits, daily limits, coin deductions/bonuses, and whether above-cap items require administrator approval.
- Review pending teacher reward/behaviour approvals and make an approval decision.
- Review the paginated teacher reward audit log, which records recipient, awarder, coins, XP, reason, and date.

Save changes using the corresponding **Save** button or switch control. Revisit the portal after saving to confirm the displayed setting. Configure the rules with school leadership before enabling awards or behaviour consequences.

## 6. Parent or guardian accounts

### School creates the account and sets its initial password

1. Sign in as a SchoolAdmin and open `/school-admin`.
2. In **Create parent account and link a student**, enter the parent's name, email, and a new username.
3. Set a temporary password of at least 10 characters.
4. Choose the correct student from **Link to student**, then select **Create parent login and link student**.
5. The account and parent-to-student link are created together. The student must already exist in your school and be enrolled in a class to appear in the selector.
6. Give the parent their username and temporary password using a private, school-approved channel. Do not send credentials in class chat or email them together unless the school has approved that method.
7. The parent signs in at `/login`; their account is routed to the read-only `/parent` portal. Confirm the linked student is correct with the parent.

The password is hashed in the database and is not shown again by the portal. The school is responsible for delivering the temporary password securely. If the parent's email already belongs to a parent account, use the invitation flow below to link that existing account rather than creating a duplicate.

### Send an invitation

1. A Teacher opens `/parent/invite`.
2. Select the class and student, enter the parent/guardian email, and create the invitation.
3. If email delivery is configured, ClassCrib sends the invitation. Otherwise, copy the displayed invitation link and send it through a school-approved secure channel.
4. A new parent opens the link and creates their own username and password. If they already have a parent account for that email, they sign in first and accept the invitation to link the additional student.
5. The parent portal (`/parent`) is read-only and shows homework and behaviour information for linked students.

Weekly parent email requires both the school-level **Weekly parent email** switch and the scheduled school job. Email delivery also requires an approved provider configuration. If delivery is not configured, use the invitation link; do not assume a message was sent.

## 7. Student learning and virtual features

Students sign in with the account created by the school and can:

- Review active, overdue, and completed assignments; submit work or proof where the task requires it.
- View their class and school experience, rewards, XP, and progress.
- Use Cribby for study help where enabled by their school.
- Participate in class chat, username search, leaderboards, and coin gifts only where enabled by school/class settings.
- Use the Terminal, virtual home, simulated bills, and virtual assets as educational activities.

All coins, XP, gifts, bills, home purchases, and market trades are in-app simulation data. There is no checkout or real-money transfer. The simulated market can show cached or fallback data if a market provider is unavailable; it must not be used to make real financial decisions.

### Reliability and economy safeguards included

- Teachers do not receive student virtual-home fines or tax/bill notices.
- Assignment Manager is configured for direct navigation and refresh, not only in-app navigation.
- Header statistics use a shared short-lived cache and request deduplication, show a loading state, and avoid presenting a failed request as a real zero balance.
- Market loading has timeouts and fallback/retry behavior. Displayed prices can be cached or simulated when a provider is unavailable.
- Reward, submission, gift, bill, market, and virtual-home changes use server-side validation and duplicate-request protections in the applicable workflows.
- Coin gifts are virtual, have configured limits, and do not award XP for sending coins.
- Student leaderboards respect privacy mode and the configured audience.
- Cribby tips use student task information; overdue work can be identified in the task workflow.
- The app has a branded not-found page; the public homepage identifies its dashboard as a mockup and the virtual money experience is educational, not financial advice.

## 8. Safety, privacy, and content controls

- School feature switches and class controls limit selected student features.
- Class chat has a report action for inappropriate content. Teachers/school staff should follow the school's safeguarding and escalation process when a report is received.
- Cribby prompts are moderated, and the assistant is instructed not to provide personalized financial recommendations. Treat generated material as a suggestion, not verified advice.
- Assignment uploads are access-controlled, but the service does not provide malware scanning. Accept files only from trusted sources and follow school policy before opening them.
- Keep account credentials private and distribute temporary passwords securely.
- Do not upload student personal or sensitive information unless the school has approved the purpose and the applicable data handling.

## 9. Website and public information

- The marketing site is server-rendered and includes metadata, Open Graph metadata, `sitemap.xml`, and `robots.txt`.
- `/terms` and `/privacy` currently display placeholders. They are **not** the school's approved terms or privacy notice. ClassCrib must receive and publish client-approved text before these pages are relied on.
- Do not describe the product as approved, accredited, certified, compliant, or endorsed unless the client has independently verified and authorized that exact claim.

## 10. Client launch checklist and operational dependencies

Before students use the service, the client/school should complete and verify each item:

1. Confirm the correct production site and that the deployment includes the documented version.
2. Confirm a SchoolAdmin and platform operator can sign in; confirm the correct school and user roles.
3. Confirm MongoDB is configured as a replica set or compatible cluster. The application uses transactions for important workflows.
4. Confirm the scheduler calls `/api/cron/school-jobs` daily and the deployment has the required `CRON_SECRET`. Recurring work, reminders, weekly digests, and cleanup depend on this job.
5. Configure AI only after the school approves the provider, data sent, retention, region, contract, and consent requirements. AI features require `OPENAI_API_KEY`.
6. Configure email only after approval of the provider and data transfers. Email features require `RESEND_API_KEY` and `SCHOOL_EMAIL_FROM`; test delivery before relying on it.
7. Provide approved Terms and Privacy Policy content; review UAE PDPL obligations, data residency, retention/deletion, incident handling, subprocessors, consent, and student safeguarding with qualified decision-makers.
8. Back up the database and review existing production data before any cleanup. Demo/test accounts or anomalous balances are **not** automatically removed by this guide or by deployment.
9. Test school signup/approval, teacher and student creation, CSV errors/duplicates, class membership, assignments, file access, reward and behaviour approvals, parent invitations, feature switches, and scheduled jobs in staging.
10. Agree how schools distribute temporary passwords, respond to chat reports, handle account changes, and contact support.

## 11. Boundaries to understand

- The CSV workflow provisions accounts; it is not a full import/migration of every feature from another homework platform.
- Parent access is read-only. Email, reminders, and recurring assignment generation depend on infrastructure configuration and scheduled execution.
- Assignment type labels such as **Green** and **Physical** remain categories. Teachers should explain the school's intended activity and completion criteria to students.
- The terms and privacy pages need client-approved content.
- UAE legal, privacy, security, and trust claims on public pages have not been independently verified. Review exact wording with the client and qualified UAE counsel before launch; this guide is not a compliance determination.
- Production data has not been cleaned by this guide. Database changes and production cleanup require an authorized backup and review.
- A successful build does not prove that the live deployment, school database, email provider, AI provider, or scheduled jobs are correctly configured. Complete the staging checklist before launch.
