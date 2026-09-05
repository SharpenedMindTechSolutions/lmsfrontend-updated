import { useState, useEffect } from 'react';
import { codingGameAPI, gamificationAPI } from '../../../services/student/api';
import useActiveTimeTracker from '../../../hooks/useActiveTimeTracker';
import {
  FiZap, FiCheck, FiRefreshCw, FiHelpCircle, FiCode,
  FiArrowRight, FiAward, FiAlertCircle, FiChevronUp, FiChevronDown, FiPlay
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function DailyCodeGame() {
  // Track active study time while in game arena
  useActiveTimeTracker({ activityType: 'game' });

  const [activeTab, setActiveTab] = useState('daily'); // 'daily' | 'practice'
  const [dailyData, setDailyData] = useState(null);
  const [practiceList, setPracticeList] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Filter states for practice mode
  const [filterLang, setFilterLang] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Answer states for current game
  const [userAnswer, setUserAnswer] = useState({});
  const [reorderLines, setReorderLines] = useState([]);
  const [showHint, setShowHint] = useState(false);
  const [resultModal, setResultModal] = useState(null);
  const [streakStats, setStreakStats] = useState(null);

  // Load Daily Challenge & Gamification Stats
  const loadDailyAndStats = async () => {
    setLoading(true);
    try {
      const [dailyRes, statsRes] = await Promise.all([
        codingGameAPI.getDaily(),
        gamificationAPI.myStats()
      ]);
      setDailyData(dailyRes.data);
      setStreakStats(statsRes.data);
      if (dailyRes.data?.challenge) {
        initGame(dailyRes.data.challenge);
      }
    } catch {
      toast.error('Failed to load daily coding challenge');
    } finally {
      setLoading(false);
    }
  };

  // Load Practice list
  const loadPracticeList = async () => {
    try {
      const params = {};
      if (filterLang !== 'all') params.language = filterLang;
      if (filterType !== 'all') params.gameType = filterType;
      const res = await codingGameAPI.getAll(params);
      setPracticeList(res.data.challenges || []);
    } catch {
      toast.error('Failed to load practice challenges');
    }
  };

  useEffect(() => {
    loadDailyAndStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'practice') {
      loadPracticeList();
    }
  }, [activeTab, filterLang, filterType]);

  // Initialize form state whenever a game is selected
  const initGame = (game) => {
    setSelectedGame(game);
    setShowHint(false);
    if (!game) return;

    if (game.gameType === 'fill-blank') {
      const initial = {};
      (game.fillBlankData?.blanks || []).forEach(b => {
        initial[b.id] = '';
      });
      setUserAnswer(initial);
    } else if (game.gameType === 'bug-hunt') {
      setUserAnswer('');
    } else if (game.gameType === 'output-predict') {
      setUserAnswer('');
    } else if (game.gameType === 'code-reorder') {
      const lines = [...(game.codeReorderData?.lines || [])];
      // Scramble lines initially
      setReorderLines(lines.sort(() => Math.random() - 0.5));
    }
  };

  // Handle reorder movements
  const moveLine = (index, direction) => {
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= reorderLines.length) return;
    const updated = [...reorderLines];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;
    setReorderLines(updated);
  };

  // Submit Answer
  const submitSolution = async () => {
    if (!selectedGame) return;
    let answerPayload = userAnswer;
    if (selectedGame.gameType === 'code-reorder') {
      answerPayload = reorderLines.map(l => l.id);
    }

    setSubmitting(true);
    try {
      const res = await codingGameAPI.submit({
        gameId: selectedGame._id,
        answer: answerPayload,
        isDaily: activeTab === 'daily'
      });

      if (res.data.isCorrect) {
        setResultModal(res.data);
        // Refresh stats
        const stats = await gamificationAPI.myStats();
        setStreakStats(stats.data);
      } else {
        toast.error(res.data.message || 'Incorrect answer. Try again!');
        if (res.data.hint) setShowHint(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission error');
    } finally {
      setSubmitting(false);
    }
  };

  const getLangBadgeColor = (lang) => {
    switch (lang) {
      case 'python': return '#38bdf8';
      case 'javascript': return '#facc15';
      case 'html': return '#fb923c';
      case 'sql': return '#a78bfa';
      case 'reactjs': return '#61dafb';
      case 'nodejs': return '#8cc84b';
      case 'expressjs': return '#8b8b8b';
      case 'mongodb': return '#4db33d';
      case 'java': return '#f89820';
      case 'machinelearning': return '#ff6f00';
      case 'powerbi': return '#f2c811';
      case 'css': return '#1572b6';
      case 'git': return '#f34f29';
      case 'typescript': return '#3178c6';
      default: return '#9ca3af';
    }
  };

  const getGameTypeLabel = (type) => {
    switch (type) {
      case 'fill-blank': return '✏️ Fill in the Blanks';
      case 'bug-hunt': return '🐛 Bug Hunter';
      case 'output-predict': return '🔮 Output Predictor';
      case 'code-reorder': return '🧩 Code Puzzle';
      default: return type;
    }
  };

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto' }}>
      {/* Hero Header */}
      <div
        className="card anim-fade-up"
        style={{
          marginBottom: 24,
          background: 'linear-gradient(135deg, #1e1b4b 0%, #31104b 50%, #4c1d95 100%)',
          border: 'none',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          padding: '28px 30px'
        }}
      >
        <div style={{ position: 'absolute', top: -30, right: -20, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
              <span>🎮 W3Schools-Style Technical Arena</span>
            </div>
            <h1 style={{ fontSize: 26, margin: '0 0 8px', color: '#fff', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Daily Coding Games & Quests
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', margin: 0, maxWidth: 500 }}>
              Sharpen your syntax, fix real bugs, predict outputs, and solve code puzzles to build your daily learning streak!
            </p>
          </div>

          {/* Quick Streak & XP Pill */}
          {streakStats && (
            <div style={{ display: 'flex', gap: 10, background: 'rgba(0,0,0,0.3)', padding: '10px 16px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ textAlign: 'center', paddingRight: 12, borderRight: '1px solid rgba(255,255,255,0.15)' }}>
                <span style={{ fontSize: 20 }}>🔥</span>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: '#fb923c' }}>
                  {streakStats.currentStreak} {streakStats.currentStreak === 1 ? 'Day' : 'Days'}
                </p>
                <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>Daily Streak</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 20 }}>⚡</span>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: '#a78bfa' }}>
                  {streakStats.totalXP} XP
                </p>
                <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>Level {streakStats.level}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button
          className={`btn ${activeTab === 'daily' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => {
            setActiveTab('daily');
            if (dailyData?.challenge) initGame(dailyData.challenge);
          }}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span>🔥 Today's Daily Challenge</span>
        </button>
        <button
          className={`btn ${activeTab === 'practice' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('practice')}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span>🎯 Practice Arena ({practiceList.length || 'All'})</span>
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner spinner-lg" /></div>
      ) : activeTab === 'daily' ? (
        /* ── DAILY CHALLENGE TAB ── */
        <div>
          {dailyData?.completedToday && (
            <div style={{ padding: '14px 18px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
              <FiAward size={22} color="#16a34a" />
              <div>
                <p style={{ margin: 0, fontWeight: 700, color: '#166534', fontSize: 14 }}>
                  Daily Challenge Completed! 🔥
                </p>
                <p style={{ margin: 0, fontSize: 12, color: '#15803d' }}>
                  You've already claimed today's XP and kept your streak alive. Feel free to replay or explore the Practice Arena!
                </p>
              </div>
            </div>
          )}

          {selectedGame && renderGameCard(selectedGame)}
        </div>
      ) : (
        /* ── PRACTICE ARENA TAB ── */
        <div>
          {/* Filters & Game List (Hidden when a game is selected) */}
          {!selectedGame && (
            <>
              <div className="card" style={{ padding: '16px 20px', marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#4b5563' }}>Language:</span>
                <select
                  value={filterLang}
                  onChange={e => setFilterLang(e.target.value)}
                  style={{ padding: '6px 12px', borderRadius: 8, fontSize: 13 }}
                >
                  <option value="all">All Languages</option>
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="html">HTML</option>
                  <option value="sql">SQL</option>
                  <option value="reactjs">ReactJS</option>
                  <option value="nodejs">NodeJS</option>
                  <option value="expressjs">ExpressJS</option>
                  <option value="mongodb">MongoDB</option>
                  <option value="java">Java</option>
                  <option value="machinelearning">Machine Learning</option>
                  <option value="powerbi">Power BI</option>
                  <option value="css">CSS</option>
                  <option value="git">Git</option>
                  <option value="typescript">TypeScript</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#4b5563' }}>Game Mode:</span>
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  style={{ padding: '6px 12px', borderRadius: 8, fontSize: 13 }}
                >
                  <option value="all">All Modes</option>
                  <option value="fill-blank">Fill in Blanks</option>
                  <option value="bug-hunt">Bug Hunter</option>
                  <option value="output-predict">Output Predictor</option>
                  <option value="code-reorder">Code Puzzle</option>
                </select>
              </div>
            </div>
          </div>

          {/* Practice Game List & Active Play Area */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18, marginBottom: 24 }}>
            {practiceList.map(game => (
              <div
                key={game._id}
                onClick={() => initGame(game)}
                className={`card card-hover ${selectedGame?._id === game._id ? 'active-game-card' : ''}`}
                style={{
                  padding: '18px 20px',
                  cursor: 'pointer',
                  border: selectedGame?._id === game._id ? '2px solid #7c3aed' : '1px solid #ede9fe',
                  background: selectedGame?._id === game._id ? '#faf5ff' : '#ffffff'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span
                    style={{
                      background: `${getLangBadgeColor(game.language)}20`,
                      color: getLangBadgeColor(game.language),
                      padding: '3px 9px',
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: 'uppercase'
                    }}
                  >
                    {game.language}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: game.isCompleted ? '#16a34a' : '#f59e0b' }}>
                    {game.isCompleted ? '✓ Completed' : `+${game.xpReward} XP`}
                  </span>
                </div>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: '#1f2937', marginBottom: 6 }}>{game.title}</h4>
                <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 12px', lineHeight: 1.4 }}>{game.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>{getGameTypeLabel(game.gameType)}</span>
                  <button className="btn btn-outline btn-xs" style={{ padding: '4px 10px' }}>
                    Play <FiPlay size={11} />
                  </button>
                </div>
              </div>
            ))}
              </div>
            </>
          )}

          {selectedGame && (
            <div className="anim-fade-up" style={{ marginTop: 0 }}>
              <button
                onClick={() => initGame(null)}
                className="btn btn-outline btn-sm"
                style={{ marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
              >
                ← Back to Practice Arena
              </button>
              {renderGameCard(selectedGame)}
            </div>
          )}
        </div>
      )}

      {/* ── SUCCESS RESULT MODAL WITH CONFETTI ── */}
      {resultModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(10, 6, 25, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
        >
          <div
            className="card anim-fade-up"
            style={{
              maxWidth: 480,
              width: '100%',
              padding: '32px 28px',
              textAlign: 'center',
              background: '#ffffff',
              borderRadius: 24,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
          >
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <span style={{ fontSize: 36 }}>🏆</span>
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: '#1e1b4b', marginBottom: 6 }}>
              {resultModal.message}
            </h3>

            {/* Streak & XP Badges */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, margin: '16px 0 20px' }}>
              <div style={{ padding: '8px 16px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 18 }}>🔥</span>
                <span style={{ fontWeight: 800, color: '#c2410c', fontSize: 14 }}>
                  {resultModal.currentStreak} Days Streak!
                </span>
              </div>
              <div style={{ padding: '8px 16px', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 18 }}>⚡</span>
                <span style={{ fontWeight: 800, color: '#6d28d9', fontSize: 14 }}>
                  +{resultModal.xpEarned} XP Earned
                </span>
              </div>
            </div>

            {/* Explanation box */}
            {resultModal.explanation && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 16px', textAlign: 'left', marginBottom: 22 }}>
                <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  💡 Technical Explanation:
                </p>
                <p style={{ margin: 0, fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
                  {resultModal.explanation}
                </p>
              </div>
            )}

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px 0', fontSize: 15 }}
              onClick={() => setResultModal(null)}
            >
              Continue Learning 🚀
            </button>
          </div>
        </div>
      )}
    </div>
  );

  /* ── GAME BOARD RENDERER ── */
  function renderGameCard(game) {
    return (
      <div className="card anim-fade-up" style={{ padding: '28px 30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                background: `${getLangBadgeColor(game.language)}20`,
                color: getLangBadgeColor(game.language),
                padding: '4px 12px',
                borderRadius: 14,
                fontSize: 12,
                fontWeight: 800,
                textTransform: 'uppercase'
              }}
            >
              {game.language}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>
              {getGameTypeLabel(game.gameType)} · {game.difficulty.toUpperCase()}
            </span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#7c3aed', background: '#ede9fe', padding: '4px 10px', borderRadius: 10 }}>
            +{game.xpReward} XP Reward
          </span>
        </div>

        <h3 style={{ fontSize: 20, color: '#1f2937', marginBottom: 6 }}>{game.title}</h3>
        <p style={{ fontSize: 14, color: '#4b5563', marginBottom: 20, lineHeight: 1.5 }}>{game.description}</p>

        {/* 1. FILL IN BLANKS MODE */}
        {game.gameType === 'fill-blank' && (
          <div>
            <div style={{ background: '#0f172a', borderRadius: 14, padding: '22px', color: '#f8fafc', fontFamily: 'monospace', fontSize: 15, marginBottom: 20, overflowX: 'auto', lineHeight: 1.8 }}>
              {renderFillBlankSnippet(game)}
            </div>

            {/* Multiple Choice Chips for Blanks */}
            {(game.fillBlankData?.blanks || []).map(b => (
              <div key={b.id} style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 6px', fontWeight: 600 }}>Choose option for {b.placeholder}:</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {b.options.map(opt => (
                    <button
                      key={opt}
                      onClick={() => setUserAnswer(p => ({ ...p, [b.id]: opt }))}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 8,
                        fontSize: 13,
                        fontFamily: 'monospace',
                        cursor: 'pointer',
                        border: userAnswer[b.id] === opt ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                        background: userAnswer[b.id] === opt ? '#ede9fe' : '#f8fafc',
                        color: userAnswer[b.id] === opt ? '#6d28d9' : '#334155',
                        fontWeight: 700
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 2. BUG HUNTER MODE */}
        {game.gameType === 'bug-hunt' && (
          <div>
            <div style={{ background: '#0f172a', borderRadius: 14, padding: '20px', color: '#f8fafc', fontFamily: 'monospace', fontSize: 14, marginBottom: 16, overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
              {game.bugHuntData?.buggyCode}
            </div>

            {/* Hint Button */}
            {game.bugHuntData?.hint && (
              <div style={{ marginBottom: 16 }}>
                <button
                  className="btn btn-ghost btn-xs"
                  onClick={() => setShowHint(p => !p)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#f59e0b', padding: '4px 8px' }}
                >
                  <FiHelpCircle size={14} /> {showHint ? 'Hide Hint' : 'Show Hint'}
                </button>
                {showHint && (
                  <div style={{ padding: '10px 14px', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 10, marginTop: 8, fontSize: 12, color: '#92400e' }}>
                    💡 {game.bugHuntData.hint}
                  </div>
                )}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>What is the key correction or missing fix?</label>
              <input
                type="text"
                placeholder="e.g. None or greet() or c.id"
                value={userAnswer || ''}
                onChange={e => setUserAnswer(e.target.value)}
                style={{ fontFamily: 'monospace', fontSize: 14 }}
              />
            </div>
          </div>
        )}

        {/* 3. OUTPUT PREDICTOR MODE */}
        {game.gameType === 'output-predict' && (
          <div>
            <div style={{ background: '#0f172a', borderRadius: 14, padding: '20px', color: '#38bdf8', fontFamily: 'monospace', fontSize: 14, marginBottom: 18, overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
              {game.outputPredictData?.code}
            </div>

            <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 10 }}>Select Predicted Output:</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 20 }}>
              {(game.outputPredictData?.options || []).map(opt => (
                <div
                  key={opt}
                  onClick={() => setUserAnswer(opt)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 10,
                    cursor: 'pointer',
                    fontFamily: 'monospace',
                    fontSize: 13,
                    border: userAnswer === opt ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                    background: userAnswer === opt ? '#ede9fe' : '#ffffff',
                    color: userAnswer === opt ? '#6d28d9' : '#1f2937',
                    fontWeight: 600,
                    transition: 'all 0.15s ease'
                  }}
                >
                  {opt}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. CODE REORDER PUZZLE MODE */}
        {game.gameType === 'code-reorder' && (
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
              🎯 Goal: {game.codeReorderData?.goal}
            </p>
            <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 14 }}>
              Use the ▲ and ▼ buttons to arrange code lines in correct execution order:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
              {reorderLines.map((line, idx) => (
                <div
                  key={line.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: '#0f172a',
                    borderRadius: 10,
                    color: '#f8fafc',
                    fontFamily: 'monospace',
                    fontSize: 13,
                    border: '1px solid #334155'
                  }}
                >
                  <span style={{ overflowX: 'auto', whiteSpace: 'pre' }}>{line.code}</span>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button
                      className="btn btn-ghost btn-xs"
                      disabled={idx === 0}
                      onClick={() => moveLine(idx, -1)}
                      style={{ color: '#94a3b8', padding: '4px 6px' }}
                    >
                      <FiChevronUp size={16} />
                    </button>
                    <button
                      className="btn btn-ghost btn-xs"
                      disabled={idx === reorderLines.length - 1}
                      onClick={() => moveLine(idx, 1)}
                      style={{ color: '#94a3b8', padding: '4px 6px' }}
                    >
                      <FiChevronDown size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit & Reset Buttons */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={submitSolution}
            disabled={submitting}
            style={{ padding: '10px 24px', fontSize: 14 }}
          >
            {submitting ? <><span className="spinner spinner-xs" /> Checking…</> : <><FiCheck size={16} /> Submit Solution</>}
          </button>
          <button
            className="btn btn-outline"
            onClick={() => initGame(game)}
            style={{ padding: '10px 18px', fontSize: 14 }}
          >
            <FiRefreshCw size={14} /> Reset
          </button>
        </div>
      </div>
    );
  }

  function renderFillBlankSnippet(game) {
    const template = game.fillBlankData?.codeSnippet || '';
    const parts = template.split(/(\{b\d+\})/g);

    return parts.map((part, idx) => {
      const match = part.match(/\{b(\d+)\}/);
      if (match) {
        const blankId = `b${match[1]}`;
        const val = userAnswer[blankId] || '___';
        return (
          <span
            key={idx}
            style={{
              display: 'inline-block',
              background: '#334155',
              color: val !== '___' ? '#38bdf8' : '#94a3b8',
              padding: '2px 10px',
              borderRadius: 6,
              border: '1px dashed #64748b',
              margin: '0 4px',
              fontWeight: 800
            }}
          >
            {val}
          </span>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  }
}
