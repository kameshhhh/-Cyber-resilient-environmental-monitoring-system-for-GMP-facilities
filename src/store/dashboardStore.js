import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// Type definitions for the store
/**
 * @typedef {'vaccine' | 'biologic' | 'pharmaceutical' | 'controlled'} RoomCategory
 * @typedef {'optimal' | 'warning' | 'critical' | 'offline'} RoomStatus
 * @typedef {'rising' | 'falling' | 'stable'} TrendDirection
 * @typedef {'low' | 'medium' | 'high'} Severity
 * @typedef {'realtime' | '1h' | '24h' | '7d' | '30d'} TimeRange
 * @typedef {'normal' | 'power-outage' | 'ac-failure' | 'door-open'} SimulationScenario
 */

/**
 * @typedef {Object} SensorReading
 * @property {number} value
 * @property {string} timestamp
 * @property {number} accuracy
 */

/**
 * @typedef {Object} Medicine
 * @property {string} id
 * @property {string} name
 * @property {string} expiry
 * @property {string} batch
 * @property {{ temp: number, humidity: number }} sensitivity
 */

/**
 * @typedef {Object} Violation
 * @property {string} parameter
 * @property {number} duration
 * @property {Severity} severity
 * @property {string} timestamp
 */

/**
 * @typedef {Object} Alert
 * @property {string} id
 * @property {string} roomId
 * @property {string} roomName
 * @property {string} condition
 * @property {'critical' | 'warning' | 'info'} severity
 * @property {string} message
 * @property {string} timestamp
 * @property {boolean} acknowledged
 * @property {string[]} actions
 * @property {{ after: string, actions: string[] }} [escalation]
 */

// Initial room data with enhanced structure
const createEnhancedRoom = (baseRoom) => ({
  ...baseRoom,
  category: determineCategory(baseRoom.medicines),
  conditions: {
    temperature: {
      ...baseRoom.conditions.temperature,
      value: baseRoom.conditions.temperature.current,
      timestamp: new Date().toISOString(),
      accuracy: 0.98,
      trend: "stable",
      history: generateInitialHistory(
        baseRoom.conditions.temperature.current,
        24
      ),
    },
    humidity: {
      ...baseRoom.conditions.humidity,
      value: baseRoom.conditions.humidity.current,
      timestamp: new Date().toISOString(),
      accuracy: 0.95,
      dewPoint: calculateDewPoint(
        baseRoom.conditions.temperature.current,
        baseRoom.conditions.humidity.current
      ),
      history: generateInitialHistory(baseRoom.conditions.humidity.current, 24),
    },
    pressure: {
      ...baseRoom.conditions.pressure,
      value: baseRoom.conditions.pressure.current,
      timestamp: new Date().toISOString(),
      accuracy: 0.99,
      altitudeAdjustment: false,
      history: generateInitialHistory(baseRoom.conditions.pressure.current, 24),
    },
  },
  thresholds: {
    primary: {
      temperature: {
        min: baseRoom.conditions.temperature.min,
        max: baseRoom.conditions.temperature.max,
      },
      humidity: {
        min: baseRoom.conditions.humidity.min,
        max: baseRoom.conditions.humidity.max,
      },
      pressure: {
        min: baseRoom.conditions.pressure.min,
        max: baseRoom.conditions.pressure.max,
      },
    },
    secondary: {
      temperature: {
        min:
          baseRoom.conditions.temperature.min +
          (baseRoom.conditions.temperature.max -
            baseRoom.conditions.temperature.min) *
            0.15,
        max:
          baseRoom.conditions.temperature.max -
          (baseRoom.conditions.temperature.max -
            baseRoom.conditions.temperature.min) *
            0.15,
      },
      humidity: {
        min:
          baseRoom.conditions.humidity.min +
          (baseRoom.conditions.humidity.max -
            baseRoom.conditions.humidity.min) *
            0.15,
        max:
          baseRoom.conditions.humidity.max -
          (baseRoom.conditions.humidity.max -
            baseRoom.conditions.humidity.min) *
            0.15,
      },
      pressure: {
        min:
          baseRoom.conditions.pressure.min +
          (baseRoom.conditions.pressure.max -
            baseRoom.conditions.pressure.min) *
            0.15,
        max:
          baseRoom.conditions.pressure.max -
          (baseRoom.conditions.pressure.max -
            baseRoom.conditions.pressure.min) *
            0.15,
      },
    },
    emergency: {
      temperature: {
        min:
          baseRoom.conditions.temperature.min -
          (baseRoom.conditions.temperature.max -
            baseRoom.conditions.temperature.min) *
            0.2,
        max:
          baseRoom.conditions.temperature.max +
          (baseRoom.conditions.temperature.max -
            baseRoom.conditions.temperature.min) *
            0.2,
      },
      humidity: { min: 15, max: 80 },
      pressure: { min: 95, max: 105 },
    },
  },
  compliance: {
    lastAudit: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    auditScore: 95 + Math.random() * 5,
    violations: [],
    stabilityScore: 0.92 + Math.random() * 0.08,
  },
  medicines: baseRoom.medicines.map((name, index) => ({
    id: `med-${baseRoom.id}-${index}`,
    name,
    expiry: new Date(
      Date.now() + (180 + Math.random() * 365) * 24 * 60 * 60 * 1000
    ).toISOString(),
    batch: `BATCH-${Date.now().toString(36).toUpperCase()}-${index}`,
    sensitivity: {
      temp: 2 + Math.random() * 3, // degradation rate per degree deviation
      humidity: 0.5 + Math.random() * 1.5,
    },
  })),
  equipment: {
    compressorCycles: Math.floor(10000 + Math.random() * 50000),
    lastMaintenance: new Date(
      Date.now() - (30 + Math.random() * 60) * 24 * 60 * 60 * 1000
    ).toISOString(),
    filterAge: Math.floor(30 + Math.random() * 90),
    sensorAge: Math.random() * 2, // years
  },
  permissions: {
    calibrate: true,
    override: false,
  },
  predictedFailTime: null,
});

// Helper functions
function determineCategory(medicines) {
  const medicineStr = medicines.join(" ").toLowerCase();
  if (medicineStr.includes("vaccine")) return "vaccine";
  if (medicineStr.includes("biologic") || medicineStr.includes("plasma"))
    return "biologic";
  if (medicineStr.includes("controlled")) return "controlled";
  return "pharmaceutical";
}

function calculateDewPoint(temperature, humidity) {
  // Magnus formula approximation
  const a = 17.27;
  const b = 237.7;
  const alpha =
    (a * temperature) / (b + temperature) + Math.log(humidity / 100);
  return (b * alpha) / (a - alpha);
}

function generateInitialHistory(currentValue, points) {
  const history = [];
  for (let i = points - 1; i >= 0; i--) {
    const fluctuation = (Math.random() - 0.5) * currentValue * 0.1;
    history.push(Math.round((currentValue + fluctuation) * 100) / 100);
  }
  return history;
}

// Create the Zustand store
const useDashboardStore = create(
  persist(
    immer((set, get) => ({
      // State
      rooms: new Map(),
      selectedRoom: null,
      timeRange: "realtime",
      alerts: [],
      viewMode: "grid", // 'grid' | 'list' | 'detailed'

      // Simulation state
      simulation: {
        isActive: true,
        scenario: "normal",
        speed: 1,
        failureRate: 0.02,
        drift: true,
      },

      // User & Security state
      currentUser: {
        id: "user-1",
        name: "Admin User",
        role: "administrator",
        permissions: ["view", "edit", "calibrate", "override", "audit"],
      },

      // UI state
      ui: {
        sidebarOpen: true,
        alertPanelExpanded: true,
        complianceModalOpen: false,
        selectedRoomForDetails: null,
      },

      // Actions
      initializeRooms: (baseRooms) => {
        set((state) => {
          state.rooms = new Map(
            baseRooms.map((room) => [room.id, createEnhancedRoom(room)])
          );
        });
      },

      updateSensorData: (roomId, sensorType, value, accuracy = 0.98) => {
        set((state) => {
          const room = state.rooms.get(roomId);
          if (room && room.conditions[sensorType]) {
            const condition = room.conditions[sensorType];
            const previousValue = condition.value;

            // Update value
            condition.value = value;
            condition.current = value;
            condition.timestamp = new Date().toISOString();
            condition.accuracy = accuracy;

            // Calculate trend
            const historyAvg =
              condition.history.slice(-5).reduce((a, b) => a + b, 0) / 5;
            if (value > historyAvg * 1.02) {
              condition.trend = "rising";
            } else if (value < historyAvg * 0.98) {
              condition.trend = "falling";
            } else {
              condition.trend = "stable";
            }

            // Update history
            condition.history = [...condition.history.slice(-23), value];

            // Update dew point for humidity
            if (sensorType === "humidity") {
              condition.dewPoint = calculateDewPoint(
                room.conditions.temperature.value,
                value
              );
            }

            // Update room timestamp
            room.lastUpdated = new Date().toISOString();
          }
        });
      },

      updateRoomStatus: (roomId, status) => {
        set((state) => {
          const room = state.rooms.get(roomId);
          if (room) {
            room.status = status;
          }
        });
      },

      selectRoom: (roomId) => {
        set((state) => {
          state.selectedRoom = roomId;
        });
      },

      setTimeRange: (range) => {
        set((state) => {
          state.timeRange = range;
        });
      },

      setViewMode: (mode) => {
        set((state) => {
          state.viewMode = mode;
        });
      },

      // Alert actions
      addAlert: (alert) => {
        set((state) => {
          const newAlert = {
            ...alert,
            id: `alert-${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            acknowledged: false,
          };
          state.alerts.unshift(newAlert);
          // Keep only last 100 alerts
          if (state.alerts.length > 100) {
            state.alerts = state.alerts.slice(0, 100);
          }
        });
      },

      acknowledgeAlert: (alertId) => {
        set((state) => {
          const alert = state.alerts.find((a) => a.id === alertId);
          if (alert) {
            alert.acknowledged = true;
            alert.acknowledgedAt = new Date().toISOString();
            alert.acknowledgedBy = state.currentUser.id;
          }
        });
      },

      clearAcknowledgedAlerts: () => {
        set((state) => {
          state.alerts = state.alerts.filter((a) => !a.acknowledged);
        });
      },

      // Simulation actions
      setSimulationActive: (isActive) => {
        set((state) => {
          state.simulation.isActive = isActive;
        });
      },

      setSimulationScenario: (scenario) => {
        set((state) => {
          state.simulation.scenario = scenario;
        });
      },

      setSimulationSpeed: (speed) => {
        set((state) => {
          state.simulation.speed = speed;
        });
      },

      // Compliance actions
      addViolation: (roomId, violation) => {
        set((state) => {
          const room = state.rooms.get(roomId);
          if (room) {
            room.compliance.violations.push({
              ...violation,
              timestamp: new Date().toISOString(),
            });
          }
        });
      },

      updateAuditScore: (roomId, score) => {
        set((state) => {
          const room = state.rooms.get(roomId);
          if (room) {
            room.compliance.auditScore = score;
            room.compliance.lastAudit = new Date().toISOString();
          }
        });
      },

      // Equipment actions
      updateEquipment: (roomId, equipmentData) => {
        set((state) => {
          const room = state.rooms.get(roomId);
          if (room) {
            room.equipment = { ...room.equipment, ...equipmentData };
          }
        });
      },

      setPredictedFailTime: (roomId, time) => {
        set((state) => {
          const room = state.rooms.get(roomId);
          if (room) {
            room.predictedFailTime = time;
          }
        });
      },

      // UI actions
      toggleSidebar: () => {
        set((state) => {
          state.ui.sidebarOpen = !state.ui.sidebarOpen;
        });
      },

      setComplianceModalOpen: (isOpen) => {
        set((state) => {
          state.ui.complianceModalOpen = isOpen;
        });
      },

      setSelectedRoomForDetails: (roomId) => {
        set((state) => {
          state.ui.selectedRoomForDetails = roomId;
        });
      },

      // Utility functions accessible from store
      getRoomById: (roomId) => {
        return get().rooms.get(roomId);
      },

      getActiveAlerts: () => {
        return get().alerts.filter((a) => !a.acknowledged);
      },

      getCriticalRooms: () => {
        const rooms = get().rooms;
        return Array.from(rooms.values()).filter(
          (r) => r.status === "critical"
        );
      },

      getAllRoomsArray: () => {
        return Array.from(get().rooms.values());
      },
    })),
    {
      name: "medicine-monitor-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        alerts: state.alerts.slice(0, 50),
        simulation: state.simulation,
        timeRange: state.timeRange,
        viewMode: state.viewMode,
      }),
      // Custom serialization for Map
      serialize: (state) =>
        JSON.stringify({
          ...state,
          state: {
            ...state.state,
            rooms: Array.from(state.state.rooms?.entries?.() || []),
          },
        }),
      deserialize: (str) => {
        const parsed = JSON.parse(str);
        return {
          ...parsed,
          state: {
            ...parsed.state,
            rooms: new Map(parsed.state.rooms || []),
          },
        };
      },
    }
  )
);

export default useDashboardStore;
export { createEnhancedRoom, calculateDewPoint, generateInitialHistory };
