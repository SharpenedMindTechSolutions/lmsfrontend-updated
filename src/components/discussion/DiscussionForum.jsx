import { useState, useEffect, useRef } from 'react';
import { discussionAPI as studentDiscussionAPI } from '../../services/student/api';
import { discussionAPI as tutorDiscussionAPI } from '../../services/tutor/api';
import { initiateSocketConnection, getSocket, joinSessionRoom, leaveSessionRoom } from '../../services/socket';
import { FiMessageSquare, FiThumbsUp, FiSearch, FiFilter, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import DiscussionDetail from './DiscussionDetail';

function DiscussionForum({ courseId, sessionId, userRole = 'student' }) {
  const discussionAPI = userRole === 'tutor' ? tutorDiscussionAPI : studentDiscussionAPI;

  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('latest');
  const [statusFilter, setStatusFilter] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  
  const [selectedDiscussionId, setSelectedDiscussionId] = useState(null);

  const fetchDiscussions = async () => {
    try {
      const res = await discussionAPI.bySession(sessionId, { sort, status: statusFilter, search });
      setDiscussions(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load discussions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchDiscussions();
  }, [sessionId, sort, statusFilter, search]);

  useEffect(() => {
    // Socket connection
    const token = sessionStorage.getItem(userRole === 'student' ? 's_token' : 't_token');
    const socket = initiateSocketConnection(token);
    
    joinSessionRoom(sessionId);

    socket.on('new_discussion', (discussion) => {
      // Only add if it matches current filters
      if (discussion.sessionId === sessionId) {
        setDiscussions(prev => [discussion, ...prev]);
        toast.success('New question posted');
      }
    });

    socket.on('delete_discussion', (discussionId) => {
      setDiscussions(prev => prev.filter(d => d._id !== discussionId));
    });

    return () => {
      socket.off('new_discussion');
      socket.off('delete_discussion');
      leaveSessionRoom(sessionId);
    };
  }, [sessionId, userRole]);

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      return toast.error('Title and content are required');
    }

    try {
      await discussionAPI.create({
        courseId,
        sessionId,
        title: newTitle,
        content: newContent
      });
      setNewTitle('');
      setNewContent('');
      setIsAsking(false);
      toast.success('Question posted successfully');
      // fetchDiscussions(); // it will come via socket too, but we can fetch just in case
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to post question');
    }
  };

  const handleUpvote = async (e, id) => {
    e.stopPropagation();
    try {
      const res = await discussionAPI.upvote(id);
      setDiscussions(prev => prev.map(d => {
        if (d._id === id) {
          return { ...d, upvoteCount: res.data.upvotes, hasUpvoted: res.data.hasUpvoted };
        }
        return d;
      }));
    } catch (err) {
      toast.error('Failed to upvote');
    }
  };

  if (selectedDiscussionId) {
    return (
      <DiscussionDetail 
        discussionId={selectedDiscussionId} 
        onBack={() => {
          setSelectedDiscussionId(null);
          fetchDiscussions();
        }}
        userRole={userRole}
      />
    );
  }

  return (
    <div style={{ background: '#1e1b4b', borderRadius: '12px', padding: '24px', border: '1px solid rgba(139, 92, 246, 0.2)', marginTop: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ color: '#fff', margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiMessageSquare color="#8b5cf6" /> Discussion Forum
        </h3>
        <button 
          onClick={() => setIsAsking(!isAsking)}
          style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
        >
          {isAsking ? 'Cancel' : 'Ask a Question'}
        </button>
      </div>

      {isAsking && (
        <form onSubmit={handleAskQuestion} style={{ background: '#0f0a1e', padding: '20px', borderRadius: '8px', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <input 
            type="text" 
            placeholder="Question Title (Be specific)" 
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e1b4b', color: '#fff', marginBottom: '16px' }}
          />
          <textarea 
            placeholder="Describe your question in detail... (Markdown supported)" 
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e1b4b', color: '#fff', minHeight: '120px', marginBottom: '16px' }}
          />
          <button type="submit" style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
            Post Question
          </button>
        </form>
      )}

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', background: '#0f0a1e', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <FiSearch color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Search discussions..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: '#fff', padding: '0 8px', outline: 'none', width: '100%' }}
          />
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)} style={{ background: '#0f0a1e', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '8px', outline: 'none' }}>
          <option value="latest">Latest</option>
          <option value="upvotes">Most Upvoted</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ background: '#0f0a1e', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '8px', outline: 'none' }}>
          <option value="">All Statuses</option>
          <option value="Unanswered">Unanswered</option>
          <option value="Answered">Answered</option>
          <option value="Tutor Answered">Tutor Answered</option>
        </select>
      </div>

      {loading ? (
        <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>Loading discussions...</div>
      ) : discussions.length === 0 ? (
        <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px', background: '#0f0a1e', borderRadius: '8px' }}>
          No discussions found. Be the first to ask!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {discussions.map(d => (
            <div 
              key={d._id} 
              onClick={() => setSelectedDiscussionId(d._id)}
              style={{ 
                background: '#0f0a1e', 
                borderRadius: '8px', 
                padding: '20px', 
                border: '1px solid rgba(255,255,255,0.05)',
                cursor: 'pointer',
                transition: 'border 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h4 style={{ color: '#fff', margin: 0, fontSize: '18px', fontWeight: 600 }}>{d.title}</h4>
                <span style={{ 
                  fontSize: '12px', 
                  padding: '4px 8px', 
                  borderRadius: '12px', 
                  background: d.status === 'Tutor Answered' ? 'rgba(16,185,129,0.2)' : d.status === 'Answered' ? 'rgba(56,189,248,0.2)' : 'rgba(245,158,11,0.2)',
                  color: d.status === 'Tutor Answered' ? '#34d399' : d.status === 'Answered' ? '#7dd3fc' : '#fcd34d',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 600
                }}>
                  {d.status === 'Tutor Answered' && <FiCheckCircle />} {d.status}
                </span>
              </div>
              <p style={{ color: '#94a3b8', margin: '0 0 16px', fontSize: '14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {d.content}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#64748b', fontSize: '13px' }}>
                <button 
                  onClick={(e) => handleUpvote(e, d._id)}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '6px', 
                    background: d.hasUpvoted ? 'rgba(139, 92, 246, 0.2)' : 'transparent', 
                    color: d.hasUpvoted ? '#a78bfa' : '#94a3b8', 
                    border: d.hasUpvoted ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid transparent', 
                    padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  <FiThumbsUp /> {d.upvoteCount || 0}
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FiMessageSquare /> {d.replyCount || 0} Replies
                </div>
                <div>
                  Asked by <span style={{ color: '#fff' }}>{d.authorName}</span> {d.authorRole === 'tutor' && '(Tutor)'} • {new Date(d.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DiscussionForum;
