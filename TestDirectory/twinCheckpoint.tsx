import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { FeatureCollection, LineString, Feature, GeoJsonProperties } from "geojson";

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
    const [allRoutesGeoJSON, setAllRoutesGeoJSON] = useState<FeatureCollection<LineString> | null>(null);
    const markers = useRef<{ element: maplibregl.Marker; src: string }[]>([]);
    const popupRef = useRef<maplibregl.Popup | null>(null);
    const trafficImpactValue = 10;
    
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
    const features: Feature<LineString>[] = [];

    const trafficData = await fetchTrafficData();

    for (const road of roads) {
        try {
            const coordinates = await fetchRouteFromTomTom(road.start, road.end);

            if (coordinates) {
                const trafficLevel = trafficData[road.id.toLowerCase()] || 0;

                features.push({
                    type: "Feature",
                    properties: {
                        id: road.id,
                        trafficLevel,
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

    const geoJSON: FeatureCollection<LineString> = {
        type: "FeatureCollection",
        features,
    };

    setAllRoutesGeoJSON(geoJSON);
    return geoJSON;
};

    const updateAllRoutes = async () => {
        if (!map || !allRoutesGeoJSON) return; // Ensure data is available
    
        const source = map.getSource("routes") as maplibregl.GeoJSONSource;
        if (source) {
            source.setData(allRoutesGeoJSON); // Apply the updated GeoJSON data
        }

        resetRoutesLayer();

    };

    const resetRoutesLayer = () => {
        if (map) {
            // Remove the layer and source if they already exist
            if (map.getLayer("routes-layer")) {
                map.removeLayer("routes-layer");
            }
            if (map.getSource("routes")) {
                map.removeSource("routes");
            }
    
            // Check if allRoutesGeoJSON is not null before adding it
            if (allRoutesGeoJSON) {
                map.addSource("routes", {
                    type: "geojson",
                    data: allRoutesGeoJSON, // Use updated GeoJSON data
                });
    
                map.addLayer({
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
                            10,
                            "yellow",
                            20,
                            "orange",
                            30,
                            "red",
                        ],
                        "line-width": 6,
                    },
                });
            } else {
                console.error("GeoJSON data is null. Cannot reset routes layer.");
            }
        }
    };
    

    const updateTrafficWithMarker = async (markerPosition: { lng: number; lat: number }) => {
        if (!allRoutesGeoJSON) {
            console.error("GeoJSON data is not available for updating traffic.");
            return;
        }
    
        try {
            // Fetch updated traffic data (optional, could skip this if using local logic only)
            const response = await fetch(`${apiBaseUrl}/api/environment/updateTraffic`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ markerPosition }),
            });
    
            const updatedTrafficData = await response.json();
    
            const proximityThreshold = 5; 
    
            const updatedFeatures = allRoutesGeoJSON.features.map((feature) => {
                if (!feature.properties) {
                    console.warn(`Feature ${feature} has no properties.`);
                    return feature; 
                }
    
                // Calculate the distance between the marker and the road's start and end points
                const roadStart = feature.geometry.coordinates[0];
                const roadEnd = feature.geometry.coordinates[feature.geometry.coordinates.length - 1];
    
                const distanceToStart = calculateDistance(markerPosition, { lng: roadStart[0], lat: roadStart[1] });
                const distanceToEnd = calculateDistance(markerPosition, { lng: roadEnd[0], lat: roadEnd[1] });
    
                let trafficLevel = updatedTrafficData[feature.properties.id.toLowerCase()] || 0;
    
                // Apply the fixed traffic impact if the marker is within the proximity threshold
                if (distanceToStart < proximityThreshold || distanceToEnd < proximityThreshold) {
                    trafficLevel += trafficImpactValue; // Add 10 to traffic level
                }
    
                return {
                    ...feature,
                    properties: {
                        ...feature.properties,
                        trafficLevel,
                    },
                };
            });
    
            setAllRoutesGeoJSON({
                ...allRoutesGeoJSON,
                features: updatedFeatures,
            });
        } catch (error) {
            console.error("Error updating traffic data:", error);
        }
    };
    
    const calculateDistance = (point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number => {
        const toRadians = (deg: number) => (deg * Math.PI) / 180;
    
        const earthRadiusKm = 6371; // Earth's radius in kilometers
    
        const dLat = toRadians(point2.lat - point1.lat);
        const dLng = toRadians(point2.lng - point1.lng);
    
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(point1.lat)) * Math.cos(toRadians(point2.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
        return earthRadiusKm * c; // Distance in kilometers
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

                            marker.on("dragend", async () => {
                                const newLngLat = marker.getLngLat();
                                console.log("Marker moved to:", newLngLat);
                                
                                // Update traffic based on the marker's new position
                                await updateTrafficWithMarker({
                                    lng: newLngLat.lng,
                                    lat: newLngLat.lat,
                                });

                                // Update the map with the new traffic values
                                updateAllRoutes();
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
            
            <div className="absolute bottom-4 left-4">
            <button
            onClick={async () => {
                console.log("Running simulation...");
                // Add a marker-based traffic update logic for testing
                if (markers.current.length > 0) {
                    const markerPosition = markers.current[0].element.getLngLat();
                    await updateTrafficWithMarker({ lng: markerPosition.lng, lat: markerPosition.lat });
                }
                updateAllRoutes(); // Refresh the map
            }}
            
            className="px-4 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600">
                Run Simulation
                </button>
                    </div>


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
