import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { theme } from "../theme";
import { CLASS_COLORS } from "../lib/classColors";

// Day-of-week labels aligned to JS's Date.getDay() numbering (0=Sun..6=Sat).
const DAYS = [
  { value: 0, label: "S", full: "Sunday" },
  { value: 1, label: "M", full: "Monday" },
  { value: 2, label: "T", full: "Tuesday" },
  { value: 3, label: "W", full: "Wednesday" },
  { value: 4, label: "T", full: "Thursday" },
  { value: 5, label: "F", full: "Friday" },
  { value: 6, label: "S", full: "Saturday" },
];

// Tiny id generator for category rows. Real ids come from the backend once
// the category is saved; this is just for React keys and local tracking.
const tmpId = () => `cat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

// Full create/edit form for a class. Callers pass either `initial` (edit) or
// nothing (create) and handle persistence in onSave.
export default function ClassForm({ initial, semesters, onSave, onCancel }) {
  // ---- Basic info --------------------------------------------------------
  const [name, setName] = useState(initial?.name ?? "");
  const [code, setCode] = useState(initial?.code ?? "");
  const [semesterId, setSemesterId] = useState(initial?.semesterId ?? (semesters[0]?.id ?? ""));
  const [color, setColor] = useState(initial?.color ?? CLASS_COLORS[0].id);

  // ---- Schedule ----------------------------------------------------------
  // If editing a class created before these fields existed, default gracefully.
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [meetingDays, setMeetingDays] = useState(initial?.meetingDays ?? []);
  const [meetingStartTime, setMeetingStartTime] = useState(initial?.meetingStartTime ?? "");
  const [meetingEndTime, setMeetingEndTime] = useState(initial?.meetingEndTime ?? "");

  // ---- Weight categories -------------------------------------------------
  // Each row: { id, name, weight }. We always carry a stable id for React keys.
  const [categories, setCategories] = useState(
    initial?.categories?.length
      ? initial.categories.map((c) => ({ ...c, id: c.id || tmpId() }))
      : [],
  );

  const [saving, setSaving] = useState(false);

  // ---- Validation --------------------------------------------------------
  const scheduleProvided =
    startDate || endDate || meetingDays.length > 0 || meetingStartTime || meetingEndTime;

  // Schedule is all-or-nothing: if they started filling it in, require the full set.
  const scheduleComplete =
    startDate &&
    endDate &&
    meetingDays.length > 0 &&
    meetingStartTime &&
    meetingEndTime &&
    startDate <= endDate &&
    meetingStartTime < meetingEndTime;

  const scheduleValid = !scheduleProvided || scheduleComplete;

  // Every category needs a name; weights are already constrained by the input.
  const categoriesValid = categories.every((c) => c.name.trim().length > 0);

  const valid = name.trim() && scheduleValid && categoriesValid;

  // ---- Handlers ----------------------------------------------------------
  function toggleDay(value) {
    setMeetingDays((prev) =>
      prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value].sort(),
    );
  }

  function addCategory() {
    setCategories((prev) => [...prev, { id: tmpId(), name: "", weight: 0 }]);
  }

  function updateCategory(id, patch) {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function removeCategory(id) {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  async function save() {
    if (!valid || saving) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        code: code.trim() || null,
        semesterId: semesterId || null,
        color,
        // Schedule fields — null when not provided. The calendar renders
        // lectures only for classes that have a complete schedule.
        startDate: scheduleComplete ? startDate : null,
        endDate: scheduleComplete ? endDate : null,
        meetingDays: scheduleComplete ? meetingDays : [],
        meetingStartTime: scheduleComplete ? meetingStartTime : null,
        meetingEndTime: scheduleComplete ? meetingEndTime : null,
        // Categories — trim names and coerce weights to numbers.
        categories: categories.map((c) => ({
          id: c.id,
          name: c.name.trim(),
          weight: Number(c.weight) || 0,
        })),
      });
    } finally {
      setSaving(false);
    }
  }

  // Informational: show the running category weight sum so students notice
  // typos. We don't enforce it — some syllabi really don't sum to 100.
  const weightSum = categories.reduce((s, c) => s + (Number(c.weight) || 0), 0);

  return (
    <div
      style={{
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: theme.radius,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Basic info */}
      <Section>
        <input
          placeholder="Class name (e.g. Intro to Psychology)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          style={inputStyle}
        />
        <input
          placeholder="Course code (optional, e.g. PSYC 101)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          style={inputStyle}
        />
        {semesters.length > 0 && (
          <Field label="Semester">
            <select value={semesterId} onChange={(e) => setSemesterId(e.target.value)} style={inputStyle}>
              <option value="">— None —</option>
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Color">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {CLASS_COLORS.map((c) => {
              const selected = color === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  aria-label={c.id}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: c.solid,
                    border: selected ? `3px solid ${theme.ink}` : "3px solid transparent",
                    padding: 0,
                    cursor: "pointer",
                    transform: selected ? "scale(1.1)" : "scale(1)",
                    transition: "transform 0.1s",
                  }}
                />
              );
            })}
          </div>
        </Field>
      </Section>

      {/* Schedule */}
      <Section title="Schedule" subtitle="Optional. Fill it all in to put lectures on the calendar.">
        <div style={{ display: "flex", gap: 10 }}>
          <Field label="Start" style={{ flex: 1 }}>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="End" style={{ flex: 1 }}>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
          </Field>
        </div>
        <Field label="Meeting days">
          <div style={{ display: "flex", gap: 6 }}>
            {DAYS.map((d) => {
              const active = meetingDays.includes(d.value);
              return (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => toggleDay(d.value)}
                  aria-label={d.full}
                  aria-pressed={active}
                  style={{
                    flex: 1,
                    height: 36,
                    borderRadius: theme.radiusSm,
                    border: `1px solid ${active ? theme.accent : theme.border}`,
                    background: active ? theme.accent : theme.bg,
                    color: active ? "white" : theme.inkSoft,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </Field>
        <div style={{ display: "flex", gap: 10 }}>
          <Field label="Start time" style={{ flex: 1 }}>
            <input type="time" value={meetingStartTime} onChange={(e) => setMeetingStartTime(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="End time" style={{ flex: 1 }}>
            <input type="time" value={meetingEndTime} onChange={(e) => setMeetingEndTime(e.target.value)} style={inputStyle} />
          </Field>
        </div>
        {scheduleProvided && !scheduleComplete && (
          <Hint tone="warning">Fill in every schedule field — or clear them all to skip the schedule.</Hint>
        )}
        {startDate && endDate && startDate > endDate && (
          <Hint tone="danger">End date must be on or after the start date.</Hint>
        )}
        {meetingStartTime && meetingEndTime && meetingStartTime >= meetingEndTime && (
          <Hint tone="danger">End time must be after the start time.</Hint>
        )}
      </Section>

      {/* Weight categories */}
      <Section
        title="Grade categories"
        subtitle="Optional. Add the kinds of work in this class so assignments can be weighted."
      >
        {categories.length === 0 ? (
          <div style={{ fontSize: 13, color: theme.inkSoft, padding: "4px 0" }}>
            No categories yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {categories.map((cat) => (
              <div key={cat.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  placeholder="e.g. Homework"
                  value={cat.name}
                  onChange={(e) => updateCategory(cat.id, { name: e.target.value })}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <div style={{ position: "relative", width: 92 }}>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="1"
                    value={cat.weight}
                    onChange={(e) => updateCategory(cat.id, { weight: e.target.value })}
                    style={{ ...inputStyle, paddingRight: 28, textAlign: "right" }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: 13,
                      color: theme.inkSoft,
                      pointerEvents: "none",
                    }}
                  >
                    %
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeCategory(cat.id)}
                  aria-label="Remove category"
                  style={{
                    padding: 8,
                    color: theme.inkSoft,
                    borderRadius: theme.radiusSm,
                    border: `1px solid ${theme.border}`,
                    background: theme.bg,
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={addCategory}
          style={{
            alignSelf: "flex-start",
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            borderRadius: theme.radiusSm,
            border: `1px dashed ${theme.border}`,
            background: "transparent",
            color: theme.inkSoft,
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          <Plus size={14} /> Add category
        </button>
        {categories.length > 0 && (
          <div style={{ fontSize: 12, color: theme.inkSoft, marginTop: 2 }}>
            Weights total {weightSum}% {weightSum === 100 ? "(perfect)" : "(doesn't need to equal 100)"}
          </div>
        )}
      </Section>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
        <button type="button" onClick={onCancel} style={btnGhost}>Cancel</button>
        <button
          type="button"
          onClick={save}
          disabled={!valid || saving}
          style={{ ...btnPrimary, opacity: !valid || saving ? 0.5 : 1 }}
        >
          {saving ? "Saving…" : initial ? "Save changes" : "Save"}
        </button>
      </div>
    </div>
  );
}

// ---- Small local building blocks -----------------------------------------

function Section({ title, subtitle, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {title && (
        <div>
          <div style={sectionHeading}>{title}</div>
          {subtitle && (
            <div style={{ fontSize: 12, color: theme.inkSoft, marginTop: 3 }}>{subtitle}</div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

function Field({ label, children, style }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, ...style }}>
      <span style={fieldLabel}>{label}</span>
      {children}
    </label>
  );
}

function Hint({ tone, children }) {
  const colorMap = { danger: theme.danger, warning: "#8B6F1A", info: theme.inkSoft };
  return <div style={{ fontSize: 12, color: colorMap[tone] || theme.inkSoft }}>{children}</div>;
}

// ---- Shared styles --------------------------------------------------------

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: theme.radiusSm,
  border: `1px solid ${theme.border}`,
  fontSize: 14,
  fontFamily: "inherit",
  background: theme.bg,
  color: theme.ink,
  outline: "none",
};

const fieldLabel = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: theme.inkSoft,
};

const sectionHeading = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: theme.ink,
};

const btnPrimary = {
  padding: "8px 14px",
  borderRadius: theme.radiusSm,
  background: theme.accent,
  color: "white",
  fontSize: 13,
  fontWeight: 500,
  border: "none",
  cursor: "pointer",
};

const btnGhost = {
  padding: "8px 14px",
  borderRadius: theme.radiusSm,
  background: "transparent",
  color: theme.inkSoft,
  fontSize: 13,
  fontWeight: 500,
  border: "none",
  cursor: "pointer",
};
