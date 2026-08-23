"use client";

import { useRouter } from "next/navigation";


export default function HomePage() {
  const router = useRouter();


  return (
    <main className="min-h-screen bg-gray-100">

      <nav className="flex items-center justify-between bg-white px-8 py-5">

        <h1 className="text-2xl font-bold">
          Western Rideshare
        </h1>

        <div className="flex gap-3">

          <button
            onClick={() =>
              router.push("/login")
            }
            className="rounded-lg border px-5 py-2"
          >
            Log In
          </button>

          <button
            onClick={() =>
              router.push("/register")
            }
            className="rounded-lg bg-black px-5 py-2 text-white"
          >
            Sign Up
          </button>

        </div>

      </nav>


      <section className="mx-auto flex min-h-[80vh] max-w-6xl items-center px-6">

        <div className="max-w-3xl">

          <h2 className="text-6xl font-bold leading-tight">
            Share rides.
            <br />
            Save money.
            <br />
            Reduce traffic.
          </h2>

          <p className="mt-6 max-w-xl text-xl text-gray-600">
            A rideshare platform built for university
            students commuting to Western.
          </p>

          <div className="mt-8 flex gap-4">

            <button
              onClick={() =>
                router.push("/register")
              }
              className="rounded-lg bg-black px-7 py-4 font-semibold text-white"
            >
              Get Started
            </button>

            <button
              onClick={() =>
                router.push("/rides")
              }
              className="rounded-lg border px-7 py-4 font-semibold"
            >
              Browse Rides
            </button>

          </div>

        </div>

      </section>

    </main>
  );
}