"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { apiRequest } from "@/lib/api";
import Navbar from "@/components/Navbar";

type User = {
  id: number;
  name: string;
  email: string;
};

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const data = await apiRequest("/me");
        setUser(data);
      } catch {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="mx-auto max-w-6xl px-6 py-12">
          Loading...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <Navbar />

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="rounded-3xl bg-black px-8 py-10 text-white">
          <p className="text-sm uppercase tracking-widest text-gray-300">
            Western Rideshare
          </p>

          <h1 className="mt-3 text-4xl font-bold md:text-5xl">
            Welcome back, {user?.name}
          </h1>

          <p className="mt-4 max-w-2xl text-lg text-gray-300">
            Find a ride to campus, offer seats on your commute,
            and manage your trips from one place.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <button
            onClick={() => router.push("/rides")}
            className="rounded-3xl bg-white p-8 text-left shadow transition hover:-translate-y-1 hover:shadow-lg"
          >
            <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Passenger
            </p>

            <h2 className="mt-3 text-2xl font-bold">
              Find a Ride
            </h2>

            <p className="mt-3 text-gray-600">
              Browse available rides and request a seat.
            </p>
          </button>

          <button
            onClick={() => router.push("/rides/create")}
            className="rounded-3xl bg-white p-8 text-left shadow transition hover:-translate-y-1 hover:shadow-lg"
          >
            <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Driver
            </p>

            <h2 className="mt-3 text-2xl font-bold">
              Offer a Ride
            </h2>

            <p className="mt-3 text-gray-600">
              Post your commute and offer your extra seats.
            </p>
          </button>

          <button
            onClick={() => router.push("/my-requests")}
            className="rounded-3xl bg-white p-8 text-left shadow transition hover:-translate-y-1 hover:shadow-lg"
          >
            <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Passenger
            </p>

            <h2 className="mt-3 text-2xl font-bold">
              My Requests
            </h2>

            <p className="mt-3 text-gray-600">
              Track pending, accepted, declined, and cancelled requests.
            </p>
          </button>

          <button
            onClick={() => router.push("/driver")}
            className="rounded-3xl bg-white p-8 text-left shadow transition hover:-translate-y-1 hover:shadow-lg"
          >
            <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Driver
            </p>

            <h2 className="mt-3 text-2xl font-bold">
              Driver Dashboard
            </h2>

            <p className="mt-3 text-gray-600">
              Manage your posted rides and passenger requests.
            </p>
          </button>
        </div>
      </section>
    </main>
  );
}