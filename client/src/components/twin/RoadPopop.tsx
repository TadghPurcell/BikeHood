import React from "react";

interface RoadPopupProps {
  data: {
    roadName: string;
    trafficLevel: number;
  };
  onClose: () => void;
}

const RoadPopup: React.FC<RoadPopupProps> = ({ data, onClose }) => {
  const getTrafficStatus = (level: number) => {
    if (level < 20) return "Clear";
    if (level < 50) return "Moderate";
    if (level < 80) return "Heavy Traffic";
    return "Severe Congestion";
  };

  const getTrafficColor = (level: number) => {
    if (level < 20) return "#28a745"; 
    if (level < 50) return "#ffc107";
    if (level < 80) return "#fd7e14"; 
    return "#dc3545"; 
  };

  const calculateProgress = (value: number) => Math.min(value, 100);

  return (
    <div style={{ fontSize: "14px", color: "#333" }}>
      {/* Road Name */}
      <h3 style={{ fontWeight: "bold", fontSize: "16px", marginBottom: "8px" }}>
        {data.roadName}
      </h3>

      {/* Traffic Level */}
      <div style={{ marginBottom: "8px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "12px",
          }}
        >
          <span>Traffic Level</span>
          <span style={{ fontWeight: "bold", color: getTrafficColor(data.trafficLevel) }}>
            {data.trafficLevel}%
          </span>
        </div>
        <div
          style={{
            height: "4px",
            backgroundColor: "#ddd",
            marginTop: "4px",
          }}
        >
          <div
            style={{
              width: `${calculateProgress(data.trafficLevel)}%`,
              height: "100%",
              backgroundColor: getTrafficColor(data.trafficLevel),
            }}
          ></div>
        </div>
      </div>

      {/* Traffic Status */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontWeight: "bold",
          padding: "4px 8px",
          backgroundColor: "#f8f9fa",
          borderLeft: `4px solid ${getTrafficColor(data.trafficLevel)}`,
        }}
      >
        <span>Status</span>
        <span style={{ color: getTrafficColor(data.trafficLevel) }}>
          {getTrafficStatus(data.trafficLevel)}
        </span>
      </div>
    </div>
  );
};

export default RoadPopup;