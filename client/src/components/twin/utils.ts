export const calculateMarkerSize = (zoom: number): number => {
    const baseSize = 20;
    const scaleFactor = 1.5;
    return Math.max(baseSize, baseSize * (zoom / 15) * scaleFactor);
  };
  
  export const createCustomMarker = (src: string, zoom: number): HTMLDivElement => {
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
  
  export const calculateProximity = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number => {
    const scalingFactor = 1.5;
    return scalingFactor * Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2));
  };
  
export const delay = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));
  