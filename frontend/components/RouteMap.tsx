"use client";

import dynamic from "next/dynamic";

const RouteMapInner = dynamic(
  () => import("./RouteMapInner"),
  {
    ssr: false,
  }
);

type Point = {
  lat: number;
  lon: number;
  label: string;
};

type RouteMapProps = {
  route: number[][];
  alternateRoute?: number[][];
  origin?: Point | null;
  destination?: Point | null;
  pickup?: Point | null;
  height?: string;
};

export default function RouteMap({
  route,
  alternateRoute = [],
  origin,
  destination,
  pickup,
  height = "400px",
}: RouteMapProps) {
  return (
    <div
      className="overflow-hidden rounded-3xl border border-gray-200"
      style={{
        height,
      }}
    >
      <RouteMapInner
        route={route}
        alternateRoute={alternateRoute}
        origin={origin}
        destination={destination}
        pickup={pickup}
      />
    </div>
  );
}