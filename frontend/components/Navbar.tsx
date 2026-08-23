"use client";

import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  return (
    <nav className="flex items-center justify-between border-b bg-white px-8 py-4">
      <button
        onClick={() => router.push("/dashboard")}
        className="text-2xl font-bold"
      >
        Western Rideshare
      </button>

      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/rides")}
          className="rounded-lg px-4 py-2 hover:bg-gray-100"
        >
          Find Ride
        </button>

        <button
          onClick={() => router.push("/rides/create")}
          className="rounded-lg px-4 py-2 hover:bg-gray-100"
        >
          Offer Ride
        </button>

        <button
          onClick={() => router.push("/my-requests")}
          className="rounded-lg px-4 py-2 hover:bg-gray-100"
        >
          My Requests
        </button>

        <button
          onClick={() => router.push("/driver")}
          className="rounded-lg px-4 py-2 hover:bg-gray-100"
        >
          Driver
        </button>

        <button
          onClick={logout}
          className="rounded-lg bg-black px-4 py-2 text-white"
        >
          Log Out
        </button>
      </div>
    </nav>
  );
}