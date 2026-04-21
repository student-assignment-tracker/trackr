import { X, Calendar, Timer, BookOpen, History, CalendarRange } from "lucide-react";
import { theme } from "../theme";

const ITEMS = [
  { key: "calendar", label: "Calendar", Icon: Calendar },
  { key: "pomodoro", label: "Pomodoro", Icon: Timer },
  { key: "classes", label: "Classes", Icon: BookOpen },
  { key: "semesters", label: "Semesters", Icon: CalendarRange },
  { key: "history", label: "History", Icon: History },
];

export default function Drawer({ open, currentView, onSelect, onClose }) {
  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(31, 36, 32, 0.4)",
          zIndex: 20,
        }}
      />
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: "min(280px, 82vw)",
          background: theme.surface,
          zIndex: 21,
          padding: "20px 16px",
          display: "flex",
          flexDirection: "column",
          borderRight: `1px solid ${theme.border}`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 28,
          }}
        >
          <span className="display" style={{ fontSize: 22, fontWeight: 500 }}>
            Menu
          </span>
          <button onClick={onClose} aria-label="Close menu" style={{ padding: 8 }}>
            <X size={20} />
          </button>
        </div>

        {ITEMS.map(({ key, label, Icon }) => {
          const active = currentView === key;
          return (
            <button
              key={key}
              onClick={() => {
                onSelect(key);
                onClose();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "12px 14px",
                borderRadius: theme.radiusSm,
                marginBottom: 4,
                background: active ? theme.accentSoft : "transparent",
                color: active ? theme.accent : theme.ink,
                fontWeight: active ? 600 : 500,
                fontSize: 15,
                width: "100%",
                textAlign: "left",
              }}
            >
              <Icon size={18} />
              {label}
            </button>
          );
        })}

        <div style={{ marginTop: "auto", padding: 12, fontSize: 12, color: theme.inkSoft }}>
          Signed in as student
        </div>
      </nav>
    </>
  );
}
