import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchRoomsFromDB,
  initializeRooms,
  batchUpdateRooms,
  recordSensorReading,
  createAlert,
  fetchActiveAlerts,
  acknowledgeAlert as acknowledgeAlertDB,
  subscribeToRoomUpdates,
  subscribeToAlerts,
  unsubscribe,
  checkConnection,
  logAuditEntry,
} from "../services/supabaseService";
import {
  simulateSensorUpdates,
  fetchRooms as fetchLocalRooms,
  saveRoomsToStorage,
  loadRoomsFromStorage,
  saveAlertsToStorage,
  loadAlertsFromStorage,
} from "../services/mockApi";
import {
  calculateRoomStatus,
  generateAlerts,
} from "../services/statusCalculator";
import { UPDATE_INTERVAL, INITIAL_ROOMS } from "../utils/constants";

// Sync status constants
const SYNC_STATUS = {
  IDLE: "idle",
  SYNCING: "syncing",
  SYNCED: "synced",
  ERROR: "error",
  OFFLINE: "offline",
};

/**
 * Custom hook for Supabase integration with fallback to local storage
 * Implements offline-first architecture with dual storage sync
 */
export const useSupabase = (autoUpdate = true) => {
  const [rooms, setRooms] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isSimulating, setIsSimulating] = useState(autoUpdate);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [syncStatus, setSyncStatus] = useState(SYNC_STATUS.IDLE);
  const [pendingChanges, setPendingChanges] = useState(0);
  const [lastSynced, setLastSynced] = useState(null);
  const [dataSource, setDataSource] = useState("initial");

  const intervalRef = useRef(null);
  const roomSubscriptionRef = useRef(null);
  const alertSubscriptionRef = useRef(null);

  // Trigger sync to Supabase
  const triggerSync = useCallback(async () => {
    if (!navigator.onLine) return;

    setSyncStatus(SYNC_STATUS.SYNCING);
    try {
      // Re-sync current rooms to Supabase
      if (rooms.length > 0) {
        await batchUpdateRooms(rooms);
      }
      setSyncStatus(SYNC_STATUS.SYNCED);
      setLastSynced(new Date().toISOString());
    } catch (err) {
      console.error("Sync error:", err);
      setSyncStatus(SYNC_STATUS.ERROR);
    }
  }, [rooms]);

  // Check database connection and initialize
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        setSyncStatus(SYNC_STATUS.SYNCING);

        // First, try to load from localStorage
        const localRooms = loadRoomsFromStorage();
        const localAlerts = loadAlertsFromStorage();

        if (localRooms && localRooms.length > 0) {
          const roomsWithStatus = localRooms.map((room) => ({
            ...room,
            status: calculateRoomStatus(room),
          }));
          setRooms(roomsWithStatus);
          setDataSource("local");
          console.log(
            "💾 Loaded rooms from localStorage:",
            roomsWithStatus.length
          );
        }

        if (localAlerts && localAlerts.length > 0) {
          setAlerts(localAlerts);
        }

        // Check Supabase connection
        const connectionResult = await checkConnection();

        if (connectionResult.connected) {
          setIsConnected(true);
          setSyncStatus(SYNC_STATUS.SYNCED);
          console.log("✅ Connected to Supabase");

          // Try to fetch from Supabase
          const { success, data: dbRooms } = await fetchRoomsFromDB();

          if (success && dbRooms && dbRooms.length > 0) {
            const roomsWithStatus = dbRooms.map((room) => ({
              ...room,
              status: calculateRoomStatus(room),
            }));
            setRooms(roomsWithStatus);
            setDataSource("supabase");

            // Save Supabase data to localStorage
            saveRoomsToStorage(roomsWithStatus);
            console.log("💾 Saved Supabase rooms to localStorage");
          } else if (!localRooms || localRooms.length === 0) {
            // No data anywhere, initialize with default rooms
            console.log("🔄 Initializing rooms in database...");
            await initializeRooms();

            // Use INITIAL_ROOMS
            const roomsWithStatus = INITIAL_ROOMS.map((room) => ({
              ...room,
              status: calculateRoomStatus(room),
            }));
            setRooms(roomsWithStatus);
            setDataSource("initial");

            // Save to localStorage
            saveRoomsToStorage(roomsWithStatus);
            console.log("💾 Saved initial rooms to localStorage");
          }

          // Fetch active alerts from Supabase
          const { data: dbAlerts } = await fetchActiveAlerts();
          if (dbAlerts && dbAlerts.length > 0) {
            setAlerts(dbAlerts);
            saveAlertsToStorage(dbAlerts);
          }

          setLastSynced(new Date().toISOString());
        } else {
          // Offline mode - use localStorage or initial data
          console.log("⚠️ Supabase not available, using local data");
          setIsConnected(false);
          setSyncStatus(SYNC_STATUS.OFFLINE);

          if (!localRooms || localRooms.length === 0) {
            // No local data, use initial rooms
            const roomsWithStatus = INITIAL_ROOMS.map((room) => ({
              ...room,
              status: calculateRoomStatus(room),
            }));
            setRooms(roomsWithStatus);
            setAlerts(generateAlerts(roomsWithStatus));
            setDataSource("initial");

            // Save to localStorage
            saveRoomsToStorage(roomsWithStatus);
            saveAlertsToStorage(generateAlerts(roomsWithStatus));
            console.log(
              "💾 Saved initial rooms to localStorage (offline mode)"
            );
          }
        }

        setLastUpdate(new Date());
        setError(null);
      } catch (err) {
        console.error("Error initializing data:", err);
        setError("Failed to load room data");
        setSyncStatus(SYNC_STATUS.ERROR);

        // Fallback to initial data
        const roomsWithStatus = INITIAL_ROOMS.map((room) => ({
          ...room,
          status: calculateRoomStatus(room),
        }));
        setRooms(roomsWithStatus);
        setAlerts(generateAlerts(roomsWithStatus));
        setDataSource("initial");

        // Save to localStorage
        saveRoomsToStorage(roomsWithStatus);
        saveAlertsToStorage(generateAlerts(roomsWithStatus));
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    if (isConnected) {
      // Subscribe to room updates
      roomSubscriptionRef.current = subscribeToRoomUpdates((payload) => {
        if (payload.eventType === "UPDATE") {
          setRooms((prevRooms) => {
            const updatedRooms = prevRooms.map((room) =>
              room.id === payload.new.id
                ? { ...room, ...transformRoomFromPayload(payload.new) }
                : room
            );
            // Save to localStorage
            saveRoomsToStorage(updatedRooms);
            return updatedRooms;
          });
        }
      });

      // Subscribe to new alerts
      alertSubscriptionRef.current = subscribeToAlerts((newAlert) => {
        setAlerts((prevAlerts) => {
          const updatedAlerts = [newAlert, ...prevAlerts];
          // Save to localStorage
          saveAlertsToStorage(updatedAlerts);
          return updatedAlerts;
        });
      });
    }

    return () => {
      if (roomSubscriptionRef.current) {
        unsubscribe(roomSubscriptionRef.current);
      }
      if (alertSubscriptionRef.current) {
        unsubscribe(alertSubscriptionRef.current);
      }
    };
  }, [isConnected]);

  // Network status listener for auto-sync
  useEffect(() => {
    const handleOnline = () => {
      console.log("🌐 Back online - triggering sync");
      setIsConnected(true);
      triggerSync();
    };

    const handleOffline = () => {
      console.log("📴 Gone offline");
      setIsConnected(false);
      setSyncStatus(SYNC_STATUS.OFFLINE);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [triggerSync]);

  // Transform payload to room format
  const transformRoomFromPayload = (payload) => ({
    id: payload.id,
    name: payload.name,
    shortName: payload.short_name,
    tier: payload.tier,
    conditions: payload.conditions,
    status: payload.status,
    lastUpdated: payload.last_updated,
  });

  // Update sensor data (simulation + sync to both storages)
  const updateSensorData = useCallback(() => {
    setRooms((prevRooms) => {
      const updatedRooms = simulateSensorUpdates(prevRooms);
      const roomsWithStatus = updatedRooms.map((room) => ({
        ...room,
        status: calculateRoomStatus(room),
      }));

      // Generate and set alerts
      const newAlerts = generateAlerts(roomsWithStatus);
      setAlerts(newAlerts);

      // ALWAYS save to localStorage first (offline-first)
      saveRoomsToStorage(roomsWithStatus);
      saveAlertsToStorage(newAlerts);
      console.log("💾 Saved to localStorage");

      // Sync to Supabase if connected (async, don't block UI)
      if (isConnected) {
        syncToSupabase(roomsWithStatus, newAlerts);
      }

      setLastUpdate(new Date());
      return roomsWithStatus;
    });
  }, [isConnected]);

  // Sync data to Supabase
  const syncToSupabase = async (roomsToSync, alertsToSync) => {
    try {
      setSyncStatus(SYNC_STATUS.SYNCING);

      // Batch update rooms
      await batchUpdateRooms(roomsToSync);

      // Record sensor readings for history
      for (const room of roomsToSync) {
        await recordSensorReading(room.id, {
          temperature: room.conditions?.temperature?.current,
          humidity: room.conditions?.humidity?.current,
          pressureDifferential: room.conditions?.pressureDifferential?.current,
          status: room.status,
        });
      }

      // Create new alerts in database
      const criticalAlerts = alertsToSync.filter(
        (a) => a.severity === "critical" && !a.acknowledged
      );
      for (const alert of criticalAlerts) {
        await createAlert(alert);
      }

      setSyncStatus(SYNC_STATUS.SYNCED);
      setLastSynced(new Date().toISOString());
    } catch (err) {
      console.error("Error syncing to Supabase:", err);
      setSyncStatus(SYNC_STATUS.ERROR);
    }
  };

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
  const refresh = useCallback(async () => {
    if (isConnected) {
      const { data: dbRooms } = await fetchRoomsFromDB();
      if (dbRooms) {
        const roomsWithStatus = dbRooms.map((room) => ({
          ...room,
          status: calculateRoomStatus(room),
        }));
        setRooms(roomsWithStatus);
      }
    }
    updateSensorData();
  }, [isConnected, updateSensorData]);

  // Acknowledge alert
  const handleAcknowledgeAlert = useCallback(
    async (alertId) => {
      if (isConnected) {
        await acknowledgeAlertDB(alertId);

        // Log audit entry
        await logAuditEntry({
          action: "ALERT_ACKNOWLEDGED",
          entityType: "alert",
          entityId: alertId,
          details: { alertId },
        });
      }

      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId ? { ...alert, acknowledged: true } : alert
        )
      );
    },
    [isConnected]
  );

  // Clear acknowledged alerts
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
    // Data
    rooms,
    alerts,
    loading,
    error,
    lastUpdate,
    isSimulating,
    selectedRoomId,

    // Connection status
    isConnected,
    syncStatus,
    pendingChanges,
    lastSynced,
    dataSource,

    // Actions
    toggleSimulation,
    refresh,
    acknowledgeAlert: handleAcknowledgeAlert,
    clearAcknowledgedAlerts,
    getRoomById,
    selectRoom,
    triggerSync,
  };
};

export default useSupabase;
