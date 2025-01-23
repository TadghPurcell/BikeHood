import React from "react";

interface NoisePopupProps {
  data: {
    laeq?: number;
    lafmax?: number;
    la10?: number;
    la90?: number;
    lceq?: number;
    lcfmax?: number;
  };
}

const NoisePopup: React.FC<NoisePopupProps> = ({ data }) => {
  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        padding: "16px",
        maxWidth: "300px",
        backgroundColor: "#fff",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
        <img
          src="/SoundIcon.png"
          alt="Sound Icon"
          style={{ width: "36px", height: "36px", marginRight: "8px" }}
        />
        <div style={{ fontWeight: "bold", fontSize: "16px", color: "#333" }}>
          Sensor Reading
        </div>
      </div>
      <div style={{ fontSize: "14px", fontWeight: "bold", color: "#333", marginBottom: "12px" }}>
        Real-time Noise Data
      </div>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>Current Average</div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <div style={{ fontSize: "16px", fontWeight: "bold", color: "#333" }}>
          {data.laeq ?? "N/A"}dB
        </div>
        <img
          src="/NoiseWarning.png"
          alt="Warning Icon"
          style={{ width: "22px", height: "16px" }}
        />
      </div>
      <div
        style={{
          marginBottom: "16px",
          height: "4px",
          backgroundColor: "#ddd",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${((data.laeq ?? 0) / 100) * 100}%`,
            height: "100%",
            backgroundColor: "#000",
          }}
        ></div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
        <div>
          <div style={{ fontSize: "12px", color: "#333" }}>Maximum</div>
          <div style={{ fontSize: "14px", fontWeight: "bold" }}>
            {data.lafmax ?? "N/A"}dB
          </div>
          <div style={{ fontSize: "10px", color: "#666" }}>Peak Level</div>
        </div>
        <div>
          <div style={{ fontSize: "12px", color: "#333" }}>High</div>
          <div style={{ fontSize: "14px", fontWeight: "bold" }}>{data.la10 ?? "N/A"}dB</div>
          <div style={{ fontSize: "10px", color: "#666" }}>Upper Range</div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
        <div>
          <div style={{ fontSize: "12px", color: "#333" }}>Low</div>
          <div style={{ fontSize: "14px", fontWeight: "bold" }}>{data.la90 ?? "N/A"}dB</div>
          <div style={{ fontSize: "10px", color: "#666" }}>Lower Range</div>
        </div>
        <div>
          <div style={{ fontSize: "12px", color: "#333" }}>Avg Low Freq</div>
          <div style={{ fontSize: "14px", fontWeight: "bold" }}>{data.lceq ?? "N/A"}dB</div>
          <div style={{ fontSize: "10px", color: "#666" }}>Base Level</div>
        </div>
      </div>
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#333" }}>
        Low Frequency Max
      </div>
      <div
        style={{
          marginBottom: "16px",
          height: "4px",
          backgroundColor: "#ddd",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${((data.lcfmax ?? 0) / 100) * 100}%`,
            height: "100%",
            backgroundColor: "#000",
          }}
        ></div>
      </div>
      <div style={{ fontSize: "10px", color: "#999" }}>
        Maximum low frequency level detected
      </div>
    </div>
  );
};

export default NoisePopup;