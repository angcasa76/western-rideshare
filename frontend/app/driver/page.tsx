"use client";

import {
  useCallback,
  useEffect,
  useMemo,
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


type Ride = {
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

  started_at:
    string | null;

  completed_at:
    string | null;

  cancelled_at:
    string | null;

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


type DriverRequest = {
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

  route_with_pickup_geometry:
    number[][] | null;

  passenger_route_geometry:
    number[][] | null;

  passenger: {
    id:
      number;

    name:
      string;

    email:
      string;

    rating_average:
      number | null;

    rating_count:
      number;
  };

  ride:
    Ride;
};


type Rating = {
  id:
    number;

  rated_user_id:
    number;
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


function shortAddress(
  value: string
) {

  return (
    value
      .split(
        ","
      )
      .slice(
        0,
        2
      )
      .join(
        ","
      )
  );
}


function rideStatusClass(
  status: string
) {

  if (
    status ===
    "active"
  ) {
    return (
      "bg-green-100 " +
      "text-green-700"
    );
  }


  if (
    status ===
    "in_progress"
  ) {
    return (
      "bg-blue-100 " +
      "text-blue-700"
    );
  }


  if (
    status ===
    "completed"
  ) {
    return (
      "bg-purple-100 " +
      "text-[#4f2683]"
    );
  }


  return (
    "bg-gray-100 " +
    "text-gray-700"
  );
}


function requestStatusClass(
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


export default function DriverPage() {
  const [
    rides,
    setRides,
  ] =
    useState<Ride[]>(
      []
    );


  const [
    requests,
    setRequests,
  ] =
    useState<
      DriverRequest[]
    >([]);


  const [
    expandedRide,
    setExpandedRide,
  ] =
    useState<
      number | null
    >(null);


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
      string | null
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
    ratedPairs,
    setRatedPairs,
  ] =
    useState<
      Set<string>
    >(
      new Set()
    );


  const loadData =
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

          const [
            ridesData,
            requestsData,
          ] =
            await Promise.all(
              [
                apiRequest(
                  "/my-rides"
                ),

                apiRequest(
                  "/driver/requests"
                ),
              ]
            );


          setRides(
            ridesData
          );


          setRequests(
            requestsData
          );


          const completedRideIds =
            (
              ridesData as
              Ride[]
            )
              .filter(
                (
                  ride
                ) =>
                  ride.status ===
                  "completed"
              )
              .map(
                (
                  ride
                ) =>
                  ride.id
              );


          const ratingResponses =
            await Promise.all(
              completedRideIds.map(
                async (
                  rideId
                ) => {

                  try {

                    const ratings:
                      Rating[] =
                      await apiRequest(
                        `/rides/${rideId}/my-ratings`
                      );


                    return {
                      rideId,
                      ratings,
                    };

                  } catch {

                    return {
                      rideId,
                      ratings:
                        [] as Rating[],
                    };
                  }
                }
              )
            );


          const pairs =
            new Set<string>();


          ratingResponses
            .forEach(
              (
                {
                  rideId,
                  ratings,
                }
              ) => {

                ratings.forEach(
                  (
                    rating
                  ) => {

                    pairs.add(
                      `${rideId}:${rating.rated_user_id}`
                    );

                  }
                );
              }
            );


          setRatedPairs(
            pairs
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

      loadData(
        true
      );


      const interval =
        window.setInterval(
          () =>
            loadData(
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
      loadData,
    ]
  );


  const activeRides =
    useMemo(
      () =>
        rides.filter(
          (
            ride
          ) =>
            [
              "active",
              "in_progress",
            ]
              .includes(
                ride.status
              )
        ),
      [
        rides,
      ]
    );


  const archivedRides =
    useMemo(
      () =>
        rides.filter(
          (
            ride
          ) =>
            [
              "completed",
              "cancelled",
            ]
              .includes(
                ride.status
              )
        ),
      [
        rides,
      ]
    );


  const currentRequests =
    useMemo(
      () =>
        requests.filter(
          (
            request
          ) =>
            [
              "active",
              "in_progress",
            ]
              .includes(
                request
                  .ride
                  .status
              )
        ),
      [
        requests,
      ]
    );


  async function runAction(
    key:
      string,

    endpoint:
      string,

    method =
      "POST",

    success:
      string
  ) {

    setMessage(
      ""
    );


    setError(
      ""
    );


    setBusyId(
      key
    );


    try {

      await apiRequest(
        endpoint,
        {
          method,
        }
      );


      setMessage(
        success
      );


      await loadData(
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


  async function submitRating(
    rideId:
      number,

    passengerId:
      number
  ) {

    const score =
      ratingScores[
        passengerId
      ] ?? 5;


    const comment =
      ratingComments[
        passengerId
      ] ?? "";


    const key =
      `${rideId}:${passengerId}`;


    setBusyId(
      `rating-${key}`
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
                passengerId,

              score,

              comment:
                comment
                  .trim() ||
                null,
            }),
        }
      );


      setMessage(
        "Passenger rating submitted."
      );


      setRatedPairs(
        (
          previous
        ) => {

          const updated =
            new Set(
              previous
            );


          updated.add(
            key
          );


          return updated;
        }
      );


      await loadData(
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


  function requestsForRide(
    rideId:
      number
  ) {

    return (
      requests.filter(
        (
          request
        ) =>
          request
            .ride
            .id ===
          rideId
      )
    );
  }


  return (
    <main className="min-h-screen bg-gray-50">

      <Navbar />


      <section className="mx-auto max-w-7xl px-6 py-10">

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">

          <div>

            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4f2683]">
              Driver
            </p>


            <h1 className="mt-2 text-4xl font-bold text-gray-950">
              Driver Dashboard
            </h1>


            <p className="mt-2 text-gray-600">
              Manage rides, passenger requests, trip status and ratings.
            </p>

          </div>


          <div className="rounded-2xl border border-purple-100 bg-[#f7f2fb] px-5 py-3 text-sm text-[#4f2683]">
            Seats and requests refresh automatically every 10 seconds.
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
                Loading dashboard...
              </div>
            )

            : (
              <>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">

                  <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">

                    <p className="text-sm text-gray-500">
                      Active rides
                    </p>


                    <p className="mt-2 text-3xl font-bold">
                      {
                        activeRides.length
                      }
                    </p>

                  </div>


                  <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">

                    <p className="text-sm text-gray-500">
                      Pending requests
                    </p>


                    <p className="mt-2 text-3xl font-bold">

                      {
                        currentRequests
                          .filter(
                            (
                              request
                            ) =>
                              request
                                .status ===
                              "pending"
                          )
                          .length
                      }

                    </p>

                  </div>


                  <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">

                    <p className="text-sm text-gray-500">
                      Archived rides
                    </p>


                    <p className="mt-2 text-3xl font-bold">
                      {
                        archivedRides.length
                      }
                    </p>

                  </div>

                </div>


                <div className="mt-10 grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">

                  <div>

                    <h2 className="text-2xl font-bold">
                      My Active Rides
                    </h2>


                    <div className="mt-4 space-y-5">

                      {
                        activeRides.length ===
                        0 &&
                        (
                          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-8 text-gray-500">
                            You do not have any active rides.
                          </div>
                        )
                      }


                      {
                        activeRides.map(
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

                                  <h3 className="text-xl font-bold">

                                    {
                                      shortAddress(
                                        ride.origin
                                      )
                                    }

                                    {" → "}

                                    {
                                      shortAddress(
                                        ride.destination
                                      )
                                    }

                                  </h3>


                                  <p className="mt-1 text-sm text-gray-500">
                                    {
                                      prettyDate(
                                        ride
                                          .departure_time
                                      )
                                    }
                                  </p>

                                </div>


                                <span
                                  className={
                                    `rounded-full px-3 py-1 text-xs font-semibold ${
                                      rideStatusClass(
                                        ride.status
                                      )
                                    }`
                                  }
                                >

                                  {
                                    ride
                                      .status
                                      .replace(
                                        "_",
                                        " "
                                      )
                                  }

                                </span>

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
                                    Seats left
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
                                    Price / seat
                                  </p>


                                  <p className="mt-1 font-bold">
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


                              <div className="mt-5 flex flex-wrap gap-3">

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

                                  className="rounded-xl border border-gray-300 px-4 py-2 font-semibold hover:bg-gray-50"
                                >

                                  {
                                    expandedRide ===
                                    ride.id
                                      ? "Hide Route"
                                      : "View Route"
                                  }

                                </button>


                                {
                                  ride.status ===
                                  "active" &&
                                  (
                                    <>

                                      <button
                                        type="button"

                                        disabled={
                                          busyId ===
                                          `start-${ride.id}`
                                        }

                                        onClick={
                                          () =>
                                            runAction(
                                              `start-${ride.id}`,
                                              `/rides/${ride.id}/start`,
                                              "POST",
                                              "Ride started."
                                            )
                                        }

                                        className="rounded-xl bg-[#4f2683] px-4 py-2 font-semibold text-white hover:bg-[#35165c] disabled:opacity-50"
                                      >
                                        Start Ride
                                      </button>


                                      <button
                                        type="button"

                                        disabled={
                                          busyId ===
                                          `cancel-${ride.id}`
                                        }

                                        onClick={
                                          () => {

                                            if (
                                              window.confirm(
                                                "Cancel this ride? It will move to your archive."
                                              )
                                            ) {

                                              runAction(
                                                `cancel-${ride.id}`,
                                                `/rides/${ride.id}`,
                                                "DELETE",
                                                "Ride cancelled and archived."
                                              );
                                            }
                                          }
                                        }

                                        className="rounded-xl border border-red-200 px-4 py-2 font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                                      >
                                        Cancel Ride
                                      </button>

                                    </>
                                  )
                                }


                                {
                                  ride.status ===
                                  "in_progress" &&
                                  (
                                    <button
                                      type="button"

                                      disabled={
                                        busyId ===
                                        `complete-${ride.id}`
                                      }

                                      onClick={
                                        () =>
                                          runAction(
                                            `complete-${ride.id}`,
                                            `/rides/${ride.id}/complete`,
                                            "POST",
                                            "Ride completed and archived."
                                          )
                                      }

                                      className="rounded-xl bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                                    >
                                      Complete Ride
                                    </button>
                                  )
                                }

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

                                      height="300px"
                                    />

                                  </div>
                                )
                              }

                            </article>

                          )
                        )
                      }

                    </div>

                  </div>


                  <div>

                    <h2 className="text-2xl font-bold">
                      Passenger Requests
                    </h2>


                    <div className="mt-4 space-y-4">

                      {
                        currentRequests.length ===
                        0 &&
                        (
                          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-8 text-gray-500">
                            No passenger requests yet.
                          </div>
                        )
                      }


                      {
                        currentRequests.map(
                          (
                            request
                          ) => (

                            <article
                              key={
                                request
                                  .request_id
                              }

                              className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
                            >

                              <div className="flex items-start justify-between gap-3">

                                <div>

                                  <h3 className="font-bold">
                                    {
                                      request
                                        .passenger
                                        .name
                                    }
                                  </h3>


                                  <p className="text-sm text-gray-500">
                                    {
                                      request
                                        .passenger
                                        .email
                                    }
                                  </p>


                                  <p className="mt-1 text-sm text-gray-500">

                                    {
                                      request
                                        .passenger
                                        .rating_average
                                        ? `${
                                            request
                                              .passenger
                                              .rating_average
                                              .toFixed(
                                                1
                                              )
                                          } ★ (${
                                            request
                                              .passenger
                                              .rating_count
                                          })`

                                        : "New rider"
                                    }

                                  </p>

                                </div>


                                <span
                                  className={
                                    `rounded-full px-3 py-1 text-xs font-semibold ${
                                      requestStatusClass(
                                        request.status
                                      )
                                    }`
                                  }
                                >
                                  {
                                    request.status
                                  }
                                </span>

                              </div>


                              <p className="mt-4 text-sm">

                                <span className="font-semibold">
                                  Pickup:
                                </span>

                                {" "}

                                {
                                  request
                                    .pickup_address ??
                                  "Not available"
                                }

                              </p>


                              <div className="mt-4 grid grid-cols-3 gap-2 text-sm">

                                <div className="rounded-xl bg-gray-50 p-3">

                                  <p className="text-xs text-gray-500">
                                    Passenger trip
                                  </p>


                                  <p className="font-bold">
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


                                <div className="rounded-xl bg-gray-50 p-3">

                                  <p className="text-xs text-gray-500">
                                    Added detour
                                  </p>


                                  <p className="font-bold">
                                    {
                                      request
                                        .detour_km
                                        ?.toFixed(
                                          1
                                        ) ??
                                      "—"
                                    } km
                                  </p>

                                </div>


                                <div className="rounded-xl bg-[#f7f2fb] p-3">

                                  <p className="text-xs text-[#4f2683]">
                                    Passenger fare
                                  </p>


                                  <p className="font-bold text-[#4f2683]">
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


                              <div className="mt-4 flex flex-wrap gap-2">

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

                                  className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50"
                                >

                                  {
                                    expandedRequest ===
                                    request
                                      .request_id
                                      ? "Hide Routes"
                                      : "Compare Routes"
                                  }

                                </button>


                                {
                                  request.status ===
                                    "pending" &&
                                  request
                                    .ride
                                    .status ===
                                    "active" &&
                                  (
                                    <>

                                      <button
                                        type="button"

                                        disabled={
                                          busyId ===
                                          `accept-${request.request_id}`
                                        }

                                        onClick={
                                          () =>
                                            runAction(
                                              `accept-${request.request_id}`,
                                              `/requests/${request.request_id}/accept`,
                                              "POST",
                                              "Passenger accepted."
                                            )
                                        }

                                        className="rounded-xl bg-[#4f2683] px-4 py-2 text-sm font-semibold text-white hover:bg-[#35165c] disabled:opacity-50"
                                      >
                                        Accept
                                      </button>


                                      <button
                                        type="button"

                                        disabled={
                                          busyId ===
                                          `decline-${request.request_id}`
                                        }

                                        onClick={
                                          () =>
                                            runAction(
                                              `decline-${request.request_id}`,
                                              `/requests/${request.request_id}/decline`,
                                              "POST",
                                              "Passenger declined."
                                            )
                                        }

                                        className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
                                      >
                                        Decline
                                      </button>

                                    </>
                                  )
                                }

                              </div>


                              {
                                expandedRequest ===
                                  request
                                    .request_id &&
                                request
                                  .ride
                                  .route_geometry &&
                                (
                                  <div className="mt-5">

                                    <RouteMap
                                      route={
                                        request
                                          .ride
                                          .route_geometry
                                      }

                                      alternateRoute={
                                        request
                                          .route_with_pickup_geometry ??
                                        []
                                      }

                                      origin={
                                        request
                                          .ride
                                          .origin_lat !==
                                          null &&
                                        request
                                          .ride
                                          .origin_lon !==
                                          null
                                          ? {
                                              lat:
                                                request
                                                  .ride
                                                  .origin_lat,

                                              lon:
                                                request
                                                  .ride
                                                  .origin_lon,

                                              label:
                                                request
                                                  .ride
                                                  .origin,
                                            }
                                          : null
                                      }

                                      destination={
                                        request
                                          .ride
                                          .destination_lat !==
                                          null &&
                                        request
                                          .ride
                                          .destination_lon !==
                                          null
                                          ? {
                                              lat:
                                                request
                                                  .ride
                                                  .destination_lat,

                                              lon:
                                                request
                                                  .ride
                                                  .destination_lon,

                                              label:
                                                request
                                                  .ride
                                                  .destination,
                                            }
                                          : null
                                      }

                                      pickup={
                                        request
                                          .pickup_lat !==
                                          null &&
                                        request
                                          .pickup_lon !==
                                          null
                                          ? {
                                              lat:
                                                request
                                                  .pickup_lat,

                                              lon:
                                                request
                                                  .pickup_lon,

                                              label:
                                                request
                                                  .pickup_address ??
                                                "Passenger pickup",
                                            }
                                          : null
                                      }

                                      height="300px"
                                    />


                                    <p className="mt-2 text-xs text-gray-500">
                                      Purple = original route. Blue dashed = route including passenger pickup.
                                    </p>

                                  </div>
                                )
                              }

                            </article>

                          )
                        )
                      }

                    </div>

                  </div>

                </div>


                <section className="mt-12">

                  <div>

                    <h2 className="text-2xl font-bold">
                      Archived Rides
                    </h2>


                    <p className="mt-1 text-sm text-gray-500">
                      Completed and cancelled rides are stored here instead of your active dashboard.
                    </p>

                  </div>


                  <div className="mt-4 space-y-4">

                    {
                      archivedRides.length ===
                      0 &&
                      (
                        <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-8 text-gray-500">
                          Your ride archive is empty.
                        </div>
                      )
                    }


                    {
                      archivedRides.map(
                        (
                          ride
                        ) => {

                          const acceptedPassengers =
                            requestsForRide(
                              ride.id
                            )
                              .filter(
                                (
                                  request
                                ) =>
                                  request
                                    .status ===
                                  "accepted"
                              );


                          return (
                            <article
                              key={
                                ride.id
                              }

                              className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
                            >

                              <div className="flex flex-wrap items-start justify-between gap-4">

                                <div>

                                  <h3 className="text-lg font-bold">

                                    {
                                      shortAddress(
                                        ride.origin
                                      )
                                    }

                                    {" → "}

                                    {
                                      shortAddress(
                                        ride.destination
                                      )
                                    }

                                  </h3>


                                  <p className="mt-1 text-sm text-gray-500">

                                    {
                                      prettyDate(
                                        ride
                                          .departure_time
                                      )
                                    }

                                    {" · "}

                                    {
                                      ride
                                        .distance_km
                                        .toFixed(
                                          1
                                        )
                                    } km

                                    {" · "}

                                    {
                                      ride.total_seats -
                                      ride.available_seats
                                    }

                                    /

                                    {
                                      ride.total_seats
                                    } seats filled

                                  </p>

                                </div>


                                <span
                                  className={
                                    `rounded-full px-3 py-1 text-xs font-semibold ${
                                      rideStatusClass(
                                        ride.status
                                      )
                                    }`
                                  }
                                >
                                  {
                                    ride.status
                                  }
                                </span>

                              </div>


                              {
                                ride.status ===
                                  "completed" &&
                                acceptedPassengers.length >
                                  0 &&
                                (
                                  <div className="mt-5 border-t border-gray-100 pt-5">

                                    <p className="text-sm font-semibold">
                                      Rate your passengers
                                    </p>


                                    <div className="mt-3 grid gap-3 lg:grid-cols-2">

                                      {
                                        acceptedPassengers.map(
                                          (
                                            request
                                          ) => {

                                            const pairKey =
                                              `${ride.id}:${request.passenger.id}`;


                                            const alreadyRated =
                                              ratedPairs.has(
                                                pairKey
                                              );


                                            return (
                                              <div
                                                key={
                                                  request
                                                    .request_id
                                                }

                                                className="rounded-2xl bg-gray-50 p-4"
                                              >

                                                <div className="flex items-center justify-between gap-3">

                                                  <div>

                                                    <p className="font-semibold">
                                                      {
                                                        request
                                                          .passenger
                                                          .name
                                                      }
                                                    </p>


                                                    <p className="text-xs text-gray-500">

                                                      {
                                                        request
                                                          .passenger
                                                          .rating_average
                                                          ? `${
                                                              request
                                                                .passenger
                                                                .rating_average
                                                                .toFixed(
                                                                  1
                                                                )
                                                            } ★`

                                                          : "No rating yet"
                                                      }

                                                    </p>

                                                  </div>


                                                  {
                                                    alreadyRated &&
                                                    (
                                                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                                        Rated
                                                      </span>
                                                    )
                                                  }

                                                </div>


                                                {
                                                  !alreadyRated &&
                                                  (
                                                    <div className="mt-3 space-y-3">

                                                      <select
                                                        value={
                                                          ratingScores[
                                                            request
                                                              .passenger
                                                              .id
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

                                                              [request.passenger.id]:
                                                                Number(
                                                                  event
                                                                    .target
                                                                    .value
                                                                ),
                                                            })
                                                          )
                                                        }

                                                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2"
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
                                                            request
                                                              .passenger
                                                              .id
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

                                                              [request.passenger.id]:
                                                                event
                                                                  .target
                                                                  .value,
                                                            })
                                                          )
                                                        }

                                                        placeholder="Optional comment"

                                                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2"
                                                      />


                                                      <button
                                                        type="button"

                                                        disabled={
                                                          busyId ===
                                                          `rating-${pairKey}`
                                                        }

                                                        onClick={
                                                          () =>
                                                            submitRating(
                                                              ride.id,
                                                              request
                                                                .passenger
                                                                .id
                                                            )
                                                        }

                                                        className="rounded-xl bg-[#4f2683] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                                                      >
                                                        Submit Rating
                                                      </button>

                                                    </div>
                                                  )
                                                }

                                              </div>
                                            );
                                          }
                                        )
                                      }

                                    </div>

                                  </div>
                                )
                              }

                            </article>
                          );
                        }
                      )
                    }

                  </div>

                </section>

              </>
            )
        }

      </section>

    </main>
  );
}