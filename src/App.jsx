import { useState, useEffect, useCallback } from "react";
import { Menu, Plus } from "lucide-react";

import { theme } from "./theme";
import { ymd } from "./lib/dateUtils";
import * as api from "./lib/api";
import { supabase } from "./lib/supabaseClient";

import Drawer from "./components/Drawer";
import Calendar from "./components/Calendar";
import Pomodoro from "./components/Pomodoro";
import Classes from "./components/Classes";
import Semesters from "./components/Semesters";
import History from "./components/History";
import ItemModal from "./components/ItemModal";
import AddChooser from "./components/AddChooser";
import LoginPage from "./components/LoginPage";

const VIEW_TITLES = {
  calendar: "Calendar",
  pomodoro: "Focus",
  classes: "Classes",
  semesters: "Semesters",
  history: "History",
};

export default function App() {
  // Auth state
  const [session, setSession] = useState(undefined); // undefined = loading

  useEffect(() => {
    api.getSession().then(setSession);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Show nothing while we resolve the initial session.
  if (session === undefined) return null;

  // Show login screen when not authenticated.
  if (session === null) return <LoginPage />;

  return <AuthenticatedApp session={session} />;
}

function AuthenticatedApp({ session }) {
  // UI state
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState("calendar");

  // Modal state. `editingItem` drives create-vs-edit mode in ItemModal.
  // `creatingKind` is which form to show in create mode ("assignment" | "note" | "reminder").
  // `chooserOpen` controls the "+" chooser shown before ItemModal.
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [creatingKind, setCreatingKind] = useState("assignment");
  const [chooserOpen, setChooserOpen] = useState(false);

  // Calendar navigation
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(ymd(today));

  // Data — everything flows through `api`. When `lib/api.js` is rewired
  // to Supabase, these calls transparently become real queries.
  const [assignments, setAssignments] = useState([]);
  const [notes, setNotes] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [classes, setClasses] = useState([]);
  const [semesters, setSemesters] = useState([]);

  useEffect(() => {
    (async () => {
      setAssignments(await api.getAssignments());
      setNotes(await api.getNotes());
      setReminders(await api.getReminders());
      setClasses(await api.getClasses());
      setSemesters(await api.getSemesters());
    })();
  }, []);

  // ---- Assignment handlers -----------------------------------------------

  const handleCreateAssignment = useCallback(async (payload) => {
    const row = await api.createAssignment(payload);
    setAssignments((prev) => [...prev, row]);
  }, []);

  const handleUpdateAssignment = useCallback(async (id, patch) => {
    const row = await api.updateAssignment(id, patch);
    if (row) setAssignments((prev) => prev.map((a) => (a.id === id ? row : a)));
  }, []);

  const handleToggleDone = useCallback(
    async (id) => {
      const current = assignments.find((a) => a.id === id);
      if (!current) return;
      const row = await api.updateAssignment(id, { done: !current.done });
      if (row) setAssignments((prev) => prev.map((a) => (a.id === id ? row : a)));
    },
    [assignments],
  );

  // ---- Note handlers -----------------------------------------------------

  const handleCreateNote = useCallback(async (payload) => {
    const row = await api.createNote(payload);
    setNotes((prev) => [...prev, row]);
  }, []);

  const handleUpdateNote = useCallback(async (id, patch) => {
    const row = await api.updateNote(id, patch);
    if (row) setNotes((prev) => prev.map((n) => (n.id === id ? row : n)));
  }, []);

  // ---- Reminder handlers -------------------------------------------------

  const handleCreateReminder = useCallback(async (payload) => {
    const row = await api.createReminder(payload);
    setReminders((prev) => [...prev, row]);
  }, []);

  const handleUpdateReminder = useCallback(async (id, patch) => {
    const row = await api.updateReminder(id, patch);
    if (row) setReminders((prev) => prev.map((r) => (r.id === id ? row : r)));
  }, []);

  // ---- Shared delete for assignment / note / reminder --------------------

  const handleDeleteItem = useCallback(async (id, kind) => {
    if (kind === "assignment") {
      await api.deleteAssignment(id);
      setAssignments((prev) => prev.filter((a) => a.id !== id));
    } else if (kind === "note") {
      await api.deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } else if (kind === "reminder") {
      await api.deleteReminder(id);
      setReminders((prev) => prev.filter((r) => r.id !== id));
    }
  }, []);

  // ---- Class handlers ----------------------------------------------------

  const handleCreateClass = useCallback(async (payload) => {
    const row = await api.createClass(payload);
    setClasses((prev) => [...prev, row]);
  }, []);

  const handleUpdateClass = useCallback(async (id, patch) => {
    const row = await api.updateClass(id, patch);
    if (row) setClasses((prev) => prev.map((c) => (c.id === id ? row : c)));
  }, []);

  const handleDeleteClass = useCallback(async (id) => {
    await api.deleteClass(id);
    setClasses((prev) => prev.filter((c) => c.id !== id));
    // Deleting a class cascades to its assignments; refetch.
    setAssignments(await api.getAssignments());
  }, []);

  // ---- Semester handlers -------------------------------------------------

  const handleCreateSemester = useCallback(async (payload) => {
    const row = await api.createSemester(payload);
    setSemesters((prev) => [...prev, row]);
  }, []);

  const handleUpdateSemester = useCallback(async (id, patch) => {
    const row = await api.updateSemester(id, patch);
    if (row) setSemesters((prev) => prev.map((s) => (s.id === id ? row : s)));
  }, []);

  const handleDeleteSemester = useCallback(async (id) => {
    await api.deleteSemester(id);
    setSemesters((prev) => prev.filter((s) => s.id !== id));
    // Semester delete detaches classes but doesn't remove them; still refresh.
    setClasses(await api.getClasses());
  }, []);

  // ---- Modal open helpers ------------------------------------------------

  // Open the modal in create mode for a specific kind.
  // Called with no arg defaults to "assignment" (e.g. from the FAB before the
  // chooser step is in place; the chooser is wired in a later step).
  const openCreateModal = useCallback((kind = "assignment") => {
    setEditingItem(null);
    setCreatingKind(kind);
    setModalOpen(true);
  }, []);

  const openEditModal = useCallback((item) => {
    setEditingItem(item);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingItem(null);
  }, []);

  // ---- Render ------------------------------------------------------------

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.bg,
        color: theme.ink,
        fontFamily: "'Inter', system-ui, sans-serif",
        position: "relative",
      }}
    >
      <GlobalStyles />

      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 20px",
          borderBottom: `1px solid ${theme.border}`,
        }}
      >
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          style={{ padding: 8, borderRadius: theme.radiusSm, display: "flex" }}
        >
          <Menu size={22} />
        </button>
        <h1 className="display" style={{ margin: 0, fontSize: 22, fontWeight: 500 }}>
          {VIEW_TITLES[currentView]}
        </h1>
        <div style={{ width: 38 }} />
      </header>

      <main style={{ maxWidth: 520, margin: "0 auto", padding: "20px 18px 100px" }}>
        {currentView === "calendar" && (
          <Calendar
            viewDate={viewDate}
            setViewDate={setViewDate}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            assignments={assignments}
            notes={notes}
            reminders={reminders}
            classes={classes}
            onToggleDone={handleToggleDone}
            onDelete={handleDeleteItem}
            onEdit={openEditModal}
            todayStr={ymd(today)}
          />
        )}
        {currentView === "pomodoro" && <Pomodoro />}
        {currentView === "classes" && (
          <Classes
            classes={classes}
            assignments={assignments}
            semesters={semesters}
            onCreate={handleCreateClass}
            onUpdate={handleUpdateClass}
            onDelete={handleDeleteClass}
            onAddAssignment={() => openCreateModal("assignment")}
          />
        )}
        {currentView === "semesters" && (
          <Semesters
            semesters={semesters}
            onCreate={handleCreateSemester}
            onUpdate={handleUpdateSemester}
            onDelete={handleDeleteSemester}
          />
        )}
        {currentView === "history" && (
          <History
            assignments={assignments}
            classes={classes}
            onToggleDone={handleToggleDone}
            onEdit={openEditModal}
          />
        )}
      </main>

      {currentView === "calendar" && (
        <button
          onClick={() => setChooserOpen(true)}
          aria-label="Add"
          style={{
            position: "fixed",
            right: 20,
            bottom: 24,
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: theme.accent,
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 6px 20px rgba(74, 107, 92, 0.35)",
            border: "none",
            cursor: "pointer",
          }}
        >
          <Plus size={24} />
        </button>
      )}

      <Drawer
        open={menuOpen}
        currentView={currentView}
        onSelect={setCurrentView}
        onClose={() => setMenuOpen(false)}
        userEmail={session?.user?.email}
        onSignOut={async () => { setMenuOpen(false); await api.signOut(); }}
      />

      <AddChooser
        open={chooserOpen}
        onClose={() => setChooserOpen(false)}
        onPick={(kind) => {
          setChooserOpen(false);
          if (kind === "class") {
            // No entry point into the Classes form from outside that component
            // today, so navigate to the tab and let the student tap "Add".
            setCurrentView("classes");
          } else {
            openCreateModal(kind);
          }
        }}
      />

      <ItemModal
        open={modalOpen}
        kind={creatingKind}
        initialItem={editingItem}
        initialDate={selectedDate}
        classes={classes}
        onClose={closeModal}
        onCreateAssignment={handleCreateAssignment}
        onCreateNote={handleCreateNote}
        onCreateReminder={handleCreateReminder}
        onUpdateAssignment={handleUpdateAssignment}
        onUpdateNote={handleUpdateNote}
        onUpdateReminder={handleUpdateReminder}
      />
    </div>
  );
}

// Global styles: fonts, resets, a few hover states inline styles can't do.
function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap');
      * { box-sizing: border-box; }
      body { margin: 0; }
      button { font-family: inherit; }
      input, select, textarea { font-family: inherit; }
      input:focus, select:focus, textarea:focus { border-color: ${theme.accent} !important; }
      .display { font-family: 'Fraunces', Georgia, serif; font-optical-sizing: auto; letter-spacing: -0.02em; }
      .cal-cell { cursor: pointer; border: 1.5px solid transparent; background: transparent; }
      .cal-cell:hover:not(.selected) { background: ${theme.accentSoft}; }
      .cal-cell.selected { background: ${theme.accent}; color: white; }
    `}</style>
  );
}
