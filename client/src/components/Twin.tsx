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

  // Fetch traffic data
  const fetchTrafficData = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/environment/latest`);
      const data = await response.json();
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
  newRoads.forEach(road => {
    road.trafficLevel = INITIAL_ROADS.find(r => r.id === road.id)?.trafficLevel || 5;
  });

  // Calculate total impact from all markers
  const totalImpact = markers.current.reduce((sum, marker) => sum + marker.impact, 0);
  console.log('Total impact:', totalImpact); 

  // Apply total impact to all roads
  newRoads.forEach(road => {
    road.trafficLevel += totalImpact;
    road.trafficLevel = Math.max(0, Math.min(100, road.trafficLevel));
    console.log(`Road ${road.id} new traffic level:`, road.trafficLevel); 
  });

  // Force update the map source
  const source = map.getSource('routes') as maplibregl.GeoJSONSource;
  if (source) {
    const geojson = {
      type: "FeatureCollection",
      features: newRoads.map(road => ({
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
}, [map, roads]);

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
            "interpolate",
            ["linear"],
            ["get", "trafficLevel"],
            0, "red",
            5, "blue",
            15, "green",
          ],
          "line-width": 3,
        },
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
        <div className="absolute top-2 left-[50%] transform -translate-x-[50%] bg-white text-black font-bold py-2 px-4 rounded shadow-md">
          {currentTime.toLocaleTimeString()} {/* Display the current time */}
        </div>
        
        {/* Update Traffic Button */}
        <div className="absolute top-2 right-2 flex flex-col space-y-2">
          <button
            onClick={updateTrafficLevels}
            className="bg-white hover:bg-white text-black font-bold py-2 px-4 rounded shadow"
          >
            Simulate Traffic Levels
          </button>
        </div>

        {/* Legend */}
        <div
        className="absolute bottom-2 left-2 bg-white border bg-white rounded-md shadow-md p-2"
        style={{
            backgroundColor: "bg-white",
            color: "black",
        }}
        >
            <h3 className="font-bold mb-2 text-center">Traffic Busyness Levels</h3>
            <div className="flex flex-col space-y-1">
                <div className="flex items-center">
                    <div
                    className="w-4 h-4 rounded-full mr-2"
                    style={{ backgroundColor: "red" }}
                    ></div><span>Heavy</span></div>
                    <div className="flex items-center"><div
                        className="w-4 h-4 rounded-full mr-2"
                        style={{ backgroundColor: "blue" }}
                        ></div><span>Moderate</span></div>
                        <div className="flex items-center"><div
                            className="w-4 h-4 rounded-full mr-2"
                            style={{ backgroundColor: "green" }}
                            ></div><span>Light</span></div>
                     </div>
                </div>        

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