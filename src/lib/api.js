import { supabase } from "./supabaseClient";

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

function assertNoError(error, operation) {
  if (!error) return;
  const wrappedError = new Error(`${operation} failed: ${error.message}`);
  wrappedError.cause = error;
  throw wrappedError;
}

function mapAssignmentFromDb(row) {
  return {
    id: row.id,
    title: row.title,
    classId: row.class_id,
    categoryId: row.category_id,
    dueDate: row.due_date,
    dueTime: row.due_time,
    done: row.done,
    score: row.score,
    description: row.description,
    createdAt: row.created_at,
  };
}

function mapAssignmentToDb(payload) {
  return {
    title: payload.title,
    class_id: payload.classId,
    category_id: payload.categoryId,
    due_date: payload.dueDate,
    due_time: payload.dueTime,
    done: payload.done,
    score: payload.score,
    description: payload.description,
  };
}

function mapNoteFromDb(row) {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    body: row.body,
    color: row.color,
    classId: row.class_id,
    createdAt: row.created_at,
  };
}

function mapNoteToDb(payload) {
  return {
    title: payload.title,
    date: payload.date,
    body: payload.body,
    color: payload.color,
    class_id: payload.classId,
  };
}

function mapReminderFromDb(row) {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    body: row.body,
    color: row.color,
    classId: row.class_id,
    createdAt: row.created_at,
  };
}

function mapReminderToDb(payload) {
  return {
    title: payload.title,
    date: payload.date,
    start_time: payload.startTime,
    end_time: payload.endTime,
    body: payload.body,
    color: payload.color,
    class_id: payload.classId,
  };
}

function mapClassFromDb(row) {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    semesterId: row.semester_id,
    color: row.color,
    startDate: row.start_date,
    endDate: row.end_date,
    meetingDays: row.meeting_days,
    meetingStartTime: row.meeting_start_time,
    meetingEndTime: row.meeting_end_time,
    categories: row.categories,
  };
}

function mapClassToDb(payload) {
  return {
    name: payload.name,
    code: payload.code,
    semester_id: payload.semesterId,
    color: payload.color,
    start_date: payload.startDate,
    end_date: payload.endDate,
    meeting_days: payload.meetingDays,
    meeting_start_time: payload.meetingStartTime,
    meeting_end_time: payload.meetingEndTime,
    categories: payload.categories,
  };
}

function mapSemesterFromDb(row) {
  return {
    id: row.id,
    name: row.name,
    startDate: row.start_date,
    endDate: row.end_date,
  };
}

function mapSemesterToDb(payload) {
  return {
    name: payload.name,
    start_date: payload.startDate,
    end_date: payload.endDate,
  };
}


// ========== ASSIGNMENTS =====================================================

// Supabase: const { data } = await supabase.from('assignments').select('*').order('dueDate');
export async function getAssignments() {
  const { data, error } = await supabase.from("assignments").select("*").order("due_date");
  assertNoError(error, "getAssignments");
  return data.map(mapAssignmentFromDb);
}

// Supabase: const { data } = await supabase.from('assignments').insert(payload).select().single();
export async function createAssignment(payload) {
  const { data, error } = await supabase
    .from("assignments")
    .insert(mapAssignmentToDb(payload))
    .select()
    .single();
  assertNoError(error, "createAssignment");
  return mapAssignmentFromDb(data);
}

// Supabase: await supabase.from('assignments').update(patch).eq('id', id);
export async function updateAssignment(id, patch) {
  const { data, error } = await supabase
    .from("assignments")
    .update(mapAssignmentToDb(patch))
    .eq("id", id)
    .select()
    .maybeSingle();
  assertNoError(error, "updateAssignment");
  return data ? mapAssignmentFromDb(data) : null;
}

// Supabase: await supabase.from('assignments').delete().eq('id', id);
export async function deleteAssignment(id) {
  const { error } = await supabase.from("assignments").delete().eq("id", id);
  assertNoError(error, "deleteAssignment");
}


// ========== NOTES ===========================================================

// Supabase: const { data } = await supabase.from('notes').select('*');
export async function getNotes() {
  const { data, error } = await supabase.from("notes").select("*");
  assertNoError(error, "getNotes");
  return data.map(mapNoteFromDb);
}

// Supabase: const { data } = await supabase.from('notes').insert(payload).select().single();
export async function createNote(payload) {
  const { data, error } = await supabase.from("notes").insert(mapNoteToDb(payload)).select().single();
  assertNoError(error, "createNote");
  return mapNoteFromDb(data);
}

// Supabase: await supabase.from('notes').delete().eq('id', id);
export async function deleteNote(id) {
  const { error } = await supabase.from("notes").delete().eq("id", id);
  assertNoError(error, "deleteNote");
}


// ========== NOTES (cont.) — update ==========================================

// Supabase: await supabase.from('notes').update(patch).eq('id', id).select().single();
export async function updateNote(id, patch) {
  const { data, error } = await supabase
    .from("notes")
    .update(mapNoteToDb(patch))
    .eq("id", id)
    .select()
    .maybeSingle();
  assertNoError(error, "updateNote");
  return data ? mapNoteFromDb(data) : null;
}


// ========== REMINDERS =======================================================
// Reminders are like notes but tied to a specific time (or time range).
// Data shape: see comment block at the top of this file.
// They do NOT trigger notifications — they just show prominently on the calendar.

// Supabase: const { data } = await supabase.from('reminders').select('*');
export async function getReminders() {
  const { data, error } = await supabase.from("reminders").select("*");
  assertNoError(error, "getReminders");
  return data.map(mapReminderFromDb);
}

// Supabase: const { data } = await supabase.from('reminders').insert(payload).select().single();
export async function createReminder(payload) {
  const { data, error } = await supabase
    .from("reminders")
    .insert(mapReminderToDb(payload))
    .select()
    .single();
  assertNoError(error, "createReminder");
  return mapReminderFromDb(data);
}

// Supabase: await supabase.from('reminders').update(patch).eq('id', id).select().single();
export async function updateReminder(id, patch) {
  const { data, error } = await supabase
    .from("reminders")
    .update(mapReminderToDb(patch))
    .eq("id", id)
    .select()
    .maybeSingle();
  assertNoError(error, "updateReminder");
  return data ? mapReminderFromDb(data) : null;
}

// Supabase: await supabase.from('reminders').delete().eq('id', id);
export async function deleteReminder(id) {
  const { error } = await supabase.from("reminders").delete().eq("id", id);
  assertNoError(error, "deleteReminder");
}


// ========== CLASSES =========================================================

// Supabase: const { data } = await supabase.from('classes').select('*, semesters(*)');
export async function getClasses() {
  const { data, error } = await supabase.from("classes").select("*");
  assertNoError(error, "getClasses");
  return data.map(mapClassFromDb);
}

// Supabase: const { data } = await supabase.from('classes').insert(payload).select().single();
export async function createClass(payload) {
  const { data, error } = await supabase.from("classes").insert(mapClassToDb(payload)).select().single();
  assertNoError(error, "createClass");
  return mapClassFromDb(data);
}

// Supabase: await supabase.from('classes').update(patch).eq('id', id).select().single();
export async function updateClass(id, patch) {
  const { data, error } = await supabase
    .from("classes")
    .update(mapClassToDb(patch))
    .eq("id", id)
    .select()
    .maybeSingle();
  assertNoError(error, "updateClass");
  return data ? mapClassFromDb(data) : null;
}

// Supabase: await supabase.from('classes').delete().eq('id', id);
export async function deleteClass(id) {
  const { error } = await supabase.from("classes").delete().eq("id", id);
  assertNoError(error, "deleteClass");
}


// ========== AUTH ============================================================

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  return data.session;
}


// ========== SEMESTERS =======================================================

// Supabase: const { data } = await supabase.from('semesters').select('*');
export async function getSemesters() {
  const { data, error } = await supabase.from("semesters").select("*");
  assertNoError(error, "getSemesters");
  return data.map(mapSemesterFromDb);
}

// Supabase: const { data } = await supabase.from('semesters').insert(payload).select().single();
export async function createSemester(payload) {
  const { data, error } = await supabase
    .from("semesters")
    .insert(mapSemesterToDb(payload))
    .select()
    .single();
  assertNoError(error, "createSemester");
  return mapSemesterFromDb(data);
}

// Supabase: await supabase.from('semesters').update(patch).eq('id', id).select().single();
export async function updateSemester(id, patch) {
  const { data, error } = await supabase
    .from("semesters")
    .update(mapSemesterToDb(patch))
    .eq("id", id)
    .select()
    .maybeSingle();
  assertNoError(error, "updateSemester");
  return data ? mapSemesterFromDb(data) : null;
}

// Supabase: await supabase.from('semesters').delete().eq('id', id);
export async function deleteSemester(id) {
  const { error } = await supabase.from("semesters").delete().eq("id", id);
  assertNoError(error, "deleteSemester");
}
