import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({ projectId: 'bargraph-app' });
}

const db = getFirestore();

const WANTED_CITIES = [
  { city: 'Asheville', state: 'NC' },
  { city: 'Nashville', state: 'TN' },
  { city: 'Austin', state: 'TX' },
  { city: 'Denver', state: 'CO' },
  { city: 'Portland', state: 'OR' },
  { city: 'Ann Arbor', state: 'MI' },
  { city: 'Madison', state: 'WI' },
  { city: 'Savannah', state: 'GA' },
];

async function seedWantedCities() {
  console.log('Seeding wanted cities...\n');
  const batch = db.batch();

  for (const entry of WANTED_CITIES) {
    const id = entry.city.toLowerCase().replace(/[^a-z0-9]/g, '');
    const ref = db.collection('wanted_cities').doc(id);
    const snap = await ref.get();

    if (snap.exists) {
      console.log(`  Skipping ${entry.city} (already exists)`);
      continue;
    }

    batch.set(ref, {
      city: entry.city,
      state: entry.state,
      votes: 0,
      createdAt: Timestamp.now(),
    });
    console.log(`  Queued: ${entry.city}, ${entry.state} (id: ${id})`);
  }

  await batch.commit();
  console.log('\nDone seeding wanted cities.');
}

seedWantedCities().catch(console.error);
