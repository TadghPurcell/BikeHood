export const maptilerUrl = import.meta.env.VITE_MAPTILER_URL;
export const maptilerKey = import.meta.env.VITE_MAPTILER_API_KEY;
export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
export const tomtomKey = import.meta.env.VITE_TOMTOM_API_KEY;

export const fullMaptilerUrl = `${maptilerUrl}?key=${maptilerKey}`;

export const IMAGES = [
    {
      name: "Bike",
      src: "/bike.png",
      impact: +2,         
      noiseDelta: -1,     
      pm25Delta: -1      
    },
    {
      name: "Bike Pump",
      src: "/bikepump.png",
      impact: +1,
      noiseDelta: -1,
      pm25Delta: -0.5
    },
    {
      name: "Bike Rack",
      src: "/Bikerack.png",
      impact: +1.5,
      noiseDelta: -1.5,
      pm25Delta: -1
    },
    {
      name: "Bike Repair Wall Mount",
      src: "/bikerepairwallmount.png",
      impact: +1,
      noiseDelta: -1,
      pm25Delta: -0.75
    },
    {
      name: "Bike Shed",
      src: "/bikeshed.png",
      impact: +2,
      noiseDelta: -2,
      pm25Delta: -1.5
    }
  ];

export const INITIAL_ROADS = [
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
      start: { lat: 53.395972, lng: -6.442814 },
      end: { lat: 53.395146, lng: -6.438787 },
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
    {
      id: "the_mall",
      start: { lat: 53.395146, lng:-6.438787 },
      end: { lat: 53.392384, lng: -6.439096 },
      trafficLevel: 0,
    },
  ];

export const STATIC_MARKERS = [
    // Air Quality Markers
    {
      id: "roundabout_1",
      name: "Roundabout 1",
      type: "air_quality",
      baseImage: "/AqMarkerRed.png",
      activeImage: "/AqMarkerGreen.png",
      coords: { lat: 53.392255, lng: -6.439375 },
      color: "green",
    },
    {
      id: "roundabout_2",
      name: "Roundabout 2",
      type: "air_quality",
      baseImage: "/AqMarkerRed.png",
      activeImage: "/AqMarkerGreen.png",
      coords: { lat: 53.393649, lng: -6.444996 },
      color: "green", 
    },
    {
      id: "school",
      name: "School",
      type: "air_quality",
      baseImage: "/AqMarkerRed.png",
      activeImage: "/AqMarkerGreen.png",
      coords: { lat: 53.393612, lng: -6.441539 },
      color: "green", 
    },
    {
      id: "shopping_district_aq",
      name: "Shopping District AQ",
      type: "air_quality",
      baseImage: "/AqMarkerRed.png",
      activeImage: "/AqMarkerGreen.png",
      coords: { lat: 53.39531, lng: -6.439754 },
      color: "green", 
    },
    // Noise Pollution Markers
    {
      id: "playground_np",
      name: "Playground NP",
      type: "noise_pollution",
      baseImage: "/NpMarkerRed.png",
      activeImage: "/NpMarkerGreen.png",
      coords: { lat: 53.392754, lng: -6.439675 },
      color: "green",
    },
    {
      id: "ongar_west_np",
      name: "Ongar West NP",
      type: "noise_pollution",
      baseImage: "/NpMarkerRed.png",
      activeImage: "/NpMarkerGreen.png",
      coords: { lat: 53.395396, lng: -6.44467 },
      color: "green",
    },
    {
      id: "shopping_district_np",
      name: "Shopping District NP",
      type: "noise_pollution",
      baseImage: "/NpMarkerRed.png",
      activeImage: "/NpMarkerGreen.png",
      coords: { lat: 53.39551, lng: -6.438324 },
      color: "green",
    },
  ];