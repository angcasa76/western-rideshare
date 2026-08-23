"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { apiRequest } from "@/lib/api";
import Navbar from "@/components/Navbar";

export default function CreateRidePage() {
  const router = useRouter();

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [availableSeats, setAvailableSeats] = useState(1);
  const [pricePerSeat, setPricePerSeat] = useState(0);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      await apiRequest("/rides", {
        method: "POST",
        body: JSON.stringify({
          origin,
          destination,
          departure_time: departureTime,
          available_seats: availableSeats,
          price_per_seat: pricePerSeat,
        }),
      });

      router.push("/driver");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Could not create ride");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <Navbar />

      <section className="mx-auto max-w-2xl px-6 py-12">
        <div className="rounded-2xl bg-white p-8 shadow">
          <h1 className="text-3xl font-bold">
            Offer a Ride
          </h1>

          <p className="mt-2 text-gray-600">
            Enter your trip details below.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >
            <div>
              <label className="block text-sm font-medium">
                Origin
              </label>

              <input
                type="text"
                value={origin}
                onChange={(event) =>
                  setOrigin(event.target.value)
                }
                placeholder="Example: Brantford, Ontario"
                required
                className="mt-1 w-full rounded-lg border px-4 py-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">
                Destination
              </label>

              <input
                type="text"
                value={destination}
                onChange={(event) =>
                  setDestination(event.target.value)
                }
                placeholder="Example: Western University"
                required
                className="mt-1 w-full rounded-lg border px-4 py-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">
                Departure
              </label>

              <input
                type="datetime-local"
                value={departureTime}
                onChange={(event) =>
                  setDepartureTime(event.target.value)
                }
                required
                className="mt-1 w-full rounded-lg border px-4 py-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">
                Available Seats
              </label>

              <input
                type="number"
                min="1"
                max="8"
                value={availableSeats}
                onChange={(event) =>
                  setAvailableSeats(
                    Number(event.target.value)
                  )
                }
                required
                className="mt-1 w-full rounded-lg border px-4 py-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">
                Price Per Seat
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={pricePerSeat}
                onChange={(event) =>
                  setPricePerSeat(
                    Number(event.target.value)
                  )
                }
                required
                className="mt-1 w-full rounded-lg border px-4 py-3"
              />
            </div>

            {error && (
              <p className="text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-black px-5 py-3 font-semibold text-white"
            >
              {loading
                ? "Creating ride..."
                : "Create Ride"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}