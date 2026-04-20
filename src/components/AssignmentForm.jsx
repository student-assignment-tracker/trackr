import { useState, useEffect, useMemo } from "react";
import { theme } from "../theme";

// Create/edit form for an assignment.
// `classes` is the full class list so we can render the class picker and
// derive the category picker for whichever class is selected.
export default function AssignmentForm({ initial, classes, onSave, onCancel }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [classId, setClassId] = useState(initial?.classId ?? classes[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [dueTime, setDueTime] = useState(initial?.dueTime ?? "23:59");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [scoreInput, setScoreInput] = useState(
    initial?.score != null ? String(initial.score) : "",
  );
  const [saving, setSaving] = useState(false);

  // Categories come from the currently-selected class.
  const selectedClass = useMemo(
    () => classes.find((c) => c.id === classId) ?? null,
    [classes, classId],
  );
  const availableCategories = selectedClass?.categories ?? [];

  // If the selected class changes and the previously-chosen category no longer
  // exists on the new class, clear the category selection.
  useEffect(() => {
    if (categoryId && !availableCategories.some((c) => c.id === categoryId)) {
      setCategoryId("");
    }
  }, [availableCategories, categoryId]);

  // Score is a number 0-100 OR empty (ungraded). Anything else invalid.
  const scoreValid =
    scoreInput === "" ||
    (!Number.isNaN(Number(scoreInput)) && Number(scoreInput) >= 0 && Number(scoreInput) <= 100);

  const noClasses = classes.length === 0;
  const valid = title.trim() && classId && dueDate && dueTime && scoreValid;

  async function save() {
    if (!valid || saving) return;
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        classId,
        categoryId: categoryId || null,
        dueDate,
        dueTime,
        description: description.trim() || null,
        score: scoreInput === "" ? null : Number(scoreInput),
      });
    } finally {
      setSaving(false);
    }
  }

  if (noClasses) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div
          style={{
            padding: "12px 14px",
            borderRadius: theme.radiusSm,
            background: theme.bg,
            fontSize: 14,
            color: theme.inkSoft,
          }}
        >
          Add a class before creating an assignment.
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={btnGhost}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Field label="Title">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Problem Set 3"
          autoFocus
          style={inputStyle}
        />
      </Field>

      <Field label="Class">
        <select value={classId} onChange={(e) => setClassId(e.target.value)} style={inputStyle}>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.code ? ` (${c.code})` : ""}
            </option>
          ))}
        </select>
      </Field>

      {availableCategories.length > 0 && (
        <Field label="Category">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            style={inputStyle}
          >
            <option value="">— None —</option>
            {availableCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
                {cat.weight ? ` (${cat.weight}%)` : ""}
              </option>
            ))}
          </select>
        </Field>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <Field label="Due date" style={{ flex: 1 }}>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            style={inputStyle}
          />
        </Field>
        <Field label="Due time" style={{ flex: 1 }}>
          <input
            type="time"
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
            style={inputStyle}
          />
        </Field>
      </div>

      <Field label="Score (optional)">
        <div style={{ position: "relative" }}>
          <input
            type="number"
            min={0}
            max={100}
            step="0.1"
            value={scoreInput}
            onChange={(e) => setScoreInput(e.target.value)}
            placeholder="Leave blank if ungraded"
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
        {!scoreValid && (
          <div style={{ fontSize: 12, color: theme.danger, marginTop: 4 }}>
            Score must be between 0 and 100.
          </div>
        )}
      </Field>

      <Field label="Description (optional)">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Notes, page references, submission instructions…"
          style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
        />
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
