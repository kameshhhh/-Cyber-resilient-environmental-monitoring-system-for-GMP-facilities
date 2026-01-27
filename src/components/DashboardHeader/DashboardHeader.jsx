import React from "react";
import {
  FaSyncAlt,
  FaBell,
  FaPause,
  FaPlay,
  FaPills,
  FaCloud,
  FaDatabase,
  FaExclamationTriangle,
  FaWifi,
} from "react-icons/fa";
import { useDashboard } from "../../contexts/DashboardContext";

const DashboardHeader = () => {
  const {
    rooms,
    alerts,
    lastUpdate,
    isSimulating,
    toggleSimulation,
    refresh,
    isConnected = false,
    syncStatus = "idle",
    pendingChanges = 0,
    lastSynced,
    dataSource = "local",
    triggerSync,
  } = useDashboard();

  const formatLastUpdate = (date) => {
    if (!date) return "Never";
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const statusCounts = {
    green: rooms.filter((r) => r.status === "green").length,
    yellow: rooms.filter((r) => r.status === "yellow").length,
    red: rooms.filter((r) => r.status === "red").length,
  };

  const activeAlerts = alerts.filter((a) => !a.acknowledged);

  return (
    <header className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <FaPills className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Medicine Storage Monitor
              </h1>
              <p className="text-xs text-gray-500">
                Environmental Condition Dashboard
              </p>
            </div>
          </div>

          {/* Status Summary */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-1 bg-green-50 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-sm font-medium text-green-700">
                {statusCounts.green} Optimal
              </span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1 bg-yellow-50 rounded-full">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              <span className="text-sm font-medium text-yellow-700">
                {statusCounts.yellow} Marginal
              </span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1 bg-red-50 rounded-full">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              <span className="text-sm font-medium text-red-700">
                {statusCounts.red} Critical
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-3">
            {/* Database Connection Status */}
            <div
              className={`flex items-center space-x-2 px-3 py-1 rounded-full cursor-pointer transition-all ${
                isConnected
                  ? syncStatus === "syncing"
                    ? "bg-blue-50 hover:bg-blue-100"
                    : pendingChanges > 0
                    ? "bg-yellow-50 hover:bg-yellow-100"
                    : "bg-green-50 hover:bg-green-100"
                  : "bg-orange-50 hover:bg-orange-100"
              }`}
              onClick={triggerSync}
              title={
                isConnected
                  ? pendingChanges > 0
                    ? `${pendingChanges} changes pending sync - Click to sync now`
                    : `Connected to Supabase (${syncStatus}) - Data source: ${dataSource}`
                  : "Offline - Using local storage. Click to retry connection"
              }
            >
              {isConnected ? (
                pendingChanges > 0 ? (
                  <FaExclamationTriangle className="text-sm text-yellow-500" />
                ) : syncStatus === "syncing" ? (
                  <FaSyncAlt className="text-sm text-blue-500 animate-spin" />
                ) : (
                  <FaCloud className="text-sm text-green-500" />
                )
              ) : (
                <FaWifi className="text-sm text-orange-500" />
              )}
              <span
                className={`text-xs font-medium hidden sm:inline ${
                  isConnected
                    ? pendingChanges > 0
                      ? "text-yellow-600"
                      : syncStatus === "syncing"
                      ? "text-blue-600"
                      : "text-green-600"
                    : "text-orange-600"
                }`}
              >
                {isConnected
                  ? pendingChanges > 0
                    ? `${pendingChanges} Pending`
                    : syncStatus === "syncing"
                    ? "Syncing..."
                    : "Synced"
                  : "Offline"}
              </span>
            </div>

            {/* Data Source Indicator */}
            <div
              className={`hidden lg:flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                dataSource === "supabase"
                  ? "bg-purple-50 text-purple-600"
                  : dataSource === "local"
                  ? "bg-blue-50 text-blue-600"
                  : "bg-gray-50 text-gray-500"
              }`}
              title={`Data loaded from: ${dataSource}`}
            >
              <FaDatabase className="text-xs" />
              <span className="capitalize">{dataSource}</span>
            </div>

            {/* Alerts Indicator */}
            <div className="relative">
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <FaBell className="text-lg" />
                {activeAlerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                    {activeAlerts.length}
                  </span>
                )}
              </button>
            </div>

            {/* Simulation Toggle */}
            <button
              onClick={toggleSimulation}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isSimulating
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {isSimulating ? (
                <>
                  <FaPause className="text-sm" />
                  <span className="text-sm font-medium hidden sm:inline">
                    Pause
                  </span>
                </>
              ) : (
                <>
                  <FaPlay className="text-sm" />
                  <span className="text-sm font-medium hidden sm:inline">
                    Resume
                  </span>
                </>
              )}
            </button>

            {/* Refresh Button */}
            <button
              onClick={refresh}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaSyncAlt className="text-sm" />
              <span className="text-sm font-medium hidden sm:inline">
                Refresh
              </span>
            </button>

            {/* Last Update */}
            <div className="hidden lg:block text-right">
              <p className="text-xs text-gray-500">Last Update</p>
              <p className="text-sm font-medium text-gray-700">
                {formatLastUpdate(lastUpdate)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Status Bar */}
      <div className="md:hidden border-t border-gray-100 px-4 py-2">
        <div className="flex justify-around">
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-xs text-gray-600">{statusCounts.green}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            <span className="text-xs text-gray-600">{statusCounts.yellow}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            <span className="text-xs text-gray-600">{statusCounts.red}</span>
          </div>
          <div className="text-xs text-gray-500">
            Updated: {formatLastUpdate(lastUpdate)}
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
