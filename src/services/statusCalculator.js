import { MARGIN_PERCENTAGE } from "../utils/constants";

/**
 * Get status color based on current value and allowed range
 * @param {number} currentValue - Current sensor reading
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {'green'|'yellow'|'red'} Status color
 */
export const getStatusColor = (currentValue, min, max) => {
  const range = max - min;
  const margin = range * MARGIN_PERCENTAGE;

  if (currentValue >= min + margin && currentValue <= max - margin) {
    return "green"; // Optimal - within center 80%
  } else if (currentValue >= min && currentValue <= max) {
    return "yellow"; // Acceptable but marginal - within outer 20%
  } else {
    return "red"; // Out of range
  }
};

/**
 * Calculate overall room status based on all conditions
 * @param {Object} roomData - Room data with conditions
 * @returns {'green'|'yellow'|'red'} Overall status
 */
export const calculateRoomStatus = (roomData) => {
  const { conditions } = roomData;
  const statuses = [];

  Object.keys(conditions).forEach((key) => {
    const condition = conditions[key];
    const status = getStatusColor(
      condition.current,
      condition.min,
      condition.max
    );
    statuses.push(status);
  });

  // Return worst status
  if (statuses.includes("red")) return "red";
  if (statuses.includes("yellow")) return "yellow";
  return "green";
};

/**
 * Get condition status for a specific parameter
 * @param {Object} condition - Condition object with min, max, current
 * @returns {Object} Status info with color, label, and percentage
 */
export const getConditionStatus = (condition) => {
  const { min, max, current } = condition;
  const status = getStatusColor(current, min, max);
  const range = max - min;
  const percentage = ((current - min) / range) * 100;

  const labels = {
    green: "Optimal",
    yellow: "Marginal",
    red: "Critical",
  };

  return {
    status,
    label: labels[status],
    percentage: Math.max(0, Math.min(100, percentage)),
    isAboveRange: current > max,
    isBelowRange: current < min,
  };
};

/**
 * Validate input values against room configuration
 * @param {Object} values - Input values
 * @param {Object} roomConfig - Room configuration
 * @returns {Object} Validation result
 */
export const validateInputs = (values, roomConfig) => {
  const errors = {};
  const { conditions } = roomConfig;

  Object.keys(values).forEach((key) => {
    if (conditions[key]) {
      const value = values[key];
      if (typeof value !== "number" || isNaN(value)) {
        errors[key] = "Invalid value";
      }
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Generate alerts from all rooms
 * @param {Array} allRooms - Array of room data
 * @returns {Array} Array of alert objects
 */
export const generateAlerts = (allRooms) => {
  const alerts = [];

  allRooms.forEach((room) => {
    const { conditions, name, id } = room;

    Object.entries(conditions).forEach(([conditionName, condition]) => {
      const status = getStatusColor(
        condition.current,
        condition.min,
        condition.max
      );

      if (status === "red") {
        alerts.push({
          id: `${id}-${conditionName}-${Date.now()}`,
          roomId: id,
          roomName: name,
          condition: conditionName,
          severity: "critical",
          message: `${capitalize(conditionName)} out of range: ${
            condition.current
          }${condition.unit} (Range: ${condition.min}-${condition.max}${
            condition.unit
          })`,
          timestamp: new Date().toISOString(),
          acknowledged: false,
        });
      } else if (status === "yellow") {
        alerts.push({
          id: `${id}-${conditionName}-${Date.now()}`,
          roomId: id,
          roomName: name,
          condition: conditionName,
          severity: "warning",
          message: `${capitalize(conditionName)} near limits: ${
            condition.current
          }${condition.unit} (Range: ${condition.min}-${condition.max}${
            condition.unit
          })`,
          timestamp: new Date().toISOString(),
          acknowledged: false,
        });
      }
    });
  });

  return alerts.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
};

/**
 * Capitalize first letter of string
 * @param {string} str - Input string
 * @returns {string} Capitalized string
 */
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

/**
 * Format percentage for display in progress bar
 * @param {number} current - Current value
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Percentage (0-100)
 */
export const getProgressPercentage = (current, min, max) => {
  const range = max - min;
  const position = current - min;
  return Math.max(0, Math.min(100, (position / range) * 100));
};
