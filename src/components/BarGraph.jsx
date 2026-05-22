import React, { useState, useEffect, useRef } from 'react';

const PRICE_TIERS = [
  { max: 7,   label: '$',    r: 6  },
  { max: 10,  label: '$$',   r: 8  },
  { max: 13,  label: '$$$',  r: 10 },
  { max: 999, label: '$$$$', r: 12 },
];

function getPriceTier(price) {
  return PRICE_TIERS.find(t => price <= t.max) || PRICE_TIERS[PRICE_TIERS.length - 1];
}

const AXIS_MIN = -5;
const AXIS_MAX = 5;
const PAD = 60;

function toSVG(val, size) {
  return PAD + ((val - AXIS_MIN) / (AXIS_MAX - AXIS_MIN)) * (size - 2 * PAD);
}

export default function BarGraph({ city, bars = [], categories = {} }) {
  const [dark, setDark] = useState(true);
  const [activeSubarea, setActiveSubarea] = useState(null);
  const [activeCats, setActiveCats] = useState([]);
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);
  const [popped, setPopped] = useState(null);
  const svgRef = useRef(null);
  const [svgSize, setSvgSize] = useState(600);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Hash routing for subarea
  useEffect(() => {
    function onHash() {
      const hash = window.location.hash.replace('#', '');
      const found = city?.subareas?.find(s => s.slug === hash);
      setActiveSubarea(found ? found.slug : null);
    }
    onHash();
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [city]);

  useEffect(() => {
    function handleResize() {
      if (svgRef.current) {
        const w = svgRef.current.clientWidth;
        setSvgSize(Math.min(w, 700));
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const bg = dark ? '#0a0a0a' : '#f8f8f8';
  const fg = dark ? '#fff' : '#111';
  const gridColor = dark ? '#1e1e1e' : '#e0e0e0';
  const axisColor = dark ? '#333' : '#ccc';

  // Map slug → label for subarea filtering
  const activeSubareaLabel = city?.subareas?.find(s => s.slug === activeSubarea)?.label || null;

  const filteredBars = bars.filter(b => {
    if (activeSubareaLabel && b.subarea !== activeSubareaLabel) return false;
    if (activeCats.length > 0 && !activeCats.includes(b.cat)) return false;
    return true;
  });

  const hasFilter = activeSubarea || activeCats.length > 0;

  // Subarea counts (keyed by label)
  const subareaCount = {};
  bars.forEach(b => {
    subareaCount[b.subarea] = (subareaCount[b.subarea] || 0) + 1;
  });

  function toggleCat(cat) {
    setActiveCats(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  }

  function handleDotClick(bar) {
    setSelected(bar);
    setPopped(bar.name);
    setTimeout(() => setPopped(null), 400);
  }

  function handleSubareaClick(slug) {
    if (activeSubarea === slug) {
      window.location.hash = '';
    } else {
      window.location.hash = slug;
    }
  }

  const usedCats = [...new Set(bars.map(b => b.cat))].filter(c => categories[c]);

  return (
    <div style={{ background: bg, minHeight: '100vh', color: fg, fontFamily: 'sans-serif', transition: 'background 0.3s' }}>
      <style>{`
        * { box-sizing: border-box; }
        .dot { cursor: pointer; }
        .dot circle { transition: opacity 0.2s; }
        @keyframes pop {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.6); }
          100% { transform: scale(1); }
        }
        .dot.popped circle { animation: pop 0.4s ease; transform-box: fill-box; transform-origin: center; }
        .subarea-btn {
          background: none; border: 1px solid #444; border-radius: 999px;
          padding: 4px 12px; font-size: 0.75rem; cursor: pointer;
          white-space: nowrap; transition: all 0.15s;
        }
        .subarea-btn.active { background: #f59e0b; border-color: #f59e0b; color: #000 !important; font-weight: bold; }
        .cat-btn {
          background: none; border: 1px solid transparent; border-radius: 6px;
          padding: 4px 10px; font-size: 0.72rem; cursor: pointer;
          display: flex; align-items: center; gap: 5px; white-space: nowrap;
          transition: all 0.15s;
        }
        .cat-btn.active { background: rgba(255,255,255,0.07); }
        .bottom-sheet {
          position: fixed; bottom: 0; left: 0; right: 0;
          background: #111; border-top: 1px solid #222;
          padding: 1.25rem 1.5rem 2rem; z-index: 100;
          border-radius: 16px 16px 0 0;
          box-shadow: 0 -4px 30px rgba(0,0,0,0.5);
        }
      `}</style>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.75rem 1.25rem',
        borderBottom: `1px solid ${dark ? '#1a1a1a' : '#ddd'}`,
      }}>
        <div>
          {activeSubareaLabel && (
            <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '2px' }}>
              <span style={{ color: fg }}>{activeSubareaLabel}</span>
              {' › '}
              <a
                href="#"
                onClick={e => { e.preventDefault(); window.location.hash = ''; }}
                style={{ color: '#888', textDecoration: 'none' }}
              >
                All {city?.name}
              </a>
            </div>
          )}
          <a href="https://bargraph.city" style={{ textDecoration: 'none', color: fg }}>
            <span style={{ fontFamily: 'Impact, "Arial Narrow", sans-serif', fontSize: '1.3rem', letterSpacing: '0.05em' }}>
              THE BAR GRAPH
            </span>
          </a>
          {!activeSubareaLabel && (
            <span style={{ marginLeft: 8, fontSize: '0.8rem', color: '#888' }}>
              {city?.name}, {city?.state}
            </span>
          )}
        </div>
        <button
          onClick={() => setDark(d => !d)}
          style={{
            background: 'none', border: `1px solid ${dark ? '#333' : '#ccc'}`,
            borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: fg, fontSize: '0.8rem',
          }}
        >
          {dark ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Subarea filter */}
      <div style={{
        display: 'flex', gap: 8, padding: '0.6rem 1.25rem', overflowX: 'auto',
        borderBottom: `1px solid ${dark ? '#1a1a1a' : '#eee'}`,
      }}>
        {city?.subareas?.map(s => (
          <button
            key={s.slug}
            className={`subarea-btn${activeSubarea === s.slug ? ' active' : ''}`}
            style={{ color: fg }}
            onClick={() => handleSubareaClick(s.slug)}
          >
            {s.label} {subareaCount[s.label] !== undefined ? `(${subareaCount[s.label]})` : ''}
          </button>
        ))}
      </div>

      {/* Category filters */}
      <div style={{ display: 'flex', gap: 6, padding: '0.5rem 1.25rem', overflowX: 'auto', flexWrap: 'wrap' }}>
        {usedCats.map(cat => {
          const color = categories[cat]?.color || '#888';
          const isActive = activeCats.includes(cat);
          return (
            <button
              key={cat}
              className={`cat-btn${isActive ? ' active' : ''}`}
              style={{
                color: isActive ? color : '#888',
                borderColor: isActive ? color : 'transparent',
              }}
              onClick={() => toggleCat(cat)}
            >
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: color, display: 'inline-block', flexShrink: 0,
              }} />
              {cat}
            </button>
          );
        })}
        {activeCats.length > 0 && (
          <button
            className="cat-btn"
            style={{ color: '#f59e0b' }}
            onClick={() => setActiveCats([])}
          >
            Clear
          </button>
        )}
      </div>

      {/* Price tier legend */}
      <div style={{ display: 'flex', gap: 16, padding: '0.25rem 1.25rem 0.5rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.7rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Price</span>
        {PRICE_TIERS.map(t => (
          <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width={t.r * 2} height={t.r * 2}>
              <circle cx={t.r} cy={t.r} r={t.r - 1} fill="none" stroke="#555" strokeWidth={1.5} />
            </svg>
            <span style={{ fontSize: '0.7rem', color: '#666' }}>{t.label}</span>
          </div>
        ))}
      </div>

      {/* SVG scatter plot */}
      <div ref={svgRef} style={{ width: '100%', maxWidth: 700, margin: '0 auto', position: 'relative' }}>
        <svg
          width="100%"
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          style={{ display: 'block' }}
          onMouseMove={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
          }}
        >
          {/* Grid lines */}
          {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map(v => (
            <g key={v}>
              <line
                x1={toSVG(v, svgSize)} y1={PAD}
                x2={toSVG(v, svgSize)} y2={svgSize - PAD}
                stroke={gridColor} strokeWidth={1}
              />
              <line
                x1={PAD} y1={toSVG(v, svgSize)}
                x2={svgSize - PAD} y2={toSVG(v, svgSize)}
                stroke={gridColor} strokeWidth={1}
              />
            </g>
          ))}

          {/* Axes */}
          <line
            x1={PAD} y1={toSVG(0, svgSize)}
            x2={svgSize - PAD} y2={toSVG(0, svgSize)}
            stroke={axisColor} strokeWidth={1.5}
          />
          <line
            x1={toSVG(0, svgSize)} y1={PAD}
            x2={toSVG(0, svgSize)} y2={svgSize - PAD}
            stroke={axisColor} strokeWidth={1.5}
          />

          {/* Axis labels */}
          <text x={PAD + 4} y={toSVG(0, svgSize) + 18} fontSize={10} fill="#555" textAnchor="start">dive bar</text>
          <text x={svgSize - PAD - 4} y={toSVG(0, svgSize) + 18} fontSize={10} fill="#555" textAnchor="end">upscale</text>
          <text x={toSVG(0, svgSize)} y={PAD - 8} fontSize={10} fill="#555" textAnchor="middle">expensive</text>
          <text x={toSVG(0, svgSize)} y={svgSize - PAD + 18} fontSize={10} fill="#555" textAnchor="middle">cheap</text>

          {/* Dots */}
          {bars.map(bar => {
            const tier = getPriceTier(bar.price);
            const color = categories[bar.cat]?.color || '#888';
            const cx = toSVG(bar.x, svgSize);
            const cy = toSVG(-bar.y, svgSize); // invert Y so higher price = higher on chart
            const isFiltered = filteredBars.includes(bar);
            const isHovered = hovered?.name === bar.name;
            const isPopped = popped === bar.name;
            const dimmed = hasFilter && !isFiltered;

            return (
              <g
                key={bar.name}
                className={`dot${isPopped ? ' popped' : ''}`}
                transform={`translate(${cx},${cy})`}
                onMouseEnter={() => setHovered(bar)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => handleDotClick(bar)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  r={tier.r}
                  fill={color}
                  opacity={dimmed ? 0.12 : 0.85}
                />
                {(isHovered || (hasFilter && isFiltered)) && (
                  <text
                    y={-tier.r - 4}
                    fontSize={9}
                    fill={fg}
                    textAnchor="middle"
                    style={{ pointerEvents: 'none' }}
                  >
                    {bar.name}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Desktop tooltip */}
        {hovered && (
          <div style={{
            position: 'absolute',
            left: Math.min(tooltipPos.x + 12, svgSize - 230),
            top: Math.max(tooltipPos.y - 60, 0),
            background: dark ? '#111' : '#fff',
            border: `1px solid ${dark ? '#333' : '#ddd'}`,
            borderRadius: 8,
            padding: '0.75rem 1rem',
            pointerEvents: 'none',
            fontSize: '0.82rem',
            zIndex: 50,
            maxWidth: 220,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            color: fg,
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{hovered.name}</div>
            <div style={{ color: '#888', fontSize: '0.75rem' }}>{hovered.address}</div>
            <div style={{ marginTop: 6, display: 'flex', gap: 8, fontSize: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ color: categories[hovered.cat]?.color || '#888' }}>{hovered.cat}</span>
              <span style={{ color: '#888' }}>{'$'.repeat(getPriceTier(hovered.price).label.length)}</span>
              {hovered.subarea && <span style={{ color: '#555' }}>{hovered.subarea}</span>}
            </div>
          </div>
        )}
      </div>

      {/* Mobile bottom sheet */}
      {selected && (
        <div className="bottom-sheet">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#fff' }}>{selected.name}</div>
              <div style={{ color: '#888', fontSize: '0.8rem', marginTop: 2 }}>{selected.address}</div>
            </div>
            <button
              onClick={() => setSelected(null)}
              style={{ background: 'none', border: 'none', color: '#666', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1, padding: 0 }}
            >
              ×
            </button>
          </div>
          <div style={{ display: 'flex', gap: 10, fontSize: '0.8rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ color: categories[selected.cat]?.color || '#888' }}>{selected.cat}</span>
            <span style={{ color: '#aaa' }}>{'$'.repeat(getPriceTier(selected.price).label.length)}</span>
            {selected.subarea && <span style={{ color: '#555' }}>{selected.subarea}</span>}
            {selected.verified && <span style={{ color: '#34d399' }}>✓ Verified</span>}
          </div>
        </div>
      )}
    </div>
  );
}
