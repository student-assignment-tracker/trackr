import { Circle, CheckCircle2, Trash2, Pencil, Clock, BookOpen } from "lucide-react";
import { theme } from "../theme";
import { formatTime } from "../lib/dateUtils";
import { getClassColor } from "../lib/classColors";

// Shared row for every calendar item. Four kinds:
//   - assignment: has a class; toggleable done/undone; editable; deletable
//   - reminder:   has a time (and optional end time); editable; deletable
//   - note:       date-only; editable; deletable
//   - lecture:    computed from a class's schedule; NOT editable or deletable
//                 (to skip one, students edit the class's schedule)
export default function ItemCard({ item, classesById, onToggleDone, onDelete, onEdit }) {
  const color = resolveColor(item, classesById);
  const cls = item.classId ? classesById[item.classId] : null;

  // Lectures get their own, simpler treatment — outlined and muted.
  if (item.kind === "lecture") {
    return <LectureCard item={item} cls={cls} color={color} />;
  }

  const isAssignment = item.kind === "assignment";
  const isReminder = item.kind === "reminder";

  return (
    <div
      style={{
        background: theme.surface,
        borderRadius: theme.radius,
        border: `1px solid ${theme.border}`,
        padding: "14px 16px 14px 18px",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        opacity: item.done ? 0.55 : 1,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Color stripe */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: color,
        }}
      />

      {/* Leading icon area */}
      {isAssignment ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleDone(item.id);
          }}
          aria-label={item.done ? "Mark undone" : "Mark done"}
          style={{
            padding: 0,
            marginTop: 2,
            color: item.done ? theme.accent : theme.inkSoft,
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          {item.done ? <CheckCircle2 size={20} /> : <Circle size={20} />}
        </button>
      ) : isReminder ? (
        <Clock size={18} style={{ marginTop: 2, color: theme.inkSoft, flexShrink: 0 }} />
      ) : (
        // Note
        <div
          style={{
            marginTop: 6,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: color,
            flexShrink: 0,
          }}
        />
      )}

      {/* Body — click to edit */}
      <button
        onClick={() => onEdit(item)}
        style={{
          flex: 1,
          minWidth: 0,
          background: "none",
          border: "none",
          padding: 0,
          textAlign: "left",
          cursor: "pointer",
          color: "inherit",
          font: "inherit",
        }}
      >
        <div
          style={{
            fontWeight: 600,
            fontSize: 15,
            textDecoration: item.done ? "line-through" : "none",
          }}
        >
          {item.title}
        </div>
        <div style={subStyle}>{buildSubtitle(item, cls)}</div>
      </button>

      <button onClick={() => onEdit(item)} aria-label="Edit" style={iconBtn}>
        <Pencil size={16} />
      </button>
      <button
        onClick={() => onDelete(item.id, item.kind)}
        aria-label="Delete"
        style={iconBtn}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

// ---- Lecture card ---------------------------------------------------------

function LectureCard({ item, cls, color }) {
  return (
    <div
      style={{
        background: "transparent",
        borderRadius: theme.radius,
        border: `1px dashed ${theme.border}`,
        padding: "12px 14px 12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: color,
          opacity: 0.5,
        }}
      />
      <BookOpen size={16} style={{ color, opacity: 0.8, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: 14, color: theme.ink }}>
          {cls?.name ?? "Lecture"}
          {cls?.code ? ` · ${cls.code}` : ""}
        </div>
        <div style={{ fontSize: 13, color: theme.inkSoft, marginTop: 1 }}>
          {formatTime(item.startTime)}
          {item.endTime ? ` – ${formatTime(item.endTime)}` : ""}
        </div>
      </div>
    </div>
  );
}

// ---- Helpers --------------------------------------------------------------

// Resolve the display color for any item. Priority:
//   1. If item.classId is set (and valid), use that class's color
//   2. If item has a free-form color id (from ColorOrClassPicker), use that
//   3. Otherwise fall back to a neutral soft stripe
function resolveColor(item, classesById) {
  if (item.classId) {
    const cls = classesById[item.classId];
    if (cls) return getClassColor(cls.color).solid;
  }
  if (item.color) return getClassColor(item.color).solid;
  return theme.inkSoft;
}

function buildSubtitle(item, cls) {
  if (item.kind === "assignment") {
    const className = cls?.name ?? "Unknown class";
    return `${className}${item.dueTime ? ` · Due ${formatTime(item.dueTime)}` : ""}`;
  }
  if (item.kind === "reminder") {
    const time =
      formatTime(item.startTime) +
      (item.endTime ? ` – ${formatTime(item.endTime)}` : "");
    return cls ? `${cls.name} · ${time}` : time;
  }
  // note
  if (cls) return `${cls.name}${item.body ? ` · ${item.body}` : ""}`;
  return item.body || "Note";
}

const subStyle = {
  fontSize: 13,
  color: theme.inkSoft,
  marginTop: 2,
};

const iconBtn = {
  padding: 6,
  color: theme.inkSoft,
  borderRadius: theme.radiusSm,
  background: "transparent",
  border: "none",
  cursor: "pointer",
};
