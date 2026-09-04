"use client";

import { usePathname, useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    router.push("/login");
  }

  function navStyle(path: string) {
    const active = pathname === path;

    return active
      ? "rounded-xl bg-[#f1ebf7] px-4 py-2 font-semibold text-[#4f2683]"
      : "rounded-xl px-4 py-2 font-medium text-gray-600 hover:bg-gray-100 hover:text-black";
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <button
          onClick={() =>
            router.push("/dashboard")
          }
          className="flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4f2683] font-bold text-white">
            WR
          </div>

          <div className="hidden text-left sm:block">
            <p className="font-bold leading-tight">
              Western Rideshare
            </p>

            <p className="text-xs text-gray-500">
              Campus commuting
            </p>
          </div>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() =>
              router.push("/rides")
            }
            className={navStyle("/rides")}
          >
            Find Ride
          </button>

          <button
            onClick={() =>
              router.push("/rides/create")
            }
            className={navStyle("/rides/create")}
          >
            Offer Ride
          </button>

          <button
            onClick={() =>
              router.push("/my-requests")
            }
            className={navStyle("/my-requests")}
          >
            My Requests
          </button>

          <button
            onClick={() =>
              router.push("/driver")
            }
            className={navStyle("/driver")}
          >
            Driver
          </button>

          <button
            onClick={() =>
              router.push("/impact")
            }
            className={navStyle("/impact")}
          >
            Impact
          </button>

          <button
            onClick={() =>
              router.push("/profile")
            }
            className={navStyle("/profile")}
          >
            Profile
          </button>

          <button
            onClick={logout}
            className="ml-2 rounded-xl bg-[#4f2683] px-4 py-2 font-semibold text-white hover:bg-[#35165c]"
          >
            Log Out
          </button>
        </div>
      </div>
    </nav>
  );
}