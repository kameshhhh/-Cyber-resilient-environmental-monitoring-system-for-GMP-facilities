import { useState, useEffect, useCallback, useRef } from "react";
import {
  simulateSensorUpdates,
  fetchRooms,
  loadRoomsFromStorage,
  saveRoomsToStorage,
} from "../services/mockApi";
import {
  calculateRoomStatus,
  generateAlerts,
} from "../services/statusCalculator";
import { UPDATE_INTERVAL } from "../utils/constants";

/**
 * Custom hook to manage sensor data and simulations
 * @param {boolean} autoUpdate - Whether to auto-update sensor data
 * @returns {Object} Sensor data and control functions
 */
export const useSensorData = (autoUpdate = true) => {
  const [rooms, setRooms] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isSimulating, setIsSimulating] = useState(autoUpdate);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const intervalRef = useRef(null);

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);

        // Clear old room data to load fresh configuration
        // This ensures new room configurations are applied
        localStorage.removeItem("medicine-monitor-rooms");

        // Fetch fresh room data from constants
        const fetchedRooms = await fetchRooms();
        const roomsWithStatus = fetchedRooms.map((room) => ({
          ...room,
          status: calculateRoomStatus(room),
        }));
        setRooms(roomsWithStatus);
        setAlerts(generateAlerts(roomsWithStatus));
        saveRoomsToStorage(roomsWithStatus);

        setLastUpdate(new Date());
        setError(null);
      } catch (err) {
        setError("Failed to load room data");
        console.error("Error initializing data:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // Update rooms with new sensor data
  const updateSensorData = useCallback(() => {
    setRooms((prevRooms) => {
      const updatedRooms = simulateSensorUpdates(prevRooms);
      const roomsWithStatus = updatedRooms.map((room) => ({
        ...room,
        status: calculateRoomStatus(room),
      }));

      // Update alerts
      setAlerts(generateAlerts(roomsWithStatus));

      // Save to storage
      saveRoomsToStorage(roomsWithStatus);

      setLastUpdate(new Date());
      return roomsWithStatus;
    });
  }, []);

  // Auto-update simulation
  useEffect(() => {
    if (isSimulating && !loading) {
      intervalRef.current = setInterval(updateSensorData, UPDATE_INTERVAL);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isSimulating, loading, updateSensorData]);

  // Toggle simulation
  const toggleSimulation = useCallback(() => {
    setIsSimulating((prev) => !prev);
  }, []);

  // Force refresh
  const refresh = useCallback(() => {
    updateSensorData();
  }, [updateSensorData]);

  // Acknowledge alert
  const acknowledgeAlert = useCallback((alertId) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
  }, []);

  // Clear all acknowledged alerts
  const clearAcknowledgedAlerts = useCallback(() => {
    setAlerts((prev) => prev.filter((alert) => !alert.acknowledged));
  }, []);

  // Get room by ID
  const getRoomById = useCallback(
    (roomId) => {
      return rooms.find((room) => room.id === roomId);
    },
    [rooms]
  );

  // Select room
  const selectRoom = useCallback((roomId) => {
    setSelectedRoomId(roomId);
  }, []);

  return {
    rooms,
    alerts,
    loading,
    error,
    lastUpdate,
    isSimulating,
    selectedRoomId,
    toggleSimulation,
    refresh,
    acknowledgeAlert,
    clearAcknowledgedAlerts,
    getRoomById,
    selectRoom,
  };
};

export default useSensorData;
