// Pure lecture-computation helpers. No UI, no state, no side effects.
//
// Lectures are NOT stored. They are computed on the fly from each class's
// meeting pattern (meetingDays + meeting times, clamped to startDate..endDate).
// This keeps the data model simple: editing a class's schedule automatically
// updates every lecture, and there's nothing to backfill when times change.
//
// Tradeoff: individual lectures can't be cancelled or edited. If that becomes
// a real need, we add a `canceledLectures: ["YYYY-MM-DD", ...]` array to the
// class and filter those dates out here. Don't need it yet.

import { ymd } from "./dateUtils";

/**
 * Compute all lecture occurrences for a single class within a date range.
 *
 * @param {object} cls - Class with meetingDays (0=Sun..6=Sat), startDate, endDate, meetingStartTime, meetingEndTime.
 * @param {Date} rangeStart - Inclusive start of the range (date; time component ignored).
 * @param {Date} rangeEnd - Inclusive end of the range.
 * @returns {Array<{
 *   id: string,              // "lecture:<classId>:<date>" — stable across renders
 *   kind: "lecture",
 *   classId: string,
 *   date: string,            // "YYYY-MM-DD"
 *   startTime: string,       // "HH:MM"
 *   endTime: string,         // "HH:MM"
 * }>}
 */
export function computeLecturesForClass(cls, rangeStart, rangeEnd) {
  if (!hasMeetingPattern(cls)) return [];

  // Clamp the range to the class's own start/end so we never emit lectures
  // before the class starts or after it ends.
  const classStart = parseYmd(cls.startDate);
  const classEnd = parseYmd(cls.endDate);
  if (!classStart || !classEnd) return [];

  const start = laterOf(rangeStart, classStart);
  const end = earlierOf(rangeEnd, classEnd);
  if (start > end) return [];

  const meetingDaySet = new Set(cls.meetingDays);
  const out = [];

  // Walk day-by-day. Range is at most a few months in practice, so this is cheap.
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  while (cursor <= last) {
    if (meetingDaySet.has(cursor.getDay())) {
      const dateStr = ymd(cursor);
      out.push({
        id: `lecture:${cls.id}:${dateStr}`,
        kind: "lecture",
        classId: cls.id,
        date: dateStr,
        startTime: cls.meetingStartTime,
        endTime: cls.meetingEndTime,
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

/**
 * Convenience: compute lectures across many classes at once.
 */
export function computeLectures(classes, rangeStart, rangeEnd) {
  const all = [];
  for (const cls of classes) {
    for (const l of computeLecturesForClass(cls, rangeStart, rangeEnd)) {
      all.push(l);
    }
  }
  return all;
}

// ---- internals -------------------------------------------------------------

function hasMeetingPattern(cls) {
  return (
    cls &&
    cls.startDate &&
    cls.endDate &&
    Array.isArray(cls.meetingDays) &&
    cls.meetingDays.length > 0 &&
    cls.meetingStartTime &&
    cls.meetingEndTime
  );
}

// Parse "YYYY-MM-DD" as a local-time Date. Using `new Date(str)` treats it as
// UTC in some runtimes, which shifts the day in negative-offset timezones.
function parseYmd(s) {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function laterOf(a, b) {
  return a > b ? a : b;
}

function earlierOf(a, b) {
  return a < b ? a : b;
}
