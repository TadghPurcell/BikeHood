import React, { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { FeatureCollection, LineString } from "geojson";

// Access environment variables
const maptilerUrl = import.meta.env.VITE_MAPTILER_URL;
const maptilerKey = import.meta.env.VITE_MAPTILER_API_KEY;
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const tomtomKey = import.meta.env.VITE_TOMTOM_API_KEY;

// Construct the full URL
const fullMaptilerUrl = `${maptilerUrl}?key=${maptilerKey}`;

// Types
interface Road {
  id: string;
  start: { lat: number; lng: number };
  end: { lat: number; lng: number };
  trafficLevel: number;
}

interface MarkerInfo {
  element: maplibregl.Marker;
  src: string;
  impact: number;
}

// Constants
const IMAGES = [
  { name: "Bike", src: "/bike.png", impact: +2 },
  { name: "Bike Pump", src: "/bikepump.png", impact: +1 },
  { name: "Bike Rack", src: "/Bikerack.png", impact: +1.5 },
  { name: "Bike Repair Wall Mount", src: "/bikerepairwallmount.png", impact: +1 },
  { name: "Bike Shed", src: "/bikeshed.png", impact: +2 },
];

const INITIAL_ROADS = [
  {
    id: "littleplace_castleheaney_distributor_road_north",
    start: { lat: 53.396809, lng: -6.442519 },
    end: { lat: 53.394976, lng: -6.444193 },
    trafficLevel: 5,
  },
  {
    id: "littleplace_castleheaney_distributor_road_south",
    start: { lat: 53.394976, lng: -6.444193 },
    end: { lat: 53.396809, lng: -6.442519 },
    trafficLevel: 5,
  },
  {
    id: "main_street",
    start: { lat: 53.395786, lng: -6.441064 },
    end: { lat: 53.394084, lng: -6.438794 },
    trafficLevel: 5,
  },
  {
    id: "ongar_barnhill_distributor_road",
    start: { lat: 53.392969, lng: -6.445409 },
    end: { lat: 53.394976, lng: -6.444193 },
    trafficLevel: 5,
  },
  {
    id: "ongar_distributor_road",
    start: { lat: 53.39398, lng: -6.444686 },
    end: { lat: 53.391576, lng: -6.436851 },
    trafficLevel: 0,
  },
];

const STATIC_MARKERS = [
  // Air Quality Markers
  {
    id: "roundabout_1",
    name: "Roundabout 1",
    type: "air_quality",
    baseImage: "/aqBase.png",
    activeImage: "/aqGreen.png",
    coords: { lat: 53.392255, lng: -6.439375 },
    color: "green",
  },
  {
    id: "roundabout_2",
    name: "Roundabout 2",
    type: "air_quality",
    baseImage: "/aqBase.png",
    activeImage: "/aqGreen.png",
    coords: { lat: 53.393649, lng: -6.444996 },
    color: "green", 
  },
  {
    id: "school",
    name: "School",
    type: "air_quality",
    baseImage: "/aqBase.png",
    activeImage: "/aqGreen.png",
    coords: { lat: 53.393612, lng: -6.441539 },
    color: "green", 
  },
  {
    id: "shopping_district_aq",
    name: "Shopping District AQ",
    type: "air_quality",
    baseImage: "/aqBase.png",
    activeImage: "/aqGreen.png",
    coords: { lat: 53.39531, lng: -6.439754 },
    color: "green", 
  },
  // Noise Pollution Markers
  {
    id: "playground_np",
    name: "Playground NP",
    type: "noise_pollution",
    baseImage: "/npBase.png",
    activeImage: "/npGreen.png",
    coords: { lat: 53.392686, lng: -6.439639 },
    color: "green",
  },
  {
    id: "ongar_west_np",
    name: "Ongar West NP",
    type: "noise_pollution",
    baseImage: "/npBase.png",
    activeImage: "/npGreen.png",
    coords: { lat: 53.395272, lng: -6.444579 },
    color: "green",
  },
  {
    id: "shopping_district_np",
    name: "Shopping District NP",
    type: "noise_pollution",
    baseImage: "/npBase.png",
    activeImage: "/npGreen.png",
    coords: { lat: 53.39551, lng: -6.438324 },
    color: "green",
  },
];

const routeCache: { [key: string]: any } = {};

// Utility functions
const calculateMarkerSize = (zoom: number): number => {
  const baseSize = 20;
  const scaleFactor = 1.5;
  return Math.max(baseSize, baseSize * (zoom / 15) * scaleFactor);
};

const createCustomMarker = (src: string, zoom: number): HTMLDivElement => {
  const size = calculateMarkerSize(zoom);
  const marker = document.createElement("div");

  Object.assign(marker.style, {
    backgroundImage: `url('${src}')`,
    backgroundSize: "contain",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    width: `${size}px`,
    height: `${size}px`,
  });

  return marker;
};

const Twin: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const markers = useRef<MarkerInfo[]>([]);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const [roads, setRoads] = useState<Road[]>(INITIAL_ROADS);
  const routeGeometries = useRef<{ [key: string]: number[][] }>({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLegendVisible, setIsLegendVisible] = useState(false);
  const [showImages, setShowImages] = useState(false); 

  // Fetch traffic data
  const fetchTrafficData = async () => {
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

  // Fetch route geometry
  const fetchRouteFromTomTom = async (start: { lat: number; lng: number }, end: { lat: number; lng: number }) => {
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

  const fetchAllRoutes = async (): Promise<FeatureCollection<LineString>> => {
    const features: any[] = [];
    const trafficData = await fetchTrafficData();

    for (const road of roads) {
      try {
        const coordinates = await fetchRouteFromTomTom(road.start, road.end);
        if (coordinates) {
          routeGeometries.current[road.id] = coordinates;
          features.push({
            type: "Feature",
            properties: {
              id: road.id,
              trafficLevel: road.trafficLevel,
            },
            geometry: {
              type: "LineString",
              coordinates,
            },
          });
        }
      } catch (error) {
        console.error(`Error processing road ${road.id}:`, error);
      }
    }

    return {
      type: "FeatureCollection",
      features,
    };
  };

  const calculateProximity = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number => {
    // Using Euclidean distance to calculate the distance
    return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2));
  };

  const updateTrafficLevels = useCallback(async () => {
    if (!map) return;
  
    // Route geometries
    if (Object.keys(routeGeometries.current).length === 0) {
      const allRoutesGeoJSON = await fetchAllRoutes();
      const source = map.getSource('routes') as maplibregl.GeoJSONSource;
      if (source) {
        source.setData(allRoutesGeoJSON);
      }
    }
  
    const newRoads = [...roads];
  
    // Reset traffic levels to initial values
    newRoads.forEach((road) => {
      road.trafficLevel = INITIAL_ROADS.find((r) => r.id === road.id)?.trafficLevel || 5;
    });

    // Update the static markers' images based on proximity
  const newMarkers = STATIC_MARKERS.map((marker) => {
    let isCloseToDraggable = false;

    // Check proximity of draggable markers to static markers
    markers.current.forEach((markerInfo) => {
      const markerLngLat = markerInfo.element.getLngLat();
      const distToMarker = calculateProximity(
        marker.coords.lat,
        marker.coords.lng,
        markerLngLat.lat,
        markerLngLat.lng
      );

      const proximityThreshold = 0.001; // Might need to change
      if (distToMarker <= proximityThreshold) {
        isCloseToDraggable = true;
      }
    });

    return {
      ...marker,
      color: isCloseToDraggable ? "green" : "red", 
    };
  });

    // Update the static marker elements on the map
  newMarkers.forEach((marker) => {
    const el = document.querySelector(`[data-id="${marker.id}"]`) as HTMLElement;
    if (el) {
      // Use the marker's specific base and active images
      el.style.backgroundImage = `url('${marker.color === "green" ? marker.activeImage : marker.baseImage}')`;
    }
  });
    
  
    // Apply marker impacts based on proximity
    markers.current.forEach((markerInfo) => {
      const markerLngLat = markerInfo.element.getLngLat();
  
      newRoads.forEach((road) => {
        const routeCoordinates = routeGeometries.current[road.id];
  
        // Check proximity for each segment of the road
        for (let i = 0; i < routeCoordinates.length - 1; i++) {
          const [lng1, lat1] = routeCoordinates[i];
          const [lng2, lat2] = routeCoordinates[i + 1];
  
          // Calculate distance to the start and end of the segment
          const distToStart = calculateProximity(markerLngLat.lat, markerLngLat.lng, lat1, lng1);
          const distToEnd = calculateProximity(markerLngLat.lat, markerLngLat.lng, lat2, lng2);
  
          // Proximity threshold (*** 0.001 in lat/lng degrees ***)
          const proximityThreshold = 0.001;
  
          if (distToStart <= proximityThreshold || distToEnd <= proximityThreshold) {
            road.trafficLevel += markerInfo.impact;
            road.trafficLevel = Math.max(0, Math.min(100, road.trafficLevel)); 
            break; 
          }
        }
      });
    });
  
    // Force update the map source
    const source = map.getSource("routes") as maplibregl.GeoJSONSource;
    if (source) {
      const geojson = {
        type: "FeatureCollection",
        features: newRoads.map((road) => ({
          type: "Feature",
          properties: {
            id: road.id,
            trafficLevel: road.trafficLevel,
          },
          geometry: {
            type: "LineString",
            coordinates: routeGeometries.current[road.id],
          },
        })),
      };
      
      console.log("GeoJSON data being passed to setData():", geojson);

      const source = map.getSource("routes") as maplibregl.GeoJSONSource;
      if (!source) {
        console.error("GeoJSON source not found");
        return;
      }

      source.setData(geojson as any);
    }
  
    setRoads(newRoads);
  }, [map, roads, markers.current]);

  useEffect(() => {
    if (!mapContainer.current) return;

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: fullMaptilerUrl,
      center: [-6.441287, 53.394306],
      zoom: 15.5,
      pitch: 45,
    });

    setMap(mapInstance);

    mapInstance.on("load", async () => {
      const allRoutesGeoJSON = await fetchAllRoutes();

      mapInstance.addSource("routes", {
        type: "geojson",
        data: allRoutesGeoJSON,
      });

      mapInstance.addLayer({
        id: "routes-layer",
        type: "line",
        source: "routes",
        paint: {
          "line-color": [
            "step",
            ["get", "trafficLevel"],
            "red",      
            5, "orange", 
            15, "green"  
          ],
          "line-width": 3,
          "line-opacity": 1.0, 
          "line-blur": 0,      
        },
      });

      STATIC_MARKERS.forEach((marker) => {
        const el = document.createElement("div");
        const isNoisePollution = marker.baseImage.includes("npBase") || marker.activeImage.includes("npGreen");
        Object.assign(el.style, {
          backgroundImage: `url('${marker.baseImage}')`, 
          backgroundSize: "contain",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          width: isNoisePollution ? "23px" : "30px", 
          height: isNoisePollution ? "23px" : "30px", 
          cursor: "pointer",
        });
      
        // Set a data-id attribute for future updates
        el.setAttribute("data-id", marker.id);
        el.setAttribute("data-type", marker.type);
      
        // Add the marker to the map
        new maplibregl.Marker({ element: el })
          .setLngLat([marker.coords.lng, marker.coords.lat])
          .addTo(mapInstance);
      });      

      // Add click event listener for routes
      mapInstance.on('click', 'routes-layer', (e) => {
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          const coordinates = e.lngLat;
          
          const roadId = feature.properties?.id || 'Unknown Road';
          const formattedRoadName = roadId
            .split('_')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          const trafficLevel = feature.properties?.trafficLevel || 0;
          
          if (popupRef.current) {
            popupRef.current.remove();
          }

          popupRef.current = new maplibregl.Popup({
            closeButton: true,
            closeOnClick: false,
            className: 'custom-popup'
          })
            .setLngLat(coordinates)
            .setHTML(`
              <div class="p-2">
                <h3 class="font-bold mb-2">${formattedRoadName}</h3>
                <p class="text-sm">Traffic Level: ${trafficLevel.toFixed(1)}%</p>
              </div>
            `)
            .addTo(mapInstance);
        }
      });

      // Change cursor when hovering over routes
      mapInstance.on('mouseenter', 'routes-layer', () => {
        mapInstance.getCanvas().style.cursor = 'pointer';
      });

      mapInstance.on('mouseleave', 'routes-layer', () => {
        mapInstance.getCanvas().style.cursor = '';
      });
    });

    // Setup drag and drop handlers
    const canvas = mapInstance.getCanvas();
    canvas.addEventListener("dragover", (e) => e.preventDefault());
    canvas.addEventListener("drop", (e: DragEvent) => {
      e.preventDefault();
      if (!e.dataTransfer || !mapContainer.current) return;

      const rect = mapContainer.current.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      const lngLat = mapInstance.unproject([offsetX, offsetY]);

      const src = e.dataTransfer.getData("imageSrc");
      const imageInfo = IMAGES.find(img => img.src === src);
      
      if (imageInfo) {
        const markerElement = createCustomMarker(src, mapInstance.getZoom());
        const marker = new maplibregl.Marker({
          element: markerElement,
          draggable: true,
        })
          .setLngLat([lngLat.lng, lngLat.lat])
          .addTo(mapInstance);

        markers.current.push({ 
          element: marker, 
          src, 
          impact: imageInfo.impact 
        });
      }
    });

    mapInstance.on("zoom", () => {
      const zoom = mapInstance.getZoom();
      markers.current.forEach(({ element }) => {
        const size = calculateMarkerSize(zoom);
        const markerElement = element.getElement();
        markerElement.style.width = `${size}px`;
        markerElement.style.height = `${size}px`;
      });
    });

    return () => {
      popupRef.current?.remove();
      mapInstance.remove();
    };
  }, []);

  useEffect(() => {
    console.log('Current markers:', markers.current); 
  }, [markers.current]);

  // Update the clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex justify-center items-center h-screen bg-green-100">
      <style>
        {`
          .custom-popup .maplibregl-popup-content {
            background-color: white;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          .custom-popup .maplibregl-popup-close-button {
            padding: 4px 8px;
            font-size: 16px;
          }
        `}
      </style>
      <div className="relative w-[80%] h-[70%] border-4 border-gray-300 rounded-md shadow-lg">
        <div className="absolute top-0 left-0 h-full w-full" ref={mapContainer} />

        {/* Clock Display */}
        <div className="absolute top-2 left-[50%] transform -translate-x-[50%] bg-white text-black font-bold py-1 px-2 rounded shadow-md">
        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} {/* Display the current time */}
        </div>
        
        {/* Update Traffic Button */}
        <div className="absolute top-2 right-2 flex flex-col space-y-2">
          <button
            onClick={updateTrafficLevels}
            className="bg-white hover:bg-white text-black font-bold py-2 px-4 rounded shadow"
            title="Simulate Congestion Levels"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 16 16"
              className="w-6 h-6"
              >
              <path d="M11.596 8.697l-6.363 4.692C4.53 13.846 4 13.573 4 13.035V2.965c0-.538.53-.812 1.233-.354l6.363 4.692c.703.518.703 1.354 0 1.394z" />
              </svg>
          </button>

          {/* Reset Button */}
        <button
          className="bg-white hover:bg-white text-black font-bold py-2 px-4 rounded shadow"
          title="Reset Map"
        >
          <svg
            fill="#000000"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6"
          >
            <path d="M12 16c1.671 0 3-1.331 3-3s-1.329-3-3-3-3 1.331-3 3 1.329 3 3 3z"></path>
            <path d="M20.817 11.186a8.94 8.94 0 0 0-1.355-3.219 9.053 9.053 0 0 0-2.43-2.43 8.95 8.95 0 0 0-3.219-1.355 9.028 9.028 0 0 0-1.838-.18V2L8 5l3.975 3V6.002c.484-.002.968.044 1.435.14a6.961 6.961 0 0 1 2.502 1.053 7.005 7.005 0 0 1 1.892 1.892A6.967 6.967 0 0 1 19 13a7.032 7.032 0 0 1-.55 2.725 7.11 7.11 0 0 1-.644 1.188 7.2 7.2 0 0 1-.858 1.039 7.028 7.028 0 0 1-3.536 1.907 7.13 7.13 0 0 1-2.822 0 6.961 6.961 0 0 1-2.503-1.054 7.002 7.002 0 0 1-1.89-1.89A6.996 6.996 0 0 1 5 13H3a9.02 9.02 0 0 0 1.539 5.034 9.096 9.096 0 0 0 2.428 2.428A8.95 8.95 0 0 0 12 22a9.09 9.09 0 0 0 1.814-.183 9.014 9.014 0 0 0 3.218-1.355 8.886 8.886 0 0 0 1.331-1.099 9.228 9.228 0 0 0 1.1-1.332A8.952 8.952 0 0 0 21 13a9.09 9.09 0 0 0-.183-1.814z"></path>
          </svg>
        </button>
      </div>

        {/* Toggle Legend Button */}
        <div className="absolute bottom-3 left-2">
          <button
            onClick={() => setIsLegendVisible(!isLegendVisible)}
            className="bg-white text-black font-bold py-2 px-4 rounded shadow-md flex items-center"
          >
            <svg
              viewBox="0 0 100 100"
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              aria-hidden="true"
              role="img"
              preserveAspectRatio="xMidYMid meet"
              fill="#000000"
              className="w-6 h-6"
            >
              <path d="M12.496 5.086a2.084 2.084 0 0 0-.03.002a2.084 2.084 0 0 0-1.77 1.04L.278 24.173a2.084 2.084 0 0 0 1.805 3.125h20.834a2.084 2.084 0 0 0 1.803-3.125L14.305 6.129a2.084 2.084 0 0 0-1.809-1.043zM40 14.486v7h15v-7H40zm22 0v7h38v-7H62zM2.084 39.672A2.084 2.084 0 0 0 0 41.756v16.666a2.084 2.084 0 0 0 2.084 2.084h20.832A2.084 2.084 0 0 0 25 58.422V41.756a2.084 2.084 0 0 0-2.084-2.084H2.084zM40 47.838v7h27v-7H40zm34 0v7h26v-7H74zM12.5 69.914c-6.879 0-12.5 5.621-12.5 12.5s5.621 12.5 12.5 12.5S25 89.293 25 82.414s-5.621-12.5-12.5-12.5zM40 81.19v7h15v-7H40zm22 0v7h38v-7H62z" />
            </svg>
          </button>
        </div>

        {/* Legend */}
        {isLegendVisible && (
          <div
            onClick={() => setIsLegendVisible(false)}
            className="absolute bottom-3 left-2 bg-white border rounded-md shadow-md p-2"
            style={{
              backgroundColor: "white",
              color: "black",
            }}
          >
            <h3 className="font-bold mb-2 text-center">Congestion Levels</h3>
            <div className="flex flex-col space-y-1">
              <div className="flex items-center">
                <div
                  className="w-4 h-4 rounded-full mr-2"
                  style={{ backgroundColor: "red" }}
                ></div><span>Heavy</span></div>
              <div className="flex items-center"><div
                  className="w-4 h-4 rounded-full mr-2"
                  style={{ backgroundColor: "orange" }}
                ></div><span>Moderate</span></div>
              <div className="flex items-center"><div
                  className="w-4 h-4 rounded-full mr-2"
                  style={{ backgroundColor: "green" }}
                  ></div><span>Light</span></div>
            </div>
          </div>
        )}

         {/* Wrench Icon to toggle the toolbox */}
        <div className="absolute top-2 left-2 z-20">
          <button
            onClick={() => setShowImages(!showImages)} 
            className="bg-white hover:bg-gray-200 text-black font-bold p-2 rounded-full shadow-md"
            title="Toggle Toolbox"
          >
            <svg
              fill="#000000"
              version="1.1"
              id="Capa_1"
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              viewBox="0 0 479.79 479.79"
              xmlSpace="preserve"
              className="w-6 h-6"
            >
              <g>
                <path d="M478.409,116.617c-0.368-4.271-3.181-7.94-7.2-9.403c-4.029-1.472-8.539-0.47-11.57,2.556l-62.015,62.011l-68.749-21.768 l-21.768-68.748l62.016-62.016c3.035-3.032,4.025-7.543,2.563-11.565c-1.477-4.03-5.137-6.837-9.417-7.207 c-37.663-3.245-74.566,10.202-101.247,36.887c-36.542,36.545-46.219,89.911-29.083,135.399c-1.873,1.578-3.721,3.25-5.544,5.053 L19.386,373.152c-0.073,0.071-0.145,0.149-0.224,0.219c-24.345,24.346-24.345,63.959,0,88.309 c24.349,24.344,63.672,24.048,88.013-0.298c0.105-0.098,0.201-0.196,0.297-0.305l193.632-208.621 c1.765-1.773,3.404-3.628,4.949-5.532c45.5,17.167,98.9,7.513,135.474-29.056C468.202,191.181,481.658,154.275,478.409,116.617z M75.98,435.38c-8.971,8.969-23.5,8.963-32.47,0c-8.967-8.961-8.967-23.502,0-32.466c8.97-8.963,23.499-8.963,32.47,0 C84.947,411.878,84.947,426.419,75.98,435.38z"></path>
              </g>
            </svg>
          </button>
        </div>

         {/* Draggable Images */}
         {showImages && ( // Conditionally render toolbox when `showImages` is true
         <div className="absolute top-12 left-2 flex flex-col space-y-2"
         style={{ zIndex: 10 }}
         >
                {IMAGES.map((image, index) => (
                    <div
                        key={index}
                        draggable
                        onDragStart={(e) => {
                            setIsDragging(true);
                            e.dataTransfer.setData("imageSrc", image.src);
                        }}
                        onDragEnd={() => setIsDragging(false)}
                        className={`p-2 bg-white border rounded shadow-md cursor-pointer ${
                            isDragging ? "opacity-50" : "opacity-100"
                        }`}
                        style={{
                            width: "60px",
                            height: "60px",
                            backgroundImage: `url('${image.src}')`,
                            backgroundSize: "contain",
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "center",
                        }}
                        title={image.name}
                    ></div>
                ))}
            </div>
         )}
        </div>
    </div>
);
};

export default Twin;