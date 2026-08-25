"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import TripCopilot from "../components/TripCopilot";

const VoyageGlobe = dynamic(
  () => import("../components/VoyageGlobe"),
  { ssr: false }
);

const TravelMap = dynamic(
  () => import("../components/TravelMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[520px] items-center justify-center rounded-[2rem] bg-[#171717] text-white">
        <div className="text-center">
          <div className="text-2xl animate-pulse">🗺️</div>
          <p className="mt-3 text-sm text-white/50">
            Preparing your map...
          </p>
        </div>
      </div>
    ),
  }
);

/* =========================================================
   TYPES
========================================================= */

type Hotel = {
  name?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  address?: string;
  price_per_night?: number;
  currency?: string;
  amenities?: string[];
  website?: string;
  image_url?: string;
  thumbnail?: string;
  hotel_link?: string;
};

type Restaurant = {
  name?: string;
  type?: string;
  rating?: number;
  reviews?: number;
  address?: string;
  cuisine?: string;
  price_level?: string;
  website?: string;
  image_url?: string;
  thumbnail?: string;
  maps_link?: string;
  latitude?: number;
  longitude?: number;
};

type ItineraryDay = {
  day?: number;
  title?: string;
  activities?: string[];
  description?: string;
  morning?: string;
  afternoon?: string;
  evening?: string;
  dining?: string;
  notes?: string;
};

type WeatherDay = {
  time?: string[];
  temperature_2m_max?: number[];
  temperature_2m_min?: number[];
  precipitation_probability_max?: number[];
  weather_code?: number[];
};

type WeatherData = {
  timezone?: string;
  timezone_abbreviation?: string;
  daily?: WeatherDay;
  latitude?: number;
  longitude?: number;
};

type UnsplashPhoto = {
  id: string;
  urls?: {
    regular?: string;
    full?: string;
    small?: string;
  };
  alt_description?: string | null;
  user?: {
    name?: string;
    links?: {
      html?: string;
    };
  };
};

type TripResult = {
  destination?: string;
  days?: number;
  travelers?: number;
  budget?: number;
  travel_style?: string;

  interests?: string[];
  food_preferences?: string;
  flight_class?: string;
  special_requests?: string;

  hotels?: Hotel[];
  hotel_recommendations?: Hotel[];
  hotel_alternatives?: Hotel[];

  restaurants?: Restaurant[];
  restaurant_recommendations?: Restaurant[];
  restaurant_alternatives?: Restaurant[];

  weather?: WeatherData;
  weather_summary?: string;

  itinerary?: ItineraryDay[];
  itinerary_summary?: string;

  budget_breakdown?: Record<string, number>;

  pdf_path?: string;

  [key: string]: unknown;
};

/* =========================================================
   CONFIG
========================================================= */

const BACKEND_URL = "http://127.0.0.1:8000";

const UNSPLASH_ACCESS_KEY =
  process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || "";

/* =========================================================
   HELPERS
========================================================= */

function formatCurrency(value?: number) {
  if (typeof value !== "number") {
    return "—";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function cleanArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function calculateTripDays(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;

  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  return Math.ceil(
    (end.getTime() - start.getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

function getHotels(trip: TripResult): Hotel[] {
  const possibleSources = [
    trip.hotels,
    trip.hotel_recommendations,
    trip.hotel_alternatives,

    // Handles nested recommendation responses
    (trip as any).recommendations?.hotels,
    (trip as any).recommendations?.hotel_recommendations,
    (trip as any).data?.hotels,
    (trip as any).data?.hotel_recommendations,
    (trip as any).result?.hotels,
    (trip as any).result?.hotel_recommendations,
  ];

  for (const source of possibleSources) {
    if (
      Array.isArray(source) &&
      source.length > 0
    ) {
      return source as Hotel[];
    }
  }

  return [];
}


function getRestaurants(trip: TripResult): Restaurant[] {
  const possibleSources = [
    trip.restaurants,
    trip.restaurant_recommendations,
    trip.restaurant_alternatives,

    // Handles nested recommendation responses
    (trip as any).recommendations?.restaurants,
    (trip as any).recommendations?.restaurant_recommendations,
    (trip as any).data?.restaurants,
    (trip as any).data?.restaurant_recommendations,
    (trip as any).result?.restaurants,
    (trip as any).result?.restaurant_recommendations,
  ];

  for (const source of possibleSources) {
    if (
      Array.isArray(source) &&
      source.length > 0
    ) {
      return source as Restaurant[];
    }
  }

  return [];
}

/* =========================================================
   WEATHER HELPERS
========================================================= */

function getWeatherIcon(code?: number) {
  if (code === undefined) {
    return "🌤️";
  }

  if (code === 0) return "☀️";
  if (code <= 3) return "🌤️";
  if (code <= 48) return "🌫️";
  if (code <= 57) return "🌦️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "❄️";
  if (code <= 82) return "🌧️";
  if (code <= 86) return "🌨️";
  return "⛈️";
}

function normalizeWeather(trip: TripResult | null): WeatherData | null {
  if (!trip?.weather) {
    return null;
  }

  const weather: any = trip.weather;

  if (weather.daily?.time) {
    return weather as WeatherData;
  }

  // Some backend versions may return the daily object directly.
  if (weather.time) {
    return {
      ...weather,
      daily: weather,
    };
  }

  // Handle common alternative field names.
  const daily = weather.daily;
  if (daily) {
    return {
      ...weather,
      daily: {
        time: daily.time || daily.dates || [],
        temperature_2m_max:
          daily.temperature_2m_max ||
          daily.temperature_max ||
          daily.max_temperature ||
          [],
        temperature_2m_min:
          daily.temperature_2m_min ||
          daily.temperature_min ||
          daily.min_temperature ||
          [],
        precipitation_probability_max:
          daily.precipitation_probability_max ||
          daily.precipitation_probability ||
          daily.rain_probability ||
          [],
        weather_code:
          daily.weather_code ||
          daily.weathercode ||
          [],
      },
    };
  }

  return null;
}

async function fetchWeatherFallback(
  destination: string,
  checkIn: string,
  checkOut: string
): Promise<WeatherData | null> {
  try {
    const geoResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        destination
      )}&count=1&language=en&format=json`
    );

    if (!geoResponse.ok) return null;

    const geo = await geoResponse.json();
    const location = geo?.results?.[0];

    if (!location) return null;

    const forecastResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&start_date=${checkIn}&end_date=${checkOut}`
    );

    if (!forecastResponse.ok) return null;

    const forecast = await forecastResponse.json();

    if (!forecast?.daily?.time?.length) return null;

    return {
      latitude: location.latitude,
      longitude: location.longitude,
      timezone: forecast.timezone,
      timezone_abbreviation:
        forecast.timezone_abbreviation,
      daily: {
        time: forecast.daily.time,
        temperature_2m_max:
          forecast.daily.temperature_2m_max,
        temperature_2m_min:
          forecast.daily.temperature_2m_min,
        precipitation_probability_max:
          forecast.daily.precipitation_probability_max,
        weather_code:
          forecast.daily.weather_code,
      },
    };
  } catch (error) {
    console.error("Weather fallback error:", error);
    return null;
  }
}

function formatWeatherDate(date?: string) {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/* =========================================================
   SCROLL REVEAL
========================================================= */

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;

    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(element);
        }
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -60px 0px",
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-12 opacity-0"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function Home() {
  /* =======================================================
     BACKEND
  ======================================================= */

  const [backendMessage, setBackendMessage] =
    useState("Connecting to VoyageAI...");

  /* =======================================================
     TRIP
  ======================================================= */

  const [trip, setTrip] =
    useState<TripResult | null>(null);

  /* =======================================================
     FORM
  ======================================================= */

  const [destination, setDestination] = useState("");
  const [days, setDays] = useState(5);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [travelers, setTravelers] = useState(2);
  const [budget, setBudget] = useState("");

  const [travelStyle, setTravelStyle] =
    useState("Luxury");

  const [interests, setInterests] =
    useState("");

  const [foodPreferences, setFoodPreferences] =
    useState("");

  const [flightClass, setFlightClass] =
    useState("Economy");

  const [specialRequests, setSpecialRequests] =
    useState("");

  /* =======================================================
     LOADING
  ======================================================= */

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingSteps = [
    "Understanding your preferences",
    "Finding the right stays",
    "Curating experiences",
    "Checking travel conditions",
    "Building your itinerary",
  ];

  /* =======================================================
     VOICE
  ======================================================= */

  const [voiceLoading, setVoiceLoading] =
    useState(false);

  /* =======================================================
     DESTINATION PHOTOS
  ======================================================= */

  const [destinationPhotos, setDestinationPhotos] =
    useState<UnsplashPhoto[]>([]);

  const [currentPhoto, setCurrentPhoto] =
    useState(0);

  const [photoLoading, setPhotoLoading] =
    useState(false);

  const [photoError, setPhotoError] =
    useState(false);

  const [weatherFallback, setWeatherFallback] =
    useState<WeatherData | null>(null);

  /* =======================================================
     BACKEND HEALTH CHECK
  ======================================================= */

  useEffect(() => {
    fetch(`${BACKEND_URL}/`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Backend unavailable");
        }

        return response.json();
      })
      .then((data) => {
        setBackendMessage(
          data.message || "VoyageAI backend connected"
        );
      })
      .catch(() => {
        setBackendMessage(
          "Backend not connected"
        );
      });
  }, []);

  /* =======================================================
     LOADING ANIMATION
  ======================================================= */

  useEffect(() => {
    if (!loading) {
      setLoadingStep(0);
      return;
    }

    const interval = setInterval(() => {
      setLoadingStep(
        (previous) =>
          (previous + 1) %
          loadingSteps.length
      );
    }, 2200);

    return () => clearInterval(interval);
  }, [loading]);

  /* =======================================================
     UNSPLASH SEARCH
  ======================================================= */

  const fetchDestinationPhotos = async (
    place: string
  ) => {
    if (!place.trim()) {
      return;
    }

    if (!UNSPLASH_ACCESS_KEY) {
      console.warn(
        "NEXT_PUBLIC_UNSPLASH_ACCESS_KEY is missing."
      );

      setDestinationPhotos([]);
      return;
    }

    setPhotoLoading(true);
    setPhotoError(false);
    setCurrentPhoto(0);

    try {
      const query = encodeURIComponent(
        `${place.trim()} travel`
      );

      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${query}&per_page=8&orientation=landscape`,
        {
          headers: {
            Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Unsplash error: ${response.status}`
        );
      }

      const data = await response.json();

      const photos: UnsplashPhoto[] =
        cleanArray<UnsplashPhoto>(
          data.results
        ).filter(
          (photo) =>
            Boolean(photo.urls?.regular)
        );

      if (photos.length === 0) {
        setPhotoError(true);
        setDestinationPhotos([]);
      } else {
        setDestinationPhotos(photos);
      }
    } catch (error) {
      console.error(
        "Destination photo error:",
        error
      );

      setDestinationPhotos([]);
      setPhotoError(true);
    } finally {
      setPhotoLoading(false);
    }
  };

  /* =======================================================
     AUTOMATIC PHOTO SLIDER
  ======================================================= */

  useEffect(() => {
    if (destinationPhotos.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentPhoto(
        (previous) =>
          (previous + 1) %
          destinationPhotos.length
      );
    }, 4500);

    return () => clearInterval(interval);
  }, [destinationPhotos]);

  /* =======================================================
     GENERATE TRIP
  ======================================================= */

  const generateTrip = async () => {
    if (!destination.trim()) {
      alert("Please enter a destination.");
      return;
    }

    if (!budget.trim()) {
      alert("Please enter your budget.");
      return;
    }

    if (!checkIn || !checkOut) {
      alert("Please select both check-in and check-out dates.");
      return;
    }

    const calculatedDays = calculateTripDays(checkIn, checkOut);

    if (calculatedDays < 1) {
      alert("Check-out must be after check-in.");
      return;
    }

    if (calculatedDays > 60) {
      alert("Trip duration cannot be more than 60 days.");
      return;
    }

    setDays(calculatedDays);

    if (travelers < 1) {
      alert(
        "There must be at least 1 traveler."
      );
      return;
    }

    setLoading(true);
    setTrip(null);

    const interestList = interests
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const userPrompt = `
Plan a ${calculatedDays}-day ${travelStyle.toLowerCase()} trip to ${destination}
from ${checkIn} to ${checkOut}
for ${travelers} travelers with a budget of ₹${budget}.

Interests:
${
  interestList.length
    ? interestList.join(", ")
    : "No specific interests"
}

Food preferences:
${
  foodPreferences ||
  "No specific food preferences"
}

Flight class:
${flightClass}

Special requests:
${
  specialRequests ||
  "No special requests"
}
`;

    try {
      /* -----------------------------------------------
         START PHOTO SEARCH IN PARALLEL
      ------------------------------------------------ */

      const photoPromise =
        fetchDestinationPhotos(
          destination.trim()
        );

      /* -----------------------------------------------
         BACKEND PLANNER
      ------------------------------------------------ */

      const response = await fetch(
        `${BACKEND_URL}/planner/plan`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            user_prompt: userPrompt,

            destination:
              destination.trim(),

            days: calculatedDays,

            check_in: checkIn,
            check_out: checkOut,

            travelers,

            budget: Number(budget),

            travel_style:
              travelStyle,

            interests:
              interestList,

            food_preferences:
              foodPreferences,

            flight_class:
              flightClass,

            special_requests:
              specialRequests,
          }),
        }
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Planner error:",
          errorText
        );

        throw new Error(
          `Planner returned ${response.status}`
        );
      }

      const data: TripResult =
        await response.json();

      console.log(
        "VOYAGEAI RESPONSE:",
        data
      );

      setTrip(data);

      const backendWeather = normalizeWeather(data);

      if (backendWeather?.daily?.time?.length) {
        setWeatherFallback(null);
      } else {
        const fallbackWeather =
          await fetchWeatherFallback(
            destination.trim(),
            checkIn,
            checkOut
          );

        setWeatherFallback(
          fallbackWeather
        );
      }

      await photoPromise;
    } catch (error) {
  console.error(
    "Planning error:",
    error
  );

  setBackendMessage(
    "We couldn't create your journey right now. Please try again."
  );

  alert(
    "Unable to generate your journey. Please try again."
  );
} finally {
  setLoading(false);
}
  };

  /* =======================================================
     VOICE
  ======================================================= */

  const speakTrip = async () => {
    if (!trip) {
      return;
    }

    setVoiceLoading(true);

    try {
      const response = await fetch(
        `${BACKEND_URL}/planner/voice-confirmation`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            destination:
              trip.destination,

            days: trip.days,

            travelers:
              trip.travelers,

            travel_style:
              trip.travel_style,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Voice confirmation failed"
        );
      }

      const data =
        await response.json();

      if (
        typeof window ===
        "undefined"
      ) {
        return;
      }

      if (
        !(
          "speechSynthesis" in
          window
        )
      ) {
        alert(
          "Voice playback is not supported in this browser."
        );

        return;
      }

      window.speechSynthesis.cancel();

      const speech =
        new SpeechSynthesisUtterance(
          data.message
        );

      speech.rate = 0.92;
      speech.pitch = 1;
      speech.volume = 1;

      window.speechSynthesis.speak(
        speech
      );
    } catch (error) {
      console.error(
        "Voice error:",
        error
      );

      alert(
        "Unable to play trip confirmation."
      );
    } finally {
      setVoiceLoading(false);
    }
  };

  /* =======================================================
     PDF
  ======================================================= */

  const getPdfFilename = () => {
    if (trip?.pdf_path) {
      const path =
        String(trip.pdf_path);

      return (
        path
          .split(/[\\/]/)
          .pop() || ""
      );
    }

    const cleanDestination =
      (
        trip?.destination ||
        "Travel"
      )
        .replace(
          /[^a-zA-Z0-9]+/g,
          "_"
        )
        .replace(
          /^_+|_+$/g,
          ""
        );

    return `VoyageAI_${cleanDestination}_Travel_Plan.pdf`;
  };

  const downloadPdf = () => {
    if (!trip) {
      return;
    }

    const filename =
      getPdfFilename();

    const url =
      `${BACKEND_URL}/planner/pdf/${encodeURIComponent(
        filename
      )}`;

    window.open(
      url,
      "_blank"
    );
  };

  /* =======================================================
     RESET
  ======================================================= */

  const resetTrip = () => {
    setTrip(null);
    setDestinationPhotos([]);
    setCurrentPhoto(0);
    setPhotoError(false);
    setWeatherFallback(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =======================================================
     NORMALIZED DATA
  ======================================================= */

  const hotels = useMemo(
    () =>
      trip
        ? getHotels(trip)
        : [],
    [trip]
  );

  const restaurants = useMemo(
    () =>
      trip
        ? getRestaurants(trip)
        : [],
    [trip]
  );

  const normalizedWeather =
    normalizeWeather(trip);

  const weatherDaily =
    normalizedWeather?.daily?.time?.length
      ? normalizedWeather.daily
      : weatherFallback?.daily;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-screen bg-[#f5f4f1] text-[#171717]">

      {/* ===================================================
          NAVBAR
      =================================================== */}

      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-7 md:px-10">

        <button
          onClick={resetTrip}
          className="text-xl font-semibold tracking-tight"
        >
          Voyage
          <span className="text-[#927a5a]">
            AI
          </span>
        </button>

        <div className="hidden md:block">
          <div className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-medium text-gray-500">
            Your personal AI travel concierge
          </div>
        </div>

        <div className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-medium">
          ✦ AI POWERED
        </div>

      </nav>

      {/* ===================================================
          PLANNER FORM
      =================================================== */}

      {!trip && (
        <section className="mx-auto max-w-7xl px-6 pb-20 pt-14 md:px-10 md:pt-20">

          <div className="max-w-4xl">

            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#927a5a]">
              Intelligent travel planning
            </p>

            <h1 className="mt-5 text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
              Your next journey,
              <br />

              <span className="text-[#927a5a]">
                intelligently crafted.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-gray-500 md:text-xl">
              One destination. One beautifully planned journey.
              VoyageAI brings stays, dining, weather and experiences
              together around you.
            </p>

          </div>

          {/* 3D HERO */}

          <div className="mt-12 h-[520px] md:h-[620px]">
            <VoyageGlobe destination={destination || "Your next destination"} />
          </div>

          {/* FORM */}

          <div className="mt-7 rounded-[2rem] border border-black/10 bg-white p-6 shadow-[0_25px_80px_rgba(0,0,0,0.07)] md:p-9">

            {/* DESTINATION */}

            <div className="rounded-2xl bg-[#f5f4f1] p-6">

              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                Destination
              </label>

              <div className="mt-3 flex items-center gap-3">

                <span className="text-2xl">
                  🌍
                </span>

                <input
                  type="text"
                  value={destination}
                  onChange={(e) =>
                    setDestination(
                      e.target.value
                    )
                  }
                  placeholder="Where do you want to go?"
                  className="w-full bg-transparent text-xl font-medium outline-none placeholder:text-gray-400"
                />

              </div>

            </div>

            {/* BASIC INFO */}

            <div className="mt-5 grid gap-4 md:grid-cols-3">

              <div className="rounded-2xl border border-black/10 p-5">

                <label className="text-xs uppercase tracking-widest text-gray-400">
                  Check-in
                </label>

                <div className="mt-3">
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCheckIn(value);

                      if (checkOut) {
                        const nextDays = calculateTripDays(value, checkOut);
                        if (nextDays > 0) setDays(nextDays);
                      }
                    }}
                    className="w-full bg-transparent text-lg font-medium outline-none"
                  />
                </div>

              </div>

              <div className="rounded-2xl border border-black/10 p-5">

                <label className="text-xs uppercase tracking-widest text-gray-400">
                  Check-out
                </label>

                <div className="mt-3">
                  <input
                    type="date"
                    value={checkOut}
                    min={checkIn || undefined}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCheckOut(value);

                      if (checkIn) {
                        const nextDays = calculateTripDays(checkIn, value);
                        if (nextDays > 0) setDays(nextDays);
                      }
                    }}
                    className="w-full bg-transparent text-lg font-medium outline-none"
                  />
                </div>

              </div>

              <div className="rounded-2xl border border-black/10 p-5">

                <label className="text-xs uppercase tracking-widest text-gray-400">
                  Trip duration
                </label>

                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xl font-medium">
                    {checkIn && checkOut
                      ? calculateTripDays(checkIn, checkOut)
                      : "—"}
                  </span>

                  <span className="text-gray-400">
                    days
                  </span>
                </div>

              </div>

              <div className="rounded-2xl border border-black/10 p-5">

                <label className="text-xs uppercase tracking-widest text-gray-400">
                  Travelers
                </label>

                <div className="mt-3 flex items-center gap-2">

                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={travelers}
                    onChange={(e) =>
                      setTravelers(
                        Number(
                          e.target.value
                        )
                      )
                    }
                    className="w-full text-xl font-medium outline-none"
                  />

                  <span className="text-gray-400">
                    people
                  </span>

                </div>

              </div>

              <div className="rounded-2xl border border-black/10 p-5">

                <label className="text-xs uppercase tracking-widest text-gray-400">
                  Budget
                </label>

                <div className="mt-3 flex items-center gap-2">

                  <span className="text-gray-400">
                    ₹
                  </span>

                  <input
                    type="number"
                    min={1}
                    value={budget}
                    onChange={(e) =>
                      setBudget(
                        e.target.value
                      )
                    }
                    placeholder="500000"
                    className="w-full text-xl font-medium outline-none placeholder:text-gray-300"
                  />

                </div>

              </div>

            </div>

            {/* STYLE + FLIGHT */}

            <div className="mt-5 grid gap-4 md:grid-cols-2">

              <div className="rounded-2xl border border-black/10 p-5">

                <label className="text-xs uppercase tracking-widest text-gray-400">
                  Travel style
                </label>

                <select
                  value={travelStyle}
                  onChange={(e) =>
                    setTravelStyle(
                      e.target.value
                    )
                  }
                  className="mt-3 w-full bg-transparent text-lg font-medium outline-none"
                >
                  <option>Luxury</option>
                  <option>Premium</option>
                  <option>Comfort</option>
                  <option>Budget</option>
                  <option>Adventure</option>
                  <option>Family</option>
                  <option>Honeymoon</option>
                </select>

              </div>

              <div className="rounded-2xl border border-black/10 p-5">

                <label className="text-xs uppercase tracking-widest text-gray-400">
                  Flight class
                </label>

                <select
                  value={flightClass}
                  onChange={(e) =>
                    setFlightClass(
                      e.target.value
                    )
                  }
                  className="mt-3 w-full bg-transparent text-lg font-medium outline-none"
                >
                  <option>Economy</option>
                  <option>
                    Premium Economy
                  </option>
                  <option>Business</option>
                  <option>First Class</option>
                </select>

              </div>

            </div>

            {/* INTERESTS */}

            <div className="mt-5">

              <label className="text-xs uppercase tracking-widest text-gray-400">
                Interests
              </label>

              <input
                type="text"
                value={interests}
                onChange={(e) =>
                  setInterests(
                    e.target.value
                  )
                }
                placeholder="Wine, beaches, museums, adventure..."
                className="mt-3 w-full rounded-2xl border border-black/10 px-5 py-4 outline-none"
              />

              <p className="mt-2 text-xs text-gray-400">
                Separate multiple interests
                with commas.
              </p>

            </div>

            {/* FOOD */}

            <div className="mt-5">

              <label className="text-xs uppercase tracking-widest text-gray-400">
                Food preferences
              </label>

              <input
                type="text"
                value={foodPreferences}
                onChange={(e) =>
                  setFoodPreferences(
                    e.target.value
                  )
                }
                placeholder="Fine dining, vegetarian, halal, local cuisine..."
                className="mt-3 w-full rounded-2xl border border-black/10 px-5 py-4 outline-none"
              />

            </div>

            {/* SPECIAL REQUEST */}

            <div className="mt-5">

              <label className="text-xs uppercase tracking-widest text-gray-400">
                Special requests
              </label>

              <textarea
                value={specialRequests}
                onChange={(e) =>
                  setSpecialRequests(
                    e.target.value
                  )
                }
                rows={3}
                placeholder="Tell VoyageAI anything else..."
                className="mt-3 w-full resize-none rounded-2xl border border-black/10 px-5 py-4 outline-none"
              />

            </div>

            {/* SUBMIT */}

            <button
              onClick={generateTrip}
              disabled={loading}
              className="mt-7 flex w-full items-center justify-center gap-3 rounded-full bg-[#171717] px-8 py-4 font-medium text-white transition hover:bg-[#333] disabled:cursor-not-allowed disabled:opacity-50"
            >

              {loading ? (
  <>
    <span className="relative flex h-5 w-5 items-center justify-center">

      <span className="absolute h-5 w-5 rounded-full border border-white/20" />

      <span className="absolute h-5 w-5 animate-spin rounded-full border border-transparent border-t-[#d4b27b]" />

      <span className="h-1.5 w-1.5 rounded-full bg-[#d4b27b]" />

    </span>

    <span className="transition-all duration-300">
      {loadingSteps[loadingStep]}
    </span>
  </>
) : (
  <>
    <span>
      Plan my journey
    </span>

    <span className="text-lg transition-transform duration-300 group-hover:translate-x-1">
      →
    </span>
  </>
)}

            </button>

            <p className="mt-4 text-center text-xs text-gray-400">
              {backendMessage}
            </p>

            </div>

        </section>
      )}

      {/* ===================================================
          GENERATED JOURNEY
      =================================================== */}

      {trip && (
        <section className="mx-auto max-w-7xl px-6 pb-20 pt-8 md:px-10">

          {/* =================================================
              DESTINATION PHOTO SLIDER
          ================================================= */}

          <Reveal>
            <div className="group relative h-[560px] overflow-hidden rounded-[2rem] bg-[#171717] text-white shadow-[0_35px_100px_rgba(0,0,0,0.16)]">

            {destinationPhotos.length >
              0 &&
              destinationPhotos.map(
                (photo, index) => {

                  const imageUrl =
                    photo.urls?.regular;

                  if (!imageUrl) {
                    return null;
                  }

                  return (
                    <img
                      key={photo.id}
                      src={imageUrl}
                      alt={
                        photo.alt_description ||
                        trip.destination ||
                        "Travel destination"
                      }
                      className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-[1400ms] ease-out ${
                        index === currentPhoto
                          ? "scale-105 opacity-100"
                          : "scale-100 opacity-0"
                      }`}
                      onError={() => {
                        if (
                          index ===
                          currentPhoto
                        ) {
                          setPhotoError(
                            true
                          );
                        }
                      }}
                    />
                  );
                }
              )}

            {/* FALLBACK */}

            {(
              photoError ||
              destinationPhotos.length ===
                0
            ) && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#272727] to-[#927a5a]">

                <div className="text-center">

                  <div className="text-7xl">
                    🌍
                  </div>

                  <p className="mt-4 text-2xl font-semibold">
                    {trip.destination ||
                      "Your Destination"}
                  </p>

                  <p className="mt-2 text-white/60">
                    Destination photography
                  </p>

                </div>

              </div>
            )}

            {/* DARK OVERLAY */}

            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/10" />

            {/* TOP INFO */}

            <div className="absolute left-6 top-6 z-10">

              {photoLoading && (
                <div className="rounded-full bg-black/40 px-4 py-2 text-sm backdrop-blur-md">
                  Loading destination...
                </div>
              )}

              {!photoLoading &&
                destinationPhotos.length >
                  0 && (
                  <div className="rounded-full bg-black/40 px-4 py-2 text-sm backdrop-blur-md">
                    {currentPhoto + 1} /{" "}
                    {
                      destinationPhotos.length
                    }
                  </div>
                )}

            </div>

            {/* PHOTO CONTROLS */}

            {destinationPhotos.length >
              1 && (
              <>
                <button
                  onClick={() =>
                    setCurrentPhoto(
                      (previous) =>
                        previous === 0
                          ? destinationPhotos.length -
                            1
                          : previous - 1
                    )
                  }
                  className="absolute left-5 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-xl backdrop-blur-md transition hover:bg-black/70"
                >
                  ←
                </button>

                <button
                  onClick={() =>
                    setCurrentPhoto(
                      (previous) =>
                        (previous + 1) %
                        destinationPhotos.length
                    )
                  }
                  className="absolute right-5 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-xl backdrop-blur-md transition hover:bg-black/70"
                >
                  →
                </button>
              </>
            )}

            {/* DOTS */}

            {destinationPhotos.length >
              1 && (
              <div className="absolute bottom-7 left-1/2 z-20 flex -translate-x-1/2 gap-2">

                {destinationPhotos.map(
                  (_, index) => (
                    <button
                      key={index}
                      onClick={() =>
                        setCurrentPhoto(
                          index
                        )
                      }
                      className={`h-2 rounded-full transition-all ${
                        index ===
                        currentPhoto
                          ? "w-8 bg-white"
                          : "w-2 bg-white/50"
                      }`}
                    />
                  )
                )}

              </div>
            )}

            {/* HERO CONTENT */}

            <div className="absolute bottom-0 left-0 right-0 z-10 p-8 md:p-12">

              <p className="text-xs font-medium uppercase tracking-[0.35em] text-white/70">
                Your AI-crafted journey
              </p>

              <h1 className="mt-4 text-5xl font-semibold tracking-tight md:text-8xl">
                {trip.destination ||
                  "Your Journey"}
              </h1>

              <div className="mt-6 flex flex-wrap gap-3">

                <span className="rounded-full bg-white/15 px-4 py-2 text-sm backdrop-blur-md">
                  {trip.days || "—"} days
                </span>

                <span className="rounded-full bg-white/15 px-4 py-2 text-sm backdrop-blur-md">
                  {trip.travelers ||
                    "—"} travelers
                </span>

                <span className="rounded-full bg-white/15 px-4 py-2 text-sm backdrop-blur-md">
                  {trip.travel_style ||
                    "Personalized"}
                </span>

              </div>

            </div>

            </div>
          </Reveal>

          {/* =================================================
              UNSPLASH ATTRIBUTION
          ================================================= */}

          {destinationPhotos.length >
            0 && (
            <p className="mt-3 text-right text-xs text-gray-400">

              Photos from{" "}

              <a
                href="https://unsplash.com"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-black"
              >
                Unsplash
              </a>

              {" · "}

              {destinationPhotos[
                currentPhoto
              ]?.user?.name && (
                <>
                  Photo by{" "}

                  <a
                    href={
                      destinationPhotos[
                        currentPhoto
                      ]?.user?.links
                        ?.html ||
                      "https://unsplash.com"
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-black"
                  >
                    {
                      destinationPhotos[
                        currentPhoto
                      ]?.user?.name
                    }
                  </a>
                </>
              )}

            </p>
          )}

          {/* =================================================
              QUICK ACTIONS
          ================================================= */}

          <Reveal delay={80}>
            <div className="mt-5 grid gap-4 md:grid-cols-3">

            <button
              onClick={speakTrip}
              disabled={voiceLoading}
              className="rounded-2xl bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl disabled:opacity-50"
            >

              <span className="text-2xl">
                🎙️
              </span>

              <p className="mt-5 font-semibold">
                {voiceLoading
                  ? "Preparing voice..."
                  : "Hear your journey"}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Listen to your personalized
                trip summary.
              </p>

            </button>

            <button
              onClick={downloadPdf}
              className="rounded-2xl bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >

              <span className="text-2xl">
                📄
              </span>

              <p className="mt-5 font-semibold">
                Download travel book
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Your complete journey in
                PDF format.
              </p>

            </button>

            <button
              onClick={resetTrip}
              className="rounded-2xl bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >

              <span className="text-2xl">
                ✦
              </span>

              <p className="mt-5 font-semibold">
                Plan another journey
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Start a completely new
                adventure.
              </p>

            </button>

            </div>
          </Reveal>

          {/* =================================================
              CINEMATIC TRIP INTRO
          ================================================= */}

          {trip.itinerary_summary && (
            <Reveal delay={100}>
              <section className="relative mt-20 overflow-hidden rounded-[2.5rem] bg-[#111111] px-7 py-12 text-white md:px-14 md:py-16">
                <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[#927a5a]/20 blur-[110px]" />
                <div className="pointer-events-none absolute -bottom-40 -left-20 h-80 w-80 rounded-full bg-white/5 blur-[100px]" />

                <div className="relative z-10 max-w-4xl">
                  <div className="flex items-center gap-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#d4b27b] shadow-[0_0_14px_rgba(212,178,123,0.9)]" />
                    <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[#d4b27b]/80">
                      Your Voyage
                    </p>
                  </div>

                  <h2 className="mt-7 max-w-3xl text-4xl font-semibold tracking-[-0.04em] md:text-6xl">
                    Designed around
                    <br />
                    <span className="text-white/40">you.</span>
                  </h2>

                  <p className="mt-7 max-w-3xl text-base leading-8 text-white/55 md:text-xl md:leading-9">
                    {trip.itinerary_summary}
                  </p>

                  <div className="mt-10 flex flex-wrap gap-3">
                    {trip.days && (
                      <div className="rounded-full border border-white/10 bg-white/[0.06] px-5 py-2.5 text-sm text-white/70 backdrop-blur-md">
                        {trip.days} days
                      </div>
                    )}
                    {trip.travelers && (
                      <div className="rounded-full border border-white/10 bg-white/[0.06] px-5 py-2.5 text-sm text-white/70 backdrop-blur-md">
                        {trip.travelers} travelers
                      </div>
                    )}
                    {trip.travel_style && (
                      <div className="rounded-full border border-white/10 bg-white/[0.06] px-5 py-2.5 text-sm text-white/70 backdrop-blur-md">
                        {trip.travel_style}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </Reveal>
          )}

          {/* =================================================
              CINEMATIC ITINERARY
          ================================================= */}

          {trip.itinerary && trip.itinerary.length > 0 && (
            <Reveal delay={100}>
              <section className="relative mt-24">

                <div className="max-w-3xl">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[#927a5a]">
                    The journey
                  </p>

                  <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] md:text-6xl">
                    Every day,
                    <br />
                    <span className="text-gray-400">
                      thoughtfully planned.
                    </span>
                  </h2>

                  <p className="mt-5 max-w-2xl text-base leading-7 text-gray-500">
                    A day-by-day experience shaped around your destination, preferences and travel style.
                  </p>
                </div>

                <div className="relative mt-14">
                  <div className="absolute bottom-0 left-[23px] top-0 hidden w-px bg-gradient-to-b from-[#927a5a]/50 via-black/10 to-transparent md:block" />

                  <div className="space-y-8">
                    {trip.itinerary.map((day, index) => {

                      const activities = Array.isArray(day.activities)
                        ? day.activities
                            .filter(
                              (activity) =>
                                activity !== null &&
                                activity !== undefined &&
                                String(activity).trim()
                            )
                            .map((activity) => ({
                              label: "Activity",
                              value: String(activity),
                            }))
                        : [];

                      const structuredActivities = [
                        { label: "Morning", value: day.morning },
                        { label: "Afternoon", value: day.afternoon },
                        { label: "Evening", value: day.evening },
                        { label: "Dining", value: day.dining },
                        { label: "Notes", value: day.notes },
                      ].filter(
                        (item) =>
                          item.value !== null &&
                          item.value !== undefined &&
                          String(item.value).trim()
                      );

                      const dayActivities =
                        activities.length > 0
                          ? activities
                          : structuredActivities;

                      return (
                        <Reveal
                          key={`itinerary-day-${index}`}
                          delay={index * 80}
                        >
                          <article className="group relative md:pl-20">

                            {/* DAY MARKER */}
                            <div className="absolute left-0 top-0 hidden h-12 w-12 items-center justify-center rounded-full border border-[#927a5a]/30 bg-white text-sm font-semibold shadow-sm md:flex">
                              <span className="text-[#927a5a]">
                                {String(day.day || index + 1).padStart(2, "0")}
                              </span>
                            </div>

                            {/* DAY CARD */}
                            <div className="relative overflow-hidden rounded-[2rem] border border-black/[0.07] bg-white shadow-[0_15px_60px_rgba(0,0,0,0.045)] transition-all duration-700 hover:-translate-y-1 hover:shadow-[0_30px_90px_rgba(0,0,0,0.10)]">

                              <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#f7f3ea] to-transparent opacity-80" />

                              {/* HEADER */}
                              <div className="relative p-7 md:p-9">
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-3">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#171717] text-[10px] font-semibold text-[#d4b27b] md:hidden">
                                      {String(day.day || index + 1).padStart(2, "0")}
                                    </span>

                                    <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-[#927a5a]">
                                      Day {day.day || index + 1}
                                    </p>
                                  </div>

                                  <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-300">
                                    {String(index + 1).padStart(2, "0")} / {String(trip.itinerary.length).padStart(2, "0")}
                                  </span>
                                </div>

                                <h3 className="mt-5 max-w-4xl text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">
                                  {day.title || `Day ${index + 1}`}
                                </h3>

                                {day.description && (
                                  <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-500 md:text-base">
                                    {day.description}
                                  </p>
                                )}
                              </div>

                              {/* DAILY EXPERIENCE TIMELINE */}
                              <div className="border-t border-black/[0.06] px-7 py-7 md:px-9 md:py-9">

                                {dayActivities.length > 0 ? (
                                  <div className="relative">
                                    <div className="absolute bottom-4 left-3 top-4 hidden w-px bg-gradient-to-b from-[#927a5a]/40 via-black/10 to-transparent md:block" />

                                    <div className="space-y-4">
                                      {dayActivities.map((activity, activityIndex) => (
                                        <div
                                          key={`${index}-${activityIndex}`}
                                          className="group/activity relative flex gap-4 rounded-[1.25rem] border border-black/[0.06] bg-[#faf9f7] p-4 transition-all duration-500 hover:-translate-y-0.5 hover:border-[#927a5a]/20 hover:bg-[#f7f4ee] md:pl-5"
                                        >
                                          <div className="relative z-10 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#927a5a]/20 bg-white shadow-sm">
                                            <span className="h-1.5 w-1.5 rounded-full bg-[#927a5a] transition-transform duration-300 group-hover/activity:scale-150" />
                                          </div>

                                          <div className="min-w-0">
                                            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#927a5a]">
                                              {activity.label}
                                            </p>

                                            <p className="mt-1 text-sm leading-6 text-gray-600 md:text-[15px]">
                                              {activity.value}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="rounded-2xl border border-black/[0.05] bg-[#faf9f7] p-5">
                                    <p className="text-sm leading-6 text-gray-400">
                                      No specific activities were generated for this day.
                                    </p>
                                  </div>
                                )}

                              </div>
                            </div>
                          </article>
                        </Reveal>
                      );
                    })}
                  </div>
                </div>
              </section>
            </Reveal>
          )}

          {/* =================================================
    INTERACTIVE TRAVEL MAP
================================================= */}

{trip && (
  <Reveal delay={100}>
    <section className="mt-24">
      <div className="max-w-3xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[#927a5a]">
          Explore your journey
        </p>

        <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] md:text-6xl">
          See it all,
          <br />
          <span className="text-gray-400">
            in one place.
          </span>
        </h2>

        <p className="mt-5 max-w-2xl text-base leading-7 text-gray-500">
          Explore your destination and discover the stays
          and experiences VoyageAI selected for your journey.
        </p>
      </div>

      <div className="mt-9">
        <TravelMap
          destination={
            trip.destination || "Your destination"
          }
          latitude={
            normalizedWeather?.latitude ??
            weatherFallback?.latitude
          }
          longitude={
            normalizedWeather?.longitude ??
            weatherFallback?.longitude
          }
          hotels={hotels.map((hotel) => ({
            name:
              hotel.name || "Recommended hotel",
            latitude: hotel.latitude,
            longitude: hotel.longitude,
            type: "hotel",
            rating: hotel.rating,
            price: hotel.price_per_night,
            address: hotel.address,
          }))}
          restaurants={restaurants.map(
            (restaurant) => ({
              name:
                restaurant.name ||
                "Recommended restaurant",
              latitude: restaurant.latitude,
              longitude: restaurant.longitude,
              type: "restaurant",
              rating: restaurant.rating,
              address: restaurant.address,
            })
          )}
        />
      </div>
    </section>
  </Reveal>
)}


          <Reveal delay={140}>
            <TripCopilot
              trip={trip}
              onTripUpdate={setTrip}
            />
          </Reveal>

          {/* =================================================
    HOTELS — PREMIUM VOYAGEAI SELECTION
================================================= */}

{hotels.length > 0 && (
  <Reveal delay={120}>
    <div className="mt-20">

    {/* SECTION HEADER */}
    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#927a5a]">
          Where you'll stay
        </p>

        <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          Handpicked stays.
        </h2>

        <p className="mt-3 max-w-xl text-sm leading-6 text-gray-500 md:text-base">
          Carefully selected around your budget, travel style,
          rating and the experience you want from
          {trip.destination ? ` ${trip.destination}.` : " your destination."}
        </p>
      </div>

      <div className="flex h-fit items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-xs text-gray-500 shadow-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-[#927a5a]" />
        {hotels.length} curated stays
      </div>

    </div>

    {/* HOTEL GRID */}
    <div className="mt-9 grid gap-6 lg:grid-cols-2">

      {hotels.map((hotel, index) => {

        const image =
          hotel.thumbnail ||
          hotel.image_url;

        const rating =
          typeof hotel.rating === "number"
            ? hotel.rating
            : null;

        const price =
          typeof hotel.price_per_night === "number"
            ? hotel.price_per_night
            : null;

        /*
         * Deterministic recommendation labels.
         * These describe the position in VoyageAI's
         * returned ranked results — they are not fake
         * third-party awards.
         */
        const badge =
          index === 0
            ? "BEST MATCH"
            : index === 1
            ? "LUXURY PICK"
            : index === 2
            ? "GREAT VALUE"
            : "VOYAGEAI PICK";

        /*
         * Transparent recommendation reasoning
         * based only on data actually returned by the backend.
         */
        let reasoning =
          "A strong overall match for your journey.";

        if (rating !== null && price !== null) {
          if (index === 0) {
            reasoning =
              `VoyageAI placed this first because it combines a ${rating.toFixed(
                1
              )} rating with a strong fit for your travel budget.`;
          } else if (rating >= 4.7) {
            reasoning =
              `A highly rated stay with a ${rating.toFixed(
                1
              )} guest rating, making it a strong choice for a premium trip.`;
          } else {
            reasoning =
              `A balanced option at ${formatCurrency(
                price
              )} per night with a ${rating.toFixed(
                1
              )} rating.`;
          }
        } else if (rating !== null) {
          reasoning =
            `A highly rated option with a ${rating.toFixed(
              1
            )} guest rating.`;
        } else if (price !== null) {
          reasoning =
            `A stay that fits the available pricing information at ${formatCurrency(
              price
            )} per night.`;
        }

        return (
          <Reveal
            key={`${hotel.name || "hotel"}-${index}`}
            delay={index * 120}
            className="h-full"
          >
            <article
            className="group relative overflow-hidden rounded-[2rem] border border-black/[0.07] bg-white shadow-[0_20px_70px_rgba(0,0,0,0.06)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_35px_100px_rgba(0,0,0,0.12)]"
          >

            {/* IMAGE */}
            <div className="relative h-[330px] overflow-hidden bg-[#e9e7e1]">

              {image ? (
                <img
                  src={image}
                  alt={
                    hotel.name ||
                    "Recommended hotel"
                  }
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.07]"
                  onError={(event) => {
                    event.currentTarget.style.display =
                      "none";
                  }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#ded9ce] via-[#c7bca9] to-[#927a5a]">
                  <div className="text-7xl opacity-80">
                    🏨
                  </div>
                </div>
              )}

              {/* IMAGE OVERLAY */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-black/10" />

              {/* TOP BADGE */}
              <div className="absolute left-5 top-5">
                <span className="rounded-full border border-white/20 bg-black/35 px-3.5 py-2 text-[9px] font-semibold tracking-[0.22em] text-white backdrop-blur-xl">
                  {badge}
                </span>
              </div>

              {/* RATING */}
              {rating !== null && (
                <div className="absolute right-5 top-5 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/35 px-3.5 py-2 text-sm text-white backdrop-blur-xl">
                  <span className="text-[#e3bd7d]">
                    ★
                  </span>

                  <span className="font-medium">
                    {rating.toFixed(1)}
                  </span>
                </div>
              )}

              {/* IMAGE BOTTOM CONTENT */}
              <div className="absolute inset-x-0 bottom-0 p-6 md:p-7">

                <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-white/55">
                  VoyageAI selection
                </p>

                <h3 className="mt-2 max-w-xl text-2xl font-semibold tracking-tight text-white md:text-3xl">
                  {hotel.name ||
                    "Recommended hotel"}
                </h3>

                <p className="mt-2 line-clamp-1 text-sm text-white/60">
                  {hotel.address ||
                    trip.destination ||
                    "Your destination"}
                </p>

              </div>

            </div>

            {/* CONTENT */}
            <div className="p-6 md:p-7">

              {/* PRICE + RATING */}
              <div className="flex items-end justify-between gap-4">

                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-gray-400">
                    From
                  </p>

                  {price !== null ? (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-semibold tracking-tight">
                        {formatCurrency(price)}
                      </span>

                      <span className="text-sm text-gray-400">
                        / night
                      </span>
                    </div>
                  ) : (
                    <p className="mt-1 text-lg font-medium text-gray-500">
                      Price unavailable
                    </p>
                  )}
                </div>

                {rating !== null && (
                  <div className="text-right">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-gray-400">
                      Guest rating
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {rating.toFixed(1)} / 5
                    </p>
                  </div>
                )}

              </div>

              {/* AMENITIES */}
              {hotel.amenities &&
                hotel.amenities.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-2">

                    {hotel.amenities
                      .slice(0, 5)
                      .map(
                        (
                          amenity,
                          amenityIndex
                        ) => (
                          <span
                            key={amenityIndex}
                            className="rounded-full border border-black/[0.07] bg-[#f7f6f3] px-3 py-1.5 text-[11px] text-gray-600 transition group-hover:bg-[#f1eee8]"
                          >
                            {amenity}
                          </span>
                        )
                      )}

                  </div>
                )}

              {/* AI REASONING */}
              <div className="mt-7 rounded-2xl border border-[#927a5a]/15 bg-[#f8f6f1] p-5">

                <div className="flex items-center gap-2">

                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#171717] text-xs text-[#e1bd7c]">
                    ✦
                  </span>

                  <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#927a5a]">
                    Why VoyageAI chose this
                  </p>

                </div>

                <p className="mt-3 text-sm leading-6 text-gray-600">
                  {reasoning}
                </p>

              </div>

              {/* CTA */}
              <div className="mt-6 flex items-center justify-between gap-4">

                <p className="text-xs text-gray-400">
                  Curated for your journey
                </p>

                {(hotel.website ||
                  hotel.hotel_link) ? (
                  <a
                    href={
                      hotel.website ||
                      hotel.hotel_link
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="group/button inline-flex items-center gap-2 rounded-full bg-[#171717] px-5 py-3 text-sm font-medium text-white transition-all duration-300 hover:bg-[#927a5a]"
                  >
                    View hotel

                    <span className="transition-transform duration-300 group-hover/button:translate-x-1">
                      →
                    </span>
                  </a>
                ) : (
                  <span className="rounded-full bg-[#171717]/10 px-5 py-3 text-sm text-gray-500">
                    Details unavailable
                  </span>
                )}

              </div>

            </div>

            </article>
          </Reveal>
        );
      })}

    </div>

    {/* SUBTLE FOOTNOTE */}
    <div className="mt-6 flex items-center gap-2 text-xs text-gray-400">
      <span className="h-1 w-1 rounded-full bg-[#927a5a]" />
      Hotel selections are ranked using the available rating,
      pricing and trip preferences.
    </div>

    </div>
  </Reveal>
)}

          {/* =================================================
    RESTAURANTS — PREMIUM VOYAGEAI SELECTION
================================================= */}

{restaurants.length > 0 && (
  <Reveal delay={140}>
    <div className="mt-24">

    {/* SECTION HEADER */}
    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#927a5a]">
          Places worth remembering
        </p>

        <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          Dine beautifully.
        </h2>

        <p className="mt-3 max-w-xl text-sm leading-6 text-gray-500 md:text-base">
          Restaurants selected around your food preferences,
          travel style and the experience you want from
          {trip.destination
            ? ` ${trip.destination}.`
            : " your destination."}
        </p>
      </div>

      <div className="flex h-fit items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-xs text-gray-500 shadow-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-[#927a5a]" />
        {restaurants.length} curated places
      </div>

    </div>

    {/* RESTAURANT GRID */}
    <div className="mt-9 grid gap-6 lg:grid-cols-3">

      {restaurants.map((restaurant, index) => {

        const image =
          restaurant.thumbnail ||
          restaurant.image_url;

        const rating =
          typeof restaurant.rating === "number"
            ? restaurant.rating
            : null;

        const reviews =
          typeof restaurant.reviews === "number"
            ? restaurant.reviews
            : null;

        /*
         * Labels are based on the ranked order
         * returned by the restaurant service.
         */
        const badge =
          index === 0
            ? "BEST MATCH"
            : index === 1
            ? "LOCAL PICK"
            : index === 2
            ? "EXPERIENCE PICK"
            : "VOYAGEAI PICK";

        /*
         * Transparent reasoning based only on
         * restaurant data actually returned.
         */
        let reasoning =
          "A strong dining option for your journey.";

        if (rating !== null) {

          if (index === 0) {
            reasoning =
              `VoyageAI placed this first because it has a strong ${rating.toFixed(
                1
              )} rating and matches the dining criteria for your trip.`;
          } else if (rating >= 4.6) {
            reasoning =
              `A highly rated dining option with a ${rating.toFixed(
                1
              )} guest rating.`;
          } else {
            reasoning =
              `A well-rated restaurant that fits the dining options available in ${trip.destination || "your destination"}.`;
          }

        }

        return (
          <Reveal
            key={`${restaurant.name || "restaurant"}-${index}`}
            delay={index * 120}
            className="h-full"
          >
            <article
            className="group relative overflow-hidden rounded-[2rem] border border-black/[0.07] bg-white shadow-[0_20px_70px_rgba(0,0,0,0.06)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_35px_100px_rgba(0,0,0,0.12)]"
          >

            {/* IMAGE */}
            <div className="relative h-[280px] overflow-hidden bg-[#e9e7e1]">

              {image ? (
                <img
                  src={image}
                  alt={
                    restaurant.name ||
                    "Recommended restaurant"
                  }
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.08]"
                  onError={(event) => {
                    event.currentTarget.style.display =
                      "none";
                  }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#d8d0c3] via-[#b9a992] to-[#806b4e]">
                  <div className="text-7xl opacity-80">
                    🍽️
                  </div>
                </div>
              )}

              {/* IMAGE OVERLAY */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-black/10" />

              {/* BADGE */}
              <div className="absolute left-5 top-5">
                <span className="rounded-full border border-white/20 bg-black/35 px-3.5 py-2 text-[9px] font-semibold tracking-[0.22em] text-white backdrop-blur-xl">
                  {badge}
                </span>
              </div>

              {/* RATING */}
              {rating !== null && (
                <div className="absolute right-5 top-5 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/35 px-3.5 py-2 text-sm text-white backdrop-blur-xl">

                  <span className="text-[#e3bd7d]">
                    ★
                  </span>

                  <span className="font-medium">
                    {rating.toFixed(1)}
                  </span>

                  {reviews !== null && (
                    <span className="text-white/45">
                      · {reviews.toLocaleString()}
                    </span>
                  )}

                </div>
              )}

              {/* BOTTOM CONTENT */}
              <div className="absolute inset-x-0 bottom-0 p-6">

                <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-white/55">
                  VoyageAI selection
                </p>

                <h3 className="mt-2 line-clamp-2 text-2xl font-semibold tracking-tight text-white">
                  {restaurant.name ||
                    "Recommended restaurant"}
                </h3>

                {restaurant.type && (
                  <p className="mt-2 line-clamp-1 text-sm text-white/60">
                    {restaurant.type}
                  </p>
                )}

              </div>

            </div>

            {/* CONTENT */}
            <div className="p-6">

              {/* RESTAURANT META */}
              <div className="space-y-2">

                {restaurant.type && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-[#927a5a]">
                      ✦
                    </span>

                    <span>
                      {restaurant.type}
                    </span>
                  </div>
                )}

                {restaurant.address && (
                  <div className="flex items-start gap-2 text-sm leading-5 text-gray-500">
                    <span className="mt-0.5 text-[#927a5a]">
                      ◦
                    </span>

                    <span className="line-clamp-2">
                      {restaurant.address}
                    </span>
                  </div>
                )}

              </div>

              {/* AI REASONING */}
              <div className="mt-6 rounded-2xl border border-[#927a5a]/15 bg-[#f8f6f1] p-5">

                <div className="flex items-center gap-2">

                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#171717] text-xs text-[#e1bd7c]">
                    ✦
                  </span>

                  <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#927a5a]">
                    Why VoyageAI chose this
                  </p>

                </div>

                <p className="mt-3 text-sm leading-6 text-gray-600">
                  {reasoning}
                </p>

              </div>

              {/* ACTIONS */}
              <div className="mt-6 flex flex-wrap gap-2">

                {restaurant.website && (
                  <a
                    href={restaurant.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-[#171717] px-5 py-3 text-sm font-medium text-white transition-all duration-300 hover:bg-[#927a5a]"
                  >
                    Visit restaurant
                    <span>→</span>
                  </a>
                )}

                {restaurant.maps_link && (
                  <a
                    href={restaurant.maps_link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-medium text-gray-700 transition-all duration-300 hover:border-black/20 hover:bg-[#f7f6f3]"
                  >
                    Directions
                    <span>↗</span>
                  </a>
                )}

              </div>

            </div>

            </article>
          </Reveal>
        );
      })}

    </div>

    {/* FOOTNOTE */}
    <div className="mt-6 flex items-center gap-2 text-xs text-gray-400">
      <span className="h-1 w-1 rounded-full bg-[#927a5a]" />
      Restaurant selections are ranked using the available
      rating, reviews and your dining preferences.
    </div>

    </div>
  </Reveal>
)}

          {/* =================================================
              CINEMATIC WEATHER
          ================================================= */}

          <Reveal delay={100}>
            <section className="mt-24">
              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[#927a5a]">
                    Travel conditions
                  </p>
                  <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] md:text-5xl">
                    Know the days ahead.
                  </h2>
                  {trip.weather_summary && (
                    <p className="mt-4 max-w-2xl text-base leading-7 text-gray-500">
                      {trip.weather_summary}
                    </p>
                  )}
                </div>
                <div className="hidden rounded-full border border-black/10 bg-white px-4 py-2 text-xs text-gray-500 md:block">
                  Live forecast
                </div>
              </div>

              {weatherDaily && weatherDaily.time && weatherDaily.time.length > 0 ? (
                <div className="mt-9 overflow-x-auto pb-4">
                  <div className="flex min-w-max gap-4">
                    {weatherDaily.time.map((date, index) => {
                      const max = weatherDaily.temperature_2m_max?.[index];
                      const min = weatherDaily.temperature_2m_min?.[index];
                      const rain = weatherDaily.precipitation_probability_max?.[index];
                      const code = weatherDaily.weather_code?.[index];
                      const condition =
                        code === 0
                          ? "Clear skies"
                          : code !== undefined && code <= 3
                          ? "Partly cloudy"
                          : code !== undefined && code <= 48
                          ? "Foggy"
                          : code !== undefined && code <= 67
                          ? "Rain expected"
                          : code !== undefined && code <= 77
                          ? "Cold conditions"
                          : code !== undefined && code <= 86
                          ? "Showers possible"
                          : "Stormy conditions";

                      return (
                        <Reveal key={date} delay={index * 70}>
                          <div className="group w-[210px] overflow-hidden rounded-[1.75rem] border border-black/[0.07] bg-white p-6 shadow-[0_15px_50px_rgba(0,0,0,0.04)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_25px_70px_rgba(0,0,0,0.08)]">
                            <div className="flex items-start justify-between">
                              <p className="text-sm font-medium text-gray-500">{formatWeatherDate(date)}</p>
                              <span className="text-xs text-gray-300">{String(index + 1).padStart(2, "0")}</span>
                            </div>
                            <div className="mt-8 flex h-16 items-center justify-between">
                              <div className="text-5xl transition-transform duration-500 group-hover:scale-110">{getWeatherIcon(code)}</div>
                              <div className="text-right">
                                <div className="text-4xl font-semibold tracking-tight">{max !== undefined ? `${Math.round(max)}°` : "—"}</div>
                                <div className="text-sm text-gray-400">{min !== undefined ? `${Math.round(min)}°` : ""}</div>
                              </div>
                            </div>
                            <p className="mt-7 text-sm text-gray-500">{condition}</p>
                            {rain !== undefined && (
                              <div className="mt-5 flex items-center justify-between border-t border-black/[0.06] pt-4">
                                <span className="text-xs uppercase tracking-wider text-gray-400">Precipitation</span>
                                <span className="text-sm font-medium">{rain}%</span>
                              </div>
                            )}
                          </div>
                        </Reveal>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="mt-9 rounded-[2rem] border border-black/[0.07] bg-white p-7 shadow-[0_15px_50px_rgba(0,0,0,0.04)]">
                  <div className="flex items-start gap-5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#f5f2ec] text-3xl">🌤️</div>
                    <div>
                      <h3 className="text-lg font-semibold">Forecast unavailable</h3>
                      <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500">
                        Live forecast data isn't available for these travel dates yet. Your itinerary can still be generated normally.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </Reveal>

          {/* =================================================
              CINEMATIC BUDGET
          ================================================= */}

          {trip.budget_breakdown && Object.keys(trip.budget_breakdown).length > 0 && (
            <Reveal delay={100}>
              <section className="mt-24">
                <div className="overflow-hidden rounded-[2.5rem] bg-[#111111] p-7 text-white md:p-12">
                  <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[#d4b27b]">
                        Your investment
                      </p>
                      <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] md:text-5xl">
                        Where your money goes.
                      </h2>
                      <p className="mt-4 max-w-xl text-sm leading-7 text-white/45 md:text-base">
                        A transparent breakdown of the budget behind your journey.
                      </p>
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/[0.05] px-5 py-2.5 text-xs text-white/50">
                      Personalized allocation
                    </div>
                  </div>

                  <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(trip.budget_breakdown).map(([category, amount], index) => (
                      <Reveal key={category} delay={index * 80}>
                        <div className="group rounded-[1.75rem] border border-white/[0.08] bg-white/[0.045] p-6 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:bg-white/[0.07]">
                          <div className="flex items-center justify-between">
                            <p className="text-sm capitalize text-white/50">{category.replace(/_/g, " ")}</p>
                            <span className="text-xs text-[#d4b27b]/70">{String(index + 1).padStart(2, "0")}</span>
                          </div>
                          <p className="mt-5 text-3xl font-semibold tracking-tight">{formatCurrency(amount)}</p>
                          <div className="mt-6 h-px w-full bg-white/[0.08]" />
                          <div className="mt-4 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#d4b27b]" />
                            <span className="text-xs text-white/35">Trip allocation</span>
                          </div>
                        </div>
                      </Reveal>
                    ))}
                  </div>
                </div>
              </section>
            </Reveal>
          )}

          {/* =================================================
              EMPTY DATA WARNING
          ================================================= */}

          {hotels.length === 0 &&
            restaurants.length === 0 && (
              <Reveal delay={100}>
                <div className="mt-14 rounded-2xl border border-amber-200 bg-amber-50 p-6">

                <p className="font-semibold text-amber-900">
                  Recommendations were not returned
                  by the backend.
                </p>

                <p className="mt-2 text-sm text-amber-800">
                  The frontend is ready to display
                  hotel and restaurant recommendations,
                  but the current planner response
                  contains no hotel/restaurant records.
                </p>

                </div>
              </Reveal>
            )}

          {/* =================================================
              FINAL CTA
          ================================================= */}

          <Reveal delay={150}>
            <div className="relative mt-24 overflow-hidden rounded-[2.5rem] bg-[#111111] p-8 text-white md:p-14">

              <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[#927a5a]/20 blur-[110px]" />
              <div className="pointer-events-none absolute -bottom-40 -left-20 h-80 w-80 rounded-full bg-white/5 blur-[100px]" />

            <p className="relative z-10 text-xs uppercase tracking-[0.3em] text-[#d4b27b]/70">
              VoyageAI
            </p>

            <h2 className="relative z-10 mt-4 text-3xl font-semibold md:text-5xl">
              Your journey is ready to go.
            </h2>

            <p className="relative z-10 mt-4 max-w-xl leading-7 text-white/50">
              Your personalized itinerary,
              recommendations, travel book
              and AI voice summary are ready.
            </p>

            <div className="relative z-10 mt-8 flex flex-col gap-3 sm:flex-row">

              <button
                onClick={downloadPdf}
                className="rounded-full bg-white px-7 py-3 font-medium text-black transition hover:bg-gray-200"
              >
                📄 Download Travel Book
              </button>

              <button
                onClick={resetTrip}
                className="rounded-full border border-white/20 px-7 py-3 font-medium text-white transition hover:bg-white/10"
              >
                Plan another journey →
              </button>

            </div>

          </div>
          </Reveal>

        </section>
      )}

      {/* ===================================================
          FOOTER
      =================================================== */}

      <footer className="mx-auto max-w-7xl px-6 py-10 md:px-10">

        <div className="border-t border-black/10 pt-6 text-sm text-gray-400">
          VoyageAI · Intelligent travel,
          thoughtfully planned.
        </div>

      </footer>

    </main>
  );
}