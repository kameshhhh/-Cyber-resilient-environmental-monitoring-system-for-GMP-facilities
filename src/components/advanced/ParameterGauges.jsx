import React, { useMemo } from "react";
import { FaThermometerHalf, FaTint, FaCompressArrowsAlt } from "react-icons/fa";

const statusColors = {
  optimal: {
    bg: "bg-green-500",
    text: "text-green-700",
    light: "bg-green-100",
  },
  warning: {
    bg: "bg-yellow-500",
    text: "text-yellow-700",
    light: "bg-yellow-100",
  },
  critical: { bg: "bg-red-500", text: "text-red-700", light: "bg-red-100" },
};

const parameterConfig = {
  temperature: {
    icon: FaThermometerHalf,
    label: "Temperature",
    color: "#3B82F6",
    precision: 1,
  },
  humidity: {
    icon: FaTint,
    label: "Humidity",
    color: "#10B981",
    precision: 0,
  },
  pressure: {
    icon: FaCompressArrowsAlt,
    label: "Pressure",
    color: "#8B5CF6",
    precision: 1,
  },
};

/**
 * Circular gauge component for parameter display
 */
const CircularGauge = ({
  value,
  min,
  max,
  unit,
  status,
  label,
  icon: Icon,
  showDewPoint,
  dewPoint,
}) => {
  const percentage = useMemo(() => {
    const range = max - min;
    const position = ((value - min) / range) * 100;
    return Math.max(0, Math.min(100, position));
  }, [value, min, max]);

  const strokeDasharray = useMemo(() => {
    const circumference = 2 * Math.PI * 45;
    const filled = (percentage / 100) * circumference;
    return `${filled} ${circumference}`;
  }, [percentage]);

  const colors = statusColors[status] || statusColors.optimal;

  return (
    <div className="relative flex flex-col items-center p-4 bg-white rounded-xl shadow-md border border-gray-100">
      <div className="relative w-28 h-28">
        {/* Background circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="56"
            cy="56"
            r="45"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="56"
            cy="56"
            r="45"
            fill="none"
            stroke={
              status === "optimal"
                ? "#10B981"
                : status === "warning"
                ? "#F59E0B"
                : "#EF4444"
            }
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            className="transition-all duration-500"
          />
          {/* Threshold markers */}
          <circle
            cx="56"
            cy="56"
            r="45"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="2"
            strokeDasharray="3 3"
            opacity="0.5"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className={`text-lg ${colors.text} mb-1`} />
          <span className="text-2xl font-bold text-gray-800">
            {value.toFixed(
              parameterConfig[label.toLowerCase()]?.precision ?? 1
            )}
          </span>
          <span className="text-xs text-gray-500">{unit}</span>
        </div>
      </div>

      {/* Label and status */}
      <div className="mt-2 text-center">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <div
          className={`mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors.light} ${colors.text}`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      </div>

      {/* Range indicator */}
      <div className="w-full mt-3 px-2">
        <div className="flex justify-between text-xs text-gray-400">
          <span>
            {min}
            {unit}
          </span>
          <span>
            {max}
            {unit}
          </span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full mt-1 relative overflow-hidden">
          {/* Optimal zone indicator */}
          <div
            className="absolute h-full bg-green-200"
            style={{ left: "10%", width: "80%" }}
          />
          {/* Current value indicator */}
          <div
            className={`absolute w-2 h-2 ${colors.bg} rounded-full -top-0.5`}
            style={{ left: `calc(${percentage}% - 4px)` }}
          />
        </div>
      </div>

      {/* Dew point indicator for humidity */}
      {showDewPoint && dewPoint !== undefined && (
        <div className="mt-2 text-xs text-gray-500">
          Dew Point: {dewPoint.toFixed(1)}°C
        </div>
      )}
    </div>
  );
};

/**
 * Parameter Gauges Component
 */
const ParameterGauges = ({
  temperature,
  humidity,
  pressure,
  showDewPoint = true,
  showAbsoluteLimits = false,
  compact = false,
}) => {
  const getStatus = (value, min, max) => {
    const range = max - min;
    const margin = range * 0.1;

    if (value < min || value > max) return "critical";
    if (value < min + margin || value > max - margin) return "warning";
    return "optimal";
  };

  const gaugeData = [
    {
      key: "temperature",
      value: temperature?.value ?? temperature?.current ?? 0,
      min: temperature?.min ?? 2,
      max: temperature?.max ?? 8,
      unit: temperature?.unit ?? "°C",
      label: "Temperature",
      icon: FaThermometerHalf,
    },
    {
      key: "humidity",
      value: humidity?.value ?? humidity?.current ?? 0,
      min: humidity?.min ?? 30,
      max: humidity?.max ?? 60,
      unit: humidity?.unit ?? "%",
      label: "Humidity",
      icon: FaTint,
      dewPoint: humidity?.dewPoint,
    },
    {
      key: "pressure",
      value: pressure?.value ?? pressure?.current ?? 0,
      min: pressure?.min ?? 100,
      max: pressure?.max ?? 101.3,
      unit: pressure?.unit ?? "kPa",
      label: "Pressure",
      icon: FaCompressArrowsAlt,
    },
  ];

  if (compact) {
    return (
      <div className="flex space-x-4">
        {gaugeData.map((gauge) => (
          <div
            key={gauge.key}
            className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg"
          >
            <gauge.icon
              className={`text-${
                getStatus(gauge.value, gauge.min, gauge.max) === "optimal"
                  ? "green"
                  : getStatus(gauge.value, gauge.min, gauge.max) === "warning"
                  ? "yellow"
                  : "red"
              }-500`}
            />
            <div>
              <p className="text-xs text-gray-500">{gauge.label}</p>
              <p className="text-sm font-semibold">
                {gauge.value.toFixed(1)}
                {gauge.unit}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {gaugeData.map((gauge) => (
        <CircularGauge
          key={gauge.key}
          value={gauge.value}
          min={gauge.min}
          max={gauge.max}
          unit={gauge.unit}
          status={getStatus(gauge.value, gauge.min, gauge.max)}
          label={gauge.label}
          icon={gauge.icon}
          showDewPoint={showDewPoint && gauge.key === "humidity"}
          dewPoint={gauge.dewPoint}
        />
      ))}
    </div>
  );
};

export default ParameterGauges;
export { CircularGauge };
