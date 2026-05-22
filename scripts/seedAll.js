import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({ projectId: 'bargraph-app' });
}

const db = getFirestore();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function clearVenues(cityId) {
  const ref = db.collection('cities').doc(cityId).collection('venues');
  const snap = await ref.get();
  if (snap.empty) return;
  // Delete in safe batches of 400 (limit is 500)
  for (let i = 0; i < snap.docs.length; i += 400) {
    const batch = db.batch();
    snap.docs.slice(i, i + 400).forEach(d => batch.delete(d.ref));
    await batch.commit();
  }
  console.log(`  Cleared ${snap.docs.length} existing venue docs for "${cityId}"`);
}

async function seedCity(cityId, cityDoc, venues) {
  console.log(`\nSeeding ${cityDoc.name}...`);

  // Upsert city document
  await db.collection('cities').doc(cityId).set(cityDoc);

  // Clear then re-add venues (makes the script safe to re-run)
  await clearVenues(cityId);

  const ref = db.collection('cities').doc(cityId).collection('venues');
  for (const v of venues) {
    await ref.add({ ...v, status: 'live', verified: true, submittedBy: null, createdAt: Timestamp.now() });
  }

  console.log(`  ✓ ${venues.length} venues written for ${cityDoc.name}`);
}

// ---------------------------------------------------------------------------
// FIX: STL had its seed run twice, producing 84 docs instead of 42.
// Re-seed it now to clear duplicates and restore the correct 42.
// ---------------------------------------------------------------------------

const STL_CITY = {
  name: "St. Louis", state: "MO", subdomain: "stl", status: "live",
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
  foundedBy: null, createdAt: Timestamp.now(),
};

const STL_VENUES = [
  { name:"The Crack Fox",       address:"1114 Olive St",       cat:"Bar & Pub",    price:5,  x:-2.8, y:-3.7, subarea:"Downtown" },
  { name:"The Over/Under",      address:"911 Washington Ave",  cat:"Sports Bar",   price:9,  x:-0.4, y: 0.7, subarea:"Downtown" },
  { name:"Sports & Social",     address:"651 Clark Ave",       cat:"Sports Bar",   price:10, x:-0.9, y: 1.1, subarea:"Downtown" },
  { name:"FanDuel Live!",       address:"601 Clark Ave",       cat:"Sports Bar",   price:9,  x:-0.7, y: 0.9, subarea:"Downtown" },
  { name:"Beffa's",             address:"2700 Olive St",       cat:"Sports Bar",   price:7,  x: 0.3, y: 1.6, subarea:"Downtown" },
  { name:"The Pitch",           address:"2 S 20th St",         cat:"Sports Bar",   price:9,  x:-0.2, y: 1.3, subarea:"Downtown" },
  { name:"Tin Roof",            address:"1000 Clark Ave",      cat:"Live Music",   price:10, x: 0.6, y:-1.9, subarea:"Downtown" },
  { name:"Blue Jay Brewing",    address:"2710 Locust St",      cat:"Brewery",      price:8,  x: 0.7, y: 1.1, subarea:"Downtown" },
  { name:"Thaxton Speakeasy",   address:"1009 Olive St",       cat:"Cocktail Bar", price:12, x: 3.1, y:-1.9, subarea:"Downtown" },
  { name:"Trust",               address:"401 Pine St",         cat:"Cocktail Bar", price:11, x: 3.9, y: 0.9, subarea:"Downtown" },
  { name:"360 Rooftop Bar",     address:"One S Broadway",      cat:"Cocktail Bar", price:13, x: 3.7, y:-0.4, subarea:"Downtown" },
  { name:"Blood & Sand",        address:"1500 St Charles St",  cat:"Cocktail Bar", price:14, x: 4.1, y: 2.6, subarea:"Downtown" },
  { name:"Pennydrop",           address:"400 Olive St",        cat:"American",     price:12, x: 2.1, y: 1.4, subarea:"Downtown" },
  { name:"Venice Café",         address:"1903 Pestalozzi St",  cat:"Bar & Pub",    price:5,  x:-3.6, y:-3.2, subarea:"Soulard" },
  { name:"1860 Saloon",         address:"1860 S 9th St",       cat:"Bar & Pub",    price:5,  x:-1.6, y: 0.4, subarea:"Soulard" },
  { name:"Social Bar Soulard",  address:"1551 S 7th St",       cat:"Sports Bar",   price:8,  x:-1.3, y: 0.3, subarea:"Soulard" },
  { name:"Paddy O's",           address:"618 S 7th St",        cat:"Sports Bar",   price:8,  x:-0.6, y:-0.5, subarea:"Soulard" },
  { name:"Broadway Oyster Bar", address:"736 S Broadway",      cat:"Live Music",   price:9,  x:-1.0, y: 3.2, subarea:"Soulard" },
  { name:"4 Hands Brewing",     address:"1220 S 8th St",       cat:"Brewery",      price:9,  x: 1.3, y: 2.6, subarea:"Soulard" },
  { name:"Square One Brewery",  address:"1727 Park Ave",       cat:"Brewery",      price:10, x: 1.1, y: 2.4, subarea:"Soulard" },
  { name:"Prohibition",         address:"2017 Chouteau Ave",   cat:"Cocktail Bar", price:11, x: 3.3, y:-1.7, subarea:"Soulard" },
  { name:"Planter's House",     address:"1000 Mississippi Ave",cat:"Cocktail Bar", price:12, x: 3.4, y: 2.1, subarea:"Soulard" },
  { name:"Polite Society",      address:"1923 Park Ave",       cat:"American",     price:12, x: 3.3, y: 3.6, subarea:"Soulard" },
  { name:"Eat Crow",            address:"1931 S 12th St",      cat:"American",     price:10, x:-0.2, y: 2.1, subarea:"Soulard" },
  { name:"Frazer's",            address:"1811 Pestalozzi St",  cat:"American",     price:13, x: 3.6, y: 3.9, subarea:"Soulard" },
  { name:"Sidney Street Café",  address:"2000 Sidney St",      cat:"Fine Dining",  price:14, x: 4.0, y: 4.4, subarea:"Soulard" },
  { name:"Bluewood Brewing",    address:"1821 Cherokee St",    cat:"Brewery",      price:8,  x: 0.4, y: 1.3, subarea:"Cherokee St" },
  { name:"Up-Down STL",         address:"405 N Euclid Ave",    cat:"Bar & Pub",    price:6,  x:-2.1, y:-1.7, subarea:"Central West End" },
  { name:"Narwhal's Crafted",   address:"3906 Laclede Ave",    cat:"Cocktail Bar", price:10, x: 2.6, y:-2.4, subarea:"Central West End" },
  { name:"Lazy Tiger",          address:"210 N Euclid Ave",    cat:"Cocktail Bar", price:12, x: 3.2, y: 0.6, subarea:"Central West End" },
  { name:"Twisted Ranch",       address:"14 Maryland Plaza",   cat:"American",     price:9,  x:-0.7, y: 1.6, subarea:"Central West End" },
  { name:"Civil Life Brewing",  address:"3714 Holt Ave",       cat:"Brewery",      price:8,  x: 0.9, y: 1.9, subarea:"The Grove" },
  { name:"Good Company",        address:"4317 Manchester Ave", cat:"American",     price:12, x: 2.6, y: 2.9, subarea:"The Grove" },
  { name:"Amsterdam Tavern",    address:"3175 Morgan Ford Rd", cat:"Bar & Pub",    price:5,  x:-1.4, y:-1.1, subarea:"South Grand" },
  { name:"New Society",         address:"3194 S Grand Blvd",   cat:"Cocktail Bar", price:12, x: 3.6, y:-1.4, subarea:"South Grand" },
  { name:"Kenny's Upstairs",    address:"3131 S Grand Blvd",   cat:"Cocktail Bar", price:11, x: 2.9, y:-2.1, subarea:"South Grand" },
  { name:"Schlafly Bottleworks",address:"7260 Southwest Ave",  cat:"Brewery",      price:9,  x: 1.6, y: 2.9, subarea:"Maplewood" },
  { name:"Olive + Oak",         address:"216 W Lockwood Ave",  cat:"American",     price:14, x: 4.1, y: 4.1, subarea:"Maplewood" },
  { name:"Acero",               address:"7266 Manchester Rd",  cat:"Italian",      price:14, x: 4.4, y: 4.6, subarea:"Maplewood" },
  { name:"Roberto's Trattoria", address:"145 Concord Plaza",   cat:"Italian",      price:13, x: 4.2, y: 4.3, subarea:"Maplewood" },
  { name:"Pan D'Olive",         address:"1603 McCausland Ave", cat:"Italian",      price:12, x: 3.8, y: 4.0, subarea:"Maplewood" },
  { name:"801 Chophouse",       address:"137 Carondelet Plaza",cat:"Fine Dining",  price:15, x: 4.6, y: 4.8, subarea:"Clayton" },
];

// ---------------------------------------------------------------------------
// Southwest Michigan
// ---------------------------------------------------------------------------

const SOUTHWESTMI_CITY = {
  name: "Southwest Michigan", state: "MI", subdomain: "southwestmi", status: "live",
  subareas: [
    { label: "New Buffalo",   slug: "newbuffalo"   },
    { label: "Three Oaks",    slug: "threeoaks"    },
    { label: "Union Pier",    slug: "unionpier"    },
    { label: "Bridgman",      slug: "bridgman"     },
    { label: "Baroda",        slug: "baroda"       },
    { label: "Stevensville",  slug: "stevensville" },
    { label: "St. Joseph",    slug: "stjoseph"     },
    { label: "Benton Harbor", slug: "bentonharbor" },
    { label: "Buchanan",      slug: "buchanan"     },
    { label: "Sister Lakes",  slug: "sisterlakes"  },
    { label: "Decatur",       slug: "decatur"      },
  ],
  foundedBy: null, createdAt: Timestamp.now(),
};

const SOUTHWESTMI_VENUES = [
  { name:"Redamak's",              address:"616 E Buffalo St",      cat:"American",     price:8,  x:-1.8, y: 2.4, subarea:"New Buffalo" },
  { name:"Beer Church Brewing",    address:"24 S Whittaker St",     cat:"Brewery",      price:9,  x: 0.8, y: 1.2, subarea:"New Buffalo" },
  { name:"Bentwood Tavern",        address:"600 W Water St",        cat:"American",     price:14, x: 4.1, y: 3.8, subarea:"New Buffalo" },
  { name:"Brewster's",             address:"11 W Merchant St",      cat:"Italian",      price:13, x: 3.8, y: 4.4, subarea:"New Buffalo" },
  { name:"Casey's",                address:"136 N Whittaker St",    cat:"American",     price:11, x: 2.2, y: 2.8, subarea:"New Buffalo" },
  { name:"Stray Dog Bar & Grill",  address:"245 N Whittaker St",    cat:"Bar & Pub",    price:9,  x:-0.6, y: 1.8, subarea:"New Buffalo" },
  { name:"Hummingbird Lounge",     address:"9 S Barton St",         cat:"Cocktail Bar", price:12, x: 3.2, y: 2.6, subarea:"New Buffalo" },
  { name:"Sonny D's",              address:"245 N Whittaker St",    cat:"American",     price:11, x: 1.6, y: 2.2, subarea:"New Buffalo" },
  { name:"Ghost Isle Brewery",     address:"24 S Whittaker St",     cat:"Brewery",      price:9,  x: 0.4, y: 0.8, subarea:"New Buffalo" },
  { name:"The False Front",        address:"136 N Whittaker St",    cat:"Cocktail Bar", price:13, x: 3.6, y: 1.4, subarea:"New Buffalo" },
  { name:"O'Brien's",              address:"195 N Whittaker St",    cat:"Bar & Pub",    price:8,  x:-1.2, y: 1.6, subarea:"New Buffalo" },
  { name:"Kankakee Grille",        address:"11111 Wilson Rd",       cat:"Steakhouse",   price:16, x: 4.4, y: 4.2, subarea:"New Buffalo" },
  { name:"Four Winds Casino Bar",  address:"11111 Wilson Rd",       cat:"Casino",       price:8,  x: 0.2, y:-1.8, subarea:"New Buffalo" },
  { name:"Journeyman Distillery",  address:"109 Generation Dr",     cat:"Distillery",   price:13, x: 4.2, y: 4.0, subarea:"Three Oaks" },
  { name:"Red Arrow Roadhouse",    address:"15479 Red Arrow Hwy",   cat:"Bar & Pub",    price:8,  x:-1.4, y: 1.6, subarea:"Three Oaks" },
  { name:"Granor Farm Dining",     address:"3342 Warren Woods Rd",  cat:"International",price:15, x: 4.8, y: 4.8, subarea:"Three Oaks" },
  { name:"Café Gulistan",          address:"13581 Red Arrow Hwy",   cat:"International",price:11, x: 3.4, y: 3.6, subarea:"Three Oaks" },
  { name:"Round Barn Union Pier",  address:"9185 Union Pier Rd",    cat:"Wine Bar",     price:10, x: 2.8, y: 1.4, subarea:"Union Pier" },
  { name:"Greenbush Brewing",      address:"5885 Sawyer Rd",        cat:"Brewery",      price:10, x: 1.8, y: 2.4, subarea:"Union Pier" },
  { name:"Skip's",                 address:"16710 Lakeshore Rd",    cat:"Seafood",      price:14, x: 3.9, y: 3.8, subarea:"Union Pier" },
  { name:"Lake Street Eats",       address:"4236 Lake St",          cat:"American",     price:10, x: 0.8, y: 2.2, subarea:"Bridgman" },
  { name:"D'Agostino's",           address:"9794 Jericho Rd",       cat:"Italian",      price:9,  x: 0.6, y: 2.8, subarea:"Bridgman" },
  { name:"Get-A-Way / Cubbie Bar", address:"4236 Lake St",          cat:"Sports Bar",   price:6,  x:-2.8, y:-1.2, subarea:"Bridgman" },
  { name:"Haymarket Taproom",      address:"9739 Store St",         cat:"Bar & Pub",    price:8,  x: 0.2, y: 0.6, subarea:"Bridgman" },
  { name:"Round Barn Pub House",   address:"8968 1st St",           cat:"Brewery",      price:11, x: 2.4, y: 3.2, subarea:"Baroda" },
  { name:"Chill Hill Tasting Room",address:"3094 N Shurtz Rd",      cat:"Wine Bar",     price:9,  x: 2.6, y: 0.8, subarea:"Baroda" },
  { name:"Baroda Bar & Grill",     address:"8968 First St",         cat:"Bar & Pub",    price:5,  x:-3.0, y: 0.4, subarea:"Baroda" },
  { name:"Grande Mere Inn",        address:"5800 Red Arrow Hwy",    cat:"Seafood",      price:15, x: 4.3, y: 4.5, subarea:"Stevensville" },
  { name:"Tosi's",                 address:"4337 Ridge Rd",         cat:"Italian",      price:13, x: 3.6, y: 4.0, subarea:"Stevensville" },
  { name:"Watermark",              address:"5800 Red Arrow Hwy",    cat:"American",     price:12, x: 2.8, y: 3.2, subarea:"Stevensville" },
  { name:"Coach's BBQ",            address:"5000 Red Arrow Hwy",    cat:"BBQ",          price:9,  x:-0.2, y: 2.6, subarea:"Stevensville" },
  { name:"Portside Bar",           address:"2528 W Glenlord Rd",    cat:"Bar & Pub",    price:6,  x:-2.4, y:-0.8, subarea:"Stevensville" },
  { name:"Silver Harbor Brewing",  address:"721 Pleasant St",       cat:"Brewery",      price:11, x: 2.0, y: 3.0, subarea:"St. Joseph" },
  { name:"Plank's Tavern",         address:"800 Whitwam Dr",        cat:"American",     price:14, x: 4.0, y: 3.6, subarea:"St. Joseph" },
  { name:"Bistro on the Boulevard",address:"521 Lake Blvd",         cat:"International",price:15, x: 4.6, y: 4.6, subarea:"St. Joseph" },
  { name:"Tavern on the River",    address:"600 Fishermans Rd",     cat:"Bar & Pub",    price:9,  x:-0.4, y: 1.8, subarea:"St. Joseph" },
  { name:"Buck Burgers & Brew",    address:"412 State St",          cat:"Brewery",      price:9,  x: 0.2, y: 1.6, subarea:"St. Joseph" },
  { name:"RyeBelles",              address:"518 Broad St",          cat:"Steakhouse",   price:12, x: 2.8, y: 3.4, subarea:"St. Joseph" },
  { name:"Papa Vino's",            address:"1535 M-139",            cat:"Italian",      price:12, x: 2.6, y: 3.8, subarea:"St. Joseph" },
  { name:"Mark III Grille",        address:"4250 Red Arrow Hwy",    cat:"American",     price:9,  x: 0.4, y: 2.4, subarea:"St. Joseph" },
  { name:"St Joe Community Taproom",address:"606 Ship St",          cat:"Brewery",      price:8,  x: 1.2, y: 0.6, subarea:"St. Joseph" },
  { name:"Bread+Bar",              address:"645 Riverview Dr",      cat:"International",price:13, x: 3.8, y: 3.4, subarea:"Benton Harbor" },
  { name:"The Livery",             address:"190 5th St",            cat:"Brewery",      price:9,  x: 0.6, y: 1.8, subarea:"Benton Harbor" },
  { name:"Mickey's Pub",           address:"1924 M-139",            cat:"Bar & Pub",    price:5,  x:-3.4, y:-1.4, subarea:"Benton Harbor" },
  { name:"Campus Q Billiards",     address:"888 Valley Dr",         cat:"Bar & Pub",    price:5,  x:-3.8, y:-2.8, subarea:"Benton Harbor" },
  { name:"Rivers Edge",            address:"653 W Main St",         cat:"Bar & Pub",    price:6,  x:-2.0, y: 0.4, subarea:"Benton Harbor" },
  { name:"Moorehouse Grill",       address:"552 Cherry St",         cat:"BBQ",          price:8,  x:-0.8, y: 2.2, subarea:"Benton Harbor" },
  { name:"Grille at Harbor Shores",address:"201 Graham Ave",        cat:"American",     price:13, x: 3.2, y: 3.6, subarea:"Benton Harbor" },
  { name:"Thistledown & Row",      address:"103 Days Ave",          cat:"Cocktail Bar", price:12, x: 3.4, y: 3.8, subarea:"Buchanan" },
  { name:"McCoy Creek Tavern",     address:"119 E Front St",        cat:"Bar & Pub",    price:6,  x:-2.2, y: 0.6, subarea:"Buchanan" },
  { name:"McCollum's",             address:"114 W Front St",        cat:"American",     price:9,  x: 0.2, y: 2.2, subarea:"Buchanan" },
  { name:"Fifteen 2 Twelve",       address:"227 E Front St",        cat:"Bar & Pub",    price:7,  x:-1.0, y:-0.6, subarea:"Buchanan" },
  { name:"Lehman's Farmhouse",     address:"4427 Red Bud Trail",    cat:"Brewery",      price:10, x: 1.6, y: 2.0, subarea:"Buchanan" },
  { name:"Tabor Hill Winery",      address:"185 Mount Tabor Rd",    cat:"Wine Bar",     price:12, x: 3.8, y: 2.4, subarea:"Buchanan" },
  { name:"River Saint Joe",        address:"205 S Oak St",          cat:"Brewery",      price:10, x: 2.0, y: 2.8, subarea:"Buchanan" },
  { name:"Sister Lakes Brewing",   address:"56 Sink Rd",            cat:"Brewery",      price:8,  x: 0.8, y: 1.4, subarea:"Sister Lakes" },
  { name:"Shoreline Inn",          address:"68 Lakeshore Dr",       cat:"Bar & Pub",    price:6,  x:-2.0, y: 0.8, subarea:"Sister Lakes" },
  { name:"Silver Beach Club",      address:"112 Silver Beach Rd",   cat:"American",     price:9,  x: 0.6, y: 1.8, subarea:"Sister Lakes" },
  { name:"The Yacht Club",         address:"4 N Shore Dr",          cat:"Bar & Pub",    price:7,  x:-0.8, y: 0.2, subarea:"Sister Lakes" },
  { name:"Cove Bar & Grill",       address:"22 N Lakeshore Dr",     cat:"American",     price:8,  x:-0.4, y: 1.6, subarea:"Sister Lakes" },
  { name:"The Rustic Tap",         address:"344 Sink Rd",           cat:"Bar & Pub",    price:5,  x:-3.2, y:-1.6, subarea:"Sister Lakes" },
  { name:"Lakeside Lounge",        address:"88 Twin Lake Dr",       cat:"Bar & Pub",    price:6,  x:-1.6, y:-0.4, subarea:"Sister Lakes" },
  { name:"Sandy Beach Bar",        address:"16 Sandy Beach Rd",     cat:"Sports Bar",   price:7,  x:-1.8, y:-1.0, subarea:"Sister Lakes" },
  { name:"Pine Lodge Bar",         address:"200 Pine Lake Dr",      cat:"Bar & Pub",    price:5,  x:-3.6, y:-2.2, subarea:"Sister Lakes" },
  { name:"Dock's Bar & Grill",     address:"72 Lakeview Dr",        cat:"American",     price:8,  x:-0.2, y: 2.0, subarea:"Sister Lakes" },
  { name:"Harbor Grill",           address:"14 Harbor Rd",          cat:"American",     price:9,  x: 1.0, y: 2.4, subarea:"Sister Lakes" },
  { name:"Waves Sports Bar",       address:"60 Wave Rd",            cat:"Sports Bar",   price:6,  x:-2.4, y:-0.8, subarea:"Sister Lakes" },
  { name:"Lakefront Pub",          address:"108 Lakeshore Dr",      cat:"Bar & Pub",    price:5,  x:-3.0, y:-1.2, subarea:"Sister Lakes" },
  { name:"Paw Paw Brewing",        address:"916 E Michigan Ave",    cat:"Brewery",      price:8,  x: 0.4, y: 1.2, subarea:"Decatur" },
  { name:"Decatur Tap",            address:"102 S Phelps St",       cat:"Bar & Pub",    price:4,  x:-4.2, y:-3.0, subarea:"Decatur" },
  { name:"Decatur Bowl & Bar",     address:"227 N Phelps St",       cat:"Bar & Pub",    price:5,  x:-3.0, y:-2.4, subarea:"Decatur" },
  { name:"Mac's Tavern",           address:"115 W Michigan Ave",    cat:"Bar & Pub",    price:4,  x:-4.0, y:-3.4, subarea:"Decatur" },
  { name:"Wellers Brewing",        address:"455 N Broadway",        cat:"Brewery",      price:8,  x: 0.8, y: 0.6, subarea:"Decatur" },
  { name:"Pizza & Pub",            address:"308 W Michigan Ave",    cat:"Pizza",        price:6,  x:-1.4, y: 1.4, subarea:"Decatur" },
  { name:"Cass County Tap",        address:"87 E Michigan Ave",     cat:"Bar & Pub",    price:5,  x:-3.4, y:-1.8, subarea:"Decatur" },
  { name:"Blue Dog Bar",           address:"14 N Phelps St",        cat:"Bar & Pub",    price:5,  x:-2.6, y:-1.6, subarea:"Decatur" },
  { name:"Country Corner Bar",     address:"R3 County Rd 352",      cat:"Bar & Pub",    price:4,  x:-4.4, y:-2.8, subarea:"Decatur" },
  { name:"Four Leaf Clover",       address:"201 W Michigan Ave",    cat:"Bar & Pub",    price:5,  x:-2.8, y:-0.6, subarea:"Decatur" },
  { name:"Harvest Grille",         address:"318 N Broadway",        cat:"American",     price:9,  x: 0.6, y: 2.6, subarea:"Decatur" },
  { name:"Tabor Hill Tap Room",    address:"185 Mount Tabor Rd",    cat:"Wine Bar",     price:11, x: 3.2, y: 2.0, subarea:"Decatur" },
];

// ---------------------------------------------------------------------------
// Chicago NW Suburbs
// ---------------------------------------------------------------------------

const CHICAGONW_CITY = {
  name: "Chicago NW Suburbs", state: "IL", subdomain: "chicagonw", status: "live",
  subareas: [
    { label: "Palatine",          slug: "palatine"       },
    { label: "Arlington Heights", slug: "arlingtonhts"   },
    { label: "Buffalo Grove",     slug: "buffalograove"  },
    { label: "Long Grove",        slug: "longgrove"      },
    { label: "Mount Prospect",    slug: "mountprospect"  },
    { label: "Rolling Meadows",   slug: "rollingmeadows" },
    { label: "Schaumburg",        slug: "schaumburg"     },
    { label: "Wheeling",          slug: "wheeling"       },
  ],
  foundedBy: null, createdAt: Timestamp.now(),
};

const CHICAGONW_VENUES = [
  { name:"Lamplighter Inn",         address:"60 N Bothwell St",      cat:"Bar & Pub",    price:5,  x:-3.7, y:-1.6, subarea:"Palatine" },
  { name:"TJ O'Brien's",            address:"53 W Slade St",         cat:"Bar & Pub",    price:6,  x:-2.4, y:-0.6, subarea:"Palatine" },
  { name:"Donkey Inn",              address:"923 S Plum Grove Rd",   cat:"Bar & Pub",    price:7,  x:-1.2, y: 1.9, subarea:"Palatine" },
  { name:"Alley 64",                address:"2001 N Rand Rd",        cat:"Bar & Pub",    price:5,  x:-2.9, y:-1.1, subarea:"Palatine" },
  { name:"Clifford's Pub",          address:"1503 N Rand Rd",        cat:"Bar & Pub",    price:4,  x:-4.6, y:-3.8, subarea:"Palatine" },
  { name:"Garfields",               address:"15 S Brockway St",      cat:"Bar & Pub",    price:5,  x:-1.0, y:-3.0, subarea:"Palatine" },
  { name:"Gentlemen Billiards",     address:"1170 E Dundee Rd",      cat:"Bar & Pub",    price:10, x: 3.8, y:-2.1, subarea:"Palatine" },
  { name:"Hot Pockets",             address:"365 W Northwest Hwy",   cat:"Sports Bar",   price:7,  x:-3.2, y:-2.7, subarea:"Palatine" },
  { name:"JL's Pizza & Sports",     address:"19 N Bothwell St",      cat:"Sports Bar",   price:6,  x:-1.8, y: 0.9, subarea:"Palatine" },
  { name:"Quentin Tap",             address:"783 N Quentin Rd",      cat:"Sports Bar",   price:8,  x: 0.4, y: 1.6, subarea:"Palatine" },
  { name:"Gators Wing Shack",       address:"1719 N Rand Rd",        cat:"Sports Bar",   price:8,  x:-2.1, y: 0.3, subarea:"Palatine" },
  { name:"Madcats",                 address:"117 W Slade St",        cat:"Live Music",   price:10, x: 1.6, y:-2.9, subarea:"Palatine" },
  { name:"Durty Nellie's",          address:"180 N Smith St",        cat:"Live Music",   price:11, x: 0.9, y: 0.6, subarea:"Palatine" },
  { name:"Emmett's Brewing",        address:"110 N Brockway St",     cat:"Brewery",      price:11, x: 1.3, y: 2.4, subarea:"Palatine" },
  { name:"The Cork @ CCF",          address:"34 Palatine Rd",        cat:"Wine Bar",     price:13, x: 4.1, y: 1.7, subarea:"Palatine" },
  { name:"Tap House Grill",         address:"56 W Wilson St",        cat:"American",     price:12, x: 2.3, y: 2.6, subarea:"Palatine" },
  { name:"Brandt's",                address:"807 W Northwest Hwy",   cat:"American",     price:9,  x: 0.7, y: 2.0, subarea:"Palatine" },
  { name:"One Taco Dos Tequilas",   address:"375 W Northwest Hwy",   cat:"Mexican",      price:10, x: 1.4, y: 2.3, subarea:"Palatine" },
  { name:"No Manches",              address:"1639 N Baldwin Rd",     cat:"Mexican",      price:9,  x: 0.5, y: 1.4, subarea:"Palatine" },
  { name:"Mexico Uno",              address:"15 N Brockway St",      cat:"Mexican",      price:7,  x:-0.9, y: 2.2, subarea:"Palatine" },
  { name:"Tacos El Norte",          address:"1324 N Rand Rd",        cat:"Mexican",      price:7,  x:-0.2, y: 2.9, subarea:"Palatine" },
  { name:"Salsa Street",            address:"1540 N Rand Rd",        cat:"Mexican",      price:7,  x: 0.1, y: 1.2, subarea:"Palatine" },
  { name:"A mi Manera",             address:"1910 N Rand Rd",        cat:"Mexican",      price:8,  x: 1.1, y: 2.8, subarea:"Palatine" },
  { name:"Fronteras Mex Grill",     address:"2379 N Hicks Rd",       cat:"Mexican",      price:6,  x: 0.6, y: 3.3, subarea:"Palatine" },
  { name:"Gianni's Cafe",           address:"18 W Station St",       cat:"Italian",      price:13, x: 3.6, y: 4.1, subarea:"Palatine" },
  { name:"Agio Italian Bistro",     address:"64 S Northwest Hwy",    cat:"Italian",      price:14, x: 4.3, y: 4.6, subarea:"Palatine" },
  { name:"Tievoli Pizza Bar",       address:"44 W Palatine Rd",      cat:"Pizza",        price:11, x: 2.8, y: 3.7, subarea:"Palatine" },
  { name:"JJ Twigs",                address:"150 S Northwest Hwy",   cat:"Pizza",        price:8,  x: 0.3, y: 2.2, subarea:"Palatine" },
  { name:"Pizza Bella",             address:"16 N Brockway St",      cat:"Pizza",        price:9,  x: 1.7, y: 2.7, subarea:"Palatine" },
  { name:"Schnell's Brauhaus",      address:"45 W Slade St",         cat:"German",       price:11, x: 2.2, y: 3.2, subarea:"Palatine" },
  { name:"Asahi Japanese",          address:"851 N Quentin Rd",      cat:"Sushi & Asian",price:10, x: 2.6, y: 3.6, subarea:"Palatine" },
  { name:"Sushi Para",              address:"1268 E Dundee Rd",      cat:"Sushi & Asian",price:11, x: 2.1, y: 4.2, subarea:"Palatine" },
  { name:"KIMPRO Sushi",            address:"23 E Northwest Hwy",    cat:"Sushi & Asian",price:10, x: 1.9, y: 3.4, subarea:"Palatine" },
  { name:"Sushi Plus Thai",         address:"309 E Northwest Hwy",   cat:"Sushi & Asian",price:10, x: 3.2, y: 4.3, subarea:"Palatine" },
  { name:"Chicago Culinary BBQ",    address:"2391 N Hicks Rd",       cat:"BBQ",          price:8,  x:-0.6, y: 3.1, subarea:"Palatine" },
  { name:"Bendita Cocina",          address:"16 S Bothwell St",      cat:"International",price:12, x: 3.3, y: 3.8, subarea:"Palatine" },
  { name:"India Foodie Lounge",     address:"383 W Northwest Hwy",   cat:"International",price:11, x: 3.0, y: 4.4, subarea:"Palatine" },
  { name:"Cortland's Garage",       address:"1 N Vail Ave",          cat:"American",     price:9,  x:-0.8, y: 1.8, subarea:"Arlington Heights" },
  { name:"Bar Salotto",             address:"1421 N Rand Rd",        cat:"Italian",      price:12, x: 3.4, y: 4.0, subarea:"Arlington Heights" },
  { name:"Arlington Ale House",     address:"111 W Campbell St",     cat:"Bar & Pub",    price:7,  x:-1.6, y:-2.0, subarea:"Arlington Heights" },
  { name:"CoCo & Blu",              address:"12 S Dunton Ave",       cat:"Cocktail Bar", price:10, x: 2.8, y: 0.4, subarea:"Arlington Heights" },
  { name:"Hideout Pub & Grill",     address:"3435 N Kennicott Ave",  cat:"Sports Bar",   price:6,  x:-1.4, y: 0.6, subarea:"Arlington Heights" },
  { name:"HOME Bar",                address:"1227 N Rand Rd",        cat:"Live Music",   price:8,  x:-1.2, y:-1.4, subarea:"Arlington Heights" },
  { name:"Bird's Nest",             address:"11 W Davis St",         cat:"Sports Bar",   price:10, x: 0.6, y: 2.2, subarea:"Arlington Heights" },
  { name:"Jimmy D's District",      address:"1718 W Northwest Hwy",  cat:"American",     price:10, x: 0.2, y: 1.6, subarea:"Arlington Heights" },
  { name:"Prairie House Tavern",    address:"2710 N Main St",        cat:"American",     price:9,  x: 0.4, y: 2.0, subarea:"Buffalo Grove" },
  { name:"Lazy Dog",                address:"51 McHenry Rd",         cat:"American",     price:11, x: 1.8, y: 3.2, subarea:"Buffalo Grove" },
  { name:"ChatterBox Long Grove",   address:"330 Old McHenry Rd",    cat:"American",     price:10, x: 0.2, y: 2.4, subarea:"Long Grove" },
  { name:"Buffalo Creek Brewing",   address:"360 Historical Ln",     cat:"Brewery",      price:9,  x: 1.0, y: 0.6, subarea:"Long Grove" },
  { name:"Mt Prospect Public House",address:"18 W Busse Ave",        cat:"Bar & Pub",    price:7,  x:-0.6, y: 0.4, subarea:"Mount Prospect" },
  { name:"Whiskey Hill Brewery",    address:"99 W Prospect Ave",     cat:"Brewery",      price:10, x: 1.4, y: 2.0, subarea:"Mount Prospect" },
  { name:"Emerson's Ale House",     address:"113 S Emerson St",      cat:"Brewery",      price:10, x: 0.8, y: 2.8, subarea:"Mount Prospect" },
  { name:"The Prospect",            address:"18 W Northwest Hwy",    cat:"Fine Dining",  price:15, x: 4.2, y: 4.4, subarea:"Mount Prospect" },
  { name:"Red Barn Brewery",        address:"303 E Kensington Rd",   cat:"Brewery",      price:9,  x: 0.2, y: 1.8, subarea:"Mount Prospect" },
  { name:"Buddy's Bites N Brews",   address:"702 N River Rd",        cat:"Sports Bar",   price:6,  x:-2.0, y: 0.0, subarea:"Mount Prospect" },
  { name:"Phoenix Flame",           address:"3240 Kirchoff Rd",      cat:"International",price:13, x: 3.8, y: 4.6, subarea:"Rolling Meadows" },
  { name:"Rep's Place",             address:"3200 Kirchoff Rd",      cat:"Sports Bar",   price:8,  x:-0.4, y: 1.4, subarea:"Rolling Meadows" },
  { name:"LuLu's",                  address:"2633 Kirchoff Rd",      cat:"Bar & Pub",    price:4,  x:-4.0, y:-3.2, subarea:"Rolling Meadows" },
  { name:"Village Tavern & Grill",  address:"901 W Wise Rd",         cat:"American",     price:9,  x: 0.0, y: 2.2, subarea:"Schaumburg" },
  { name:"Stonewood Ale House",     address:"601 Mall Dr",           cat:"American",     price:11, x: 1.6, y: 2.8, subarea:"Schaumburg" },
  { name:"Kilcoyne Redwood Inn",    address:"342 N Milwaukee Ave",   cat:"American",     price:7,  x:-1.6, y: 2.6, subarea:"Wheeling" },
  { name:"Old Munich Tavern",       address:"582 N Milwaukee Ave",   cat:"Bar & Pub",    price:6,  x:-3.0, y:-1.8, subarea:"Wheeling" },
  { name:"Saranello's",             address:"601 N Milwaukee Ave",   cat:"Italian",      price:13, x: 3.6, y: 4.2, subarea:"Wheeling" },
  { name:"Red Bottle Restaurant",   address:"401 E Dundee Rd",       cat:"Italian",      price:11, x: 2.6, y: 3.6, subarea:"Wheeling" },
  { name:"MP Kitchen & Bar",        address:"403 W Dundee Rd",       cat:"American",     price:10, x: 0.8, y: 2.4, subarea:"Wheeling" },
];

// ---------------------------------------------------------------------------
// Charleston SC
// ---------------------------------------------------------------------------

const CHARLESTON_CITY = {
  name: "Charleston", state: "SC", subdomain: "charleston", status: "live",
  subareas: [],
  foundedBy: null, createdAt: Timestamp.now(),
};

const CHARLESTON_VENUES = [
  { name:"Rooftop at the Vendue", address:"19 Vendue Range",    cat:"Rooftop Bar",  price:13, x: 3.0, y: 0.6, subarea:"" },
  { name:"Ritual Rooftop",        address:"145 Calhoun St",      cat:"Rooftop Bar",  price:12, x: 2.2, y: 1.4, subarea:"" },
  { name:"Satellite Rooftop",     address:"495 King St",         cat:"Rooftop Bar",  price:14, x: 3.4, y: 1.8, subarea:"" },
  { name:"Revelry Rooftop",       address:"10 Conroy St",        cat:"Rooftop Bar",  price:10, x: 1.6, y: 2.2, subarea:"" },
  { name:"The Peacock",           address:"213 E Bay St",        cat:"Cocktail Bar", price:13, x: 3.6, y: 2.8, subarea:"" },
  { name:"Last Saint",            address:"472 Meeting St",      cat:"Cocktail Bar", price:13, x: 4.0, y:-1.2, subarea:"" },
  { name:"Prohibition",           address:"547 King St",         cat:"Cocktail Bar", price:11, x: 2.4, y: 0.8, subarea:"" },
  { name:"Scotty Doesn't Know",   address:"251 E Bay St",        cat:"Cocktail Bar", price:14, x: 4.4, y:-2.0, subarea:"" },
  { name:"Bar Vauté",             address:"1 Broad St",          cat:"Cocktail Bar", price:14, x: 4.6, y: 1.2, subarea:"" },
  { name:"Little Palm",           address:"237 Meeting St",      cat:"Cocktail Bar", price:13, x: 3.2, y: 2.4, subarea:"" },
  { name:"Edmund's Oast",         address:"1505 King St",        cat:"Brewery",      price:10, x: 1.8, y: 3.2, subarea:"" },
  { name:"Munkle Brewing",        address:"1513 Meeting St",     cat:"Brewery",      price:9,  x: 0.6, y: 0.2, subarea:"" },
  { name:"Revelry Brewing",       address:"10 Conroy St",        cat:"Brewery",      price:9,  x: 1.0, y: 1.8, subarea:"" },
  { name:"Over The Horizon",      address:"2200 Heriot St",      cat:"Brewery",      price:8,  x: 0.8, y: 0.6, subarea:"" },
  { name:"The Whale",             address:"1640 Meeting St",     cat:"Brewery",      price:9,  x: 1.2, y:-0.4, subarea:"" },
  { name:"Husk",                  address:"76 Queen St",         cat:"Southern",     price:15, x: 4.4, y: 4.8, subarea:"" },
  { name:"Xiao Bao Biscuit",      address:"224 Rutledge Ave",    cat:"Southern",     price:11, x: 2.6, y: 3.6, subarea:"" },
  { name:"Leon's",                address:"698 King St",         cat:"American",     price:13, x: 3.6, y: 3.8, subarea:"" },
  { name:"The Ordinary",          address:"544 King St",         cat:"Seafood",      price:14, x: 4.0, y: 4.4, subarea:"" },
  { name:"FIG",                   address:"232 Meeting St",      cat:"Fine Dining",  price:16, x: 4.8, y: 4.8, subarea:"" },
  { name:"Chez Nous",             address:"6 Payne Ct",          cat:"Fine Dining",  price:16, x: 4.6, y: 4.6, subarea:"" },
];

// ---------------------------------------------------------------------------
// Champaign-Urbana IL
// ---------------------------------------------------------------------------

const CHAMPAIGNURBANA_CITY = {
  name: "Champaign-Urbana", state: "IL", subdomain: "champaignurbana", status: "live",
  subareas: [
    { label: "Campus Town",        slug: "campustown" },
    { label: "Downtown Champaign", slug: "downtown"   },
    { label: "Urbana",             slug: "urbana"     },
  ],
  foundedBy: null, createdAt: Timestamp.now(),
};

const CHAMPAIGNURBANA_VENUES = [
  { name:"Murphy's Pub",      address:"604 E Green St",        cat:"Bar & Pub",  price:5, x:-1.8, y: 0.6, subarea:"Campus Town" },
  { name:"Legends",           address:"522 E Green St",        cat:"Sports Bar", price:5, x:-1.4, y:-0.2, subarea:"Campus Town" },
  { name:"KAMS",              address:"102 E Green St",        cat:"Bar & Pub",  price:4, x:-4.8, y:-4.4, subarea:"Campus Town" },
  { name:"Illini Inn",        address:"901 S 4th St",          cat:"Bar & Pub",  price:4, x:-3.2, y:-1.8, subarea:"Campus Town" },
  { name:"The Red Lion",      address:"211 E Green St",        cat:"Bar & Pub",  price:5, x:-3.6, y:-4.2, subarea:"Campus Town" },
  { name:"Barrelhouse 34",    address:"34 E Main St",          cat:"Bar & Pub",  price:9, x: 0.8, y: 0.6, subarea:"Downtown Champaign" },
  { name:"Hound's Rest",      address:"120 N Walnut St",       cat:"Cocktail Bar",price:9, x: 2.4, y:-1.0, subarea:"Downtown Champaign" },
  { name:"Hound's Court",     address:"120 N Neil St",         cat:"Cocktail Bar",price:8, x: 1.8, y:-0.8, subarea:"Downtown Champaign" },
  { name:"Pour Bros.",        address:"40 E University Ave",   cat:"Bar & Pub",  price:8, x: 0.6, y:-0.6, subarea:"Downtown Champaign" },
  { name:"Collective Pour",   address:"340 N Neil St",         cat:"Cocktail Bar",price:10, x: 2.0, y:-0.4, subarea:"Downtown Champaign" },
  { name:"Blind Pig Brewpub", address:"301 N Neil St",         cat:"Brewery",    price:9, x: 1.0, y: 2.0, subarea:"Downtown Champaign" },
  { name:"Brass Rail",        address:"15 E University Ave",   cat:"Live Music", price:4, x:-3.4, y:-2.4, subarea:"Downtown Champaign" },
  { name:"Tumble Inn Tavern", address:"302 S Neil St",         cat:"Bar & Pub",  price:4, x:-4.2, y:-3.0, subarea:"Downtown Champaign" },
  { name:"Pia's Sports Bar",  address:"1609 W Springfield Ave",cat:"Sports Bar", price:6, x:-1.6, y: 1.2, subarea:"Downtown Champaign" },
  { name:"25 O'Clock Brewing",address:"208 W Griggs St",       cat:"Brewery",    price:8, x: 0.8, y: 0.4, subarea:"Urbana" },
  { name:"The Boom Venue",    address:"1309 E Washington St",  cat:"Live Music", price:4, x:-3.8, y:-2.6, subarea:"Urbana" },
];

// ---------------------------------------------------------------------------
// West Lafayette IN
// ---------------------------------------------------------------------------

const WESTLAFAYETTE_CITY = {
  name: "West Lafayette", state: "IN", subdomain: "westlafayette", status: "live",
  subareas: [
    { label: "Campus / State St", slug: "campus"    },
    { label: "West Lafayette",    slug: "westlaf"   },
    { label: "Lafayette",         slug: "lafayette" },
  ],
  foundedBy: null, createdAt: Timestamp.now(),
};

const WESTLAFAYETTE_VENUES = [
  { name:"Boiler Up Bar",        address:"201 Grant St",                   cat:"Cocktail Bar", price:12, x: 3.4, y: 1.8, subarea:"Campus / State St" },
  { name:"8Eleven Modern Bistro",address:"201 Grant St",                   cat:"Fine Dining",  price:15, x: 4.4, y: 4.6, subarea:"Campus / State St" },
  { name:"The Tap",              address:"100 S Chauncey Ave",             cat:"Bar & Pub",    price:9,  x: 0.6, y: 2.4, subarea:"Campus / State St" },
  { name:"Brothers Bar",         address:"306 W State St",                 cat:"Bar & Pub",    price:5,  x:-2.2, y:-2.8, subarea:"Campus / State St" },
  { name:"Where Else",           address:"308 W State St",                 cat:"Bar & Pub",    price:4,  x:-4.0, y:-4.2, subarea:"Campus / State St" },
  { name:"Walk-On's Bistreaux",  address:"101 Grant St",                   cat:"Sports Bar",   price:10, x: 0.0, y: 2.0, subarea:"Campus / State St" },
  { name:"Nine Irish Brothers",  address:"119 Howard Ave",                 cat:"Bar & Pub",    price:9,  x:-0.4, y: 2.2, subarea:"West Lafayette" },
  { name:"Hunters Pub",          address:"1092 Sagamore Pkwy W",           cat:"Sports Bar",   price:8,  x:-0.8, y: 1.6, subarea:"West Lafayette" },
  { name:"Boilerhouse Prime",    address:"1295 Cherry Ln",                 cat:"Fine Dining",  price:16, x: 4.6, y: 4.6, subarea:"West Lafayette" },
  { name:"6th Street Dive",      address:"827 N 6th St",                   cat:"Bar & Pub",    price:5,  x:-2.6, y: 1.4, subarea:"Lafayette" },
  { name:"The Spot Tavern",      address:"409 S 4th St",                   cat:"Bar & Pub",    price:5,  x:-2.4, y:-1.0, subarea:"Lafayette" },
  { name:"Big League Sports",    address:"140 Frontage Rd",                cat:"Sports Bar",   price:8,  x:-1.0, y: 1.2, subarea:"Lafayette" },
  { name:"End Zone Sports Bar",  address:"2408 Veterans Memorial Pkwy",    cat:"Sports Bar",   price:7,  x:-1.4, y: 0.8, subarea:"Lafayette" },
  { name:"Ripple & Company",     address:"1007 Main St",                   cat:"BBQ",          price:12, x: 2.8, y: 3.4, subarea:"Lafayette" },
  { name:"Aura Craft Bar",       address:"900 Kossuth St",                 cat:"Cocktail Bar", price:12, x: 3.2, y: 2.8, subarea:"Lafayette" },
];

// ---------------------------------------------------------------------------
// Run all seeds
// ---------------------------------------------------------------------------

async function main() {
  // Fix STL duplicate-venue bug (seed was run twice → 84 docs instead of 42)
  await seedCity('stl', STL_CITY, STL_VENUES);

  // Seed remaining cities
  await seedCity('southwestmi',     SOUTHWESTMI_CITY,     SOUTHWESTMI_VENUES);
  await seedCity('chicagonw',       CHICAGONW_CITY,       CHICAGONW_VENUES);
  await seedCity('charleston',      CHARLESTON_CITY,      CHARLESTON_VENUES);
  await seedCity('champaignurbana', CHAMPAIGNURBANA_CITY, CHAMPAIGNURBANA_VENUES);
  await seedCity('westlafayette',   WESTLAFAYETTE_CITY,   WESTLAFAYETTE_VENUES);

  const total = [STL_VENUES, SOUTHWESTMI_VENUES, CHICAGONW_VENUES, CHARLESTON_VENUES,
                 CHAMPAIGNURBANA_VENUES, WESTLAFAYETTE_VENUES].reduce((s, v) => s + v.length, 0);
  console.log(`\nAll done. ${total} venues across 6 cities.`);
  process.exit(0);
}

main().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
