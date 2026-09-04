"use client";

import { FormEvent, useEffect, useState } from "react";

import Navbar from "@/components/Navbar";
import { apiRequest } from "@/lib/api";

type User = {
  id: number;
  name: string;
  email: string;
  western_verified: boolean;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await apiRequest("/me");

        setUser(data);
        setName(data.name);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        }
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const data = await apiRequest("/me", {
        method: "PATCH",
        body: JSON.stringify({
          name,
        }),
      });

      setUser(data.user);

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      setMessage("Profile updated successfully.");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen">
        <Navbar />

        <div className="mx-auto max-w-4xl px-6 py-12">
          Loading profile...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <Navbar />

      <section className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4f2683]">
          Account
        </p>

        <h1 className="mt-2 text-4xl font-bold">
          Your Profile
        </h1>

        <div className="mt-8 grid gap-6 md:grid-cols-[1fr_2fr]">

          <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#4f2683] text-2xl font-bold text-white">
              {user?.name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>

            <h2 className="mt-5 text-xl font-bold">
              {user?.name}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {user?.email}
            </p>

            {user?.western_verified && (
              <div className="mt-5 rounded-xl bg-green-50 p-3 text-sm font-medium text-green-700">
                Western email verified
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold">
              Profile Information
            </h2>

            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-5"
            >
              <div>
                <label className="text-sm font-semibold">
                  Name
                </label>

                <input
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#4f2683]"
                />
              </div>

              <div>
                <label className="text-sm font-semibold">
                  Western Email
                </label>

                <input
                  value={user?.email || ""}
                  disabled
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-gray-500"
                />
              </div>

              {message && (
                <div className="rounded-xl bg-green-50 p-4 text-green-700">
                  {message}
                </div>
              )}

              {error && (
                <div className="rounded-xl bg-red-50 p-4 text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#4f2683] px-6 py-3 font-semibold text-white hover:bg-[#35165c]"
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </form>
          </div>

        </div>
      </section>
    </main>
  );
}