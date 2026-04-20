import { X } from "lucide-react";
import { theme } from "../theme";
import AssignmentForm from "./AssignmentForm";
import NoteForm from "./NoteForm";
import ReminderForm from "./ReminderForm";

// Thin shell around the three item forms. Chooses which form to render based
// on `kind` (create mode) or `initialItem.kind` (edit mode).
//
// Props:
//   open             - whether the modal is visible
//   kind             - "assignment" | "note" | "reminder" (create mode only)
//   initialItem      - existing item (edit mode); kind is read from it
//   initialDate      - default date when creating from a specific calendar day
//   classes          - full class list (needed by all three forms)
//   onClose          - close without saving
//   onCreateAssignment / onCreateNote / onCreateReminder
//   onUpdateAssignment / onUpdateNote / onUpdateReminder
export default function ItemModal({
  open,
  kind,
  initialItem,
  initialDate,
  classes,
  onClose,
  onCreateAssignment,
  onCreateNote,
  onCreateReminder,
  onUpdateAssignment,
  onUpdateNote,
  onUpdateReminder,
}) {
  if (!open) return null;

  const isEdit = !!initialItem;
  const effectiveKind = isEdit ? initialItem.kind : kind;

  const headerText =
    (isEdit ? "Edit " : "New ") +
    { assignment: "Assignment", note: "Note", reminder: "Reminder" }[effectiveKind];

  // Route save to the right handler and close on success.
  async function handleSave(payload) {
    if (isEdit) {
      if (effectiveKind === "assignment") await onUpdateAssignment(initialItem.id, payload);
      else if (effectiveKind === "note") await onUpdateNote(initialItem.id, payload);
      else if (effectiveKind === "reminder") await onUpdateReminder(initialItem.id, payload);
    } else {
      if (effectiveKind === "assignment") await onCreateAssignment(payload);
      else if (effectiveKind === "note") await onCreateNote(payload);
      else if (effectiveKind === "reminder") await onCreateReminder(payload);
    }
    onClose();
  }

  // For create mode, pre-fill date fields with the currently selected
  // calendar day. Edit mode gets the item's existing values.
  const initialForForm =
    initialItem ??
    (effectiveKind === "assignment"
      ? { dueDate: initialDate, dueTime: "23:59" }
      : { date: initialDate });

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
        style={{
          position: "fixed",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(440px, 92vw)",
          maxHeight: "92vh",
          overflowY: "auto",
          background: theme.surface,
          borderRadius: theme.radius,
          zIndex: 31,
          padding: 20,
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <h3 className="display" style={{ fontSize: 20, fontWeight: 500, margin: 0 }}>
            {headerText}
          </h3>
          <button onClick={onClose} aria-label="Close" style={{ padding: 6, background: "none", border: "none", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        {effectiveKind === "assignment" && (
          <AssignmentForm
            initial={isEdit ? initialItem : initialForForm}
            classes={classes}
            onSave={handleSave}
            onCancel={onClose}
          />
        )}
        {effectiveKind === "note" && (
          <NoteForm
            initial={isEdit ? initialItem : initialForForm}
            classes={classes}
            onSave={handleSave}
            onCancel={onClose}
          />
        )}
        {effectiveKind === "reminder" && (
          <ReminderForm
            initial={isEdit ? initialItem : initialForForm}
            classes={classes}
            onSave={handleSave}
            onCancel={onClose}
          />
        )}
      </div>
    </>
  );
}
