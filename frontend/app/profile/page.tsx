"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import Navbar from "@/components/Navbar";

import {
  apiRequest,
} from "@/lib/api";


type User = {
  id: number;
  name: string;
  email: string;
  western_verified: boolean;

  vehicle_year:
    number | null;

  vehicle_make:
    string | null;

  vehicle_model:
    string | null;

  vehicle_color:
    string | null;

  license_plate:
    string | null;

  rating_average:
    number | null;

  rating_count:
    number;
};


export default function ProfilePage() {
  const [
    user,
    setUser,
  ] =
    useState<User | null>(
      null
    );


  const [
    name,
    setName,
  ] =
    useState("");


  const [
    vehicleYear,
    setVehicleYear,
  ] =
    useState("");


  const [
    vehicleMake,
    setVehicleMake,
  ] =
    useState("");


  const [
    vehicleModel,
    setVehicleModel,
  ] =
    useState("");


  const [
    vehicleColor,
    setVehicleColor,
  ] =
    useState("");


  const [
    licensePlate,
    setLicensePlate,
  ] =
    useState("");


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    saving,
    setSaving,
  ] =
    useState(false);


  const [
    message,
    setMessage,
  ] =
    useState("");


  const [
    error,
    setError,
  ] =
    useState("");


  useEffect(
    () => {

      async function loadProfile() {
        try {

          const data:
            User =
            await apiRequest(
              "/me"
            );


          setUser(
            data
          );


          setName(
            data.name
          );


          setVehicleYear(
            data.vehicle_year
              ? String(
                  data.vehicle_year
                )
              : ""
          );


          setVehicleMake(
            data.vehicle_make ??
            ""
          );


          setVehicleModel(
            data.vehicle_model ??
            ""
          );


          setVehicleColor(
            data.vehicle_color ??
            ""
          );


          setLicensePlate(
            data.license_plate ??
            ""
          );

        } catch (
          error
        ) {

          if (
            error instanceof Error
          ) {
            setError(
              error.message
            );
          }

        } finally {

          setLoading(
            false
          );
        }
      }


      loadProfile();

    },
    []
  );


  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {

    event.preventDefault();


    setSaving(
      true
    );


    setMessage(
      ""
    );


    setError(
      ""
    );


    const year =
      vehicleYear.trim()
        ? Number(
            vehicleYear
          )
        : null;


    if (
      year !== null &&
      (
        Number.isNaN(
          year
        ) ||
        year < 1980 ||
        year > 2100
      )
    ) {

      setSaving(
        false
      );


      setError(
        "Enter a valid vehicle year."
      );


      return;
    }


    try {

      const data =
        await apiRequest(
          "/me",
          {
            method:
              "PATCH",

            body:
              JSON.stringify({
                name,

                vehicle_year:
                  year,

                vehicle_make:
                  vehicleMake
                    .trim() ||
                  null,

                vehicle_model:
                  vehicleModel
                    .trim() ||
                  null,

                vehicle_color:
                  vehicleColor
                    .trim() ||
                  null,

                license_plate:
                  licensePlate
                    .trim() ||
                  null,
              }),
          }
        );


      setUser(
        data.user
      );


      localStorage.setItem(
        "user",
        JSON.stringify(
          data.user
        )
      );


      setMessage(
        "Profile and vehicle information updated."
      );

    } catch (
      error
    ) {

      if (
        error instanceof Error
      ) {
        setError(
          error.message
        );
      }

    } finally {

      setSaving(
        false
      );
    }
  }


  if (
    loading
  ) {
    return (
      <main className="min-h-screen bg-gray-50">

        <Navbar />

        <div className="mx-auto max-w-5xl px-6 py-12">
          Loading profile...
        </div>

      </main>
    );
  }


  return (
    <main className="min-h-screen bg-gray-50">

      <Navbar />


      <section className="mx-auto max-w-5xl px-6 py-12">

        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4f2683]">
          Account
        </p>


        <h1 className="mt-2 text-4xl font-bold text-gray-950">
          Your Profile
        </h1>


        <p className="mt-2 text-gray-600">
          Keep your driver information current so accepted passengers know what car to look for.
        </p>


        <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">

          <aside className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#4f2683] text-2xl font-bold text-white">

              {
                user?.name
                  .split(
                    " "
                  )
                  .map(
                    (
                      part
                    ) =>
                      part[0]
                  )
                  .join(
                    ""
                  )
                  .slice(
                    0,
                    2
                  )
                  .toUpperCase()
              }

            </div>


            <h2 className="mt-5 text-xl font-bold">
              {user?.name}
            </h2>


            <p className="mt-1 text-sm text-gray-500">
              {user?.email}
            </p>


            {
              user
                ?.western_verified &&
              (
                <div className="mt-5 rounded-xl bg-green-50 p-3 text-sm font-medium text-green-700">
                  Western email verified
                </div>
              )
            }


            <div className="mt-5 rounded-2xl bg-[#f7f2fb] p-4">

              <p className="text-xs font-semibold uppercase tracking-wide text-[#4f2683]">
                Community rating
              </p>


              <p className="mt-2 text-2xl font-bold text-gray-950">

                {
                  user
                    ?.rating_average
                    ? `${
                        user
                          .rating_average
                          .toFixed(
                            1
                          )
                      } ★`
                    : "No ratings yet"
                }

              </p>


              <p className="mt-1 text-sm text-gray-500">

                {
                  user
                    ?.rating_count ??
                  0
                } rating{
                  user
                    ?.rating_count ===
                  1
                    ? ""
                    : "s"
                }

              </p>

            </div>

          </aside>


          <form
            onSubmit={
              handleSubmit
            }
            className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm"
          >

            <div>

              <h2 className="text-2xl font-bold">
                Profile Information
              </h2>


              <p className="mt-1 text-sm text-gray-500">
                Your licence plate is only shown to passengers after their request is accepted.
              </p>

            </div>


            <div className="mt-6 grid gap-5 sm:grid-cols-2">

              <div className="sm:col-span-2">

                <label className="text-sm font-semibold">
                  Name
                </label>


                <input
                  value={
                    name
                  }

                  onChange={(
                    event
                  ) =>
                    setName(
                      event
                        .target
                        .value
                    )
                  }

                  required

                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#4f2683]"
                />

              </div>


              <div className="sm:col-span-2">

                <label className="text-sm font-semibold">
                  Western Email
                </label>


                <input
                  value={
                    user
                      ?.email ||
                    ""
                  }

                  disabled

                  className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-gray-500"
                />

              </div>


              <div>

                <label className="text-sm font-semibold">
                  Vehicle Year
                </label>


                <input
                  type="number"

                  min="1980"

                  max="2100"

                  value={
                    vehicleYear
                  }

                  onChange={(
                    event
                  ) =>
                    setVehicleYear(
                      event
                        .target
                        .value
                    )
                  }

                  placeholder="2022"

                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#4f2683]"
                />

              </div>


              <div>

                <label className="text-sm font-semibold">
                  Make
                </label>


                <input
                  value={
                    vehicleMake
                  }

                  onChange={(
                    event
                  ) =>
                    setVehicleMake(
                      event
                        .target
                        .value
                    )
                  }

                  placeholder="Toyota"

                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#4f2683]"
                />

              </div>


              <div>

                <label className="text-sm font-semibold">
                  Model
                </label>


                <input
                  value={
                    vehicleModel
                  }

                  onChange={(
                    event
                  ) =>
                    setVehicleModel(
                      event
                        .target
                        .value
                    )
                  }

                  placeholder="Corolla"

                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#4f2683]"
                />

              </div>


              <div>

                <label className="text-sm font-semibold">
                  Colour
                </label>


                <input
                  value={
                    vehicleColor
                  }

                  onChange={(
                    event
                  ) =>
                    setVehicleColor(
                      event
                        .target
                        .value
                    )
                  }

                  placeholder="Black"

                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#4f2683]"
                />

              </div>


              <div className="sm:col-span-2">

                <label className="text-sm font-semibold">
                  Licence Plate
                </label>


                <input
                  value={
                    licensePlate
                  }

                  onChange={(
                    event
                  ) =>
                    setLicensePlate(
                      event
                        .target
                        .value
                    )
                  }

                  placeholder="ABCD 123"

                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 uppercase outline-none focus:border-[#4f2683]"
                />

              </div>

            </div>


            {
              message &&
              (
                <div className="mt-6 rounded-xl bg-green-50 p-4 text-green-700">
                  {message}
                </div>
              )
            }


            {
              error &&
              (
                <div className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">
                  {error}
                </div>
              )
            }


            <button
              type="submit"

              disabled={
                saving
              }

              className="mt-6 rounded-xl bg-[#4f2683] px-6 py-3 font-semibold text-white hover:bg-[#35165c] disabled:opacity-60"
            >

              {
                saving
                  ? "Saving..."
                  : "Save Changes"
              }

            </button>

          </form>

        </div>

      </section>

    </main>
  );
}