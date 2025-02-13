import React, { useState } from 'react';
import Header from '../components/Header'; 
import Twin from '../components/Twin'; 
import Dashboard from '../components/Dashboard';

const TwinPage = () => {
  const [trafficData, setTrafficData] = useState({});
  const [envNoiseMarkers, setEnvNoiseMarkers] = useState<any[]>([]);
  const handleDataUpdate = (newTrafficData: any, newEnvNoiseMarkers: any[]) => {
    setTrafficData(newTrafficData);
    setEnvNoiseMarkers(newEnvNoiseMarkers);
  };


  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Twin />
      <Dashboard 
        trafficData={trafficData} 
        envNoiseMarkers={envNoiseMarkers} 
      />
    </div>
  );
};

export default TwinPage;
