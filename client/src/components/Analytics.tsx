import React, { useEffect, useState } from "react";

const Analytics: React.FC = () => {
  const [environmentData, setEnvironmentData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Use environment variable to set the API base URL
  const apiBaseUrl = import.meta.env.VITE_API_URL;
  console.log("API Base URL:", apiBaseUrl);

  useEffect(() => {
    // Fetch data from the backend API using the base URL
    fetch(`${apiBaseUrl}/api/environment/latest`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data) => setEnvironmentData(data))
      .catch((error) => setError(error.message));
  }, [apiBaseUrl]);

  return (
    <section className="my-8 px-4 text-center">
      <h2 className="text-2xl font-bold mb-4">Latest Environment Data</h2>
      {error && <p className="text-red-500">Error: {error}</p>}
      {environmentData ? (
        <div className="bg-white rounded-lg shadow-md p-6 max-w-lg mx-auto">
          <h3 className="text-lg font-semibold mb-2">{environmentData.location}</h3>
          <ul className="text-left">
            <li><strong>PM2.5:</strong> {environmentData.pm2_5}</li>
            <li><strong>Temperature:</strong> {environmentData.temperature} °C</li>
            <li><strong>Weather:</strong> {environmentData.weather}</li>
            <li><strong>Wind Speed:</strong> {environmentData.wind_speed} m/s</li>
            <li><strong>Rain:</strong> {environmentData.rain} mm</li>
            <li><strong>Timestamp:</strong> {new Date(environmentData.timestamp * 1000).toLocaleString()}</li>
          </ul>
        </div>
      ) : (
        <p>Loading latest environment data...</p>
      )}
    </section>
  );
};

export default Analytics;
