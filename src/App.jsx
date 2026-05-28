import React, { Suspense, lazy, useRef, useState } from 'react';
import * as store from './store';

const Dashboard = lazy(() => import('./Dashboard'));
const Analytics = lazy(() => import('./Analytics'));
const Journal = lazy(() => import('./Journal'));

const CATEGORIES = [
  { value: 'health', label: 'Health', color: '#39d353' },
  { value: 'learning', label: 'Learning', color: '#f778ba' },
  { value: 'mindset', label: 'Mindset', color: '#79c0ff' },
  { value: 'custom', label: 'Custom', color: '#d2a8ff' },
];

const ICONS = ['💪', '📖', '🧘', '🏃', '💧', '🎯', '✍️', '🧠', '🎸', '💤', '🥗', '⏰', '🚶', '💊', '🎨', '📱'];

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '▦' },
  { id: 'habits', label: 'Habits', icon: '◉' },
  { id: 'journal', label: 'Journal', icon: '◧' },
  { id: 'analytics', label: 'Analytics', icon: '◐' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
];

const HISTORY_WINDOW_DAYS = 42;
const QUICK_BACKFILL_OPTIONS = [7, 14, 30];

function formatHistoryDate(dateKey) {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  });
}

function HabitsPage({ habits, setHabits }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [historyId, setHistoryId] = useState(null);
  const [historySelection, setHistorySelection] = useState([]);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('💪');
  const [category, setCategory] = useState('health');

  const today = store.todayStr();
  const recentDates = store.getRecentDateKeys(HISTORY_WINDOW_DAYS);
  const defaultRangeStart = store.getRecentDateKeys(7)[6];
  const [rangeStart, setRangeStart] = useState(defaultRangeStart);
  const [rangeEnd, setRangeEnd] = useState(today);
  const historyHabit = habits.find(habit => habit.id === historyId) || null;

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setIcon('💪');
    setCategory('health');
  };

  const handleAdd = () => {
    if (!name.trim()) return;
    const selectedCategory = CATEGORIES.find(item => item.value === category);
    if (editingId) {
      setHabits(store.editHabit(editingId, {
        name: name.trim(),
        icon,
        category,
        color: selectedCategory.color,
      }));
    } else {
      setHabits(store.createHabit({
        name: name.trim(),
        icon,
        category,
        color: selectedCategory.color,
      }));
    }
    resetForm();
    setShowForm(false);
  };

  const startEdit = (habit) => {
    setEditingId(habit.id);
    setName(habit.name);
    setIcon(habit.icon);
    setCategory(habit.category);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (confirm('Delete this habit and all its data?')) {
      setHabits(store.deleteHabit(id));
      if (historyId === id) {
        setHistoryId(null);
        setHistorySelection([]);
      }
    }
  };

  const handleToggle = (id) => {
    setHabits(store.toggleHabit(id, today));
  };

  const openHistory = (habit) => {
    setHistoryId(habit.id);
    setHistorySelection(recentDates.filter(dateKey => !!habit.completions[dateKey]));
    setRangeStart(defaultRangeStart);
    setRangeEnd(today);
  };

  const closeHistory = () => {
    setHistoryId(null);
    setHistorySelection([]);
  };

  const toggleHistoryDate = (dateKey) => {
    setHistorySelection(prev => (
      prev.includes(dateKey)
        ? prev.filter(key => key !== dateKey)
        : [...prev, dateKey]
    ));
  };

  const updateHistorySelection = (dates, shouldComplete) => {
    setHistorySelection(prev => {
      const next = new Set(prev);
      dates.forEach(dateKey => {
        if (shouldComplete) next.add(dateKey);
        else next.delete(dateKey);
      });
      return recentDates.filter(dateKey => next.has(dateKey));
    });
  };

  const applyQuickBackfill = (days) => {
    updateHistorySelection(store.getRecentDateKeys(days), true);
  };

  const applyRangeSelection = (shouldComplete) => {
    const rangeDates = store.getDateRangeKeys(rangeStart, rangeEnd)
      .filter(dateKey => recentDates.includes(dateKey));
    if (!rangeDates.length) return;
    updateHistorySelection(rangeDates, shouldComplete);
  };

  const saveHistory = () => {
    if (!historyHabit) return;
    const selected = new Set(historySelection);
    const nextCompletions = { ...historyHabit.completions };
    recentDates.forEach(dateKey => {
      if (selected.has(dateKey)) nextCompletions[dateKey] = true;
      else delete nextCompletions[dateKey];
    });
    setHabits(store.editHabit(historyHabit.id, { completions: nextCompletions }));
    closeHistory();
  };

  return (
    <div className="habits-page">
      <div className="page-header">
        <h2>Habits</h2>
        <button
          className="btn-primary"
          onClick={() => {
            setShowForm(!showForm);
            resetForm();
          }}
        >
          {showForm ? 'Cancel' : '+ New Habit'}
        </button>
      </div>

      <div className="habits-helper-card">
        <div>
          <h3>Catch up missed days</h3>
          <p>Open a habit&apos;s history to mark the last 7, 14, or 30 days in one click, or apply your own date range.</p>
        </div>
        <span className="helper-pill">Backfill ready</span>
      </div>

      {showForm && (
        <div className="habit-form">
          <div className="form-row">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Habit name"
              className="form-input"
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') handleAdd();
              }}
            />
          </div>
          <div className="form-row">
            <label className="form-label">Icon</label>
            <div className="icon-picker">
              {ICONS.map(choice => (
                <button
                  key={choice}
                  className={`icon-btn ${icon === choice ? 'selected' : ''}`}
                  onClick={() => setIcon(choice)}
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>
          <div className="form-row">
            <label className="form-label">Category</label>
            <div className="category-picker">
              {CATEGORIES.map(choice => (
                <button
                  key={choice.value}
                  className={`cat-btn ${category === choice.value ? 'selected' : ''}`}
                  onClick={() => setCategory(choice.value)}
                  style={{ '--cat-color': choice.color }}
                >
                  <span className="cat-dot" style={{ background: choice.color }} />
                  {choice.label}
                </button>
              ))}
            </div>
          </div>
          <button className="btn-primary" onClick={handleAdd} disabled={!name.trim()}>
            {editingId ? 'Update Habit' : 'Create Habit'}
          </button>
        </div>
      )}

      <div className="habits-list">
        {habits.map(habit => {
          const streak = store.getStreak(habit.completions);
          const total = Object.keys(habit.completions).length;
          const completed = !!habit.completions[today];
          const recentLogged = recentDates.filter(dateKey => habit.completions[dateKey]).length;
          const historyOpen = historyId === habit.id;

          return (
            <div key={habit.id} className={`habit-card ${historyOpen ? 'history-open' : ''}`}>
              <div className={`habit-row ${completed ? 'completed' : ''}`}>
                <button className="habit-toggle" onClick={() => handleToggle(habit.id)}>
                  <span className={`check-box ${completed ? 'checked' : ''}`} style={{ '--h-color': habit.color }}>
                    {completed ? '✓' : ''}
                  </span>
                </button>
                <span className="habit-icon">{habit.icon}</span>
                <div className="habit-info">
                  <span className="habit-name">{habit.name}</span>
                  <span className="habit-meta">
                    <span className="cat-badge" style={{ '--cat-color': habit.color }}>{habit.category}</span>
                    <span>{streak}d streak</span>
                    <span>{total} total</span>
                    <span>{recentLogged}/{HISTORY_WINDOW_DAYS} recent</span>
                  </span>
                </div>
                <div className="habit-actions">
                  <button
                    className={`btn-ghost-sm ${historyOpen ? 'active' : ''}`}
                    onClick={() => (historyOpen ? closeHistory() : openHistory(habit))}
                    title="Backfill history"
                  >
                    History
                  </button>
                  <button className="btn-ghost-sm" onClick={() => startEdit(habit)} title="Edit">
                    Edit
                  </button>
                  <button className="btn-ghost-sm" onClick={() => handleDelete(habit.id)} title="Delete">
                    Delete
                  </button>
                </div>
              </div>

              {historyOpen && (
                <div className="history-panel">
                  <div className="history-panel-header">
                    <div>
                      <h4>{habit.name} history</h4>
                      <p>Use a preset, mark a range, or tap individual days. Saving only changes this recent window.</p>
                    </div>
                    <span className="history-count">{historySelection.length} selected</span>
                  </div>

                  <div className="history-quick-actions">
                    {QUICK_BACKFILL_OPTIONS.map(days => (
                      <button key={days} className="btn-secondary" onClick={() => applyQuickBackfill(days)}>
                        Mark last {days} days
                      </button>
                    ))}
                    <button className="btn-ghost" onClick={() => setHistorySelection([])}>
                      Clear recent
                    </button>
                  </div>

                  <div className="history-range-row">
                    <label className="history-range-field">
                      <span>From</span>
                      <input type="date" value={rangeStart} max={today} onChange={e => setRangeStart(e.target.value)} />
                    </label>
                    <label className="history-range-field">
                      <span>To</span>
                      <input type="date" value={rangeEnd} max={today} onChange={e => setRangeEnd(e.target.value)} />
                    </label>
                    <button className="btn-secondary" onClick={() => applyRangeSelection(true)}>
                      Mark range
                    </button>
                    <button className="btn-ghost" onClick={() => applyRangeSelection(false)}>
                      Clear range
                    </button>
                  </div>

                  <div className="history-grid">
                    {recentDates.map(dateKey => {
                      const selected = historySelection.includes(dateKey);
                      return (
                        <button
                          key={dateKey}
                          className={`history-day ${selected ? 'selected' : ''}`}
                          onClick={() => toggleHistoryDate(dateKey)}
                        >
                          <span>{formatHistoryDate(dateKey)}</span>
                          <strong>{selected ? 'Done' : 'Missed'}</strong>
                        </button>
                      );
                    })}
                  </div>

                  <div className="history-footer">
                    <p>Tip: use “Mark last 7 days” for a quick catch-up, then fine-tune any dates below.</p>
                    <div className="history-footer-actions">
                      <button className="btn-ghost" onClick={closeHistory}>Cancel</button>
                      <button className="btn-primary" onClick={saveHistory}>Save History</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {habits.length === 0 && (
          <div className="empty-habits">
            <p>No habits yet. Click "+ New Habit" to create your first one.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsPage() {
  const fileRef = useRef();
  const [importStatus, setImportStatus] = useState('');

  const handleExport = () => store.exportAll();

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = store.importAll(reader.result);
      setImportStatus(ok ? 'Import successful! Reload to see changes.' : 'Import failed. Check file format.');
      if (ok) setTimeout(() => window.location.reload(), 1000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="settings-page">
      <h2>Settings</h2>
      <div className="settings-section">
        <h3>Data Backup</h3>
        <p className="settings-desc">Export your data as JSON for backup, or import a previous backup. Your data lives in localStorage, so exporting regularly protects against accidental loss.</p>
        <div className="settings-actions">
          <button className="btn-primary" onClick={handleExport}>Export Data</button>
          <button className="btn-secondary" onClick={() => fileRef.current?.click()}>Import Data</button>
          <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
        </div>
        {importStatus && <p className="import-status">{importStatus}</p>}
      </div>
      <div className="settings-section">
        <h3>Storage Info</h3>
        <p className="settings-desc">
          All data is stored locally in your browser via localStorage. It does not leave your device.
          Typical usage: {(new Blob([JSON.stringify(localStorage)]).size / 1024).toFixed(1)} KB of ~5 MB available.
        </p>
      </div>
      <div className="settings-section danger">
        <h3>Danger Zone</h3>
        <button
          className="btn-danger"
          onClick={() => {
            if (confirm('Delete ALL data? This cannot be undone.')) {
              localStorage.clear();
              window.location.reload();
            }
          }}
        >
          Clear All Data
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [habits, setHabits] = useState(store.getHabits);
  const [journal, setJournal] = useState(store.getJournal);
  const [notes, setNotes] = useState(store.getNotes);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app">
      <button className="mobile-menu" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>

      <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <span className="brand-icon">▣</span>
          <span className="brand-text">Streaks</span>
        </div>
        <div className="nav-items">
          {NAV.map(item => (
            <button
              key={item.id}
              className={`nav-item ${page === item.id ? 'active' : ''}`}
              onClick={() => {
                setPage(item.id);
                setSidebarOpen(false);
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </div>
        <div className="sidebar-footer">
          <span className="version">v1.0.0</span>
        </div>
      </nav>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <main className="content">
        <Suspense fallback={<div className="page-loading">Loading…</div>}>
          {page === 'dashboard' && <Dashboard habits={habits} setHabits={setHabits} />}
          {page === 'habits' && <HabitsPage habits={habits} setHabits={setHabits} />}
          {page === 'journal' && <Journal journal={journal} setJournal={setJournal} notes={notes} setNotes={setNotes} />}
          {page === 'analytics' && <Analytics habits={habits} />}
          {page === 'settings' && <SettingsPage />}
        </Suspense>
      </main>
    </div>
  );
}
