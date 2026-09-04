"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

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


type DriverRequest = {
  request_id: number;

  status: string;

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
    id: number;
    name: string;
    email: string;
  };

  ride: Ride;
};


export default function DriverPage() {
  const router = useRouter();

  const [
    rides,
    setRides,
  ] =
    useState<Ride[]>([]);

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
    useState<number | null>(
      null
    );

  const [
    expandedRequest,
    setExpandedRequest,
  ] =
    useState<number | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");


  async function loadData() {
    try {
      const [
        ridesData,
        requestsData,
      ] = await Promise.all([
        apiRequest(
          "/my-rides"
        ),

        apiRequest(
          "/driver/requests"
        ),
      ]);

      setRides(
        ridesData
      );

      setRequests(
        requestsData
      );

    } catch (error) {

      if (
        error
        instanceof Error
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
    loadData();
  }, []);


  async function acceptRequest(
    requestId: number
  ) {
    setMessage("");
    setError("");

    try {
      await apiRequest(
        `/requests/${requestId}/accept`,
        {
          method: "POST",
        }
      );

      setMessage(
        "Passenger accepted."
      );

      await loadData();

    } catch (error) {

      if (
        error
        instanceof Error
      ) {
        setError(
          error.message
        );
      }
    }
  }


  async function declineRequest(
    requestId: number
  ) {
    setMessage("");
    setError("");

    try {
      await apiRequest(
        `/requests/${requestId}/decline`,
        {
          method: "POST",
        }
      );

      setMessage(
        "Passenger declined."
      );

      await loadData();

    } catch (error) {

      if (
        error
        instanceof Error
      ) {
        setError(
          error.message
        );
      }
    }
  }


  async function cancelRide(
    rideId: number
  ) {
    setMessage("");
    setError("");

    try {
      await apiRequest(
        `/rides/${rideId}`,
        {
          method: "DELETE",
        }
      );

      setMessage(
        "Ride cancelled."
      );

      await loadData();

    } catch (error) {

      if (
        error
        instanceof Error
      ) {
        setError(
          error.message
        );
      }
    }
  }


  const activeRides =
    rides.filter(
      (ride) =>
        ride.status
        === "active"
    ).length;


  const pendingRequests =
    requests.filter(
      (request) =>
        request.status
        === "pending"
    ).length;


  const acceptedPassengers =
    requests.filter(
      (request) =>
        request.status
        === "accepted"
    ).length;


  return (
    <main className="min-h-screen">

      <Navbar />

      <section className="mx-auto max-w-6xl px-6 py-12">

        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">

          <div>

            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4f2683]">
              Driver
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              Driver Dashboard
            </h1>

            <p className="mt-2 text-gray-600">
              Review your routes and
              passenger pickup requests.
            </p>

          </div>


          <button
            onClick={() =>
              router.push(
                "/rides/create"
              )
            }
            className="rounded-xl bg-[#4f2683] px-6 py-3 font-semibold text-white"
          >
            + Offer New Ride
          </button>

        </div>


        <div className="mt-8 grid gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border bg-white p-6">

            <p className="text-sm text-gray-500">
              Active Rides
            </p>

            <p className="mt-2 text-3xl font-bold text-[#4f2683]">
              {activeRides}
            </p>

          </div>


          <div className="rounded-2xl border bg-white p-6">

            <p className="text-sm text-gray-500">
              Pending Requests
            </p>

            <p className="mt-2 text-3xl font-bold text-[#4f2683]">
              {pendingRequests}
            </p>

          </div>


          <div className="rounded-2xl border bg-white p-6">

            <p className="text-sm text-gray-500">
              Accepted Passengers
            </p>

            <p className="mt-2 text-3xl font-bold text-[#4f2683]">
              {
                acceptedPassengers
              }
            </p>

          </div>

        </div>


        {message && (
          <div className="mt-6 rounded-xl bg-green-50 p-4 text-green-800">
            {message}
          </div>
        )}


        {error && (
          <div className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}


        {loading ? (

          <p className="mt-10">
            Loading...
          </p>

        ) : (

          <>
            <section className="mt-12">

              <h2 className="text-2xl font-bold">
                My Rides
              </h2>


              <div className="mt-5 space-y-5">

                {rides.map(
                  (ride) => {

                    const hasMap =
                      Boolean(
                        ride
                        .route_geometry
                        ?.length
                      )
                      &&
                      ride.origin_lat
                      != null
                      &&
                      ride.origin_lon
                      != null
                      &&
                      ride.destination_lat
                      != null
                      &&
                      ride.destination_lon
                      != null;

                    return (
                      <div
                        key={
                          ride.id
                        }
                        className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm"
                      >

                        <div className="flex flex-col justify-between gap-5 md:flex-row">

                          <div>

                            <h3 className="text-2xl font-bold">
                              {
                                ride.origin
                              }

                              {" → "}

                              {
                                ride.destination
                              }
                            </h3>


                            <p className="mt-3 text-gray-600">
                              {new Date(
                                ride
                                .departure_time
                              ).toLocaleString()}
                            </p>


                            <div className="mt-4 flex flex-wrap gap-2">

                              <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                                {
                                  ride.distance_km
                                }
                                {" km"}
                              </span>


                              {ride.duration_minutes
                                != null && (
                                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                                  ~
                                  {Math.round(
                                    ride.duration_minutes
                                  )}
                                  {" min"}
                                </span>
                              )}


                              <span className="rounded-full bg-[#f1ebf7] px-3 py-1 text-sm text-[#4f2683]">
                                {
                                  ride.available_seats
                                }
                                {" seats"}
                              </span>


                              <span className="rounded-full bg-[#f1ebf7] px-3 py-1 text-sm font-semibold text-[#4f2683]">
                                $
                                {
                                  ride
                                  .price_per_seat
                                  .toFixed(
                                    2
                                  )
                                }
                                {" / seat"}
                              </span>

                            </div>

                          </div>


                          <span className="h-fit rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold capitalize">
                            {
                              ride.status
                            }
                          </span>

                        </div>


                        <div className="mt-6 flex flex-wrap gap-3 border-t pt-5">

                          {hasMap && (
                            <button
                              onClick={() =>
                                setExpandedRide(
                                  expandedRide
                                  === ride.id
                                    ? null
                                    : ride.id
                                )
                              }
                              className="rounded-xl border px-5 py-2 font-semibold"
                            >
                              {expandedRide
                                === ride.id
                                ? "Hide Route"
                                : "View Route"}
                            </button>
                          )}


                          {ride.status
                            === "active" && (
                            <button
                              onClick={() =>
                                cancelRide(
                                  ride.id
                                )
                              }
                              className="rounded-xl border border-red-200 px-5 py-2 font-semibold text-red-600"
                            >
                              Cancel Ride
                            </button>
                          )}

                        </div>


                        {hasMap
                          &&
                          expandedRide
                          === ride.id && (
                          <div className="mt-5">

                            <RouteMap
                              route={
                                ride
                                .route_geometry
                                || []
                              }

                              origin={{
                                lat:
                                  ride.origin_lat!,

                                lon:
                                  ride.origin_lon!,

                                label:
                                  ride.origin,
                              }}

                              destination={{
                                lat:
                                  ride.destination_lat!,

                                lon:
                                  ride.destination_lon!,

                                label:
                                  ride.destination,
                              }}
                            />

                          </div>
                        )}

                      </div>
                    );
                  }
                )}

              </div>

            </section>


            <section className="mt-14">

              <h2 className="text-2xl font-bold">
                Passenger Requests
              </h2>


              <div className="mt-5 space-y-5">

                {requests.map(
                  (request) => {

                    const ride =
                      request.ride;

                    const canMap =
                      Boolean(
                        ride
                        .route_geometry
                        ?.length
                      )
                      &&
                      Boolean(
                        request
                        .route_with_pickup_geometry
                        ?.length
                      )
                      &&
                      request.pickup_lat
                      != null
                      &&
                      request.pickup_lon
                      != null
                      &&
                      ride.origin_lat
                      != null
                      &&
                      ride.origin_lon
                      != null
                      &&
                      ride.destination_lat
                      != null
                      &&
                      ride.destination_lon
                      != null;

                    return (
                      <div
                        key={
                          request
                          .request_id
                        }
                        className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm"
                      >

                        <div className="flex flex-col justify-between gap-5 md:flex-row">

                          <div>

                            <h3 className="text-xl font-bold">
                              {
                                request
                                .passenger
                                .name
                              }
                            </h3>

                            <p className="mt-1 text-gray-500">
                              {
                                request
                                .passenger
                                .email
                              }
                            </p>


                            <p className="mt-4 font-semibold">
                              {
                                ride.origin
                              }
                              {" → "}
                              {
                                ride.destination
                              }
                            </p>

                          </div>


                          <span className="h-fit rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold capitalize">
                            {
                              request.status
                            }
                          </span>

                        </div>


                        <div className="mt-6 grid gap-4 sm:grid-cols-3">

                          <div className="rounded-2xl bg-gray-50 p-5">

                            <p className="text-sm text-gray-500">
                              Passenger Trip
                            </p>

                            <p className="mt-2 text-xl font-bold">
                              {
                                request
                                .passenger_distance_km
                                ?? "—"
                              }
                              {request
                                .passenger_distance_km
                                != null
                                ? " km"
                                : ""}
                            </p>

                          </div>


                          <div className="rounded-2xl bg-gray-50 p-5">

                            <p className="text-sm text-gray-500">
                              Added Detour
                            </p>

                            <p className="mt-2 text-xl font-bold">
                              {
                                request
                                .detour_km
                                ?? "—"
                              }
                              {request
                                .detour_km
                                != null
                                ? " km"
                                : ""}
                            </p>

                          </div>


                          <div className="rounded-2xl bg-[#f1ebf7] p-5">

                            <p className="text-sm text-[#4f2683]">
                              Passenger Fare
                            </p>

                            <p className="mt-2 text-xl font-bold text-[#4f2683]">
                              {request
                                .quoted_price
                                != null
                                ? `$${request.quoted_price.toFixed(
                                    2
                                  )}`
                                : "—"}
                            </p>

                          </div>

                        </div>


                        {request
                          .pickup_address && (
                          <div className="mt-5 rounded-2xl border p-5">

                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                              Pickup Address
                            </p>

                            <p className="mt-2">
                              {
                                request
                                .pickup_address
                              }
                            </p>

                          </div>
                        )}


                        {canMap && (
                          <div className="mt-5">

                            <button
                              onClick={() =>
                                setExpandedRequest(
                                  expandedRequest
                                  ===
                                    request
                                    .request_id
                                    ? null
                                    : request
                                      .request_id
                                )
                              }
                              className="rounded-xl border px-5 py-2 font-semibold"
                            >
                              {expandedRequest
                                ===
                                  request
                                  .request_id
                                ? "Hide Route Comparison"
                                : "Compare Routes"}
                            </button>


                            {expandedRequest
                              ===
                                request
                                .request_id && (
                              <div className="mt-5">

                                <RouteMap
                                  route={
                                    ride
                                    .route_geometry
                                    || []
                                  }

                                  alternateRoute={
                                    request
                                    .route_with_pickup_geometry
                                    || []
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

                                  pickup={{
                                    lat:
                                      request
                                      .pickup_lat!,

                                    lon:
                                      request
                                      .pickup_lon!,

                                    label:
                                      request
                                      .pickup_address
                                      || "Pickup",
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


                                <div className="mt-3 flex flex-wrap gap-5 text-sm">

                                  <div className="flex items-center gap-2">
                                    <span className="h-1 w-8 rounded bg-[#4f2683]" />

                                    Original route
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className="h-1 w-8 rounded bg-blue-600" />

                                    With passenger pickup
                                  </div>

                                </div>

                              </div>
                            )}

                          </div>
                        )}


                        {request.status
                          === "pending" && (
                          <div className="mt-6 flex gap-3 border-t pt-5">

                            <button
                              onClick={() =>
                                acceptRequest(
                                  request
                                  .request_id
                                )
                              }
                              className="rounded-xl bg-[#4f2683] px-5 py-2 font-semibold text-white"
                            >
                              Accept Passenger
                            </button>

                            <button
                              onClick={() =>
                                declineRequest(
                                  request
                                  .request_id
                                )
                              }
                              className="rounded-xl border px-5 py-2 font-semibold"
                            >
                              Decline
                            </button>

                          </div>
                        )}

                      </div>
                    );
                  }
                )}

              </div>

            </section>
          </>
        )}

      </section>
    </main>
  );
}