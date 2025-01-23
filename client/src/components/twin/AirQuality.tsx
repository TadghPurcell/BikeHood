import React from "react";

interface AirQualityPopupProps {
  data: {
    current: number;
    aqi: number;
    status: "Good" | "Moderate" | "Unhealthy" | "Very Unhealthy" | "Hazardous";
    hourlyAvg: number;
    dailyAvg: number;
  };
  onClose: () => void;
}

const AirQualityPopup: React.FC<AirQualityPopupProps> = ({ data }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Good":
        return "#28a745"; // Green
      case "Moderate":
        return "#ffc107"; // Yellow
      case "Unhealthy":
        return "#fd7e14"; // Orange
      case "Very Unhealthy":
        return "#dc3545"; // Red
      case "Hazardous":
        return "#6f42c1"; // Purple
      default:
        return "#6c757d"; // Gray
    }
  };

  const calculateProgress = (value: number) => Math.min((value / 500) * 100, 100);

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        padding: "16px",
        maxWidth: "350px",
        backgroundColor: "#fff",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <img
            src="/AirQualityIcon.png"
            alt="Air Quality Icon"
            style={{ width: "32px", height: "32px" }}
          />
          <h3 style={{ fontWeight: "bold", fontSize: "16px", color: "#333" }}>
            Air Quality
          </h3>
        </div>
      </div>

      {/* Current PM2.5 */}
      <div style={{ marginBottom: "12px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "8px",
            fontSize: "12px",
            color: "#666",
          }}
        >
          <span>Current PM2.5</span>
          <span style={{ fontSize: "16px", fontWeight: "bold", color: "#333" }}>
            {data.current} µg/m³
          </span>
        </div>
        <div
          style={{
            height: "4px",
            backgroundColor: "#ddd",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${calculateProgress(data.current)}%`,
              height: "100%",
              backgroundColor: "#000000",
            }}
          ></div>
        </div>
      </div>

      {/* Air Quality Index */}
      <div
        style={{
          padding: "8px 12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#f8f9fa",
          borderLeft: `6px solid ${getStatusColor(data.status)}`,
          marginBottom: "16px",
        }}
      >
        <span style={{ fontSize: "14px", color: "#333", fontWeight: "bold" }}>
          Air Quality Index
        </span>
        <span
          style={{
            fontSize: "14px",
            fontWeight: "bold",
            color: data.status ? getStatusColor(data.status) : "#666",
          }}
        >
          {data.status ?? "Unknown"}
        </span>
      </div>

      {/* Hourly and 24hr Averages */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "12px",
          color: "#666",
        }}
      >
        <div>
          <div>Hourly Average</div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: "bold",
              color: "#333",
              marginTop: "4px",
            }}
          >
            {data.hourlyAvg} µg/m³
          </div>
        </div>
        <div>
          <div>24hr Average</div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: "bold",
              color: "#333",
              marginTop: "4px",
            }}
          >
            {data.dailyAvg} µg/m³
          </div>
        </div>
      </div>
    </div>
  );
};

export default AirQualityPopup;