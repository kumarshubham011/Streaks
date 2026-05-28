import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, AreaChart, Area,
} from 'recharts';
import * as store from './store';

const CATEGORY_COLORS = {
  health: '#39d353',
  learning: '#f778ba',
  mindset: '#79c0ff',
  custom: '#d2a8ff',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</p>
      ))}
    </div>
  );
}

export default function Analytics({ habits }) {
  /* ── Weekday completion rates ────────────────────── */
  const weekdayData = useMemo(() => {
    return DAYS.map((day, idx) => {
      let total = 0, done = 0;
      habits.forEach(h => {
        Object.keys(h.completions).forEach(dateStr => {
          const d = new Date(dateStr + 'T12:00:00');
          if (d.getDay() === idx) done++;
        });
        // Count how many of this weekday have passed since habit creation
        const created = new Date(h.createdAt);
        const now = new Date();
        for (let d = new Date(created); d <= now; d.setDate(d.getDate() + 1)) {
          if (d.getDay() === idx) total++;
        }
      });
      return { day, rate: total ? Math.round((done / total) * 100) : 0 };
    });
  }, [habits]);

  /* ── Per-habit completion rates ──────────────────── */
  const habitRates = useMemo(() => {
    return habits.map(h => {
      const created = new Date(h.createdAt);
      const now = new Date();
      const totalDays = Math.max(1, Math.ceil((now - created) / 86400000));
      const completions = Object.keys(h.completions).length;
      return {
        name: `${h.icon} ${h.name}`,
        rate: Math.round((completions / totalDays) * 100),
        color: h.color,
      };
    }).sort((a, b) => b.rate - a.rate);
  }, [habits]);

  /* ── Category breakdown ─────────────────────────── */
  const categoryData = useMemo(() => {
    const cats = {};
    habits.forEach(h => {
      const cat = h.category || 'custom';
      if (!cats[cat]) cats[cat] = { name: cat, count: 0, completions: 0 };
      cats[cat].count++;
      cats[cat].completions += Object.keys(h.completions).length;
    });
    return Object.values(cats);
  }, [habits]);

  /* ── Category completion radar ──────────────────── */
  const radarData = useMemo(() => {
    const cats = {};
    habits.forEach(h => {
      const cat = h.category || 'custom';
      const created = new Date(h.createdAt);
      const now = new Date();
      const totalDays = Math.max(1, Math.ceil((now - created) / 86400000));
      const completions = Object.keys(h.completions).length;
      if (!cats[cat]) cats[cat] = { total: 0, done: 0 };
      cats[cat].total += totalDays;
      cats[cat].done += completions;
    });
    return Object.entries(cats).map(([cat, v]) => ({
      category: cat.charAt(0).toUpperCase() + cat.slice(1),
      rate: Math.round((v.done / v.total) * 100),
    }));
  }, [habits]);

  /* ── 30-day trend ───────────────────────────────── */
  const trendData = useMemo(() => {
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = store.dateKey(d);
      const done = habits.filter(h => h.completions[key]).length;
      const pct = habits.length ? Math.round((done / habits.length) * 100) : 0;
      data.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        completion: pct,
      });
    }
    return data;
  }, [habits]);

  if (!habits.length) {
    return (
      <div className="analytics">
        <div className="empty-analytics">
          <h3>No data yet</h3>
          <p>Add habits and start tracking to see your analytics here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics">
      {/* 30-day trend */}
      <div className="chart-card wide">
        <h3>30-Day Completion Trend</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#39d353" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#39d353" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} interval={4} />
            <YAxis tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="completion" stroke="#39d353" fill="url(#trendGrad)" strokeWidth={2} name="Completion %" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-grid">
        {/* Weekday rates */}
        <div className="chart-card">
          <h3>Weekday Completion</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weekdayData}>
              <XAxis dataKey="day" tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="rate" fill="#39d353" radius={[4, 4, 0, 0]} name="Rate" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Per-habit rates */}
        <div className="chart-card">
          <h3>Habit Completion Rates</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={habitRates} layout="vertical">
              <XAxis type="number" tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
              <YAxis type="category" dataKey="name" tick={{ fill: '#c9d1d9', fontSize: 12 }} axisLine={false} tickLine={false} width={120} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="rate" radius={[0, 4, 4, 0]} name="Rate">
                {habitRates.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category pie */}
        <div className="chart-card">
          <h3>Category Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
              >
                {categoryData.map((entry, i) => (
                  <Cell key={i} fill={CATEGORY_COLORS[entry.name] || '#d2a8ff'} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pie-legend">
            {categoryData.map((c, i) => (
              <span key={i} className="legend-item">
                <span className="legend-dot" style={{ background: CATEGORY_COLORS[c.name] || '#d2a8ff' }} />
                {c.name}
              </span>
            ))}
          </div>
        </div>

        {/* Radar */}
        {radarData.length >= 3 && (
          <div className="chart-card">
            <h3>Category Balance</h3>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={70}>
                <PolarGrid stroke="#30363d" />
                <PolarAngleAxis dataKey="category" tick={{ fill: '#8b949e', fontSize: 11 }} />
                <PolarRadiusAxis tick={{ fill: '#8b949e', fontSize: 10 }} domain={[0, 100]} />
                <Radar dataKey="rate" stroke="#39d353" fill="#39d353" fillOpacity={0.2} name="Rate %" />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
