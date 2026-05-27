"use client";

import { useCallback, useMemo, useState } from "react";
import { fetchWeatherSummary, geocodeCity, weatherPeriodForDate, type Coordinates } from "./openMeteoWeather";
import type { WeatherSummary } from "./stylistTypes";

export type StylistLocationState = "unknown" | "locating" | "ready" | "denied" | "failed";

const failedWeather = (period: WeatherSummary["period"], locationLabel?: string): WeatherSummary => ({
  status: "failed",
  locationLabel,
  conditionLabel: "Weather unavailable",
  period,
});

const unknownWeather = (period: WeatherSummary["period"]): WeatherSummary => ({
  status: "unknown",
  conditionLabel: "Weather not set",
  period,
});

export function useStylistWeather(now: Date = new Date()) {
  const period = useMemo(() => weatherPeriodForDate(now), [now]);
  const [weather, setWeather] = useState<WeatherSummary>(() => unknownWeather(period));
  const [locationState, setLocationState] = useState<StylistLocationState>("unknown");

  const loadWeather = useCallback(
    async (coordinates: Coordinates) => {
      try {
        const summary = await fetchWeatherSummary(coordinates, period);
        setWeather(summary);
        setLocationState(summary.status === "ready" ? "ready" : "failed");
      } catch {
        setWeather(failedWeather(period, coordinates.label));
        setLocationState("failed");
      }
    },
    [period],
  );

  const requestBrowserLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setWeather(failedWeather(period));
      setLocationState("failed");
      return;
    }

    setLocationState("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void loadWeather({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          label: "Current location",
        });
      },
      (error) => {
        setWeather(failedWeather(period));
        setLocationState(error.code === error.PERMISSION_DENIED ? "denied" : "failed");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 30 * 60 * 1000 },
    );
  }, [loadWeather, period]);

  const lookupCity = useCallback(
    async (city: string) => {
      setLocationState("locating");
      try {
        const coordinates = await geocodeCity(city);
        if (!coordinates) {
          setWeather(failedWeather(period, city.trim() || undefined));
          setLocationState("failed");
          return;
        }

        await loadWeather(coordinates);
      } catch {
        setWeather(failedWeather(period, city.trim() || undefined));
        setLocationState("failed");
      }
    },
    [loadWeather, period],
  );

  const skipWeather = useCallback(() => {
    setWeather(failedWeather(period));
    setLocationState("failed");
  }, [period]);

  return {
    weather,
    locationState,
    requestBrowserLocation,
    lookupCity,
    skipWeather,
  };
}
