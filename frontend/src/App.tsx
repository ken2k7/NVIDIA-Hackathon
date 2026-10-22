import { useEffect, useState } from "react";
import { fetchProject } from "./api";
import type { Project } from "./types";
import "./App.css";

export default function App() {
  // Three pieces of memory (state): the data, whether we're still loading,
  // and any error text. Each starts in its "nothing yet" value.
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Run once, right after the screen first appears: go fetch the project.
  useEffect(() => {
    fetchProject()
      .then((data) => setProject(data)) // success → store the data
      .catch((err) => setError(String(err))) // failure → store the message
      .finally(() => setIsLoading(false)); // either way → stop "loading"
  }, []); // empty [] = only run on first appearance

  // Three different screens depending on what state we're in.
  if (isLoading) return <p className="app">Loading…</p>;
  if (error) return <p className="app">Could not reach the backend: {error}</p>;
  if (!project) return null;

  // The real screen: a heading and a list of the work packages.
  return (
    <main className="app">
      <h1>InfraSync</h1>
      <p>
        Loaded {project.packages.length} work packages across{" "}
        {project.segments.length} segment(s).
      </p>
      <ul>
        {project.packages.map((pkg) => (
          <li key={pkg.id}>
            <strong>{pkg.name}</strong> — {pkg.utility}, {pkg.duration_days} days
          </li>
        ))}
      </ul>
    </main>
  );
}
