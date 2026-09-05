import { useState, useEffect } from 'react';
import { videoNoteAPI } from '../../services/student/api';
import { FiEdit2, FiTrash2, FiClock, FiPlus, FiMessageSquare } from 'react-icons/fi';
import toast from 'react-hot-toast';

function VideoNotes({ sessionId, currentTime, isDrive }) {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await videoNoteAPI.bySession(sessionId);
        setNotes(res.data.notes || []);
      } catch (err) {
        toast.error('Failed to load notes');
      } finally {
        setLoading(false);
      }
    };
    if (sessionId) fetchNotes();
  }, [sessionId]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    
    // For Google Drive, we can't reliably get the timestamp, so we store null
    const timestamp = isDrive ? null : Math.floor(currentTime);

    try {
      const res = await videoNoteAPI.create(sessionId, {
        noteText: newNote,
        timestamp
      });
      setNotes([...notes, res.data.note]);
      setNewNote('');
      toast.success('Note added');
    } catch (err) {
      toast.error('Failed to add note');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await videoNoteAPI.delete(id);
      setNotes(notes.filter(n => n._id !== id));
      toast.success('Note deleted');
    } catch (err) {
      toast.error('Failed to delete note');
    }
  };

  const handleUpdate = async (id) => {
    if (!editText.trim()) return;
    try {
      const res = await videoNoteAPI.update(id, { noteText: editText });
      setNotes(notes.map(n => n._id === id ? res.data.note : n));
      setEditingId(null);
      toast.success('Note updated');
    } catch (err) {
      toast.error('Failed to update note');
    }
  };

  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return '';
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading) return (
    <div style={{ padding: 20, textAlign: 'center' }}>
      <div className="spinner spinner-sm"></div>
    </div>
  );

  return (
    <div className="card" style={{ marginTop: 24, padding: '20px 24px' }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <FiMessageSquare color="#7c3aed" /> My Notes
      </h3>

      <form onSubmit={handleAddNote} style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            className="input-field"
            placeholder={isDrive ? "Take a note for this session..." : "Take a note at current time..."}
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            style={{ width: '100%', paddingRight: isDrive ? 14 : 60 }}
          />
          {!isDrive && (
            <span style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              color: '#7c3aed', fontSize: 12, fontWeight: 700, background: 'rgba(124,58,237,0.1)',
              padding: '2px 6px', borderRadius: 6
            }}>
              {formatTime(Math.floor(currentTime))}
            </span>
          )}
        </div>
        <button type="submit" className="btn btn-primary" style={{ padding: '0 16px' }} disabled={!newNote.trim()}>
          <FiPlus /> Add
        </button>
      </form>

      {notes.length === 0 ? (
        <p style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center', fontStyle: 'italic', margin: '20px 0' }}>
          No notes added yet.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {notes.map(note => (
            <div key={note._id} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10, padding: 16, transition: 'all 0.2s'
            }}>
              {editingId === note._id ? (
                <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                  <textarea
                    className="input-field"
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    style={{ minHeight: 60, resize: 'vertical' }}
                    autoFocus
                  />
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost" onClick={() => setEditingId(null)} style={{ padding: '6px 12px', fontSize: 13 }}>Cancel</button>
                    <button className="btn btn-primary" onClick={() => handleUpdate(note._id)} style={{ padding: '6px 12px', fontSize: 13 }}>Save</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    {note.timestamp !== null ? (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        color: '#a78bfa', fontSize: 12, fontWeight: 600,
                        background: 'rgba(124,58,237,0.1)', padding: '2px 8px', borderRadius: 12
                      }}>
                        <FiClock size={12} /> {formatTime(note.timestamp)}
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, color: '#9ca3af' }}>
                        {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => { setEditingId(note._id); setEditText(note.noteText); }}
                        style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: 4 }}>
                        <FiEdit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(note._id)}
                        style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', padding: 4 }}>
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <p style={{ color: '#e5e7eb', fontSize: 14, margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {note.noteText}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default VideoNotes;
