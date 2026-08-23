"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("Connecting to backend...");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/")
      .then((response) => response.json())
      .then((data) => {
        setMessage(data.message);
      })
      .catch(() => {
        setMessage("Could not connect to backend");
      });
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold">
          Western Rideshare
        </h1>

        <p className="mt-4 text-lg">
          Share rides. Save money. Reduce campus traffic.
        </p>

        <p className="mt-8">
          Backend Status: {message}
        </p>
      </div>
    </main>
  );
}