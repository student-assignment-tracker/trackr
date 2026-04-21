import { X, CheckSquare, Clock, FileText, BookOpen } from "lucide-react";
import { theme } from "../theme";

// Bottom-sheet-style chooser shown when the user taps the "+" FAB.
// On mobile, renders as a sheet pinned to the bottom (more thumb-friendly).
// On wider screens, centers as a small dialog.
//
// Props:
//   open     - whether to render at all
//   onClose  - called when the user dismisses (tap overlay, tap X, tap Cancel)
//   onPick   - called with one of: "assignment" | "class" | "note" | "reminder"
const OPTIONS = [
  {
    key: "assignment",
    label: "Assignment",
    sub: "A task with a due date",
    Icon: CheckSquare,
  },
  {
    key: "reminder",
    label: "Reminder",
    sub: "Something at a specific time",
    Icon: Clock,
  },
  {
    key: "note",
    label: "Note",
    sub: "Plain text on a day",
    Icon: FileText,
  },
  {
    key: "class",
    label: "Class",
    sub: "Add a new class",
    Icon: BookOpen,
  },
];

export default function AddChooser({ open, onClose, onPick }) {
  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(31, 36, 32, 0.4)",
          zIndex: 30,
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="What would you like to add?"
        style={{
          position: "fixed",
          left: "50%",
          bottom: 0,
          transform: "translateX(-50%)",
          width: "min(440px, 100vw)",
          background: theme.surface,
          borderTopLeftRadius: theme.radius,
          borderTopRightRadius: theme.radius,
          zIndex: 31,
          padding: "18px 16px 22px",
          boxShadow: "0 -20px 60px rgba(0,0,0,0.2)",
        }}
      >
        {/* Drag handle visual cue (decorative) */}
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            background: theme.border,
            margin: "0 auto 14px",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <h3 className="display" style={{ fontSize: 18, fontWeight: 500, margin: 0 }}>
            Add to calendar
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ padding: 6, background: "none", border: "none", cursor: "pointer", color: theme.inkSoft }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {OPTIONS.map(({ key, label, sub, Icon }) => (
            <button
              key={key}
              onClick={() => onPick(key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 14px",
                borderRadius: theme.radiusSm,
                background: theme.bg,
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                color: theme.ink,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: theme.radiusSm,
                  background: theme.accentSoft,
                  color: theme.accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{label}</div>
                <div style={{ fontSize: 13, color: theme.inkSoft, marginTop: 1 }}>{sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
