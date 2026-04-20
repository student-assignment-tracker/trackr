import { useState } from "react";
import { theme } from "../theme";
import ColorOrClassPicker from "./ColorOrClassPicker";

// Create/edit form for a reminder. A reminder is pinned to a date + start
// time, with an optional end time (to express a range like "3:00–4:30 PM").
// No notifications — reminders just appear prominently on the calendar.
export default function ReminderForm({ initial, classes, onSave, onCancel }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [date, setDate] = useState(initial?.date ?? "");
  const [startTime, setStartTime] = useState(initial?.startTime ?? "");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [tag, setTag] = useState({
    color: initial?.color ?? null,
    classId: initial?.classId ?? null,
  });
  const [saving, setSaving] = useState(false);

  const rangeValid = !endTime || !startTime || startTime < endTime;
  const valid = title.trim() && date && startTime && rangeValid;

  async function save() {
    if (!valid || saving) return;
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        date,
        startTime,
        endTime: endTime || null,
        body: body.trim() || null,
        color: tag.color,
        classId: tag.classId,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Field label="Title">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Call financial aid"
          autoFocus
          style={inputStyle}
        />
      </Field>

      <Field label="Date">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
      </Field>

      <div style={{ display: "flex", gap: 10 }}>
        <Field label="Start time" style={{ flex: 1 }}>
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="End time (optional)" style={{ flex: 1 }}>
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={inputStyle} />
        </Field>
      </div>
      {!rangeValid && (
        <div style={{ fontSize: 12, color: theme.danger, marginTop: -6 }}>
          End time must be after the start time.
        </div>
      )}

      <Field label="Details (optional)">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder="Add any details…"
          style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
        />
      </Field>

      <Field label="Tag">
        <ColorOrClassPicker value={tag} onChange={setTag} classes={classes} />
      </Field>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
        <button onClick={onCancel} style={btnGhost}>Cancel</button>
        <button
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

function Field({ label, children, style }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}>
      <span style={fieldLabel}>{label}</span>
      {children}
    </label>
  );
}

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

const btnPrimary = {
  padding: "10px 16px",
  borderRadius: theme.radiusSm,
  background: theme.accent,
  color: "white",
  fontSize: 14,
  fontWeight: 500,
  border: "none",
  cursor: "pointer",
};

const btnGhost = {
  padding: "10px 16px",
  borderRadius: theme.radiusSm,
  background: "transparent",
  color: theme.inkSoft,
  fontSize: 14,
  fontWeight: 500,
  border: "none",
  cursor: "pointer",
};
