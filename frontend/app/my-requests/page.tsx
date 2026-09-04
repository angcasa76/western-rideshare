"use client";

import {
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import Navbar from "@/components/Navbar";
import RouteMap from "@/components/RouteMap";

import {
  apiRequest,
} from "@/lib/api";

type RideRequest = {
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

  passenger_route_geometry:
    number[][] | null;

  route_with_pickup_geometry:
    number[][] | null;

  ride: {
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
};

export default function MyRequestsPage() {
  const router = useRouter();

  const [
    requests,
    setRequests,
  ] =
    useState<RideRequest[]>([]);

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

  async function loadRequests() {
    try {
      const data =
        await apiRequest(
          "/my-requests"
        );

      setRequests(data);
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
    loadRequests();
  }, []);

  async function cancelRequest(
    requestId: number
  ) {
    setMessage("");
    setError("");

    try {
      await apiRequest(
        `/requests/${requestId}`,
        {
          method: "DELETE",
        }
      );

      setMessage(
        "Ride request cancelled."
      );

      await loadRequests();

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

  function statusStyle(
    status: string
  ) {
    if (
      status === "accepted"
    ) {
      return (
        "bg-green-100 " +
        "text-green-700"
      );
    }

    if (
      status === "pending"
    ) {
      return (
        "bg-yellow-100 " +
        "text-yellow-700"
      );
    }

    if (
      status === "declined"
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

  return (
    <main className="min-h-screen">
      <Navbar />

      <section className="mx-auto max-w-6xl px-6 py-12">

        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4f2683]">
          Passenger
        </p>

        <h1 className="mt-2 text-4xl font-bold">
          My Ride Requests
        </h1>

        <p className="mt-2 text-gray-600">
          View your pickup route,
          estimated fare and request
          status.
        </p>

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
          <p className="mt-8 text-gray-500">
            Loading requests...
          </p>
        ) : (
          <div className="mt-8 space-y-6">

            {requests.length ===
              0 && (
              <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">

                <h2 className="text-xl font-bold">
                  No requests yet
                </h2>

                <p className="mt-2 text-gray-600">
                  Find a ride and
                  request your first
                  trip.
                </p>

                <button
                  onClick={() =>
                    router.push(
                      "/rides"
                    )
                  }
                  className="mt-6 rounded-xl bg-[#4f2683] px-6 py-3 font-semibold text-white"
                >
                  Find a Ride
                </button>

              </div>
            )}

            {requests.map(
              (request) => {

                const canShowMap =
                  Boolean(
                    request
                      .pickup_lat
                  )
                  &&
                  Boolean(
                    request
                      .pickup_lon
                  )
                  &&
                  Boolean(
                    request
                      .ride
                      .destination_lat
                  )
                  &&
                  Boolean(
                    request
                      .ride
                      .destination_lon
                  )
                  &&
                  Boolean(
                    request
                      .passenger_route_geometry
                      ?.length
                  );

                return (
                  <div
                    key={
                      request
                        .request_id
                    }
                    className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm"
                  >

                    <div className="flex flex-col justify-between gap-6 md:flex-row">

                      <div>

                        <h2 className="text-2xl font-bold">
                          {
                            request
                            .ride
                            .origin
                          }

                          {" → "}

                          {
                            request
                            .ride
                            .destination
                          }
                        </h2>

                        <p className="mt-3 text-gray-600">
                          Driver:{" "}
                          <span className="font-semibold text-gray-900">
                            {
                              request
                              .ride
                              .driver
                              .name
                            }
                          </span>
                        </p>

                        <p className="mt-2 text-gray-600">
                          {new Date(
                            request
                            .ride
                            .departure_time
                          ).toLocaleString()}
                        </p>

                      </div>


                      <span
                        className={
                          `h-fit rounded-full px-4 py-2 text-sm font-semibold capitalize ${statusStyle(
                            request.status
                          )}`
                        }
                      >
                        {
                          request.status
                        }
                      </span>

                    </div>


                    <div className="mt-6 grid gap-4 sm:grid-cols-3">

                      <div className="rounded-2xl bg-gray-50 p-5">

                        <p className="text-sm text-gray-500">
                          Your Distance
                        </p>

                        <p className="mt-2 text-2xl font-bold">
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
                          Driver Detour
                        </p>

                        <p className="mt-2 text-2xl font-bold">
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

                        <p className="text-sm font-semibold text-[#4f2683]">
                          Your Fare
                        </p>

                        <p className="mt-2 text-2xl font-bold text-[#4f2683]">
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
                      <div className="mt-5 rounded-2xl border border-gray-200 p-5">

                        <p className="text-sm font-semibold text-gray-500">
                          PICKUP
                        </p>

                        <p className="mt-2">
                          {
                            request
                            .pickup_address
                          }
                        </p>

                      </div>
                    )}


                    {canShowMap && (
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
                          className="rounded-xl border border-gray-300 px-5 py-2 font-semibold"
                        >
                          {expandedRequest
                            ===
                              request
                              .request_id
                            ? "Hide Map"
                            : "View Trip Map"}
                        </button>


                        {expandedRequest
                          ===
                            request
                            .request_id && (
                            <div className="mt-5">

                              <RouteMap
                                route={
                                  request
                                  .passenger_route_geometry
                                  || []
                                }

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
                                    request
                                    .ride
                                    .destination_lat!,

                                  lon:
                                    request
                                    .ride
                                    .destination_lon!,

                                  label:
                                    request
                                    .ride
                                    .destination,
                                }}
                              />

                            </div>
                          )}

                      </div>
                    )}


                    {(request.status
                      === "pending"
                      ||
                      request.status
                      === "accepted") && (
                      <div className="mt-6 border-t border-gray-100 pt-5">

                        <button
                          onClick={() =>
                            cancelRequest(
                              request
                              .request_id
                            )
                          }
                          className="rounded-xl border border-red-200 px-5 py-2 font-semibold text-red-600 hover:bg-red-50"
                        >
                          Cancel Request
                        </button>

                      </div>
                    )}

                  </div>
                );
              }
            )}

          </div>
        )}

      </section>
    </main>
  );
}