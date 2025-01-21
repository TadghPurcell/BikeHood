import maplibregl from "maplibre-gl";

// Types
export interface Road {
    id: string;
    start: { lat: number; lng: number };
    end: { lat: number; lng: number };
    trafficLevel: number;
  }
  
export interface MarkerInfo {
    element: maplibregl.Marker;
    src: string;
    impact: number;
  }
  
export interface EnvNoiseMarker {
    id: string;
    type: "air_quality" | "noise_pollution";
    pm2_5?: number;   
    laeq?: number;   
  }