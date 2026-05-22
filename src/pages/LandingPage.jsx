import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const CITY_EMOJIS = {
  chicagonw:       '🍺',
  stl:             '🦀',
  southwestmi:     '🍇',
  charleston:      '🦞',
  champaignurbana: '🌽',
  westlafayette:   '🚂',
};

const CITY_META = {
  chicagonw:       'Palatine · Arlington Hts · Schaumburg & more',
  stl:             'Soulard · Downtown · CWE & more',
  southwestmi:     'Harbor Country · St. Joe · Buchanan',
  charleston:      'Downtown · Peninsula',
  champaignurbana: 'Campus Town · Downtown · Urbana',
  westlafayette:   'Purdue Campus · West Lafayette · Lafayette',
};

export default function LandingPage() {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCities() {
      try {
        const q = query(
          collection(db, 'cities'),
          where('status', '==', 'live'),
          orderBy('createdAt', 'asc')
        );
        const snap = await getDocs(q);
        setCities(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Failed to fetch cities:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCities();
  }, []);

  return (
    <div style={{ background: '#000', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #000; }
        .city-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 1rem;
          padding: 1rem 2rem 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        .city-card {
          background: #111;
          border: 1px solid #222;
          border-radius: 12px;
          padding: 1.5rem;
          text-decoration: none;
          color: #fff;
          transition: border-color 0.2s, background 0.2s;
          display: block;
        }
        .city-card:hover {
          border-color: #f59e0b;
          background: #161616;
        }
        .spot-badge {
          display: inline-block;
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 999px;
          padding: 2px 10px;
          font-size: 0.75rem;
          color: #aaa;
          margin-top: 0.75rem;
        }
        .axes-section {
          max-width: 700px;
          margin: 0 auto;
          padding: 3rem 2rem;
          text-align: center;
        }
        .axes-row {
          display: flex;
          justify-content: space-around;
          margin-top: 2rem;
          gap: 2rem;
        }
        .axis-box {
          background: #111;
          border: 1px solid #222;
          border-radius: 10px;
          padding: 1.25rem 1.75rem;
          flex: 1;
        }
        .axis-label {
          font-size: 0.7rem;
          letter-spacing: 0.1em;
          color: #666;
          text-transform: uppercase;
          margin-bottom: 0.5rem;
        }
        .axis-title {
          font-size: 1rem;
          font-weight: bold;
          margin-bottom: 0.25rem;
        }
        .axis-desc {
          font-size: 0.8rem;
          color: #888;
        }
      `}</style>

      <div style={{ textAlign: 'center', padding: '3rem 2rem 1.5rem' }}>
        <h1 style={{
          fontFamily: 'Impact, "Arial Narrow", sans-serif',
          fontSize: 'clamp(2.5rem, 8vw, 5rem)',
          letterSpacing: '0.05em',
          color: '#fff',
          marginBottom: '0.5rem',
        }}>
          THE BAR GRAPH
        </h1>
        <p style={{ color: '#888', fontSize: '1.1rem', marginBottom: '1.5rem' }}>
          Find your city&apos;s best bars &amp; restaurants
        </p>
        <div style={{ width: 80, height: 2, background: '#f59e0b', margin: '0 auto' }} />
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#555', padding: '2rem' }}>Loading cities…</p>
      ) : (
        <div className="city-grid">
          {cities.map(city => {
            const emoji = CITY_EMOJIS[city.subdomain] || '📍';
            const meta = CITY_META[city.subdomain] || `${city.name}, ${city.state}`;
            return (
              <a
                key={city.id}
                href={`https://${city.subdomain}.bargraph.city`}
                className="city-card"
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{emoji}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{city.name}</div>
                <div style={{ color: '#60a5fa', fontSize: '0.85rem', marginTop: '0.2rem' }}>{city.state}</div>
                <div style={{ color: '#666', fontSize: '0.8rem', marginTop: '0.5rem' }}>{meta}</div>
                <span className="spot-badge">
                  {city.venueCount ? `${city.venueCount} spots` : 'View map'}
                </span>
              </a>
            );
          })}
        </div>
      )}

      <div className="axes-section">
        <h2 style={{ fontSize: '1rem', letterSpacing: '0.1em', color: '#555', textTransform: 'uppercase' }}>
          How it works
        </h2>
        <div className="axes-row">
          <div className="axis-box">
            <div className="axis-label">X Axis →</div>
            <div className="axis-title">Vibe</div>
            <div className="axis-desc">Dive bar to upscale lounge</div>
          </div>
          <div className="axis-box">
            <div className="axis-label">Y Axis ↑</div>
            <div className="axis-title">Price</div>
            <div className="axis-desc">Budget to splurge</div>
          </div>
        </div>
      </div>

      <footer style={{ textAlign: 'center', padding: '2rem', color: '#333', fontSize: '0.8rem' }}>
        © 2026 bargraph.city
      </footer>
    </div>
  );
}
