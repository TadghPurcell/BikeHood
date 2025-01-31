import React, { useState } from "react";
import { DatePicker, DateRangePicker } from "rsuite";

type ControlPanelProps = {
  onSimulate: () => void;
  onReset: () => void;
  showMarkers: boolean;
  onToggleMarkers: (value: boolean) => void;
  showRoutes: boolean;
  onToggleRoutes: (value: boolean) => void;
  onTimestampChange: (timestamp: number | null) => void;
  onDateRangeChange: (range: { start: number | null; end: number | null }) => void;
  onZoomIn: () => void; 
  onZoomOut: () => void; 
  onPan: () => void; 
  showLegend: boolean;
  onToggleLegend: (value: boolean) => void;
};

const ControlPanel: React.FC<ControlPanelProps> = ({
  onSimulate,
  onReset,
  showMarkers,
  onToggleMarkers,
  showRoutes,
  onToggleRoutes,
  onTimestampChange,
  onDateRangeChange,
  onZoomIn, 
  onZoomOut,
  onPan,
  showLegend, 
  onToggleLegend,
}) => {
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);

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
  
  // Handler for start date
  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date);
    onDateRangeChange({
      start: date ? Math.floor(date.getTime() / 1000) : null,
      end: endDate ? Math.floor(endDate.getTime() / 1000) : null,
    });
  };

  // Handler for end date
  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date);
    onDateRangeChange({
      start: startDate ? Math.floor(startDate.getTime() / 1000) : null,
      end: date ? Math.floor(date.getTime() / 1000) : null,
    });
  };

  return (
    <div className="w-full">
      <h3 className="text-lg font-bold mb-3">Control Panel</h3>
      {/* Simple heading for the new controls */}
      <p className="text-sm text-gray-500 mb-2 font-semibold">Aspect Controls</p>

      {/* Button Row */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {/* Zoom In */}
      <button 
        onClick={onZoomIn}
        className="flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-md py-2 hover:bg-gray-100">
          <svg
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            fill="#000000"
            className="w-5 h-5"
          >
            <g>
              <path
                className="cls-1"
                d="M12.87,22,8,17.13a1.91,1.91,0,0,1-.57-1.37,1.94,1.94,0,0,1,3.31-1.37L12,15.65v-9A1.89,1.89,0,0,1,13.62,4.7a1.84,1.84,0,0,1,2,1.82V12l4.82.69A1.83,1.83,0,0,1,22,14.5h0a16.54,16.54,0,0,1-1.74,7.37l-.09.17"
              />
              <polyline
                className="cls-1"
                points="10.13 5.61 6.48 5.61 6.48 1.96"
              />
              <polyline
                className="cls-1"
                points="1 7.43 4.65 7.43 4.65 11.09"
              />
              <line className="cls-1" x1="4.65" y1="7.43" x2="1" y2="11.09" />
              <line className="cls-1" x1="6.48" y1="5.61" x2="10.13" y2="1.96" />
            </g>
          </svg>
          <span className="text-sm font-medium">Zoom In</span>
      </button>

      {/* Zoom Out */}
      <button 
        onClick={onZoomOut}
        className="flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-md py-2 hover:bg-gray-100">
          <svg
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            fill="#000000"
            className="w-5 h-5"
          >
            <g>
              <path
                className="cls-1"
                d="M13,22.5,7.82,17.36a2,2,0,0,1-.59-1.43,2,2,0,0,1,2-2,2,2,0,0,1,1.43.59L12,15.82V6.38a2,2,0,0,1,1.74-2,1.87,1.87,0,0,1,1.51.56,1.83,1.83,0,0,1,.57,1.34V12l5,.72a1.91,1.91,0,0,1,1.64,1.89h0a17.18,17.18,0,0,1-1.82,7.71l-.09.18"
              />
              <polyline
                className="cls-1"
                points="5.32 10.09 1.5 10.09 1.5 6.27"
              />
              <polyline
                className="cls-1"
                points="6.27 1.5 10.09 1.5 10.09 5.32"
              />
              <line className="cls-1" x1="5.32" y1="6.27" x2="1.5" y2="10.09" />
              <line className="cls-1" x1="6.27" y1="5.32" x2="10.09" y2="1.5" />
            </g>
          </svg>
          <span className="text-sm font-medium">Zoom Out</span>
      </button>

        {/* Dark Mode */}
      <button className="flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-md py-2 hover:bg-gray-100">
        <svg
          height="20px"
          width="20px"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 30.74 30.74"
          fill="#000000"
          className="w-5 h-5"
        >
          <g>
            <path d="M15.371,10.471c-2.71,0-4.903,2.193-4.903,4.898c0,2.707,2.193,4.902,4.903,4.902 c2.709,0,4.899-2.195,4.899-4.902C20.27,12.664,18.08,10.471,15.371,10.471z M15.529,19.471c0-0.904,0-6.098,0-8.199 c2.266,0,4.1,1.836,4.1,4.098C19.629,17.633,17.795,19.471,15.529,19.471z" />
            <path d="M14.128,6.602V1.246C14.128,0.557,14.683,0,15.371,0l0,0c0.689,0,1.246,0.557,1.246,1.246l0,0v5.355 c0,0.689-0.557,1.242-1.246,1.242l0,0C14.683,7.844,14.128,7.291,14.128,6.602L14.128,6.602z" />
            <path d="M14.128,29.492V24.14c0-0.689,0.556-1.244,1.243-1.244l0,0c0.689,0,1.246,0.555,1.246,1.244l0,0 v5.352c0,0.688-0.557,1.248-1.246,1.248l0,0C14.683,30.74,14.128,30.18,14.128,29.492L14.128,29.492z" />
            <path d="M20.697,10.049c-0.488-0.488-0.488-1.273,0-1.76l0,0l3.782-3.785c0.484-0.486,1.271-0.486,1.761,0 l0,0c0.486,0.486,0.486,1.275,0,1.76l0,0l-3.789,3.785c-0.24,0.24-0.558,0.365-0.876,0.365l0,0 C21.255,10.414,20.937,10.289,20.697,10.049L20.697,10.049z" />
            <path d="M4.503,26.236c-0.486-0.484-0.486-1.273,0-1.76l0,0l3.787-3.785c0.485-0.484,1.274-0.484,1.759,0 l0,0c0.487,0.484,0.487,1.275,0,1.758l0,0l-3.78,3.787C6.023,26.477,5.705,26.6,5.383,26.6l0,0 C5.066,26.6,4.749,26.477,4.503,26.236L4.503,26.236z" />
            <path d="M24.144,16.617c-0.69,0-1.25-0.561-1.25-1.248l0,0c0-0.684,0.56-1.246,1.25-1.246l0,0h5.35 c0.688,0,1.242,0.562,1.242,1.246l0,0c0,0.688-0.555,1.248-1.242,1.248l0,0H24.144L24.144,16.617z" />
          </g>
        </svg>
        <span className="text-sm font-medium">Dark Mode</span>
      </button>

        {/* Pan */}
        <button 
          onClick={onPan}
          className="flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-md py-2 hover:bg-gray-100">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12.75 3C12.75 2.58579 12.4142 2.25 12 2.25C11.5858 2.25 11.25 2.58579 11.25 3V5.18934L9.53033 3.46967C9.23744 3.17678 8.76256 3.17678 8.46967 3.46967C8.17678 3.76256 8.17678 4.23744 8.46967 4.53033L11.4697 7.53033C11.7626 7.82322 12.2374 7.82322 12.5303 7.53033L15.5303 4.53033C15.8232 4.23744 15.8232 3.76256 15.5303 3.46967C15.2374 3.17678 14.7626 3.17678 14.4697 3.46967L12.75 5.18934V3Z" />
              <path d="M3.46967 8.46967C3.76256 8.17678 4.23744 8.17678 4.53033 8.46967L7.53033 11.4697C7.82322 11.7626 7.82322 12.2374 7.53033 12.5303L4.53033 15.5303C4.23744 15.8232 3.76256 15.8232 3.46967 15.5303C3.17678 15.2374 3.17678 14.7626 3.46967 14.4697L5.18934 12.75H3C2.58579 12.75 2.25 12.4142 2.25 12C2.25 11.5858 2.58579 11.25 3 11.25H5.18934L3.46967 9.53033C3.17678 9.23744 3.17678 8.76256 3.46967 8.46967Z" />
              <path d="M20.5303 8.46967C20.8232 8.76256 20.8232 9.23744 20.5303 9.53033L18.8107 11.25H21C21.4142 11.25 21.75 11.5858 21.75 12C21.75 12.4142 21.4142 12.75 21 12.75H18.8107L20.5303 14.4697C20.8232 14.7626 20.8232 15.2374 20.5303 15.5303C20.2374 15.8232 19.7626 15.8232 19.4697 15.5303L16.4697 12.5303C16.1768 12.2374 16.1768 11.7626 16.4697 11.4697L19.4697 8.46967C19.7626 8.17678 20.2374 8.17678 20.5303 8.46967Z" />
              <path d="M11.25 18.8107V21C11.25 21.4142 11.5858 21.75 12 21.75C12.4142 21.75 12.75 21.4142 12.75 21V18.8107L14.4697 20.5303C14.7626 20.8232 15.2374 20.8232 15.5303 20.5303C15.8232 20.2374 15.8232 19.7626 15.5303 19.4697L12.5303 16.4697C12.2374 16.1768 11.7626 16.1768 11.4697 16.4697L8.46967 19.4697C8.17678 19.7626 8.17678 20.2374 8.46967 20.5303C8.76256 20.8232 9.23744 20.8232 9.53033 20.5303L11.25 18.8107Z" />
            </svg>
            <span className="text-sm font-medium">Pan</span>
          </button>
      </div>

      <hr className="border-t border-gray-300 my-4" />

      <p className="text-sm text-gray-500 mb-2 font-semibold">
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

          {/* Split Date Pickers */}
          <p className="text-sm text-gray-500 mb-2 font-semibold">Choose Simulation Period</p>
          <div className="flex items-center gap-4 mb-4">
            {/* Start Date Picker */}
            <DatePicker
              value={startDate}
              onChange={handleStartDateChange}
              placeholder="Start Date"
              format="MM/dd/yyyy"
              block
            />
            {/* End Date Picker */}
            <DatePicker
              value={endDate}
              onChange={handleEndDateChange}
              placeholder="End Date"
              format="MM/dd/yyyy"
              block
            />
          </div>

          <hr className="border-t border-gray-300 my-4" />

          {/* Toggle Options */}
          <p className="text-sm text-gray-500 mb-3 font-semibold">Layers</p>
          <div className="flex flex-col gap-2 mb-4">
            {/* Show Markers Toggle */}
            <div className="flex items-center gap-2">
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

            {/* Show Legend Toggle */}
            <div className="flex items-center gap-2">
              <svg
                viewBox="0 0 100 100"
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
              >
                <path d="M12.496 5.086a2.084 2.084 0 0 0-.03.002a2.084 2.084 0 0 0-1.77 1.04L.278 24.173a2.084 2.084 0 0 0 1.805 3.125h20.834a2.084 2.084 0 0 0 1.803-3.125L14.305 6.129a2.084 2.084 0 0 0-1.809-1.043zM40 14.486v7h15v-7H40zm22 0v7h38v-7H62zM2.084 39.672A2.084 2.084 0 0 0 0 41.756v16.666a2.084 2.084 0 0 0 2.084 2.084h20.832A2.084 2.084 0 0 0 25 58.422V41.756a2.084 2.084 0 0 0-2.084-2.084H2.084zM40 47.838v7h27v-7H40zm34 0v7h26v-7H74zM12.5 69.914c-6.879 0-12.5 5.621-12.5 12.5s5.621 12.5 12.5 12.5S25 89.293 25 82.414s-5.621-12.5-12.5-12.5zM40 81.19v7h15v-7H40zm22 0v7h38v-7H62z" />
              </svg>
              <span className="text-sm w-24">Show Legend</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={showLegend}
                  onChange={(e) => onToggleLegend(e.target.checked)}
                />
                <span className="slider round"></span>
              </label>
            </div>
          </div>

          <hr className="border-t border-gray-300 my-4" />

        </div>
  );
};

export default ControlPanel;