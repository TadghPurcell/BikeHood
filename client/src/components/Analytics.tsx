import React, { useEffect, useState } from "react";

const Analytics: React.FC = () => {
  const [environmentData, setEnvironmentData] = useState<any>(null);
  const [trafficData, setTrafficData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Use environment variable to set the API base URL
  const apiBaseUrl = import.meta.env.VITE_API_URL;
  console.log("API Base URL:", apiBaseUrl);

  const getTrafficStatus = (speed: number) => {
    if (speed <= 30) return { text: "Light", color: "text-green-600" };
    if (speed <= 50) return { text: "Moderate", color: "text-blue-600" };
    if (speed <= 70) return { text: "Heavey", color: "text-red-600" };
    return { text: "Optimal", color: "text-blue-600" };
  };

  useEffect(() => {
    // Fetch environment data from the backend API using the base URL
    fetch(`${apiBaseUrl}/api/environment/latest`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data) => setEnvironmentData(data))
      .catch((error) => setError(error.message));

    // Fetch traffic data from the backend API using the base URL
    fetch(`${apiBaseUrl}/api/traffic/latest`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch traffic data');
        }
        return response.json();
      })
      .then((data) => setTrafficData(data))
      .catch((error) => setError(error.message));
  }, [apiBaseUrl]);

  return (
    <div className="my-0 px-4 bg-white">
      <h2 className="text-2xl font-bold py-4 text-center">Latest From Ongar</h2>
      {error && <p className="text-red-500 text-center mb-4">Error: {error}</p>}
      
      <div className="grid md:grid-cols-2 gap-6 bg-white">
        {/* Environment Data Section */}
        <section>
          <h3 className="text-xl font-semibold mb-4 text-center">Environment Data</h3>
          {environmentData ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h4 className="text-lg font-semibold mb-2">{environmentData.location}</h4>
              <ul className="space-y-2">
                <li><strong>PM2.5:</strong> {environmentData.pm2_5}</li>
                <li><strong>Temperature:</strong> {environmentData.temperature} °C</li>
                <li><strong>Weather:</strong> {environmentData.weather}</li>
                <li><strong>Wind Speed:</strong> {environmentData.wind_speed} m/s</li>
                <li><strong>Rain:</strong> {environmentData.rain} mm</li>
                <li className="mt-4 text-sm text-gray-500">
                  <strong>Updated:</strong> {new Date(trafficData.timestamp * 1000).toLocaleString()}
                </li>
              </ul>
            </div>
          ) : (
            <p className="text-center">Loading environment data...</p>
          )}
        </section>

        {/* Traffic Data Section */}
        <section>
          <h3 className="text-xl font-semibold mb-4 text-center">Traffic Data</h3>
          {trafficData ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <ul className="space-y-2">
                {Object.entries({
                  "Ongar Road": trafficData.ongar_distributor_road,
                  "Main Street": trafficData.main_street,
                  //"The Mall": trafficData.the_mall,
                  //"Station Road": trafficData.station_road,
                  //"Ongar East": trafficData.ongar_distributor_road_east,
                  "Barnhill": trafficData.ongar_barnhill_distributor_road,
                  "Littleplace North": trafficData.littleplace_castleheaney_distributor_road_north,
                  "Littleplace South": trafficData.littleplace_castleheaney_distributor_road_south,
                  //"The Avenue": trafficData.the_avenue
                }).map(([location, speed]) => {
                  const status = getTrafficStatus(speed as number);
                  return (
                    <li key={location} className="flex justify-between items-center">
                      <span className="font-medium">{location}:</span>
                      <span>
                        {speed} km/h - <span className={`${status.color} font-medium`}>{status.text}</span>
                      </span>
                    </li>
                  );
                })}
                <li className="mt-4 text-sm text-gray-500">
                  <strong>Updated:</strong> {new Date(trafficData.timestamp * 1000).toLocaleString()}
                </li>
              </ul>
            </div>
          ) : (
            <p className="text-center">Loading traffic data...</p>
          )}
        </section>
      </div>
      <div className="h-8 bg-white"></div> 
    </div>
  );
};

export default Analytics;
