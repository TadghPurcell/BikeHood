import React from 'react';

const Legend = () => {
  const ratings = [
    { level: 'Very High', color: '#bb0000' },
    { level: 'High', color: '#ffa500' },
    { level: 'Moderate', color: '#bb9c00' },
    { level: 'Low', color: '#008100' }
  ];
  
  return (
    <div className="flex justify-between items-end" style={{ gap: '290px' }}>
      <div className="w-40 rounded-xl bg-white/80 p-2.5 shadow">
        <div className="pb-1.5">
          <h2 className="text-center text-lg font-bold">Ratings</h2>
        </div>
        <div className="h-px w-full bg-gray-200" />
        <div className="space-y-1 pt-2">
          {ratings.map(({ level, color }) => (
            <div
              key={level}
              className="rounded-lg p-2 text-center text-white font-medium"
              style={{ backgroundColor: color }}
            >
              {level}
            </div>
          ))}
        </div>
      </div>

      <div className="w-64 rounded-xl bg-white/80 p-2.5 shadow">
        <div className="pb-1">
          <h2 className="text-center text-lg font-bold">Traffic Congestion Levels</h2>
        </div>
        <div className="h-px w-full bg-gray-200" />
        <div className="py-1.5">
          <div className="flex items-center w-full space-x-4">
            <span className="text-sm font-semibold whitespace-nowrap">Calm</span>
            <div
              className="flex-1 h-2 rounded-full"
              style={{
                background: "linear-gradient(to right, red 15%, orange 40%, green 85%)",
              }}
            ></div>
            <span className="text-sm font-semibold whitespace-nowrap">Busy</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Legend;