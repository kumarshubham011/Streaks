import React, { useState } from 'react';
import * as store from './store';

const MOODS = ['📝', '😊', '😐', '😔', '🔥', '💪', '🧘', '💡', '⚡', '🌙'];

/* ── Journal Tab ────────────────────────────────────── */

function JournalTab({ journal, setJournal }) {
  const [text, setText] = useState('');
  const [mood, setMood] = useState('📝');
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = () => {
    if (!text.trim()) return;
    const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
    setJournal(store.saveJournalEntry({ text: text.trim(), mood, tags }));
    setText('');
    setTagInput('');
    setMood('📝');
  };

  const handleDelete = (id) => {
    setJournal(store.deleteJournalEntry(id));
  };

  const grouped = {};
  journal.forEach(entry => {
    const date = new Date(entry.createdAt).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(entry);
  });

  return (
    <div className="journal-tab">
      <div className="journal-input-card">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="What's on your mind?"
          rows={3}
          onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleSubmit(); }}
        />
        <div className="journal-input-row">
          <div className="mood-picker">
            {MOODS.map(m => (
              <button key={m} className={`mood-btn ${mood === m ? 'selected' : ''}`} onClick={() => setMood(m)}>
                {m}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            placeholder="Tags (comma separated)"
            className="tag-input"
          />
          <button className="btn-primary" onClick={handleSubmit} disabled={!text.trim()}>
            Save Entry
          </button>
        </div>
      </div>
      <div className="journal-entries">
        {Object.entries(grouped).map(([date, entries]) => (
          <div key={date} className="journal-group">
            <h4 className="journal-date">{date}</h4>
            {entries.map(entry => (
              <div key={entry.id} className="journal-entry">
                <div className="entry-header">
                  <span className="entry-mood">{entry.mood}</span>
                  <span className="entry-time">
                    {new Date(entry.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button className="btn-ghost-sm" onClick={() => handleDelete(entry.id)}>✕</button>
                </div>
                <p className="entry-text">{entry.text}</p>
                {entry.tags?.length > 0 && (
                  <div className="entry-tags">
                    {entry.tags.map((t, i) => <span key={i} className="tag">{t}</span>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
        {journal.length === 0 && <p className="empty-msg">No journal entries yet. Start writing above.</p>}
      </div>
    </div>
  );
}

/* ── Notes Tab ──────────────────────────────────────── */

function NotesTab({ notes, setNotes }) {
  const [editing, setEditing] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSave = () => {
    if (!title.trim() && !content.trim()) return;
    if (editing) {
      setNotes(store.updateNote(editing, { title: title.trim(), content: content.trim() }));
      setEditing(null);
    } else {
      setNotes(store.saveNote({ title: title.trim(), content: content.trim() }));
    }
    setTitle('');
    setContent('');
  };

  const handleEdit = (note) => {
    setEditing(note.id);
    setTitle(note.title);
    setContent(note.content);
  };

  const handleCancel = () => {
    setEditing(null);
    setTitle('');
    setContent('');
  };

  const handleDelete = (id) => {
    setNotes(store.deleteNote(id));
    if (editing === id) handleCancel();
  };

  return (
    <div className="notes-tab">
      <div className="note-editor-card">
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Note title"
          className="note-title-input"
        />
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Write your note..."
          rows={4}
        />
        <div className="note-actions">
          {editing && <button className="btn-ghost" onClick={handleCancel}>Cancel</button>}
          <button className="btn-primary" onClick={handleSave} disabled={!title.trim() && !content.trim()}>
            {editing ? 'Update Note' : 'Add Note'}
          </button>
        </div>
      </div>
      <div className="notes-grid">
        {notes.map(note => (
          <div key={note.id} className={`note-card ${editing === note.id ? 'editing' : ''}`}>
            <div className="note-card-header">
              <h4>{note.title || 'Untitled'}</h4>
              <div className="note-card-actions">
                <button className="btn-ghost-sm" onClick={() => handleEdit(note)}>✎</button>
                <button className="btn-ghost-sm" onClick={() => handleDelete(note.id)}>✕</button>
              </div>
            </div>
            <p className="note-content">{note.content}</p>
            <span className="note-timestamp">
              {new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        {notes.length === 0 && <p className="empty-msg">No notes yet.</p>}
      </div>
    </div>
  );
}

/* ── Combined Journal + Notes Page ──────────────────── */

export default function Journal({ journal, setJournal, notes, setNotes }) {
  const [tab, setTab] = useState('journal');

  return (
    <div className="journal-page">
      <div className="journal-tabs">
        <button className={`jtab ${tab === 'journal' ? 'active' : ''}`} onClick={() => setTab('journal')}>
          Journal
        </button>
        <button className={`jtab ${tab === 'notes' ? 'active' : ''}`} onClick={() => setTab('notes')}>
          Notes
        </button>
      </div>
      {tab === 'journal'
        ? <JournalTab journal={journal} setJournal={setJournal} />
        : <NotesTab notes={notes} setNotes={setNotes} />
      }
    </div>
  );
}
