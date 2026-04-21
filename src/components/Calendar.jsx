import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { theme } from "../theme";
import { MONTHS, DAYS_SHORT, ymd, buildMonthGrid, formatSelectedDate } from "../lib/dateUtils";
import { getClassColor } from "../lib/classColors";
import { computeLectures } from "../lib/lectures";
import ItemCard from "./ItemCard";

const MAX_DOTS = 3;

// Sort items within a day: lectures and reminders first by time, then
// timed assignments, then notes.
function sortDayItems(items) {
  const kindOrder = { lecture: 0, reminder: 1, assignment: 2, note: 3 };
  return [...items].sort((a, b) => {
    const k = kindOrder[a.kind] - kindOrder[b.kind];
    if (k !== 0) return k;
    const at = a.startTime || a.dueTime || "";
    const bt = b.startTime || b.dueTime || "";
    return at.localeCompare(bt);
  });
}

export default function Calendar({
  viewDate,
  setViewDate,
  selectedDate,
  setSelectedDate,
  assignments,
  notes,
  reminders,
  classes,
  onToggleDone,
  onDelete,
  onEdit,
  todayStr,
}) {
  const classesById = useMemo(
    () => Object.fromEntries(classes.map((c) => [c.id, c])),
    [classes],
  );

  // Compute lectures for the visible month + some padding (to cover cells
  // from the previous/next month that show up in the grid).
  const lectures = useMemo(() => {
    const rangeStart = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 20);
    const rangeEnd = new Date(viewDate.getFullYear(), viewDate.getMonth() + 2, 10);
    return computeLectures(classes, rangeStart, rangeEnd);
  }, [classes, viewDate]);

  // Map of date string -> items on that date, each item tagged with a kind.
  const itemsByDate = useMemo(() => {
    const map = {};
    assignments.forEach((a) => (map[a.dueDate] ||= []).push({ ...a, kind: "assignment" }));
    notes.forEach((n) => (map[n.date] ||= []).push({ ...n, kind: "note" }));
    reminders.forEach((r) => (map[r.date] ||= []).push({ ...r, kind: "reminder" }));
    lectures.forEach((l) => (map[l.date] ||= []).push(l));
    return map;
  }, [assignments, notes, reminders, lectures]);

  const cells = buildMonthGrid(viewDate.getFullYear(), viewDate.getMonth());
  const selectedItems = sortDayItems(itemsByDate[selectedDate] || []);
  const monthLabel = `${MONTHS[viewDate.getMonth()]} ${viewDate.getFullYear()}`;

  return (
    <div>
      {/* Month header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <button
          onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
          style={{ padding: 8, borderRadius: theme.radiusSm }}
          aria-label="Previous month"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="display" style={{ margin: 0, fontSize: 24, fontWeight: 500 }}>
          {monthLabel}
        </h2>
        <button
          onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
          style={{ padding: 8, borderRadius: theme.radiusSm }}
          aria-label="Next month"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Weekday row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 6 }}>
        {DAYS_SHORT.map((d, i) => (
          <div
            key={i}
            style={{
              textAlign: "center",
              fontSize: 11,
              color: theme.inkSoft,
              fontWeight: 600,
              letterSpacing: "0.08em",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 4,
          background: theme.surface,
          padding: 10,
          borderRadius: theme.radius,
          border: `1px solid ${theme.border}`,
        }}
      >
        {cells.map((date, idx) => {
          if (!date) return <div key={idx} />;
          const key = ymd(date);
          const items = itemsByDate[key] || [];
          const isSelected = key === selectedDate;
          const isToday = key === todayStr;

          // Collect unique colors for this day. Each kind resolves through the
          // same logic the cards use, so calendar dots match their cards.
          const colorSet = new Set();
          for (const item of items) {
            colorSet.add(resolveDotColor(item, classesById));
          }
          const colors = [...colorSet];

          return (
            <button
              key={idx}
              className={`cal-cell ${isSelected ? "selected" : ""}`}
              onClick={() => setSelectedDate(key)}
              style={{
                aspectRatio: "1",
                borderRadius: theme.radiusSm,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                fontSize: 14,
                fontWeight: isToday ? 700 : 500,
                color: isSelected ? "white" : isToday ? theme.accent : theme.ink,
                position: "relative",
                border: isToday && !isSelected ? `1.5px solid ${theme.accent}` : "1.5px solid transparent",
                padding: 0,
              }}
            >
              <span>{date.getDate()}</span>
              {colors.length > 0 && (
                <span
                  style={{
                    display: "flex",
                    gap: 2,
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 6,
                  }}
                >
                  {colors.slice(0, MAX_DOTS).map((c, i) => (
                    <span
                      key={i}
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: isSelected ? "white" : c,
                      }}
                    />
                  ))}
                  {colors.length > MAX_DOTS && (
                    <span
                      style={{
                        fontSize: 8,
                        fontWeight: 700,
                        color: isSelected ? "white" : theme.inkSoft,
                        marginLeft: 1,
                      }}
                    >
                      +{colors.length - MAX_DOTS}
                    </span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Day detail */}
      <section style={{ marginTop: 24 }}>
        <h3 className="display" style={{ fontSize: 18, fontWeight: 500, margin: "0 0 12px" }}>
          {formatSelectedDate(selectedDate)}
        </h3>
        {selectedItems.length === 0 ? (
          <div
            style={{
              padding: "24px 20px",
              background: theme.surface,
              borderRadius: theme.radius,
              border: `1px solid ${theme.border}`,
              color: theme.inkSoft,
              fontSize: 14,
              textAlign: "center",
            }}
          >
            Nothing scheduled.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {selectedItems.map((item) => (
              <ItemCard
                key={`${item.kind}-${item.id}`}
                item={item}
                classesById={classesById}
                onToggleDone={onToggleDone}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// Resolve the color for a day-cell dot. Mirrors ItemCard's logic so the dot
// matches the card's stripe.
function resolveDotColor(item, classesById) {
  if (item.classId) {
    const cls = classesById[item.classId];
    if (cls) return getClassColor(cls.color).solid;
  }
  if (item.color) return getClassColor(item.color).solid;
  return theme.inkSoft;
}
