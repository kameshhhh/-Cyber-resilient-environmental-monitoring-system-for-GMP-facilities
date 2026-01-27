import React, { useState } from "react";
import {
  FaBell,
  FaExclamationTriangle,
  FaExclamationCircle,
  FaCheck,
  FaTrash,
  FaChevronRight,
} from "react-icons/fa";
import { useDashboard } from "../../contexts/DashboardContext";

const AlertPanel = () => {
  const { alerts, acknowledgeAlert, clearAcknowledgedAlerts } = useDashboard();
  const [isExpanded, setIsExpanded] = useState(true);

  const activeAlerts = alerts.filter((a) => !a.acknowledged);
  const acknowledgedAlerts = alerts.filter((a) => a.acknowledged);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const severityConfig = {
    critical: {
      icon: FaExclamationCircle,
      bg: "bg-red-50",
      border: "border-red-200",
      iconColor: "text-red-500",
      textColor: "text-red-700",
    },
    warning: {
      icon: FaExclamationTriangle,
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      iconColor: "text-yellow-500",
      textColor: "text-yellow-700",
    },
  };

  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 m-6">
        <div className="p-4 flex items-center justify-center space-x-2 text-gray-500">
          <FaCheck className="text-green-500" />
          <span>All systems operating normally</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 m-6">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="relative">
            <FaBell className="text-xl text-gray-600" />
            {activeAlerts.length > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {activeAlerts.length}
              </span>
            )}
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Alert Center</h2>
            <p className="text-xs text-gray-500">
              {activeAlerts.length} active, {acknowledgedAlerts.length}{" "}
              acknowledged
            </p>
          </div>
        </div>
        <FaChevronRight
          className={`text-gray-400 transform transition-transform ${
            isExpanded ? "rotate-90" : ""
          }`}
        />
      </div>

      {/* Alert List */}
      {isExpanded && (
        <div className="max-h-80 overflow-y-auto">
          {/* Active Alerts */}
          {activeAlerts.length > 0 && (
            <div className="p-4 space-y-2">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Active Alerts
              </h3>
              {activeAlerts.map((alert) => {
                const config = severityConfig[alert.severity];
                const Icon = config.icon;

                return (
                  <div
                    key={alert.id}
                    className={`flex items-start space-x-3 p-3 rounded-lg ${config.bg} border ${config.border}`}
                  >
                    <Icon
                      className={`${config.iconColor} mt-0.5 flex-shrink-0`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm font-medium ${config.textColor}`}
                        >
                          {alert.roomName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(alert.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 truncate">
                        {alert.message}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        acknowledgeAlert(alert.id);
                      }}
                      className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                      title="Acknowledge"
                    >
                      <FaCheck className="text-sm" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Acknowledged Alerts */}
          {acknowledgedAlerts.length > 0 && (
            <div className="p-4 border-t border-gray-100 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">
                  Acknowledged
                </h3>
                <button
                  onClick={clearAcknowledgedAlerts}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center space-x-1"
                >
                  <FaTrash className="text-xs" />
                  <span>Clear All</span>
                </button>
              </div>
              {acknowledgedAlerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50 border border-gray-200 opacity-60"
                >
                  <FaCheck className="text-green-500 text-sm flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-600 truncate block">
                      {alert.roomName}: {alert.condition}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatTimestamp(alert.timestamp)}
                  </span>
                </div>
              ))}
              {acknowledgedAlerts.length > 3 && (
                <p className="text-xs text-gray-400 text-center">
                  +{acknowledgedAlerts.length - 3} more acknowledged alerts
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AlertPanel;
