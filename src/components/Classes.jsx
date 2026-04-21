import { useState, useMemo } from "react";
import { Plus, Trash2, BookOpen, Pencil } from "lucide-react";
import { theme } from "../theme";
import { getClassColor } from "../lib/classColors";
import { computeClassGrade } from "../lib/grading";
import { ymd } from "../lib/dateUtils";
import ClassForm from "./ClassForm";

// Classes screen. Groups by semester; hides ended classes by default.
// Top-row buttons let students add a class or jump straight into an
// assignment form without leaving the tab.
export default function Classes({
  classes,
  assignments,
  semesters,
  onCreate,
  onUpdate,
  onDelete,
  onAddAssignment,
}) {
  const [editing, setEditing] = useState(null); // null | "new" | <classId>
  const [showEnded, setShowEnded] = useState(false);

  const todayStr = ymd(new Date());

  // A class is "ended" if it has an endDate and today is after it.
  const isEnded = (cls) => cls.endDate && cls.endDate < todayStr;

  const visibleClasses = useMemo(
    () => (showEnded ? classes : classes.filter((c) => !isEnded(c))),
    [classes, showEnded, todayStr], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Pre-bucket assignments by class so each row's running grade is cheap.
  const assignmentsByClass = useMemo(() => {
    const map = {};
    for (const a of assignments) (map[a.classId] ||= []).push(a);
    return map;
  }, [assignments]);

  // Group classes by semester. Classes without a semester go in "Unassigned".
  const grouped = useMemo(() => {
    const bySem = new Map();
    for (const s of semesters) bySem.set(s.id, { semester: s, classes: [] });
    const unassigned = [];
    for (const c of visibleClasses) {
      if (c.semesterId && bySem.has(c.semesterId)) {
        bySem.get(c.semesterId).classes.push(c);
      } else {
        unassigned.push(c);
      }
    }
    const groups = [...bySem.values()]
      .filter((g) => g.classes.length > 0)
      .sort((a, b) =>
        (b.semester.startDate || "").localeCompare(a.semester.startDate || ""),
      );
    if (unassigned.length) groups.push({ semester: null, classes: unassigned });
    return groups;
  }, [visibleClasses, semesters]);

  const endedCount = classes.length - classes.filter((c) => !isEnded(c)).length;

  return (
    <div>
      <h2 className="display" style={{ fontSize: 20, fontWeight: 500, margin: "0 0 12px" }}>
        Your Classes
      </h2>

      {/* Top action row */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <button
          onClick={() => setEditing("new")}
          disabled={editing === "new"}
          style={{ ...btnPrimary, flex: 1, opacity: editing === "new" ? 0.5 : 1 }}
        >
          <Plus size={16} /> Add Class
        </button>
        <button
          onClick={onAddAssignment}
          disabled={classes.length === 0}
          style={{ ...btnSecondary, flex: 1, opacity: classes.length === 0 ? 0.5 : 1 }}
        >
          <Plus size={16} /> Add Assignment
        </button>
      </div>

      {/* New-class form */}
      {editing === "new" && (
        <div style={{ marginBottom: 14 }}>
          <ClassForm
            semesters={semesters}
            onSave={async (payload) => {
              await onCreate(payload);
              setEditing(null);
            }}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {classes.length === 0 && editing !== "new" ? (
        <Empty hasSemesters={semesters.length > 0} />
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {grouped.map((group) => (
              <section key={group.semester?.id ?? "unassigned"}>
                <h3 style={sectionHeading}>
                  {group.semester ? group.semester.name : "Unassigned"}
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {group.classes.map((c) =>
                    editing === c.id ? (
                      <ClassForm
                        key={c.id}
                        initial={c}
                        semesters={semesters}
                        onSave={async (payload) => {
                          await onUpdate(c.id, payload);
                          setEditing(null);
                        }}
                        onCancel={() => setEditing(null)}
                      />
                    ) : (
                      <ClassRow
                        key={c.id}
                        cls={c}
                        assignments={assignmentsByClass[c.id] ?? []}
                        onEdit={() => setEditing(c.id)}
                        onDelete={() => onDelete(c.id)}
                      />
                    ),
                  )}
                </div>
              </section>
            ))}
          </div>

          {/* Show / hide ended classes */}
          {endedCount > 0 && (
            <button
              onClick={() => setShowEnded((s) => !s)}
              style={{
                display: "block",
                margin: "24px auto 0",
                padding: "8px 14px",
                borderRadius: theme.radiusSm,
                background: "transparent",
                color: theme.inkSoft,
                fontSize: 13,
                fontWeight: 500,
                border: `1px solid ${theme.border}`,
                cursor: "pointer",
              }}
            >
              {showEnded
                ? `Hide past classes (${endedCount})`
                : `Show past classes (${endedCount})`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function ClassRow({ cls, assignments, onEdit, onDelete }) {
  const color = getClassColor(cls.color);
  const { currentGrade } = computeClassGrade(cls, assignments);

  return (
    <div
      style={{
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: theme.radius,
        padding: "14px 16px 14px 18px",
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
          background: color.solid,
        }}
      />
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: theme.radiusSm,
          background: color.soft,
          color: color.solid,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <BookOpen size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 15 }}>{cls.name}</div>
        <div style={{ fontSize: 13, color: theme.inkSoft, marginTop: 2 }}>
          {cls.code || "No code"}
          {currentGrade !== null && (
            <>
              {" · "}
              <span style={{ color: theme.accent, fontWeight: 600 }}>
                {currentGrade.toFixed(1)}%
              </span>
            </>
          )}
        </div>
      </div>
      <button onClick={onEdit} aria-label="Edit class" style={iconBtn}>
        <Pencil size={16} />
      </button>
      <button onClick={onDelete} aria-label="Delete class" style={iconBtn}>
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function Empty({ hasSemesters }) {
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
      {hasSemesters
        ? "No classes yet. Add your first class to start tracking assignments."
        : "No classes yet. You can add a semester first from the Semesters tab, or add a class directly."}
    </div>
  );
}

const sectionHeading = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: theme.inkSoft,
  margin: "0 0 10px 4px",
};

const btnPrimary = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  padding: "10px 14px",
  borderRadius: theme.radiusSm,
  background: theme.accent,
  color: "white",
  fontSize: 13,
  fontWeight: 500,
  border: "none",
  cursor: "pointer",
};

const btnSecondary = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  padding: "10px 14px",
  borderRadius: theme.radiusSm,
  background: theme.surface,
  color: theme.accent,
  fontSize: 13,
  fontWeight: 500,
  border: `1px solid ${theme.accent}`,
  cursor: "pointer",
};

const iconBtn = {
  padding: 6,
  color: theme.inkSoft,
  borderRadius: theme.radiusSm,
  background: "transparent",
  border: "none",
  cursor: "pointer",
};
