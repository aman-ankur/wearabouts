import type { WeatherSummary } from "./stylistTypes";

export interface Coordinates {
  latitude: number;
  longitude: number;
  label?: string;
}

interface GeocodingResult {
  results?: Array<{ name: string; country?: string; latitude: number; longitude: number }>;
}

interface ForecastResult {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
  };
  hourly?: {
    time?: string[];
    precipitation_probability?: number[];
    temperature_2m?: number[];
    relative_humidity_2m?: number[];
  };
}

export function weatherPeriodForDate(date: Date): WeatherSummary["period"] {
  const hour = date.getHours();
  if (hour >= 16) return "tonight";
  return "now";
}

export async function geocodeCity(city: string): Promise<Coordinates | null> {
  const trimmedCity = city.trim();
  if (!trimmedCity) {
    return null;
  }

  const params = new URLSearchParams({ name: trimmedCity, count: "1", language: "en", format: "json" });
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`);
  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as GeocodingResult;
  const first = payload.results?.[0];
  return first
    ? { latitude: first.latitude, longitude: first.longitude, label: [first.name, first.country].filter(Boolean).join(", ") }
    : null;
}

export async function reverseGeocodeCoordinates(coordinates: Coordinates): Promise<string | null> {
  const params = new URLSearchParams({
    latitude: String(coordinates.latitude),
    longitude: String(coordinates.longitude),
    count: "1",
    language: "en",
    format: "json",
  });
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?${params.toString()}`);
  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as GeocodingResult;
  const first = payload.results?.[0];
  return first ? [first.name, first.country].filter(Boolean).join(", ") : null;
}

export async function fetchWeatherSummary(
  coordinates: Coordinates,
  period: WeatherSummary["period"],
): Promise<WeatherSummary> {
  const params = new URLSearchParams({
    latitude: String(coordinates.latitude),
    longitude: String(coordinates.longitude),
    current: "temperature_2m,relative_humidity_2m,wind_speed_10m",
    hourly: "precipitation_probability,temperature_2m,relative_humidity_2m",
    forecast_days: "2",
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  if (!response.ok) {
    return { status: "failed", locationLabel: coordinates.label, conditionLabel: "Weather unavailable", period };
  }

  const payload = (await response.json()) as ForecastResult;
  const forecastWindowHours = period === "tomorrow" ? 36 : 12;
  const rainChancePercent = Math.max(...(payload.hourly?.precipitation_probability ?? [0]).slice(0, forecastWindowHours));
  const temperatureC = Math.round(payload.current?.temperature_2m ?? payload.hourly?.temperature_2m?.[0] ?? 0);
  const humidityPercent = Math.round(payload.current?.relative_humidity_2m ?? payload.hourly?.relative_humidity_2m?.[0] ?? 0);
  const conditionLabel =
    rainChancePercent >= 50 ? "Rain possible" : temperatureC >= 28 && humidityPercent >= 70 ? "Warm and humid" : "Mild";

  return {
    status: "ready",
    locationLabel: coordinates.label,
    temperatureC,
    humidityPercent,
    rainChancePercent,
    windKph: Math.round(payload.current?.wind_speed_10m ?? 0),
    conditionLabel,
    period,
  };
}
