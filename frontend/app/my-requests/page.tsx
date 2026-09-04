"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

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


type RideRequest = {
  request_id:
    number;

  status:
    string;

  pickup_address:
    string | null;

  pickup_lat:
    number | null;

  pickup_lon:
    number | null;

  passenger_distance_km:
    number | null;

  detour_km:
    number | null;

  quoted_price:
    number | null;

  passenger_route_geometry:
    number[][] | null;

  route_with_pickup_geometry:
    number[][] | null;

  ride: {
    id:
      number;

    origin:
      string;

    destination:
      string;

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
};


type Rating = {
  id:
    number;

  rated_user_id:
    number;
};


function statusClass(
  status: string
) {

  if (
    status ===
    "accepted"
  ) {
    return (
      "bg-green-100 " +
      "text-green-700"
    );
  }


  if (
    status ===
    "pending"
  ) {
    return (
      "bg-yellow-100 " +
      "text-yellow-700"
    );
  }


  if (
    status ===
      "declined" ||
    status ===
      "cancelled"
  ) {
    return (
      "bg-red-100 " +
      "text-red-700"
    );
  }


  return (
    "bg-gray-100 " +
    "text-gray-700"
  );
}


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


function vehicleLabel(
  vehicle:
    Vehicle | null
) {

  if (
    !vehicle
  ) {
    return (
      "Vehicle information not added yet"
    );
  }


  return (
    [
      vehicle.color,
      vehicle.year,
      vehicle.make,
      vehicle.model,
    ]
      .filter(
        Boolean
      )
      .join(
        " "
      )
  );
}


export default function MyRequestsPage() {
  const [
    requests,
    setRequests,
  ] =
    useState<
      RideRequest[]
    >([]);


  const [
    expandedRequest,
    setExpandedRequest,
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
    message,
    setMessage,
  ] =
    useState("");


  const [
    error,
    setError,
  ] =
    useState("");


  const [
    busyId,
    setBusyId,
  ] =
    useState<
      number | null
    >(null);


  const [
    ratingScores,
    setRatingScores,
  ] =
    useState<
      Record<
        number,
        number
      >
    >({});


  const [
    ratingComments,
    setRatingComments,
  ] =
    useState<
      Record<
        number,
        string
      >
    >({});


  const [
    ratedRideIds,
    setRatedRideIds,
  ] =
    useState<
      Set<number>
    >(
      new Set()
    );


  const loadRequests =
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

          const data:
            RideRequest[] =
            await apiRequest(
              "/my-requests"
            );


          setRequests(
            data
          );


          const completed =
            data.filter(
              (
                request
              ) =>
                request
                  .ride
                  .status ===
                "completed"
            );


          const results =
            await Promise.all(
              completed.map(
                async (
                  request
                ) => {

                  try {

                    const ratings:
                      Rating[] =
                      await apiRequest(
                        `/rides/${request.ride.id}/my-ratings`
                      );


                    return {
                      rideId:
                        request
                          .ride
                          .id,

                      ratedDriver:
                        ratings.some(
                          (
                            rating
                          ) =>
                            rating
                              .rated_user_id ===
                            request
                              .ride
                              .driver
                              .id
                        ),
                    };

                  } catch {

                    return {
                      rideId:
                        request
                          .ride
                          .id,

                      ratedDriver:
                        false,
                    };
                  }
                }
              )
            );


          setRatedRideIds(
            new Set(
              results
                .filter(
                  (
                    item
                  ) =>
                    item
                      .ratedDriver
                )
                .map(
                  (
                    item
                  ) =>
                    item
                      .rideId
                )
            )
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
      []
    );


  useEffect(
    () => {

      loadRequests(
        true
      );


      const interval =
        window.setInterval(
          () =>
            loadRequests(
              false
            ),
          10000
        );


      return () => {

        window.clearInterval(
          interval
        );

      };

    },
    [
      loadRequests,
    ]
  );


  async function cancelRequest(
    requestId:
      number
  ) {

    setMessage(
      ""
    );


    setError(
      ""
    );


    setBusyId(
      requestId
    );


    try {

      await apiRequest(
        `/requests/${requestId}`,
        {
          method:
            "DELETE",
        }
      );


      setMessage(
        "Ride request cancelled."
      );


      await loadRequests(
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

      setBusyId(
        null
      );
    }
  }


  async function rateDriver(
    request:
      RideRequest
  ) {

    const rideId =
      request
        .ride
        .id;


    const score =
      ratingScores[
        rideId
      ] ?? 5;


    const comment =
      ratingComments[
        rideId
      ] ?? "";


    setBusyId(
      request
        .request_id
    );


    setMessage(
      ""
    );


    setError(
      ""
    );


    try {

      await apiRequest(
        `/rides/${rideId}/ratings`,
        {
          method:
            "POST",

          body:
            JSON.stringify({
              rated_user_id:
                request
                  .ride
                  .driver
                  .id,

              score,

              comment:
                comment
                  .trim() ||
                null,
            }),
        }
      );


      setMessage(
        "Driver rating submitted."
      );


      setRatedRideIds(
        (
          previous
        ) => {

          const updated =
            new Set(
              previous
            );


          updated.add(
            rideId
          );


          return updated;
        }
      );


      await loadRequests(
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

      setBusyId(
        null
      );
    }
  }


  return (
    <main className="min-h-screen bg-gray-50">

      <Navbar />


      <section className="mx-auto max-w-6xl px-6 py-12">

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">

          <div>

            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4f2683]">
              Passenger
            </p>


            <h1 className="mt-2 text-4xl font-bold">
              My Ride Requests
            </h1>


            <p className="mt-2 text-gray-600">
              Track requests, driver details, trip progress and ratings.
            </p>

          </div>


          <div className="rounded-2xl border border-purple-100 bg-[#f7f2fb] px-5 py-3 text-sm text-[#4f2683]">
            Status updates automatically every 10 seconds.
          </div>

        </div>


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
                Loading requests...
              </div>
            )

            : (
              <div className="mt-8 space-y-5">

                {
                  requests.length ===
                  0 &&
                  (
                    <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
                      You have not requested any rides yet.
                    </div>
                  )
                }


                {
                  requests.map(
                    (
                      request
                    ) => {

                      const ride =
                        request.ride;


                      const canCancel =
                        [
                          "pending",
                          "accepted",
                        ]
                          .includes(
                            request
                              .status
                          ) &&
                        ride.status ===
                          "active";


                      const showPrivateVehicle =
                        request.status ===
                          "accepted" ||
                        [
                          "in_progress",
                          "completed",
                        ]
                          .includes(
                            ride.status
                          );


                      const rated =
                        ratedRideIds
                          .has(
                            ride.id
                          );


                      return (
                        <article
                          key={
                            request
                              .request_id
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

                            </div>


                            <div className="flex flex-wrap gap-2">

                              <span
                                className={
                                  `rounded-full px-3 py-1 text-xs font-semibold ${
                                    statusClass(
                                      request
                                        .status
                                    )
                                  }`
                                }
                              >
                                Request: {
                                  request.status
                                }
                              </span>


                              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                                Trip: {
                                  ride
                                    .status
                                    .replace(
                                      "_",
                                      " "
                                    )
                                }
                              </span>

                            </div>

                          </div>


                          <div className="mt-5 grid gap-3 sm:grid-cols-4">

                            <div className="rounded-2xl bg-gray-50 p-4">

                              <p className="text-xs text-gray-500">
                                Driver
                              </p>


                              <p className="mt-1 font-bold">
                                {
                                  ride
                                    .driver
                                    .name
                                }
                              </p>


                              <p className="mt-1 text-xs text-gray-500">

                                {
                                  ride
                                    .driver
                                    .rating_average
                                    ? `${
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

                                    : "New driver"
                                }

                              </p>

                            </div>


                            <div className="rounded-2xl bg-gray-50 p-4">

                              <p className="text-xs text-gray-500">
                                Your pickup
                              </p>


                              <p className="mt-1 text-sm font-semibold">
                                {
                                  request
                                    .pickup_address ??
                                  "—"
                                }
                              </p>

                            </div>


                            <div className="rounded-2xl bg-gray-50 p-4">

                              <p className="text-xs text-gray-500">
                                Your trip
                              </p>


                              <p className="mt-1 font-bold">
                                {
                                  request
                                    .passenger_distance_km
                                    ?.toFixed(
                                      1
                                    ) ??
                                  "—"
                                } km
                              </p>

                            </div>


                            <div className="rounded-2xl bg-[#f7f2fb] p-4">

                              <p className="text-xs text-[#4f2683]">
                                Quoted fare
                              </p>


                              <p className="mt-1 font-bold text-[#4f2683]">
                                $
                                {
                                  request
                                    .quoted_price
                                    ?.toFixed(
                                      2
                                    ) ??
                                  "—"
                                }
                              </p>

                            </div>

                          </div>


                          {
                            showPrivateVehicle &&
                            (
                              <div className="mt-5 rounded-2xl border border-purple-100 bg-[#fbf9fd] p-5">

                                <p className="text-xs font-semibold uppercase tracking-wide text-[#4f2683]">
                                  Accepted driver vehicle
                                </p>


                                <p className="mt-2 text-lg font-bold">
                                  {
                                    vehicleLabel(
                                      ride
                                        .driver
                                        .vehicle
                                    )
                                  }
                                </p>


                                {
                                  ride
                                    .driver
                                    .vehicle
                                    ?.license_plate &&
                                  (
                                    <p className="mt-1 text-sm text-gray-600">

                                      Licence plate:{" "}

                                      <span className="font-bold text-gray-950">
                                        {
                                          ride
                                            .driver
                                            .vehicle
                                            .license_plate
                                        }
                                      </span>

                                    </p>
                                  )
                                }

                              </div>
                            )
                          }


                          {
                            ride.status ===
                              "in_progress" &&
                            request.status ===
                              "accepted" &&
                            (
                              <div className="mt-5 rounded-2xl bg-blue-50 p-4 text-sm font-medium text-blue-700">
                                This ride is currently in progress.
                              </div>
                            )
                          }


                          {
                            ride.status ===
                              "cancelled" &&
                            (
                              <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">
                                The driver cancelled this ride.
                              </div>
                            )
                          }


                          <div className="mt-5 flex flex-wrap gap-3">

                            {
                              request
                                .passenger_route_geometry &&
                              (
                                <button
                                  type="button"

                                  onClick={
                                    () =>
                                      setExpandedRequest(
                                        expandedRequest ===
                                        request
                                          .request_id
                                          ? null
                                          : request
                                              .request_id
                                      )
                                  }

                                  className="rounded-xl border border-gray-300 px-4 py-2 font-semibold hover:bg-gray-50"
                                >

                                  {
                                    expandedRequest ===
                                    request
                                      .request_id
                                      ? "Hide Route"
                                      : "View My Route"
                                  }

                                </button>
                              )
                            }


                            {
                              canCancel &&
                              (
                                <button
                                  type="button"

                                  disabled={
                                    busyId ===
                                    request
                                      .request_id
                                  }

                                  onClick={
                                    () => {

                                      if (
                                        window.confirm(
                                          "Cancel this ride request?"
                                        )
                                      ) {
                                        cancelRequest(
                                          request
                                            .request_id
                                        );
                                      }
                                    }
                                  }

                                  className="rounded-xl border border-red-200 px-4 py-2 font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                                >
                                  Cancel Request
                                </button>
                              )
                            }

                          </div>


                          {
                            expandedRequest ===
                              request
                                .request_id &&
                            request
                              .passenger_route_geometry &&
                            (
                              <div className="mt-5">

                                <RouteMap
                                  route={
                                    request
                                      .passenger_route_geometry
                                  }

                                  origin={
                                    request.pickup_lat !==
                                      null &&
                                    request.pickup_lon !==
                                      null
                                      ? {
                                          lat:
                                            request.pickup_lat,

                                          lon:
                                            request.pickup_lon,

                                          label:
                                            request.pickup_address ??
                                            "Pickup",
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

                                  height="320px"
                                />

                              </div>
                            )
                          }


                          {
                            ride.status ===
                              "completed" &&
                            request.status ===
                              "accepted" &&
                            (
                              <div className="mt-6 border-t border-gray-100 pt-5">

                                <h3 className="font-bold">
                                  Rate {
                                    ride
                                      .driver
                                      .name
                                  }
                                </h3>


                                {
                                  rated
                                    ? (
                                      <div className="mt-3 rounded-xl bg-green-50 p-4 text-sm font-medium text-green-700">
                                        You already rated this driver for this trip.
                                      </div>
                                    )

                                    : (
                                      <div className="mt-3 grid gap-3 md:grid-cols-[180px_1fr_auto]">

                                        <select
                                          value={
                                            ratingScores[
                                              ride.id
                                            ] ??
                                            5
                                          }

                                          onChange={(
                                            event
                                          ) =>
                                            setRatingScores(
                                              (
                                                previous
                                              ) => ({
                                                ...previous,

                                                [ride.id]:
                                                  Number(
                                                    event
                                                      .target
                                                      .value
                                                  ),
                                              })
                                            )
                                          }

                                          className="rounded-xl border border-gray-300 bg-white px-4 py-3"
                                        >

                                          <option value={5}>
                                            5 ★ Excellent
                                          </option>

                                          <option value={4}>
                                            4 ★ Good
                                          </option>

                                          <option value={3}>
                                            3 ★ Okay
                                          </option>

                                          <option value={2}>
                                            2 ★ Poor
                                          </option>

                                          <option value={1}>
                                            1 ★ Very poor
                                          </option>

                                        </select>


                                        <input
                                          value={
                                            ratingComments[
                                              ride.id
                                            ] ??
                                            ""
                                          }

                                          onChange={(
                                            event
                                          ) =>
                                            setRatingComments(
                                              (
                                                previous
                                              ) => ({
                                                ...previous,

                                                [ride.id]:
                                                  event
                                                    .target
                                                    .value,
                                              })
                                            )
                                          }

                                          placeholder="Optional comment"

                                          className="rounded-xl border border-gray-300 px-4 py-3"
                                        />


                                        <button
                                          type="button"

                                          disabled={
                                            busyId ===
                                            request
                                              .request_id
                                          }

                                          onClick={
                                            () =>
                                              rateDriver(
                                                request
                                              )
                                          }

                                          className="rounded-xl bg-[#4f2683] px-5 py-3 font-semibold text-white hover:bg-[#35165c] disabled:opacity-50"
                                        >
                                          Submit Rating
                                        </button>

                                      </div>
                                    )
                                }

                              </div>
                            )
                          }

                        </article>
                      );
                    }
                  )
                }

              </div>
            )
        }

      </section>

    </main>
  );
}