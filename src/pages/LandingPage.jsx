import React, { useState, useEffect } from 'react';
import {
  collection, query, where, getDocs, getCountFromServer,
  doc, getDoc, setDoc, updateDoc, increment, runTransaction,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

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

const ADMIN_EMAIL = 'jrgerberich@gmail.com';

function AuthHeaderButton({ currentUser, signOut }) {
  const isAdmin = currentUser?.email === ADMIN_EMAIL;
  const truncated = currentUser?.email
    ? currentUser.email.length > 24 ? currentUser.email.slice(0, 22) + '…' : currentUser.email
    : null;

  if (!currentUser) {
    return (
      <a href="/auth" style={{
        border: '1px solid #2a2a2a', borderRadius: 6, color: '#4ab8e8',
        fontSize: '0.8rem', padding: '5px 14px', textDecoration: 'none',
        whiteSpace: 'nowrap',
      }}>
        Sign in
      </a>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {isAdmin && (
        <a href="/admin" style={{
          border: '1px solid #2a2a2a', borderRadius: 6, color: '#a78bfa',
          fontSize: '0.8rem', padding: '5px 14px', textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}>
          Admin
        </a>
      )}
      <span style={{ color: '#555', fontSize: '0.75rem', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        title={currentUser.email}>
        {truncated}
      </span>
      <button onClick={signOut} style={{
        background: 'none', border: '1px solid #2a2a2a', borderRadius: 6,
        color: '#888', cursor: 'pointer', fontSize: '0.8rem', padding: '5px 14px',
      }}>
        Sign out
      </button>
    </div>
  );
}

export default function LandingPage() {
  const { currentUser, signOut } = useAuth();
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wantedCities, setWantedCities] = useState([]);
  const [userVotes, setUserVotes] = useState({}); // { cityId: true }
  const [votingId, setVotingId] = useState(null);

  useEffect(() => {
    async function fetchCities() {
      try {
        const q = query(collection(db, 'cities'), where('status', '==', 'live'));
        const snap = await getDocs(q);
        console.log(`[LandingPage] Firestore returned ${snap.docs.length} live cities`);

        let docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        docs.sort((a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0));

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

    async function fetchWantedCities() {
      try {
        const snap = await getDocs(collection(db, 'wanted_cities'));
        const items = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.votes || 0) - (a.votes || 0));
        setWantedCities(items);
      } catch (err) {
        console.error('Failed to fetch wanted cities:', err);
      }
    }

    fetchCities();
    fetchWantedCities();
  }, []);

  useEffect(() => {
    if (!currentUser) { setUserVotes({}); return; }
    async function fetchUserVotes() {
      try {
        const snap = await getDocs(collection(db, 'users', currentUser.uid, 'votes'));
        const votes = {};
        snap.docs.forEach(d => { votes[d.id] = true; });
        setUserVotes(votes);
      } catch {}
    }
    fetchUserVotes();
  }, [currentUser]);

  async function handleVote(cityId) {
    if (!currentUser) {
      sessionStorage.setItem('bargraphIntendedDestination', '/');
      window.location.href = '/auth';
      return;
    }
    if (userVotes[cityId] || votingId) return;

    setVotingId(cityId);
    try {
      await runTransaction(db, async (txn) => {
        const voteRef = doc(db, 'users', currentUser.uid, 'votes', cityId);
        const voteSnap = await txn.get(voteRef);
        if (voteSnap.exists()) return; // already voted
        const cityRef = doc(db, 'wanted_cities', cityId);
        txn.set(voteRef, { votedAt: new Date() });
        txn.update(cityRef, { votes: increment(1) });
      });
      setUserVotes(prev => ({ ...prev, [cityId]: true }));
      setWantedCities(prev =>
        prev.map(c => c.id === cityId ? { ...c, votes: (c.votes || 0) + 1 } : c)
      );
    } catch (err) {
      console.error('Vote failed:', err);
    } finally {
      setVotingId(null);
    }
  }

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

        .card-emoji { font-size: 28px; line-height: 1; margin-bottom: 12px; }
        .card-name {
          font-family: Impact, "Arial Black", "Arial Narrow", sans-serif;
          font-size: 22px; font-weight: 900;
          text-transform: uppercase; letter-spacing: 0.03em;
          color: #fff; display: inline;
        }
        .card-state {
          font-family: Impact, "Arial Black", "Arial Narrow", sans-serif;
          font-size: 22px; color: #4ab8e8; margin-left: 8px; display: inline;
        }
        .card-meta {
          font-size: 11px; color: #555; letter-spacing: 0.06em;
          text-transform: uppercase; margin-top: 8px;
        }
        .spot-badge {
          display: inline-block; margin-top: 14px;
          padding: 3px 12px; border-radius: 20px;
          border: 1px solid rgba(74, 184, 232, 0.3);
          color: #4ab8e8; font-size: 12px; font-weight: 500; letter-spacing: 0.02em;
        }

        .wanted-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
          padding: 8px 24px 40px;
          max-width: 860px;
          margin: 0 auto;
        }

        .wanted-card {
          background: #0a0a0a;
          border: 1px solid #1a1a1a;
          border-radius: 10px;
          padding: 20px;
          transition: border-color 0.2s;
        }
        .wanted-card:hover { border-color: #2a2a2a; }

        .vote-btn {
          background: transparent;
          border: 1px solid #2a2a2a;
          border-radius: 6px;
          color: #888;
          cursor: pointer;
          font-size: 0.8rem;
          padding: 6px 12px;
          transition: border-color 0.15s, color 0.15s;
          width: 100%;
          margin-top: 8px;
        }
        .vote-btn:hover:not(:disabled) { border-color: #4ab8e8; color: #4ab8e8; }
        .vote-btn.voted { border-color: #4ab8e8; color: #4ab8e8; }
        .vote-btn:disabled { cursor: not-allowed; opacity: 0.5; }

        .pioneer-btn {
          background: transparent;
          border: none;
          color: #555;
          cursor: pointer;
          font-size: 0.75rem;
          padding: 4px 0;
          text-align: left;
          text-decoration: none;
          display: block;
          margin-top: 8px;
          transition: color 0.15s;
        }
        .pioneer-btn:hover { color: #4ab8e8; }

        .axes-section {
          max-width: 640px; margin: 0 auto; padding: 3rem 2rem 4rem;
        }
        .axes-title {
          text-align: center; font-size: 0.75rem; letter-spacing: 0.15em;
          color: #444; text-transform: uppercase; margin-bottom: 2.5rem;
        }
        .axis-row { margin-bottom: 2rem; }
        .axis-ends { display: flex; justify-content: space-between; margin-bottom: 0.4rem; }
        .axis-end-label { font-size: 0.78rem; color: #bbb; font-weight: 500; }
        .axis-gradient-x {
          height: 3px; border-radius: 2px;
          background: linear-gradient(to right, #4f4f4f, #f59e0b);
        }
        .axis-gradient-y {
          height: 3px; border-radius: 2px;
          background: linear-gradient(to right, #4f4f4f, #e879f9);
        }
        .axis-name {
          text-align: center; font-size: 0.68rem; letter-spacing: 0.1em;
          color: #444; text-transform: uppercase; margin-top: 0.4rem;
        }
      `}</style>

      {/* Top nav bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.85rem 1.5rem',
        borderBottom: '1px solid #111',
      }}>
        <span style={{
          fontFamily: 'Impact, "Arial Black", "Arial Narrow", sans-serif',
          fontSize: '1.25rem', letterSpacing: '0.05em', color: '#fff',
        }}>
          THE BAR GRAPH
        </span>
        <AuthHeaderButton currentUser={currentUser} signOut={signOut} />
      </div>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '2.5rem 2rem 1.5rem' }}>
        <h1 style={{
          fontFamily: 'Impact, "Arial Black", "Arial Narrow", sans-serif',
          fontSize: 'clamp(2.5rem, 8vw, 5rem)',
          letterSpacing: '0.05em', color: '#fff', marginBottom: '0.5rem',
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

      {/* Wanted Cities */}
      {wantedCities.length > 0 && (
        <div style={{ borderTop: '1px solid #111', paddingTop: '3rem' }}>
          <div style={{ textAlign: 'center', padding: '0 2rem 2rem' }}>
            <h2 style={{
              fontFamily: 'Impact, "Arial Black", "Arial Narrow", sans-serif',
              fontSize: 'clamp(1.8rem, 5vw, 3rem)',
              letterSpacing: '0.08em', color: '#fff', marginBottom: '0.5rem',
            }}>
              WANTED
            </h2>
            <p style={{ color: '#555', fontSize: '0.95rem' }}>
              These cities need a pioneer. Be the first to map yours.
            </p>
          </div>

          <div className="wanted-grid">
            {wantedCities.map(city => {
              const voted = !!userVotes[city.id];
              const isVoting = votingId === city.id;
              return (
                <div key={city.id} className="wanted-card">
                  <div style={{
                    fontFamily: 'Impact, "Arial Black", sans-serif',
                    fontSize: '1.15rem', letterSpacing: '0.03em',
                  }}>
                    {city.city}
                  </div>
                  <div style={{ color: '#4ab8e8', fontSize: '0.85rem', marginTop: 2 }}>
                    {city.state}
                  </div>
                  <div style={{ color: '#555', fontSize: '0.8rem', marginTop: 8 }}>
                    {city.votes || 0} vote{city.votes !== 1 ? 's' : ''}
                  </div>
                  <button
                    className={`vote-btn${voted ? ' voted' : ''}`}
                    onClick={() => handleVote(city.id)}
                    disabled={voted || isVoting}
                  >
                    {isVoting ? '…' : voted ? '✓ Voted' : '+ Vote'}
                  </button>
                  <a
                    href={`/submit?city=${encodeURIComponent(city.city)}&state=${encodeURIComponent(city.state)}`}
                    className="pioneer-btn"
                  >
                    Pioneer this city →
                  </a>
                </div>
              );
            })}
          </div>
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
