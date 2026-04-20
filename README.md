# Student Tracker — Frontend

Student-facing productivity web app for tracking classes, assignments, and study sessions.

## Features

- **Calendar** with computed lectures, assignments, reminders, and notes on the same view
- **Classes** with a meeting pattern, per-class weight categories, and running grade calculation
- **Assignments** with scores, categories, and descriptions; toggle done/undone
- **Reminders** (timed) and **Notes** (date-only), each taggable by color or class
- **Pomodoro timer** with configurable focus/break cycles
- **History** with past-class summaries (final grades + category breakdowns) and assignment filtering
- **Semesters** to group classes, with automatic "past classes" hiding

## Getting started

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Project structure

```
student-tracker/
├── index.html
├── package.json
├── vite.config.js
├── .gitignore
├── README.md
└── src/
    ├── main.jsx                          React DOM entry
    ├── App.jsx                           Top-level shell, state, handlers
    ├── theme.js                          Design tokens (colors, radii)
    ├── lib/
    │   ├── api.js                        ⭐ THE file to edit for Supabase
    │   ├── classColors.js                8-color palette for classes
    │   ├── dateUtils.js                  Date helpers (ymd, month grid, formatters)
    │   ├── grading.js                    Pure weighted-average grade calculator
    │   └── lectures.js                   Pure lecture-occurrence computer
    └── components/
        ├── AddChooser.jsx                Bottom-sheet picker for the "+" FAB
        ├── AssignmentForm.jsx            Create/edit form for assignments
        ├── Calendar.jsx                  Monthly calendar + day detail
        ├── ClassForm.jsx                 Create/edit form for classes (schedule + categories)
        ├── Classes.jsx                   Class list, grouped by semester
        ├── ColorOrClassPicker.jsx        Shared picker: palette color OR attached class
        ├── Drawer.jsx                    Hamburger slide-in menu
        ├── History.jsx                   Past classes + assignment history
        ├── ItemCard.jsx                  Unified row: assignment/reminder/note/lecture
        ├── ItemModal.jsx                 Dispatcher — routes to the right form by kind
        ├── NoteForm.jsx                  Create/edit form for notes
        ├── Pomodoro.jsx                  Study timer with cycle tracking
        ├── ReminderForm.jsx              Create/edit form for reminders
        └── Semesters.jsx                 Semester list + form
```

### What each file does

**Entry & config**

- `index.html` — the HTML shell Vite serves; mounts React into `#root`.
- `package.json` — npm dependencies and scripts.
- `vite.config.js` — Vite + React plugin config.
- `src/main.jsx` — React DOM entry; renders `<App/>` into the `#root` div.

**App shell**

- `src/App.jsx` — Top-level component. Owns all application state (assignments, classes, semesters, notes, reminders, current view, modal state) and all handlers that call the API layer. Every feature component receives props from here.
- `src/theme.js` — Design tokens: colors, border-radius values. Change once, affects everything.

**Data & logic (pure)**

- `src/lib/api.js` — **The Supabase swap point.** Every data read and write goes through the functions exported here. Currently uses an in-memory store; replace each function body with a real Supabase call when the backend is ready. Data shapes for every table are documented at the top.
- `src/lib/classColors.js` — Exports the 8-color palette and `getClassColor(id)` lookup.
- `src/lib/dateUtils.js` — `ymd()`, `buildMonthGrid()`, `formatSelectedDate()`, `formatTime()`. Local-time only, no timezone logic.
- `src/lib/grading.js` — `computeClassGrade(cls, assignments)` returns the running grade and per-category breakdown. Ignores categories with no graded work so the running grade isn't deflated.
- `src/lib/lectures.js` — `computeLectures(classes, start, end)` generates synthetic lecture entries from each class's meeting pattern. Lectures are not stored in the database; they're computed on every render.

**Feature components**

- `Drawer.jsx` — Hamburger slide-in with five destinations: Calendar / Pomodoro / Classes / Semesters / History.
- `Calendar.jsx` — Monthly grid with per-class colored dots. Day detail list shows lectures, reminders, assignments, and notes for the selected day, sorted by kind then time.
- `ItemCard.jsx` — Single row renderer used by Calendar and History. Handles all four item kinds (lectures render with a dashed outline and no edit/delete; the rest are interactive).
- `Pomodoro.jsx` — Standalone timer. Uses a target end-timestamp approach so the countdown stays accurate across tab throttling. Cycles focus → break → focus, with long breaks every N cycles. No persistence yet.
- `Classes.jsx` — List of classes grouped by semester. Two top buttons ("Add Class" / "Add Assignment"). Hides classes whose `endDate` is past by default; "Show past classes (N)" button reveals them. Each class row displays its running grade.
- `ClassForm.jsx` — Create/edit a class. Three sections: basic info (name, code, semester, color); schedule (dates, meeting days, meeting times — all-or-nothing); weight categories (repeatable `{name, weight}` rows, no forced sum-to-100).
- `Semesters.jsx` — CRUD for semesters (name + start/end dates).
- `History.jsx` — Past classes with final grades and expandable category breakdowns, followed by past assignments with filter pills (all/completed/overdue) and completion stats.
- `AddChooser.jsx` — Bottom-sheet that appears when the "+" FAB is tapped. Four options: Assignment, Reminder, Note, Class.
- `ItemModal.jsx` — Thin shell that wraps the three item forms. Chooses which one to render based on `kind` (create) or `initialItem.kind` (edit).
- `AssignmentForm.jsx` — Create/edit an assignment. Title, class, category (dynamic per class), due date/time, score (0–100%), description.
- `ReminderForm.jsx` — Create/edit a reminder. Title, date, start time, optional end time, details, color/class tag.
- `NoteForm.jsx` — Create/edit a note. Title, date, optional body, color/class tag.
- `ColorOrClassPicker.jsx` — Reusable widget shared by `NoteForm` and `ReminderForm`. Toggle between a palette color and attaching to a class (mutually exclusive).

## Data shapes

Full shape contracts live in comments at the top of `src/lib/api.js`. Summary:

```
Assignment    { id, title, classId, categoryId?, dueDate, dueTime, done, score?, description? }
Note          { id, title, date, body?, color?, classId? }
Reminder      { id, title, date, startTime, endTime?, body?, color?, classId? }
Class         { id, name, code?, semesterId?, color, startDate?, endDate?,
                meetingDays?, meetingStartTime?, meetingEndTime?, categories[] }
Category      { id, name, weight }    (embedded in Class)
Semester      { id, name, startDate, endDate }
```

Lectures are not stored — computed from `Class` on the fly.

## Known limitations

- **No auth yet.** The app assumes a logged-in user. Add auth before deploying publicly.
- **No persistence.** All state is in-memory. Refresh wipes the app.
- **No notifications.** Reminders are visual only — they don't ping anyone.
- **Timezone: local only.** All dates are stored and compared as "YYYY-MM-DD" in the user's local timezone.
- **Lectures are all-or-nothing per class.** Individual cancellations would require adding a `canceledLectures` array to the class.
- **Pomodoro session history is in-memory.** The "completed today" counter resets on refresh.
