"use client";

import { useEffect } from "react";

import L from "leaflet";

import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

type Point = {
  lat: number;
  lon: number;
  label: string;
};

type Props = {
  route: number[][];
  alternateRoute?: number[][];
  origin?: Point | null;
  destination?: Point | null;
  pickup?: Point | null;
};

function FitRoutes({
  route,
  alternateRoute,
}: {
  route: number[][];
  alternateRoute: number[][];
}) {
  const map = useMap();

  useEffect(() => {
    const allPoints = [
      ...route,
      ...alternateRoute,
    ];

    if (allPoints.length < 2) {
      return;
    }

    const bounds = L.latLngBounds(
      allPoints.map((point) => [
        point[0],
        point[1],
      ])
    );

    map.fitBounds(bounds, {
      padding: [35, 35],
    });
  }, [
    map,
    route,
    alternateRoute,
  ]);

  return null;
}

export default function RouteMapInner({
  route,
  alternateRoute = [],
  origin,
  destination,
  pickup,
}: Props) {
  const firstPoint =
    route.length > 0
      ? route[0]
      : alternateRoute.length > 0
        ? alternateRoute[0]
        : [43.0096, -81.2737];

  const initialCenter: [
    number,
    number
  ] = [
    firstPoint[0],
    firstPoint[1],
  ];

  return (
    <MapContainer
      center={initialCenter}
      zoom={10}
      style={{
        width: "100%",
        height: "100%",
      }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {route.length > 1 && (
        <Polyline
          positions={route.map(
            (point) => [
              point[0],
              point[1],
            ]
          )}
          pathOptions={{
            color: "#4f2683",
            weight: 6,
          }}
        />
      )}

      {alternateRoute.length > 1 && (
        <Polyline
          positions={alternateRoute.map(
            (point) => [
              point[0],
              point[1],
            ]
          )}
          pathOptions={{
            color: "#2563eb",
            weight: 5,
            dashArray: "10 8",
          }}
        />
      )}

      <FitRoutes
        route={route}
        alternateRoute={
          alternateRoute
        }
      />

      {origin && (
        <CircleMarker
          center={[
            origin.lat,
            origin.lon,
          ]}
          radius={9}
          pathOptions={{
            color: "#4f2683",
            fillColor: "#4f2683",
            fillOpacity: 1,
          }}
        >
          <Popup>
            <strong>
              Driver Start
            </strong>

            <br />

            {origin.label}
          </Popup>
        </CircleMarker>
      )}

      {pickup && (
        <CircleMarker
          center={[
            pickup.lat,
            pickup.lon,
          ]}
          radius={9}
          pathOptions={{
            color: "#2563eb",
            fillColor: "#2563eb",
            fillOpacity: 1,
          }}
        >
          <Popup>
            <strong>
              Passenger Pickup
            </strong>

            <br />

            {pickup.label}
          </Popup>
        </CircleMarker>
      )}

      {destination && (
        <CircleMarker
          center={[
            destination.lat,
            destination.lon,
          ]}
          radius={9}
          pathOptions={{
            color: "#16a34a",
            fillColor: "#16a34a",
            fillOpacity: 1,
          }}
        >
          <Popup>
            <strong>
              Destination
            </strong>

            <br />

            {destination.label}
          </Popup>
        </CircleMarker>
      )}
    </MapContainer>
  );
}