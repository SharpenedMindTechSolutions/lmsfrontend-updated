import { FiZap, FiAward } from 'react-icons/fi';

const LEVEL_TITLES = [
  'Novice Learner',
  'Code Explorer',
  'Syntax Cadet',
  'Bug Slayer',
  'Logic Master',
  'Algorithm Adept',
  'FullStack Knight',
  'Code Grandmaster'
];

export default function XPProgressCard({ totalXP = 0, level = 1, levelProgressXP = 0 }) {
  const title = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)] || 'Code Master';
  const progressPct = Math.min(100, Math.max(0, levelProgressXP));

  return (
    <div className="card anim-fade-up" style={{ padding: '20px 22px', background: 'linear-gradient(135deg, #ffffff, #faf5ff)', border: '1px solid #f3e8ff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 13,
              background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(109, 40, 217, 0.25)',
              color: '#fff',
              fontWeight: 800,
              fontSize: 17
            }}
          >
            L{level}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: '#4c1d95', margin: 0 }}>{title}</h4>
              <span style={{ background: '#ede9fe', color: '#7c3aed', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 12 }}>
                LEVEL {level}
              </span>
            </div>
            <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>
              {100 - levelProgressXP} XP needed for Level {level + 1}
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#7c3aed', display: 'flex', alignItems: 'center', gap: 4 }}>
            <FiZap size={16} color="#f59e0b" /> {totalXP} XP
          </span>
          <p style={{ fontSize: 10, color: '#9ca3af', margin: 0, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '.05em' }}>
            Total Earned
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ width: '100%', height: 8, background: '#ede9fe', borderRadius: 10, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${progressPct}%`,
            background: 'linear-gradient(90deg, #8b5cf6, #ec4899)',
            borderRadius: 10,
            transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af', marginTop: 6, fontWeight: 600 }}>
        <span>0 XP</span>
        <span>{levelProgressXP} / 100 XP</span>
        <span>100 XP</span>
      </div>
    </div>
  );
}
