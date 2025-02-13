import React, { useState } from "react";
import useWebSocket from "./useWebSocket";


const SumoWeb3D: React.FC = () => {
  const sumoUIUrl = "http://localhost:5000";
  const wsUrl = "ws://localhost:5678";

  const { isConnected, messages, sendMessage } = useWebSocket(wsUrl);

  return (
    <div>
      <p>Status: {isConnected ? "Connected" : "Disconnected"}</p>

      <iframe
        title="SUMO-Web3D"
        src={sumoUIUrl}
        style={{ width: "100%", height: "600px", border: "1px solid #ccc" }}
      />

      <div>
        <ul>
          {messages.map((msg, index) => (
            <li key={index}>{msg}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SumoWeb3D;