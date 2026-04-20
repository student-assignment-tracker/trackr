import { theme } from "../theme";
import { CLASS_COLORS, getClassColor } from "../lib/classColors";

// Notes and reminders can be visually tagged in one of two ways:
//   - with a palette color (free-floating, not tied to a class)
//   - by attaching to a class (inherits that class's color)
// These two modes are mutually exclusive. This component manages the toggle
// and the picker for whichever mode is active.
//
// Value shape: { color: string|null, classId: string|null }
//   - If classId is set, color is ignored on render (class color wins).
//   - If neither is set, the item gets the neutral "unassigned" stripe.
export default function ColorOrClassPicker({ value, onChange, classes }) {
  const { color, classId } = value;
  const mode = classId ? "class" : "color"; // default to color mode when both are empty

  function setMode(next) {
    if (next === "color") onChange({ color: color ?? CLASS_COLORS[0].id, classId: null });
    else onChange({ color: null, classId: classes[0]?.id ?? null });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Mode toggle */}
      <div
        style={{
          display: "flex",
          gap: 4,
          padding: 4,
          background: theme.bg,
          borderRadius: 999,
        }}
      >
        {[
          { key: "color", label: "Color" },
          { key: "class", label: "Class", disabled: classes.length === 0 },
        ].map(({ key, label, disabled }) => {
          const active = mode === key;
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => setMode(key)}
              style={{
                flex: 1,
                padding: "6px 12px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 500,
                background: active ? theme.accent : "transparent",
                color: active ? "white" : theme.inkSoft,
                border: "none",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.4 : 1,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Picker for the active mode */}
      {mode === "color" ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {CLASS_COLORS.map((c) => {
            const selected = color === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onChange({ color: c.id, classId: null })}
                aria-label={c.id}
                style={{
                  width: 28,
                  height: 28,
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
      ) : (
        <select
          value={classId ?? ""}
          onChange={(e) => onChange({ color: null, classId: e.target.value })}
          style={selectStyle}
        >
          {classes.map((c) => {
            const col = getClassColor(c.color);
            return (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.code ? ` (${c.code})` : ""}
              </option>
            );
          })}
        </select>
      )}
    </div>
  );
}

const selectStyle = {
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
