import React, { useState, useMemo } from 'react';
import * as store from './store';

/* ── GitHub-style Contribution Grid ─────────────────── */

function ContribGrid({ habit }) {
  const today = new Date();
  const year = today.getFullYear();

  // Build weeks grid: 53 columns x 7 rows (Sun-Sat)
  const startOfYear = new Date(year, 0, 1);
  const startDay = startOfYear.getDay(); // 0=Sun

  const cells = [];
  const d = new Date(startOfYear);
  d.setDate(d.getDate() - startDay); // align to Sunday

  for (let week = 0; week < 53; week++) {
    for (let dow = 0; dow < 7; dow++) {
      const dateStr = store.dateKey(d);
      const active = !!habit.completions[dateStr];
      const future = d > today;
      const inYear = d.getFullYear() === year;
      cells.push({ week, dow, dateStr, active, future, inYear });
      d.setDate(d.getDate() + 1);
    }
  }

  const months = [];
  for (let m = 0; m < 12; m++) {
    const firstDay = new Date(year, m, 1);
    const dayOfYear = Math.floor((firstDay - startOfYear) / 86400000);
    const weekIdx = Math.floor((dayOfYear + startDay) / 7);
    months.push({ name: firstDay.toLocaleString('default', { month: 'short' }), week: weekIdx });
  }

  const currentStreak = store.getStreak(habit.completions);
  const longestStreak = store.getLongestStreak(habit.completions);
  const totalDays = Object.keys(habit.completions).length;

  return (
    <div className="contrib-card">
      <div className="contrib-header">
        <div className="contrib-title">
          <span className="contrib-icon">{habit.icon}</span>
          <span>{habit.name}</span>
        </div>
        <div className="contrib-stats">
          <span className="stat-pill">{currentStreak}d streak</span>
          <span className="stat-pill">{longestStreak}d best</span>
          <span className="stat-pill">{totalDays} total</span>
        </div>
      </div>
      <div className="contrib-grid-wrapper">
        <div className="contrib-months">
          {months.map((m, i) => (
            <span key={i} style={{ gridColumnStart: m.week + 1 }}>{m.name}</span>
          ))}
        </div>
        <div className="contrib-days">
          <span style={{ gridRow: 2 }}>Mon</span>
          <span style={{ gridRow: 4 }}>Wed</span>
          <span style={{ gridRow: 6 }}>Fri</span>
        </div>
        <div className="contrib-grid">
          {cells.map((c, i) => (
            <div
              key={i}
              className={`contrib-cell ${c.active ? 'active' : ''} ${!c.active && (c.future || !c.inYear) ? 'empty' : ''}`}
              style={{
                gridColumn: c.week + 1,
                gridRow: c.dow + 1,
                '--habit-color': habit.color,
              }}
              title={c.dateStr}
            />
          ))}
        </div>
      </div>
      <div className="contrib-legend">
        <span>Less</span>
        <div className="legend-cell l0" />
        <div className="legend-cell l1" style={{ '--habit-color': habit.color }} />
        <span>More</span>
        <span className="contrib-year">{year}</span>
      </div>
    </div>
  );
}

/* ── Today's Checklist ──────────────────────────────── */

function TodayChecklist({ habits, onToggle }) {
  const today = store.todayStr();
  const done = habits.filter(h => h.completions[today]).length;
  const pct = habits.length ? Math.round((done / habits.length) * 100) : 0;

  return (
    <div className="today-card">
      <div className="today-header">
        <h3>Today</h3>
        <span className="today-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
      </div>
      <div className="today-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="progress-text">{done}/{habits.length} completed</span>
      </div>
      <div className="today-list">
        {habits.map(h => {
          const completed = !!h.completions[today];
          return (
            <button
              key={h.id}
              className={`today-item ${completed ? 'done' : ''}`}
              onClick={() => onToggle(h.id, today)}
            >
              <span className="today-check">{completed ? '✓' : ''}</span>
              <span className="today-icon">{h.icon}</span>
              <span className="today-name">{h.name}</span>
              <span className="today-streak">{store.getStreak(h.completions)}d</span>
            </button>
          );
        })}
        {habits.length === 0 && (
          <p className="empty-msg">No habits yet. Add one to get started.</p>
        )}
      </div>
    </div>
  );
}

/* ── Summary Stats ──────────────────────────────────── */

function SummaryStats({ habits }) {
  const today = store.todayStr();
  const totalCompletions = habits.reduce((s, h) => s + Object.keys(h.completions).length, 0);
  const todayDone = habits.filter(h => h.completions[today]).length;
  const bestStreak = habits.reduce((max, h) => Math.max(max, store.getLongestStreak(h.completions)), 0);

  // This week completions
  const d = new Date();
  const dayOfWeek = d.getDay();
  let weekTotal = 0;
  for (let i = 0; i < 7; i++) {
    const wd = new Date(d);
    wd.setDate(wd.getDate() - dayOfWeek + i);
    const key = store.dateKey(wd);
    weekTotal += habits.filter(h => h.completions[key]).length;
  }

  return (
    <div className="stats-row">
      <div className="stat-card">
        <span className="stat-value">{habits.length}</span>
        <span className="stat-label">Habits</span>
      </div>
      <div className="stat-card">
        <span className="stat-value">{todayDone}</span>
        <span className="stat-label">Today</span>
      </div>
      <div className="stat-card">
        <span className="stat-value">{weekTotal}</span>
        <span className="stat-label">This Week</span>
      </div>
      <div className="stat-card">
        <span className="stat-value">{bestStreak}d</span>
        <span className="stat-label">Best Streak</span>
      </div>
      <div className="stat-card">
        <span className="stat-value">{totalCompletions}</span>
        <span className="stat-label">All Time</span>
      </div>
    </div>
  );
}

/* ── Dashboard ──────────────────────────────────────── */

export default function Dashboard({ habits, setHabits }) {
  const handleToggle = (id, date) => {
    setHabits(store.toggleHabit(id, date));
  };

  return (
    <div className="dashboard">
      <SummaryStats habits={habits} />
      <div className="dashboard-main">
        <div className="dashboard-grids">
          {habits.map(h => (
            <ContribGrid key={h.id} habit={h} />
          ))}
          {habits.length === 0 && (
            <div className="contrib-card empty-card">
              <p>Your contribution grids will appear here once you add habits.</p>
            </div>
          )}
        </div>
        <div className="dashboard-side">
          <TodayChecklist habits={habits} onToggle={handleToggle} />
        </div>
      </div>
    </div>
  );
}
