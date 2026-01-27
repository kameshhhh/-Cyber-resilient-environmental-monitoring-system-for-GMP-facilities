import React, { useState } from "react";
import {
  FaThermometerHalf,
  FaTint,
  FaCompressArrowsAlt,
  FaArrowsAltV,
  FaPills,
  FaClock,
  FaChevronDown,
  FaChevronUp,
  FaChartLine,
} from "react-icons/fa";
import { useRoomStatus } from "../../hooks/useRoomStatus";
import { getProgressPercentage } from "../../services/statusCalculator";
import ConditionChart from "../ConditionChart/ConditionChart";

const conditionIcons = {
  temperature: FaThermometerHalf,
  humidity: FaTint,
  pressure: FaCompressArrowsAlt,
  pressureDifferential: FaArrowsAltV,
};

const conditionLabels = {
  temperature: "Temperature",
  humidity: "Humidity",
  pressure: "Pressure",
  pressureDifferential: "Pressure Diff",
};

const statusColors = {
  green: {
    bg: "bg-green-500",
    bgLight: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    glow: "shadow-green-500/50",
  },
  yellow: {
    bg: "bg-yellow-500",
    bgLight: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
    glow: "shadow-yellow-500/50",
  },
  red: {
    bg: "bg-red-500",
    bgLight: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    glow: "shadow-red-500/50",
  },
};

const RoomCard = ({ room }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const { overallStatus, conditionStatuses } = useRoomStatus(room);

  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const colors = statusColors[overallStatus];

  return (
    <div
      className={`bg-white rounded-xl shadow-lg border-2 ${colors.border} overflow-hidden transition-all duration-300 hover:shadow-xl`}
    >
      {/* Card Header */}
      <div className={`${colors.bgLight} px-4 py-3 border-b ${colors.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Status LED */}
            <div
              className={`w-4 h-4 rounded-full ${colors.bg} led-indicator ${overallStatus} shadow-lg`}
            ></div>
            <div>
              <h3 className="font-semibold text-gray-900">{room.name}</h3>
              <p className="text-xs text-gray-500">ID: {room.id}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowChart(!showChart)}
              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="View Chart"
            >
              <FaChartLine className="text-sm" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
            </button>
          </div>
        </div>
      </div>

      {/* Conditions Grid */}
      <div className="p-4 space-y-3">
        {Object.entries(room.conditions).map(([key, condition]) => {
          const Icon = conditionIcons[key];
          const status = conditionStatuses[key];
          const conditionColors = statusColors[status?.status || "green"];
          const progressPercent = getProgressPercentage(
            condition.current,
            condition.min,
            condition.max
          );

          return (
            <div
              key={key}
              className={`p-3 rounded-lg ${conditionColors.bgLight} border ${conditionColors.border}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Icon className={`${conditionColors.text}`} />
                  <span className="text-sm font-medium text-gray-700">
                    {conditionLabels[key]}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-lg font-bold ${conditionColors.text}`}>
                    {condition.current}
                  </span>
                  <span className="text-sm text-gray-500">
                    {condition.unit}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                {/* Optimal Range Indicator */}
                <div
                  className="absolute h-full bg-green-200"
                  style={{ left: "10%", width: "80%" }}
                ></div>
                {/* Current Value Indicator */}
                <div
                  className={`absolute h-full ${conditionColors.bg} transition-all duration-500`}
                  style={{
                    width: `${Math.max(2, Math.min(100, progressPercent))}%`,
                  }}
                ></div>
                {/* Min/Max Markers */}
                <div className="absolute left-0 top-0 h-full w-0.5 bg-gray-400"></div>
                <div className="absolute right-0 top-0 h-full w-0.5 bg-gray-400"></div>
              </div>

              {/* Range Labels */}
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-500">
                  {condition.min}
                  {condition.unit}
                </span>
                <span className={`text-xs font-medium ${conditionColors.text}`}>
                  {status?.label}
                </span>
                <span className="text-xs text-gray-500">
                  {condition.max}
                  {condition.unit}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
          {/* Medicines List */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <FaPills className="text-blue-500" />
              <span className="text-sm font-medium text-gray-700">
                Stored Medicines
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {room.medicines.map((medicine, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full"
                >
                  {medicine}
                </span>
              ))}
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            {Object.entries(room.conditions).map(([key, condition]) => {
              const status = conditionStatuses[key];
              return (
                <div key={key} className="p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">
                    {conditionLabels[key]}
                  </p>
                  <p className="text-sm font-semibold text-gray-800">
                    {condition.min} - {condition.max} {condition.unit}
                  </p>
                  <p
                    className={`text-xs ${
                      statusColors[status?.status || "green"].text
                    }`}
                  >
                    {status?.isAboveRange
                      ? "↑ Above"
                      : status?.isBelowRange
                      ? "↓ Below"
                      : "✓ In Range"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Chart View */}
      {showChart && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
          <ConditionChart room={room} />
        </div>
      )}

      {/* Footer */}
      <div className={`px-4 py-2 ${colors.bgLight} border-t ${colors.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <FaClock />
            <span>Updated: {formatDateTime(room.lastUpdated)}</span>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} text-white`}
          >
            {overallStatus.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RoomCard;
