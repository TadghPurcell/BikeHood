import React, { useEffect, useRef, useState, useCallback } from "react";
import ReactDOMServer from "react-dom/server";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { FeatureCollection, LineString } from "geojson";
import { Road, MarkerInfo, EnvNoiseMarker } from "./twin/types";
import { calculateMarkerSize, createCustomMarker, calculateProximity, delay, getAirQualityMarker, getNoiseMarker } from "./twin/utils";
import { fetchTrafficData, fetchHistoricalTrafficData, fetchEnvironmentData, fetchHistoricalEnvironmentData, fetchNoiseData, fetchRouteFromTomTom } from "./twin/api";
import ControlPanel from "./twin/ControlPanel";
import AnimatedToolbox from "./twin/toolbox";
import NoisePopup from "./twin/NoisePopup";
import AirQualityPopup from "./twin/AirQuality";

import {
  maptilerUrl,
  maptilerKey,
  apiBaseUrl,
  tomtomKey,
  fullMaptilerUrl,
  IMAGES,
  INITIAL_ROADS,
  STATIC_MARKERS,
} from "./twin/constants";

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
  const [mapSize, setMapSize] = useState("normal");
  const [environmentData, setEnvironmentData] = useState(null);
  const [noiseData, setNoiseData] = useState(null);
  const PM2_5_THRESHOLD = 50;
  const NOISE_LAEQ_THRESHOLD = 45;
  const [envNoiseMarkers, setEnvNoiseMarkers] = useState<EnvNoiseMarker[]>([]);
  const [showMarkers, setShowMarkers] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [selectedTimestamp, setSelectedTimestamp] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const envData = await fetchEnvironmentData();  
      const noiseData = await fetchNoiseData();     
  
      const updatedMarkers: EnvNoiseMarker[] = STATIC_MARKERS.map((m) => {
        if (m.type === "air_quality") {
          return {
            id: m.id,
            type: "air_quality",
            pm2_5: envData.pm2_5 ? Number(envData.pm2_5) : 0, 
          };
        } else {
          return {
            id: m.id,
            type: "noise_pollution",
            laeq: noiseData.laeq ? Number(noiseData.laeq) : 0,
          };
        }
      });
  
      setEnvNoiseMarkers(updatedMarkers);
    })();
  }, []);  

  const fetchAllRoutes = async (): Promise<FeatureCollection<LineString>> => {
    const features: any[] = [];
    const trafficData = await fetchTrafficData();

    for (const road of roads) {
      try {
        await delay(500);
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
    if (!map.hasOwnProperty('_processedImpacts')) {
      (map as any)._processedImpacts = new Set();
    }
    const processedImpacts = (map as any)._processedImpacts as Set<string>;

  markers.current.forEach((markerInfo) => {
    const markerLngLat = markerInfo.element.getLngLat();
    const imageItem = IMAGES.find((img) => img.src === markerInfo.src);
    if (!imageItem) return;

    // For each environment/noise marker in state
    setEnvNoiseMarkers((prev) => {
      return prev.map((envMarker) => {
        const staticMarkerDef = STATIC_MARKERS.find((sm) => sm.id === envMarker.id);
        if (!staticMarkerDef) return envMarker;
    
        const dist = calculateProximity(
          staticMarkerDef.coords.lat,
          staticMarkerDef.coords.lng,
          markerLngLat.lat,
          markerLngLat.lng
        );
    
        if (dist <= 0.002 && envMarker.type === "noise_pollution" && envMarker.laeq !== undefined) {
          const oldLaeq = envMarker.laeq;
          const delta = imageItem.noiseDelta || 0;
          const newLaeq = Math.max(0, oldLaeq + delta);
    
          console.log(
            `[Noise Update] Marker: ${envMarker.id}, ` +
            `Old LAeq: ${oldLaeq}, ` +
            `Delta: ${delta}, ` +
            `New LAeq: ${newLaeq}`
          );
    
          // Update it
          return {
            ...envMarker,
            laeq: newLaeq,
          };
        }
    
        if (dist <= 0.002 && envMarker.type === "air_quality" && envMarker.pm2_5 !== undefined) {
          const oldPm25 = envMarker.pm2_5;
          const delta = imageItem.pm25Delta || 0;
          const newPm25 = Math.max(0, oldPm25 + delta);
    
          console.log(
            `[AQ Update] Marker: ${envMarker.id}, ` +
            `Old PM2.5: ${oldPm25}, ` +
            `Delta: ${delta}, ` +
            `New PM2.5: ${newPm25}`
          );
    
          return {
            ...envMarker,
            pm2_5: newPm25,
          };
        }
        return envMarker;
      });
    });
  });

  // --- 3) Threshold Checks & Update Marker Icons (Step 5)
  setEnvNoiseMarkers((prev) => {
    return prev.map((envMarker) => {
      const el = document.querySelector(
        `[data-id="${envMarker.id}"]`
      ) as HTMLElement;
      if (!el) return envMarker;

      // Decide marker icon based on updated reading
      let newIcon = "";
      if (envMarker.type === "air_quality" && envMarker.pm2_5 !== undefined) {
        newIcon = getAirQualityMarker(envMarker.pm2_5);
      } else if (envMarker.type === "noise_pollution" && envMarker.laeq !== undefined) {
        newIcon = getNoiseMarker(envMarker.laeq);
      }

      // Update the DOM
      if (newIcon) {
        el.style.backgroundImage = `url('${newIcon}')`;
      }

      return envMarker;
    });
  });

  
  // Apply marker impacts based on proximity
  markers.current.forEach((markerInfo) => {
    const markerLngLat = markerInfo.element.getLngLat();

    newRoads.forEach((road, index) => {
      const routeCoordinates = routeGeometries.current[road.id];
      const impactKey = `${markerLngLat.lat},${markerLngLat.lng}-${road.id}`;

      if (!processedImpacts.has(impactKey)) {
        let shouldApplyImpact = false;

      // Check proximity for each segment of the road
      for (let i = 0; i < routeCoordinates.length - 1; i++) {
        const [lng1, lat1] = routeCoordinates[i];
        const [lng2, lat2] = routeCoordinates[i + 1];

        // Calculate distance to the start and end of the segment
        const distToStart = calculateProximity(markerLngLat.lat, markerLngLat.lng, lat1, lng1);
        const distToEnd = calculateProximity(markerLngLat.lat, markerLngLat.lng, lat2, lng2);

        if (distToStart <= 0.001 || distToEnd <= 0.001) {
          shouldApplyImpact = true;
          break;
        }
      }

        if (shouldApplyImpact) {
          newRoads[index] = {
            ...road,
            trafficLevel: Math.max(0, Math.min(100, road.trafficLevel + markerInfo.impact))
          };
          processedImpacts.add(impactKey);
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
    const updateMapWithHistoricalTraffic = async () => {
      if (!map || !selectedTimestamp) return;

      // Fetch historical traffic data
      const historicalTrafficData = await fetchHistoricalTrafficData(
        selectedTimestamp - 1200, 
        selectedTimestamp + 1200  
      );

      // Update roads with historical data
      const updatedRoads = INITIAL_ROADS.map(road => ({
        ...road,
        trafficLevel: historicalTrafficData[road.id] || road.trafficLevel
      }));

      // Update the map source with historical data
      const source = map.getSource("routes") as maplibregl.GeoJSONSource;
      if (source) {
        const geojson = {
          type: "FeatureCollection",
          features: updatedRoads.map((road) => ({
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

        source.setData(geojson as any);
      }

      // Update roads state
      setRoads(updatedRoads);
    };

    updateMapWithHistoricalTraffic();
  }, [selectedTimestamp, map]);

  useEffect(() => {
    const updateAirQualityMarkersWithHistoricalData = async () => {
      if (!selectedTimestamp) return;
  
      try {
        // Fetch historical environment data for the given timestamp range
        const historicalEnvData = await fetchHistoricalEnvironmentData(
          selectedTimestamp - 1200, 
          selectedTimestamp + 1200
        );
  
        if (historicalEnvData.error) {
          console.error("No historical data available for the selected time range");
          return;
        }
  
        // Update air quality markers with historical PM2.5 data
        setEnvNoiseMarkers((prevMarkers) =>
          prevMarkers.map((marker) => {
            if (marker.type === "air_quality") {
              return {
                ...marker,
                pm2_5: historicalEnvData.pm2_5 || marker.pm2_5,
              };
            }
            return marker;
          })
        );
  
        // Update marker icons based on historical PM2.5 values
        STATIC_MARKERS.forEach((marker) => {
          if (marker.type === "air_quality") {
            const el = document.querySelector(`[data-id="${marker.id}"]`) as HTMLElement;
            if (!el) return;
  
            const historicalPm25 = historicalEnvData.pm2_5 || 0;
            const newIcon = getAirQualityMarker(historicalPm25); // Helper to get the correct icon
  
            el.style.backgroundImage = `url('${newIcon}')`;
          }
        });
      } catch (error) {
        console.error("Error fetching or applying historical environment data:", error);
      }
    };
  
    updateAirQualityMarkersWithHistoricalData();
  }, [selectedTimestamp]);
  

  const resetMap = useCallback(async () => {
    // 1. Clear all draggable markers
    if (map && (map as any)._processedImpacts) {
      (map as any)._processedImpacts.clear();
    }
    markers.current.forEach(marker => {
      marker.element.remove();
    });
    markers.current = [];
  
    // 2. Reset static markers to their original state
    const freshEnvData = await fetchEnvironmentData();
    const freshNoiseData = await fetchNoiseData();

    STATIC_MARKERS.forEach((marker) => {
      const el = document.querySelector(`[data-id="${marker.id}"]`) as HTMLElement;
      if (!el) return;
  
      // Determine the correct icon based on current values
      let initialIcon = "";
      if (marker.type === "air_quality") {
        const currentPm25 = freshEnvData.pm2_5 ? Number(freshEnvData.pm2_5) : 0;
        initialIcon = getAirQualityMarker(currentPm25); // Helper for air quality
      } else if (marker.type === "noise_pollution") {
        const currentLaeq = freshNoiseData.laeq ? Number(freshNoiseData.laeq) : 0;
        initialIcon = getNoiseMarker(currentLaeq); // Helper for noise pollution
      }
  
      // Update the marker's background image
      el.style.backgroundImage = `url('${initialIcon}')`;
    });
  
    // 3. Fetch live traffic data
    const liveTrafficData = await fetchTrafficData();
  
    // 4. Create a copy of the roads with live data
    const resetRoads = INITIAL_ROADS.map(road => ({
      ...road,
      trafficLevel: liveTrafficData[road.id] || road.trafficLevel
    }));

    // 6. Rebuild the envNoiseMarkers array
    const newEnvNoiseMarkers: EnvNoiseMarker[] = STATIC_MARKERS.map((m) => {
      // cast `m.type` to the literal union
      const markerType = m.type as "air_quality" | "noise_pollution";  
      if (markerType === "air_quality") {
        return {
          id: m.id,
          type: "air_quality",
          pm2_5: Number(freshEnvData.pm2_5 ?? 0),
        };
      } else {
        return {
          id: m.id,
          type: "noise_pollution",
          laeq: Number(freshNoiseData.laeq ?? 0),
        };
      }
    });
  
    // Update the map with reset data
    if (map) {
      const source = map.getSource("routes") as maplibregl.GeoJSONSource;
      if (source) {
        const resetGeojson = {
          type: "FeatureCollection",
          features: resetRoads.map((road) => ({
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
        
        console.log("GeoJSON data being passed to setData():", resetGeojson);

        const source = map.getSource("routes") as maplibregl.GeoJSONSource;
      if (!source) {
        console.error("GeoJSON source not found");
        return;
      }
  
        source.setData(resetGeojson as any);
      }
    }
  
    setEnvNoiseMarkers(newEnvNoiseMarkers);
    // Update state with reset roads
    setRoads(resetRoads);
  }, [map]);

  useEffect(() => {
    if (!mapContainer.current) return;

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: fullMaptilerUrl,
      center: [-6.441287, 53.394306],
      zoom: 15.5,
      pitch: 45,
      attributionControl: false,
    });

    setMap(mapInstance);

    const handleMapLoad = async () => {
      // Fetch initial traffic data
      const initialTrafficData = await fetchTrafficData();
      const envData = await fetchEnvironmentData();
      const noiseData = await fetchNoiseData();
      
      // Update initial roads with live traffic data
      const updatedRoads = INITIAL_ROADS.map(road => ({
        ...road,
        trafficLevel: initialTrafficData[road.id] || road.trafficLevel
      }));
      
      // Update roads state
      setRoads(updatedRoads);

      // Fetch all route geometries first
      const routePromises = updatedRoads.map(async (road) => {
        const coordinates = await fetchRouteFromTomTom(road.start, road.end);
        routeGeometries.current[road.id] = coordinates || [];
        return {
          type: "Feature" as const,
          properties: {
            id: road.id,
            trafficLevel: road.trafficLevel,
          },
          geometry: {
            type: "LineString" as const,
            coordinates: coordinates || [],
          },
        };
      });

      const features = await Promise.all(routePromises);

      const allRoutesGeoJSON: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: features,
      };

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
            49, "#ff0000",           
            50, "#ffa500",          
            100, "#049613"        
          ],
          "line-width": 3,
          "line-opacity": 1.0, 
          "line-blur": 0,      
        },
      });

      // Fetch routes sequentially
      for (const road of updatedRoads) {
        await delay(1000); 
        try {
          const coordinates = await fetchRouteFromTomTom(road.start, road.end);
          if (coordinates) {
            routeGeometries.current[road.id] = coordinates;
            
            // Update the source with each new route
            const source = mapInstance.getSource("routes") as maplibregl.GeoJSONSource;
            if (source) {
              const currentData = (source.serialize().data as any);
              const features = [...(currentData.features || []), {
                type: "Feature",
                properties: {
                  id: road.id,
                  trafficLevel: road.trafficLevel,
                },
                geometry: {
                  type: "LineString",
                  coordinates,
                },
              }];
              
              source.setData({
                type: "FeatureCollection",
                features,
              });
            }
          }
        } catch (error) {
          console.error(`Error fetching route for ${road.id}:`, error);
        }
      }

      // Add static markers
      STATIC_MARKERS.forEach((marker) => {
        const el = document.createElement("div");
    
        // Determine the correct starting color based on the current values
        let initialIcon = "";
        if (marker.type === "air_quality") {
          const currentPm25 = envData.pm2_5 ? Number(envData.pm2_5) : 0;
          initialIcon = getAirQualityMarker(currentPm25);
        } else if (marker.type === "noise_pollution") {
          const currentLaeq = noiseData.laeq ? Number(noiseData.laeq) : 0;
          initialIcon = getNoiseMarker(currentLaeq);
        }

        Object.assign(el.style, {
          backgroundImage: `url('${initialIcon}')`,
          backgroundSize: "contain",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          width: "45px",
          height: "45px",
          cursor: "pointer",
        });
    
        // Set a data-id attribute for future updates
        el.setAttribute("data-id", marker.id);
        el.setAttribute("data-type", marker.type);
    
        // Add the marker to the map
        const markerInstance = new maplibregl.Marker({ element: el })
          .setLngLat([marker.coords.lng, marker.coords.lat])
          .addTo(mapInstance);
      
        // 3. On click, fetch data and open a MapLibre Popup
        el.addEventListener("click", async () => {
          // If there’s already an open popup, remove it
          if (popupRef.current) {
            popupRef.current.remove();
          }
      
          let data;
          if (marker.type === "air_quality") {
            const airQualityData = await fetchEnvironmentData();
            if (!airQualityData) return;
    
            // Create a new popup
            const popupContent = ReactDOMServer.renderToString(
              <AirQualityPopup
              data={{
                current: airQualityData.pm2_5 || 0,
                aqi: airQualityData.aqi || 0,
                status: airQualityData.status || "Unknown",
                hourlyAvg: airQualityData.hourlyAvg || 0,
                dailyAvg: airQualityData.dailyAvg || 0,
              }}
              onClose={() => popupRef.current?.remove()}
            />
            );
    
            popupRef.current = new maplibregl.Popup({
              closeButton: true, 
              closeOnClick: false,
              className: "custom-popup",
            })
              .setLngLat([marker.coords.lng, marker.coords.lat])
              .setHTML(popupContent)
              .addTo(mapInstance);
          } else if (marker.type === "noise_pollution") {
            const noiseData = await fetchNoiseData();
            if (!noiseData) return;
    
            const popupContent = ReactDOMServer.renderToString(
              <NoisePopup data={noiseData} />
            );
    
            popupRef.current = new maplibregl.Popup({
              closeButton: true,
              closeOnClick: false,
              className: "custom-popup",
            })
              .setLngLat([marker.coords.lng, marker.coords.lat])
              .setHTML(popupContent)
              .addTo(mapInstance);
          }
        });
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
    };

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

    mapInstance.on("load", handleMapLoad);

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

  // Resize the map depending on which version it is
  useEffect(() => {
    if (map) {
      map.resize(); 
    }
  }, [map, mapSize]);

  // Toggle routes + maps vis
  useEffect(() => {
    if (!map) return;
  
    // Toggle routes Layer Visibility
    const routesLayer = map.getLayer("routes-layer");
    if (routesLayer) {
      map.setLayoutProperty("routes-layer", "visibility", showRoutes ? "visible" : "none");
    }
  
    // Toggle markers Visibility
    STATIC_MARKERS.forEach((marker) => {
      const markerElement = document.querySelector(`[data-id="${marker.id}"]`) as HTMLElement;
      if (markerElement) {
        markerElement.style.display = showMarkers ? "block" : "none";
      }
    });
  }, [showMarkers, showRoutes, map]); 
  
  return (
    <div className="h-screen w-screen flex overflow-hidden">
      {/* Control Panel */}
      <div className="w-72 bg-white border-r border-gray-300 shadow-lg flex-shrink-0 p-4">
        <ControlPanel
          onSimulate={updateTrafficLevels}
          onReset={resetMap}
          showMarkers={showMarkers}
          onToggleMarkers={setShowMarkers}
          showRoutes={showRoutes}
          onToggleRoutes={setShowRoutes}
          onTimestampChange={(timestamp) => setSelectedTimestamp(timestamp)}
        />
      </div>
  
      {/* MAP SECTION */}
      <div className="relative flex-1 bg-green-100">
        {/* Map Container */}
        <div ref={mapContainer} className="absolute top-0 left-0 w-full h-full" />
  
        {/* Clock Display */}
        <div className="absolute top-2 left-[50%] transform -translate-x-[50%] bg-white text-black font-bold py-1 px-2 rounded shadow-md">
        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} {/* Display the current time */}
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
  
        {isLegendVisible && (
        <div
          onClick={() => setIsLegendVisible(false)}
          className="absolute bottom-3 left-2 bg-white border rounded-md shadow-md p-4 flex flex-col items-center space-y-4"
          style={{ backgroundColor: "white", color: "black", minWidth: "200px" }}
        >
          <h3 className="font-bold mb-2 text-center">Congestion Levels</h3>
          {/* Gradient bar */}
          <div className="flex items-center w-full space-x-4">
            <span className="text-sm whitespace-nowrap">Calm</span>
            <div
              className="flex-1 h-2 rounded-full"
              style={{
                background: "linear-gradient(to right, red 15%, orange 40%, green 85%)",
              }}
            ></div>
            <span className="text-sm whitespace-nowrap">Busy</span>
        </div>
      </div>
    )}
  
        {/* Toggle Map Size Button */}
        <div className="absolute bottom-3 right-2 z-20">
          <button
            onClick={() => setMapSize((prev) => (prev === "large" ? "normal" : "large"))}
            className="bg-white hover:bg-gray-200 text-black font-bold p-2 rounded-md shadow-md"
            title="Toggle Map Size"
          >
            <svg
              height="24px"
              width="24px"
              viewBox="0 0 472.3 472.3"
              xmlns="http://www.w3.org/2000/svg"
              fill="#000000"
            >
              <g>
                <path d="M402.708,61.688l-89.879-0.022c-2.621,0-4.989,1.584-5.987,4.005c-1.007,2.421-0.455,5.203,1.398,7.064l33.839,33.838L107.36,342.54l-33.809-33.809c-1.853-1.852-4.643-2.405-7.064-1.406c-2.421,1.006-3.997,3.368-3.997,5.989l-0.008,89.862c0,3.582,2.896,6.48,6.48,6.48l89.878,0.022c2.622,0,4.989-1.582,5.987-4.003c1.008-2.423,0.455-5.205-1.398-7.066l-33.809-33.808l178.827-180.133l55.862-55.864l33.809,33.809c1.853,1.853,4.643,2.406,7.064,1.406c2.421-1.006,3.997-3.366,3.997-5.987l0.008-89.863C409.188,64.587,406.29,61.688,402.708,61.688z"></path>
                <path d="M435.279,0H37.022C16.574,0,0,16.573,0,37.022v398.256C0,455.727,16.574,472.3,37.022,472.3h398.258c20.447,0,37.021-16.573,37.021-37.022V37.022C472.3,16.573,455.727,0,435.279,0z M440.813,435.278c0,3.052-2.482,5.535-5.534,5.535H37.022c-3.052,0-5.535-2.483-5.535-5.535V37.022c0-3.053,2.483-5.536,5.535-5.536h398.258c3.051,0,5.534,2.483,5.534,5.536V435.278z"></path>
              </g>
            </svg>
          </button>
        </div>
  
        <AnimatedToolbox
          images={IMAGES}
          onDragStart={(e, imageSrc) => {
            setIsDragging(true);
            e.dataTransfer.setData("imageSrc", imageSrc);
          }}
          isDragging={isDragging}
        />
      </div>
    </div>
  );
};

export default Twin;