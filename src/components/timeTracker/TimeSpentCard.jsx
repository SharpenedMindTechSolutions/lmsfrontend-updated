import { FiClock, FiTrendingUp } from 'react-icons/fi';

export default function TimeSpentCard({ todaySeconds = 0, allTimeSeconds = 0, weeklySummary = [] }) {
  const formatTime = sec => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const maxSec = Math.max(...weeklySummary.map(w => w.seconds), 3600);

  return (
    <div className="card anim-fade-up" style={{ padding: '20px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiClock size={18} color="#0284c7" />
          </div>
          <div>
            <h4 style={{ fontSize: 15, fontWeight: 700, color: '#1f2937', margin: 0 }}>Active Study Time</h4>
            <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>Verified interaction time</p>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#0284c7' }}>
            {formatTime(todaySeconds)}
          </span>
          <p style={{ fontSize: 10, color: '#9ca3af', margin: 0, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '.05em' }}>
            Today's Focus
          </p>
        </div>
      </div>

      {/* 7-Day Mini Bar Chart */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 6, height: 75, padding: '10px 4px 4px', background: '#f8fafc', borderRadius: 12 }}>
        {weeklySummary.map((item, idx) => {
          const heightPct = Math.max(8, Math.round((item.seconds / maxSec) * 100));
          const isToday = idx === weeklySummary.length - 1;
          return (
            <div key={item.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' }}>
              <div
                title={`${item.dayName}: ${formatTime(item.seconds)}`}
                style={{
                  width: '70%',
                  maxWidth: 16,
                  height: `${heightPct}%`,
                  borderRadius: 4,
                  background: isToday
                    ? 'linear-gradient(180deg, #38bdf8, #0284c7)'
                    : item.seconds > 0 ? '#cbd5e1' : '#e2e8f0',
                  transition: 'height 0.4s ease'
                }}
              />
              <span style={{ fontSize: 10, color: isToday ? '#0284c7' : '#94a3b8', marginTop: 4, fontWeight: isToday ? 700 : 500 }}>
                {item.dayName[0]}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTop: '1px solid #f1f5f9', fontSize: 12, color: '#64748b' }}>
        <span>All-Time Learning:</span>
        <span style={{ fontWeight: 700, color: '#1e293b' }}>{formatTime(allTimeSeconds)}</span>
      </div>
    </div>
  );
}
