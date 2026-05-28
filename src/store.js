const KEYS = {
  habits: 'streaks_habits',
  journal: 'streaks_journal',
  notes: 'streaks_notes',
};

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function write(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

/* ── Habits ─────────────────────────────────────────── */

export function getHabits() {
  return read(KEYS.habits) || [];
}

export function saveHabits(habits) {
  write(KEYS.habits, habits);
}

export function createHabit({ name, icon = '✦', category = 'health', color = '#39d353' }) {
  const habits = getHabits();
  const habit = {
    id: crypto.randomUUID(),
    name,
    icon,
    category,
    color,
    createdAt: new Date().toISOString(),
    completions: {},
  };
  habits.push(habit);
  saveHabits(habits);
  return habits;
}

export function toggleHabit(id, date) {
  const habits = getHabits();
  const habit = habits.find(h => h.id === id);
  if (!habit) return habits;
  if (habit.completions[date]) {
    delete habit.completions[date];
  } else {
    habit.completions[date] = true;
  }
  saveHabits(habits);
  return [...habits];
}

export function deleteHabit(id) {
  const habits = getHabits().filter(h => h.id !== id);
  saveHabits(habits);
  return habits;
}

export function editHabit(id, updates) {
  const habits = getHabits();
  const idx = habits.findIndex(h => h.id === id);
  if (idx === -1) return habits;
  habits[idx] = { ...habits[idx], ...updates };
  saveHabits(habits);
  return [...habits];
}

/* ── Journal ────────────────────────────────────────── */

export function getJournal() {
  return read(KEYS.journal) || [];
}

export function saveJournalEntry({ text, mood = '📝', tags = [] }) {
  const journal = getJournal();
  journal.unshift({
    id: crypto.randomUUID(),
    text,
    mood,
    tags,
    createdAt: new Date().toISOString(),
  });
  write(KEYS.journal, journal);
  return journal;
}

export function deleteJournalEntry(id) {
  const journal = getJournal().filter(e => e.id !== id);
  write(KEYS.journal, journal);
  return journal;
}

/* ── Notes ──────────────────────────────────────────── */

export function getNotes() {
  return read(KEYS.notes) || [];
}

export function saveNote({ title, content }) {
  const notes = getNotes();
  notes.unshift({
    id: crypto.randomUUID(),
    title,
    content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  write(KEYS.notes, notes);
  return notes;
}

export function updateNote(id, { title, content }) {
  const notes = getNotes();
  const idx = notes.findIndex(n => n.id === id);
  if (idx === -1) return notes;
  notes[idx] = { ...notes[idx], title, content, updatedAt: new Date().toISOString() };
  write(KEYS.notes, notes);
  return [...notes];
}

export function deleteNote(id) {
  const notes = getNotes().filter(n => n.id !== id);
  write(KEYS.notes, notes);
  return notes;
}

/* ── Export / Import ────────────────────────────────── */

export function exportAll() {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    habits: getHabits(),
    journal: getJournal(),
    notes: getNotes(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `streaks-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importAll(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (data.habits) write(KEYS.habits, data.habits);
    if (data.journal) write(KEYS.journal, data.journal);
    if (data.notes) write(KEYS.notes, data.notes);
    return true;
  } catch {
    return false;
  }
}

/* ── Utilities ──────────────────────────────────────── */

export function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateKey(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

export function todayStr() {
  return dateKey();
}

export function getRecentDateKeys(days, includeToday = true) {
  return Array.from({ length: days }, (_, index) => {
    const offset = includeToday ? index : index + 1;
    const d = new Date();
    d.setDate(d.getDate() - offset);
    return dateKey(d);
  });
}

export function getDateRangeKeys(startKey, endKey) {
  if (!startKey || !endKey) return [];
  const start = parseDateKey(startKey);
  const end = parseDateKey(endKey);
  const [from, to] = start <= end ? [start, end] : [end, start];
  const keys = [];
  for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
    keys.push(dateKey(d));
  }
  return keys;
}

export function getStreak(completions) {
  let streak = 0;
  const d = new Date();
  while (true) {
    const key = dateKey(d);
    if (completions[key]) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}

export function getLongestStreak(completions) {
  const dates = Object.keys(completions).sort();
  if (!dates.length) return 0;
  let max = 1, curr = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = parseDateKey(dates[i - 1]);
    const next = parseDateKey(dates[i]);
    const diff = Math.round((next - prev) / 86400000);
    if (diff === 1) { curr++; max = Math.max(max, curr); }
    else curr = 1;
  }
  return max;
}
