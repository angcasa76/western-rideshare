"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import AddressAutocomplete from "@/components/AddressAutocomplete";
import Navbar from "@/components/Navbar";
import RouteMap from "@/components/RouteMap";

import {
  apiRequest,
} from "@/lib/api";

type Ride = {
  id: number;

  origin: string;
  destination: string;

  origin_lat:
    number | null;

  origin_lon:
    number | null;

  destination_lat:
    number | null;

  destination_lon:
    number | null;

  route_geometry:
    number[][] | null;

  departure_time: string;

  distance_km: number;

  duration_minutes:
    number | null;

  available_seats: number;

  price_per_seat: number;

  status: string;

  driver: {
    id: number;
    name: string;
  };
};

export default function RidesPage() {
  const [
    rides,
    setRides,
  ] =
    useState<Ride[]>([]);

  const [
    origin,
    setOrigin,
  ] = useState("");

  const [
    destination,
    setDestination,
  ] = useState("");

  const [
    rideDate,
    setRideDate,
  ] = useState("");

  const [
    pickupAddresses,
    setPickupAddresses,
  ] =
    useState<
      Record<number, string>
    >({});

  const [
    expandedRide,
    setExpandedRide,
  ] =
    useState<number | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    requestingRide,
    setRequestingRide,
  ] =
    useState<number | null>(
      null
    );

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  async function loadRides(
    searchOrigin = origin,
    searchDestination =
      destination,
    searchDate = rideDate
  ) {
    setLoading(true);
    setError("");

    try {
      const params =
        new URLSearchParams();

      if (
        searchOrigin.trim()
      ) {
        params.set(
          "origin",
          searchOrigin.trim()
        );
      }

      if (
        searchDestination.trim()
      ) {
        params.set(
          "destination",
          searchDestination.trim()
        );
      }

      if (searchDate) {
        params.set(
          "ride_date",
          searchDate
        );
      }

      const query =
        params.toString();

      const data =
        await apiRequest(
          query
            ? `/rides?${query}`
            : "/rides"
        );

      setRides(data);
    } catch (error) {
      if (
        error instanceof Error
      ) {
        setError(
          error.message
        );
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRides(
      "",
      "",
      ""
    );
  }, []);

  async function handleSearch(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");

    await loadRides();
  }

  async function requestRide(
    rideId: number
  ) {
    const pickup =
      pickupAddresses[
        rideId
      ];

    setError("");
    setMessage("");

    if (
      !pickup ||
      !pickup.trim()
    ) {
      setError(
        "Choose your pickup address before requesting the ride."
      );

      return;
    }

    setRequestingRide(
      rideId
    );

    try {
      const data =
        await apiRequest(
          `/rides/${rideId}/request`,
          {
            method: "POST",

            body:
              JSON.stringify({
                pickup_address:
                  pickup,
              }),
          }
        );

      const price =
        data.request
          .quoted_price;

      const detour =
        data.request
          .detour_km;

      setMessage(
        `Ride requested successfully. Estimated fare: $${price.toFixed(
          2
        )}. Driver detour: ${detour} km.`
      );

      await loadRides();
    } catch (error) {
      if (
        error instanceof Error
      ) {
        setError(
          error.message
        );
      }
    } finally {
      setRequestingRide(
        null
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-12">

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4f2683]">
            Passenger
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            Find your next ride.
          </h1>

          <p className="mt-3 max-w-2xl text-lg text-gray-600">
            Browse student rides,
            view the driver's route
            and choose your pickup
            location.
          </p>
        </div>

        <form
          onSubmit={
            handleSearch
          }
          className="mt-8 grid gap-4 rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm md:grid-cols-4"
        >

          <input
            type="text"
            value={origin}
            onChange={(
              event
            ) =>
              setOrigin(
                event.target.value
              )
            }
            placeholder="Search origin"
            className="rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#4f2683] focus:ring-2 focus:ring-purple-100"
          />

          <input
            type="text"
            value={
              destination
            }
            onChange={(
              event
            ) =>
              setDestination(
                event.target.value
              )
            }
            placeholder="Search destination"
            className="rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#4f2683] focus:ring-2 focus:ring-purple-100"
          />

          <input
            type="date"
            value={rideDate}
            onChange={(
              event
            ) =>
              setRideDate(
                event.target.value
              )
            }
            className="rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#4f2683]"
          />

          <button
            type="submit"
            className="rounded-xl bg-[#4f2683] px-5 py-3 font-semibold text-white transition hover:bg-[#35165c]"
          >
            Search Rides
          </button>

        </form>

        {message && (
          <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-10 rounded-3xl border border-gray-200 bg-white p-8 text-gray-500">
            Loading available rides...
          </div>
        ) : (
          <div className="mt-8 space-y-6">

            {rides.length ===
              0 && (
              <div className="rounded-[2rem] border border-gray-200 bg-white p-10 text-center shadow-sm">
                <h2 className="text-2xl font-bold">
                  No rides found
                </h2>

                <p className="mt-2 text-gray-600">
                  Try another route or
                  date.
                </p>
              </div>
            )}

            {rides.map(
              (ride) => {
                const hasMap =
                  Boolean(
                    ride
                      .route_geometry
                      ?.length
                  ) &&
                  ride.origin_lat !=
                    null &&
                  ride.origin_lon !=
                    null &&
                  ride
                    .destination_lat !=
                    null &&
                  ride
                    .destination_lon !=
                    null;

                return (
                  <article
                    key={ride.id}
                    className="overflow-visible rounded-[2rem] border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                  >

                    <div className="p-6 sm:p-8">

                      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-2">

                            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                              AVAILABLE
                            </span>

                            <span className="rounded-full bg-[#f1ebf7] px-3 py-1 text-xs font-semibold text-[#4f2683]">
                              {
                                ride
                                  .available_seats
                              }{" "}
                              SEAT
                              {ride
                                .available_seats !==
                              1
                                ? "S"
                                : ""}
                            </span>

                          </div>

                          <h2 className="mt-5 text-2xl font-bold leading-tight">
                            {
                              ride.origin
                            }
                          </h2>

                          <div className="my-3 ml-2 h-7 border-l-2 border-dashed border-purple-200" />

                          <h2 className="text-2xl font-bold leading-tight">
                            {
                              ride.destination
                            }
                          </h2>

                          <p className="mt-5 text-gray-600">
                            Driver:{" "}
                            <span className="font-semibold text-gray-900">
                              {
                                ride
                                  .driver
                                  .name
                              }
                            </span>
                          </p>

                          <p className="mt-1 text-gray-600">
                            {new Date(
                              ride
                                .departure_time
                            ).toLocaleString()}
                          </p>

                        </div>

                        <div className="grid shrink-0 grid-cols-3 gap-2 lg:w-[330px]">

                          <div className="rounded-2xl bg-gray-50 p-4 text-center">
                            <p className="text-xs font-medium text-gray-500">
                              DISTANCE
                            </p>

                            <p className="mt-1 font-bold">
                              {
                                ride
                                  .distance_km
                              }
                              km
                            </p>
                          </div>

                          <div className="rounded-2xl bg-gray-50 p-4 text-center">
                            <p className="text-xs font-medium text-gray-500">
                              TIME
                            </p>

                            <p className="mt-1 font-bold">
                              {ride
                                .duration_minutes !=
                              null
                                ? `${Math.round(
                                    ride
                                      .duration_minutes
                                  )}m`
                                : "—"}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-[#f1ebf7] p-4 text-center">
                            <p className="text-xs font-semibold text-[#4f2683]">
                              FARE
                            </p>

                            <p className="mt-1 font-bold text-[#4f2683]">
                              $
                              {ride
                                .price_per_seat
                                .toFixed(
                                  2
                                )}
                            </p>
                          </div>

                        </div>

                      </div>

                      {hasMap && (
                        <div className="mt-6">

                          <button
                            type="button"
                            onClick={() =>
                              setExpandedRide(
                                expandedRide ===
                                  ride.id
                                  ? null
                                  : ride.id
                              )
                            }
                            className="rounded-xl border border-gray-300 px-5 py-2.5 font-semibold transition hover:bg-gray-50"
                          >
                            {expandedRide ===
                            ride.id
                              ? "Hide Route"
                              : "View Driver Route"}
                          </button>

                          {expandedRide ===
                            ride.id && (
                            <div className="mt-5">

                              <RouteMap
                                route={
                                  ride
                                    .route_geometry ??
                                  []
                                }
                                origin={{
                                  lat:
                                    ride
                                      .origin_lat!,

                                  lon:
                                    ride
                                      .origin_lon!,

                                  label:
                                    ride
                                      .origin,
                                }}
                                destination={{
                                  lat:
                                    ride
                                      .destination_lat!,

                                  lon:
                                    ride
                                      .destination_lon!,

                                  label:
                                    ride
                                      .destination,
                                }}
                              />

                            </div>
                          )}

                        </div>
                      )}

                    </div>

                    <div className="border-t border-gray-100 bg-gray-50/70 p-6 sm:p-8">

                      <AddressAutocomplete
                        label="Where should the driver pick you up?"
                        value={
                          pickupAddresses[
                            ride.id
                          ] || ""
                        }
                        onChange={(
                          value
                        ) =>
                          setPickupAddresses(
                            (
                              previous
                            ) => ({
                              ...previous,

                              [
                                ride.id
                              ]:
                                value,
                            })
                          )
                        }
                        placeholder="Start typing your pickup address"
                        required
                      />

                      <button
                        type="button"
                        onClick={() =>
                          requestRide(
                            ride.id
                          )
                        }
                        disabled={
                          requestingRide ===
                          ride.id
                        }
                        className="mt-5 w-full rounded-xl bg-[#4f2683] px-6 py-3 font-semibold text-white transition hover:bg-[#35165c] disabled:opacity-50 sm:w-auto"
                      >
                        {requestingRide ===
                        ride.id
                          ? "Calculating Pickup..."
                          : "Request This Ride"}
                      </button>

                    </div>

                  </article>
                );
              }
            )}

          </div>
        )}

      </section>
    </main>
  );
}