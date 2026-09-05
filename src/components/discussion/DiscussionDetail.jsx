import { useState, useEffect } from 'react';
import { discussionAPI as studentDiscussionAPI } from '../../services/student/api';
import { discussionAPI as tutorDiscussionAPI } from '../../services/tutor/api';
import { getSocket } from '../../services/socket';
import { FiArrowLeft, FiThumbsUp, FiCheckCircle, FiEdit2, FiTrash2, FiAward } from 'react-icons/fi';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DOMPurify from 'dompurify';

function DiscussionDetail({ discussionId, onBack, userRole = 'student' }) {
  const discussionAPI = userRole === 'tutor' ? tutorDiscussionAPI : studentDiscussionAPI;

  const [discussion, setDiscussion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const currentUserId = userRole === 'student' 
    ? JSON.parse(sessionStorage.getItem('s_user') || '{}').id 
    : JSON.parse(sessionStorage.getItem('t_user') || '{}').id;

  const fetchDetail = async () => {
    try {
      const res = await discussionAPI.byId(discussionId);
      setDiscussion(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load discussion details');
      onBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    
    const socket = getSocket();
    if (socket) {
      socket.on('new_reply', (reply) => {
        if (reply.discussionId === discussionId) {
          setDiscussion(prev => {
            if (!prev) return prev;
            // Ensure no duplicates
            if (prev.replies.some(r => r._id === reply._id)) return prev;
            return {
              ...prev,
              replies: [...prev.replies, reply],
              replyCount: prev.replyCount + 1,
              status: reply.authorRole === 'tutor' ? 'Tutor Answered' : (prev.status === 'Unanswered' ? 'Answered' : prev.status)
            };
          });
        }
      });

      socket.on('delete_reply', (replyId) => {
        setDiscussion(prev => {
          if (!prev) return prev;
          const newReplies = prev.replies.filter(r => r._id !== replyId);
          return {
            ...prev,
            replies: newReplies,
            replyCount: Math.max(0, prev.replyCount - 1)
          };
        });
      });

      socket.on('tutor_answer_marked', (updatedReply) => {
        setDiscussion(prev => {
          if (!prev) return prev;
          const newReplies = prev.replies.map(r => r._id === updatedReply._id ? { ...r, isTutorAnswer: updatedReply.isTutorAnswer } : r);
          const hasTutorAns = newReplies.some(r => r.isTutorAnswer);
          return {
            ...prev,
            replies: newReplies,
            status: hasTutorAns ? 'Tutor Answered' : (newReplies.length > 0 ? 'Answered' : 'Unanswered')
          };
        });
      });
    }

    return () => {
      if (socket) {
        socket.off('new_reply');
        socket.off('delete_reply');
        socket.off('tutor_answer_marked');
      }
    };
  }, [discussionId]);

  const handleUpvoteDiscussion = async () => {
    try {
      const res = await discussionAPI.upvote(discussion._id);
      setDiscussion(prev => ({
        ...prev,
        upvoteCount: res.data.upvotes,
        hasUpvoted: res.data.hasUpvoted
      }));
    } catch (err) {
      toast.error('Failed to upvote');
    }
  };

  const handleUpvoteReply = async (replyId) => {
    try {
      const res = await discussionAPI.upvoteReply(replyId);
      setDiscussion(prev => ({
        ...prev,
        replies: prev.replies.map(r => {
          if (r._id === replyId) {
            return { ...r, upvoteCount: res.data.upvotes, hasUpvoted: res.data.hasUpvoted };
          }
          return r;
        })
      }));
    } catch (err) {
      toast.error('Failed to upvote reply');
    }
  };

  const handleAddReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      await discussionAPI.addReply(discussion._id, { content: replyContent });
      setReplyContent('');
      toast.success('Reply added');
      // Wait for socket to update or fetch
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add reply');
    }
  };

  const handleMarkTutorAnswer = async (replyId) => {
    try {
      await discussionAPI.markTutorAns(replyId);
      toast.success('Tutor answer toggled');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark as tutor answer');
    }
  };

  const handleDeleteDiscussion = async () => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await discussionAPI.delete(discussion._id);
      toast.success('Deleted successfully');
      onBack();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleEditDiscussion = async () => {
    if (!editTitle.trim() || !editContent.trim()) return toast.error('Required fields');
    try {
      const res = await discussionAPI.update(discussion._id, { title: editTitle, content: editContent });
      setDiscussion(prev => ({ ...prev, title: res.data.title, content: res.data.content }));
      setEditMode(false);
      toast.success('Updated successfully');
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const handleDeleteReply = async (replyId) => {
    if (!window.confirm('Delete this reply?')) return;
    try {
      await discussionAPI.deleteReply(replyId);
      toast.success('Reply deleted');
    } catch (err) {
      toast.error('Failed to delete reply');
    }
  };

  const renderMarkdown = (content) => {
    const cleanHTML = DOMPurify.sanitize(content);
    return (
      <div className="markdown-body" style={{ color: '#cbd5e1', lineHeight: '1.6' }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {cleanHTML}
        </ReactMarkdown>
      </div>
    );
  };

  if (loading || !discussion) {
    return <div style={{ color: '#94a3b8', padding: '40px', textAlign: 'center' }}>Loading details...</div>;
  }

  const isAuthor = discussion.authorId === currentUserId;

  return (
    <div style={{ background: '#1e1b4b', borderRadius: '12px', padding: '24px', border: '1px solid rgba(139, 92, 246, 0.2)', marginTop: '24px' }}>
      <button 
        onClick={onBack}
        style={{ background: 'transparent', color: '#a78bfa', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: 0, marginBottom: '20px', fontSize: '15px' }}
      >
        <FiArrowLeft /> Back to discussions
      </button>

      {/* QUESTION SECTION */}
      <div style={{ background: '#0f0a1e', borderRadius: '8px', padding: '24px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px' }}>
        
        {editMode ? (
          <div>
            <input 
              type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e1b4b', color: '#fff', marginBottom: '16px' }}
            />
            <textarea 
              value={editContent} onChange={e => setEditContent(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e1b4b', color: '#fff', minHeight: '120px', marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleEditDiscussion} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Save</button>
              <button onClick={() => setEditMode(false)} style={{ background: 'transparent', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <h2 style={{ color: '#fff', margin: 0, fontSize: '24px', fontWeight: 700 }}>{discussion.title}</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                {isAuthor && (
                  <>
                    <button onClick={() => { setEditTitle(discussion.title); setEditContent(discussion.content); setEditMode(true); }} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}><FiEdit2 /></button>
                    <button onClick={handleDeleteDiscussion} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}><FiTrash2 /></button>
                  </>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              {renderMarkdown(discussion.content)}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', gap: '16px', color: '#64748b', fontSize: '14px', alignItems: 'center' }}>
                <button 
                  onClick={handleUpvoteDiscussion}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: discussion.hasUpvoted ? 'rgba(139, 92, 246, 0.2)' : 'transparent', color: discussion.hasUpvoted ? '#a78bfa' : '#94a3b8', border: discussion.hasUpvoted ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid transparent', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600 }}
                >
                  <FiThumbsUp /> {discussion.upvoteCount || 0}
                </button>
                <span>{discussion.replyCount} Replies</span>
              </div>
              <div style={{ color: '#94a3b8', fontSize: '13px' }}>
                Asked by <strong style={{ color: '#fff' }}>{discussion.authorName}</strong> {discussion.authorRole === 'tutor' && '(Tutor)'} on {new Date(discussion.createdAt).toLocaleString()}
              </div>
            </div>
          </>
        )}
      </div>

      {/* REPLIES SECTION */}
      <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '16px' }}>Replies</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
        {discussion.replies?.length === 0 ? (
          <div style={{ color: '#64748b', fontStyle: 'italic' }}>No replies yet.</div>
        ) : (
          discussion.replies?.map(reply => (
            <div key={reply._id} style={{ 
              background: reply.isTutorAnswer ? 'rgba(16,185,129,0.05)' : '#0f0a1e', 
              borderRadius: '8px', 
              padding: '20px', 
              border: reply.isTutorAnswer ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.05)' 
            }}>
              {reply.isTutorAnswer && (
                <div style={{ color: '#10b981', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  <FiAward size={16} /> Verified Tutor Answer
                </div>
              )}
              
              <div style={{ marginBottom: '16px' }}>
                {renderMarkdown(reply.content)}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button 
                    onClick={() => handleUpvoteReply(reply._id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: reply.hasUpvoted ? 'rgba(139, 92, 246, 0.2)' : 'transparent', color: reply.hasUpvoted ? '#a78bfa' : '#94a3b8', border: reply.hasUpvoted ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid transparent', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s' }}
                  >
                    <FiThumbsUp /> {reply.upvoteCount || 0}
                  </button>

                  {userRole === 'tutor' && (
                    <button 
                      onClick={() => handleMarkTutorAnswer(reply._id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', color: reply.isTutorAnswer ? '#10b981' : '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                    >
                      <FiCheckCircle /> {reply.isTutorAnswer ? 'Unmark Tutor Answer' : 'Mark as Tutor Answer'}
                    </button>
                  )}
                  
                  {reply.authorId === currentUserId && (
                    <button onClick={() => handleDeleteReply(reply._id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}><FiTrash2 size={14}/></button>
                  )}
                </div>

                <div style={{ color: '#94a3b8', fontSize: '12px' }}>
                  <strong style={{ color: reply.authorRole === 'tutor' ? '#10b981' : '#fff' }}>{reply.authorName}</strong> {reply.authorRole === 'tutor' && '(Tutor)'} • {new Date(reply.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ADD REPLY FORM */}
      <form onSubmit={handleAddReply} style={{ background: '#0f0a1e', padding: '20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <h4 style={{ color: '#fff', margin: '0 0 16px', fontSize: '16px' }}>Post a Reply</h4>
        <textarea 
          placeholder="Write your response... (Markdown supported)" 
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e1b4b', color: '#fff', minHeight: '100px', marginBottom: '16px' }}
        />
        <button type="submit" style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
          Submit Reply
        </button>
      </form>

      <style>{`
        .markdown-body pre { background: #000; padding: 12px; border-radius: 8px; overflow-x: auto; border: 1px solid rgba(255,255,255,0.1); }
        .markdown-body code { background: rgba(255,255,255,0.1); padding: 2px 4px; border-radius: 4px; font-family: monospace; color: #a78bfa; }
        .markdown-body pre code { background: transparent; padding: 0; color: #e2e8f0; }
        .markdown-body a { color: #38bdf8; text-decoration: none; }
        .markdown-body p { margin-top: 0; margin-bottom: 1em; }
        .markdown-body p:last-child { margin-bottom: 0; }
        .markdown-body h1, .markdown-body h2, .markdown-body h3 { color: #fff; margin-top: 1.5em; margin-bottom: 0.5em; }
      `}</style>
    </div>
  );
}

export default DiscussionDetail;
