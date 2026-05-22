// SETUP REQUIRED: Add these to Vercel environment variables:
// VITE_ANTHROPIC_API_KEY
// VITE_GOOGLE_PLACES_API_KEY
// GMAIL_APP_PASSWORD
// Also add bargraph.city to Firebase Auth authorized domains

import React, { useState, useEffect, useCallback } from 'react';
import {
  collectionGroup, collection, query, where, getDocs, doc,
  updateDoc, serverTimestamp, orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { CATEGORIES } from '../hooks/useCity';

const ADMIN_EMAIL = 'jrgerberich@gmail.com';

const dark = {
  background: '#000', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif',
};
const inputStyle = {
  background: '#0f0f0f', border: '1px solid #2a2a2a',
  borderRadius: 6, color: '#fff', fontSize: '0.9rem',
  padding: '10px 14px', outline: 'none',
};
const btn = (color = '#4ab8e8') => ({
  background: color, border: 'none', borderRadius: 6, cursor: 'pointer',
  fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.04em',
  padding: '10px 18px', textTransform: 'uppercase', color: color === 'transparent' ? '#888' : '#000',
});
const ghostBtn = {
  background: 'transparent', border: '1px solid #333', borderRadius: 6,
  color: '#888', cursor: 'pointer', fontSize: '0.85rem', padding: '9px 16px',
};

function timeAgo(ts) {
  if (!ts) return '';
  const ms = ts.toMillis ? ts.toMillis() : ts;
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Mini Scatter Plot ───────────────────────────────────────────────────────

function MiniScatter({ venues, highlight }) {
  const SIZE = 200;
  const PAD = 20;
  const inner = SIZE - PAD * 2;

  function toPixel(v) {
    return PAD + ((v + 5) / 10) * inner;
  }

  return (
    <svg width={SIZE} height={SIZE} style={{ background: '#0a0a0a', borderRadius: 8, display: 'block' }}>
      <line x1={PAD} y1={SIZE / 2} x2={SIZE - PAD} y2={SIZE / 2} stroke="#222" strokeWidth={1} />
      <line x1={SIZE / 2} y1={PAD} x2={SIZE / 2} y2={SIZE - PAD} stroke="#222" strokeWidth={1} />
      {venues.map((v, i) => (
        <circle key={i} cx={toPixel(v.x || 0)} cy={toPixel(-(v.y || 0))} r={3}
          fill={CATEGORIES[v.cat]?.color || '#555'} opacity={0.6} />
      ))}
      {highlight && (
        <circle
          cx={toPixel(highlight.x)}
          cy={toPixel(-highlight.y)}
          r={6} fill="#fff" stroke="#4ab8e8" strokeWidth={2}
        />
      )}
    </svg>
  );
}

// ─── Queue Item ──────────────────────────────────────────────────────────────

function QueueItem({ item, type, selected, onClick }) {
  const accent = type === 'city' ? '#60a5fa' : item.flagged ? '#f59e0b' : '#a78bfa';
  return (
    <button
      onClick={onClick}
      style={{
        background: selected ? '#111' : 'transparent',
        border: `1px solid ${selected ? accent : '#1e1e1e'}`,
        borderRadius: 8, color: '#fff', cursor: 'pointer',
        padding: '14px 16px', textAlign: 'left', width: '100%',
        marginBottom: 8, transition: 'border-color 0.15s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            {item.flagged && <span title="Flagged">⚠️</span>}
            {item.name}
          </div>
          <div style={{ color: '#555', fontSize: '0.8rem' }}>
            {type === 'venue' ? `${item._cityId} · ${item.cat}` : `${item.state}`}
          </div>
          <div style={{ color: '#444', fontSize: '0.75rem', marginTop: 3 }}>
            {item.submitterEmail}
          </div>
        </div>
        <div style={{ color: '#333', fontSize: '0.75rem', whiteSpace: 'nowrap', marginLeft: 8 }}>
          {timeAgo(item.createdAt)}
        </div>
      </div>
      <div style={{
        display: 'inline-block', marginTop: 8, padding: '2px 10px', borderRadius: 12,
        border: `1px solid ${accent}33`, color: accent, fontSize: '0.75rem',
      }}>
        {type === 'city' ? 'city' : 'venue'}
      </div>
    </button>
  );
}

// ─── Venue Detail ────────────────────────────────────────────────────────────

function VenueDetail({ venue, existingVenues, onUpdate }) {
  const [score, setScore] = useState(null);
  const [loadingScore, setLoadingScore] = useState(false);
  const [scoreError, setScoreError] = useState('');
  const [overrideX, setOverrideX] = useState('');
  const [overrideY, setOverrideY] = useState('');
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ ...venue });
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    setScore(null);
    setOverrideX('');
    setOverrideY('');
    setEditing(false);
    setEditData({ ...venue });
    setScoreError('');
  }, [venue.id]);

  async function getClaudeScore() {
    setLoadingScore(true);
    setScoreError('');
    const prompt = `You are scoring a bar or restaurant for a scatter plot with two axes:
X axis: -5 (total dive bar) to +5 (very classy/upscale)
Y axis: -5 (just drinks, no food focus) to +5 (destination dining)

Venue: ${venue.name}
Address: ${venue.address}
Category: ${venue.cat}
Average drink price: $${venue.price}
Vibe note from submitter: ${venue.vibeNote || 'none provided'}

Respond with JSON only, no other text:
{
  "x": number between -5 and 5,
  "y": number between -5 and 5,
  "confidence": number between 0 and 1,
  "reasoning": "string explaining the scores",
  "comparables": [{"name": "string", "x": number, "y": number}]
}`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      const text = data.content?.[0]?.text || '';
      const parsed = JSON.parse(text);
      setScore(parsed);
      setOverrideX(String(parsed.x));
      setOverrideY(String(parsed.y));
    } catch (err) {
      setScoreError(err.message || 'Failed to get Claude score.');
    } finally {
      setLoadingScore(false);
    }
  }

  async function sendNotification(to, subject, body) {
    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, body }),
      });
    } catch {}
  }

  async function approve() {
    setActionLoading('approve');
    const x = parseFloat(overrideX) || score?.x || 0;
    const y = parseFloat(overrideY) || score?.y || 0;
    const ref = doc(db, 'cities', venue._cityId, 'venues', venue.id);
    await updateDoc(ref, {
      status: 'live', x, y,
      claudeScore: score || null,
      reviewedAt: serverTimestamp(),
    });
    if (venue.submitterEmail) {
      await sendNotification(
        venue.submitterEmail,
        `Your submission "${venue.name}" is now live!`,
        `Your submission "${venue.name}" is now live on ${venue._cityId}.bargraph.city. Thanks for contributing!`
      );
    }
    setActionLoading('');
    onUpdate();
  }

  async function reject() {
    const reason = window.prompt('Optional rejection reason (leave blank to skip):') ?? '';
    if (reason === null) return;
    setActionLoading('reject');
    const ref = doc(db, 'cities', venue._cityId, 'venues', venue.id);
    await updateDoc(ref, {
      status: 'rejected',
      rejectionReason: reason,
      reviewedAt: serverTimestamp(),
    });
    if (venue.submitterEmail && reason) {
      await sendNotification(
        venue.submitterEmail,
        `Update on your submission "${venue.name}"`,
        `Your submission "${venue.name}" was not approved. Reason: ${reason}`
      );
    }
    setActionLoading('');
    onUpdate();
  }

  async function saveEdit() {
    const ref = doc(db, 'cities', venue._cityId, 'venues', venue.id);
    await updateDoc(ref, {
      name: editData.name, address: editData.address,
      cat: editData.cat, price: editData.price, vibeNote: editData.vibeNote || '',
    });
    setEditing(false);
    onUpdate();
  }

  const finalX = overrideX !== '' ? parseFloat(overrideX) : (score?.x ?? 0);
  const finalY = overrideY !== '' ? parseFloat(overrideY) : (score?.y ?? 0);

  return (
    <div>
      {venue.flagged && (
        <div style={{ background: '#1a1000', border: '1px solid #f59e0b', borderRadius: 8, padding: '10px 14px', marginBottom: '1rem', color: '#f59e0b', fontSize: '0.85rem' }}>
          ⚠️ Flagged: {venue.flagReason}
        </div>
      )}

      {editing ? (
        <div style={{ marginBottom: '1.5rem' }}>
          {['name', 'address', 'vibeNote'].map(key => (
            <input key={key} style={{ ...inputStyle, width: '100%', marginBottom: 8 }}
              placeholder={key} value={editData[key] || ''}
              onChange={e => setEditData(p => ({ ...p, [key]: e.target.value }))} />
          ))}
          <select style={{ ...inputStyle, width: '100%', marginBottom: 8, appearance: 'none' }}
            value={editData.cat} onChange={e => setEditData(p => ({ ...p, cat: e.target.value }))}>
            {Object.keys(CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={saveEdit} style={btn()}>Save</button>
            <button onClick={() => setEditing(false)} style={ghostBtn}>Cancel</button>
          </div>
        </div>
      ) : (
        <div style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: 10, padding: '1.25rem', marginBottom: '1.5rem' }}>
          {[
            ['Name', venue.name],
            ['City', venue._cityId],
            ['Address', venue.address],
            ['Category', venue.cat],
            ['Price', `$${venue.price}`],
            ...(venue.subarea ? [['Subarea', venue.subarea]] : []),
            ...(venue.vibeNote ? [['Vibe note', venue.vibeNote]] : []),
            ['Submitted by', venue.submitterEmail],
          ].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', gap: 16, marginBottom: 10, fontSize: '0.9rem' }}>
              <span style={{ color: '#555', minWidth: 110 }}>{label}</span>
              <span>{val}</span>
            </div>
          ))}
        </div>
      )}

      {/* Score Section */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>Claude Score</h3>
          <button onClick={getClaudeScore} disabled={loadingScore} style={btn('#a78bfa')}>
            {loadingScore ? 'Scoring…' : score ? 'Re-score' : 'Get Claude Score'}
          </button>
        </div>

        {scoreError && <p style={{ color: '#ef4444', fontSize: '0.85rem' }}>{scoreError}</p>}

        {score && (
          <div>
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', alignItems: 'flex-start' }}>
              <MiniScatter venues={existingVenues} highlight={{ x: finalX, y: finalY }} />
              <div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: '#555', fontSize: '0.8rem', marginBottom: 4 }}>X (Dive ↔ Classy)</div>
                  <input style={{ ...inputStyle, width: 80 }} value={overrideX}
                    onChange={e => setOverrideX(e.target.value)} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: '#555', fontSize: '0.8rem', marginBottom: 4 }}>Y (Drinks ↔ Dining)</div>
                  <input style={{ ...inputStyle, width: 80 }} value={overrideY}
                    onChange={e => setOverrideY(e.target.value)} />
                </div>
                <div style={{ color: '#888', fontSize: '0.8rem' }}>
                  Confidence: {Math.round(score.confidence * 100)}%
                </div>
              </div>
            </div>

            <div style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: 8, padding: '1rem', marginBottom: '0.75rem', fontSize: '0.85rem', lineHeight: 1.6, color: '#ccc' }}>
              {score.reasoning}
            </div>

            {score.comparables?.length > 0 && (
              <div style={{ fontSize: '0.8rem', color: '#888' }}>
                <div style={{ marginBottom: 4 }}>Comparables:</div>
                {score.comparables.map((c, i) => (
                  <div key={i} style={{ marginBottom: 2 }}>
                    {c.name} (x: {c.x}, y: {c.y})
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={approve} disabled={!!actionLoading} style={btn('#22c55e')}>
          {actionLoading === 'approve' ? '…' : '✓ Approve'}
        </button>
        <button onClick={() => setEditing(true)} style={ghostBtn}>Edit</button>
        <button onClick={reject} disabled={!!actionLoading} style={btn('#ef4444')}>
          {actionLoading === 'reject' ? '…' : 'Reject'}
        </button>
      </div>
    </div>
  );
}

// ─── City Detail ─────────────────────────────────────────────────────────────

function CityDetail({ city, onUpdate }) {
  const [actionLoading, setActionLoading] = useState('');

  async function approve() {
    setActionLoading('approve');
    const ref = doc(db, 'cities', city.id);
    await updateDoc(ref, { status: 'live', reviewedAt: serverTimestamp() });
    // Also approve all pending venues for this city
    const venSnap = await getDocs(query(
      collection(db, 'cities', city.id, 'venues'),
      where('status', '==', 'pending')
    ));
    for (const d of venSnap.docs) {
      await updateDoc(d.ref, { status: 'live' });
    }
    setActionLoading('');
    onUpdate();
  }

  async function reject() {
    const reason = window.prompt('Optional rejection reason:') ?? '';
    if (reason === null) return;
    setActionLoading('reject');
    const ref = doc(db, 'cities', city.id);
    await updateDoc(ref, { status: 'rejected', rejectionReason: reason, reviewedAt: serverTimestamp() });
    setActionLoading('');
    onUpdate();
  }

  return (
    <div>
      <div style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: 10, padding: '1.25rem', marginBottom: '1.5rem' }}>
        {[
          ['City', city.name],
          ['State', city.state],
          ['URL', `${city.subdomain}.bargraph.city`],
          ['Founded by', city.foundedBy || city.submitterEmail],
          ...(city.subareas?.length ? [['Neighborhoods', city.subareas.join(', ')]] : []),
        ].map(([label, val]) => (
          <div key={label} style={{ display: 'flex', gap: 16, marginBottom: 10, fontSize: '0.9rem' }}>
            <span style={{ color: '#555', minWidth: 130 }}>{label}</span>
            <span>{val}</span>
          </div>
        ))}
      </div>

      {city._seedVenues?.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.9rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
            Seed venues ({city._seedVenues.length})
          </h3>
          {city._seedVenues.map((v, i) => (
            <div key={i} style={{ padding: '10px 14px', background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 6, marginBottom: 6, fontSize: '0.85rem' }}>
              <span style={{ fontWeight: 600 }}>{v.name}</span>
              <span style={{ color: '#555', marginLeft: 8 }}>{v.cat} · ${v.price}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={approve} disabled={!!actionLoading} style={btn('#22c55e')}>
          {actionLoading === 'approve' ? '…' : '✓ Approve city'}
        </button>
        <button onClick={reject} disabled={!!actionLoading} style={btn('#ef4444')}>
          {actionLoading === 'reject' ? '…' : 'Reject'}
        </button>
      </div>
    </div>
  );
}

// ─── Main AdminPage ──────────────────────────────────────────────────────────

export default function AdminPage() {
  const { currentUser, signOut } = useAuth();
  const [tab, setTab] = useState('venues');
  const [pendingVenues, setPendingVenues] = useState([]);
  const [pendingCities, setPendingCities] = useState([]);
  const [flaggedVenues, setFlaggedVenues] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [existingVenues, setExistingVenues] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const fetchData = useCallback(async () => {
    setLoadingData(true);
    try {
      // Pending venues via collection group
      const venSnap = await getDocs(
        query(collectionGroup(db, 'venues'), where('status', '==', 'pending'), orderBy('createdAt', 'asc'))
      );
      const venues = venSnap.docs.map(d => {
        const parts = d.ref.path.split('/');
        return { id: d.id, _cityId: parts[1], ...d.data() };
      });
      setPendingVenues(venues);

      // Flagged venues
      const flagSnap = await getDocs(
        query(collectionGroup(db, 'venues'), where('flagged', '==', true), where('status', '==', 'live'))
      );
      const flagged = flagSnap.docs.map(d => {
        const parts = d.ref.path.split('/');
        return { id: d.id, _cityId: parts[1], ...d.data() };
      });
      setFlaggedVenues(flagged);

      // Pending cities
      const citSnap = await getDocs(
        query(collection(db, 'cities'), where('status', '==', 'pending'), orderBy('createdAt', 'asc'))
      );
      const cities = await Promise.all(citSnap.docs.map(async d => {
        const city = { id: d.id, ...d.data() };
        const venSnap2 = await getDocs(
          query(collection(db, 'cities', d.id, 'venues'), where('status', '==', 'pending'))
        );
        city._seedVenues = venSnap2.docs.map(v => v.data());
        return city;
      }));
      setPendingCities(cities);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function selectVenue(venue) {
    setSelected(venue);
    setSelectedType('venue');
    // Fetch existing city venues for scatter preview
    try {
      const snap = await getDocs(
        query(collection(db, 'cities', venue._cityId, 'venues'), where('status', '==', 'live'))
      );
      setExistingVenues(snap.docs.map(d => d.data()));
    } catch {
      setExistingVenues([]);
    }
  }

  function handleUpdate() {
    setSelected(null);
    setSelectedType(null);
    fetchData();
  }

  const tabList = [
    { key: 'venues', label: 'Venues', count: pendingVenues.length },
    { key: 'cities', label: 'Cities', count: pendingCities.length },
    { key: 'flagged', label: 'Flagged', count: flaggedVenues.length },
  ];

  const queueItems = tab === 'venues' ? pendingVenues : tab === 'cities' ? pendingCities : flaggedVenues;

  return (
    <div style={dark}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid #1a1a1a', padding: '1rem 2rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <span style={{
              fontFamily: 'Impact, "Arial Black", sans-serif',
              fontSize: '1.2rem', letterSpacing: '0.05em', color: '#fff',
            }}>
              THE BAR GRAPH
            </span>
          </a>
          <span style={{ color: '#333' }}>·</span>
          <span style={{ color: '#888', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Admin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#555', fontSize: '0.8rem' }}>{currentUser?.email}</span>
          <button onClick={signOut} style={ghostBtn}>Sign out</button>
        </div>
      </div>

      {loadingData ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div style={{ width: 36, height: 36, border: '3px solid #333', borderTop: '3px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', minHeight: 'calc(100vh - 61px)' }}>
          {/* Left — Queue */}
          <div style={{ borderRight: '1px solid #1a1a1a', overflowY: 'auto' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #1a1a1a' }}>
              {tabList.map(t => (
                <button
                  key={t.key}
                  onClick={() => { setTab(t.key); setSelected(null); }}
                  style={{
                    background: 'transparent', border: 'none', color: tab === t.key ? '#fff' : '#555',
                    cursor: 'pointer', flex: 1, fontSize: '0.85rem', padding: '14px 8px',
                    borderBottom: tab === t.key ? '2px solid #4ab8e8' : '2px solid transparent',
                    transition: 'color 0.15s',
                  }}
                >
                  {t.label}
                  {t.count > 0 && (
                    <span style={{
                      background: '#1e1e1e', borderRadius: 12,
                      fontSize: '0.7rem', marginLeft: 6, padding: '2px 6px',
                    }}>
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div style={{ padding: '12px' }}>
              {queueItems.length === 0 ? (
                <p style={{ color: '#333', textAlign: 'center', padding: '3rem 0', fontSize: '0.9rem' }}>
                  Queue is empty
                </p>
              ) : queueItems.map(item => (
                <QueueItem
                  key={item.id}
                  item={item}
                  type={tab === 'cities' ? 'city' : 'venue'}
                  selected={selected?.id === item.id}
                  onClick={() => tab === 'cities'
                    ? (setSelected(item), setSelectedType('city'))
                    : selectVenue(item)
                  }
                />
              ))}
            </div>
          </div>

          {/* Right — Detail */}
          <div style={{ padding: '2rem', overflowY: 'auto' }}>
            {selected ? (
              <>
                <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', fontFamily: 'Impact, sans-serif', letterSpacing: '0.04em' }}>
                  {selected.name || selected.subdomain}
                </h2>
                {selectedType === 'venue' ? (
                  <VenueDetail venue={selected} existingVenues={existingVenues} onUpdate={handleUpdate} />
                ) : (
                  <CityDetail city={selected} onUpdate={handleUpdate} />
                )}
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#333' }}>
                Select an item from the queue to review
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
