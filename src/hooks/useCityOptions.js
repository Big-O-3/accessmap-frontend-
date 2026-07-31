import { useEffect, useState } from "react";
import { searchVenues } from "../lib/api";

// Distinct city names across all venues, used to power the autocomplete on every
// city search box (home hero, mobile home, the search-page filter). Suggesting
// cities that actually have venues means every pick returns results.
//
// The fetch is cached at module scope: mounting several search boxes triggers a
// single request, shared by all of them. A failed fetch clears the cache so the
// next mount retries rather than caching an empty list forever.
let citiesPromise = null;

function loadCities() {
  if (!citiesPromise) {
    citiesPromise = searchVenues({})
      .then((data) => {
        const set = new Set();
        for (const v of data.venues) {
          if (v.city) set.add(v.city);
        }
        return [...set].sort((a, b) => a.localeCompare(b));
      })
      .catch(() => {
        citiesPromise = null; // allow a retry on the next mount
        return [];
      });
  }
  return citiesPromise;
}

export default function useCityOptions() {
  const [cities, setCities] = useState([]);

  useEffect(() => {
    let alive = true;
    loadCities().then((list) => {
      if (alive) setCities(list);
    });
    return () => {
      alive = false;
    };
  }, []);

  return cities;
}
