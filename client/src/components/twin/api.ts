import { apiBaseUrl, tomtomKey } from "./constants";
const routeCache: { [key: string]: any } = {};

// Fetch traffic data
export const fetchTrafficData = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/traffic/latest`);
      const data = await response.json();
      console.log(data)
      return data;
    } catch (error) {
      console.error("Error fetching traffic data:", error);
      return {};
    }
  };

  // Fetch environment data
export const fetchEnvironmentData = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/environment/latest`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching environment data:", error);
      return null;
    }
  };

  // Fetch noise data
export const fetchNoiseData = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/noise/latest`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching noise data:", error);
      return null;
    }
  };

  // Fetch route geometry
export const fetchRouteFromTomTom = async (start: { lat: number; lng: number }, end: { lat: number; lng: number }) => {
  const cacheKey = `${start.lat},${start.lng}-${end.lat},${end.lng}`;
  if (routeCache[cacheKey]) {
    return routeCache[cacheKey];
  }

  const url = `https://api.tomtom.com/routing/1/calculateRoute/${start.lat},${start.lng}:${end.lat},${end.lng}/json?key=${tomtomKey}&traffic=true`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const coordinates = data.routes[0].legs[0].points.map((point: any) => [
      point.longitude,
      point.latitude,
    ]);

    routeCache[cacheKey] = coordinates;
    return coordinates;
  } catch (error) {
    console.error("Error fetching route from TomTom API:", error);
    return null;
  }
};