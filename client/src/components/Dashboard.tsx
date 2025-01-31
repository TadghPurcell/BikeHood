import React, { useState } from "react";

const Dashboard: React.FC = () => {
  const [view, setView] = useState<"overview" | "details">("overview");

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

      {/* Overview View */}
      {view === "overview" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg shadow-sm bg-white">Overview 1</div>
          <div className="p-4 border rounded-lg shadow-sm bg-white">Overview 2</div>
          <div className="p-4 border rounded-lg shadow-sm bg-white">Overview 3</div>
        </div>
      )}

      {/* Details View */}
      {view === "details" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Row 1 */}
          <div className="col-span-1 md:col-span-1 p-4 border rounded-lg shadow-sm bg-white">
            <h3 className="text-lg font-medium">Graph 1</h3>
            <p className="text-3xl font-bold">Graph 1</p>
            <span className="text-green-500">Graph 1</span>
            {/* */}
          </div>
          
          <div className="col-span-1 md:col-span-1 p-4 border rounded-lg shadow-sm bg-white">
            <h3 className="text-lg font-medium">Graph 2</h3>
            <p className="text-3xl font-bold">Graph 2</p>
            <span className="text-green-500">Graph 2</span>
            {/* */}
          </div>

          <div className="col-span-1 md:col-span-1 p-4 border rounded-lg shadow-sm bg-white">
            <h3 className="text-lg font-medium">Graph 3</h3>
            <p className="text-3xl font-bold text-green-600">Graph 3</p>
            <span className="text-gray-500">Graph 3</span>
            {/* */}
          </div>

          {/* Row 2 */}
          <div className="col-span-1 md:col-span-2 p-4 border rounded-lg shadow-sm bg-white">
            <h3 className="text-lg font-medium">Graph 3</h3>
            <ul className="mt-2 space-y-3">
            </ul>
          </div>

          <div className="col-span-1 md:col-span-1 p-4 border rounded-lg shadow-sm bg-white">
            <h3 className="text-lg font-medium">Graph 4</h3>
            <p className="text-3xl font-bold">Graph 4</p>
            <span className="text-blue-500">Graph 4</span>
            {/* */}
          </div>

          <div className="col-span-1 md:col-span-1 p-4 border rounded-lg shadow-sm bg-white">
            <h3 className="text-lg font-medium">Graph 5</h3>
            <p className="text-3xl font-bold">Graph 5</p>
            <span className="text-green-500">Graph 5</span>
            {/* */}
          </div>

          <div className="col-span-1 md:col-span-1 p-4 border rounded-lg shadow-sm bg-white">
            <h3 className="text-lg font-medium">Graph 6</h3>
            <p className="text-3xl font-bold">Graph 6</p>
            <span className="text-gray-500">Graph 6</span>
            {/* */}
          </div>

          <div className="col-span-1 md:col-span-1 p-4 border rounded-lg shadow-sm bg-white">
            <h3 className="text-lg font-medium">Graph 7</h3>
            <p className="text-blue-600">Graph 7</p>
            <p className="text-green-600">Graph 7</p>
            {/* */}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
