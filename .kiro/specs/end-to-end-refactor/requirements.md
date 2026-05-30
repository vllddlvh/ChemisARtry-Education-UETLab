# Requirements Document

## Introduction

This feature is an end-to-end refactor of the ChemisARtry learning application. The work has two layers. First, the production build is currently broken and nothing runs until it is green again, so build restoration is the foundational requirement. Second, with the build healthy, the application is rebuilt to fully realize the learning-path vision described in the UX specification: a structured dashboard with "continue learning", two learning roads spanning 22 lessons, an onboarding flow, progress tracking with achievements, and a new navigation and route structure following the philosophy "Hiểu → Xem → Thực hành → Khám phá" (Understand → See → Practice → Explore).

Learning-path content (lessons, roads, lesson progress, streak, achievements) is sourced from local seed data and browser local storage, so it does not depend on a backend. Existing Supabase-backed data (molecules, reactions, user_progress) continues to use real data where it is already used; no Supabase schema expansion or new SQL is required. Both practice modes must work correctly: AR Lab (camera + MediaPipe hand tracking + Three.js overlay) and Simulation 3D (mouse drag, no camera), along with the Wet Lab scene.

The scope centers on core functionality working correctly. Testing infrastructure and peripheral concerns are out of scope.

## Glossary

- **ChemisARtry**: The web application being refactored, comprising the build pipeline, routing, UI pages, learning content, and 3D/AR practice modes.
- **Build_Pipeline**: The Vite production build process invoked via the project build command (Bun + Vite 7), which compiles and bundles the application.
- **Router**: The TanStack Router file-based routing subsystem that maps route files to navigable URLs.
- **Navigation_Bar**: The top navigation component (SiteHeader) presenting primary destinations and the Tools dropdown.
- **Landing_Page**: The static public page served at route `/`.
- **Auth_Page**: The sign-in and sign-up page served at route `/auth`, backed by Supabase authentication.
- **Onboarding_Flow**: The three-step first-run flow served at route `/onboarding`.
- **Dashboard**: The post-login home page served at route `/dashboard`.
- **Learning_Path_Overview**: The page served at route `/learn` showing both roads and their progress.
- **Road**: A structured sequence of lessons; Road 1 (Nguyên tố & Liên kết Hoá học, 12 lessons) and Road 2 (Phản ứng Hoá học, 10 lessons).
- **Road_Page**: The page served at route `/learn/road/:roadId` listing lessons of a road grouped by chapter.
- **Lesson**: A single learning unit with theory, 3D exploration, and practice content.
- **Lesson_Page**: The page served at route `/learn/road/:roadId/lesson/:lessonId` presenting a lesson across three tabs.
- **Sim_Mode**: The simulation practice mode served at route `/lab/sim`, using mouse drag without camera.
- **AR_Mode**: The augmented-reality practice mode served at route `/lab/ar`, using camera feed plus MediaPipe hand tracking and a Three.js overlay.
- **Wet_Lab**: The wet laboratory scene served at route `/lab/wet`, rendered by WetLabScene.
- **Lab_Scene_Renderer**: The shared Three.js rendering module (ARScene and its extracted helpers) used by practice modes.
- **Tools_Menu**: The dropdown in the Navigation_Bar linking to utility pages.
- **Periodic_Table_Page**: The page served at route `/tools/periodic-table`.
- **Explorer_Page**: The PubChem compound explorer page served at route `/tools/explorer`.
- **Molecules_Page**: The molecule library page served at route `/tools/molecules`.
- **Reactions_Page**: The reactions list page served at route `/tools/reactions`.
- **Progress_Page**: The page served at route `/progress` showing overall progress, road progress, and achievements.
- **Content_Store**: The local seed data and local-storage module providing lessons, roads, lesson progress, streak, and achievements without a backend.
- **PubChem_Adapter**: The `src/lib/pubchem-api.ts` module that searches PubChem and fetches molecule structures and descriptions.
- **Chemistry_Data_Service**: The data service (useChemistryData) that loads molecules and reactions from Supabase and merges optional external sources.
- **App_State_Store**: The global application state store introduced to replace prop-drilled state across lab and learning pages.
- **Reaction_Engine**: The rule-based module that matches reactant formulas to known reactions.
- **Design_System**: The shared visual language of ChemisARtry—one color palette, one typography scale, and one spacing scale—implemented through the shared Radix/Shadcn component set styled with Tailwind v4 and applied uniformly across all pages.
- **UI_Surface**: Any rendered route page or major view of ChemisARtry, including the Landing_Page, Auth_Page, Onboarding_Flow, Dashboard, Learning_Path_Overview, Road_Page, Lesson_Page, Sim_Mode, AR_Mode, Wet_Lab, the Tools utility pages, and the Progress_Page.
- **Toast_Notifier**: The transient toast notification component that presents success, error, and informational messages.
- **Breadcrumb_Trail**: The breadcrumb component shown inside a lesson that indicates the navigation path from the Dashboard to the current lesson.

## Requirements

### Requirement 1: Build restoration

**User Story:** As a developer, I want the production build to complete successfully, so that the application can run and all subsequent refactor work is unblocked.

#### Acceptance Criteria

1. THE PubChem_Adapter SHALL contain syntactically complete TypeScript with all type declarations, functions, and exports terminated, so that the module parses without an "Unexpected end of file" error.
2. WHEN the Build_Pipeline compiles the PubChem_Adapter, THE Build_Pipeline SHALL transform the module without an end-of-file transform error.
3. THE PubChem_Adapter SHALL export the functions consumed by its dependents, including compound search, molecule structure retrieval, and compound description retrieval.
4. THE Router SHALL define exactly one route handler for the URL path `/lab`, so that no duplicate route registration occurs between `lab.tsx` and `lab.index.tsx`.
5. WHEN the Build_Pipeline runs the project build command, THE Build_Pipeline SHALL complete with a success exit status and emit production output.
6. IF a module imports a symbol from the PubChem_Adapter, THEN THE PubChem_Adapter SHALL provide that symbol so that the import resolves during build.

### Requirement 2: Navigation and route structure

**User Story:** As a student, I want a clear navigation structure that reflects the learning-first philosophy, so that I know where to start and how to move between learning, practice, and tools.

#### Acceptance Criteria

1. WHERE the visitor is authenticated, THE Navigation_Bar SHALL present the primary destinations Học (`/learn`), Thực hành (`/lab/sim`), and the Tools_Menu, plus an avatar menu.
2. WHERE the visitor is unauthenticated, THE Navigation_Bar SHALL present feature and learning-path links plus sign-in and trial entry points.
3. THE Tools_Menu SHALL link to the Periodic_Table_Page, the Explorer_Page, the Molecules_Page, and the Reactions_Page.
4. THE Router SHALL resolve each of the routes `/`, `/auth`, `/onboarding`, `/dashboard`, `/learn`, `/learn/road/:roadId`, `/learn/road/:roadId/lesson/:lessonId`, `/lab/sim`, `/lab/ar`, `/lab/wet`, `/tools/periodic-table`, `/tools/explorer`, `/tools/molecules`, `/tools/reactions`, and `/progress` to its corresponding page.
5. WHEN a visitor opens a legacy route path that has been migrated, THE Router SHALL resolve the request to the corresponding new route per the UX specification route mapping.
6. WHEN a visitor selects a destination in the Navigation_Bar, THE Router SHALL navigate to the route associated with that destination.

### Requirement 3: Landing page

**User Story:** As a first-time visitor, I want a landing page that explains the product and how to start, so that I can decide to begin learning within seconds.

#### Acceptance Criteria

1. THE Landing_Page SHALL render at route `/` without requiring authentication.
2. THE Landing_Page SHALL present a primary call to action that navigates to the sign-up entry point at `/auth?mode=signup`.
3. THE Landing_Page SHALL present a secondary call to action that navigates to a guest practice entry point at `/lab/sim`.
4. THE Landing_Page SHALL present a preview of the learning roads and the three highlighted capabilities described in the UX specification.

### Requirement 4: Authentication flow

**User Story:** As a student, I want to sign in or sign up and be routed appropriately, so that I reach onboarding on first registration and the dashboard on return visits.

#### Acceptance Criteria

1. THE Auth_Page SHALL provide email-and-password sign-in and sign-up using Supabase authentication.
2. THE Auth_Page SHALL provide a Google OAuth sign-in option.
3. WHEN a visitor completes sign-up successfully, THE Auth_Page SHALL navigate to the Onboarding_Flow at `/onboarding`.
4. WHEN a visitor completes sign-in successfully, THE Auth_Page SHALL navigate to the Dashboard at `/dashboard`.
5. IF an authentication request fails, THEN THE Auth_Page SHALL display an error notification and keep the visitor on the Auth_Page.
6. WHILE an authentication request is in progress, THE Auth_Page SHALL disable the submit control.

### Requirement 5: Onboarding flow

**User Story:** As a newly registered student, I want a short onboarding that captures my level and starting interest, so that the app can tailor my starting point.

#### Acceptance Criteria

1. THE Onboarding_Flow SHALL present three sequential steps: grade-level selection, starting-road selection, and a usage introduction.
2. WHEN the visitor selects a grade level, THE Onboarding_Flow SHALL record the selected grade level in the Content_Store.
3. WHEN the visitor selects a starting road, THE Onboarding_Flow SHALL record the selected starting road in the Content_Store.
4. WHEN the visitor completes the final onboarding step, THE Onboarding_Flow SHALL navigate to the Dashboard at `/dashboard`.
5. WHERE onboarding has already been completed, THE Onboarding_Flow SHALL not be presented again on subsequent sign-ins.

### Requirement 6: Dashboard with continue learning

**User Story:** As a returning student, I want a dashboard that shows where to continue and my quick stats, so that I can resume learning immediately.

#### Acceptance Criteria

1. THE Dashboard SHALL render at route `/dashboard` for an authenticated visitor.
2. WHERE the visitor has an in-progress lesson, THE Dashboard SHALL present a "continue learning" card that navigates to that lesson.
3. WHERE the visitor has not started any road, THE Dashboard SHALL present a card that navigates to the first lesson of Road 1.
4. WHERE the visitor has completed Road 1, THE Dashboard SHALL present a card that navigates to Road 2.
5. THE Dashboard SHALL display quick statistics including lessons completed, reactions triggered, and current streak.
6. THE Dashboard SHALL display recent achievements obtained by the visitor.
7. THE Dashboard SHALL present quick-access links to the AR practice mode, the Periodic_Table_Page, and the Explorer_Page.

### Requirement 7: Learning path overview

**User Story:** As a student, I want an overview of both learning roads with my completion progress, so that I can choose what to study next.

#### Acceptance Criteria

1. THE Learning_Path_Overview SHALL render at route `/learn` and display Road 1 with 12 lessons and Road 2 with 10 lessons.
2. THE Learning_Path_Overview SHALL display, for each road, the count of completed lessons and the completion percentage derived from the Content_Store.
3. WHEN the visitor selects continue or start on a road, THE Learning_Path_Overview SHALL navigate to the corresponding Road_Page.
4. WHERE Road 1 is incomplete, THE Learning_Path_Overview SHALL present Road 2 as soft-locked while allowing the visitor to proceed into Road 2.

### Requirement 8: Road page

**User Story:** As a student, I want each road to show its lessons grouped by chapter with their status, so that I understand the structure and what is unlocked.

#### Acceptance Criteria

1. THE Road_Page SHALL render at route `/learn/road/:roadId` and list the road's lessons grouped by chapter.
2. THE Road_Page SHALL display each lesson with a status of completed, current, or locked derived from the Content_Store.
3. WHEN the visitor selects an accessible lesson, THE Road_Page SHALL navigate to the corresponding Lesson_Page.
4. THE Road_Page SHALL provide navigation back to the Learning_Path_Overview.

### Requirement 9: Lesson page

**User Story:** As a student, I want each lesson to combine theory, 3D exploration, and practice in one place, so that I can understand, see, and practice a concept.

#### Acceptance Criteria

1. THE Lesson_Page SHALL render at route `/learn/road/:roadId/lesson/:lessonId` with three tabs: Lý thuyết (theory), Khám phá 3D (3D exploration), and Thực hành (practice).
2. THE Lesson_Page SHALL load lesson theory, exploration targets, missions, and quiz content from the Content_Store.
3. THE Lesson_Page tab Khám phá 3D SHALL render an interactive 3D model for the lesson's selected element or molecule using the Lab_Scene_Renderer.
4. THE Lesson_Page tab Thực hành SHALL present the lesson missions and allow the visitor to start practice in Sim_Mode or AR_Mode pre-loaded with the lesson's default molecules.
5. WHEN the visitor answers an inline quiz question, THE Lesson_Page SHALL indicate whether the submitted answer is correct.
6. WHEN the visitor opens a lesson, THE Content_Store SHALL record the lesson status as in-progress.
7. WHEN the visitor completes a lesson's missions, THE Content_Store SHALL record the lesson status as completed.
8. THE Lesson_Page SHALL provide navigation to the previous lesson and the next lesson within the road.

### Requirement 10: Learning content data layer

**User Story:** As a student, I want learning content and my learning progress to be available without a backend, so that lessons, streak, and achievements work locally.

#### Acceptance Criteria

1. THE Content_Store SHALL provide the definitions of both roads and all 22 lessons from local seed data.
2. THE Content_Store SHALL persist lesson progress, mission completion, grade level, starting road, and onboarding completion in browser local storage.
3. THE Content_Store SHALL compute and persist the visitor's daily streak from recorded activity dates.
4. THE Content_Store SHALL compute achievement unlock status from recorded learning and lab activity.
5. WHEN the application reads learning-path data, THE Content_Store SHALL return that data without issuing a backend request.
6. THE Chemistry_Data_Service SHALL continue to load molecules and reactions from Supabase where already used, independent of the Content_Store.

### Requirement 11: Simulation 3D practice mode

**User Story:** As a student without camera access, I want a mouse-controlled 3D simulation lab, so that I can spawn molecules and trigger reactions without a webcam.

#### Acceptance Criteria

1. THE Sim_Mode SHALL render at route `/lab/sim` and display a Three.js scene without requesting camera access.
2. WHEN the visitor spawns a selected molecule, THE Sim_Mode SHALL add the molecule's 3D model to the scene using the Lab_Scene_Renderer.
3. WHILE the visitor drags with the mouse, THE Sim_Mode SHALL rotate the scene, and WHILE the visitor scrolls, THE Sim_Mode SHALL zoom the scene.
4. WHEN two spawned reactant molecules satisfy a reaction in the Reaction_Engine, THE Sim_Mode SHALL remove the reactants, spawn the products, and display the reaction result.
5. WHEN the visitor resets the scene, THE Sim_Mode SHALL remove all spawned molecules from the scene.
6. THE Sim_Mode SHALL provide a control to switch to the AR_Mode.

### Requirement 12: AR practice mode

**User Story:** As a student with a camera, I want a hand-tracked AR lab, so that I can manipulate molecules in real space using my hands.

#### Acceptance Criteria

1. THE AR_Mode SHALL render at route `/lab/ar`.
2. WHEN the visitor enables AR, THE AR_Mode SHALL request the camera stream and initialize MediaPipe hand tracking, then render the Three.js molecule overlay on the camera feed.
3. WHILE a tracked hand performs a pinch within grab range of a molecule, THE AR_Mode SHALL move that molecule to follow the hand position.
4. WHILE two tracked hands pinch simultaneously, THE AR_Mode SHALL scale the grabbed molecule by the distance between the hands.
5. WHEN two molecules come within the Reaction_Engine proximity threshold and satisfy a reaction, THE AR_Mode SHALL remove the reactants, spawn the products, and display the reaction result.
6. IF the camera permission is denied, THEN THE AR_Mode SHALL display a notification and remain operable without the camera overlay.
7. THE AR_Mode SHALL provide a control to switch to the Sim_Mode.

### Requirement 13: Wet lab scene

**User Story:** As a student, I want a wet laboratory scene, so that I can explore solution-based chemistry interactions in 3D.

#### Acceptance Criteria

1. THE Wet_Lab SHALL render at route `/lab/wet` using WetLabScene.
2. THE Wet_Lab SHALL render its Three.js scene without an unhandled runtime error.
3. WHEN the visitor interacts with the Wet_Lab controls, THE Wet_Lab SHALL update the rendered scene in response to the interaction.

### Requirement 14: Tools utilities

**User Story:** As a student, I want the periodic table, explorer, molecule library, and reactions list available under Tools, so that I can explore chemistry data on demand.

#### Acceptance Criteria

1. THE Periodic_Table_Page SHALL render at route `/tools/periodic-table` and display the periodic table grid with element detail on selection.
2. THE Explorer_Page SHALL render at route `/tools/explorer` and search PubChem compounds via the PubChem_Adapter with a 3D preview of a selected compound.
3. THE Molecules_Page SHALL render at route `/tools/molecules` and display the molecule library from the Chemistry_Data_Service with category filtering and search.
4. THE Reactions_Page SHALL render at route `/tools/reactions` and display the reactions list from the Chemistry_Data_Service with reaction detail on selection.
5. WHEN a visitor selects a result on a Tools utility page that links into the lab, THE Router SHALL navigate to the practice mode for that selection.

### Requirement 15: Progress and achievements

**User Story:** As a student, I want a progress page showing my lesson progress, road progress, and achievements, so that I stay motivated to continue.

#### Acceptance Criteria

1. THE Progress_Page SHALL render at route `/progress` and display lessons completed out of 22, current streak, molecules spawned, and reactions triggered.
2. THE Progress_Page SHALL display the completion percentage for Road 1 and Road 2 from the Content_Store.
3. THE Progress_Page SHALL display the achievement set with each achievement marked as obtained or locked based on the visitor's activity.
4. WHEN the visitor's activity satisfies an achievement's unlock condition, THE Content_Store SHALL mark that achievement as obtained.

### Requirement 16: State management and rendering refactor

**User Story:** As a developer, I want shared state in a global store and shared 3D rendering extracted, so that the lab and learning pages avoid prop drilling and duplicate code.

#### Acceptance Criteria

1. THE App_State_Store SHALL hold shared lab and learning session state previously prop-drilled across the lab and learning pages.
2. WHEN the Sim_Mode, the AR_Mode, or the Lesson_Page reads or updates shared session state, THE component SHALL access that state through the App_State_Store rather than through props passed across multiple levels.
3. THE Lab_Scene_Renderer SHALL expose the molecule-group building logic as a shared utility used by both the Sim_Mode and the AR_Mode.
4. THE Sim_Mode and the AR_Mode SHALL build molecule 3D models from the shared molecule-group utility rather than from duplicated implementations.

### Requirement 17: Consistent design system

**User Story:** As a Vietnamese high-school student, I want every page to share the same visual style, so that the application feels coherent and is easy to read while I study.

#### Acceptance Criteria

1. THE Design_System SHALL define a single color palette, a single typography scale, and a single spacing scale as shared design tokens.
2. THE UI_Surface SHALL apply the Design_System color palette, typography scale, and spacing scale through the shared Radix/Shadcn components styled with Tailwind v4.
3. WHERE a common interface element (button, card, input, badge, dialog, or tab) appears on more than one UI_Surface, THE UI_Surface SHALL render that element from the shared component set rather than a page-specific variant.
4. THE Design_System SHALL define a single status color-and-icon mapping for the lesson states completed, current, and locked, applied consistently across the Learning_Path_Overview, the Road_Page, and the Lesson_Page.

### Requirement 18: Page layouts aligned to the UX specification

**User Story:** As a student, I want each page laid out the way the UX specification describes, so that the structure matches the intended learning flow.

#### Acceptance Criteria

1. THE Landing_Page SHALL present the five sections defined in the UX specification: hero, problem framing, learning-path preview, three highlighted capabilities, and a closing call to action.
2. THE Auth_Page SHALL present a two-column split layout with a preview panel beside the authentication form on desktop viewports.
3. THE Dashboard SHALL present a greeting, a continue-learning area, a quick-statistics area, and a quick-access area as defined in the UX specification.
4. THE Learning_Path_Overview SHALL present Road 1 and Road 2 as two road cards, each showing its progress indicator and a start-or-continue action.
5. THE Road_Page SHALL present the road's lessons grouped under their chapter headings, with each lesson row showing its status indicator.
6. THE Lesson_Page SHALL present a header, the three content tabs, and previous-and-next lesson navigation controls.
7. THE Sim_Mode and the AR_Mode SHALL present a control sidebar beside the 3D scene area as defined in the UX specification.
8. THE Progress_Page SHALL present an overview area, per-road progress bars, and the achievement set.

### Requirement 19: Responsive layout across viewports

**User Story:** As a student using a phone, tablet, or laptop, I want the interface to adapt to my screen, so that I can study comfortably on any device.

#### Acceptance Criteria

1. THE UI_Surface SHALL render a usable layout at desktop, tablet, and mobile viewport widths.
2. WHILE the viewport is at mobile width, THE Navigation_Bar SHALL collapse its primary destinations into a hamburger menu.
3. WHILE the viewport is at mobile width, THE AR_Mode SHALL present the Sim_Mode as the recommended option and display a performance advisory for augmented reality.
4. WHILE the viewport is at mobile width, THE Periodic_Table_Page SHALL allow horizontal scrolling of the periodic table grid.

### Requirement 20: Explicit UI states

**User Story:** As a student, I want the interface to clearly show loading, empty, error, and interactive states, so that I always understand what the application is doing.

#### Acceptance Criteria

1. WHILE a UI_Surface is fetching data, THE UI_Surface SHALL display a loading indicator.
2. IF a UI_Surface has no data to display, THEN THE UI_Surface SHALL display an empty state with guidance toward a next action.
3. IF a data request fails, THEN THE UI_Surface SHALL display an error state with a retry control.
4. WHEN the pointer hovers over or activates an interactive control, THE UI_Surface SHALL apply the Design_System hover and active styling.
5. WHILE an action triggered by a control is being processed, THE UI_Surface SHALL disable that control until the action resolves.

### Requirement 21: Navigation feedback and motion

**User Story:** As a student, I want clear navigation cues and gentle feedback, so that I stay oriented and informed without distraction.

#### Acceptance Criteria

1. THE Lesson_Page SHALL display a Breadcrumb_Trail showing the path from the Dashboard to the current lesson.
2. WHEN an action succeeds, fails, or reports a camera-permission outcome, THE Toast_Notifier SHALL display a corresponding success, error, or informational message.
3. WHEN a UI_Surface presents an entrance or transition animation, THE UI_Surface SHALL render the animation using the installed motion library within a duration of 400 milliseconds.
4. WHERE the visitor's system requests reduced motion, THE UI_Surface SHALL suppress non-essential animations.

### Requirement 22: Consistent Vietnamese language

**User Story:** As a Vietnamese high-school student, I want all interface text in Vietnamese, so that I can read the application in my own language.

#### Acceptance Criteria

1. THE UI_Surface SHALL present its labels, headings, and messages in Vietnamese.
2. THE Progress_Page SHALL present its labels and headings in Vietnamese, replacing any English labels.
3. THE Toast_Notifier SHALL present its messages in Vietnamese.

### Requirement 23: Basic accessibility

**User Story:** As a student who relies on keyboard navigation or assistive technology, I want accessible controls and readable text, so that I can use the application effectively.

#### Acceptance Criteria

1. THE UI_Surface SHALL render body text and the foreground of interactive controls at a contrast ratio of at least 4.5 to 1 against their background.
2. WHEN an interactive control receives keyboard focus, THE UI_Surface SHALL display a visible focus indicator.
3. THE UI_Surface SHALL provide a text alternative for each informative image and an accessible name for each icon-only control.
