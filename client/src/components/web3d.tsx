import React, { useMemo } from "react";
import useWebSocket from "./useWebSocket";

// Defining a prop interface to receive a date
interface SumoWeb3DProps {
  selectedDate: Date | null;
}

const SumoWeb3D: React.FC<SumoWeb3DProps> = ({ selectedDate }) => {
  // WebSocket connection for SUMO
  const wsUrl = "ws://localhost:5678";
  const { isConnected, messages, sendMessage } = useWebSocket(wsUrl);

  // Dynamically computing the scenario URL based on the selected date
  const sumoUIUrl = useMemo(() => {
    // If no date is selected, default to some scenario 
    if (!selectedDate) {
      return "http://localhost:5000/scenarios/ongar/";
    }

    // getDay() => Sunday=0, Monday=1, Tuesday=2, and so on.
    const day = selectedDate.getDay();
    let scenario = "ongar";

    switch (day) {
      case 1: 
        scenario = "ongar"; // When new scenarios are added, change name to match i.e when we have an ongar scnario for each day.
        break;
      case 2: 
        scenario = "ongar";
        break;
      case 3: 
        scenario = "ongar";
        break;
      case 4: 
        scenario = "ongar";
        break;
      case 5: 
        scenario = "ongar";
        break;
      case 6: 
        scenario = "ongar";
        break;
      case 7: 
        scenario = "ongar";
        break;
      default:
        scenario = "ongar";
    }

    // Return the final URL for the iframe
    return `http://localhost:5000/scenarios/${scenario}/`;
  }, [selectedDate]);

  return (
    <div>
      <p>Status: {isConnected ? "Connected" : "Disconnected"}</p>

      {/*  dynamic URL for iframe */}
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