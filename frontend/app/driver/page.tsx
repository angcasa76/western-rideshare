"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { apiRequest } from "@/lib/api";


type Ride = {
  id: number;
  origin: string;
  destination: string;
  departure_time: string;
  available_seats: number;
  price_per_seat: number;
  status: string;
};


type DriverRequest = {
  request_id: number;
  status: string;

  passenger: {
    id: number;
    name: string;
    email: string;
  };

  ride: {
    id: number;
    origin: string;
    destination: string;
    departure_time: string;
    available_seats: number;
    price_per_seat: number;
    status: string;
  };
};


export default function DriverPage() {
  const router = useRouter();

  const [rides, setRides] = useState<Ride[]>([]);
  const [requests, setRequests] =
    useState<DriverRequest[]>([]);

  const [loading, setLoading] =
    useState(true);


  async function loadData() {
    try {
      const [ridesData, requestsData] =
        await Promise.all([
          apiRequest("/my-rides"),
          apiRequest("/driver/requests"),
        ]);

      setRides(ridesData);
      setRequests(requestsData);
    } catch {
      router.push("/login");
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
    try {
      await apiRequest(
        `/requests/${requestId}/accept`,
        {
          method: "POST",
        }
      );

      await loadData();
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    }
  }


  async function declineRequest(
    requestId: number
  ) {
    try {
      await apiRequest(
        `/requests/${requestId}/decline`,
        {
          method: "POST",
        }
      );

      await loadData();
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    }
  }


  async function cancelRide(
    rideId: number
  ) {
    try {
      await apiRequest(
        `/rides/${rideId}`,
        {
          method: "DELETE",
        }
      );

      await loadData();
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    }
  }


  return (
    <main className="min-h-screen bg-gray-100">

      <section className="mx-auto max-w-6xl px-6 py-12">

        <div className="flex items-center justify-between">

          <div>
            <button
              onClick={() =>
                router.push("/dashboard")
              }
            >
              ← Dashboard
            </button>

            <h1 className="mt-4 text-4xl font-bold">
              Driver Dashboard
            </h1>
          </div>


          <button
            onClick={() =>
              router.push("/rides/create")
            }
            className="rounded-lg bg-black px-5 py-3 text-white"
          >
            Offer New Ride
          </button>

        </div>


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

              <div className="mt-5 space-y-4">

                {rides.length === 0 && (
                  <p>
                    You haven't posted any rides.
                  </p>
                )}


                {rides.map((ride) => (
                  <div
                    key={ride.id}
                    className="rounded-2xl bg-white p-6 shadow"
                  >

                    <h3 className="text-xl font-semibold">
                      {ride.origin}
                      {" → "}
                      {ride.destination}
                    </h3>

                    <p className="mt-2 text-gray-600">
                      {new Date(
                        ride.departure_time
                      ).toLocaleString()}
                    </p>

                    <p className="mt-1">
                      Seats: {ride.available_seats}
                    </p>

                    <p>
                      Status: {ride.status}
                    </p>


                    {ride.status === "active" && (
                      <button
                        onClick={() =>
                          cancelRide(ride.id)
                        }
                        className="mt-4 rounded-lg border px-4 py-2"
                      >
                        Cancel Ride
                      </button>
                    )}

                  </div>
                ))}

              </div>

            </section>


            <section className="mt-12">

              <h2 className="text-2xl font-bold">
                Passenger Requests
              </h2>

              <div className="mt-5 space-y-4">

                {requests.length === 0 && (
                  <p>
                    No passenger requests.
                  </p>
                )}


                {requests.map((request) => (
                  <div
                    key={request.request_id}
                    className="rounded-2xl bg-white p-6 shadow"
                  >

                    <h3 className="text-xl font-semibold">
                      {request.passenger.name}
                    </h3>

                    <p className="mt-1 text-gray-600">
                      {request.passenger.email}
                    </p>

                    <p className="mt-3">
                      Ride:{" "}
                      {request.ride.origin}
                      {" → "}
                      {request.ride.destination}
                    </p>

                    <p className="mt-1">
                      Status:{" "}
                      <strong>
                        {request.status}
                      </strong>
                    </p>


                    {request.status === "pending" && (
                      <div className="mt-4 flex gap-3">

                        <button
                          onClick={() =>
                            acceptRequest(
                              request.request_id
                            )
                          }
                          className="rounded-lg bg-black px-4 py-2 text-white"
                        >
                          Accept
                        </button>

                        <button
                          onClick={() =>
                            declineRequest(
                              request.request_id
                            )
                          }
                          className="rounded-lg border px-4 py-2"
                        >
                          Decline
                        </button>

                      </div>
                    )}

                  </div>
                ))}

              </div>

            </section>
          </>
        )}

      </section>

    </main>
  );
}