import { useState } from 'react';
import { FiCalendar, FiActivity } from 'react-icons/fi';

export default function ActivityCalendar({ heatmap = {} }) {
  const [hoveredDay, setHoveredDay] = useState(null);

  // Generate days for past 12 weeks (84 days) up to today
  const days = [];
  const today = new Date();
  for (let i = 83; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const data = heatmap[dateStr] || { count: 0, xp: 0, items: [] };
    days.push({
      dateStr,
      dateObj: d,
      count: data.count,
      xp: data.xp,
      items: data.items || []
    });
  }

  const getColor = count => {
    if (count === 0) return '#f3f4f6';
    if (count === 1) return '#86efac';
    if (count === 2) return '#34d399';
    return '#059669';
  };

  return (
    <div className="card anim-fade-up" style={{ padding: '20px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiActivity size={16} color="#7c3aed" />
          </div>
          <div>
            <h4 style={{ fontSize: 15, fontWeight: 700, color: '#1f2937', margin: 0 }}>Learning Activity Heatmap</h4>
            <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>Past 12 weeks of daily progress</p>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#9ca3af' }}>
          <span>Less</span>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: '#f3f4f6', display: 'inline-block' }} />
          <span style={{ width: 10, height: 10, borderRadius: 2, background: '#86efac', display: 'inline-block' }} />
          <span style={{ width: 10, height: 10, borderRadius: 2, background: '#34d399', display: 'inline-block' }} />
          <span style={{ width: 10, height: 10, borderRadius: 2, background: '#059669', display: 'inline-block' }} />
          <span>More</span>
        </div>
      </div>

      {/* Grid */}
      <div style={{ overflowX: 'auto', paddingBottom: 6 }}>
        <div
          style={{
            display: 'grid',
            gridAutoFlow: 'column',
            gridTemplateRows: 'repeat(7, 13px)',
            gap: 4,
            width: 'max-content'
          }}
        >
          {days.map(d => {
            const isHovered = hoveredDay?.dateStr === d.dateStr;
            return (
              <div
                key={d.dateStr}
                onMouseEnter={() => setHoveredDay(d)}
                onMouseLeave={() => setHoveredDay(null)}
                style={{
                  width: 13,
                  height: 13,
                  borderRadius: 3,
                  background: getColor(d.count),
                  border: isHovered ? '1px solid #1e293b' : '1px solid rgba(0,0,0,0.03)',
                  cursor: 'pointer',
                  transform: isHovered ? 'scale(1.3)' : 'scale(1)',
                  transition: 'transform 0.15s ease'
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Dynamic Hover Tooltip Status Bar */}
      <div
        style={{
          marginTop: 10,
          padding: '8px 12px',
          background: '#f8fafc',
          borderRadius: 8,
          fontSize: 12,
          color: '#475569',
          minHeight: 34,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        {hoveredDay ? (
          <>
            <span style={{ fontWeight: 600, color: '#1e293b' }}>
              📅 {hoveredDay.dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span>
              {hoveredDay.count === 0 ? (
                <span style={{ color: '#94a3b8' }}>No activity logged</span>
              ) : (
                <span style={{ color: '#059669', fontWeight: 700 }}>
                  ✨ {hoveredDay.count} {hoveredDay.count === 1 ? 'activity' : 'activities'} · +{hoveredDay.xp} XP
                </span>
              )}
            </span>
          </>
        ) : (
          <span style={{ color: '#94a3b8' }}>Hover over any day tile to see details</span>
        )}
      </div>
    </div>
  );
}
