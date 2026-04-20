// ============================================================================
// API LAYER  —  THIS IS THE ONLY FILE YOU NEED TO EDIT WHEN WIRING SUPABASE.
// ============================================================================
//
// Every UI component reads and writes data through the functions exported here.
// Keep the function SIGNATURES identical and the UI will not need changes.
//
// To wire Supabase:
//   1. `npm install @supabase/supabase-js`
//   2. Create `supabaseClient.js` that exports a configured client.
//   3. Replace each function body below with the real Supabase call (examples
//      are shown in comments above each function).
//   4. Delete the in-memory `store` object and the `uid()` helper — they only
//      exist to make the app feel real without a backend.
//
// Data shapes — AGREE ON THESE WITH YOUR BACKEND TEAMMATE before they build
// the Supabase schema. The columns below should match table columns.
//
//   Class:
//     { id,
//       name,                         // "Intro to Psychology"
//       code?,                        // "PSYC 101"
//       semesterId?,                  // optional grouping
//       color,                        // id from lib/classColors.js palette
//       startDate, endDate,           // "YYYY-MM-DD" — when the class runs
//       meetingDays,                  // number[]: 0=Sun..6=Sat, e.g. [1,3,5]
//       meetingStartTime,             // "HH:MM"
//       meetingEndTime,               // "HH:MM"
//       categories                    // array of weight categories (see below)
//     }
//
//     Category (embedded in Class.categories):
//       { id, name, weight }          // weight is a percentage (0-100).
//                                     // Weights do NOT have to sum to 100 —
//                                     // many real syllabi don't.
//     Note: when Supabase is wired, categories will likely become their own
//     table `class_categories` with a classId foreign key. For now they live
//     as an inline array to keep the in-memory store simple.
//
//   Assignment:
//     { id,
//       title,
//       classId,                      // required — every assignment belongs to a class
//       categoryId?,                  // which weight category it counts toward
//       dueDate: "YYYY-MM-DD",
//       dueTime: "HH:MM",
//       done: boolean,
//       score?,                       // number 0-100 (percentage). null/undefined = ungraded
//       description?,
//       createdAt
//     }
//
//   Note (plain calendar text, no time):
//     { id, title, date: "YYYY-MM-DD", body?,
//       color?,                       // id from classColors palette, OR
//       classId?,                     // attach to a class — inherits its color
//                                     // (UI enforces that color and classId are mutually exclusive)
//       createdAt }
//
//   Reminder (calendar entry with a time or time range):
//     { id, title, date: "YYYY-MM-DD",
//       startTime: "HH:MM",           // required
//       endTime?: "HH:MM",            // optional — for a range like a meeting
//       body?,
//       color?, classId?,             // same as Note
//       createdAt }
//
//   Semester:
//     { id, name, startDate: "YYYY-MM-DD", endDate: "YYYY-MM-DD" }
//
//   Lecture:
//     NOT STORED. Lectures are computed on the fly from a Class's meeting
//     pattern (see lib/lectures.js). No backend table needed.
//
//   PomodoroSession (optional, only if you track study history):
//     { id, startedAt, durationSec, mode: "focus"|"shortBreak"|"longBreak" }
// ============================================================================

// ---------- TEMPORARY in-memory store. DELETE when wiring Supabase. ----------
const store = {
  assignments: [],
  notes: [],
  reminders: [],
  classes: [],
  semesters: [],
};

// Tiny id generator. DELETE when Supabase takes over (Postgres generates ids).
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// A trivial delay so UI code is already written against async. Keep or remove.
const tick = () => new Promise((r) => setTimeout(r, 0));
// ----------------------------------------------------------------------------


// ========== ASSIGNMENTS =====================================================

// Supabase: const { data } = await supabase.from('assignments').select('*').order('dueDate');
export async function getAssignments() {
  await tick();
  return [...store.assignments];
}

// Supabase: const { data } = await supabase.from('assignments').insert(payload).select().single();
export async function createAssignment(payload) {
  await tick();
  const row = { id: uid(), done: false, createdAt: new Date().toISOString(), ...payload };
  store.assignments.push(row);
  return row;
}

// Supabase: await supabase.from('assignments').update(patch).eq('id', id);
export async function updateAssignment(id, patch) {
  await tick();
  const idx = store.assignments.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  store.assignments[idx] = { ...store.assignments[idx], ...patch };
  return store.assignments[idx];
}

// Supabase: await supabase.from('assignments').delete().eq('id', id);
export async function deleteAssignment(id) {
  await tick();
  store.assignments = store.assignments.filter((a) => a.id !== id);
}


// ========== NOTES ===========================================================

// Supabase: const { data } = await supabase.from('notes').select('*');
export async function getNotes() {
  await tick();
  return [...store.notes];
}

// Supabase: const { data } = await supabase.from('notes').insert(payload).select().single();
export async function createNote(payload) {
  await tick();
  const row = { id: uid(), createdAt: new Date().toISOString(), ...payload };
  store.notes.push(row);
  return row;
}

// Supabase: await supabase.from('notes').delete().eq('id', id);
export async function deleteNote(id) {
  await tick();
  store.notes = store.notes.filter((n) => n.id !== id);
}


// ========== NOTES (cont.) — update ==========================================

// Supabase: await supabase.from('notes').update(patch).eq('id', id).select().single();
export async function updateNote(id, patch) {
  await tick();
  const idx = store.notes.findIndex((n) => n.id === id);
  if (idx === -1) return null;
  store.notes[idx] = { ...store.notes[idx], ...patch };
  return store.notes[idx];
}


// ========== REMINDERS =======================================================
// Reminders are like notes but tied to a specific time (or time range).
// Data shape: see comment block at the top of this file.
// They do NOT trigger notifications — they just show prominently on the calendar.

// Supabase: const { data } = await supabase.from('reminders').select('*');
export async function getReminders() {
  await tick();
  return [...store.reminders];
}

// Supabase: const { data } = await supabase.from('reminders').insert(payload).select().single();
export async function createReminder(payload) {
  await tick();
  const row = { id: uid(), createdAt: new Date().toISOString(), ...payload };
  store.reminders.push(row);
  return row;
}

// Supabase: await supabase.from('reminders').update(patch).eq('id', id).select().single();
export async function updateReminder(id, patch) {
  await tick();
  const idx = store.reminders.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  store.reminders[idx] = { ...store.reminders[idx], ...patch };
  return store.reminders[idx];
}

// Supabase: await supabase.from('reminders').delete().eq('id', id);
export async function deleteReminder(id) {
  await tick();
  store.reminders = store.reminders.filter((r) => r.id !== id);
}


// ========== CLASSES =========================================================

// Supabase: const { data } = await supabase.from('classes').select('*, semesters(*)');
export async function getClasses() {
  await tick();
  return [...store.classes];
}

// Supabase: const { data } = await supabase.from('classes').insert(payload).select().single();
export async function createClass(payload) {
  await tick();
  const row = { id: uid(), ...payload };
  store.classes.push(row);
  return row;
}

// Supabase: await supabase.from('classes').update(patch).eq('id', id).select().single();
export async function updateClass(id, patch) {
  await tick();
  const idx = store.classes.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  store.classes[idx] = { ...store.classes[idx], ...patch };
  return store.classes[idx];
}

// Supabase: await supabase.from('classes').delete().eq('id', id);
export async function deleteClass(id) {
  await tick();
  store.classes = store.classes.filter((c) => c.id !== id);
  // Remove assignments belonging to this class. In Supabase, prefer ON DELETE CASCADE.
  store.assignments = store.assignments.filter((a) => a.classId !== id);
  // Detach notes and reminders from this class (keep them, just remove the link).
  // In Supabase, prefer ON DELETE SET NULL for notes.classId and reminders.classId.
  store.notes = store.notes.map((n) =>
    n.classId === id ? { ...n, classId: null } : n,
  );
  store.reminders = store.reminders.map((r) =>
    r.classId === id ? { ...r, classId: null } : r,
  );
}


// ========== SEMESTERS =======================================================

// Supabase: const { data } = await supabase.from('semesters').select('*');
export async function getSemesters() {
  await tick();
  return [...store.semesters];
}

// Supabase: const { data } = await supabase.from('semesters').insert(payload).select().single();
export async function createSemester(payload) {
  await tick();
  const row = { id: uid(), ...payload };
  store.semesters.push(row);
  return row;
}

// Supabase: await supabase.from('semesters').update(patch).eq('id', id).select().single();
export async function updateSemester(id, patch) {
  await tick();
  const idx = store.semesters.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  store.semesters[idx] = { ...store.semesters[idx], ...patch };
  return store.semesters[idx];
}

// Supabase: await supabase.from('semesters').delete().eq('id', id);
export async function deleteSemester(id) {
  await tick();
  store.semesters = store.semesters.filter((s) => s.id !== id);
  // Detach classes from the deleted semester rather than cascading —
  // students may want to keep old class data even after a semester ends.
  // Prefer ON DELETE SET NULL in Supabase.
  store.classes = store.classes.map((c) =>
    c.semesterId === id ? { ...c, semesterId: null } : c,
  );
}
