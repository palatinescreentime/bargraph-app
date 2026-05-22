import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export const CATEGORIES = {
  "Bar & Pub":     { color: "#a78bfa" },
  "Sports Bar":    { color: "#60a5fa" },
  "Live Music":    { color: "#e879f9" },
  "Brewery":       { color: "#fb923c" },
  "Cocktail Bar":  { color: "#f472b6" },
  "American":      { color: "#fbbf24" },
  "Italian":       { color: "#34d399" },
  "Fine Dining":   { color: "#e06b6b" },
  "Rooftop Bar":   { color: "#4ab8e8" },
  "Wine Bar":      { color: "#ec4899" },
  "Southern":      { color: "#f59e0b" },
  "Seafood":       { color: "#22d3ee" },
  "Distillery":    { color: "#f97316" },
  "BBQ":           { color: "#ef4444" },
  "Pizza":         { color: "#f43f5e" },
  "Mexican":       { color: "#f97316" },
  "German":        { color: "#94a3b8" },
  "Sushi & Asian": { color: "#22d3ee" },
  "International": { color: "#c084fc" },
  "Casino":        { color: "#facc15" },
  "Steakhouse":    { color: "#94a3b8" },
};

export function useCity(subdomain) {
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    if (!subdomain) {
      setState({ loading: false, notFound: true });
      return;
    }

    async function fetchCity() {
      try {
        const cityRef = doc(db, 'cities', subdomain);
        const citySnap = await getDoc(cityRef);

        if (!citySnap.exists()) {
          setState({ loading: false, notFound: true });
          return;
        }

        const city = { id: citySnap.id, ...citySnap.data() };

        if (city.status === 'pending') {
          setState({ loading: false, pending: true, city });
          return;
        }

        if (city.status !== 'live') {
          setState({ loading: false, notFound: true });
          return;
        }

        const venuesRef = collection(db, 'cities', subdomain, 'venues');
        const venuesQuery = query(venuesRef, where('status', '==', 'live'));
        const venuesSnap = await getDocs(venuesQuery);
        const venues = venuesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        setState({ loading: false, city, venues, categories: CATEGORIES });
      } catch (err) {
        setState({ loading: false, error: err.message });
      }
    }

    fetchCity();
  }, [subdomain]);

  return state;
}
