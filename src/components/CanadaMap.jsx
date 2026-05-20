import React, { useState } from 'react';

// Schematic Canada map — positions approximate geography
const PROVINCES = [
  // Territories (top)
  { code: 'YT',  name: 'Yukon',                   x: 30,  y: 10,  w: 90,  h: 100 },
  { code: 'NT',  name: 'Northwest Territories',    x: 120, y: 10,  w: 170, h: 100 },
  { code: 'NU',  name: 'Nunavut',                  x: 290, y: 10,  w: 210, h: 110 },
  // Western provinces
  { code: 'BC',  name: 'British Columbia',         x: 30,  y: 110, w: 90,  h: 170 },
  { code: 'AB',  name: 'Alberta',                  x: 120, y: 110, w: 85,  h: 170 },
  { code: 'SK',  name: 'Saskatchewan',             x: 205, y: 110, w: 85,  h: 170 },
  { code: 'MB',  name: 'Manitoba',                 x: 290, y: 110, w: 75,  h: 170 },
  // Central-East
  { code: 'ON',  name: 'Ontario',                  x: 365, y: 120, w: 100, h: 160 },
  { code: 'QC',  name: 'Quebec',                   x: 410, y: 30,  w: 90,  h: 160 }, // overlaps NT/NU area
  // Atlantic
  { code: 'NB',  name: 'New Brunswick',            x: 460, y: 220, w: 50,  h: 55  },
  { code: 'NS',  name: 'Nova Scotia',              x: 455, y: 270, w: 65,  h: 35  },
  { code: 'PE',  name: 'Prince Edward Island',     x: 510, y: 205, w: 40,  h: 22  },
  { code: 'NL',  name: 'Newfoundland & Labrador',  x: 480, y: 120, w: 30,  h: 100 },
];

// Map province names/abbreviations from DB to code
const PROVINCE_ALIASES = {
  'AB': 'AB', 'ALBERTA': 'AB',
  'BC': 'BC', 'BRITISH COLUMBIA': 'BC',
  'MB': 'MB', 'MANITOBA': 'MB',
  'NB': 'NB', 'NEW BRUNSWICK': 'NB',
  'NL': 'NL', 'NEWFOUNDLAND': 'NL', 'NEWFOUNDLAND AND LABRADOR': 'NL',
  'NS': 'NS', 'NOVA SCOTIA': 'NS',
  'NT': 'NT', 'NORTHWEST TERRITORIES': 'NT',
  'NU': 'NU', 'NUNAVUT': 'NU',
  'ON': 'ON', 'ONTARIO': 'ON',
  'PE': 'PE', 'PRINCE EDWARD ISLAND': 'PE', 'PEI': 'PE',
  'QC': 'QC', 'QUEBEC': 'QC', 'QUÉBEC': 'QC',
  'SK': 'SK', 'SASKATCHEWAN': 'SK',
  'YT': 'YT', 'YUKON': 'YT',
};

export function normalizeProvince(raw) {
  if (!raw) return null;
  const upper = raw.trim().toUpperCase();
  return PROVINCE_ALIASES[upper] || null;
}

const CanadaMap = ({ provinceCounts = {} }) => {
  const [tooltip, setTooltip] = useState(null);

  const maxCount = Math.max(1, ...Object.values(provinceCounts));

  const getColor = (code) => {
    const count = provinceCounts[code] || 0;
    if (count === 0) return 'rgba(255,255,255,0.04)';
    const intensity = count / maxCount;
    // accent color: #CCFF00 with variable opacity
    const alpha = 0.15 + intensity * 0.85;
    const r = Math.round(204 * intensity + 30 * (1 - intensity));
    const g = Math.round(255 * intensity + 50 * (1 - intensity));
    const b = 0;
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const getBorder = (code) => {
    const count = provinceCounts[code] || 0;
    if (count === 0) return 'rgba(255,255,255,0.08)';
    const intensity = count / maxCount;
    return `rgba(204,255,0,${0.3 + intensity * 0.7})`;
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg
        viewBox="0 0 540 320"
        style={{ width: '100%', height: 'auto', display: 'block' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {PROVINCES.map((p) => {
          const count = provinceCounts[p.code] || 0;
          return (
            <g key={p.code}>
              <rect
                x={p.x} y={p.y} width={p.w} height={p.h}
                rx="4" ry="4"
                fill={getColor(p.code)}
                stroke={getBorder(p.code)}
                strokeWidth="1"
                style={{ cursor: 'pointer', transition: 'fill 0.3s' }}
                onMouseEnter={(e) => setTooltip({ code: p.code, name: p.name, count, x: p.x + p.w / 2, y: p.y })}
                onMouseLeave={() => setTooltip(null)}
              />
              <text
                x={p.x + p.w / 2}
                y={p.y + p.h / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{
                  fontSize: p.w < 50 ? '12px' : '18px',
                  fontWeight: 900,
                  fill: count > 0 ? (count / maxCount > 0.5 ? '#000' : '#CCFF00') : 'rgba(255,255,255,0.4)',
                  pointerEvents: 'none',
                  fontFamily: 'Inter, sans-serif',
                  letterSpacing: '1px',
                }}
              >
                {p.code}
              </text>
            </g>
          );
        })}


      </svg>

      {/* HTML Tooltip Overlay */}
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            left: `${(tooltip.x / 540) * 100}%`,
            top: `${(tooltip.y / 320) * 100}%`,
            transform: 'translate(-50%, -100%)',
            marginTop: '-12px',
            background: '#0a0a0a',
            border: '2px solid #CCFF00',
            borderRadius: '8px',
            padding: '8px 16px',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 10,
            boxShadow: '0 8px 16px rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <span style={{ fontSize: '15px', fontWeight: 900, color: '#CCFF00', letterSpacing: '0.5px', fontFamily: 'Inter, sans-serif' }}>
            {tooltip.name}
          </span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginTop: '2px', fontFamily: 'Inter, sans-serif' }}>
            {tooltip.count} {tooltip.count === 1 ? 'camisa' : 'camisas'}
          </span>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', justifyContent: 'center' }}>
        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>Poucos</span>
        <div style={{
          width: '80px', height: '8px', borderRadius: '4px',
          background: 'linear-gradient(to right, rgba(30,50,0,0.5), #CCFF00)',
          border: '1px solid rgba(204,255,0,0.3)'
        }} />
        <span style={{ fontSize: '0.65rem', color: '#CCFF00', fontWeight: 700 }}>Mais vendas</span>
      </div>
    </div>
  );
};

export default CanadaMap;
