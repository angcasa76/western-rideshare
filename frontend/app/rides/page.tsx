"use client";

import { FormEvent, useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";
import Navbar from "@/components/Navbar";

type Ride = {
  id: number;
  origin: string;
  destination: string;
  departure_time: string;
  available_seats: number;
  price_per_seat: number;
  status: string;
  driver: {
    id: number;
    name: string;
  };
};

export default function RidesPage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [rideDate, setRideDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRides(
    searchOrigin = "",
    searchDestination = "",
    searchDate = ""
  ) {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (searchOrigin) {
        params.set("origin", searchOrigin);
      }

      if (searchDestination) {
        params.set("destination", searchDestination);
      }

      if (searchDate) {
        params.set("ride_date", searchDate);
      }

      const query = params.toString();

      const data = await apiRequest(
        query ? `/rides?${query}` : "/rides"
      );

      setRides(data);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Could not load rides");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRides();
  }, []);

  async function handleSearch(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    await loadRides(
      origin,
      destination,
      rideDate
    );
  }

  async function requestRide(rideId: number) {
    try {
      await apiRequest(
        `/rides/${rideId}/request`,
        {
          method: "POST",
        }
      );

      alert("Ride request sent");
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    }
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <Navbar />

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">
            Browse
          </p>

          <h1 className="text-4xl font-bold">
            Find a Ride
          </h1>

          <p className="text-gray-600">
            Search by origin, destination, and date.
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          className="mt-8 grid gap-4 rounded-3xl bg-white p-6 shadow md:grid-cols-4"
        >
          <input
            type="text"
            placeholder="Origin"
            value={origin}
            onChange={(event) =>
              setOrigin(event.target.value)
            }
            className="rounded-xl border px-4 py-3"
          />

          <input
            type="text"
            placeholder="Destination"
            value={destination}
            onChange={(event) =>
              setDestination(event.target.value)
            }
            className="rounded-xl border px-4 py-3"
          />

          <input
            type="date"
            value={rideDate}
            onChange={(event) =>
              setRideDate(event.target.value)
            }
            className="rounded-xl border px-4 py-3"
          />

          <button
            type="submit"
            className="rounded-xl bg-black px-4 py-3 font-semibold text-white"
          >
            Search
          </button>
        </form>

        {error && (
          <div className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="mt-8">
            Loading rides...
          </p>
        ) : (
          <div className="mt-8 grid gap-5">
            {rides.length === 0 && (
              <div className="rounded-3xl bg-white p-8 text-center shadow">
                <h2 className="text-xl font-semibold">
                  No rides found
                </h2>

                <p className="mt-2 text-gray-600">
                  Try changing your search filters.
                </p>
              </div>
            )}

            {rides.map((ride) => (
              <div
                key={ride.id}
                className="rounded-3xl bg-white p-7 shadow"
              >
                <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-bold">
                        {ride.origin}
                        {" → "}
                        {ride.destination}
                      </h2>

                      <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                        {ride.available_seats} seats
                      </span>
                    </div>

                    <p className="mt-3 text-gray-600">
                      {new Date(
                        ride.departure_time
                      ).toLocaleString()}
                    </p>

                    <p className="mt-1 text-gray-600">
                      Driver: {ride.driver.name}
                    </p>

                    <p className="mt-4 text-2xl font-bold">
                      ${ride.price_per_seat.toFixed(2)}
                      <span className="text-sm font-normal text-gray-500">
                        {" / seat"}
                      </span>
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      requestRide(ride.id)
                    }
                    className="rounded-xl bg-black px-6 py-3 font-semibold text-white"
                  >
                    Request Ride
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}