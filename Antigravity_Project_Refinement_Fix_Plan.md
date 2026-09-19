# Antigravity Project Refinement & Fix Plan

> **Purpose:** Fix the existing application systematically using Antigravity.  
> **Source:** Refinement notes provided in `Book 19 Sep 2026.pdf`.  
> **Important:** Fix one task at a time, test it, then move to the next. Do not rebuild the application from scratch.

---

## Master Instruction for Every Task

Paste this instruction before each task, or use it as the project's global instruction:

```text
You are working on an existing application. Your job is to modify the EXISTING codebase, not rebuild the application from scratch.

IMPORTANT RULES:
1. First inspect the existing project structure, routing, authentication, database models, API layer, components, state management, and relevant pages.
2. Identify the root cause of the issue before changing code.
3. Reuse the existing architecture, components, styling system, API patterns, and database models wherever possible.
4. Do NOT create duplicate pages, duplicate APIs, duplicate components, or parallel implementations.
5. Do NOT remove existing working functionality.
6. Do NOT change unrelated functionality.
7. Preserve the existing UI design language.
8. Make the implementation production-ready rather than using hardcoded/mock data.
9. If the feature requires backend/database changes, implement the complete frontend + backend + database flow.
10. Handle loading, empty, error, and success states properly.
11. Check authorization/RBAC before exposing protected functionality.
12. Make sure the implementation works for the correct user role.
13. After making changes, run the relevant build/lint/type checks and fix any errors introduced by your changes.
14. Test the affected flow end-to-end.
15. Before finishing, summarize:
    - root cause
    - files changed
    - what was implemented
    - tests performed
    - any remaining issue
16. Do not merely tell me how to fix it. ACTUALLY MODIFY THE CODEBASE.
```

---

# Phase 1 — Foundation

## TASK 1 — Fix Authentication Page Performance

```text
TASK 1 — FIX AUTHENTICATION PAGE PERFORMANCE

The authentication/login page has a long loading/wait time before the user can interact with it.

First inspect:
- authentication flow
- auth provider/context
- login page
- API calls made during initial render
- session/token validation
- route guards
- middleware
- database calls
- loading states
- unnecessary useEffect calls
- duplicate API requests

Find the actual bottleneck instead of simply adding a loading spinner.

Requirements:

1. Authentication UI should render immediately wherever possible.
2. Do not block the entire login page because of unnecessary background requests.
3. Avoid duplicate authentication/session API calls.
4. Check whether authentication state is being fetched multiple times.
5. Check whether the frontend is waiting for unrelated API requests before rendering.
6. Optimize unnecessary database/API calls.
7. If authentication verification is required, show a proper lightweight loading state only where necessary.
8. Prevent redirect loops.
9. Preserve existing authentication security.
10. Do not weaken authentication checks just to improve speed.

After implementation:
- test fresh page load
- test logged-out user
- test logged-in user
- test invalid credentials
- test successful login
- test page refresh
- test protected-route navigation

Measure/inspect the request sequence and explain what caused the delay.

Do not redesign the authentication UI unless necessary.
```

## TASK 2 — Fix Proctoring

```text
TASK 2 — FIX PROCTORING SYSTEM

The proctoring functionality is not working properly.

First inspect:
- camera permission handling
- webcam stream initialization
- face detection
- face availability detection
- monitoring loop
- violation detection
- browser permissions
- component lifecycle
- cleanup of MediaStream
- exam state
- proctoring state
- backend violation logging
- student/proctor communication if present

There is currently a problem where the proctoring behavior is inconsistent and appears to work only under certain face-availability conditions.

Fix the ROOT CAUSE.

Requirements:

1. Request camera permission at the correct time.
2. Correctly initialize the webcam.
3. Handle camera permission denial gracefully.
4. Detect whether a face is present.
5. Correctly distinguish:
   - face detected
   - face not detected
   - multiple faces detected, if supported by the existing design
   - camera unavailable
6. Do not continuously recreate the camera stream.
7. Do not create duplicate detection intervals.
8. Properly clean up camera streams and timers when leaving the exam.
9. Make proctoring status visible to the appropriate user.
10. Log violations using the existing backend/database mechanism.
11. Do not falsely mark a student as violating when the camera is temporarily initializing.
12. Do not allow the student to bypass required proctoring by simply manipulating frontend state.
13. Verify that protected proctored-exam routes enforce the required proctoring state.
14. Preserve privacy/security and existing permissions behavior.

Test:
- camera available + face visible
- camera available + face temporarily absent
- camera denied
- camera disconnected
- page refresh during exam
- entering exam
- leaving exam
- switching away if the existing system tracks this
- multiple detection cycles

Do not rewrite the entire proctoring system unless the existing implementation is fundamentally broken.
```

## TASK 3 — Fix Exam Fullscreen

```text
TASK 3 — FIX EXAM FULLSCREEN MODE

Before starting an exam, the application indicates/displays that the exam should enter fullscreen mode, but fullscreen is not actually working correctly.

Inspect:
- exam start flow
- fullscreen API implementation
- browser compatibility
- user interaction requirements
- fullscreen state
- exam initialization
- error handling
- exit-fullscreen handling

Implement a reliable fullscreen flow.

Expected behavior:

1. Before the exam starts, clearly communicate that fullscreen is required.
2. The fullscreen request must happen as a result of an appropriate user interaction because browsers restrict programmatic fullscreen.
3. Only start the actual exam/proctored session after the required fullscreen state is successfully established, if that is the existing business requirement.
4. If fullscreen permission/request fails, show a clear message and allow the user to retry.
5. Do not falsely display "fullscreen enabled" when the browser is not actually fullscreen.
6. Detect when the student exits fullscreen during an active exam.
7. Trigger the existing warning/violation behavior if the product requires it.
8. Do not create fullscreen loops.
9. Handle browser support gracefully.
10. Cleanly reset fullscreen-related state after the exam ends.

Test:
- entering exam
- successful fullscreen
- fullscreen denied
- exiting fullscreen during exam
- refreshing page
- finishing exam

Do not redesign unrelated exam functionality.
```

## TASK 4 — Fix Schedule Synchronization

```text
TASK 4 — FIX EXAM SCHEDULE DATA SYNCHRONIZATION

The Schedule section has inconsistent data across different tabs/views. Data changes made in one schedule-related view are not correctly reflected in other tabs, and date information is also inconsistent.

Inspect:
- schedule page
- all schedule tabs
- schedule API endpoints
- database model
- frontend state
- caching
- query invalidation/refetch logic
- date/time handling
- timezone handling
- create/update/delete schedule operations

Find the root cause.

Requirements:

1. All schedule tabs must use the same source of truth.
2. After creating a schedule, all relevant views must reflect it.
3. After editing a schedule, all relevant views must reflect the updated data.
4. After deleting/canceling a schedule, stale data must disappear.
5. Avoid duplicated local schedule state where possible.
6. Properly invalidate/refetch cached queries after mutations.
7. Check for stale React state.
8. Check date serialization between frontend/backend.
9. Check timezone conversion.
10. Display dates consistently.
11. Do not silently shift exam dates because of timezone conversion.
12. Existing schedules must continue to work.

Test:
- create schedule
- edit schedule
- change date
- change start/end time
- open another schedule tab
- refresh page
- reopen schedule
- test across different timezone-sensitive timestamps

Do not solve this by hard-refreshing the entire application after every action.
```

---

# Phase 2 — Academic Features

## TASK 5 — Add Materials Search

```text
TASK 5 — ADD SEARCH TO MATERIALS

The Materials section currently does not provide a working search feature.

First inspect:
- how materials are stored
- existing API/query
- available fields
- existing filters
- pagination
- UI components

Implement a proper search feature using the existing architecture.

Requirements:

1. Add a clearly accessible search input to Materials.
2. Search should work against actual material data.
3. Search should support relevant fields such as title/name and description where available.
4. Search should be case-insensitive.
5. Trim unnecessary whitespace.
6. Handle empty search correctly.
7. Show appropriate empty results state.
8. Show loading state.
9. Handle API errors.
10. Preserve existing category/subject/filter functionality.
11. If backend search is required, implement it properly instead of downloading every material to the browser unnecessarily.
12. Debounce search requests if appropriate.
13. Do not introduce duplicate search APIs.

Test:
- normal search
- lowercase/uppercase
- partial search
- no results
- empty search
- search + existing filters
- search after adding a material
- search after deleting a material
```

## TASK 6 — Add Forum Search

```text
TASK 6 — ADD SEARCH TO FORUM

The Forum section currently does not have a working search feature.

Inspect:
- posts
- discussions
- comments
- API
- database schema
- pagination
- filters
- sorting

Implement search using the existing architecture.

Requirements:

1. Add forum search UI.
2. Search actual forum content.
3. Search relevant fields such as post title, question, description/content, and other appropriate fields supported by the schema.
4. Make search case-insensitive.
5. Support partial matches.
6. Preserve existing sorting/filtering.
7. Handle empty results.
8. Handle loading and API errors.
9. Avoid fetching the entire forum dataset unnecessarily.
10. If server-side search is more appropriate, implement it in the backend.
11. Ensure pagination still works with search.
12. Clear/reset search correctly.

Test:
- exact search
- partial search
- uppercase/lowercase
- no result
- search + pagination
- search + existing filters
- clearing search
- new forum post appearing in search
```

## TASK 7 — Fix Language Switcher

```text
TASK 7 — FIX LANGUAGE SWITCHER

There is a language-change option in the application, but clicking/selecting a language does not actually change the application language.

Inspect:
- language selector
- i18n configuration
- translation files
- language state
- localStorage/cookie persistence
- routing
- components using hardcoded strings

Implement/fix the existing internationalization system.

Requirements:

1. Clicking a language option must actually update the selected language.
2. UI text must update without requiring a manual page refresh where technically possible.
3. Persist the selected language.
4. On the next visit, restore the selected language.
5. Ensure the selector displays the current language.
6. Avoid losing authentication/session state when changing language.
7. Do not break routing.
8. Handle missing translations gracefully.
9. Use existing translation infrastructure if present.
10. Do not duplicate translation systems.

Trace one language change from:
UI click → state update → translation system → rendered UI → persistence.

Test all currently supported languages in the project.
```

## TASK 8 — Fix MCQ/Inbox Search

```text
TASK 8 — FIX SEARCH IN THE MCQ / INBOX RELATED SECTION

There is a search-related functionality in the MCQ/inbox-related section that is currently not working correctly.

IMPORTANT:
Do not assume the exact component from this description alone.

First inspect the application and identify the section corresponding to the existing MCQ/inbox search UI mentioned in the refinement.

Then determine:
- which search input is intended
- what data it should search
- current frontend handler
- API endpoint
- database query
- filtering logic

Fix the existing functionality.

Requirements:
1. Clicking/focusing the search field must work correctly.
2. Typing must update search state.
3. Search must query the correct dataset.
4. Results must update correctly.
5. Empty search should restore the normal dataset.
6. Search should be case-insensitive where appropriate.
7. Handle no results.
8. Handle loading/error states.
9. Preserve pagination/filtering.
10. Do not create a second search component if one already exists.

After implementation, explicitly tell me which component/section you identified as the target and why.
```

## TASK 9 — Fix Notification Click

```text
TASK 9 — FIX NOTIFICATION CLICK BEHAVIOR

Clicking a notification currently does not produce the expected result.

Inspect:
- notification component
- notification data model
- notification API
- read/unread state
- notification IDs
- target URL/route
- navigation logic
- role-specific routes
- backend update logic

Determine what each notification is supposed to do based on the existing data/model.

Implement:

1. Clicking a notification must execute its intended action.
2. If it has a target page/entity, navigate to the correct destination.
3. Mark the notification as read when appropriate.
4. Persist read state in the backend if the existing architecture supports persistent notifications.
5. Update unread count correctly.
6. Handle notifications without a valid destination gracefully.
7. Prevent broken/undefined routes.
8. Do not navigate unauthorized users to protected resources.
9. Preserve notification dropdown/page behavior.
10. Handle API failures gracefully.

Test:
- unread notification
- read notification
- notification with destination
- notification without destination
- protected destination
- invalid/deleted destination
- refresh after reading
```

## TASK 10 — Fix Upcoming Events

```text
TASK 10 — FIX UPCOMING EVENTS

The Upcoming Events section is currently not displaying/working correctly.

Inspect:
- upcoming events component/page
- event API
- database model
- date/time fields
- filtering logic
- current-date calculation
- timezone handling
- event status

Expected behavior:

1. Fetch actual upcoming events from the existing backend/data source.
2. Do not use hardcoded events.
3. Only show events that are actually upcoming according to the application's business rules.
4. Correctly handle event start date/time.
5. Correctly handle expired events.
6. Handle today's events correctly.
7. Respect timezone consistently.
8. Show loading state.
9. Show empty state when there are no upcoming events.
10. Handle API errors.
11. Sort events chronologically where appropriate.
12. Respect the user's role if events are role-specific.

Test:
- event in future
- event today
- event in past
- multiple events
- no events
- page refresh
- different user roles
```

---

# Phase 3 — Exam Workflow

## TASK 11 — Fix Examiner Studio Dashboard

```text
TASK 11 — FIX EXAMINER STUDIO DASHBOARD

The Examiner Studio currently appears to show a student-oriented dashboard/content where examiner-specific functionality should be displayed.

Inspect:
- Examiner role
- Student role
- Admin role
- Proctor/Proctor Lead roles
- RBAC configuration
- authentication claims
- route guards
- dashboard routing
- sidebar/navigation
- dashboard components

The Examiner Studio must have an examiner-specific dashboard.

Requirements:

1. Identify the authenticated user's role from the authoritative backend/auth source.
2. Do not determine authorization only from frontend state.
3. Create/use a dedicated Examiner dashboard.
4. Examiner dashboard should contain examiner-relevant functionality already supported by the application, such as exam checking/grading workflows if those exist.
5. Remove student-specific dashboard content from Examiner Studio.
6. Ensure examiner navigation only exposes authorized examiner features.
7. Ensure direct URL access to student-only pages is blocked for examiners where appropriate.
8. Ensure students cannot access examiner pages.
9. Preserve existing functionality for all other roles.

IMPORTANT:
Do not invent completely new examiner functionality unless the existing project already defines it.

First inspect the current role architecture and reuse the existing capabilities.
```

## TASK 12 — Fix Exam Status/Lifecycle

```text
TASK 12 — FIX EXAM STATUS / SCHEDULE STATUS LOGIC

The Schedule section is showing an "Exam Done" status/label at incorrect times, including around exam launch/start states.

Inspect the complete exam lifecycle:

scheduled
→ launched
→ available/startable
→ in progress
→ submitted
→ completed
→ expired

Determine how the current application calculates exam status.

Fix the status state machine.

Requirements:

1. A scheduled exam must not be marked "Exam Done" merely because it has been launched or scheduled.
2. An exam should only become completed/done according to the application's actual completion condition.
3. Student submission must be correctly reflected.
4. Exam expiration must be distinguished from successful submission if the application supports that distinction.
5. Start time must not automatically mean completed.
6. End time should be handled according to the existing business rules.
7. Status must come from a consistent backend/source-of-truth calculation.
8. Frontend labels must match backend status.
9. Avoid deriving important exam status purely from client-side time calculations.
10. Fix both examiner and student views if they consume the same incorrect status.

Test every lifecycle state and verify the displayed label.
```

## TASK 13 — Fix Student Schedule View

```text
TASK 13 — FIX STUDENT SCHEDULE VIEW

The student-facing schedule is displaying incorrect information/state and does not properly represent the student's exam schedule.

Inspect:
- student dashboard
- student schedule
- schedule API
- exam enrollment/assignment relationship
- exam status
- start/end time
- completed/submitted state

Requirements:

1. Students should see only exams/events relevant to them.
2. Schedule data must come from the actual backend.
3. Correctly display upcoming exams.
4. Correctly display currently available exams.
5. Correctly display completed exams.
6. Do not show examiner/admin-only information.
7. Use correct exam dates and times.
8. Status labels must match actual exam state.
9. Start exam action must only be available when the exam is actually startable.
10. Completed exams must not incorrectly show "Start Exam."
11. Refreshing the page must not reset the exam state.

Test:
- upcoming exam
- active exam
- completed exam
- student with no exams
- multiple exams
```

## TASK 14 — Fix Start Proctored Exam State

```text
TASK 14 — FIX START PROCTORED EXAM STATE

The "Start Proctored Exam" flow is incorrectly showing/using the "Exam Done" state.

Trace the entire flow:

Student Schedule
→ Start Proctored Exam
→ eligibility check
→ fullscreen
→ camera/proctoring
→ exam session creation
→ exam UI
→ submission
→ completion

Find where the incorrect "Exam Done" state is being introduced.

Requirements:

1. A student who has not submitted/completed the exam must be allowed to start when eligible.
2. "Exam Done" must only be shown after the actual completion condition.
3. Starting an exam must not mark it as completed.
4. Opening the exam page must not mark it as completed.
5. Initializing proctoring must not mark it as completed.
6. Entering fullscreen must not mark it as completed.
7. Refresh/reconnect should preserve the correct session state.
8. Prevent duplicate exam sessions where required.
9. Preserve existing security restrictions.
10. Test the entire flow from schedule → exam → submission.

Check both frontend state and backend status updates.
```

---

# Phase 4 — Question Bank & Analytics

## TASK 15 — Fix Question Bank Subject Filter

```text
TASK 15 — FIX QUESTION BANK SUBJECT FILTER

In Question Bank, changing the Subject filter does not change the displayed questions.

Inspect:
- subject dropdown
- filter state
- question bank query
- API parameters
- backend filtering
- database query
- pagination
- cached query keys

Find the root cause.

Requirements:

1. Selecting a subject must update the filter state.
2. The selected subject must be passed to the correct API/query.
3. Backend must actually filter questions by subject.
4. Results must update immediately after filter change.
5. Clearing the subject should restore all permitted questions.
6. Pagination must reset appropriately after changing filters.
7. Search and subject filter should work together if both exist.
8. No stale results should remain.
9. Loading state should be handled.
10. Preserve authorization so users only see questions they are allowed to access.

Test:
- Subject A
- Subject B
- clear filter
- subject + search
- subject + pagination
- refresh
```

## TASK 16 — Fix Cohort Analysis

```text
TASK 16 — FIX COHORT ANALYSIS DASHBOARD/VIEW

The Cohort Analysis area appears to be showing student-dashboard-related content instead of the appropriate cohort-analysis functionality.

First inspect the current implementation and determine:
- who should access Cohort Analysis
- which role owns this feature
- existing cohort data
- existing analytics APIs
- dashboard routing

Fix the routing and component mapping.

Requirements:

1. Cohort Analysis must render its intended dashboard/view.
2. Remove accidental reuse of Student Dashboard where inappropriate.
3. Preserve existing cohort analytics functionality.
4. Ensure only authorized roles can access it.
5. Ensure direct URL access is protected.
6. Do not duplicate analytics logic if it already exists.
7. Use actual backend data.
8. Handle loading/error/empty states.

Verify that navigating:
Dashboard → Cohort Analysis
renders the correct page consistently after refresh and direct URL navigation.
```

---

# Phase 5 — RBAC & Role Dashboards

## TASK 17 — Fix Role-Based View Routing

```text
TASK 17 — FIX ROLE-BASED VIEW ROUTING

The application is incorrectly showing a Student View/dashboard to users who belong to other roles.

Audit:
- authentication user object
- role field/claims
- route guards
- dashboard redirect logic
- sidebar generation
- protected routes
- frontend role checks
- backend authorization middleware

Requirements:

1. Determine the user's role from the authoritative authentication/backend source.
2. Redirect users to the correct dashboard for their role.
3. Student → Student Dashboard.
4. Examiner → Examiner Dashboard.
5. Admin → Admin Dashboard.
6. Proctor/Proctor Lead → their appropriate dashboard.
7. Do not use hardcoded role assumptions.
8. Do not rely solely on localStorage for authorization.
9. Prevent unauthorized direct URL access.
10. Prevent incorrect dashboard flashes during authentication loading.
11. Preserve session persistence after refresh.

Audit all role-based routes rather than fixing only one URL.
```

## TASK 18 — Audit Admin and Proctor Lead

```text
TASK 18 — AUDIT ADMIN AND PROCTOR LEAD VIEWS

The same dashboard/view problems are also appearing for Admin and Proctor Lead roles.

Perform a role-by-role audit of:

- Admin
- Proctor
- Proctor Lead
- Examiner
- Student

For each role determine:
1. correct dashboard
2. correct sidebar/navigation
3. correct protected routes
4. correct API permissions
5. correct visible actions
6. correct data scope

Requirements:

- Admin must receive Admin-specific dashboard/navigation.
- Proctor Lead must receive Proctor Lead-specific dashboard/navigation.
- Examiner must receive Examiner-specific dashboard/navigation.
- Student must receive Student-specific dashboard/navigation.
- Proctor must receive Proctor-specific functionality if that role exists.

Use the existing RBAC architecture.

Also verify backend authorization for each role.

Create a concise role-access matrix after the implementation showing:

ROLE | DASHBOARD | ROUTES | MAJOR PERMISSIONS

Do not invent permissions that do not exist in the project.
```

## TASK 19 — Fix and Complete RBAC

```text
TASK 19 — FIX AND COMPLETE RBAC

The application's RBAC implementation is incomplete/inconsistent.

Audit the complete authorization architecture.

Identify all existing roles from the actual codebase and authentication system.

For each role determine:
- dashboard
- allowed routes
- allowed API endpoints
- allowed CRUD operations
- data visibility
- navigation items
- exam permissions
- question bank permissions
- schedule permissions
- grading/checking permissions
- proctoring permissions
- analytics permissions

Requirements:

1. Create a single authoritative role/permission model.
2. Avoid scattered hardcoded role checks throughout components.
3. Reuse existing RBAC infrastructure where available.
4. Frontend should hide unauthorized UI.
5. Backend must independently enforce authorization.
6. Direct URL access must be protected.
7. API endpoints must verify permissions.
8. A user must not gain access simply by manipulating frontend state/localStorage.
9. Preserve existing legitimate permissions.
10. Do not accidentally remove functionality from valid roles.

IMPORTANT:
Do not redesign the entire authorization architecture blindly.

First inspect the current implementation and identify the smallest safe set of changes required to make RBAC consistent.

After implementation, test each role against protected routes and APIs.
```

## TASK 20 — Implement Correct Role-Specific Dashboards

```text
TASK 20 — IMPLEMENT CORRECT ROLE-SPECIFIC DASHBOARDS

The application currently has dashboard/view overlap between roles. Different roles should have clearly separated dashboards according to their responsibilities.

First inspect the existing dashboard components and role definitions.

Create a clean role-to-dashboard mapping using the existing architecture.

Expected structure conceptually:

Student
→ Student Dashboard

Examiner
→ Examiner Dashboard

Proctor
→ Proctor Dashboard

Proctor Lead
→ Proctor Lead Dashboard

Admin
→ Admin Dashboard

IMPORTANT:
Use the actual roles found in the codebase. If a role does not exist, do not invent it.

Requirements:

1. Each role receives the correct dashboard.
2. Dashboards must not accidentally render another role's components.
3. Shared components may still be reused where appropriate.
4. Role-specific actions must be permission-controlled.
5. Sidebar/navigation must be role-specific.
6. Dashboard APIs must return only authorized data.
7. Direct navigation to another role's dashboard must be blocked.
8. Refresh must preserve correct role routing.
9. Loading state must not temporarily show the wrong dashboard.
10. Logout/login as another role must correctly switch dashboards without stale state.

After implementation, perform a complete role-switching test.
```

---

# Final Regression Audit

## TASK 21 — Full Application Audit

```text
FINAL AUDIT — DO NOT MODIFY RANDOMLY

All previously identified refinement issues have now been addressed.

Perform a complete regression audit of the application.

Audit these areas:

1. Authentication
2. Authentication performance
3. Role detection
4. RBAC
5. Student Dashboard
6. Examiner Dashboard
7. Proctor Dashboard
8. Proctor Lead Dashboard
9. Admin Dashboard
10. Schedule
11. Exam lifecycle/status
12. Start Exam
13. Proctored Exam
14. Fullscreen
15. Camera/proctoring
16. Question Bank
17. Materials
18. Forum
19. Notifications
20. Upcoming Events
21. Language selector
22. Cohort Analysis

For every area verify:

- UI works
- API works
- database interaction works
- authorization works
- loading state works
- empty state works
- error state works
- refresh works
- direct URL navigation works
- role restrictions work
- no stale data appears
- no console errors are introduced
- no duplicate API calls are introduced
- no existing functionality has been broken

IMPORTANT:
Do not make speculative redesigns.

If something is working correctly, leave it unchanged.

For every discovered problem:
1. identify root cause
2. fix it
3. test it
4. verify that the fix does not break another role/functionality

Run the project's available:
- build
- lint
- typecheck
- tests

At the end provide:

A. Issues found
B. Issues fixed
C. Files modified
D. Tests executed
E. Remaining known issues
F. Role-access matrix
G. Exam lifecycle verification
```

---

# Recommended Execution Order

Do **not** run the tasks randomly.

### Phase 1 — Foundation
1. Authentication performance
2. RBAC
3. Role-based routing
4. Role-specific dashboards

### Phase 2 — Exam Engine
5. Exam status/lifecycle
6. Student schedule
7. Start Proctored Exam
8. Fullscreen
9. Proctoring

### Phase 3 — Academic Features
10. Question Bank filter
11. Materials search
12. Forum search
13. Upcoming Events
14. Cohort Analysis

### Phase 4 — UI Functionality
15. Language switcher
16. Notifications
17. MCQ/Inbox search

### Phase 5 — Schedule
18. Schedule synchronization/date issues
19. Admin/Proctor Lead audit

### Phase 6 — Final
20. Complete regression audit

## Important

The **RBAC + dashboard issues should be fixed before the exam workflow**. Several refinement issues appear related to users receiving the wrong role-specific view. Fixing the authorization/routing foundation first reduces the chance of debugging the wrong dashboard/component.

---

## Completion Checklist

- [ ] Authentication performance fixed
- [ ] Proctoring fixed
- [ ] Fullscreen fixed
- [ ] Schedule synchronization fixed
- [ ] Materials search added/fixed
- [ ] Forum search added/fixed
- [ ] Language switcher fixed
- [ ] MCQ/Inbox search fixed
- [ ] Notification click fixed
- [ ] Upcoming Events fixed
- [ ] Examiner Studio fixed
- [ ] Exam status lifecycle fixed
- [ ] Student Schedule fixed
- [ ] Start Proctored Exam fixed
- [ ] Question Bank subject filter fixed
- [ ] Cohort Analysis fixed
- [ ] Role-based routing fixed
- [ ] Admin/Proctor Lead views audited
- [ ] RBAC completed
- [ ] Role-specific dashboards verified
- [ ] Full regression audit completed
- [ ] Build passes
- [ ] Lint passes
- [ ] Typecheck passes
- [ ] Tests pass
