import React, { useState } from "react";
import { DatePicker } from "rsuite";

type ControlPanelProps = {
  onSimulate: () => void;
  onReset: () => void;
  showMarkers: boolean;
  onToggleMarkers: (value: boolean) => void;
  showRoutes: boolean;
  onToggleRoutes: (value: boolean) => void;
  onTimestampChange: (timestamp: number | null) => void; 
};

const ControlPanel: React.FC<ControlPanelProps> = ({
  onSimulate,
  onReset,
  showMarkers,
  onToggleMarkers,
  showRoutes,
  onToggleRoutes,
  onTimestampChange
}) => {
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Handler for date selection
  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      // Convert selected date to Unix timestamp in seconds
      const timestamp = Math.floor(date.getTime() / 1000);
      onTimestampChange(timestamp);
    } else {
      // Reset to current time if date is cleared
      onTimestampChange(null);
    }
  };

  return (
    <div className="absolute top-2 right-2 z-50">
      {/* Toggle Button */}
      {!isPanelVisible && (
        <button
          onClick={() => setIsPanelVisible(true)}
          className="bg-white p-2 rounded-md shadow-md hover:bg-gray-100 transition"
          title="Show Control Panel"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6"
          >
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      )}

      {/* Control Panel */}
      {isPanelVisible && (
        <div className="bg-white rounded-md shadow-md p-4 w-56">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold">Control Panel</h3>
            {/* Close Button */}
            <button
              onClick={() => setIsPanelVisible(false)}
              className="text-gray-500 hover:text-black transition"
              title="Hide Control Panel"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            Simulation controls and visibility options
          </p>

          <div className="flex gap-2 mb-4">
            {/* Simulate Button */}
            <button
              className="flex-1 bg-black text-white py-1 px-3 rounded-md hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
              onClick={onSimulate}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 16 16"
                className="w-5 h-5"
              >
                <path d="M11.596 8.697l-6.363 4.692C4.53 13.846 4 13.573 4 13.035V2.965c0-.538.53-.812 1.233-.354l6.363 4.692c.703.518.703 1.354 0 1.394z" />
              </svg>
              <span className="text-sm font-semibold">Simulate</span>
            </button>

            {/* Reset Button */}
            <button
              className="bg-white border border-gray-300 text-gray-800 px-2 py-1 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center"
              onClick={onReset}
            >
              <svg
                fill="#000000"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
              >
                <path d="M12 16c1.671 0 3-1.331 3-3s-1.329-3-3-3-3 1.331-3 3 1.329 3 3 3z"></path>
                <path d="M20.817 11.186a8.94 8.94 0 0 0-1.355-3.219 9.053 9.053 0 0 0-2.43-2.43 8.95 8.95 0 0 0-3.219-1.355 9.028 9.028 0 0 0-1.838-.18V2L8 5l3.975 3V6.002c.484-.002.968.044 1.435.14a6.961 6.961 0 0 1 2.502 1.053 7.005 7.005 0 0 1 1.892 1.892A6.967 6.967 0 0 1 19 13a7.032 7.032 0 0 1-.55 2.725 7.11 7.11 0 0 1-.644 1.188 7.2 7.2 0 0 1-.858 1.039 7.028 7.028 0 0 1-3.536 1.907 7.13 7.13 0 0 1-2.822 0 6.961 6.961 0 0 1-2.503-1.054 7.002 7.002 0 0 1-1.89-1.89A6.996 6.996 0 0 1 5 13H3a9.02 9.02 0 0 0 1.539 5.034 9.096 9.096 0 0 0 2.428 2.428A8.95 8.95 0 0 0 12 22a9.09 9.09 0 0 0 1.814-.183 9.014 9.014 0 0 0 3.218-1.355 8.886 8.886 0 0 0 1.331-1.099 9.228 9.228 0 0 0 1.1-1.332A8.952 8.952 0 0 0 21 13a9.09 9.09 0 0 0-.183-1.814z"></path>
              </svg>
            </button>
          </div>

          {/* Date Picker */}
          <div className="mb-4 z-[60] relative">
            <DatePicker
              value={selectedDate}
              onChange={handleDateChange}
              placeholder="Select Date & Time"
              format="MM/dd/yyyy HH:mm"
              open={false}
              block
              container={() => document.body}
              menuStyle={{
                zIndex: 9999,
                width: '200px',
                height: '200px',
                padding: '10px',
              }}
            />
          </div>

          {/* Toggle Options */}
          <div className="flex items-center gap-2 mb-2">
            <svg
              fill="#000000"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
            >
              <path d="M20.46,9.63A8.5,8.5,0,0,0,7.3,3.36,8.56,8.56,0,0,0,3.54,9.63,8.46,8.46,0,0,0,6,16.46l5.3,5.31a1,1,0,0,0,1.42,0L18,16.46A8.46,8.46,0,0,0,20.46,9.63ZM16.6,15.05,12,19.65l-4.6-4.6A6.49,6.49,0,0,1,5.53,9.83,6.57,6.57,0,0,1,8.42,5a6.47,6.47,0,0,1,7.16,0,6.57,6.57,0,0,1,2.89,4.81A6.49,6.49,0,0,1,16.6,15.05ZM12,6a4.5,4.5,0,1,0,4.5,4.5A4.51,4.51,0,0,0,12,6Zm0,7a2.5,2.5,0,1,1,2.5-2.5A2.5,2.5,0,0,1,12,13Z"></path>
            </svg>
            <span className="text-sm w-24">Show Markers</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={showMarkers}
                onChange={(e) => onToggleMarkers(e.target.checked)}
              />
              <span className="slider round"></span>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.96 4.13a.75.75 0 0 1 .369-1.264l4.767-1.045a.75.75 0 0 1 .893.893l-1.046 4.767a.75.75 0 0 1-1.262.37L6.959 4.129zm6.737 18.465a3.1 3.1 0 1 0 0-6.2 3.1 3.1 0 0 0 0 6.2zM7.407 7.403a1 1 0 0 0-1.414 0L3.69 9.705a4.246 4.246 0 0 0 0 6.005l.004.003a4.253 4.253 0 0 0 6.01-.003l6.005-6.005c.88-.88 2.305-.88 3.185-.002.878.876.879 2.298.003 3.176l-.002.001-1.77 1.77a1 1 0 0 0 1.414 1.415l1.77-1.77.004-.004a4.246 4.246 0 0 0-.007-6.004 4.253 4.253 0 0 0-6.01.003L8.29 14.295c-.879.88-2.304.88-3.185 0a2.246 2.246 0 0 1 0-3.175l2.302-2.303a1 1 0 0 0 0-1.414z"
                fill="#000000"
              ></path>
            </svg>
            <span className="text-sm w-24">Show Routes</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={showRoutes}
                onChange={(e) => onToggleRoutes(e.target.checked)}
              />
              <span className="slider round"></span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};


export default ControlPanel;