import React, { useMemo, useState, useCallback } from "react";
import {
  FaThermometerHalf,
  FaTint,
  FaCompressArrowsAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaDoorOpen,
  FaCog,
  FaHistory,
  FaBell,
  FaShieldAlt,
  FaWrench,
} from "react-icons/fa";
import ParameterGauges from "./ParameterGauges";
import StabilityIndicator, {
  Sparkline,
  calculateTrend,
} from "./StabilityIndicator";

/**
 * Status badge component
 */
const StatusBadge = ({ status, size = "default" }) => {
  const configs = {
    optimal: { bg: "bg-green-500", text: "text-white", label: "Optimal" },
    warning: { bg: "bg-yellow-500", text: "text-white", label: "Warning" },
    critical: { bg: "bg-red-500", text: "text-white", label: "Critical" },
    maintenance: {
      bg: "bg-blue-500",
      text: "text-white",
      label: "Maintenance",
    },
    offline: { bg: "bg-gray-500", text: "text-white", label: "Offline" },
  };

  const config = configs[status] || configs.offline;
  const sizeClasses =
    size === "small" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";

  return (
    <span
      className={`${config.bg} ${config.text} ${sizeClasses} rounded-full font-medium`}
    >
      {config.label}
    </span>
  );
};

/**
 * Alert summary component
 */
const AlertSummary = ({ alerts, onViewAll }) => {
  const alertCounts = useMemo(() => {
    if (!alerts) return { critical: 0, warning: 0, info: 0 };
    return {
      critical: alerts.filter((a) => a.severity === "critical").length,
      warning: alerts.filter((a) => a.severity === "warning").length,
      info: alerts.filter((a) => a.severity === "info").length,
    };
  }, [alerts]);

  const hasAlerts = alertCounts.critical > 0 || alertCounts.warning > 0;

  if (!hasAlerts) {
    return (
      <div className="flex items-center space-x-2 text-green-600">
        <FaCheckCircle />
        <span className="text-sm">No active alerts</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      {alertCounts.critical > 0 && (
        <div className="flex items-center space-x-1 text-red-600">
          <FaExclamationTriangle />
          <span className="text-sm font-medium">
            {alertCounts.critical} Critical
          </span>
        </div>
      )}
      {alertCounts.warning > 0 && (
        <div className="flex items-center space-x-1 text-yellow-600">
          <FaExclamationTriangle />
          <span className="text-sm font-medium">
            {alertCounts.warning} Warning
          </span>
        </div>
      )}
      {onViewAll && (
        <button
          onClick={onViewAll}
          className="text-xs text-blue-600 hover:underline"
        >
          View All
        </button>
      )}
    </div>
  );
};

/**
 * Equipment status indicator
 */
const EquipmentStatus = ({ equipment }) => {
  if (!equipment) return null;

  const { compressorHealth, filterHealth, sensorHealth } = equipment;

  const getHealthColor = (health) => {
    if (health >= 80) return "bg-green-500";
    if (health >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
        <FaCog
          className={`text-lg mb-1 ${
            compressorHealth >= 80
              ? "text-green-500"
              : compressorHealth >= 60
              ? "text-yellow-500"
              : "text-red-500"
          }`}
        />
        <span className="text-xs text-gray-600">Compressor</span>
        <div className="w-full h-1 bg-gray-200 rounded-full mt-1">
          <div
            className={`h-full rounded-full ${getHealthColor(
              compressorHealth
            )}`}
            style={{ width: `${compressorHealth}%` }}
          />
        </div>
      </div>
      <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
        <FaWrench
          className={`text-lg mb-1 ${
            filterHealth >= 80
              ? "text-green-500"
              : filterHealth >= 60
              ? "text-yellow-500"
              : "text-red-500"
          }`}
        />
        <span className="text-xs text-gray-600">Filter</span>
        <div className="w-full h-1 bg-gray-200 rounded-full mt-1">
          <div
            className={`h-full rounded-full ${getHealthColor(filterHealth)}`}
            style={{ width: `${filterHealth}%` }}
          />
        </div>
      </div>
      <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
        <FaThermometerHalf
          className={`text-lg mb-1 ${
            sensorHealth >= 80
              ? "text-green-500"
              : sensorHealth >= 60
              ? "text-yellow-500"
              : "text-red-500"
          }`}
        />
        <span className="text-xs text-gray-600">Sensors</span>
        <div className="w-full h-1 bg-gray-200 rounded-full mt-1">
          <div
            className={`h-full rounded-full ${getHealthColor(sensorHealth)}`}
            style={{ width: `${sensorHealth}%` }}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Compliance badge
 */
const ComplianceBadge = ({ compliance }) => {
  if (!compliance) return null;

  const { isCompliant, score } = compliance;

  return (
    <div
      className={`flex items-center space-x-2 p-2 rounded-lg ${
        isCompliant ? "bg-green-50" : "bg-red-50"
      }`}
    >
      <FaShieldAlt
        className={isCompliant ? "text-green-600" : "text-red-600"}
      />
      <div>
        <p
          className={`text-sm font-medium ${
            isCompliant ? "text-green-700" : "text-red-700"
          }`}
        >
          {isCompliant ? "FDA Compliant" : "Non-Compliant"}
        </p>
        {score !== undefined && (
          <p className="text-xs text-gray-500">Score: {score}%</p>
        )}
      </div>
    </div>
  );
};

/**
 * Room Dashboard Card - Comprehensive room monitoring card
 */
const RoomDashboardCard = ({
  room,
  onSelect,
  isSelected = false,
  showDetailedView = false,
  onViewHistory,
  onViewAlerts,
  onMaintenanceRequest,
}) => {
  const [activeTab, setActiveTab] = useState("overview");

  // Extract room data with defaults
  const {
    id,
    name,
    shortName,
    tier,
    description,
    type,
    status = "offline",
    sensors = {},
    history = {},
    alerts = [],
    equipment = null,
    compliance = null,
    doorOpen = false,
    lastUpdated,
    isOnline = true,
    stabilityRationale,
    actionProtocols,
    medicines = [],
  } = room || {};

  const {
    temperature = {},
    humidity = {},
    pressureDifferential = {},
  } = sensors;

  // Calculate overall trend
  const temperatureTrend = useMemo(
    () => calculateTrend(history.temperature || []),
    [history.temperature]
  );

  const getStatusBgColor = () => {
    switch (status) {
      case "optimal":
        return "border-l-green-500";
      case "warning":
        return "border-l-yellow-500";
      case "critical":
        return "border-l-red-500";
      default:
        return "border-l-gray-400";
    }
  };

  const handleCardClick = useCallback(() => {
    if (onSelect) onSelect(id);
  }, [id, onSelect]);

  // Compact card view
  if (!showDetailedView) {
    return (
      <div
        onClick={handleCardClick}
        className={`
          bg-white rounded-xl shadow-md border-l-4 ${getStatusBgColor()}
          cursor-pointer transition-all duration-200
          hover:shadow-lg hover:scale-[1.02]
          ${isSelected ? "ring-2 ring-blue-500" : ""}
        `}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-gray-800">{name}</h3>
              <p className="text-xs text-gray-500 capitalize">{type}</p>
            </div>
            <div className="flex items-center space-x-2">
              {doorOpen && (
                <FaDoorOpen
                  className="text-orange-500 animate-pulse"
                  title="Door Open"
                />
              )}
              <StatusBadge status={status} size="small" />
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <FaThermometerHalf className="mx-auto text-blue-500 mb-1" />
              <p className="text-sm font-semibold">
                {(temperature.current ?? 0).toFixed(1)}°C
              </p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <FaTint className="mx-auto text-green-500 mb-1" />
              <p className="text-sm font-semibold">
                {(humidity.current ?? 0).toFixed(0)}%
              </p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <FaCompressArrowsAlt className="mx-auto text-purple-500 mb-1" />
              <p className="text-sm font-semibold">
                {(pressureDifferential?.current ?? 0).toFixed(0)} Pa
              </p>
            </div>
          </div>

          {/* Sparkline and alerts */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkline
                data={history.temperature?.slice(-12) || []}
                color={
                  status === "optimal"
                    ? "#10B981"
                    : status === "warning"
                    ? "#F59E0B"
                    : "#EF4444"
                }
                width={50}
                height={20}
              />
              <span className="text-xs text-gray-500 capitalize">
                {temperatureTrend.direction}
              </span>
            </div>
            <AlertSummary alerts={alerts} />
          </div>
        </div>
      </div>
    );
  }

  // Detailed card view
  return (
    <div
      className={`bg-white rounded-xl shadow-lg border-l-4 ${getStatusBgColor()}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div>
              <h2 className="text-xl font-bold text-gray-800">{name}</h2>
              <p className="text-sm text-gray-500 capitalize">{type} Storage</p>
            </div>
            {doorOpen && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-orange-100 rounded-full">
                <FaDoorOpen className="text-orange-500" />
                <span className="text-xs text-orange-700">Door Open</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <ComplianceBadge compliance={compliance} />
            <StatusBadge status={status} />
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex space-x-4 mt-4">
          {["overview", "stability", "equipment", "alerts"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                px-3 py-1 text-sm font-medium rounded-lg transition-colors
                ${
                  activeTab === tab
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-500 hover:bg-gray-100"
                }
              `}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === "overview" && (
          <div className="space-y-4">
            <ParameterGauges
              temperature={{ ...temperature, value: temperature.current }}
              humidity={{ ...humidity, value: humidity.current }}
              pressure={{
                ...pressureDifferential,
                value: pressureDifferential?.current ?? 0,
                unit: "Pa",
                label: "Pressure Diff",
              }}
              showDewPoint={true}
            />

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="text-xs text-gray-500">
                Last Updated:{" "}
                {lastUpdated
                  ? new Date(lastUpdated).toLocaleTimeString()
                  : "N/A"}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onViewHistory?.(id)}
                  className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <FaHistory />
                  <span>History</span>
                </button>
                <button
                  onClick={() => onViewAlerts?.(id)}
                  className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <FaBell />
                  <span>Alerts</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "stability" && (
          <div className="grid grid-cols-2 gap-4">
            <StabilityIndicator
              history={history.temperature || []}
              targetMin={temperature.min ?? 2}
              targetMax={temperature.max ?? 8}
              label="Temperature Stability"
            />
            <StabilityIndicator
              history={history.humidity || []}
              targetMin={humidity.min ?? 30}
              targetMax={humidity.max ?? 60}
              label="Humidity Stability"
            />
          </div>
        )}

        {activeTab === "equipment" && (
          <div className="space-y-4">
            <EquipmentStatus equipment={equipment} />
            <button
              onClick={() => onMaintenanceRequest?.(id)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
            >
              <FaWrench />
              <span>Request Maintenance</span>
            </button>
          </div>
        )}

        {activeTab === "alerts" && (
          <div className="space-y-2">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FaCheckCircle className="mx-auto text-3xl text-green-500 mb-2" />
                <p>No active alerts for this room</p>
              </div>
            ) : (
              alerts.slice(0, 5).map((alert, index) => (
                <div
                  key={alert.id || index}
                  className={`
                    p-3 rounded-lg border-l-4
                    ${
                      alert.severity === "critical"
                        ? "bg-red-50 border-l-red-500"
                        : alert.severity === "warning"
                        ? "bg-yellow-50 border-l-yellow-500"
                        : "bg-blue-50 border-l-blue-500"
                    }
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {alert.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {alert.timestamp
                          ? new Date(alert.timestamp).toLocaleString()
                          : "Unknown time"}
                      </p>
                    </div>
                    <span
                      className={`
                      px-2 py-0.5 text-xs rounded-full
                      ${
                        alert.severity === "critical"
                          ? "bg-red-100 text-red-700"
                          : alert.severity === "warning"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-blue-100 text-blue-700"
                      }
                    `}
                    >
                      {alert.severity}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomDashboardCard;
export { StatusBadge, AlertSummary, EquipmentStatus, ComplianceBadge };
