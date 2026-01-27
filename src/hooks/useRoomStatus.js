import { useMemo } from "react";
import {
  calculateRoomStatus,
  getConditionStatus,
} from "../services/statusCalculator";

/**
 * Custom hook to calculate room status and condition statuses
 * @param {Object} room - Room data
 * @returns {Object} Room status information
 */
export const useRoomStatus = (room) => {
  const statusInfo = useMemo(() => {
    if (!room || !room.conditions) {
      return {
        overallStatus: "green",
        conditionStatuses: {},
        hasAlerts: false,
        alertCount: 0,
      };
    }

    const overallStatus = calculateRoomStatus(room);
    const conditionStatuses = {};
    let alertCount = 0;

    Object.entries(room.conditions).forEach(([key, condition]) => {
      const status = getConditionStatus(condition);
      conditionStatuses[key] = status;
      if (status.status !== "green") {
        alertCount++;
      }
    });

    return {
      overallStatus,
      conditionStatuses,
      hasAlerts: alertCount > 0,
      alertCount,
    };
  }, [room]);

  return statusInfo;
};

export default useRoomStatus;
