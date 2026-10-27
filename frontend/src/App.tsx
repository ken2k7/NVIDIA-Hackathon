import { useEffect, useState } from "react";
import { fetchDistrict } from "./api";
import type { District } from "./types";
import "./App.css";

export default function App() {
  // Three pieces of memory (state): the data, whether we're still loading,
  // and any error text. Each starts in its "nothing yet" value.
  const [district, setDistrict] = useState<District | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Run once, right after the screen first appears: go fetch the district.
  useEffect(() => {
    fetchDistrict()
      .then((data) => setDistrict(data)) // success → store the data
      .catch((err) => setError(String(err))) // failure → store the message
      .finally(() => setIsLoading(false)); // either way → stop "loading"
  }, []); // empty [] = only run on first appearance

  // Three different screens depending on what state we're in.
  if (isLoading) return <p className="app">Loading…</p>;
  if (error) return <p className="app">Could not reach the backend: {error}</p>;
  if (!district) return null;

  // The real screen: a heading and a list of the projects.
  return (
    <main className="app">
      <h1>InfraSync</h1>
      <p>
        Loaded {district.projects.length} projects across{" "}
        {district.segments.length} segment(s).
      </p>
      <ul>
        {district.projects.map((proj) => (
          <li key={proj.id}>
            <strong>{proj.name}</strong> — {proj.utility}, {proj.duration_days} days
          </li>
        ))}
      </ul>
    </main>
  );
}
