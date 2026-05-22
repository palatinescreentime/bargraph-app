// Vercel serverless function — weekly venue validation
// Runs every Monday at 9am UTC via Vercel cron (configured in vercel.json)
// Required env vars: VITE_GOOGLE_PLACES_API_KEY, GMAIL_APP_PASSWORD

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({ projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'bargraph-app' });
}

const db = getFirestore();

const ADMIN_EMAIL = 'jrgerberich@gmail.com';
const PLACES_API_KEY = process.env.VITE_GOOGLE_PLACES_API_KEY;

async function checkVenueOnPlaces(name, address) {
  if (!PLACES_API_KEY) return { found: true, closed: false }; // skip if no key

  const query = encodeURIComponent(`${name} ${address}`);
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${PLACES_API_KEY}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      return { found: false, closed: false };
    }

    const place = data.results[0];
    if (place.business_status === 'CLOSED_PERMANENTLY') {
      return { found: true, closed: true };
    }

    return { found: true, closed: false };
  } catch {
    return { found: true, closed: false }; // don't flag on network errors
  }
}

async function sendSummaryEmail(flagged) {
  const body = flagged.map(v =>
    `• ${v.name} (${v.city}): ${v.reason}`
  ).join('\n');

  console.log('[validate] Sending summary email:', {
    to: ADMIN_EMAIL,
    subject: `Bar Graph Weekly Validation — ${flagged.length} issue${flagged.length === 1 ? '' : 's'} found`,
    body,
  });

  // Call the notify API if available
  try {
    await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: ADMIN_EMAIL,
        subject: `Bar Graph Weekly Validation — ${flagged.length} issue${flagged.length === 1 ? '' : 's'} found`,
        body: `Weekly validation found ${flagged.length} issue(s):\n\n${body}`,
      }),
    });
  } catch {}
}

export default async function handler(req, res) {
  // Allow GET for cron, POST for manual trigger
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Basic auth check for manual triggers
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Allow Vercel cron (no auth header) or matching secret
    if (authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  console.log('[validate] Starting weekly venue validation...');
  const flagged = [];
  let checked = 0;

  try {
    // Get all live cities
    const citiesSnap = await db.collection('cities').where('status', '==', 'live').get();

    for (const cityDoc of citiesSnap.docs) {
      const cityId = cityDoc.id;

      // Get all live venues for this city
      const venuesSnap = await db
        .collection('cities').doc(cityId)
        .collection('venues')
        .where('status', '==', 'live')
        .get();

      for (const venueDoc of venuesSnap.docs) {
        const venue = venueDoc.data();
        checked++;

        const { found, closed } = await checkVenueOnPlaces(venue.name, venue.address);

        if (!found || closed) {
          const reason = closed
            ? 'Marked permanently closed in Google Places'
            : 'Not found in Google Places';

          await venueDoc.ref.update({
            flagged: true,
            flagReason: reason,
            flaggedAt: new Date(),
          });

          flagged.push({ name: venue.name, city: cityId, reason });
          console.log(`[validate] Flagged: ${venue.name} (${cityId}) — ${reason}`);
        }

        // Rate limit: ~10 requests/sec to stay within free tier
        await new Promise(r => setTimeout(r, 100));
      }
    }

    console.log(`[validate] Done. Checked ${checked} venues, flagged ${flagged.length}.`);

    if (flagged.length > 0) {
      await sendSummaryEmail(flagged);
    }

    return res.status(200).json({
      ok: true,
      checked,
      flagged: flagged.length,
      issues: flagged,
    });
  } catch (err) {
    console.error('[validate] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
