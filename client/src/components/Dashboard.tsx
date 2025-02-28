import React, { useState, useEffect } from "react";

import {
  fetchEnv24HourData,
  fetchNoise24HourData,
  fetchTraffic24HourData,
  fetchTrafficAggData,
  fetchSingleRoadData,
  fetchTrafficNoiseComparison, 
  fetchTrafficPM25Comparison
} from "./twin/api.ts";

// Recharts imports
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from "recharts";

import { INITIAL_ROADS } from "./twin/constants.ts";

// Helper to format the hour_ts into something readable 
const formatHour = (unixHour: number) => {
  const date = new Date(unixHour * 1000); 
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const Dashboard: React.FC = () => {
  const [view, setView] = useState<"overview" | "details">("overview");

  // States for 24h aggregates 
  const [envData24h, setEnvData24h] = useState<any[]>([]);
  const [noiseData24h, setNoiseData24h] = useState<any[]>([]);
  const [trafficData24h, setTrafficData24h] = useState<any[]>([]);

  // State for the per-road aggregator 
  const [trafficAggData, setTrafficAggData] = useState<any[]>([]);

  // State for single-road chart 
  const [selectedRoad, setSelectedRoad] = useState<string>("main_street");
  const [roadData, setRoadData] = useState<any[]>([]);

  // State for Traffic vs Noise 
  const [trafficNoiseData, setTrafficNoiseData] = useState<any[]>([]);
  const [trafficEnvData, setTrafficEnvData] = useState<any[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // On mount, fetch the main overview + aggregator
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [env, noise, traffic, trafficAgg] = await Promise.all([
          fetchEnv24HourData(),
          fetchNoise24HourData(),
          fetchTraffic24HourData(),
          fetchTrafficAggData(),
        ]);

        setEnvData24h(env);
        setNoiseData24h(noise);
        setTrafficData24h(traffic);
        setTrafficAggData(trafficAgg);
      } catch (err: any) {
        console.error("Error loading data:", err);
        setError("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Fetch single-road data whenever selectedRoad changes
  useEffect(() => {
    const loadSingleRoad = async () => {
      if (!selectedRoad) return;
      try {
        setLoading(true);
        const singleData = await fetchSingleRoadData(selectedRoad);
        setRoadData(singleData);
      } catch (err) {
        console.error("Error fetching single road data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadSingleRoad();
  }, [selectedRoad]);

  // Fetch traffic vs noise 
  useEffect(() => {
    const loadTrafficNoise = async () => {
      try {
        setLoading(true);
        const data = await fetchTrafficNoiseComparison();
        setTrafficNoiseData(data);
      } catch (err) {
        console.error("Error fetching traffic vs noise data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadTrafficNoise();
  }, []);

  useEffect(() => {
    const loadTrafficEnv = async () => {
      try {
        setLoading(true);
        const data = await fetchTrafficPM25Comparison();
        setTrafficEnvData(data);
      } catch (err) {
        console.error("Error fetching traffic vs pm2.5 data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadTrafficEnv();
  }, []);

  return (
    <div className="bg-white p-4 shadow-md border-t">
      {/* Header with Toggle Buttons */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Ongar Overview</h2>
        <div className="flex gap-2">
          <button
            className={`text-sm font-medium px-3 py-1 border rounded-md ${
              view === "overview" ? "bg-gray-100" : "bg-white"
            }`}
            onClick={() => setView("overview")}
          >
            Overview
          </button>
          <button
            className={`text-sm font-medium px-3 py-1 border rounded-md ${
              view === "details" ? "bg-gray-100" : "bg-white"
            }`}
            onClick={() => setView("details")}
          >
            Details
          </button>
        </div>
      </div>

      {/* Error Handling */}
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {/* Overview View */}
      {view === "overview" && !loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* Traffic */}
          <div className="p-4 border rounded-lg shadow-sm bg-white">
            <h3 className="text-lg font-medium mb-2">Traffic (24h)</h3>
            {trafficData24h.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trafficData24h}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour_ts" tickFormatter={formatHour} />
                  <YAxis />
                  <Tooltip labelFormatter={(label) => formatHour(label as number)} />
                  <Line
                    type="monotone"
                    dataKey="avg_traffic"
                    stroke="#8884d8"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p>No traffic data for past 24h.</p>
            )}
          </div>

          {/* Environment */}
          <div className="p-4 border rounded-lg shadow-sm bg-white">
            <h3 className="text-lg font-medium mb-2">Environment (PM2.5, 24h)</h3>
            {envData24h.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={envData24h}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour_ts" tickFormatter={formatHour} />
                  <YAxis />
                  <Tooltip labelFormatter={(label) => formatHour(label as number)} />
                  <Line type="monotone" dataKey="avg_pm25" stroke="#82ca9d" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p>No environment data for past 24h.</p>
            )}
          </div>

          {/* Noise */}
          <div className="p-4 border rounded-lg shadow-sm bg-white">
            <h3 className="text-lg font-medium mb-2">Noise (LAeq, 24h)</h3>
            {noiseData24h.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={noiseData24h}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour_ts" tickFormatter={formatHour} />
                  <YAxis />
                  <Tooltip labelFormatter={(label) => formatHour(label as number)} />
                  <Line type="monotone" dataKey="avg_laeq" stroke="#ff7300" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p>No noise data for past 24h.</p>
            )}
          </div>
        </div>
      )}

      {/* Details View */}
      {view === "details" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Row 1 */}
          <div className="col-span-1 md:col-span-1 p-4 border rounded-lg shadow-sm bg-white">
            <h3 className="text-lg font-medium">Graph 1: Multi-Line (All Roads)</h3>
            {trafficAggData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trafficAggData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour_ts" tickFormatter={formatHour} />
                  <YAxis />
                  <Tooltip labelFormatter={(label) => formatHour(label as number)} />
                 {/* */}
                  <Line dataKey="ongar_distributor_road" stroke="#8884d8" />
                  <Line dataKey="littleplace_castleheaney_distributor_road_south" stroke="#82ca9d" />
                  <Line dataKey="main_street" stroke="#ff7300" />
                  <Line dataKey="the_mall" stroke="#00C49F" />
                  <Line dataKey="station_road" stroke="#FFBB28" />
                  <Line dataKey="ongar_distributor_road_east" stroke="#FF8042" />
                  <Line dataKey="ongar_barnhill_distributor_road" stroke="#8A2BE2" />
                  <Line dataKey="littleplace_castleheaney_distributor_road_north" stroke="#CD5C5C" />
                  <Line dataKey="the_avenue" stroke="#008B8B" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p>No aggregated data for roads.</p>
            )}
          </div>
          
          {/* Graph 2: Stacked Bar for all the roads */}
          <div className="col-span-1 md:col-span-1 p-4 border rounded-lg shadow-sm bg-white">
            <h3 className="text-lg font-medium">Graph 2: Stacked Bar (Roads)</h3>
            {trafficAggData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trafficAggData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour_ts" tickFormatter={formatHour} />
                  <YAxis />
                  <Tooltip labelFormatter={(label) => formatHour(label as number)} />
                  <Legend />
                  {/* */}
                  <Bar dataKey="ongar_distributor_road" stackId="1" fill="#8884d8" />
                  <Bar dataKey="littleplace_castleheaney_distributor_road_south" stackId="1" fill="#82ca9d" />
                  <Bar dataKey="main_street" stackId="1" fill="#ff7300" />
                  <Bar dataKey="the_mall" stackId="1" fill="#00C49F" />
                  <Bar dataKey="station_road" stackId="1" fill="#FFBB28" />
                  <Bar dataKey="ongar_distributor_road_east" stackId="1" fill="#FF8042" />
                  <Bar dataKey="ongar_barnhill_distributor_road" stackId="1" fill="#8A2BE2" />
                  <Bar dataKey="littleplace_castleheaney_distributor_road_north" stackId="1" fill="#CD5C5C" />
                  <Bar dataKey="the_avenue" stackId="1" fill="#008B8B" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p>No aggregated data for roads.</p>
            )}
          </div>

          {/* Graph 3: Single-Road Trend */}
          <div className="col-span-1 md:col-span-1 p-4 border rounded-lg shadow-sm bg-white">
            <h3 className="text-lg font-medium mb-2">Graph 3: Single Road Trend</h3>

            <select
              className="border p-1 mb-2"
              value={selectedRoad}
              onChange={(e) => setSelectedRoad(e.target.value)}
            >
              {INITIAL_ROADS.map((road) => (
                <option key={road.id} value={road.id}>
                  {road.id}
                </option>
              ))}
            </select>

           {/* */}
            {roadData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={roadData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour_ts" tickFormatter={formatHour} />
                  <YAxis />
                  <Tooltip labelFormatter={(label) => formatHour(label as number)} />
                  <Line type="monotone" dataKey="avg_value" stroke="#8884d8" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p>No data found for {selectedRoad} in the last 24h.</p>
            )}
          </div>

          {/* Row 2 */}
          {/* Graph 4: Traffic vs Noise */}
          <div className="col-span-1 md:col-span-2 p-4 border rounded-lg shadow-sm bg-white">
            <h3 className="text-lg font-medium mb-2">Graph 4: Traffic vs Noise</h3>
            {trafficNoiseData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trafficNoiseData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour_ts" tickFormatter={formatHour} />
                  <YAxis />
                  <Tooltip labelFormatter={(label) => formatHour(label as number)} />
                  <Legend />
                  <Line type="monotone" dataKey="avg_traffic" stroke="#8884d8" dot={false} />
                  <Line type="monotone" dataKey="avg_laeq" stroke="#82ca9d" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p>No traffic vs noise data available.</p>
            )}
          </div>

          {/* Graph 5 (This is a placeholder for when more data is provided like the counters) */}
    
          {/* Graph 6 */}
          <div className="col-span-1 md:col-span-2 p-4 border rounded-lg shadow-sm bg-white">
          <h3 className="text-lg font-medium mb-2">Graph 6</h3>
          {trafficEnvData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trafficEnvData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour_ts" tickFormatter={formatHour} />
                <YAxis />
                <Tooltip labelFormatter={(label) => formatHour(label as number)} />
                <Legend />
                <Line type="monotone" dataKey="avg_traffic" stroke="#8884d8" dot={false} />
                <Line type="monotone" dataKey="avg_pm25" stroke="#82ca9d" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p>No Traffic vs. PM2.5 data available.</p>
          )}
          </div>

          {/* Graph 7 (This is a placeholder for when more data is provided like the counters) */}
        </div>
      )}
    </div>
  );
};

export default Dashboard;