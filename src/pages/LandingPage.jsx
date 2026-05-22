import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
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
        // Avoid compound query (where + orderBy on different fields requires a
        // composite Firestore index). Filter by status only, sort client-side.
        const q = query(
          collection(db, 'cities'),
          where('status', '==', 'live')
        );
        const snap = await getDocs(q);
        console.log(`[LandingPage] Firestore returned ${snap.docs.length} live cities`);
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Sort by createdAt ascending client-side
        docs.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() ?? 0;
          const bTime = b.createdAt?.toMillis?.() ?? 0;
          return aTime - bTime;
        });
        setCities(docs);
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
          max-width: 640px;
          margin: 0 auto;
          padding: 3rem 2rem 4rem;
        }
        .axes-title {
          text-align: center;
          font-size: 0.75rem;
          letter-spacing: 0.15em;
          color: #444;
          text-transform: uppercase;
          margin-bottom: 2.5rem;
        }
        .axis-row {
          margin-bottom: 2rem;
        }
        .axis-ends {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.4rem;
        }
        .axis-end-label {
          font-size: 0.78rem;
          color: #bbb;
          font-weight: 500;
        }
        .axis-gradient-x {
          height: 3px;
          border-radius: 2px;
          background: linear-gradient(to right, #4f4f4f, #f59e0b);
        }
        .axis-gradient-y {
          height: 3px;
          border-radius: 2px;
          background: linear-gradient(to right, #4f4f4f, #e879f9);
        }
        .axis-name {
          text-align: center;
          font-size: 0.68rem;
          letter-spacing: 0.1em;
          color: #444;
          text-transform: uppercase;
          margin-top: 0.4rem;
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
        <div className="axes-title">How it works</div>

        <div className="axis-row">
          <div className="axis-ends">
            <span className="axis-end-label">Dive</span>
            <span className="axis-end-label">Classy</span>
          </div>
          <div className="axis-gradient-x" />
          <div className="axis-name">X axis — Vibe</div>
        </div>

        <div className="axis-row">
          <div className="axis-ends">
            <span className="axis-end-label">Just Drinks</span>
            <span className="axis-end-label">Destination Dining</span>
          </div>
          <div className="axis-gradient-y" />
          <div className="axis-name">Y axis — Food &amp; Experience</div>
        </div>
      </div>

      <footer style={{ textAlign: 'center', padding: '2rem', color: '#333', fontSize: '0.8rem' }}>
        © 2026 bargraph.city
      </footer>
    </div>
  );
}
