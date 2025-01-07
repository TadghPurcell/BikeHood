import React, { useEffect, useRef, useState } from "react";
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

const routeCache: { [key: string]: any } = {};

const Twin = () => {
    const mapContainer = useRef<HTMLDivElement | null>(null);
    const [map, setMap] = useState<maplibregl.Map | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const markers = useRef<{ element: maplibregl.Marker; src: string }[]>([]);
    const popupRef = useRef<maplibregl.Popup | null>(null);
    
    const images = [
        { name: "Bike", src: "/bike.png" },
        { name: "Bike Pump", src: "/bikepump.png" },
        { name: "Bike Rack", src: "/Bikerack.png" },
        { name: "Bike Repair Wall Mount", src: "/bikerepairwallmount.png" },
        { name: "Bike Shed", src: "/bikeshed.png" },
    ];

    const roads = [
        {
            id: "littleplace_castleheaney_distributor_road_north",
            start: { lat: 53.396809, lng: -6.442519 },
            end: { lat: 53.394976, lng: -6.444193 },
        },
        {
          id: "littleplace_castleheaney_distributor_road_south",
          start: { lat: 53.394976, lng: -6.444193 },
          end: { lat: 53.396809, lng: -6.442519 },
        },
        {
            id: "main_street",
            start: { lat: 53.395786, lng: -6.441064 },
            end: { lat: 53.394084, lng: -6.438794 },
        },
        {
            id: "ongar_barnhill_distributor_road",
            start: { lat: 53.392969, lng: -6.445409 },
            end: { lat: 53.394976, lng: -6.444193 },
        },
        {
            id: "ongar_distributor_road",
            start: { lat: 53.39398, lng: -6.444686 },
            end: { lat: 53.391576, lng: -6.436851 },
        },
        {
            id: "ongar_distributor_road_east",
            start: { lat: 53.391576, lng: -6.436851 },
            end: { lat: 53.391115, lng: -6.439771 },
        },
        {
            id: "station_road",
            start: { lat: 53.391115, lng: -6.439771 },
            end: { lat: 53.391576, lng: -6.436851 },
        },
        {
            id: "the_avenue",
            start: { lat: 53.395994, lng: -6.438525 },
            end: { lat: 53.392862, lng: -6.441783 },
        },
        {
            id: "the_mall",
            start: { lat: 53.394084, lng: -6.438794 },
            end: { lat: 53.395872, lng: -6.441064 },
        },
    ];

    // Fetch traffic data
    const fetchTrafficData = async () => {
        try {
            const response = await fetch(`${apiBaseUrl}/api/environment/latest`);
            const data = await response.json();
            return data; // Returns the traffic data object
        } catch (error) {
            console.error("Error fetching traffic data:", error);
            return {};
        }
    };

    // Fetch route geometry
    const fetchRouteFromTomTom = async (start: { lat: number; lng: number }, end: { lat: number; lng: number }) => {
      const cacheKey = `${start.lat},${start.lng}-${end.lat},${end.lng}`;
      if (routeCache[cacheKey]) {
          return routeCache[cacheKey]; // Return cached result
      }
  
      const url = `https://api.tomtom.com/routing/1/calculateRoute/${start.lat},${start.lng}:${end.lat},${end.lng}/json?key=${tomtomKey}&traffic=true`;
  
      try {
          const response = await fetch(url);
  
          if (response.status === 429) {
              console.error("Rate limit exceeded. Please wait and try again later.");
              return null;
          }
  
          if (!response.ok) {
              console.error(`Error fetching route. Status: ${response.status}`);
              return null;
          }
  
          const data = await response.json();
          const coordinates = data.routes[0].legs[0].points.map((point: any) => [
              point.longitude,
              point.latitude,
          ]);
  
          routeCache[cacheKey] = coordinates; // Cache the result
          return coordinates;
      } catch (error) {
          console.error("Error fetching route from TomTom API:", error);
          return null;
      }
  };

    const fetchAllRoutes = async (): Promise<FeatureCollection<LineString>> => {
        const features: FeatureCollection<LineString>["features"] = [];

        // Fetch traffic data
        const trafficData = await fetchTrafficData();

        for (const road of roads) {
            try {
                // Fetch route geometry from TomTom
                const coordinates = await fetchRouteFromTomTom(road.start, road.end);

                if (coordinates) {
                    // Get traffic level for the current road
                    const trafficLevel = trafficData[road.id.toLowerCase()] || 0; // Default to 0 if no traffic data

                    features.push({
                        type: "Feature",
                        properties: {
                            id: road.id,
                            trafficLevel, // Add traffic level here
                        },
                        geometry: {
                            type: "LineString",
                            coordinates, // Use detailed route geometry
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

    const updateAllRoutes = async () => {
        if (!map) return;

        const allRoutesGeoJSON = await fetchAllRoutes();

        if (allRoutesGeoJSON) {
            const source = map.getSource("routes") as maplibregl.GeoJSONSource;
            if (source) {
                source.setData(allRoutesGeoJSON);
            }
        }
    };

    useEffect(() => {
        if (!mapContainer.current) return;

        const mapInstance = new maplibregl.Map({
            container: mapContainer.current,
            style: fullMaptilerUrl,
            center: [-6.441783, 53.392862],
            zoom: 14,
            pitch: 45,
        });

        setMap(mapInstance);

        mapInstance.on("load", async () => {
            const allRoutesGeoJSON = await fetchAllRoutes();

            if (allRoutesGeoJSON) {
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
                            0,
                            "green",
                            5,
                            "blue",
                            100,
                            "red",
                        ],
                        "line-width": 6,
                    },
                });

                // Add click event listener for routes
                mapInstance.on('click', 'routes-layer', (e) => {
                  if (e.features && e.features.length > 0) {
                      const feature = e.features[0];
                      const coordinates = e.lngLat;
                      
                      // Format road ID to be more readable
                      const roadId = feature.properties?.id || 'Unknown Road';
                      const formattedRoadName = roadId
                          .split('_')
                          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ');
                      
                      // Get traffic level
                      const trafficLevel = feature.properties?.trafficLevel || 0;
                      
                      // Remove existing popup if it exists
                      if (popupRef.current) {
                          popupRef.current.remove();
                      }

                      // Create new popup
                      popupRef.current = new maplibregl.Popup({
                          closeButton: true,
                          closeOnClick: false,
                          className: 'custom-popup'
                      })
                          .setLngLat(coordinates)
                          .setHTML(`
                              <div class="p-2">
                                  <h3 class="font-bold mb-2">${formattedRoadName}</h3>
                                  <p class="text-sm">Traffic Level: ${trafficLevel}%</p>
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

                setInterval(() => {
                    updateAllRoutes();
                }, 60000);
            }

            mapInstance.on("zoom", () => {
                const zoom = mapInstance.getZoom();
                resizeMarkers(zoom); // Adjust sizes dynamically
            });

            mapInstance.getCanvas().addEventListener("dragover", (e) => e.preventDefault());
            mapInstance.getCanvas().addEventListener("drop", (e: DragEvent) => {
                e.preventDefault();
                if (e.dataTransfer && mapContainer.current) {
                    const rect = mapContainer.current.getBoundingClientRect();
                    const offsetX = e.clientX - rect.left;
                    const offsetY = e.clientY - rect.top;
                    const lngLat = mapInstance.unproject([offsetX, offsetY]);

                    const src = e.dataTransfer.getData("imageSrc");
                    if (src) {
                        const markerElement = createCustomMarker(src, mapInstance.getZoom());
                        const marker = new maplibregl.Marker({
                            element: markerElement,
                            draggable: true,
                        })
                            .setLngLat([lngLat.lng, lngLat.lat])
                            .addTo(mapInstance);

                        marker.on("dragend", () => {
                            const newLngLat = marker.getLngLat();
                            console.log("Marker moved to:", newLngLat);
                        });

                        // Store marker and its source for resizing
                        markers.current.push({ element: marker, src });
                    }
                }
            });
        });

        return () => {
          if (popupRef.current) {
              popupRef.current.remove();
          }
          mapInstance.remove();
      };
  }, []);

    // Helper to create a marker with size based on zoom level
    const createCustomMarker = (src: string, zoom: number) => {
        const size = calculateSize(zoom);
        const marker = document.createElement("div");

        marker.style.backgroundImage = `url('${src}')`;
        marker.style.backgroundSize = "contain"; 
        marker.style.backgroundPosition = "center";
        marker.style.backgroundRepeat = "no-repeat";
        marker.style.width = `${size}px`;
        marker.style.height = `${size}px`;

        return marker;
    };


    // Adjust marker sizes dynamically based on zoom level
    const resizeMarkers = (zoom: number) => {
        const size = calculateSize(zoom);
        markers.current.forEach(({ element }) => {
            const markerElement = element.getElement();
            markerElement.style.width = `${size}px`;
            markerElement.style.height = `${size}px`;
        });
    };

    // Calculate size based on zoom level
    const calculateSize = (zoom: number) => {
        const baseSize = 20; // Base size of the marker
        const scaleFactor = 1.5; // Scale factor for responsiveness
        return Math.max(baseSize, baseSize * (zoom / 15) * scaleFactor);
    };

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
        <div className="relative w-[80%] h-[70%] border-4 border-gray-300 rounded-md shadow-lg"
        >
            {/* Map Container */}
            <div
                className="absolute top-0 left-0 h-full w-full"
                ref={mapContainer}
            ></div>

            {/* Draggable Images */}
            <div className="absolute top-2 left-2 flex flex-col space-y-2">
                {images.map((image, index) => (
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
