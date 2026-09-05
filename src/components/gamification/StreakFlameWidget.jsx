import { useState } from 'react';
import { FiZap, FiAward, FiCalendar, FiCheckCircle } from 'react-icons/fi';

export default function StreakFlameWidget({ streak = 0, longestStreak = 0, isTodayActive = false, totalXP = 0, level = 1 }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className="streak-badge"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: isTodayActive
            ? 'linear-gradient(135deg, #fff7ed, #ffedd5)'
            : 'linear-gradient(135deg, #f3f4f6, #f9fafb)',
          border: isTodayActive ? '1.5px solid #fdba74' : '1.5px solid #e5e7eb',
          borderRadius: 20,
          padding: '5px 12px',
          cursor: 'pointer',
          boxShadow: isTodayActive ? '0 2px 8px rgba(249, 115, 22, 0.15)' : 'none',
          transition: 'all 0.25s ease'
        }}
      >
        <span
          style={{
            fontSize: 16,
            display: 'inline-block',
            animation: isTodayActive ? 'flamePulse 1.6s ease-in-out infinite' : 'none'
          }}
        >
          🔥
        </span>
        <span
          style={{
            fontWeight: 800,
            fontSize: 13,
            color: isTodayActive ? '#ea580c' : '#6b7280',
            fontFamily: 'Plus Jakarta Sans, sans-serif'
          }}
        >
          {streak} {streak === 1 ? 'Day' : 'Days'}
        </span>
      </div>

      {/* Floating Info Dropdown */}
      {showTooltip && (
        <div
          className="anim-fade-up"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            zIndex: 1000,
            width: 250,
            background: '#ffffff',
            borderRadius: 16,
            boxShadow: '0 16px 36px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
            padding: '16px',
            pointerEvents: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 20 }}>🔥</span>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#1f2937' }}>
                {streak} Day Learning Streak
              </p>
              <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>
                Longest: {longestStreak} days
              </p>
            </div>
          </div>

          <div
            style={{
              padding: '8px 10px',
              borderRadius: 10,
              background: isTodayActive ? '#f0fdf4' : '#fff7ed',
              border: isTodayActive ? '1px solid #bbf7d0' : '1px solid #fed7aa',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 10
            }}
          >
            {isTodayActive ? (
              <>
                <FiCheckCircle size={14} color="#16a34a" />
                <span style={{ fontSize: 11, color: '#166534', fontWeight: 600 }}>
                  Active today! Streak preserved 🔥
                </span>
              </>
            ) : (
              <>
                <FiZap size={14} color="#ea580c" />
                <span style={{ fontSize: 11, color: '#9a3412', fontWeight: 600 }}>
                  Play Daily Game or learn to keep streak!
                </span>
              </>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', borderTop: '1px solid #f3f4f6', paddingTop: 8 }}>
            <span>⚡ Level {level}</span>
            <span style={{ fontWeight: 700, color: '#7c3aed' }}>{totalXP} XP</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes flamePulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 1px #f97316); }
          50% { transform: scale(1.18); filter: drop-shadow(0 0 5px #ea580c); }
        }
      `}</style>
    </div>
  );
}
