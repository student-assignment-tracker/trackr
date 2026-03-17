/**
 * Trackr – Student Assignment Tracker
 * Manages assignments stored in localStorage.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'trackr_assignments';

  /* ===== State ===== */
  let assignments = load();
  let currentFilter = 'all';

  /* ===== DOM refs ===== */
  const form         = document.getElementById('assignment-form');
  const titleInput   = document.getElementById('title');
  const subjectInput = document.getElementById('subject');
  const dueDateInput = document.getElementById('due-date');
  const notesInput   = document.getElementById('notes');
  const formError    = document.getElementById('form-error');
  const list         = document.getElementById('assignment-list');
  const emptyState   = document.getElementById('empty-state');
  const statsEl      = document.getElementById('stats');
  const filterBtns   = document.querySelectorAll('.filter-btn');
  const yearEl       = document.getElementById('year');

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ===== Persistence ===== */
  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
  }

  /* ===== CRUD ===== */
  function addAssignment(data) {
    const assignment = {
      id: Date.now().toString(),
      title: data.title.trim(),
      subject: data.subject.trim(),
      dueDate: data.dueDate,
      notes: data.notes.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    assignments.unshift(assignment);
    save();
    render();
  }

  function toggleComplete(id) {
    const a = assignments.find((x) => x.id === id);
    if (a) {
      a.completed = !a.completed;
      save();
      render();
    }
  }

  function deleteAssignment(id) {
    assignments = assignments.filter((x) => x.id !== id);
    save();
    render();
  }

  /* ===== Helpers ===== */
  function isOverdue(assignment) {
    if (!assignment.dueDate || assignment.completed) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(assignment.dueDate + 'T00:00:00') < today;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ===== Render ===== */
  function filteredAssignments() {
    if (currentFilter === 'pending')   return assignments.filter((a) => !a.completed);
    if (currentFilter === 'completed') return assignments.filter((a) => a.completed);
    return assignments;
  }

  function render() {
    const visible = filteredAssignments();

    // Stats
    const total     = assignments.length;
    const completed = assignments.filter((a) => a.completed).length;
    const pending   = total - completed;
    statsEl.textContent = total
      ? `${pending} pending · ${completed} completed`
      : '';

    // Empty state
    if (visible.length === 0) {
      list.innerHTML = '';
      emptyState.classList.add('visible');
      return;
    }
    emptyState.classList.remove('visible');

    list.innerHTML = visible
      .map((a) => {
        const overdue = isOverdue(a);
        const classes = ['assignment-item', a.completed ? 'completed' : '', overdue ? 'overdue' : '']
          .filter(Boolean)
          .join(' ');
        const dateLabel = a.dueDate
          ? `<span class="due-date">📅 ${escapeHtml(formatDate(a.dueDate))}${overdue ? ' <span class="overdue-label">Overdue</span>' : ''}</span>`
          : '';
        const subjectBadge = a.subject
          ? `<span class="badge-subject">${escapeHtml(a.subject)}</span>`
          : '';
        const notesHtml = a.notes
          ? `<p class="assignment-notes">${escapeHtml(a.notes)}</p>`
          : '';

        return `
          <li class="${classes}" data-id="${escapeHtml(a.id)}">
            <input
              type="checkbox"
              ${a.completed ? 'checked' : ''}
              aria-label="Mark ${escapeHtml(a.title)} as ${a.completed ? 'pending' : 'complete'}"
            />
            <div class="assignment-body">
              <div class="assignment-title">${escapeHtml(a.title)}</div>
              <div class="assignment-meta">${subjectBadge}${dateLabel}</div>
              ${notesHtml}
            </div>
            <div class="assignment-actions">
              <button class="btn-icon btn-delete" aria-label="Delete ${escapeHtml(a.title)}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                     fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
              </button>
            </div>
          </li>`;
      })
      .join('');
  }

  /* ===== Event Listeners ===== */

  // Form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    if (!title) {
      formError.textContent = 'Please enter a title for the assignment.';
      titleInput.focus();
      return;
    }
    formError.textContent = '';
    addAssignment({
      title,
      subject: subjectInput.value,
      dueDate: dueDateInput.value,
      notes: notesInput.value,
    });
    form.reset();
    titleInput.focus();
  });

  // Dismiss error on input
  titleInput.addEventListener('input', () => {
    if (titleInput.value.trim()) formError.textContent = '';
  });

  // Checkbox & delete via event delegation
  list.addEventListener('change', (e) => {
    if (e.target.type === 'checkbox') {
      const id = e.target.closest('[data-id]').dataset.id;
      toggleComplete(id);
    }
  });

  list.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.btn-delete');
    if (deleteBtn) {
      const id = deleteBtn.closest('[data-id]').dataset.id;
      deleteAssignment(id);
    }
  });

  // Filter buttons
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      render();
    });
  });

  /* ===== Init ===== */
  render();
})();
