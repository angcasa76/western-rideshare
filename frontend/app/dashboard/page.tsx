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
      <main className="min-h-screen">
        <Navbar />

        <div className="mx-auto max-w-6xl px-6 py-12">
          <p className="text-gray-500">
            Loading dashboard...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <Navbar />

      <section className="mx-auto max-w-6xl px-6 py-10">

        <div className="overflow-hidden rounded-[2rem] bg-[#4f2683] px-8 py-12 text-white shadow-lg md:px-12 md:py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-200">
            Western Rideshare
          </p>

          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
            Welcome back, {user?.name}.
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-purple-100">
            Share your commute with other students, lower
            transportation costs, and help reduce the number
            of single-occupancy vehicles travelling to campus.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => router.push("/rides")}
              className="rounded-xl bg-white px-6 py-3 font-semibold text-[#4f2683] hover:bg-purple-50"
            >
              Find a Ride
            </button>

            <button
              onClick={() => router.push("/rides/create")}
              className="rounded-xl border border-purple-300 px-6 py-3 font-semibold text-white hover:bg-white/10"
            >
              Offer a Ride
            </button>
          </div>
        </div>

        <div className="mt-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4f2683]">
            Your rideshare
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            What would you like to do?
          </h2>
        </div>

        <div className="mt-7 grid gap-5 md:grid-cols-2">

          <button
            onClick={() => router.push("/rides")}
            className="group rounded-3xl border border-gray-200 bg-white p-7 text-left shadow-sm hover:-translate-y-1 hover:border-purple-200 hover:shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f1ebf7] text-xl font-bold text-[#4f2683]">
              A
            </div>

            <h3 className="mt-6 text-2xl font-bold">
              Find a Ride
            </h3>

            <p className="mt-2 leading-7 text-gray-600">
              Search available trips and request a seat
              from another Western student.
            </p>

            <p className="mt-6 font-semibold text-[#4f2683]">
              Browse rides →
            </p>
          </button>

          <button
            onClick={() => router.push("/rides/create")}
            className="group rounded-3xl border border-gray-200 bg-white p-7 text-left shadow-sm hover:-translate-y-1 hover:border-purple-200 hover:shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f1ebf7] text-xl font-bold text-[#4f2683]">
              B
            </div>

            <h3 className="mt-6 text-2xl font-bold">
              Offer a Ride
            </h3>

            <p className="mt-2 leading-7 text-gray-600">
              Driving to campus? Post your trip and make
              your unused seats available.
            </p>

            <p className="mt-6 font-semibold text-[#4f2683]">
              Create a ride →
            </p>
          </button>

          <button
            onClick={() => router.push("/my-requests")}
            className="group rounded-3xl border border-gray-200 bg-white p-7 text-left shadow-sm hover:-translate-y-1 hover:border-purple-200 hover:shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f1ebf7] text-xl font-bold text-[#4f2683]">
              C
            </div>

            <h3 className="mt-6 text-2xl font-bold">
              My Requests
            </h3>

            <p className="mt-2 leading-7 text-gray-600">
              Check whether your ride requests are pending,
              accepted, declined, or cancelled.
            </p>

            <p className="mt-6 font-semibold text-[#4f2683]">
              View requests →
            </p>
          </button>

          <button
            onClick={() => router.push("/driver")}
            className="group rounded-3xl border border-gray-200 bg-white p-7 text-left shadow-sm hover:-translate-y-1 hover:border-purple-200 hover:shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f1ebf7] text-xl font-bold text-[#4f2683]">
              D
            </div>

            <h3 className="mt-6 text-2xl font-bold">
              Driver Dashboard
            </h3>

            <p className="mt-2 leading-7 text-gray-600">
              Manage your posted trips and respond to
              incoming passenger requests.
            </p>

            <p className="mt-6 font-semibold text-[#4f2683]">
              Manage rides →
            </p>
          </button>

        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">

          <div className="rounded-3xl border border-gray-200 bg-white p-6">
            <p className="text-sm font-semibold text-gray-500">
              SAVE MONEY
            </p>

            <p className="mt-2 text-lg font-bold">
              Split commuting costs
            </p>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6">
            <p className="text-sm font-semibold text-gray-500">
              MEET STUDENTS
            </p>

            <p className="mt-2 text-lg font-bold">
              Travel with your campus community
            </p>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6">
            <p className="text-sm font-semibold text-gray-500">
              DRIVE LESS
            </p>

            <p className="mt-2 text-lg font-bold">
              Reduce single-occupancy trips
            </p>
          </div>

        </div>

      </section>
    </main>
  );
}