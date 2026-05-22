import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// Initialize with application default credentials
if (!getApps().length) {
  initializeApp({ projectId: 'bargraph-app' });
}

const db = getFirestore();

const STL_CITY = {
  name: "St. Louis",
  state: "MO",
  subdomain: "stl",
  status: "live",
  subareas: [
    { label: "Downtown",         slug: "downtown"   },
    { label: "Soulard",          slug: "soulard"    },
    { label: "Cherokee St",      slug: "cherokee"   },
    { label: "Central West End", slug: "cwe"        },
    { label: "The Grove",        slug: "grove"      },
    { label: "South Grand",      slug: "southgrand" },
    { label: "Maplewood",        slug: "maplewood"  },
    { label: "Clayton",          slug: "clayton"    },
  ],
  foundedBy: null,
  createdAt: Timestamp.now(),
};

const STL_VENUES = [
  // Downtown
  { name: "The Crack Fox",      address: "1114 Olive St",      cat: "Bar & Pub",    price: 5,  x: -2.8, y: -3.7, subarea: "Downtown" },
  { name: "The Over/Under",     address: "911 Washington Ave", cat: "Sports Bar",   price: 9,  x: -0.4, y:  0.7, subarea: "Downtown" },
  { name: "Sports & Social",    address: "651 Clark Ave",      cat: "Sports Bar",   price: 10, x: -0.9, y:  1.1, subarea: "Downtown" },
  { name: "FanDuel Live!",      address: "601 Clark Ave",      cat: "Sports Bar",   price: 9,  x: -0.7, y:  0.9, subarea: "Downtown" },
  { name: "Beffa's",            address: "2700 Olive St",      cat: "Sports Bar",   price: 7,  x:  0.3, y:  1.6, subarea: "Downtown" },
  { name: "The Pitch",          address: "2 S 20th St",        cat: "Sports Bar",   price: 9,  x: -0.2, y:  1.3, subarea: "Downtown" },
  { name: "Tin Roof",           address: "1000 Clark Ave",     cat: "Live Music",   price: 10, x:  0.6, y: -1.9, subarea: "Downtown" },
  { name: "Blue Jay Brewing",   address: "2710 Locust St",     cat: "Brewery",      price: 8,  x:  0.7, y:  1.1, subarea: "Downtown" },
  { name: "Thaxton Speakeasy",  address: "1009 Olive St",      cat: "Cocktail Bar", price: 12, x:  3.1, y: -1.9, subarea: "Downtown" },
  { name: "Trust",              address: "401 Pine St",        cat: "Cocktail Bar", price: 11, x:  3.9, y:  0.9, subarea: "Downtown" },
  { name: "360 Rooftop Bar",    address: "One S Broadway",     cat: "Cocktail Bar", price: 13, x:  3.7, y: -0.4, subarea: "Downtown" },
  { name: "Blood & Sand",       address: "1500 St Charles St", cat: "Cocktail Bar", price: 14, x:  4.1, y:  2.6, subarea: "Downtown" },
  { name: "Pennydrop",          address: "400 Olive St",       cat: "American",     price: 12, x:  2.1, y:  1.4, subarea: "Downtown" },

  // Soulard
  { name: "Venice Café",        address: "1903 Pestalozzi St",  cat: "Bar & Pub",    price: 5,  x: -3.6, y: -3.2, subarea: "Soulard" },
  { name: "1860 Saloon",        address: "1860 S 9th St",       cat: "Bar & Pub",    price: 5,  x: -1.6, y:  0.4, subarea: "Soulard" },
  { name: "Social Bar Soulard", address: "1551 S 7th St",       cat: "Sports Bar",   price: 8,  x: -1.3, y:  0.3, subarea: "Soulard" },
  { name: "Paddy O's",          address: "618 S 7th St",        cat: "Sports Bar",   price: 8,  x: -0.6, y: -0.5, subarea: "Soulard" },
  { name: "Broadway Oyster Bar",address: "736 S Broadway",      cat: "Live Music",   price: 9,  x: -1.0, y:  3.2, subarea: "Soulard" },
  { name: "4 Hands Brewing",    address: "1220 S 8th St",       cat: "Brewery",      price: 9,  x:  1.3, y:  2.6, subarea: "Soulard" },
  { name: "Square One Brewery", address: "1727 Park Ave",       cat: "Brewery",      price: 10, x:  1.1, y:  2.4, subarea: "Soulard" },
  { name: "Prohibition",        address: "2017 Chouteau Ave",   cat: "Cocktail Bar", price: 11, x:  3.3, y: -1.7, subarea: "Soulard" },
  { name: "Planter's House",    address: "1000 Mississippi Ave",cat: "Cocktail Bar", price: 12, x:  3.4, y:  2.1, subarea: "Soulard" },
  { name: "Polite Society",     address: "1923 Park Ave",       cat: "American",     price: 12, x:  3.3, y:  3.6, subarea: "Soulard" },
  { name: "Eat Crow",           address: "1931 S 12th St",      cat: "American",     price: 10, x: -0.2, y:  2.1, subarea: "Soulard" },
  { name: "Frazer's",           address: "1811 Pestalozzi St",  cat: "American",     price: 13, x:  3.6, y:  3.9, subarea: "Soulard" },
  { name: "Sidney Street Café", address: "2000 Sidney St",      cat: "Fine Dining",  price: 14, x:  4.0, y:  4.4, subarea: "Soulard" },

  // Cherokee St
  { name: "Bluewood Brewing",   address: "1821 Cherokee St",    cat: "Brewery",      price: 8,  x:  0.4, y:  1.3, subarea: "Cherokee St" },

  // Central West End
  { name: "Up-Down STL",        address: "405 N Euclid Ave",    cat: "Bar & Pub",    price: 6,  x: -2.1, y: -1.7, subarea: "Central West End" },
  { name: "Narwhal's Crafted",  address: "3906 Laclede Ave",    cat: "Cocktail Bar", price: 10, x:  2.6, y: -2.4, subarea: "Central West End" },
  { name: "Lazy Tiger",         address: "210 N Euclid Ave",    cat: "Cocktail Bar", price: 12, x:  3.2, y:  0.6, subarea: "Central West End" },
  { name: "Twisted Ranch",      address: "14 Maryland Plaza",   cat: "American",     price: 9,  x: -0.7, y:  1.6, subarea: "Central West End" },

  // The Grove
  { name: "Civil Life Brewing", address: "3714 Holt Ave",       cat: "Brewery",      price: 8,  x:  0.9, y:  1.9, subarea: "The Grove" },
  { name: "Good Company",       address: "4317 Manchester Ave", cat: "American",     price: 12, x:  2.6, y:  2.9, subarea: "The Grove" },

  // South Grand
  { name: "Amsterdam Tavern",   address: "3175 Morgan Ford Rd", cat: "Bar & Pub",    price: 5,  x: -1.4, y: -1.1, subarea: "South Grand" },
  { name: "New Society",        address: "3194 S Grand Blvd",   cat: "Cocktail Bar", price: 12, x:  3.6, y: -1.4, subarea: "South Grand" },
  { name: "Kenny's Upstairs",   address: "3131 S Grand Blvd",   cat: "Cocktail Bar", price: 11, x:  2.9, y: -2.1, subarea: "South Grand" },

  // Maplewood
  { name: "Schlafly Bottleworks",address: "7260 Southwest Ave", cat: "Brewery",      price: 9,  x:  1.6, y:  2.9, subarea: "Maplewood" },
  { name: "Olive + Oak",        address: "216 W Lockwood Ave",  cat: "American",     price: 14, x:  4.1, y:  4.1, subarea: "Maplewood" },
  { name: "Acero",              address: "7266 Manchester Rd",  cat: "Italian",      price: 14, x:  4.4, y:  4.6, subarea: "Maplewood" },
  { name: "Roberto's Trattoria",address: "145 Concord Plaza",   cat: "Italian",      price: 13, x:  4.2, y:  4.3, subarea: "Maplewood" },
  { name: "Pan D'Olive",        address: "1603 McCausland Ave", cat: "Italian",      price: 12, x:  3.8, y:  4.0, subarea: "Maplewood" },

  // Clayton
  { name: "801 Chophouse",      address: "137 Carondelet Plaza",cat: "Fine Dining",  price: 15, x:  4.6, y:  4.8, subarea: "Clayton" },
];

async function seed() {
  console.log('Seeding STL city document...');
  await db.collection('cities').doc('stl').set(STL_CITY);
  console.log('City document written.');

  const venuesRef = db.collection('cities').doc('stl').collection('venues');

  console.log(`\nSeeding ${STL_VENUES.length} venues...`);
  for (const venue of STL_VENUES) {
    await venuesRef.add({
      ...venue,
      status: 'live',
      verified: true,
      submittedBy: null,
      createdAt: Timestamp.now(),
    });
    console.log(`  ✓ ${venue.name}`);
  }

  console.log(`\nDone! Seeded ${STL_VENUES.length} venues for St. Louis.`);
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
