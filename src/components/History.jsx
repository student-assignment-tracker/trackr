import { useMemo, useState } from "react";
import { CheckCircle2, Circle, Clock, Pencil, ChevronDown, ChevronRight, BookOpen } from "lucide-react";
import { theme } from "../theme";
import { ymd, formatTime } from "../lib/dateUtils";
import { getClassColor } from "../lib/classColors";
import { computeClassGrade } from "../lib/grading";

// History view: past classes (with final grades) and past assignments.
export default function History({ assignments, classes, onToggleDone, onEdit }) {
  const [filter, setFilter] = useState("all");
  const [expandedClass, setExpandedClass] = useState(null); // class id currently expanded in Past Classes
  const classesById = useMemo(
    () => Object.fromEntries(classes.map((c) => [c.id, c])),
    [classes],
  );

  const todayStr = ymd(new Date());

  // Ended classes: those with an endDate in the past.
  const endedClasses = useMemo(
    () =>
      classes
        .filter((c) => c.endDate && c.endDate < todayStr)
        .sort((a, b) => (b.endDate || "").localeCompare(a.endDate || "")),
    [classes, todayStr],
  );

  // Pre-bucket assignments per class so the grade computation is cheap.
  const assignmentsByClass = useMemo(() => {
    const map = {};
    for (const a of assignments) (map[a.classId] ||= []).push(a);
    return map;
  }, [assignments]);

  const past = useMemo(
    () => assignments.filter((a) => a.dueDate < todayStr || a.done),
    [assignments, todayStr],
  );

  const filtered = useMemo(() => {
    if (filter === "completed") return past.filter((a) => a.done);
    if (filter === "overdue") return past.filter((a) => !a.done && a.dueDate < todayStr);
    return past;
  }, [past, filter, todayStr]);

  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) =>
        (b.dueDate + (b.dueTime || "")).localeCompare(a.dueDate + (a.dueTime || "")),
      ),
    [filtered],
  );

  const stats = useMemo(() => {
    const completed = past.filter((a) => a.done).length;
    const total = past.length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, rate };
  }, [past]);

  return (
    <div>
      {/* Past classes section — appears first so students see final grades prominently */}
      {endedClasses.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <h2 className="display" style={{ fontSize: 20, fontWeight: 500, margin: "0 0 12px" }}>
            Past Classes
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {endedClasses.map((cls) => (
              <PastClassCard
                key={cls.id}
                cls={cls}
                assignments={assignmentsByClass[cls.id] ?? []}
                expanded={expandedClass === cls.id}
                onToggle={() =>
                  setExpandedClass((prev) => (prev === cls.id ? null : cls.id))
                }
              />
            ))}
          </div>
        </section>
      )}

      <h2 className="display" style={{ fontSize: 20, fontWeight: 500, margin: "0 0 16px" }}>
        Assignment History
      </h2>

      {stats.total > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 18 }}>
          <StatCard label="Completed" value={stats.completed} />
          <StatCard label="Total past" value={stats.total} />
          <StatCard label="Completion" value={`${stats.rate}%`} />
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: 4,
          padding: 4,
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: 999,
          marginBottom: 16,
          width: "fit-content",
        }}
      >
        {["all", "completed", "overdue"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 500,
              textTransform: "capitalize",
              background: filter === f ? theme.accent : "transparent",
              color: filter === f ? "white" : theme.inkSoft,
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
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
          {assignments.length === 0
            ? "No assignments yet. Add one from the calendar."
            : "Nothing to review here."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sorted.map((a) => {
            const cls = classesById[a.classId];
            const className = cls?.name ?? "Unknown class";
            const color = getClassColor(cls?.color);
            const overdue = !a.done && a.dueDate < todayStr;
            return (
              <div
                key={a.id}
                style={{
                  background: theme.surface,
                  border: `1px solid ${theme.border}`,
                  borderRadius: theme.radius,
                  padding: "14px 16px 14px 18px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  opacity: a.done ? 0.6 : 1,
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
                <button
                  onClick={() => onToggleDone(a.id)}
                  style={{
                    padding: 0,
                    marginTop: 2,
                    color: a.done ? theme.accent : theme.inkSoft,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                  aria-label={a.done ? "Mark undone" : "Mark done"}
                >
                  {a.done ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                </button>
                <button
                  onClick={() => onEdit({ ...a, kind: "assignment" })}
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
                      textDecoration: a.done ? "line-through" : "none",
                    }}
                  >
                    {a.title}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: theme.inkSoft,
                      marginTop: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      flexWrap: "wrap",
                    }}
                  >
                    <span>{className}</span>
                    <span>•</span>
                    <Clock size={12} />
                    <span>
                      {a.dueDate}
                      {a.dueTime ? ` ${formatTime(a.dueTime)}` : ""}
                    </span>
                  </div>
                </button>
                {overdue && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: theme.danger,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Overdue
                  </span>
                )}
                <button
                  onClick={() => onEdit({ ...a, kind: "assignment" })}
                  aria-label="Edit"
                  style={{ padding: 6, color: theme.inkSoft, background: "none", border: "none", cursor: "pointer" }}
                >
                  <Pencil size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div
      style={{
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: theme.radius,
        padding: "14px 12px",
        textAlign: "center",
      }}
    >
      <div
        className="display"
        style={{
          fontSize: 24,
          fontWeight: 500,
          color: theme.accent,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 11,
          color: theme.inkSoft,
          marginTop: 6,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          fontWeight: 600,
        }}
      >
        {label}
      </div>
    </div>
  );
}

// Past class row — collapsed shows name + final grade; expanded reveals a
// per-category breakdown of averages and assignment counts.
function PastClassCard({ cls, assignments, expanded, onToggle }) {
  const color = getClassColor(cls.color);
  const { currentGrade, categoryBreakdowns } = computeClassGrade(cls, assignments);
  const hasBreakdown = categoryBreakdowns.length > 0;

  return (
    <div
      style={{
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: theme.radius,
        overflow: "hidden",
        position: "relative",
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
      <button
        onClick={onToggle}
        disabled={!hasBreakdown}
        style={{
          width: "100%",
          padding: "14px 16px 14px 18px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "transparent",
          border: "none",
          cursor: hasBreakdown ? "pointer" : "default",
          color: "inherit",
          font: "inherit",
          textAlign: "left",
        }}
      >
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
            {cls.endDate ? ` · Ended ${cls.endDate}` : ""}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div
            className="display"
            style={{
              fontSize: 20,
              fontWeight: 500,
              color: currentGrade !== null ? theme.accent : theme.inkSoft,
              lineHeight: 1,
            }}
          >
            {currentGrade !== null ? `${currentGrade.toFixed(1)}%` : "—"}
          </div>
          <div style={{ fontSize: 11, color: theme.inkSoft, marginTop: 4, fontWeight: 500 }}>
            final grade
          </div>
        </div>
        {hasBreakdown && (
          <div style={{ color: theme.inkSoft, marginLeft: 4 }}>
            {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </div>
        )}
      </button>

      {/* Expanded category breakdown */}
      {expanded && hasBreakdown && (
        <div
          style={{
            borderTop: `1px solid ${theme.border}`,
            padding: "10px 16px 12px 22px",
            background: theme.bg,
          }}
        >
          {categoryBreakdowns.map((cat) => (
            <div
              key={cat.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "8px 0",
                borderBottom: `1px solid ${theme.border}`,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{cat.name}</div>
                <div style={{ fontSize: 12, color: theme.inkSoft, marginTop: 2 }}>
                  {cat.weight}% weight · {cat.scoredCount}/{cat.totalCount} graded
                </div>
              </div>
              <div
                style={{
                  fontVariantNumeric: "tabular-nums",
                  fontWeight: 600,
                  fontSize: 15,
                  color: cat.average !== null ? theme.ink : theme.inkSoft,
                }}
              >
                {cat.average !== null ? `${cat.average.toFixed(1)}%` : "—"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
