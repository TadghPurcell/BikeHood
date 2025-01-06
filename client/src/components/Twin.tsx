import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
// import dot env

// Access environment variables
const maptilerUrl = import.meta.env.VITE_MAPTILER_URL;
const maptilerKey = import.meta.env.VITE_MAPTILER_API_KEY;

// Construct the full URL
const fullMaptilerUrl = `${maptilerUrl}?key=${maptilerKey}`;


const Twin = () => {
    const mapContainer = useRef<HTMLDivElement | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const markers = useRef<{ element: maplibregl.Marker; src: string }[]>([]);

    const images = [
        { name: "Bike", src: "/bike.png" },
        { name: "Bike Pump", src: "/bikepump.png" },
        { name: "Bike Rack", src: "/Bikerack.png" },
        { name: "Bike Repair Wall Mount", src: "/bikerepairwallmount.png" },
        { name: "Bike Shed", src: "/bikeshed.png" },
    ];

    useEffect(() => {
        if (!mapContainer.current) return;

        const map = new maplibregl.Map({
            container: mapContainer.current,
            style: fullMaptilerUrl,
            center: [-6.441786, 53.393756],
            zoom: 16.7,
            pitch: 45,
            scrollZoom: false,
            doubleClickZoom: false
        });

        map.on("load", () => {
            console.log("Map loaded successfully!");

            // Listen to zoom events to dynamically resize markers
            map.on("zoom", () => {
                const zoom = map.getZoom();
                resizeMarkers(zoom); // Adjust sizes dynamically
            });

            map.getCanvas().addEventListener("dragover", (e) => e.preventDefault());
            map.addControl(new maplibregl.NavigationControl({ showZoom: false }));

            map.getCanvas().addEventListener("drop", (e: DragEvent) => {
                e.preventDefault();
                if (e.dataTransfer && mapContainer.current) {
                    const rect = mapContainer.current.getBoundingClientRect();
                    const offsetX = e.clientX - rect.left;
                    const offsetY = e.clientY - rect.top;
                    const lngLat = map.unproject([offsetX, offsetY]);

                    const src = e.dataTransfer.getData("imageSrc");
                    if (src) {
                        const markerElement = createCustomMarker(src, map.getZoom());
                        markerElement.addEventListener('click', () => {
                            marker.remove();
                            markers.current = markers.current.filter(m => m.element !== marker);
                        });            
                        const marker = new maplibregl.Marker({
                            element: markerElement,
                            draggable: true,
                        })
                            .setLngLat([lngLat.lng, lngLat.lat])
                            .addTo(map);

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

        return () => map.remove();
    }, []);

    // Helper to create a marker with size based on zoom level
    const createCustomMarker = (src: string, zoom: number) => {
        const size = calculateSize(zoom);
        const marker = document.createElement("div");
    
        // Apply consistent styling to avoid artifacts
        marker.style.backgroundImage = `url('${src}')`;
        marker.style.backgroundSize = "contain"; // Scale the image proportionally
        marker.style.backgroundPosition = "center"; // Center the image
        marker.style.backgroundRepeat = "no-repeat"; // Prevent tiling
        marker.style.width = `${size}px`; // Set explicit width
        marker.style.height = `${size}px`; // Set explicit height
        marker.style.overflow = "hidden"; // Prevent image overflow
    
        return marker;
    };
    

    // Adjust marker sizes dynamically based on zoom level
    const resizeMarkers = (zoom: number) => {
        const size = calculateSize(zoom);
        markers.current.forEach(({ element, src }) => {
            const markerElement = element.getElement();
            markerElement.style.width = `${size}px`;
            markerElement.style.height = `${size}px`;
            markerElement.style.backgroundImage = `url('${src}')`;
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
            <div
                className="relative w-[80%] h-[70%] border-4 border-gray-300 rounded-md shadow-lg"
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
