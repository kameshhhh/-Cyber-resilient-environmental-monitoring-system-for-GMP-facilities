import { INITIAL_ROOMS } from "../utils/constants";

/**
 * Simulate sensor data updates with random fluctuations
 * @param {Array} rooms - Current room data
 * @returns {Array} Updated room data with new sensor readings
 */
export const simulateSensorUpdates = (rooms) => {
  return rooms.map((room) => {
    const updatedConditions = { ...room.conditions };

    Object.keys(updatedConditions).forEach((key) => {
      const condition = updatedConditions[key];
      const range = condition.max - condition.min;

      // Random fluctuation within ±10% of range
      const fluctuation = (Math.random() - 0.5) * range * 0.2;
      let newValue = condition.current + fluctuation;

      // Occasionally push values to edge cases (10% chance)
      if (Math.random() < 0.1) {
        const edgeCase = Math.random();
        if (edgeCase < 0.33) {
          // Push to yellow zone (near min)
          newValue = condition.min + range * 0.05;
        } else if (edgeCase < 0.66) {
          // Push to yellow zone (near max)
          newValue = condition.max - range * 0.05;
        } else {
          // Push to red zone (5% chance)
          if (Math.random() < 0.5) {
            newValue = condition.min - range * 0.1;
          } else {
            newValue = condition.max + range * 0.1;
          }
        }
      }

      // Round to 1 decimal place
      newValue = Math.round(newValue * 10) / 10;

      updatedConditions[key] = {
        ...condition,
        current: newValue,
      };
    });

    return {
      ...room,
      conditions: updatedConditions,
      lastUpdated: new Date().toISOString(),
    };
  });
};

/**
 * Fetch initial room data (mock API)
 * @returns {Promise<Array>} Promise resolving to room data
 */
export const fetchRooms = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(INITIAL_ROOMS);
    }, 500);
  });
};

/**
 * Fetch sensor data for a specific room (mock API)
 * @param {string} roomId - Room ID
 * @returns {Promise<Object>} Promise resolving to sensor data
 */
export const fetchSensorData = (roomId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const room = INITIAL_ROOMS.find((r) => r.id === roomId);
      if (room) {
        resolve({
          roomId,
          timestamp: new Date().toISOString(),
          readings: {
            temperature: room.conditions.temperature.current,
            humidity: room.conditions.humidity.current,
            pressure: room.conditions.pressure.current,
          },
        });
      } else {
        resolve(null);
      }
    }, 200);
  });
};

/**
 * Update room configuration (mock API)
 * @param {string} roomId - Room ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>} Promise resolving to updated room
 */
export const updateRoomConfig = (roomId, updates) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ roomId, ...updates, success: true });
    }, 300);
  });
};

/**
 * Save rooms to localStorage
 * @param {Array} rooms - Room data to save
 */
export const saveRoomsToStorage = (rooms) => {
  try {
    localStorage.setItem("medicine-monitor-rooms", JSON.stringify(rooms));
  } catch (error) {
    console.error("Error saving rooms to storage:", error);
  }
};

/**
 * Load rooms from localStorage
 * @returns {Array|null} Saved room data or null
 */
export const loadRoomsFromStorage = () => {
  try {
    const saved = localStorage.getItem("medicine-monitor-rooms");
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error("Error loading rooms from storage:", error);
    return null;
  }
};

/**
 * Save alerts to localStorage
 * @param {Array} alerts - Alert data to save
 */
export const saveAlertsToStorage = (alerts) => {
  try {
    localStorage.setItem("medicine-monitor-alerts", JSON.stringify(alerts));
  } catch (error) {
    console.error("Error saving alerts to storage:", error);
  }
};

/**
 * Load alerts from localStorage
 * @returns {Array} Saved alert data or empty array
 */
export const loadAlertsFromStorage = () => {
  try {
    const saved = localStorage.getItem("medicine-monitor-alerts");
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Error loading alerts from storage:", error);
    return [];
  }
};

/**
 * Generate historical data for charts
 * @param {Object} room - Room data
 * @param {number} points - Number of data points
 * @returns {Array} Historical data array
 */
export const generateHistoricalData = (room, points = 24) => {
  const history = [];
  const now = new Date();

  for (let i = points - 1; i >= 0; i--) {
    const timestamp = new Date(now - i * 60 * 60 * 1000);
    const entry = {
      timestamp: timestamp.toISOString(),
      time: timestamp.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    Object.keys(room.conditions).forEach((key) => {
      const condition = room.conditions[key];
      const range = condition.max - condition.min;
      const fluctuation = (Math.random() - 0.5) * range * 0.3;
      entry[key] = Math.round((condition.current + fluctuation) * 10) / 10;
    });

    history.push(entry);
  }

  return history;
};
