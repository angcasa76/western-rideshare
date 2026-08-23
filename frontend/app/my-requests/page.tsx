"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { apiRequest } from "@/lib/api";
import Navbar from "@/components/Navbar";

type RideRequest = {
  request_id: number;
  status: string;
  ride: {
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
};

export default function MyRequestsPage() {
  const router = useRouter();

  const [requests, setRequests] =
    useState<RideRequest[]>([]);

  const [loading, setLoading] =
    useState(true);

  async function loadRequests() {
    try {
      const data =
        await apiRequest("/my-requests");

      setRequests(data);
    } catch {
      router.push("/login");
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
    try {
      await apiRequest(
        `/requests/${requestId}`,
        {
          method: "DELETE",
        }
      );

      await loadRequests();
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    }
  }

  function statusStyle(status: string) {
    if (status === "accepted") {
      return "bg-green-100 text-green-700";
    }

    if (status === "pending") {
      return "bg-yellow-100 text-yellow-700";
    }

    if (status === "declined") {
      return "bg-red-100 text-red-700";
    }

    return "bg-gray-100 text-gray-700";
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <Navbar />

      <section className="mx-auto max-w-5xl px-6 py-12">
        <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">
          Passenger
        </p>

        <h1 className="mt-2 text-4xl font-bold">
          My Ride Requests
        </h1>

        {loading ? (
          <p className="mt-8">
            Loading...
          </p>
        ) : (
          <div className="mt-8 space-y-5">
            {requests.length === 0 && (
              <div className="rounded-3xl bg-white p-8 text-center shadow">
                <h2 className="text-xl font-semibold">
                  No ride requests yet
                </h2>

                <p className="mt-2 text-gray-600">
                  Browse available rides and request a seat.
                </p>
              </div>
            )}

            {requests.map((request) => (
              <div
                key={request.request_id}
                className="rounded-3xl bg-white p-7 shadow"
              >
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {request.ride.origin}
                      {" → "}
                      {request.ride.destination}
                    </h2>

                    <p className="mt-3 text-gray-600">
                      {new Date(
                        request.ride.departure_time
                      ).toLocaleString()}
                    </p>

                    <p className="mt-1 text-gray-600">
                      Driver:{" "}
                      {request.ride.driver.name}
                    </p>

                    <p className="mt-1 text-gray-600">
                      ${request.ride.price_per_seat.toFixed(2)}
                      {" / seat"}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${statusStyle(
                      request.status
                    )}`}
                  >
                    {request.status}
                  </span>
                </div>

                {(request.status === "pending" ||
                  request.status === "accepted") && (
                  <button
                    onClick={() =>
                      cancelRequest(
                        request.request_id
                      )
                    }
                    className="mt-6 rounded-xl border px-5 py-2"
                  >
                    Cancel Request
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}