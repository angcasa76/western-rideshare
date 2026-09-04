"use client";

import { useEffect, useState } from "react";

import Navbar from "@/components/Navbar";
import { apiRequest } from "@/lib/api";

type ImpactData = {
  shared_rides: number;
  accepted_passengers: number;
  estimated_vehicles_avoided: number;
};

export default function ImpactPage() {
  const [impact, setImpact] =
    useState<ImpactData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    async function loadImpact() {
      try {
        const data = await apiRequest("/impact");

        setImpact(data);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        }
      } finally {
        setLoading(false);
      }
    }

    loadImpact();
  }, []);

  return (
    <main className="min-h-screen">
      <Navbar />

      <section className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4f2683]">
          Sustainability
        </p>

        <h1 className="mt-2 text-4xl font-bold">
          Your Rideshare Impact
        </h1>

        <p className="mt-3 max-w-2xl text-gray-600">
          See how shared rides can reduce the number of
          single-occupancy vehicles travelling to campus.
        </p>

        {loading && (
          <p className="mt-10 text-gray-500">
            Loading impact...
          </p>
        )}

        {error && (
          <div className="mt-8 rounded-xl bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {impact && (
          <>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                  Shared Rides
                </p>

                <p className="mt-4 text-5xl font-bold text-[#4f2683]">
                  {impact.shared_rides}
                </p>

                <p className="mt-3 text-gray-600">
                  Rides where at least one passenger was
                  accepted.
                </p>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                  Passengers Matched
                </p>

                <p className="mt-4 text-5xl font-bold text-[#4f2683]">
                  {impact.accepted_passengers}
                </p>

                <p className="mt-3 text-gray-600">
                  Passenger requests successfully accepted
                  by drivers.
                </p>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                  Vehicles Avoided
                </p>

                <p className="mt-4 text-5xl font-bold text-[#4f2683]">
                  {impact.estimated_vehicles_avoided}
                </p>

                <p className="mt-3 text-gray-600">
                  Estimated potential solo vehicle trips
                  avoided through ridesharing.
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-3xl bg-[#4f2683] p-8 text-white">
              <h2 className="text-2xl font-bold">
                How is this calculated?
              </h2>

              <p className="mt-3 max-w-3xl leading-7 text-purple-100">
                Each accepted passenger is counted as one
                potentially avoided single-occupancy vehicle
                trip. This estimate is intended to illustrate
                the potential transportation impact of
                ridesharing.
              </p>
            </div>
          </>
        )}
      </section>
    </main>
  );
}