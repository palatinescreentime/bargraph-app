import React, { useState, useEffect } from 'react';
import {
  collection, query, where, getDocs,
  addDoc, doc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { CATEGORIES } from '../hooks/useCity';

const PRICE_OPTIONS = [
  { label: 'Under $7', value: 5 },
  { label: '$7–11', value: 9 },
  { label: '$11–15', value: 13 },
  { label: '$15+', value: 16 },
];

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const baseStyle = {
  background: '#000', color: '#fff', minHeight: '100vh',
  fontFamily: 'sans-serif', padding: '0 0 4rem',
};

const inputStyle = {
  background: '#0f0f0f', border: '1px solid #2a2a2a',
  borderRadius: 8, color: '#fff', fontSize: '1rem',
  padding: '14px 18px', width: '100%', outline: 'none',
};

const btnPrimary = {
  background: '#4ab8e8', border: 'none', borderRadius: 8,
  color: '#000', cursor: 'pointer', fontSize: '1rem',
  fontWeight: 700, letterSpacing: '0.05em',
  padding: '14px 28px', textTransform: 'uppercase',
};

const btnSecondary = {
  background: 'transparent', border: '1px solid #333',
  borderRadius: 8, color: '#888', cursor: 'pointer',
  fontSize: '0.9rem', padding: '10px 20px',
};

const btnGrid = {
  background: '#0f0f0f', border: '1px solid #2a2a2a',
  borderRadius: 8, color: '#fff', cursor: 'pointer',
  fontSize: '0.9rem', padding: '12px 16px', textAlign: 'left',
  transition: 'border-color 0.15s',
};

const btnGridActive = { ...btnGrid, borderColor: '#4ab8e8', color: '#4ab8e8' };

function ProgressBar({ current, total }) {
  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ color: '#555', fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Step {current} of {total}
        </span>
      </div>
      <div style={{ height: 2, background: '#1a1a1a', borderRadius: 2 }}>
        <div style={{
          height: 2, borderRadius: 2, background: '#4ab8e8',
          width: `${(current / total) * 100}%`,
          transition: 'width 0.3s ease',
        }} />
      </div>
    </div>
  );
}

function StepWrapper({ children, onBack, showBack = true }) {
  return (
    <div style={{
      animation: 'fadeIn 0.25s ease',
      maxWidth: 560, margin: '0 auto', padding: '0 24px',
    }}>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      {children}
      {showBack && (
        <button onClick={onBack} style={{ ...btnSecondary, marginTop: '1.5rem' }}>
          ← Back
        </button>
      )}
    </div>
  );
}

// ─── VENUE FLOW ─────────────────────────────────────────────────────────────

function VenueFlow({ currentUser, prefilledCityId = '' }) {
  const [step, setStep] = useState(0);
  const [cities, setCities] = useState([]);
  const [data, setData] = useState({
    cityId: '', cityName: '', citySubareas: [],
    subarea: '', name: '', address: '',
    cat: '', price: '', vibeNote: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getDocs(query(collection(db, 'cities'), where('status', '==', 'live'))).then(snap => {
      const loaded = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => a.name.localeCompare(b.name));
      setCities(loaded);

      if (prefilledCityId) {
        const match = loaded.find(c => c.id === prefilledCityId);
        if (match) {
          setData(prev => ({
            ...prev,
            cityId: match.id,
            cityName: match.name,
            citySubareas: match.subareas || [],
          }));
          setStep(1); // skip city selection — already chosen
        }
      }
    });
  }, [prefilledCityId]);

  const hasSubareas = data.citySubareas && data.citySubareas.length > 0;
  const totalSteps = hasSubareas ? 8 : 7;

  function set(key, val) { setData(prev => ({ ...prev, [key]: val })); }

  function getStepIndex(logicalStep) {
    if (!hasSubareas && logicalStep >= 2) return logicalStep - 1;
    return logicalStep;
  }

  function next() { setStep(s => s + 1); setError(''); }
  function back() { setStep(s => Math.max(0, s - 1)); setError(''); }

  async function submit() {
    setSubmitting(true);
    setError('');
    try {
      const venuePayload = {
        name: data.name,
        address: data.address,
        cat: data.cat,
        price: data.price,
        subarea: data.subarea || '',
        vibeNote: data.vibeNote || '',
        x: 0, y: 0,
        status: 'pending',
        verified: false,
        submittedBy: currentUser.uid,
        submitterEmail: currentUser.email,
        claudeScore: null,
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'cities', data.cityId, 'venues'), venuePayload);
      console.log('Score this venue:', {
        name: data.name, address: data.address,
        cat: data.cat, price: data.price, vibeNote: data.vibeNote,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', maxWidth: 480, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
        <h2 style={{ fontFamily: 'Impact, sans-serif', fontSize: '2rem', marginBottom: '0.75rem' }}>
          THANKS!
        </h2>
        <p style={{ color: '#888', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          Your submission is in review. We&apos;ll add it to the map soon.
        </p>
        <a
          href={`https://${data.cityId}.bargraph.city`}
          style={{ color: '#4ab8e8', textDecoration: 'none', fontWeight: 600 }}
        >
          View {data.cityName} graph →
        </a>
      </div>
    );
  }

  // Step 0 — City
  if (step === 0) return (
    <StepWrapper onBack={() => {}} showBack={false}>
      <ProgressBar current={1} total={totalSteps} />
      <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Which city?</h2>
      <p style={{ color: '#888', marginBottom: '1.5rem' }}>Select the city this venue is in.</p>
      <select
        value={data.cityId}
        onChange={e => {
          const city = cities.find(c => c.id === e.target.value);
          set('cityId', e.target.value);
          set('cityName', city?.name || '');
          set('citySubareas', city?.subareas || []);
          set('subarea', '');
        }}
        style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
      >
        <option value="">Select a city…</option>
        {cities.map(c => (
          <option key={c.id} value={c.id}>{c.name}, {c.state}</option>
        ))}
      </select>
      <div style={{ marginTop: '1.5rem' }}>
        <button
          style={{ ...btnPrimary, opacity: data.cityId ? 1 : 0.4 }}
          disabled={!data.cityId}
          onClick={next}
        >
          Continue →
        </button>
      </div>
    </StepWrapper>
  );

  // Step 1 — Subarea (only if city has subareas)
  if (step === 1 && hasSubareas) return (
    <StepWrapper onBack={back}>
      <ProgressBar current={2} total={totalSteps} />
      <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Which neighborhood?</h2>
      <p style={{ color: '#888', marginBottom: '1.5rem' }}>Pick the closest area.</p>
      <select
        value={data.subarea}
        onChange={e => set('subarea', e.target.value)}
        style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
      >
        <option value="">Select a neighborhood…</option>
        {data.citySubareas.map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <div style={{ marginTop: '1.5rem' }}>
        <button style={{ ...btnPrimary, opacity: data.subarea ? 1 : 0.4 }} disabled={!data.subarea} onClick={next}>
          Continue →
        </button>
      </div>
    </StepWrapper>
  );

  // Step 1 (no subareas) or Step 2 — Venue name
  const nameStep = hasSubareas ? 2 : 1;
  if (step === nameStep) return (
    <StepWrapper onBack={back}>
      <ProgressBar current={step + 1} total={totalSteps} />
      <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>What&apos;s the name of the place?</h2>
      <p style={{ color: '#888', marginBottom: '1.5rem' }}>Enter the venue name exactly as it appears.</p>
      <input
        style={inputStyle}
        placeholder="e.g. The Violet Hour"
        value={data.name}
        onChange={e => set('name', e.target.value)}
        autoFocus
        onKeyDown={e => e.key === 'Enter' && data.name.trim() && next()}
      />
      <div style={{ marginTop: '1.5rem' }}>
        <button style={{ ...btnPrimary, opacity: data.name.trim() ? 1 : 0.4 }} disabled={!data.name.trim()} onClick={next}>
          Continue →
        </button>
      </div>
    </StepWrapper>
  );

  // Address
  const addrStep = hasSubareas ? 3 : 2;
  if (step === addrStep) return (
    <StepWrapper onBack={back}>
      <ProgressBar current={step + 1} total={totalSteps} />
      <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>What&apos;s the address?</h2>
      <p style={{ color: '#888', marginBottom: '1.5rem' }}>Street address helps us verify the venue.</p>
      <input
        style={inputStyle}
        placeholder="e.g. 1520 N Damen Ave, Chicago, IL"
        value={data.address}
        onChange={e => set('address', e.target.value)}
        autoFocus
        onKeyDown={e => e.key === 'Enter' && data.address.trim() && next()}
      />
      <div style={{ marginTop: '1.5rem' }}>
        <button style={{ ...btnPrimary, opacity: data.address.trim() ? 1 : 0.4 }} disabled={!data.address.trim()} onClick={next}>
          Continue →
        </button>
      </div>
    </StepWrapper>
  );

  // Category
  const catStep = hasSubareas ? 4 : 3;
  if (step === catStep) return (
    <StepWrapper onBack={back}>
      <ProgressBar current={step + 1} total={totalSteps} />
      <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>What kind of place is it?</h2>
      <p style={{ color: '#888', marginBottom: '1.5rem' }}>Pick the best category.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
        {Object.keys(CATEGORIES).map(cat => (
          <button
            key={cat}
            onClick={() => { set('cat', cat); next(); }}
            style={data.cat === cat ? btnGridActive : btnGrid}
          >
            {cat}
          </button>
        ))}
      </div>
    </StepWrapper>
  );

  // Price
  const priceStep = hasSubareas ? 5 : 4;
  if (step === priceStep) return (
    <StepWrapper onBack={back}>
      <ProgressBar current={step + 1} total={totalSteps} />
      <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Roughly what&apos;s the average drink price?</h2>
      <p style={{ color: '#888', marginBottom: '1.5rem' }}>Best estimate is fine.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {PRICE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => { set('price', opt.value); next(); }}
            style={{
              ...btnGrid,
              padding: '20px 16px',
              fontSize: '1.1rem',
              textAlign: 'center',
              ...(data.price === opt.value ? { borderColor: '#4ab8e8', color: '#4ab8e8' } : {}),
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </StepWrapper>
  );

  // Vibe note
  const vibeStep = hasSubareas ? 6 : 5;
  if (step === vibeStep) return (
    <StepWrapper onBack={back}>
      <ProgressBar current={step + 1} total={totalSteps} />
      <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Anything that captures the vibe?</h2>
      <p style={{ color: '#888', marginBottom: '1.5rem' }}>Optional — but it helps us score it accurately.</p>
      <textarea
        style={{ ...inputStyle, minHeight: 120, resize: 'vertical', lineHeight: 1.5 }}
        placeholder="e.g. great patio, always packed on weekends, old-school dive feel"
        value={data.vibeNote}
        onChange={e => set('vibeNote', e.target.value)}
        autoFocus
      />
      <div style={{ marginTop: '1.5rem' }}>
        <button style={btnPrimary} onClick={next}>
          {data.vibeNote.trim() ? 'Continue →' : 'Skip →'}
        </button>
      </div>
    </StepWrapper>
  );

  // Review
  const reviewStep = hasSubareas ? 7 : 6;
  if (step === reviewStep) return (
    <StepWrapper onBack={back}>
      <ProgressBar current={step + 1} total={totalSteps} />
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Look good?</h2>
      <div style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem' }}>
        {[
          ['City', data.cityName],
          ...(data.subarea ? [['Neighborhood', data.subarea]] : []),
          ['Venue', data.name],
          ['Address', data.address],
          ['Category', data.cat],
          ['Avg drink price', `$${data.price}`],
          ...(data.vibeNote ? [['Vibe note', data.vibeNote]] : []),
        ].map(([label, val]) => (
          <div key={label} style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: '0.95rem' }}>
            <span style={{ color: '#555', minWidth: 130 }}>{label}</span>
            <span style={{ color: '#fff' }}>{val}</span>
          </div>
        ))}
      </div>
      {error && <p style={{ color: '#ef4444', marginBottom: '0.75rem', fontSize: '0.9rem' }}>{error}</p>}
      <button style={{ ...btnPrimary, opacity: submitting ? 0.6 : 1 }} disabled={submitting} onClick={submit}>
        {submitting ? 'Submitting…' : 'Submit for review'}
      </button>
    </StepWrapper>
  );

  return null;
}

// ─── CITY FLOW ───────────────────────────────────────────────────────────────

function CityFlow({ currentUser, initialCityName = '', initialState = '' }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    name: initialCityName, state: initialState, subdomain: slugify(initialCityName),
    hasSubareas: false, subareas: ['', '', '', '', '', '', '', ''],
    venues: [],
  });
  const [newVenue, setNewVenue] = useState({ name: '', address: '', cat: '', price: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const totalSteps = 5;

  function set(key, val) { setData(prev => ({ ...prev, [key]: val })); }
  function next() { setStep(s => s + 1); setError(''); }
  function back() { setStep(s => Math.max(0, s - 1)); setError(''); }

  function addVenue() {
    if (!newVenue.name.trim() || !newVenue.address.trim() || !newVenue.cat || !newVenue.price) {
      setError('Fill in all venue fields before adding.');
      return;
    }
    set('venues', [...data.venues, { ...newVenue }]);
    setNewVenue({ name: '', address: '', cat: '', price: '' });
    setError('');
  }

  function removeVenue(i) {
    set('venues', data.venues.filter((_, idx) => idx !== i));
  }

  async function submit() {
    setSubmitting(true);
    setError('');
    try {
      const cityPayload = {
        name: data.name.trim(),
        state: data.state.trim().toUpperCase(),
        subdomain: data.subdomain,
        subareas: data.hasSubareas ? data.subareas.filter(s => s.trim()) : [],
        status: 'pending',
        submittedBy: currentUser.uid,
        submitterEmail: currentUser.email,
        foundedBy: currentUser.email,
        createdAt: serverTimestamp(),
      };
      const cityRef = await addDoc(collection(db, 'cities'), cityPayload);

      for (const v of data.venues) {
        await addDoc(collection(db, 'cities', data.subdomain, 'venues'), {
          ...v,
          x: 0, y: 0,
          status: 'pending',
          verified: false,
          submittedBy: currentUser.uid,
          submitterEmail: currentUser.email,
          claudeScore: null,
          createdAt: serverTimestamp(),
        });
      }
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', maxWidth: 480, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏙️</div>
        <h2 style={{ fontFamily: 'Impact, sans-serif', fontSize: '2rem', marginBottom: '0.75rem' }}>
          YOUR CITY IS IN REVIEW
        </h2>
        <p style={{ color: '#888', lineHeight: 1.6 }}>
          You&apos;ll be credited as the founder when {data.name} goes live.
        </p>
        <a href="/" style={{ color: '#4ab8e8', textDecoration: 'none', display: 'block', marginTop: '1.5rem' }}>
          ← Back to home
        </a>
      </div>
    );
  }

  // Step 0 — City name + state
  if (step === 0) return (
    <StepWrapper onBack={() => {}} showBack={false}>
      <ProgressBar current={1} total={totalSteps} />
      <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>What city are you submitting?</h2>
      <p style={{ color: '#888', marginBottom: '1.5rem' }}>Name and state.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, marginBottom: '1.5rem' }}>
        <input
          style={inputStyle} placeholder="City name" value={data.name}
          onChange={e => {
            set('name', e.target.value);
            set('subdomain', slugify(e.target.value));
          }}
          autoFocus
        />
        <input
          style={{ ...inputStyle, width: 80 }} placeholder="IL" value={data.state}
          onChange={e => set('state', e.target.value.toUpperCase().slice(0, 2))}
          maxLength={2}
        />
      </div>
      <button
        style={{ ...btnPrimary, opacity: data.name.trim() && data.state.length === 2 ? 1 : 0.4 }}
        disabled={!data.name.trim() || data.state.length !== 2}
        onClick={next}
      >
        Continue →
      </button>
    </StepWrapper>
  );

  // Step 1 — Subdomain
  if (step === 1) return (
    <StepWrapper onBack={back}>
      <ProgressBar current={2} total={totalSteps} />
      <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Proposed URL slug</h2>
      <p style={{ color: '#888', marginBottom: '1.5rem' }}>Auto-filled from city name. Only lowercase letters and numbers.</p>
      <input
        style={inputStyle}
        value={data.subdomain}
        onChange={e => set('subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
      />
      <p style={{ color: '#4ab8e8', fontSize: '0.9rem', marginTop: 8 }}>
        Preview: {data.subdomain || '…'}.bargraph.city
      </p>
      <div style={{ marginTop: '1.5rem' }}>
        <button
          style={{ ...btnPrimary, opacity: data.subdomain ? 1 : 0.4 }}
          disabled={!data.subdomain}
          onClick={next}
        >
          Continue →
        </button>
      </div>
    </StepWrapper>
  );

  // Step 2 — Subareas
  if (step === 2) return (
    <StepWrapper onBack={back}>
      <ProgressBar current={3} total={totalSteps} />
      <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Does this city have distinct neighborhoods worth filtering?</h2>
      <p style={{ color: '#888', marginBottom: '1.5rem' }}>Optional — adds a neighborhood filter to the graph.</p>
      <div style={{ display: 'flex', gap: 12, marginBottom: '1.5rem' }}>
        {[true, false].map(v => (
          <button
            key={String(v)}
            onClick={() => set('hasSubareas', v)}
            style={{ ...btnGrid, flex: 1, textAlign: 'center', padding: '16px',
              ...(data.hasSubareas === v ? { borderColor: '#4ab8e8', color: '#4ab8e8' } : {}) }}
          >
            {v ? 'Yes' : 'No'}
          </button>
        ))}
      </div>
      {data.hasSubareas && (
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: 8 }}>Add up to 8 neighborhood names:</p>
          {data.subareas.map((s, i) => (
            <input
              key={i}
              style={{ ...inputStyle, marginBottom: 8 }}
              placeholder={`Neighborhood ${i + 1}${i < 2 ? ' (required)' : ' (optional)'}`}
              value={s}
              onChange={e => {
                const next = [...data.subareas];
                next[i] = e.target.value;
                set('subareas', next);
              }}
            />
          ))}
        </div>
      )}
      <button style={btnPrimary} onClick={next}>Continue →</button>
    </StepWrapper>
  );

  // Step 3 — Seed venues
  if (step === 3) return (
    <StepWrapper onBack={back}>
      <ProgressBar current={4} total={totalSteps} />
      <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Seed venues</h2>
      <p style={{ color: '#888', marginBottom: '1.5rem' }}>Add at least 5 venues to get the map started.</p>

      {data.venues.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          {data.venues.map((v, i) => (
            <div key={i} style={{
              background: '#0f0f0f', border: '1px solid #1e1e1e',
              borderRadius: 8, padding: '12px 16px',
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 8,
            }}>
              <div>
                <span style={{ fontWeight: 600 }}>{v.name}</span>
                <span style={{ color: '#555', fontSize: '0.85rem', marginLeft: 8 }}>{v.cat} · ${v.price}</span>
              </div>
              <button onClick={() => removeVenue(i)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {data.venues.length < 20 && (
        <div style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: 12, padding: '1.25rem', marginBottom: '1rem' }}>
          <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Add venue
          </p>
          <input style={{ ...inputStyle, marginBottom: 8 }} placeholder="Venue name" value={newVenue.name}
            onChange={e => setNewVenue(p => ({ ...p, name: e.target.value }))} />
          <input style={{ ...inputStyle, marginBottom: 8 }} placeholder="Address" value={newVenue.address}
            onChange={e => setNewVenue(p => ({ ...p, address: e.target.value }))} />
          <select style={{ ...inputStyle, marginBottom: 8, appearance: 'none', cursor: 'pointer' }}
            value={newVenue.cat} onChange={e => setNewVenue(p => ({ ...p, cat: e.target.value }))}>
            <option value="">Category…</option>
            {Object.keys(CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select style={{ ...inputStyle, marginBottom: '0.75rem', appearance: 'none', cursor: 'pointer' }}
            value={newVenue.price} onChange={e => setNewVenue(p => ({ ...p, price: Number(e.target.value) }))}>
            <option value="">Avg drink price…</option>
            {PRICE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {error && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{error}</p>}
          <button onClick={addVenue} style={{ ...btnPrimary, width: '100%' }}>+ Add venue</button>
        </div>
      )}

      <div style={{ marginTop: '0.5rem' }}>
        <button
          style={{ ...btnPrimary, opacity: data.venues.length >= 5 ? 1 : 0.4 }}
          disabled={data.venues.length < 5}
          onClick={next}
        >
          Continue → ({data.venues.length}/5 minimum)
        </button>
      </div>
    </StepWrapper>
  );

  // Step 4 — Review
  if (step === 4) return (
    <StepWrapper onBack={back}>
      <ProgressBar current={5} total={totalSteps} />
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Review your city submission</h2>
      <div style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem' }}>
        {[
          ['City', `${data.name}, ${data.state}`],
          ['URL', `${data.subdomain}.bargraph.city`],
          ...(data.hasSubareas ? [['Neighborhoods', data.subareas.filter(s => s.trim()).join(', ')]] : []),
          ['Seed venues', `${data.venues.length} venues`],
        ].map(([label, val]) => (
          <div key={label} style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: '0.95rem' }}>
            <span style={{ color: '#555', minWidth: 130 }}>{label}</span>
            <span style={{ color: '#fff' }}>{val}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid #1e1e1e', marginTop: '1rem', paddingTop: '1rem' }}>
          {data.venues.map((v, i) => (
            <div key={i} style={{ color: '#888', fontSize: '0.85rem', marginBottom: 4 }}>
              • {v.name} — {v.cat} — ${v.price}
            </div>
          ))}
        </div>
      </div>
      <p style={{ color: '#555', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        You&apos;ll be credited as the founder of {data.name} when it goes live.
      </p>
      {error && <p style={{ color: '#ef4444', marginBottom: '0.75rem', fontSize: '0.9rem' }}>{error}</p>}
      <button style={{ ...btnPrimary, opacity: submitting ? 0.6 : 1 }} disabled={submitting} onClick={submit}>
        {submitting ? 'Submitting…' : 'Submit city for review'}
      </button>
    </StepWrapper>
  );

  return null;
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────

export default function SubmitPage() {
  const { currentUser } = useAuth();
  const [flow, setFlow] = useState(null);

  // Parse query params once
  const searchParams = new URLSearchParams(window.location.search);
  const flowParam   = searchParams.get('flow')  || '';   // 'venue' | 'city'
  const cityParam   = searchParams.get('city')  || '';   // subdomain ID (from BarGraph) OR city name (from pioneer)
  const stateParam  = searchParams.get('state') || '';   // present when coming from pioneer button

  // cityParam with no stateParam = subdomain ID → venue flow
  // cityParam with stateParam    = display name → city flow
  const venuePrefilledCityId   = cityParam && !stateParam ? cityParam : '';
  const cityPrefilledName      = stateParam               ? cityParam : '';

  useEffect(() => {
    if (flowParam === 'venue' || venuePrefilledCityId) setFlow('venue');
    else if (flowParam === 'city' || (cityParam && stateParam)) setFlow('city');
  }, [flowParam, venuePrefilledCityId, cityParam, stateParam]);

  return (
    <div style={baseStyle}>
      <div style={{ textAlign: 'center', padding: '2.5rem 1rem 2rem' }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <h1 style={{
            fontFamily: 'Impact, "Arial Black", "Arial Narrow", sans-serif',
            fontSize: 'clamp(1.6rem, 5vw, 2.5rem)',
            letterSpacing: '0.05em', color: '#fff',
          }}>
            THE BAR GRAPH
          </h1>
        </a>
      </div>

      {!flow ? (
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 24px' }}>
          <h2 style={{ textAlign: 'center', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            What would you like to do?
          </h2>
          <p style={{ textAlign: 'center', color: '#888', marginBottom: '2rem' }}>
            Signed in as {currentUser?.email}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              onClick={() => setFlow('venue')}
              style={{
                ...btnGrid, padding: '24px', fontSize: '1rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Add a venue</div>
                <div style={{ color: '#888', fontSize: '0.85rem' }}>Submit a bar or restaurant to an existing city</div>
              </div>
              <span style={{ color: '#4ab8e8', fontSize: '1.2rem' }}>→</span>
            </button>
            <button
              onClick={() => setFlow('city')}
              style={{
                ...btnGrid, padding: '24px', fontSize: '1rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Submit a new city</div>
                <div style={{ color: '#888', fontSize: '0.85rem' }}>Pioneer your city and become its founder</div>
              </div>
              <span style={{ color: '#4ab8e8', fontSize: '1.2rem' }}>→</span>
            </button>
          </div>
        </div>
      ) : flow === 'venue' ? (
        <VenueFlow currentUser={currentUser} prefilledCityId={venuePrefilledCityId} />
      ) : (
        <CityFlow currentUser={currentUser} initialCityName={cityPrefilledName} initialState={stateParam} />
      )}
    </div>
  );
}
