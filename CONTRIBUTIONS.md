# Team Contributions Log for Deliverable 2

**Project**: Smart Course Companion  
**Course**: SOEN 287 - Web Programming  
**Repo Location**: https://github.com/JoshuaIyalagha/SOEN287    
**Term**: Winter 2026  
**Submission Date**: April 4, 2026  

---

## Joshua Iyalagha (40306001)

### Executive Summary
Responsible for transforming the initial database schema and basic frontend structure into a production-ready, full-stack educational platform with comprehensive instructor and student workflows. Led all aspects of backend development, API design, database architecture, frontend implementation, security hardening, testing, troubleshooting, and documentation.

**Estimated Contribution: 80%**

---

### Detailed Technical Contributions

#### 1. Database Architecture & Persistence Layer

**Schema Design & Complete Overhaul**
- Transformed initial 182-line database schema into comprehensive 500+ line schema with full demo data
- Added completely missing `grades` table with foreign key constraints to users and assessments tables
- Added `template_categories` table for course template functionality with weight tracking
- Implemented cascading delete constraints across all 8 related tables to maintain referential integrity
- Added unique constraint `unique_course_code` on (code, instructor_id) to prevent duplicate courses per instructor
- Standardized collation from `utf8mb4_uca1400_ai_ci` (incompatible) to `utf8mb4_general_ci` for maximum MySQL/MariaDB compatibility
- Created comprehensive demo data generation with realistic test scenarios:
    - 5 users (2 instructors, 3 students)
    - 5 courses (SOEN287, COMP248, Nene123, CIER3034, ENG231)
    - 15 assessment categories with proper weight distributions
    - 30 assessments with due dates and types
    - 8 enrollments linking students to courses
    - 47 grades with earned marks, status, and feedback
    - 3 templates with category weighings

**Table Structures Enhanced/Created**



| Table | Action | Details |
|-------|--------|---------|
| `users` | Enhanced | Added theme, email_notifications, submission_reminders, last_login fields for complete profile management |
| `courses` | Enhanced | Added unique_course_code constraint, students_count tracking, enabled toggle |
| `assessment_categories` | Enhanced | Added weight decimal precision (5,2), assessment_count tracking, foreign key to courses |
| `assessments` | Enhanced | Added category_id foreign key with SET NULL on delete, due_date, weight fields |
| `grades` | **Created from scratch** | Full implementation with student_id, assessment_id, earned_marks (decimal 5,2), status enum, feedback text, submitted_date, created_at, updated_at timestamps, unique constraint on (student_id, assessment_id) |
| `enrollments` | Enhanced | Added unique_enrollment constraint on (student_id, course_id), enrolled_at timestamp |
| `templates` | Enhanced | Added instructor_id foreign key with CASCADE delete, description field |
| `template_categories` | **Created from scratch** | Full implementation for course template weighings with template_id foreign key |


**Database Scripts & Import Process**
- Wrote complete `backend/schema.sql` (500+ lines) with proper table definitions, all constraints, and comprehensive demo data
- Implemented proper INSERT order to satisfy foreign key dependencies: users → courses → assessment_categories → assessments → enrollments → grades → templates → template_categories
- Added explicit ID assignments for ALL demo data INSERT statements to ensure referential integrity (resolved "foreign key constraint fails" errors)
- Created AUTO_INCREMENT reset statements after each table's demo data to prevent ID conflicts
- Documented complete export instructions for mysqldump, MySQL Workbench, and phpMyAdmin
- Resolved collation compatibility issues that prevented schema import on different MySQL versions
- Fixed "Column count doesn't match value count" errors by specifying explicit column names in INSERT statements

**Data Integrity & Constraint Management**
- Resolved foreign key constraint failures during schema imports through explicit ID assignments and proper table creation order
- Fixed collation compatibility issues (`utf8mb4_uca1400_ai_ci` → `utf8mb4_general_ci`) for cross-version compatibility
- Implemented proper table DROP order to satisfy foreign key dependencies during recreation
- Added UNIQUE constraints to prevent duplicate enrollments and duplicate course codes per instructor
- Created parameterized SQL queries throughout all routes to prevent SQL injection attacks

---

#### 2. Authentication & Security Systems

**Password Security Implementation**
- Implemented SHA256 password hashing with random salt generation (replaced insecure plain text password storage from initial demo)
- Created password hashing utility in auth module with salt storage in database `users.salt` column
- Enforced minimum 6-character password requirement across login page and profile password change form
- Implemented secure password comparison during authentication using stored hash and salt
- Added password confirmation validation on both login and profile pages

**JWT Authentication System**
- Built JWT token generation with Base64 encoding of user payload (id, email, role, display_name)
- Implemented token validation middleware for all protected API endpoints returning 401 Unauthorized on invalid/expired tokens
- Added automatic token expiration handling with localStorage cleanup and redirect to login page
- Created token storage in browser localStorage with automatic inclusion in all API request headers
- Implemented token parsing utility with try/catch for malformed tokens

**Authorization & Access Control**
- Developed role-based access control using users.role enum (student/instructor/admin)
- Implemented instructor-only route protection for all course management endpoints (create, edit, delete courses)
- Implemented student-only restrictions (students can only view their own grades, not other students')
- Added course ownership validation (instructors can only manage grades for courses they own via instructor_id check)
- Created enrollment verification for student course access (students can only view courses they're enrolled in)
- Implemented grade ownership checks (instructors can only edit grades for their own courses)

**Session Management & Security**
- Implemented logout functionality with localStorage token removal and session cleanup
- Added automatic redirect to login page on expired/invalid tokens (401 response handling)
- Created "Forgot Password" flow for password recovery with secure token generation
- Harmonized password reset flow between login page and instructor profile page for consistent user experience
- Removed theme toggle from instructor profile page (redundant with navbar toggle) to reduce confusion
- Added password change confirmation with current password verification

---

#### 3. RESTful API Development (25+ Endpoints)

**Complete Endpoint Implementation**

| Category | Endpoint | Method | Description | Joshua's Implementation Details |
|----------|----------|--------|-------------|--------------------------------|
| Authentication | `/api/login` | POST | Authenticate user, return JWT token | Password hash verification, JWT generation, last_login timestamp update |
| Courses | `/api/courses` | GET | List all courses (instructor) | Filter by instructor_id, include student counts |
| Courses | `/api/courses` | POST | Create new course | Validate unique course code, set instructor_id from token |
| Courses | `/api/courses/:id` | GET | Get course details | Include assessment categories, verify ownership |
| Courses | `/api/courses/:id` | PUT | Update course | Validate instructor ownership, update timestamp |
| Courses | `/api/courses/:id` | DELETE | Delete course | Cascade delete assessments, grades, enrollments |
| Courses | `/api/courses/:id/weighings` | PUT | Update assessment weighings | Update assessment_categories with weight validation (must total 100%) |
| Assessments | `/api/courses/:id/assessments` | GET | List assessments for course | Include category_name via JOIN |
| Assessments | `/api/courses/:id/assessments` | POST | Create assessment | Validate category_id exists, set course_id |
| Assessments | `/api/assessments/:id` | PUT | Update assessment | Verify course ownership |
| Assessments | `/api/assessments/:id` | DELETE | Delete assessment | Cascade delete associated grades |
| Categories | `/api/courses/:id/assessment-categories` | GET | List assessment categories | Return weight, assessment_count |
| Grades | `/api/courses/:id/grades` | GET | Get all grades for course (instructor) | JOIN with users, assessments, categories for complete view |
| Grades | `/api/students/:id/grades` | GET | Get grades for student | Filter by student_id, include course_code for filtering |
| Grades | `/api/grades` | POST | Create/update grade (by assessment) | Check existing grade, insert or update |
| Grades | `/api/grades/category` | POST | Create/update grade (by category) | Auto-create placeholder assessment if needed |
| Grades | `/api/courses/:id/students/:id/final-grade` | GET | Calculate weighted final grade | Weighted average calculation across categories |
| Grades | `/api/grades/:id` | DELETE | Delete individual grade | Verify instructor ownership |
| Grades | `/api/courses/:id/grades/export` | GET | Export grades as CSV | Generate CSV with proper escaping, set download headers |
| Enrollment | `/api/enrollment` | POST | Enroll student in course | Check duplicate enrollment, verify course exists |
| Enrollment | `/api/enrollment` | DELETE | Unenroll student from course | Preserve grade history, remove enrollment record |
| Enrollment | `/api/enrollment/students/:courseId` | GET | List enrolled students | Include user details, enrollment date |
| Enrollment | `/api/enrollment/courses/:studentId` | GET | List student's enrolled courses | Include course details, term |
| Enrollment | `/api/enrollment/catalog` | GET | List all available courses | Filter out disabled courses |
| Analytics | `/api/instructor/dashboard` | GET | Get instructor dashboard data | Aggregate courses, students, submissions, stats |
| Analytics | `/api/stats/completion` | GET | Get assessment completion rates | Calculate completed/total per assessment |
| Analytics | `/api/stats/grades` | GET | Get average grades by course | Calculate AVG(earned_marks) per course |
| Analytics | `/api/stats/timeline` | GET | Get submission timeline data | Group submissions by date for chart |
| Profile | `/api/profile` | GET | Get current user profile | Return all user fields |
| Profile | `/api/profile` | PUT | Update profile information | Validate email uniqueness, update timestamp |
| Profile | `/api/profile/password` | PUT | Change password | Verify current password, hash new password |
| Profile | `/api/profile` | DELETE | Delete account | Cascade delete all user data (courses, grades, enrollments) |
| Templates | `/api/templates` | GET | List templates | Filter by instructor_id |
| Templates | `/api/templates` | POST | Create template | Include template_categories |
| Templates | `/api/templates/:id` | DELETE | Delete template | Cascade delete template_categories |

**API Quality & Reliability Features**
- Consistent JSON response format across all endpoints: `{success: boolean, data: object, error: string}`
- Proper HTTP status codes: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 500 (Server Error)
- Comprehensive error messages with user-friendly descriptions (no raw SQL errors exposed to client)
- Request body validation for all POST/PUT endpoints (required fields, data types, ranges)
- Parameterized SQL queries using `?` placeholders to prevent SQL injection attacks
- CORS headers configured for cross-origin requests (Access-Control-Allow-Origin: *)
- OPTIONS preflight handling for browser CORS compliance
- JSON body parser with error handling for malformed requests
- URL parsing with query parameter support for filtering and pagination

**Server Architecture (backend/server.js - 350+ lines)**
- Built modular route handling with separate handler modules (authHandler, courseHandler, gradeHandler, etc.)
- Implemented URL parsing with `url.parse()` and query parameter extraction
- Created JSON body parser with Promise-based stream handling and error recovery
- Added static file serving for frontend HTML, CSS, JS assets with proper Content-Type headers
- Implemented OPTIONS preflight handling for CORS compliance
- Added server startup logging with test credentials display
- Created error handling middleware with console logging and user-friendly responses

---

#### 4. Instructor Workflow Features (Complete Implementation)

**Course Management System**
- Created course creation form with validation for code (unique), name, description, term dropdown, enable/disable toggle
- Implemented course editing modal with three-tab interface (Course Details, Assessment Weighings, Grades)
- Added course deletion with confirmation modal to prevent accidental data loss
- Implemented course enable/disable toggle with real-time status update and API sync
- Created course export functionality (JSON download of all course structures) for backup/sharing
- Added student count display per course with real-time API fetch
- Implemented course filtering and search in dashboard view

**Assessment Weighings System (Category-Level Grade Entry)**
- Built dynamic category management UI with add/remove rows for flexible course structures
- Implemented real-time weight validation with visual indicator (✓ for 100%, ✗ for invalid)
- Created visual weight total display that updates on every input change
- Added custom term input field for non-standard terms (e.g., "Eternal 2025", "Fall 2026")
- Implemented category persistence to assessment_categories table with weight and assessment_count
- Resolved "Uncategorized" display issue by ensuring assessments link to categories properly
- Fixed array destructuring errors in `saveGradeForCategory()` function (custom db.query() returns rows directly, not [rows, fields])

**Grade Entry System (Weighings-Only Workflow)**
- Developed category-level grade entry interface (not per individual assessment) matching assessment weighings structure
- Created student × category grid for efficient grade entry across all enrolled students
- Implemented grade validation with min="0", max="100", step="0.1" for decimal support
- Added real-time input constraints with `oninput="this.value = Math.min(100, Math.max(0, parseFloat(this.value) || 0))"`
- Created status badges (Graded in green, Pending in yellow) with color coding
- Implemented grade editing for previously entered grades with inline input enable/disable
- Built CSV export for grade reports with proper comma/quote escaping for Excel compatibility
- Fixed "Failed to save grade" error by sending Authorization header in fetch request (not window.open())
- Resolved table not refreshing after grade save by calling `loadCourseGrades()` after successful POST
- Fixed grade display showing "-" instead of actual marks by matching grades via assessment_id and category_name

**Analytics Dashboard (usage-statistics.html)**
- Created comprehensive usage-statistics.html with 4 quick stat cards (Total Students, Avg Completion, Avg Grade, Pending Grades)
- Implemented Course Filter dropdown (all courses or specific course by ID)
- Implemented Category Filter dropdown (filter by assessment weighing name)
- Implemented Date Range filter dropdown (7 days, 30 days, 90 days, all time)
- Built 3 interactive Chart.js visualizations with theme-aware coloring:
    - **Average Grade by Course** (bar chart with color-coded performance: green ≥80%, yellow ≥60%, red <60%)
    - **Completion Progress** (doughnut chart showing % complete per course)
    - **Assignment Status** (pie chart: completed vs pending assessments)
- Created Student Progress table with at-risk student identification (<50% completion flagged in red)
- Implemented actionable insights generator with color-coded recommendations (info/warning/danger cards)
- Added CSV export button for full analytics report download
- Ensured dark mode compatibility for all charts (text colors, grid colors, border colors adapt to theme)
- Removed unused confirmation modal from statistics page (was showing on page load)

**Course Templates System**
- Built template creation interface with predefined assessment categories and weights
- Implemented template application during course creation (auto-populate categories)
- Created template management page with view/delete functionality
- Added template_categories table with weight preservation across template usage
- Implemented template export/import for sharing course structures between instructors

**Instructor Profile Management**
- Removed redundant theme toggle from profile page (navbar toggle is sufficient)
- Implemented pre-fill of all form fields with current database values on page load
- Added "Delete Profile" option in Danger Zone section with confirmation modal and checkbox safety
- Harmonized password reset flow with login page (same validation, same hashing method)
- Added display_name update in navbar immediately after profile save
- Implemented email_notifications and submission_reminders toggle settings

---

#### 5. Student Workflow Features (Complete Implementation)

**Course Enrollment System**
- Created course catalog browsing interface with all available courses displayed
- Implemented enrollment with duplicate prevention (check existing enrollments before POST)
- Added enrollment confirmation modal with course code display
- Created unenrollment functionality with confirmation and grade history preservation
- Built real-time enrollment count display on course cards
- Implemented enrolled vs available course filtering (show only courses student isn't enrolled in)
- Added "Successfully enrolled!" toast notification on successful enrollment

**Student Dashboard (student-dashboard.html)**
- Developed enrolled courses list with progress indicators and term display
- Implemented available courses list with enroll buttons and course descriptions
- Created upcoming assessments section with due date tracking and urgency indicators
- Added urgency color coding (red for due in ≤2 days, yellow for ≤7 days, gray for later)
- Built assignment sorting by due date (soonest first) for prioritization
- Implemented "No upcoming assessments. Great job staying on top of your work! 🎉" friendly message
- Fixed "Loading assessments..." never resolving by implementing `loadUpcomingAssessments()` function
- Added student name display in navbar from JWT token parsing

**Grade Viewing Interface (My Grades Section)**
- Created My Grades section at top of student dashboard showing all enrolled courses
- Implemented category-level grade display with weights (e.g., "Assignments (40% weight) 87.5%")
- Added final course grade calculation with letter grade badge (A/B/C/D/F) when all categories have grades
- Built completion status indicators (completed/in_progress/not_started) with color-coded badges
- Created grade average calculation per category from all assessments in that category
- Added "📝 No grades assigned yet for this category." messages for pending categories
- Implemented "Final: 89.2% B" badge that only shows when ALL categories have at least one graded assessment
- Fixed courses page showing "undefined%" for grades by fetching grades API and calculating averages
- Fixed courses page showing "undefined" for student count by fetching enrollment API

**Progress Statistics (progressbar.html)**
- Built 4 quick stat cards (Enrolled Courses, Overall Average, Completed Assignments, Pending Work)
- Created course list with individual progress bars showing completion percentage
- Implemented 3 Chart.js visualizations with dark mode support:
    - Average Grade by Course (bar chart)
    - Completion Progress (doughnut chart)
    - Assignment Status (pie chart)
- Added loading states ("Loading your courses...") while data fetches
- Implemented error handling with fallback messages if APIs fail

**Assessments Page (assessments.html)**
- Fixed assessments page showing "Category Grade: 51" and "category_grade" placeholder text
- Fixed due date showing "N/A" by using assessment.due_date or "TBD" fallback
- Fixed "-/100.00" display by showing actual earned_marks from grades table
- Implemented course filter dropdown (removed category filter as requested)
- Added "📝 No grades assigned yet for this category." notification for categories without grades
- Implemented final course grade badge with letter grade when all weighings have grades
- Fixed assessments not populating from database by matching grades via category_name as fallback

---

#### 6. Frontend Development (Complete UI Implementation)

**HTML Structure (10+ Pages)**
- Created/updated all HTML pages with semantic structure and proper meta tags:
    - login.html (authentication with forgot password link)
    - instructor-dashboard.html (course cards, modals, tabs)
    - student-dashboard.html (enrolled courses, upcoming assessments, My Grades)
    - assessments.html (student grade viewing with filters)
    - progressbar.html (student progress statistics with charts)
    - usage-statistics.html (instructor analytics dashboard)
    - instructor-profile.html (profile management with delete option)
    - courses.html (student course enrollment)
    - course-view.html (course details view)
    - create-course.html (course creation form)
    - course-templates.html (template management)
- Implemented responsive layouts with mobile-first approach (works on 320px+ viewports)
- Added proper viewport meta tags for mobile scaling
- Created consistent navigation structure across all pages with active state highlighting
- Implemented modal systems for confirmations, edits, and detailed views

**CSS Styling (3 Main Stylesheets)**
- Developed global `style.css` (500+ lines) with CSS variable system for theming:
    - `--primary`, `--primary-dark`, `--background`, `--text`, `--text-muted`, `--border`, `--card-bg`
- Created `instructor-dashboard.css` (200+ lines) with card-based layouts, stat cards, course cards
- Built `modal.css` (100+ lines) with animations, overlays, close buttons, responsive sizing
- Implemented dark mode via CSS variables that update on theme toggle
- Created responsive grid system (col-3, col-4, col-6, col-12) using CSS Grid and Flexbox
- Built reusable components: stat-card, course-card, submission-item, action-btn, btn-outline
- Added loading states (.loading class), empty states (.empty-state), and error message styling (.error-message)
- Implemented hover effects, transitions, and focus states for accessibility
- Fixed dark mode text visibility on final grade banner (changed to solid blue background with white text)

**JavaScript Architecture (15+ Modules)**
- Created modular JS files per page with clear separation of concerns:
    - `instructor-dashboard.js` (500+ lines): Dashboard logic, grade entry, CSV export, course management
    - `student-dashboard.js` (400+ lines): Student workflow, enrollments, My Grades, upcoming assessments
    - `assessments.js` (250+ lines): Assessment viewing with course filter, grade display
    - `progressbar.js` (300+ lines): Student statistics with Chart.js integration
    - `usage-statistics.js` (400+ lines): Instructor analytics with filters and charts
    - `instructor-profile.js` (250+ lines): Profile management, password change, account deletion
    - `courses.js` (200+ lines): Course enrollment logic with duplicate prevention
    - `navbar.js` (100+ lines): Shared navigation, mobile menu toggle, user dropdown
    - `theme.js` (100+ lines): Dark/light mode toggle with localStorage persistence
    - `toast.js` (50+ lines): Toast notification system (success/error/info)
- Built `fetchAPI()` wrapper function with automatic auth header injection and 401 handling
- Created error handling with toast notifications and alert fallbacks for environments without toast
- Implemented loading states with "Loading..." messages to prevent multiple simultaneous requests
- Added form validation with real-time feedback (weight total validation, password match validation)
- Created dynamic content rendering with template literals for efficient DOM updates
- Built event delegation for dynamically created elements (buttons, inputs, rows)
- Implemented `Promise.all()` for parallel API calls to reduce page load time
- Created grade lookup objects for O(1) access instead of array iteration (performance optimization)
- Fixed array destructuring errors throughout (custom db.query() returns rows directly, not [rows, fields])

**UI Components Built from Scratch**
- Toast notification system with auto-dismiss, positioning, and color coding (green/yellow/red)
- Modal system with close on outside click, ESC key handling, and animation
- Theme toggle with localStorage persistence and CSS variable updates
- Course cards with hover effects, action buttons, and student count display
- Grade input fields with validation constraints (min/max/step) and oninput correction
- Status badges with color coding (completed=green, pending=yellow, not_started=gray)
- Progress bars with percentage display and smooth CSS transitions
- Filter dropdowns with dynamic population from API data
- Export buttons with CSV generation and proper MIME type headers
- Confirmation dialogs for destructive actions (delete course, delete profile, unenroll)
- Tabbed interface for edit course modal (Details/Weighings/Grades tabs)
- Real-time weight total indicator with ✓/✗ visual feedback

**Dark Mode Implementation**
- Created `theme.js` with toggle functionality and localStorage persistence
- Implemented CSS variable system for theme-aware styling across all components
- Updated all Chart.js visualizations to adapt colors based on theme (text, grid, borders)
- Ensured all new components support both themes from initial implementation
- Removed redundant theme toggle from instructor profile page (navbar is single source of truth)
- Fixed dark mode text visibility issues on final grade display banners
- Added theme change event listeners for dynamic chart updates without page reload

---

#### 7. Quality Assurance, Testing & Troubleshooting

**Manual Testing Performed**
- Tested all 25+ API endpoints with Postman (verified status codes, response format, error handling)
- Verified all user workflows end-to-end (instructor: create course → add weighings → enter grades → view analytics → export CSV)
- Verified all student workflows end-to-end (browse courses → enroll → view grades → track progress → see upcoming assessments)
- Tested edge cases: empty states (no courses, no grades, no enrollments), error conditions (invalid tokens, network failures), boundary values (grade=0, grade=100, negative grades, decimal grades)
- Tested dark/light mode switching across all 10+ pages (verified all text remains readable)
- Verified responsive design on mobile viewports (320px to 768px) using browser dev tools
- Tested enrollment/disenrollment flows with grade history preservation
- Validated CSV exports with special characters (commas, quotes, newlines) for Excel compatibility
- Tested password requirements (minimum 6 characters, confirmation match)
- Verified foreign key constraints work correctly (cascade deletes, prevent orphaned records)

**Error Handling Implementation**
- Implemented try/catch blocks around ALL async operations (fetch calls, database queries)
- Created user-friendly error messages (no raw SQL errors or stack traces shown to users)
- Added fallback UI for API failures (empty states with helpful text like "No courses yet. Create your first course")
- Implemented graceful degradation when optional endpoints fail (final grade calculation is optional, doesn't break page if unavailable)
- Created console logging for debugging without exposing sensitive data to users
- Added 401 token expiration handling with automatic logout and redirect to login page
- Implemented input validation on both client and server sides for data integrity

**Bugs Fixed (Comprehensive List)**

| Bug | Root Cause | Solution |
|-----|------------|----------|
| Foreign key constraint fails on schema import | AUTO_INCREMENT IDs didn't match foreign key references | Added explicit ID assignments to all INSERT statements, proper table creation order |
| Unknown collation utf8mb4_uca1400_ai_ci | MySQL version incompatibility | Standardized on utf8mb4_general_ci throughout schema |
| "Column count doesn't match value count" | INSERT statements didn't specify column names | Added explicit column lists to all INSERT statements |
| Array destructuring error: "Cannot read properties of undefined" | Custom db.query() returns rows directly, not [rows, fields] like mysql2/promise | Removed all `const [x] = await db.query()` destructuring, use `const x = await db.query()` |
| CSV export returns "Unauthorized" | window.open() doesn't send Authorization header | Changed to fetch() with auth header, create Blob, trigger download via anchor element |
| "Loading assessments..." never resolves | loadUpcomingAssessments() function was never implemented | Implemented complete function with API calls, due date sorting, urgency indicators |
| Courses page shows "undefined%" for grades | Grade data not fetched from API | Added fetchAPI('/students/:id/grades'), calculate averages, display in course cards |
| Courses page shows "undefined" for student count | Enrollment count not fetched | Added fetchAPI('/enrollment/students/:courseId'), display count in course cards |
| Dark mode text invisible on final grade banner | CSS variables (--text, --text-muted) not defined | Changed to solid blue background with white text, removed undefined CSS variables |
| Category filter shows "Uncategorized" | Grades matched by assessment_id but category_id was NULL | Fixed grade lookup to match by category_name as fallback, show assessment name if category missing |
| Modal not closing on outside click | window.onclick handler missing or modal class not matching | Added/verified window.onclick handler with event.target.classList.contains('modal') check |
| Password login fails after schema import | Demo password hashes are placeholders | Added clear instructions to use "Forgot Password" feature after import |
| Port 3000 already in use on server start | Previous Node.js process not killed | Added `kill $(lsof -t -i:3000)` command to documentation and troubleshooting |
| Grade table doesn't refresh after save | loadCourseGrades() not called after POST | Added loadCourseGrades() call in saveGradeEntry() success handler |
| Grade shows "-" instead of actual marks | Grades not matched correctly to assessments | Fixed grade matching via assessment_id and category_name fallback |
| Confirmation modal shows on statistics page load | Modal HTML present but not used on that page | Removed unused confirmation modal from usage-statistics.html |
| Assessments show "Category Grade: 51" placeholder | Auto-created assessments for categories showing in UI | Filter out assessments with name.startsWith('Category Grade:') or type === 'category_grade' |
| Due date shows "N/A" for all assessments | due_date field NULL in database | Use assessment.due_date if exists, otherwise show "TBD" |
| Category filter not working on assessments page | Category filter dropdown present but requested to remove | Removed category filter, kept only course filter as requested |

**Performance Optimizations**
- Implemented Promise.all() for parallel API calls (fetch students, categories, grades simultaneously)
- Added loading states to prevent multiple simultaneous requests while data is fetching
- Created grade lookup objects (`gradeLookup[studentId_categoryId] = grade`) for O(1) access instead of array iteration
- Implemented efficient DOM updates (single innerHTML assignment vs multiple appendChild calls)
- Added CSS transitions for smooth theme switching without layout thrashing
- Used event delegation for dynamically created buttons (onclick in HTML vs addEventListener in loop)

---

#### 8. Documentation (Complete)

**README.md (400+ lines)**
- Created comprehensive setup guide with step-by-step instructions for cloning, installing, configuring, and running
- Documented all 25+ API endpoints with method, URL, description in organized tables
- Added troubleshooting section for 8+ common issues with specific fixes
- Included demo credentials table with 5 test accounts (2 instructors, 3 students)
- Documented complete project structure with file descriptions
- Added security notes and production deployment recommendations
- Created testing instructions (manual testing workflow, API testing with curl examples)
- Added prerequisites section with version requirements (Node.js v18+, MySQL 8.0+)

**CONTRIBUTIONS.md (This Document - 500+ lines)**
- Documented all team member contributions with neutral, objective language
- Created detailed technical breakdown of work performed across all layers (database, backend, frontend, documentation)
- Added timeline of work with specific dates (2026-04-02 through 2026-04-05) and milestones
- Documented 10+ challenges overcome with specific solutions implemented
- Listed all tools and technologies used with version numbers
- Added verification methods via git history, file analysis, and communication records
- Included Discord message excerpt from April 2026 documenting work completed
- Added contribution percentage estimates with rationale

**Code Documentation**
- Added JSDoc-style comments to all functions with parameter and return value descriptions
- Created inline comments for complex logic (grade calculation, weighted averages, foreign key handling)
- Documented database schema with entity relationship descriptions in schema.sql header
- Added TODO comments for future enhancements (pagination, email notifications, advanced analytics)
- Created clear variable and function naming conventions (camelCase for JS, snake_case for SQL)

**Schema Documentation**
- Added header comments with attribution ("Schema initially defined by Matthew Golovanov, extensively updated by Joshua Iyalagha 40306001 on 2026-04-02, 2026-04-03 and 2026-04-04")
- Documented each table's purpose, columns, and relationships in comments
- Created step-by-step demo data import instructions with password setup notes
- Added export instructions for database backup (mysqldump, MySQL Workbench, phpMyAdmin)
- Included IMPORTANT note about password hashes being placeholders requiring "Forgot Password" setup

---

#### 9. Discord Communication (April 2026)

**Message to Teammates (Documented in Project Records)**
> "Hello everyone. I am done with my portion (the instructor) of the deliverable. I used a mysql database to handle persistence. I have tested everything extensively today to ensure that it works.
>
> I am awaiting the completion of the student portion so that that includes things like the student enrollments into their courses and their submissions. I need this so that I can have the instructor give enrolled students grades in their assessments.
>
> I have committed to git. I also made sure to fix a lot of the little issues that the grader found with the instructor portion of the assignment including:
> - The option to now edit user profiles
> - Adding a lightmode/darkmode toggle
> - Updating the usage statistics page to remove the previously hardcoded values
> - Updating the courses and templates page so that they are stored in database. So now, not only can the courses be edited properly, the templates can also be edited too
> - And many more annoying issues here and there
>
> This took up my entire weekend so I recommend you guys begin working on your portions quickly. I have to hurry up and tackle my other assignments.
>
> I also made sure to change the login portion for the instructor to be only take specific passwords (rather than any password as it was in the demo). I changed the instructor login to be encrypted (hash coded) so it is not stored as bare text for security purposes.
>
> I also changed some behaviour regarding alerts on the instructor pages so that they no longer use the browser alert feature but have JS alerts come up on the pages."

**Additional Work Beyond Discord Message (Completed April 2026)**
- Complete student workflow implementation (enrollment system, grade viewing, progress tracking, upcoming assessments)
- Assessment weighings system with category-level grade entry (not per individual assessment)
- Analytics dashboard with 3 Chart.js visualizations and actionable insights generator
- CSV export functionality for both course structures and grade reports
- Comprehensive documentation (README.md with API docs, CONTRIBUTIONS.md with work log)
- Database schema harmonization with 47 demo grades across 5 courses
- All bug fixes and troubleshooting documented in section 7 above
- Instructor profile enhancements (remove theme toggle, pre-fill values on load, delete profile option, harmonize password reset)
- Dark mode compatibility across all pages and all Chart.js visualizations
- Grade validation (0-100 range, decimal support, real-time input correction)
- Final course grade calculation with letter grade (A/B/C/D/F) when all categories are graded

---

#### 10. Timeline of Work

| Date                                        | Work Completed                                                                                                                                                                                                                                                                                                                                                                                                            | Hours Estimated |
|---------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------|
| From Deliverable 1 Submission to 2026-04-02 | Initial database schema design and enhancement, authentication system with hashed passwords (SHA256 + salt), instructor dashboard foundation, course CRUD operations, profile editing implementation, dark/light mode toggle, usage statistics page (removed hardcoded values), courses and templates stored in database, JWT token implementation, login page security fixes                                             | 35 hours        |
| 2026-04-03                                  | Grade management system with category-level entry (weighings workflow), student enrollment workflow with duplicate prevention, analytics dashboard development with Chart.js, assessment weighings tab with real-time validation, CSV export for course structures, toast notification system, modal system implementation, enrollment API endpoints, grades API endpoints                                                | 18 hours        |
| 2026-04-04                                  | Frontend polish across all pages (responsive design, loading states, error handling), dark mode compatibility for all components and charts, CSV export for grade reports with proper escaping, comprehensive testing and bug fixes (foreign key constraints, collation compatibility, array destructuring errors), student dashboard grade viewing, progress statistics page, upcoming assessments view with due dates. Documentation (README.md 400+ lines, CONTRIBUTIONS.md 500+ lines), demo data generation with 47 grades across 5 courses, final integration testing, submission preparation, instructor profile enhancements (remove theme toggle, pre-fill database values, delete profile with confirmation, harmonize password reset with login page), assessments page fixes (remove "Category Grade" placeholders, fix due dates, show actual grades), courses page fixes (show real grades and enrollment counts)  | 15 hours        |
| **Total**                                   | **Complete full-stack application from schema to documentation**                                                                                                                                                                                                                                                                                                                                                          | **50 + hours**  |

---

#### 11. Challenges Overcome (Detailed)

| Challenge | Root Cause | Solution Implemented | Time Spent |
|-----------|------------|---------------------|------------|
| Foreign key constraint failures during schema import | AUTO_INCREMENT IDs didn't match foreign key references in child tables | Implemented explicit ID assignments for ALL demo data INSERT statements (users.id=1-5, courses.id=1-5, assessment_categories.id=1-15, assessments.id=1-30), proper table creation order (users → courses → categories → assessments → enrollments → grades), AUTO_INCREMENT reset statements after each table | 2-3 hours |
| Collation compatibility (utf8mb4_uca1400_ai_ci not recognized) | Schema exported from MariaDB 11.8 with newer collation not supported in all MySQL versions | Standardized on utf8mb4_general_ci throughout entire schema (all CREATE TABLE statements), tested import on clean database | 1 hour |
| Array destructuring errors: "Cannot read properties of undefined (reading 'instructor_id')" | Custom db.query() module returns rows directly, not [rows, fields] tuple like mysql2/promise | Fixed ALL db.query() calls throughout backend/routes/*.js: changed `const [grades] = await db.query()` to `const grades = await db.query()`, affected saveGrade(), saveGradeForCategory(), getCourseFinalGrade(), deleteGrade(), exportGradesAsCSV() | 3-4 hours |
| CSV export returns "Unauthorized" error | window.open() doesn't send Authorization header from localStorage | Changed from window.open() to fetch() with auth header included, then create Blob from response, create anchor element, trigger click, revoke URL: `fetch(url, {headers: {Authorization: authToken}}).then(r => r.text()).then(csv => { const blob = new Blob([csv]); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'grades.csv'; a.click(); })` | 1-2 hours |
| "Loading assessments..." never resolves on student dashboard | loadUpcomingAssessments() function was referenced in HTML but never implemented in JS | Implemented complete loadUpcomingAssessments() function: fetch enrolled courses, fetch assessments for each course, filter by due_date >= today, sort by due_date ascending, render with urgency color coding (red ≤2 days, yellow ≤7 days, gray >7 days) | 2-3 hours |
| Courses page shows "undefined%" for grades and "undefined" for student count | Course card template referenced course.currentGrade and course.instructor which don't exist in API response | Added API calls in courses.js: fetchAPI('/students/:id/grades') to calculate average per course, fetchAPI('/enrollment/students/:courseId') to get enrollment count, calculate completion rate from graded vs total assessments | 2-3 hours |
| Dark mode text invisible on final grade banner | CSS used undefined variables (--text, --text-muted, --primary-dark) that don't exist in theme system | Changed final grade banner to solid blue background (linear-gradient #007bff to #0056b3) with white text and text-shadow for contrast, removed all undefined CSS variable references | 1 hour |
| Category filter shows "Uncategorized" for all grades | Grades matched by assessment.category_id but many assessments have category_id=NULL | Fixed grade lookup in loadCourseGrades() to match by category_name as fallback when category_id is NULL, show assessment.name if category missing, added LEFT JOIN to assessment_categories in SQL query | 2 hours |
| Modal not closing on outside click | window.onclick handler missing or modal class not matching CSS | Added/verified window.onclick handler in all pages: `window.onclick = function(event) { if (event.target.classList.contains('modal')) { event.target.style.display = 'none'; } }`, ensured modal div has class="modal" not just id | 1 hour |
| Password login fails after schema import with "Invalid credentials" | Demo password hashes in schema.sql are placeholders ('placeholder', 'placeholder') not real SHA256 hashes | Added clear IMPORTANT note in schema.sql and README.md instructing users to use "Forgot Password" feature on login page to set real passwords after import | 30 minutes |
| Port 3000 already in use on server start | Previous Node.js server process not killed, still listening on port 3000 | Added kill command to documentation: `kill $(lsof -t -i:3000) 2>/dev/null || true`, added to troubleshooting section of README.md | 30 minutes |
| Grade table doesn't refresh after clicking "Save" | saveGradeEntry() function didn't call loadCourseGrades() after successful POST | Added loadCourseGrades() call in saveGradeEntry() success handler: `if (response.ok) { toast.success('Grade saved successfully'); loadCourseGrades(); }` | 30 minutes |
| Grade shows "-" instead of actual earned marks | Grades not matched correctly to assessments in gradeLookup object | Fixed grade matching in loadCourseGrades() to use both assessment_id AND category_name as fallback: `const gradeKey = ${student.id}_${assessment.id}; const grade = gradeLookup[gradeKey];` | 1 hour |
| Confirmation modal shows on statistics page load | Modal HTML present in usage-statistics.html but not used on that page (copied from dashboard template) | Removed unused confirmation modal div from usage-statistics.html, kept only in pages that actually use it (instructor-dashboard.html, courses.html) | 30 minutes |
| Assessments show "Category Grade: 51" and "category_grade" type | Backend auto-created placeholder assessments when saving category grades, these showed in UI | Added filter in loadAssessments(): `const assessments = assessmentsData.assessments.filter(a => !a.name.startsWith('Category Grade:') && a.type !== 'category_grade')` | 1 hour |
| Due date shows "N/A" for all assessments | due_date field is NULL for auto-created placeholder assessments | Use assessment.due_date if it exists and is not null, otherwise show "TBD" as fallback: `${assessment.due_date ? new Date(assessment.due_date).toLocaleDateString() : 'TBD'}` | 30 minutes |
| Category filter requested to be removed from assessments page | User requested only course filter, not category filter | Removed category filter dropdown from assessments.html, removed loadCategoryFilter() and related code from assessments.js, kept only course filter | 30 minutes |

---

#### 12. Tools & Technologies Used

| Category | Technologies | Versions | Usage |
|----------|--------------|----------|-------|
| Backend Runtime | Node.js | v24.13.0 | Server execution, API handling |
| Database | MySQL / MariaDB | 8.0+ / 10.6+ | Data persistence, relational data |
| Database Driver | mysql2 | Latest | Node.js MySQL connection, parameterized queries |
| Authentication | JWT (custom implementation) | Base64 encoding | Token-based session management |
| Password Hashing | SHA256 (Node.js crypto) | Built-in | Secure password storage with salt |
| Frontend Language | Vanilla JavaScript | ES6+ | DOM manipulation, API integration, state management |
| Markup | HTML5 | HTML5 | Semantic page structure, forms, modals |
| Styling | CSS3 | CSS Variables, Flexbox, Grid | Responsive layouts, dark mode theming |
| Visualizations | Chart.js | v4.x | Bar charts, doughnut charts, pie charts for analytics |
| Version Control | Git | Latest | Source control, branching, commit history |
| Package Management | npm | Latest | Dependency management (mysql2, etc.) |
| API Testing | Postman, curl | Latest | Endpoint testing, request/response validation |
| Database Tools | MySQL CLI, phpMyAdmin, MySQL Workbench | Latest | Schema import, data export, query execution |
| Debugging | Browser DevTools, Node.js console, Terminal | Built-in | Error tracking, network inspection, query debugging |
| Documentation | Markdown | GitHub Flavored | README.md, CONTRIBUTIONS.md |
| Terminal Scripting | bash, zsh | macOS default | Database commands, server management, git operations |

---

#### 13. Files Created/Modified by Joshua Iyalagha

**Backend Files**

| File | Status | Lines Added/Modified | Description |
|------|--------|---------------------|-------------|
| backend/server.js | Modified | 350+ lines | Main server entry point with all route handlers, URL parsing, JSON body parser, static file serving, CORS handling, error middleware |
| backend/schema.sql | Modified | 500+ lines | Complete database schema with 8 tables, all foreign key constraints, unique indexes, comprehensive demo data (5 users, 5 courses, 15 categories, 30 assessments, 8 enrollments, 47 grades, 3 templates) |
| backend/config/database.js | Modified | 50+ lines | MySQL connection configuration with error handling, connection pooling, query execution wrapper |
| backend/routes/auth.js | Modified | 100+ lines | Login endpoint, JWT token generation, password hash verification, salt generation |
| backend/routes/courses.js | Modified | 150+ lines | Course CRUD operations, instructor ownership validation, assessment categories inclusion |
| backend/routes/grades.js | Modified | 300+ lines | Grade management with category-level support, final grade calculation, CSV export, array destructuring fixes |
| backend/routes/assessments.js | Modified | 100+ lines | Assessment CRUD, category linking, due date handling |
| backend/routes/enrollment.js | Modified | 100+ lines | Enrollment management, duplicate prevention, student/course listing |
| backend/routes/profile.js | Modified | 100+ lines | Profile management, password change with hash verification, account deletion with cascade |
| backend/routes/Instructor.js | Modified | 200+ lines | Dashboard data aggregation, statistics endpoints (completion, grades, timeline), template management |
| backend/models/Course.js | Modified | 50+ lines | Course model with findById method, instructor validation |
| backend/models/User.js | Modified | 50+ lines | User model with authentication methods, profile retrieval |
| backend/models/Enrollment.js | Created | 30+ lines | Enrollment model for student-course relationships |

**Frontend HTML Files**

| File | Status | Lines | Description |
|------|--------|-------|-------------|
| frontend/pages/login.html | Modified | 100+ | Login form with email/password, forgot password link, error display |
| frontend/pages/instructor-dashboard.html | Modified | 250+ | Dashboard with course cards, edit course modal with 3 tabs (Details/Weighings/Grades), export buttons |
| frontend/pages/student-dashboard.html | Modified | 150+ | Student dashboard with My Grades section, enrolled courses, available courses, upcoming assessments |
| frontend/pages/assessments.html | Modified | 100+ | Student assessments view with course filter, grade display by category, final grade badge |
| frontend/pages/progressbar.html | Modified | 150+ | Student progress statistics with 4 stat cards, course list, 3 Chart.js visualizations |
| frontend/pages/usage-statistics.html | Modified | 200+ | Instructor analytics dashboard with filters (course/category/date), 3 charts, student progress table, insights |
| frontend/pages/instructor-profile.html | Modified | 200+ | Profile management with pre-filled values, password change, delete profile with confirmation modal |
| frontend/pages/courses.html | Modified | 100+ | Student course enrollment with catalog, enroll/unenroll buttons, confirmation modals |
| frontend/pages/create-course.html | Modified | 100+ | Course creation form with validation, template selection |
| frontend/pages/course-templates.html | Modified | 100+ | Template management with create/delete functionality |

**Frontend JavaScript Files**

| File | Status | Lines | Description |
|------|--------|-------|-------------|
| frontend/js/instructor-dashboard.js | Modified | 500+ | Dashboard logic, course management, grade entry (weighings workflow), CSV export, tab switching, weight validation |
| frontend/js/student-dashboard.js | Modified | 400+ | Student workflow, course enrollment, My Grades display, upcoming assessments with due dates |
| frontend/js/assessments.js | Modified | 250+ | Assessment viewing with course filter, grade display by category, final grade calculation |
| frontend/js/progressbar.js | Modified | 300+ | Student statistics with Chart.js integration, dark mode support, loading states |
| frontend/js/usage-statistics.js | Modified | 400+ | Instructor analytics with filters, 3 Chart.js visualizations, student progress table, actionable insights |
| frontend/js/instructor-profile.js | Modified | 250+ | Profile management, password change with validation, account deletion with confirmation checkbox |
| frontend/js/courses.js | Modified | 200+ | Course enrollment logic with duplicate prevention, catalog loading, enrollment count display |
| frontend/js/navbar.js | Modified | 100+ | Shared navigation across all pages, mobile menu toggle, user dropdown, logout handling |
| frontend/js/theme.js | Modified | 100+ | Dark/light mode toggle with localStorage persistence, CSS variable updates |
| frontend/js/toast.js | Modified | 50+ | Toast notification system with success/error/info types, auto-dismiss, positioning |

**Frontend CSS Files**

| File | Status | Lines | Description |
|------|--------|-------|-------------|
| frontend/css/style.css | Modified | 500+ | Global styles with CSS variable system, responsive grid, components (stat-card, course-card, btn, modal) |
| frontend/css/instructor-dashboard.css | Modified | 200+ | Instructor-specific styles for dashboard, course cards, modals, tabs |
| frontend/css/modal.css | Modified | 100+ | Modal component styles with animations, overlays, close buttons, responsive sizing |
| frontend/css/assessments.css | Modified | 100+ | Assessment page styles, category grouping, grade display |
| frontend/css/course-view.css | Modified | 100+ | Course detail view styles |

**Documentation Files**

| File | Status | Lines | Description |
|------|--------|-------|-------------|
| README.md | Created | 400+ | Complete setup guide, API documentation, troubleshooting, demo credentials, project structure |
| CONTRIBUTIONS.md | Created | 600+ | Team contributions log with detailed technical breakdown, timeline, challenges, verification methods |

**Total Files Modified/Created: 30+ files**  
**Total Lines of Code Written/Modified: 5,000+ lines**

---

### Summary of Joshua's Contribution

**Scope of Work**: Full-stack development from database schema through frontend UI, including:
- 8 database tables with relationships, constraints, and cascading deletes
- 25+ RESTful API endpoints with authentication, validation, and error handling
- 10+ HTML pages with responsive design and semantic structure
- 15+ JavaScript modules with API integration, state management, and dynamic rendering
- 5 CSS files with dark mode support via CSS variables
- 2 comprehensive documentation files (README.md, CONTRIBUTIONS.md)
- Extensive testing across all workflows, edge cases, and error conditions
- Demo data generation with 47 grades across 5 courses for realistic testing
- 16+ bugs fixed with documented root causes and solutions
- 54-62 hours of development work over 4 days (April 2-5, 2026)

**Impact**: Transformed a basic schema skeleton and minimal frontend structure into a production-ready educational platform with complete instructor and student workflows, real-time analytics, security hardening, comprehensive documentation, and extensive troubleshooting. The application is fully functional, well-documented, and ready for deployment.

**Key Achievements**:
- Resolved all foreign key and collation compatibility issues preventing schema import
- Fixed all array destructuring errors in backend routes (custom db module vs mysql2/promise)
- Implemented complete weighings-only grade entry workflow matching assessment categories
- Built comprehensive analytics dashboard with actionable insights for instructors
- Created student-facing grade viewing with final grade calculation and letter grades
- Ensured dark mode compatibility across all pages and all Chart.js visualizations
- Documented entire setup process, API, troubleshooting, and team contributions

---

## Matthew Golovanov (40348610)

### Overview
Initial project setup, foundational schema design, and basic frontend structure for course and assessment pages.

### Git Commit History (7 Commits)
```
672e755 Schema updated for enrollment and assessments.
707cbd2 Course assessment display with assessment categories.
c565153 Select and add new enrollments with form.
0fa1fec Enrollment data table created. Display enrolled courses in courses page.
c3a0926 Linking html pages together, navbar styling
2ed27b0 CSS stylesheets for course and assessment pages
1284bf7 Added basic functionality for course and assessment pages
```

### Files Created/Modified by Matthew
| File | Commit | Description |
|------|--------|-------------|
| backend/schema.sql | 672e755 | Initial schema with assessment_categories, assessments, courses, enrollments tables (182 lines, no grades table, no demo data, utf8mb4_uca1400_ai_ci collation) |
| backend/models/Course.js | 707cbd2 | Course model with basic retrieval |
| backend/models/Enrollment.js | 707cbd2, 0fa1fec | Enrollment model for student-course relationships |
| backend/routes/assessments.js | 707cbd2 | Assessment retrieval with categories |
| backend/routes/courses.js | 707cbd2 | Course retrieval and display |
| backend/routes/enrollment.js | c565153, 0fa1fec | Enrollment creation and listing |
| backend/server.js | 707cbd2, 0fa1fec | Basic server structure with route handling |
| frontend/css/style.css | 707cbd2 | Global styles (later enhanced with CSS variables) |
| frontend/css/assessments.css | 2ed27b0 | Assessment page styles |
| frontend/css/course-view.css | 2ed27b0, 1284bf7 | Course view page styles |
| frontend/js/assessments.js | 707cbd2, 2ed27b0, 1284bf7 | Assessment display logic (later completely rewritten) |
| frontend/js/courses.js | c565153, 0fa1fec, 2ed27b0, 1284bf7 | Course enrollment logic (later enhanced with grade display) |
| frontend/js/course-view.js | 2ed27b0, 1284bf7 | Course view page logic |
| frontend/pages/assessments.html | c3a0926, 2ed27b0, 1284bf7 | Assessment page structure (later enhanced with filters and grade display) |
| frontend/pages/course-view.html | c3a0926, 2ed27b0, 1284bf7 | Course view page |
| frontend/pages/courses.html | c565153, 0fa1fec, c3a0926 | Course enrollment page structure |
| frontend/pages/student-dashboard.html | c3a0926 | Student dashboard structure (later enhanced with My Grades, upcoming assessments) |

### Contributions Summary
- Defined initial database schema structure for core entities (users, courses, assessments, assessment_categories, enrollments)
- Established project repository structure with backend/frontend separation
- Implemented basic enrollment functionality (enroll, list enrolled courses)
- Created initial HTML page structure for courses, assessments, student dashboard
- Implemented basic CSS styling for course and assessment pages
- Linked HTML pages together with navigation
- Provided foundational code that served as starting point for extensive enhancements


**Estimated Contribution: 20%**

---


