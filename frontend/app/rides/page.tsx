"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import AddressAutocomplete from "@/components/AddressAutocomplete";
import Navbar from "@/components/Navbar";
import RouteMap from "@/components/RouteMap";

import {
  apiRequest,
} from "@/lib/api";


type Vehicle = {
  year:
    number | null;

  make:
    string | null;

  model:
    string | null;

  color:
    string | null;

  license_plate:
    string | null;
};


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

  departure_time:
    string;

  distance_km:
    number;

  duration_minutes:
    number | null;

  available_seats:
    number;

  total_seats:
    number;

  price_per_seat:
    number;

  status:
    string;

  driver: {
    id:
      number;

    name:
      string;

    rating_average:
      number | null;

    rating_count:
      number;

    vehicle:
      Vehicle | null;
  };
};


function prettyDate(
  value: string
) {
  return (
    new Date(
      value
    )
      .toLocaleString(
        [],
        {
          month:
            "short",

          day:
            "numeric",

          year:
            "numeric",

          hour:
            "numeric",

          minute:
            "2-digit",
        }
      )
  );
}


export default function RidesPage() {
  const [
    rides,
    setRides,
  ] =
    useState<Ride[]>(
      []
    );


  const [
    origin,
    setOrigin,
  ] =
    useState("");


  const [
    destination,
    setDestination,
  ] =
    useState("");


  const [
    rideDate,
    setRideDate,
  ] =
    useState("");


  const [
    pickupAddresses,
    setPickupAddresses,
  ] =
    useState<
      Record<
        number,
        string
      >
    >({});


  const [
    expandedRide,
    setExpandedRide,
  ] =
    useState<
      number | null
    >(null);


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    requestingRide,
    setRequestingRide,
  ] =
    useState<
      number | null
    >(null);


  const [
    message,
    setMessage,
  ] =
    useState("");


  const [
    error,
    setError,
  ] =
    useState("");


  const loadRides =
    useCallback(
      async (
        showLoader = false
      ) => {

        if (
          showLoader
        ) {
          setLoading(
            true
          );
        }


        try {

          const params =
            new URLSearchParams();


          if (
            origin.trim()
          ) {
            params.set(
              "origin",
              origin.trim()
            );
          }


          if (
            destination.trim()
          ) {
            params.set(
              "destination",
              destination.trim()
            );
          }


          if (
            rideDate
          ) {
            params.set(
              "ride_date",
              rideDate
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


          setRides(
            data
          );

        } catch (
          error
        ) {

          if (
            error instanceof Error
          ) {
            setError(
              error.message
            );
          }

        } finally {

          if (
            showLoader
          ) {
            setLoading(
              false
            );
          }
        }
      },
      [
        origin,
        destination,
        rideDate,
      ]
    );


  useEffect(
    () => {

      loadRides(
        true
      );

    },
    [
      loadRides,
    ]
  );


  useEffect(
    () => {

      const interval =
        window.setInterval(
          () => {

            loadRides(
              false
            );

          },
          10000
        );


      return () => {

        window.clearInterval(
          interval
        );

      };

    },
    [
      loadRides,
    ]
  );


  async function handleSearch(
    event:
      FormEvent<HTMLFormElement>
  ) {

    event.preventDefault();


    setMessage(
      ""
    );


    setError(
      ""
    );


    await loadRides(
      true
    );
  }


  async function requestRide(
    rideId: number
  ) {

    const pickup =
      pickupAddresses[
        rideId
      ]?.trim();


    setMessage(
      ""
    );


    setError(
      ""
    );


    if (
      !pickup
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

      await apiRequest(
        `/rides/${rideId}/request`,
        {
          method:
            "POST",

          body:
            JSON.stringify({
              pickup_address:
                pickup,
            }),
        }
      );


      setMessage(
        "Ride request sent to the driver."
      );


      setPickupAddresses(
        (
          previous
        ) => ({
          ...previous,

          [rideId]:
            "",
        })
      );


      await loadRides(
        false
      );

    } catch (
      error
    ) {

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
    <main className="min-h-screen bg-gray-50">

      <Navbar />


      <section className="mx-auto max-w-7xl px-6 py-12">

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">

          <div>

            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4f2683]">
              Passenger
            </p>


            <h1 className="mt-2 text-4xl font-bold">
              Find a Ride
            </h1>


            <p className="mt-2 text-gray-600">
              Western Rideshare only accepts locations within 30 km of Western University.
            </p>

          </div>


          <div className="rounded-2xl border border-purple-100 bg-[#f7f2fb] px-5 py-3 text-sm text-[#4f2683]">
            Available seats refresh every 10 seconds.
          </div>

        </div>


        <form
          onSubmit={
            handleSearch
          }

          className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
        >

          <div className="grid gap-5 lg:grid-cols-[1fr_1fr_200px_auto] lg:items-end">

            <AddressAutocomplete
              label="Starting area"

              value={
                origin
              }

              onChange={
                setOrigin
              }

              placeholder="e.g. Masonville"
            />


            <AddressAutocomplete
              label="Destination"

              value={
                destination
              }

              onChange={
                setDestination
              }

              placeholder="e.g. Western University"
            />


            <div>

              <label className="block text-sm font-semibold text-gray-900">
                Date
              </label>


              <input
                type="date"

                value={
                  rideDate
                }

                onChange={(
                  event
                ) =>
                  setRideDate(
                    event
                      .target
                      .value
                  )
                }

                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#4f2683]"
              />

            </div>


            <button
              type="submit"

              className="rounded-xl bg-[#4f2683] px-6 py-3 font-semibold text-white hover:bg-[#35165c]"
            >
              Search
            </button>

          </div>

        </form>


        {
          message &&
          (
            <div className="mt-6 rounded-2xl bg-green-50 p-4 text-green-700">
              {message}
            </div>
          )
        }


        {
          error &&
          (
            <div className="mt-6 rounded-2xl bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )
        }


        {
          loading
            ? (
              <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-8">
                Loading rides...
              </div>
            )

            : (
              <div className="mt-8 space-y-5">

                {
                  rides.length ===
                  0 &&
                  (
                    <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
                      No available rides match your search.
                    </div>
                  )
                }


                {
                  rides.map(
                    (
                      ride
                    ) => (

                      <article
                        key={
                          ride.id
                        }

                        className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
                      >

                        <div className="flex flex-wrap items-start justify-between gap-4">

                          <div>

                            <h2 className="text-xl font-bold">

                              {
                                ride
                                  .origin
                                  .split(
                                    ","
                                  )[0]
                              }

                              {" → "}

                              {
                                ride
                                  .destination
                                  .split(
                                    ","
                                  )[0]
                              }

                            </h2>


                            <p className="mt-1 text-sm text-gray-500">
                              {
                                prettyDate(
                                  ride
                                    .departure_time
                                )
                              }
                            </p>


                            <p className="mt-2 text-sm text-gray-600">

                              Driver:{" "}

                              <span className="font-semibold text-gray-950">
                                {
                                  ride
                                    .driver
                                    .name
                                }
                              </span>


                              {
                                ride
                                  .driver
                                  .rating_average
                                  ? ` · ${
                                      ride
                                        .driver
                                        .rating_average
                                        .toFixed(
                                          1
                                        )
                                    } ★ (${
                                      ride
                                        .driver
                                        .rating_count
                                    })`

                                  : " · New driver"
                              }

                            </p>

                          </div>


                          <div className="rounded-2xl bg-[#f7f2fb] px-5 py-3 text-right">

                            <p className="text-xs text-[#4f2683]">
                              Price per seat
                            </p>


                            <p className="text-2xl font-bold text-[#4f2683]">
                              $
                              {
                                ride
                                  .price_per_seat
                                  .toFixed(
                                    2
                                  )
                              }
                            </p>

                          </div>

                        </div>


                        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">

                          <div className="rounded-2xl bg-gray-50 p-4">

                            <p className="text-xs text-gray-500">
                              Distance
                            </p>

                            <p className="mt-1 font-bold">
                              {
                                ride
                                  .distance_km
                                  .toFixed(
                                    1
                                  )
                              } km
                            </p>

                          </div>


                          <div className="rounded-2xl bg-gray-50 p-4">

                            <p className="text-xs text-gray-500">
                              Drive time
                            </p>

                            <p className="mt-1 font-bold">
                              {
                                Math.round(
                                  ride
                                    .duration_minutes ??
                                  0
                                )
                              } min
                            </p>

                          </div>


                          <div className="rounded-2xl bg-gray-50 p-4">

                            <p className="text-xs text-gray-500">
                              Seats available
                            </p>

                            <p className="mt-1 font-bold">
                              {
                                ride
                                  .available_seats
                              }
                              {" / "}
                              {
                                ride
                                  .total_seats
                              }
                            </p>

                          </div>


                          <div className="rounded-2xl bg-gray-50 p-4">

                            <p className="text-xs text-gray-500">
                              Vehicle
                            </p>

                            <p className="mt-1 text-sm font-semibold">

                              {
                                ride
                                  .driver
                                  .vehicle
                                  ? [
                                      ride
                                        .driver
                                        .vehicle
                                        .color,

                                      ride
                                        .driver
                                        .vehicle
                                        .year,

                                      ride
                                        .driver
                                        .vehicle
                                        .make,

                                      ride
                                        .driver
                                        .vehicle
                                        .model,
                                    ]
                                      .filter(
                                        Boolean
                                      )
                                      .join(
                                        " "
                                      )

                                  : "Not added"
                              }

                            </p>

                          </div>

                        </div>


                        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">

                          <AddressAutocomplete
                            label="Your pickup address"

                            value={
                              pickupAddresses[
                                ride.id
                              ] ??
                              ""
                            }

                            onChange={(
                              value
                            ) =>
                              setPickupAddresses(
                                (
                                  previous
                                ) => ({
                                  ...previous,

                                  [ride.id]:
                                    value,
                                })
                              )
                            }

                            placeholder="Where should the driver pick you up?"
                          />


                          <div className="flex flex-wrap gap-3">

                            <button
                              type="button"

                              onClick={
                                () =>
                                  setExpandedRide(
                                    expandedRide ===
                                    ride.id
                                      ? null
                                      : ride.id
                                  )
                              }

                              className="rounded-xl border border-gray-300 px-4 py-3 font-semibold hover:bg-gray-50"
                            >

                              {
                                expandedRide ===
                                ride.id
                                  ? "Hide Route"
                                  : "View Route"
                              }

                            </button>


                            <button
                              type="button"

                              disabled={
                                requestingRide ===
                                ride.id ||
                                ride.available_seats <=
                                0
                              }

                              onClick={
                                () =>
                                  requestRide(
                                    ride.id
                                  )
                              }

                              className="rounded-xl bg-[#4f2683] px-5 py-3 font-semibold text-white hover:bg-[#35165c] disabled:cursor-not-allowed disabled:opacity-50"
                            >

                              {
                                requestingRide ===
                                ride.id
                                  ? "Requesting..."
                                  : "Request Ride"
                              }

                            </button>

                          </div>

                        </div>


                        {
                          expandedRide ===
                            ride.id &&
                          ride.route_geometry &&
                          (
                            <div className="mt-5">

                              <RouteMap
                                route={
                                  ride
                                    .route_geometry
                                }

                                origin={
                                  ride.origin_lat !==
                                    null &&
                                  ride.origin_lon !==
                                    null
                                    ? {
                                        lat:
                                          ride.origin_lat,

                                        lon:
                                          ride.origin_lon,

                                        label:
                                          ride.origin,
                                      }
                                    : null
                                }

                                destination={
                                  ride.destination_lat !==
                                    null &&
                                  ride.destination_lon !==
                                    null
                                    ? {
                                        lat:
                                          ride.destination_lat,

                                        lon:
                                          ride.destination_lon,

                                        label:
                                          ride.destination,
                                      }
                                    : null
                                }

                                height="340px"
                              />

                            </div>
                          )
                        }

                      </article>

                    )
                  )
                }

              </div>
            )
        }

      </section>

    </main>
  );
}