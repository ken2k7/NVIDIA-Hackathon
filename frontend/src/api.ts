// All the functions that talk to our backend live here, so components don't
// have to know URLs or fetch details — they just call fetchDistrict().

import type { District } from "./types";

// Read the backend address from .env.local. The "?? ..." gives a fallback
// if the variable is missing, so the app still works out of the box.
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// Ask the backend for the district data. "async" means it does slow network
// work and returns a Promise (a receipt that becomes a District later).
export async function fetchDistrict(): Promise<District> {
  const res = await fetch(`${API_URL}/project`); // send the request, wait for the reply
  if (!res.ok) {
    // res.ok is false for error statuses (404, 500, ...). Turn that into an error.
    throw new Error(`Backend returned ${res.status}`);
  }
  return (await res.json()) as District; // parse the JSON body and trust it matches District
}
