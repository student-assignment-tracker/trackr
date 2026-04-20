import { useState } from "react";
import { Plus, Trash2, CalendarRange, Pencil } from "lucide-react";
import { theme } from "../theme";
import { formatSelectedDate } from "../lib/dateUtils";

// Manages semesters. A semester groups classes and gives the app a way
// to filter to "what I'm taking right now".
export default function Semesters({ semesters, onCreate, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(null); // null | "new" | <id>

  const sorted = [...semesters].sort((a, b) =>
    (b.startDate || "").localeCompare(a.startDate || ""),
  );

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h2 className="display" style={{ fontSize: 20, fontWeight: 500, margin: 0 }}>
          Semesters
        </h2>
        {editing !== "new" && (
          <button onClick={() => setEditing("new")} style={btnPrimarySm}>
            <Plus size={16} /> Add
          </button>
        )}
      </div>

      {editing === "new" && (
        <SemesterForm
          onSave={async (payload) => {
            await onCreate(payload);
            setEditing(null);
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      {sorted.length === 0 && editing !== "new" ? (
        <Empty />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sorted.map((s) =>
            editing === s.id ? (
              <SemesterForm
                key={s.id}
                initial={s}
                onSave={async (payload) => {
                  await onUpdate(s.id, payload);
                  setEditing(null);
                }}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <SemesterRow
                key={s.id}
                semester={s}
                onEdit={() => setEditing(s.id)}
                onDelete={() => onDelete(s.id)}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}

function SemesterRow({ semester, onEdit, onDelete }) {
  return (
    <div
      style={{
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: theme.radius,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: theme.radiusSm,
          background: theme.accentSoft,
          color: theme.accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <CalendarRange size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 15 }}>{semester.name}</div>
        {semester.startDate && semester.endDate && (
          <div style={{ fontSize: 13, color: theme.inkSoft, marginTop: 2 }}>
            {formatSelectedDate(semester.startDate)} → {formatSelectedDate(semester.endDate)}
          </div>
        )}
      </div>
      <button onClick={onEdit} aria-label="Edit" style={iconBtn}>
        <Pencil size={16} />
      </button>
      <button onClick={onDelete} aria-label="Delete" style={iconBtn}>
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function SemesterForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [saving, setSaving] = useState(false);

  const valid = name.trim() && startDate && endDate && startDate <= endDate;

  async function save() {
    if (!valid || saving) return;
    setSaving(true);
    try {
      await onSave({ name: name.trim(), startDate, endDate });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: theme.radius,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <input
        placeholder="e.g. Fall 2026"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
        style={inputStyle}
      />
      <div style={{ display: "flex", gap: 10 }}>
        <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={fieldLabel}>Start</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={inputStyle}
          />
        </label>
        <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={fieldLabel}>End</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={inputStyle}
          />
        </label>
      </div>
      {startDate && endDate && startDate > endDate && (
        <div style={{ fontSize: 12, color: theme.danger }}>End must be on or after start.</div>
      )}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={btnGhost}>
          Cancel
        </button>
        <button onClick={save} disabled={!valid || saving} style={{ ...btnPrimary, opacity: !valid || saving ? 0.5 : 1 }}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div
      style={{
        padding: "40px 20px",
        background: theme.surface,
        borderRadius: theme.radius,
        border: `1px solid ${theme.border}`,
        color: theme.inkSoft,
        fontSize: 14,
        textAlign: "center",
      }}
    >
      No semesters yet. Add one to start organizing your classes.
    </div>
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
  padding: "8px 14px",
  borderRadius: theme.radiusSm,
  background: theme.accent,
  color: "white",
  fontSize: 13,
  fontWeight: 500,
  border: "none",
};

const btnPrimarySm = {
  ...btnPrimary,
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 12px",
};

const btnGhost = {
  padding: "8px 14px",
  borderRadius: theme.radiusSm,
  background: "transparent",
  color: theme.inkSoft,
  fontSize: 13,
  fontWeight: 500,
  border: "none",
};

const iconBtn = {
  padding: 6,
  color: theme.inkSoft,
  borderRadius: theme.radiusSm,
  background: "transparent",
  border: "none",
};
