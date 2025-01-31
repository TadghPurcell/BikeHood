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
    <>
      {/* Header Component */}
      <Header />

      {/* Twin Component */}
      <div style={{ height: 'calc(100vh - 60px)' }}>
        <Twin />
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
          <Dashboard 
            trafficData={trafficData} 
            envNoiseMarkers={envNoiseMarkers} 
          />
        </div>
    </>
  );
};

export default TwinPage;
