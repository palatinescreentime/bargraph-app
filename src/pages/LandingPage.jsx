import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, getCountFromServer } from 'firebase/firestore';
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
  chicagonw:       'PALATINE · ARLINGTON HTS · SCHAUMBURG & MORE',
  stl:             'SOULARD · DOWNTOWN · CWE & MORE',
  southwestmi:     'HARBOR COUNTRY · ST. JOE · BUCHANAN',
  charleston:      'DOWNTOWN · PENINSULA',
  champaignurbana: 'CAMPUS TOWN · DOWNTOWN · URBANA',
  westlafayette:   'PURDUE CAMPUS · WEST LAFAYETTE · LAFAYETTE',
};

export default function LandingPage() {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCities() {
      try {
        // Avoid composite index requirement: filter only, sort client-side
        const q = query(collection(db, 'cities'), where('status', '==', 'live'));
        const snap = await getDocs(q);
        console.log(`[LandingPage] Firestore returned ${snap.docs.length} live cities`);

        let docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        docs.sort((a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0));

        // Fetch live venue counts in parallel
        const withCounts = await Promise.all(
          docs.map(async city => {
            try {
              const venuesRef = collection(db, 'cities', city.id, 'venues');
              const liveQuery = query(venuesRef, where('status', '==', 'live'));
              const countSnap = await getCountFromServer(liveQuery);
              return { ...city, venueCount: countSnap.data().count };
            } catch {
              return { ...city, venueCount: city.venueCount ?? 0 };
            }
          })
        );

        setCities(withCounts);
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
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #000; }

        .city-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 16px;
          padding: 8px 24px 40px;
          max-width: 860px;
          margin: 0 auto;
        }

        .city-card {
          background: #0f0f0f;
          border: 1px solid #1e1e1e;
          border-radius: 12px;
          padding: 28px;
          text-decoration: none;
          color: #fff;
          display: block;
          transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
        }
        .city-card:hover {
          border-color: #4ab8e8;
          transform: translateY(-3px);
          box-shadow: 0 12px 40px rgba(74, 184, 232, 0.12);
        }

        .card-emoji {
          font-size: 28px;
          line-height: 1;
          margin-bottom: 12px;
        }
        .card-name {
          font-family: Impact, "Arial Black", "Arial Narrow", sans-serif;
          font-size: 22px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          color: #fff;
          display: inline;
        }
        .card-state {
          font-family: Impact, "Arial Black", "Arial Narrow", sans-serif;
          font-size: 22px;
          color: #4ab8e8;
          margin-left: 8px;
          display: inline;
        }
        .card-meta {
          font-size: 11px;
          color: #555;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-top: 8px;
        }
        .spot-badge {
          display: inline-block;
          margin-top: 14px;
          padding: 3px 12px;
          border-radius: 20px;
          border: 1px solid rgba(74, 184, 232, 0.3);
          color: #4ab8e8;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.02em;
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

      {/* Header */}
      <div style={{ textAlign: 'center', padding: '3rem 2rem 1.5rem' }}>
        <h1 style={{
          fontFamily: 'Impact, "Arial Black", "Arial Narrow", sans-serif',
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
        <div style={{ width: 80, height: 2, background: '#f59e0b', margin: '0 auto 2rem' }} />
      </div>

      {/* City grid */}
      {loading ? (
        <p style={{ textAlign: 'center', color: '#555', padding: '2rem' }}>Loading cities…</p>
      ) : (
        <div className="city-grid">
          {cities.map(city => {
            const emoji = CITY_EMOJIS[city.subdomain] || '📍';
            const meta = CITY_META[city.subdomain] || `${city.name}, ${city.state}`.toUpperCase();
            return (
              <a
                key={city.id}
                href={`https://${city.subdomain}.bargraph.city`}
                className="city-card"
              >
                <div className="card-emoji">{emoji}</div>
                <div>
                  <span className="card-name">{city.name}</span>
                  <span className="card-state">{city.state}</span>
                </div>
                <div className="card-meta">{meta}</div>
                {city.venueCount > 0 && (
                  <div className="spot-badge">{city.venueCount} spots</div>
                )}
              </a>
            );
          })}
        </div>
      )}

      {/* How it works */}
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
