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
  //useEffect(() => {
    //const timer = setInterval(() => {
      //setCurrentTime(new Date());
    //}, 1000);

    //return () => clearInterval(timer);
  //}, []);

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
        </div>

        {/* Toggle Legend Button */}
        <div className="absolute bottom-3 left-2">
          <button
            onClick={() => setIsLegendVisible(!isLegendVisible)}
            className="bg-white text-black font-bold py-2 px-4 rounded shadow-md"
          >
            {isLegendVisible ? "Hide Legend" : "Legend"} {/* Button text changes */}
          </button>
        </div>

        {/* Legend */}
        {isLegendVisible && (
        <div
            onClick={() => setIsLegendVisible(false)}
            className="absolute bottom-2 left-2 bg-white border rounded-md shadow-md p-2"
            style={{
              backgroundColor: "white",
              color: "black"
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

         {/* Draggable Images */}
         <div className="absolute top-2 left-2 flex flex-col space-y-2">
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
        </div>
    </div>
);
};

export default Twin;