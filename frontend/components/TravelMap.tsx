"use client";

import "leaflet/dist/leaflet.css";

import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import { useEffect, useState } from "react";

type MapPlace = {
  name: string;
  latitude?: number;
  longitude?: number;
  type: "destination" | "hotel" | "restaurant";
  rating?: number;
  price?: number;
  address?: string;
};

type TravelMapProps = {
  destination: string;
  latitude?: number;
  longitude?: number;
  hotels?: MapPlace[];
  restaurants?: MapPlace[];
};

function MapBounds({
  places,
}: {
  places: MapPlace[];
}) {
  const map = useMap();

  useEffect(() => {
    const valid = places.filter(
      (place) =>
        typeof place.latitude === "number" &&
        typeof place.longitude === "number"
    );

    if (valid.length <= 1) return;

    const bounds = L.latLngBounds(
      valid.map((place) => [
        place.latitude!,
        place.longitude!,
      ])
    );

    map.fitBounds(bounds, {
      padding: [60, 60],
      maxZoom: 13,
    });
  }, [map, places]);

  return null;
}

function createMarker(
  type: MapPlace["type"]
) {
  const symbol =
    type === "destination"
      ? "✦"
      : type === "hotel"
      ? "⌂"
      : "●";

  const background =
    type === "destination"
      ? "#171717"
      : type === "hotel"
      ? "#927a5a"
      : "#9b654c";

  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:40px;
        height:40px;
        border-radius:999px;
        background:${background};
        border:3px solid white;
        box-shadow:0 8px 30px rgba(0,0,0,.3);
        display:flex;
        align-items:center;
        justify-content:center;
        color:white;
        font-size:17px;
        font-weight:600;
      ">
        ${symbol}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

export default function TravelMap({
  destination,
  latitude: initialLatitude,
  longitude: initialLongitude,
  hotels = [],
  restaurants = [],
}: TravelMapProps) {
  const [coordinates, setCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(
    typeof initialLatitude === "number" &&
      typeof initialLongitude === "number"
      ? {
          latitude: initialLatitude,
          longitude: initialLongitude,
        }
      : null
  );

  const [loading, setLoading] = useState(
    !coordinates
  );

  const [error, setError] = useState(false);

  /*
   * FALLBACK GEOCODING
   *
   * The map no longer depends on weather.
   */
  useEffect(() => {
    if (coordinates) {
      setLoading(false);
      return;
    }

    if (!destination?.trim()) {
      setLoading(false);
      setError(true);
      return;
    }

    let cancelled = false;

    async function findDestination() {
      try {
        setLoading(true);
        setError(false);

        const response = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            destination
          )}&count=1&language=en&format=json`
        );

        if (!response.ok) {
          throw new Error(
            "Geocoding failed"
          );
        }

        const data =
          await response.json();

        const location =
          data?.results?.[0];

        if (
          !location ||
          typeof location.latitude !==
            "number" ||
          typeof location.longitude !==
            "number"
        ) {
          throw new Error(
            "Destination coordinates not found"
          );
        }

        if (!cancelled) {
          setCoordinates({
            latitude: location.latitude,
            longitude: location.longitude,
          });
        }
      } catch (err) {
        console.error(
          "Travel map geocoding error:",
          err
        );

        if (!cancelled) {
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    findDestination();

    return () => {
      cancelled = true;
    };
  }, [
    destination,
    coordinates,
  ]);

  if (loading) {
    return (
      <div className="flex h-[520px] items-center justify-center overflow-hidden rounded-[2rem] bg-[#111111] text-white">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-2xl animate-pulse">
            🗺️
          </div>

          <p className="mt-5 text-sm font-medium">
            Preparing your journey map
          </p>

          <p className="mt-2 text-xs text-white/40">
            Locating {destination}...
          </p>
        </div>
      </div>
    );
  }

  if (error || !coordinates) {
    return (
      <div className="flex h-[520px] items-center justify-center overflow-hidden rounded-[2rem] bg-[#111111] text-white">
        <div className="max-w-sm px-6 text-center">
          <div className="text-4xl">
            🗺️
          </div>

          <h3 className="mt-5 text-xl font-semibold">
            Map unavailable
          </h3>

          <p className="mt-2 text-sm leading-6 text-white/40">
            We couldn't locate {destination} right
            now. Your travel plan is still available.
          </p>
        </div>
      </div>
    );
  }

  const destinationPlace: MapPlace = {
    name: destination,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    type: "destination",
  };

  const places = [
    destinationPlace,
    ...hotels,
    ...restaurants,
  ];

  const validPlaces = places.filter(
    (place) =>
      typeof place.latitude === "number" &&
      typeof place.longitude === "number"
  );

  return (
    <div className="relative h-[520px] w-full overflow-hidden rounded-[2rem] border border-black/[0.07] bg-[#111111] shadow-[0_30px_100px_rgba(0,0,0,0.12)]">

      <MapContainer
        center={[
          coordinates.latitude,
          coordinates.longitude,
        ]}
        zoom={11}
        scrollWheelZoom={false}
        className="h-full w-full"
      >

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBounds
          places={validPlaces}
        />

        {validPlaces.map(
          (place, index) => (
            <Marker
              key={`${place.type}-${place.name}-${index}`}
              position={[
                place.latitude!,
                place.longitude!,
              ]}
              icon={createMarker(
                place.type
              )}
            >
              <Popup>
                <div className="min-w-[190px]">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#927a5a]">
                    {place.type}
                  </p>

                  <h3 className="mt-2 text-base font-semibold">
                    {place.name}
                  </h3>

                  {place.rating !==
                    undefined && (
                    <p className="mt-2 text-sm">
                      ★{" "}
                      {place.rating.toFixed(
                        1
                      )}
                    </p>
                  )}

{place.price != null && (
  <p className="mt-1 text-sm text-gray-500">
    ₹
    {Number(place.price).toLocaleString("en-IN")} / night
  </p>
)}

                  {place.address && (
                    <p className="mt-2 text-xs leading-5 text-gray-500">
                      {place.address}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        )}

      </MapContainer>

      {/* TOP LABEL */}

      <div className="pointer-events-none absolute left-5 top-5 z-[500]">
        <div className="rounded-full border border-white/15 bg-black/60 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-xl">
          {destination} · Explore
        </div>
      </div>

      {/* LEGEND */}

      <div className="absolute bottom-5 left-5 z-[500] flex flex-wrap gap-2">

        <div className="rounded-full border border-white/15 bg-black/65 px-3 py-2 text-xs text-white backdrop-blur-xl">
          ✦ Destination
        </div>

        {hotels.length > 0 && (
          <div className="rounded-full border border-white/15 bg-black/65 px-3 py-2 text-xs text-white backdrop-blur-xl">
            ⌂ Hotels
          </div>
        )}

        {restaurants.length > 0 && (
          <div className="rounded-full border border-white/15 bg-black/65 px-3 py-2 text-xs text-white backdrop-blur-xl">
            ● Dining
          </div>
        )}

      </div>

    </div>
  );
}