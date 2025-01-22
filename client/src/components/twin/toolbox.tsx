import React, { useState } from 'react';

interface Image {
  src: string;
  name: string;
}

interface AnimatedToolboxProps {
  images: Image[];
  onDragStart: (event: React.DragEvent<HTMLDivElement>, src: string) => void;
  isDragging: boolean;
}

const AnimatedToolbox: React.FC<AnimatedToolboxProps> = ({ images, onDragStart, isDragging }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);

  const handleClick = () => {
    if (!isSpinning) {
      setIsSpinning(true);
      setIsOpen((prev) => !prev);
      // Automatically remove spin after one rotation
      setTimeout(() => {
        setIsSpinning(false);
      }, 500); // Match this with the duration of the spin animation
    }
  };

  return (
    <div className="absolute top-2 left-2 z-20">
      <div className="relative">
        <button
          onClick={handleClick}
          className={`bg-white hover:bg-gray-200 text-black font-bold p-2 rounded-md shadow-md transition-all duration-500`}
          title="Toggle Toolbox"
        >
          <svg
            fill="#000000"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 479.79 479.79"
            className={`w-6 h-6 transition-all duration-500 ${
              isSpinning ? 'animate-spin' : ''
            } ${isOpen ? 'rotate-180' : ''}`}
          >
            <g>
              <path d="M478.409,116.617c-0.368-4.271-3.181-7.94-7.2-9.403c-4.029-1.472-8.539-0.47-11.57,2.556l-62.015,62.011l-68.749-21.768 l-21.768-68.748l62.016-62.016c3.035-3.032,4.025-7.543,2.563-11.565c-1.477-4.03-5.137-6.837-9.417-7.207 c-37.663-3.245-74.566,10.202-101.247,36.887c-36.542,36.545-46.219,89.911-29.083,135.399c-1.873,1.578-3.721,3.25-5.544,5.053 L19.386,373.152c-0.073,0.071-0.145,0.149-0.224,0.219c-24.345,24.346-24.345,63.959,0,88.309 c24.349,24.344,63.672,24.048,88.013-0.298c0.105-0.098,0.201-0.196,0.297-0.305l193.632-208.621 c1.765-1.773,3.404-3.628,4.949-5.532c45.5,17.167,98.9,7.513,135.474-29.056C468.202,191.181,481.658,154.275,478.409,116.617z M75.98,435.38c-8.971,8.969-23.5,8.963-32.47,0c-8.967-8.961-8.967-23.502,0-32.466c8.97-8.963,23.499-8.963,32.47,0 C84.947,411.878,84.947,426.419,75.98,435.38z" />
            </g>
          </svg>
        </button>

        <div
          className={`absolute top-12 bg-white rounded-lg shadow-lg p-4 grid gap-4 transition-all duration-500 origin-top-left ${
            isOpen
              ? 'scale-100 opacity-100 translate-y-0'
              : 'scale-0 opacity-0 -translate-y-4'
          }`}
          style={{
            minWidth: '300px',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          }}
        >
          {images.map((image, index) => (
            <div
              key={index}
              draggable
              onDragStart={(e) => onDragStart(e, image.src)}
              className={`p-2 bg-white border rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-all duration-300 ${
                isDragging ? 'opacity-50' : 'opacity-100'
              }`}
              style={{ width: '140px', height: '140px' }}
            >
              <div
                className="w-full h-16 mx-auto bg-contain bg-center bg-no-repeat"
                style={{ backgroundImage: `url('${image.src}')` }}
              />
              <p className="mt-2 text-center text-sm font-medium text-gray-700">
                {image.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnimatedToolbox;