"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import AddressAutocomplete from "@/components/AddressAutocomplete";
import Navbar from "@/components/Navbar";
import RouteMap from "@/components/RouteMap";

import {
  apiRequest,
} from "@/lib/api";

type RoutePreview = {
  origin: {
    display_name: string;
    lat: number;
    lon: number;
  };

  destination: {
    display_name: string;
    lat: number;
    lon: number;
  };

  distance_km: number;

  duration_minutes: number;

  route_geometry: number[][];

  price_per_seat: number;
};

export default function CreateRidePage() {
  const router = useRouter();

  const [
    origin,
    setOrigin,
  ] = useState("");

  const [
    destination,
    setDestination,
  ] = useState("");

  const [
    departureTime,
    setDepartureTime,
  ] = useState("");

  const [
    availableSeats,
    setAvailableSeats,
  ] = useState(1);

  const [
    preview,
    setPreview,
  ] =
    useState<RoutePreview | null>(
      null
    );

  const [
    calculating,
    setCalculating,
  ] = useState(false);

  const [
    creating,
    setCreating,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  async function calculateRoute() {
    setError("");
    setPreview(null);

    if (
      !origin.trim() ||
      !destination.trim()
    ) {
      setError(
        "Select both your starting address and destination."
      );

      return;
    }

    setCalculating(true);

    try {
      const data =
        await apiRequest(
          "/route-preview",
          {
            method: "POST",

            body: JSON.stringify({
              origin,
              destination,
            }),
          }
        );

      setPreview(data);
    } catch (error) {
      if (
        error instanceof Error
      ) {
        setError(
          error.message
        );
      }
    } finally {
      setCalculating(false);
    }
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!preview) {
      setError(
        "Calculate your route before posting the ride."
      );

      return;
    }

    setCreating(true);

    try {
      await apiRequest(
        "/rides",
        {
          method: "POST",

          body: JSON.stringify({
            origin,
            destination,

            departure_time:
              departureTime,

            available_seats:
              availableSeats,
          }),
        }
      );

      router.push(
        "/driver"
      );
    } catch (error) {
      if (
        error instanceof Error
      ) {
        setError(
          error.message
        );
      }
    } finally {
      setCreating(false);
    }
  }

  function updateOrigin(
    value: string
  ) {
    setOrigin(value);
    setPreview(null);
  }

  function updateDestination(
    value: string
  ) {
    setDestination(value);
    setPreview(null);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-12">

        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4f2683]">
            Driver
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            Where are you driving?
          </h1>

          <p className="mt-3 text-lg text-gray-600">
            Choose your route and
            Western Rideshare will
            calculate the distance,
            driving time and passenger
            fare automatically.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-9 space-y-7"
        >

          <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">

            <div className="grid gap-6 md:grid-cols-2">

              <AddressAutocomplete
                label="Starting Address"
                value={origin}
                onChange={
                  updateOrigin
                }
                placeholder="Start typing your address"
                required
              />

              <AddressAutocomplete
                label="Destination"
                value={
                  destination
                }
                onChange={
                  updateDestination
                }
                placeholder="Example: Western University"
                required
              />

            </div>

            <button
              type="button"
              onClick={
                calculateRoute
              }
              disabled={
                calculating
              }
              className="mt-7 rounded-xl bg-[#4f2683] px-7 py-3 font-semibold text-white shadow-sm transition hover:bg-[#35165c] disabled:opacity-50"
            >
              {calculating
                ? "Calculating Route..."
                : "Calculate Route"}
            </button>

          </div>

          {preview && (
            <div className="space-y-5">

              <RouteMap
                route={
                  preview
                    .route_geometry
                }
                origin={{
                  lat:
                    preview
                      .origin
                      .lat,

                  lon:
                    preview
                      .origin
                      .lon,

                  label:
                    preview
                      .origin
                      .display_name,
                }}
                destination={{
                  lat:
                    preview
                      .destination
                      .lat,

                  lon:
                    preview
                      .destination
                      .lon,

                  label:
                    preview
                      .destination
                      .display_name,
                }}
                height="430px"
              />

              <div className="grid gap-4 sm:grid-cols-3">

                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">
                    Distance
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    {
                      preview
                        .distance_km
                    }{" "}
                    km
                  </p>
                </div>

                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">
                    Estimated Drive
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    {Math.round(
                      preview
                        .duration_minutes
                    )}{" "}
                    min
                  </p>
                </div>

                <div className="rounded-3xl border border-purple-100 bg-[#f1ebf7] p-6">
                  <p className="text-sm font-semibold text-[#4f2683]">
                    Passenger Fare
                  </p>

                  <p className="mt-2 text-3xl font-bold text-[#4f2683]">
                    $
                    {preview
                      .price_per_seat
                      .toFixed(2)}
                  </p>

                  <p className="mt-1 text-xs text-purple-700">
                    per seat
                  </p>
                </div>

              </div>

            </div>
          )}

          <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">

            <h2 className="text-2xl font-bold">
              Trip Details
            </h2>

            <div className="mt-6 grid gap-6 md:grid-cols-2">

              <div>
                <label className="text-sm font-semibold">
                  Departure
                </label>

                <input
                  type="datetime-local"
                  value={
                    departureTime
                  }
                  onChange={(
                    event
                  ) =>
                    setDepartureTime(
                      event.target.value
                    )
                  }
                  required
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#4f2683] focus:ring-2 focus:ring-purple-100"
                />
              </div>

              <div>
                <label className="text-sm font-semibold">
                  Available Seats
                </label>

                <input
                  type="number"
                  min="1"
                  max="8"
                  value={
                    availableSeats
                  }
                  onChange={(
                    event
                  ) =>
                    setAvailableSeats(
                      Number(
                        event.target
                          .value
                      )
                    )
                  }
                  required
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#4f2683] focus:ring-2 focus:ring-purple-100"
                />
              </div>

            </div>

            {error && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                {error}
              </div>
            )}

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">

              <button
                type="submit"
                disabled={
                  creating ||
                  !preview
                }
                className="flex-1 rounded-xl bg-[#4f2683] px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-[#35165c] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating
                  ? "Posting Ride..."
                  : "Post Ride"}
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/dashboard"
                  )
                }
                className="rounded-xl border border-gray-300 px-6 py-3 font-semibold transition hover:bg-gray-50"
              >
                Cancel
              </button>

            </div>

          </div>

        </form>

      </section>
    </main>
  );
}