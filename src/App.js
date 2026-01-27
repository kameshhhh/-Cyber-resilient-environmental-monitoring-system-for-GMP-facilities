import React, { useState, useEffect, useCallback } from "react";
import { DashboardProvider, useDashboard } from "./contexts/DashboardContext";
import DashboardHeader from "./components/DashboardHeader";
import RoomGrid from "./components/RoomGrid";
import AlertPanel from "./components/AlertPanel";
import {
  RoomDashboardCard,
  ComplianceDashboard,
  StabilityIndicator,
} from "./components/advanced";
import RoomDetailPanel from "./components/RoomDetailPanel";
import BlockchainExplorer from "./components/BlockchainExplorer";
import SmartContractDashboard from "./components/SmartContractDashboard";
import { VideoCardWrapper } from "./components/VideoCardWrapper";
import useOfflineCapabilities from "./hooks/useOfflineCapabilities";
import { useSecurityModule } from "./modules/securityModule";
import "./App.css";

// View modes
const VIEW_MODES = {
  DASHBOARD: "dashboard",
  COMPLIANCE: "compliance",
  ROOM_DETAIL: "room-detail",
  BLOCKCHAIN: "blockchain",
  SMART_CONTRACTS: "smart-contracts",
};

// Navigation component
const Navigation = ({ activeView, onViewChange, isOnline, pendingCount }) => {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-12">
          <div className="flex space-x-4">
            <button
              onClick={() => onViewChange(VIEW_MODES.DASHBOARD)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeView === VIEW_MODES.DASHBOARD
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => onViewChange(VIEW_MODES.COMPLIANCE)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeView === VIEW_MODES.COMPLIANCE
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Compliance
            </button>
            <button
              onClick={() => onViewChange(VIEW_MODES.BLOCKCHAIN)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeView === VIEW_MODES.BLOCKCHAIN
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              🔗 Blockchain
            </button>
            <button
              onClick={() => onViewChange(VIEW_MODES.SMART_CONTRACTS)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeView === VIEW_MODES.SMART_CONTRACTS
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              📜 Smart Contracts
            </button>
          </div>

          <div className="flex items-center space-x-3">
            {/* Offline indicator */}
            <div
              className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                isOnline
                  ? "bg-green-100 text-green-700"
                  : "bg-orange-100 text-orange-700"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  isOnline ? "bg-green-500" : "bg-orange-500"
                }`}
              />
              <span>{isOnline ? "Online" : "Offline"}</span>
            </div>

            {/* Pending sync indicator */}
            {pendingCount > 0 && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                <span>{pendingCount} pending</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Content
const DashboardContent = () => {
  const { rooms, selectedRoomId, selectRoom, alerts } = useDashboard();
  const [activeView, setActiveView] = useState(VIEW_MODES.DASHBOARD);
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Offline capabilities
  const { isOnline, syncStatus, pendingCount, queueAlert } =
    useOfflineCapabilities({
      autoSync: true,
      syncInterval: 30000,
      onSyncComplete: (results) => {
        console.log("Sync completed:", results);
      },
    });

  // Security module
  const security = useSecurityModule();

  // Initialize security with demo user
  useEffect(() => {
    if (!security.currentUser) {
      security.initialize({
        id: "demo-user",
        name: "Demo User",
        email: "demo@example.com",
        role: "QUALITY_MANAGER",
      });
    }
  }, [security]);

  // Keep selectedRoom in sync with rooms updates
  useEffect(() => {
    if (selectedRoom && rooms.length > 0) {
      const updatedRoom = rooms.find((r) => r.id === selectedRoom.id);
      if (updatedRoom) {
        setSelectedRoom(updatedRoom);
      }
    }
  }, [rooms, selectedRoom?.id]);

  // Handle room selection
  const handleRoomSelect = useCallback(
    (roomId) => {
      selectRoom(roomId);
      const room = rooms.find((r) => r.id === roomId);
      setSelectedRoom(room);
      setActiveView(VIEW_MODES.ROOM_DETAIL);
    },
    [rooms, selectRoom]
  );

  // Handle view change
  const handleViewChange = useCallback((view) => {
    setActiveView(view);
    if (view !== VIEW_MODES.ROOM_DETAIL) {
      setSelectedRoom(null);
    }
  }, []);

  // Queue alert for offline storage
  const handleAlertAcknowledge = useCallback(
    async (alertId) => {
      if (!isOnline) {
        await queueAlert({
          id: alertId,
          action: "acknowledge",
          timestamp: Date.now(),
        });
      }
    },
    [isOnline, queueAlert]
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <DashboardHeader />
      <Navigation
        activeView={activeView}
        onViewChange={handleViewChange}
        isOnline={isOnline}
        pendingCount={pendingCount}
      />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Dashboard View */}
        {activeView === VIEW_MODES.DASHBOARD && (
          <>
            <AlertPanel onAcknowledge={handleAlertAcknowledge} />

            {/* Advanced Room Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {rooms.map((room) => (
                <VideoCardWrapper
                  key={room.id}
                  roomType={room.name || room.tier}
                  status={room.status}
                >
                  <RoomDashboardCard
                    room={{
                      ...room,
                      sensors: {
                        temperature: {
                          current: room.conditions?.temperature?.current ?? 0,
                          min: room.conditions?.temperature?.min ?? -90,
                          max: room.conditions?.temperature?.max ?? 25,
                          unit: room.conditions?.temperature?.unit ?? "°C",
                        },
                        humidity: {
                          current: room.conditions?.humidity?.current ?? 0,
                          min: room.conditions?.humidity?.min ?? 0,
                          max: room.conditions?.humidity?.max ?? 60,
                          unit: room.conditions?.humidity?.unit ?? "%",
                        },
                        pressureDifferential: {
                          current:
                            room.conditions?.pressureDifferential?.current ?? 0,
                          min: room.conditions?.pressureDifferential?.min ?? 0,
                          max: room.conditions?.pressureDifferential?.max ?? 30,
                          unit:
                            room.conditions?.pressureDifferential?.unit ?? "Pa",
                        },
                      },
                      history: {
                        temperature:
                          room.history?.map((h) => h.temperature) || [],
                        humidity: room.history?.map((h) => h.humidity) || [],
                      },
                      alerts: alerts.filter((a) => a.roomId === room.id),
                      equipment: {
                        compressorHealth: 85 + Math.random() * 10,
                        filterHealth: 70 + Math.random() * 20,
                        sensorHealth: 90 + Math.random() * 8,
                      },
                      compliance: {
                        isCompliant: room.status === "optimal",
                        score:
                          room.status === "optimal"
                            ? 95
                            : room.status === "warning"
                            ? 75
                            : 50,
                      },
                    }}
                    onSelect={handleRoomSelect}
                    isSelected={selectedRoomId === room.id}
                    showDetailedView={false}
                  />
                </VideoCardWrapper>
              ))}
            </div>

            {/* Legacy Grid (hidden by default, can toggle) */}
            <div className="mt-8 hidden">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Classic View
              </h3>
              <RoomGrid />
            </div>
          </>
        )}

        {/* Room Detail View */}
        {activeView === VIEW_MODES.ROOM_DETAIL && selectedRoom && (
          <div className="space-y-6">
            <button
              onClick={() => handleViewChange(VIEW_MODES.DASHBOARD)}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
            >
              <span>← Back to Dashboard</span>
            </button>

            {/* New Comprehensive Room Detail Panel */}
            <RoomDetailPanel
              room={selectedRoom}
              onClose={() => handleViewChange(VIEW_MODES.DASHBOARD)}
            />

            {/* Additional RoomDashboardCard for sensor gauges */}
            <RoomDashboardCard
              room={{
                ...selectedRoom,
                sensors: {
                  temperature: {
                    current: selectedRoom.conditions?.temperature?.current ?? 0,
                    min: selectedRoom.conditions?.temperature?.min ?? -90,
                    max: selectedRoom.conditions?.temperature?.max ?? 25,
                    unit: selectedRoom.conditions?.temperature?.unit ?? "°C",
                  },
                  humidity: {
                    current: selectedRoom.conditions?.humidity?.current ?? 0,
                    min: selectedRoom.conditions?.humidity?.min ?? 0,
                    max: selectedRoom.conditions?.humidity?.max ?? 60,
                    unit: selectedRoom.conditions?.humidity?.unit ?? "%",
                  },
                  pressureDifferential: {
                    current:
                      selectedRoom.conditions?.pressureDifferential?.current ??
                      0,
                    min:
                      selectedRoom.conditions?.pressureDifferential?.min ?? 0,
                    max:
                      selectedRoom.conditions?.pressureDifferential?.max ?? 30,
                    unit:
                      selectedRoom.conditions?.pressureDifferential?.unit ??
                      "Pa",
                  },
                },
                history: {
                  temperature:
                    selectedRoom.history?.map((h) => h.temperature) || [],
                  humidity: selectedRoom.history?.map((h) => h.humidity) || [],
                },
                alerts: alerts.filter((a) => a.roomId === selectedRoom.id),
                equipment: {
                  compressorHealth: 85,
                  filterHealth: 78,
                  sensorHealth: 92,
                },
                compliance: {
                  isCompliant: selectedRoom.status === "optimal",
                  score: selectedRoom.status === "optimal" ? 95 : 75,
                },
              }}
              showDetailedView={true}
              onViewHistory={(id) => console.log("View history for", id)}
              onViewAlerts={(id) => console.log("View alerts for", id)}
              onMaintenanceRequest={(id) =>
                console.log("Request maintenance for", id)
              }
            />

            {/* Additional stability indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StabilityIndicator
                history={selectedRoom.history?.map((h) => h.temperature) || []}
                targetMin={
                  selectedRoom.conditions?.temperature?.min ??
                  selectedRoom.temperatureRange?.min ??
                  2
                }
                targetMax={
                  selectedRoom.conditions?.temperature?.max ??
                  selectedRoom.temperatureRange?.max ??
                  8
                }
                label="Temperature Stability (24h)"
              />
              <StabilityIndicator
                history={selectedRoom.history?.map((h) => h.humidity) || []}
                targetMin={
                  selectedRoom.conditions?.humidity?.min ??
                  selectedRoom.humidityRange?.min ??
                  30
                }
                targetMax={
                  selectedRoom.conditions?.humidity?.max ??
                  selectedRoom.humidityRange?.max ??
                  60
                }
                label="Humidity Stability (24h)"
              />
            </div>
          </div>
        )}

        {/* Compliance View */}
        {activeView === VIEW_MODES.COMPLIANCE && (
          <ComplianceDashboard
            complianceData={{
              lastAudit: new Date().toISOString(),
              requirements: [], // Will use defaults
            }}
            auditTrail={[
              {
                id: "1",
                action: "Temperature threshold updated",
                user: "John Smith",
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                details: "Changed from 2-8°C to 2-6°C for Room 101",
              },
              {
                id: "2",
                action: "Alert acknowledged",
                user: "Jane Doe",
                timestamp: new Date(Date.now() - 7200000).toISOString(),
                details: "High humidity alert in Cold Storage A",
              },
              {
                id: "3",
                action: "Compliance report generated",
                user: "System",
                timestamp: new Date(Date.now() - 86400000).toISOString(),
                details: "Monthly compliance report for October 2024",
              },
            ]}
            onGenerateReport={(options) => {
              console.log("Generating report with options:", options);
              return new Promise((resolve) => setTimeout(resolve, 2000));
            }}
          />
        )}

        {/* Blockchain Explorer View */}
        {activeView === VIEW_MODES.BLOCKCHAIN && <BlockchainExplorer />}

        {/* Smart Contracts Dashboard View */}
        {activeView === VIEW_MODES.SMART_CONTRACTS && (
          <SmartContractDashboard />
        )}
      </main>

      <footer className="text-center py-4 text-gray-500 text-sm border-t border-gray-200 bg-white">
        <p>Medicine Storage Condition Monitor</p>
        <p className="text-xs mt-1">
          Real-time environmental monitoring dashboard | FDA 21 CFR Part 211
          Compliant
        </p>
        {syncStatus === "syncing" && (
          <p className="text-xs text-blue-500 mt-1">Syncing data...</p>
        )}
      </footer>
    </div>
  );
};

function App() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}

export default App;
