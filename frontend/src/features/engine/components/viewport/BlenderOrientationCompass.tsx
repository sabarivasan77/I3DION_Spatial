import React from 'react';

interface BlenderOrientationCompassProps {
  onSnapAxis: (axis: 'X' | 'Y' | 'Z' | '-X' | '-Y' | '-Z') => void;
  cameraAngles?: { yaw: number; pitch: number }; // angles in radians
}

export const BlenderOrientationCompass: React.FC<BlenderOrientationCompassProps> = ({
  onSnapAxis,
  cameraAngles = { yaw: 0.785, pitch: 0.55 },
}) => {
  // Compute projected 2D coordinates for the 3 axes (+X, +Y, +Z) based on camera orientation
  // In Three.js: X is right, Y is up, Z is toward viewer
  const cosYaw = Math.cos(cameraAngles.yaw);
  const sinYaw = Math.sin(cameraAngles.yaw);
  const cosPitch = Math.cos(cameraAngles.pitch);
  const sinPitch = Math.sin(cameraAngles.pitch);

  const size = 72; // width and height of widget
  const center = size / 2;
  const radius = 24;

  // Project unit vectors (X, Y, Z) onto 2D screen coordinates
  // X axis (1, 0, 0)
  const xX = center + radius * (cosYaw);
  const xY = center + radius * (sinYaw * sinPitch);

  // Y axis (0, 1, 0 - Up in Three.js)
  const yX = center;
  const yY = center - radius * cosPitch;

  // Z axis (0, 0, 1)
  const zX = center - radius * (sinYaw);
  const zY = center + radius * (cosYaw * sinPitch);

  return (
    <div
      className="absolute top-12 right-4 z-20 w-[76px] h-[76px] bg-[#222]/80 backdrop-blur-md rounded-full border border-[#333] shadow-xl flex items-center justify-center select-none"
      title="Blender Orientation Compass (Click an axis to align view)"
    >
      <svg width={size} height={size} className="overflow-visible">
        {/* Background base circle */}
        <circle cx={center} cy={center} r={radius + 4} fill="#1a1a1a" fillOpacity="0.6" stroke="#333" strokeWidth="1" />

        {/* Axis connecting lines from center */}
        <line x1={center} y1={center} x2={xX} y2={xY} stroke="#e04040" strokeWidth="2.5" strokeLinecap="round" />
        <line x1={center} y1={center} x2={yX} y2={yY} stroke="#40c040" strokeWidth="2.5" strokeLinecap="round" />
        <line x1={center} y1={center} x2={zX} y2={zY} stroke="#4080e0" strokeWidth="2.5" strokeLinecap="round" />

        {/* Center pivot point */}
        <circle cx={center} cy={center} r="3" fill="#666" />

        {/* X Axis Bubble (Red) */}
        <g
          className="cursor-pointer hover:scale-110 transition-transform"
          onClick={() => onSnapAxis('X')}
        >
          <circle cx={xX} cy={xY} r="7.5" fill="#e04040" stroke="#ff7070" strokeWidth="1" />
          <text
            x={xX}
            y={xY + 3}
            textAnchor="middle"
            fill="#ffffff"
            fontSize="9"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            X
          </text>
        </g>

        {/* Y Axis Bubble (Green - Up) */}
        <g
          className="cursor-pointer hover:scale-110 transition-transform"
          onClick={() => onSnapAxis('Y')}
        >
          <circle cx={yX} cy={yY} r="7.5" fill="#40c040" stroke="#70ff70" strokeWidth="1" />
          <text
            x={yX}
            y={yY + 3}
            textAnchor="middle"
            fill="#ffffff"
            fontSize="9"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            Y
          </text>
        </g>

        {/* Z Axis Bubble (Blue) */}
        <g
          className="cursor-pointer hover:scale-110 transition-transform"
          onClick={() => onSnapAxis('Z')}
        >
          <circle cx={zX} cy={zY} r="7.5" fill="#4080e0" stroke="#70b0ff" strokeWidth="1" />
          <text
            x={zX}
            y={zY + 3}
            textAnchor="middle"
            fill="#ffffff"
            fontSize="9"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            Z
          </text>
        </g>
      </svg>
    </div>
  );
};
