import { useState, useEffect, useCallback, useRef } from "react";

/**
 * IndexedDB wrapper for offline storage
 */
class OfflineStorage {
  constructor(dbName = "medicineStorageDashboard", version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }

  async open() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Sensor readings store
        if (!db.objectStoreNames.contains("sensorReadings")) {
          const readingsStore = db.createObjectStore("sensorReadings", {
            keyPath: "id",
            autoIncrement: true,
          });
          readingsStore.createIndex("roomId", "roomId", { unique: false });
          readingsStore.createIndex("timestamp", "timestamp", {
            unique: false,
          });
          readingsStore.createIndex("synced", "synced", { unique: false });
        }

        // Alerts store
        if (!db.objectStoreNames.contains("alerts")) {
          const alertsStore = db.createObjectStore("alerts", {
            keyPath: "id",
          });
          alertsStore.createIndex("roomId", "roomId", { unique: false });
          alertsStore.createIndex("timestamp", "timestamp", { unique: false });
          alertsStore.createIndex("synced", "synced", { unique: false });
        }

        // Pending actions queue
        if (!db.objectStoreNames.contains("pendingActions")) {
          const actionsStore = db.createObjectStore("pendingActions", {
            keyPath: "id",
            autoIncrement: true,
          });
          actionsStore.createIndex("timestamp", "timestamp", { unique: false });
          actionsStore.createIndex("type", "type", { unique: false });
        }

        // App state cache
        if (!db.objectStoreNames.contains("appState")) {
          db.createObjectStore("appState", { keyPath: "key" });
        }

        // Configuration cache
        if (!db.objectStoreNames.contains("config")) {
          db.createObjectStore("config", { keyPath: "key" });
        }
      };
    });
  }

  async getStore(storeName, mode = "readonly") {
    const db = await this.open();
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  async add(storeName, data) {
    const store = await this.getStore(storeName, "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.add(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async put(storeName, data) {
    const store = await this.getStore(storeName, "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName, key) {
    const store = await this.getStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName) {
    const store = await this.getStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getByIndex(storeName, indexName, value) {
    const store = await this.getStore(storeName);
    const index = store.index(indexName);
    return new Promise((resolve, reject) => {
      const request = index.getAll(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, key) {
    const store = await this.getStore(storeName, "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName) {
    const store = await this.getStore(storeName, "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getUnsyncedData(storeName) {
    // IndexedDB doesn't support boolean keys, so we filter manually
    const allData = await this.getAll(storeName);
    return allData.filter((item) => item.synced === false || item.synced === 0);
  }

  async markAsSynced(storeName, ids) {
    const store = await this.getStore(storeName, "readwrite");
    const promises = ids.map((id) => {
      return new Promise((resolve, reject) => {
        const getRequest = store.get(id);
        getRequest.onsuccess = () => {
          const data = getRequest.result;
          if (data) {
            data.synced = true;
            const putRequest = store.put(data);
            putRequest.onsuccess = () => resolve();
            putRequest.onerror = () => reject(putRequest.error);
          } else {
            resolve();
          }
        };
        getRequest.onerror = () => reject(getRequest.error);
      });
    });
    return Promise.all(promises);
  }
}

/**
 * Sync manager for handling offline/online synchronization
 */
class SyncManager {
  constructor(storage, apiEndpoint = "/api") {
    this.storage = storage;
    this.apiEndpoint = apiEndpoint;
    this.syncInProgress = false;
    this.lastSyncTime = null;
  }

  async syncAll() {
    if (this.syncInProgress) return { status: "already-syncing" };

    this.syncInProgress = true;
    const results = { readings: 0, alerts: 0, actions: 0, errors: [] };

    try {
      // Sync sensor readings
      const unsyncedReadings = await this.storage.getUnsyncedData(
        "sensorReadings"
      );
      if (unsyncedReadings.length > 0) {
        try {
          // Simulate API call
          await this.mockApiCall("readings", unsyncedReadings);
          await this.storage.markAsSynced(
            "sensorReadings",
            unsyncedReadings.map((r) => r.id)
          );
          results.readings = unsyncedReadings.length;
        } catch (err) {
          results.errors.push({ type: "readings", error: err.message });
        }
      }

      // Sync alerts
      const unsyncedAlerts = await this.storage.getUnsyncedData("alerts");
      if (unsyncedAlerts.length > 0) {
        try {
          await this.mockApiCall("alerts", unsyncedAlerts);
          await this.storage.markAsSynced(
            "alerts",
            unsyncedAlerts.map((a) => a.id)
          );
          results.alerts = unsyncedAlerts.length;
        } catch (err) {
          results.errors.push({ type: "alerts", error: err.message });
        }
      }

      // Process pending actions
      const pendingActions = await this.storage.getAll("pendingActions");
      for (const action of pendingActions) {
        try {
          await this.processAction(action);
          await this.storage.delete("pendingActions", action.id);
          results.actions++;
        } catch (err) {
          results.errors.push({
            type: "action",
            id: action.id,
            error: err.message,
          });
        }
      }

      this.lastSyncTime = Date.now();
    } finally {
      this.syncInProgress = false;
    }

    return results;
  }

  async mockApiCall(endpoint, data) {
    // Simulate network request
    await new Promise((resolve) => setTimeout(resolve, 100));
    console.log(`[SyncManager] Syncing ${data.length} items to ${endpoint}`);
    return { success: true };
  }

  async processAction(action) {
    // Process different action types
    switch (action.type) {
      case "acknowledge_alert":
        await this.mockApiCall("alerts/acknowledge", action.data);
        break;
      case "update_threshold":
        await this.mockApiCall("thresholds", action.data);
        break;
      case "request_maintenance":
        await this.mockApiCall("maintenance", action.data);
        break;
      default:
        console.warn(`[SyncManager] Unknown action type: ${action.type}`);
    }
  }
}

/**
 * Custom hook for offline capabilities
 */
const useOfflineCapabilities = (options = {}) => {
  const {
    autoSync = true,
    syncInterval = 30000,
    onSyncComplete,
    onOnlineStatusChange,
  } = options;

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState("idle");
  const [lastSync, setLastSync] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState(null);

  const storageRef = useRef(null);
  const syncManagerRef = useRef(null);
  const syncIntervalRef = useRef(null);

  // Initialize storage and sync manager
  useEffect(() => {
    storageRef.current = new OfflineStorage();
    syncManagerRef.current = new SyncManager(storageRef.current);

    // Initialize storage
    storageRef.current.open().catch((err) => {
      console.error(
        "[useOfflineCapabilities] Failed to initialize storage:",
        err
      );
      setError(err);
    });

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      onOnlineStatusChange?.(true);
      // Trigger sync when coming online
      if (autoSync) {
        performSync();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      onOnlineStatusChange?.(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [autoSync, onOnlineStatusChange]);

  // Auto sync interval
  useEffect(() => {
    if (autoSync && isOnline) {
      syncIntervalRef.current = setInterval(() => {
        performSync();
      }, syncInterval);

      return () => {
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }
      };
    }
  }, [autoSync, isOnline, syncInterval]);

  // Update pending count
  const updatePendingCount = useCallback(async () => {
    if (!storageRef.current) return;

    try {
      const [readings, alerts, actions] = await Promise.all([
        storageRef.current.getUnsyncedData("sensorReadings"),
        storageRef.current.getUnsyncedData("alerts"),
        storageRef.current.getAll("pendingActions"),
      ]);
      setPendingCount(readings.length + alerts.length + actions.length);
    } catch (err) {
      console.error(
        "[useOfflineCapabilities] Failed to get pending count:",
        err
      );
    }
  }, []);

  // Perform sync
  const performSync = useCallback(async () => {
    if (!syncManagerRef.current || !isOnline) return;

    setSyncStatus("syncing");
    setError(null);

    try {
      const results = await syncManagerRef.current.syncAll();
      setLastSync(Date.now());
      setSyncStatus("success");
      await updatePendingCount();
      onSyncComplete?.(results);
      return results;
    } catch (err) {
      setSyncStatus("error");
      setError(err);
      throw err;
    }
  }, [isOnline, updatePendingCount, onSyncComplete]);

  // Queue sensor reading for sync
  const queueSensorReading = useCallback(
    async (reading) => {
      if (!storageRef.current) return;

      try {
        await storageRef.current.add("sensorReadings", {
          ...reading,
          timestamp: Date.now(),
          synced: false,
        });
        await updatePendingCount();
      } catch (err) {
        console.error("[useOfflineCapabilities] Failed to queue reading:", err);
        throw err;
      }
    },
    [updatePendingCount]
  );

  // Queue alert for sync
  const queueAlert = useCallback(
    async (alert) => {
      if (!storageRef.current) return;

      try {
        await storageRef.current.put("alerts", {
          ...alert,
          synced: false,
        });
        await updatePendingCount();
      } catch (err) {
        console.error("[useOfflineCapabilities] Failed to queue alert:", err);
        throw err;
      }
    },
    [updatePendingCount]
  );

  // Queue action for sync
  const queueAction = useCallback(
    async (type, data) => {
      if (!storageRef.current) return;

      try {
        await storageRef.current.add("pendingActions", {
          type,
          data,
          timestamp: Date.now(),
        });
        await updatePendingCount();
      } catch (err) {
        console.error("[useOfflineCapabilities] Failed to queue action:", err);
        throw err;
      }
    },
    [updatePendingCount]
  );

  // Get cached data
  const getCachedData = useCallback(async (storeName, key) => {
    if (!storageRef.current) return null;

    try {
      if (key) {
        return await storageRef.current.get(storeName, key);
      }
      return await storageRef.current.getAll(storeName);
    } catch (err) {
      console.error("[useOfflineCapabilities] Failed to get cached data:", err);
      return null;
    }
  }, []);

  // Cache app state
  const cacheAppState = useCallback(async (key, value) => {
    if (!storageRef.current) return;

    try {
      await storageRef.current.put("appState", {
        key,
        value,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error("[useOfflineCapabilities] Failed to cache app state:", err);
      throw err;
    }
  }, []);

  // Get cached app state
  const getCachedAppState = useCallback(async (key) => {
    if (!storageRef.current) return null;

    try {
      const result = await storageRef.current.get("appState", key);
      return result?.value;
    } catch (err) {
      console.error(
        "[useOfflineCapabilities] Failed to get cached app state:",
        err
      );
      return null;
    }
  }, []);

  // Clear all cached data
  const clearCache = useCallback(async () => {
    if (!storageRef.current) return;

    try {
      await Promise.all([
        storageRef.current.clear("sensorReadings"),
        storageRef.current.clear("alerts"),
        storageRef.current.clear("pendingActions"),
        storageRef.current.clear("appState"),
      ]);
      await updatePendingCount();
    } catch (err) {
      console.error("[useOfflineCapabilities] Failed to clear cache:", err);
      throw err;
    }
  }, [updatePendingCount]);

  return {
    // Status
    isOnline,
    syncStatus,
    lastSync,
    pendingCount,
    error,

    // Sync operations
    performSync,

    // Data operations
    queueSensorReading,
    queueAlert,
    queueAction,
    getCachedData,

    // App state
    cacheAppState,
    getCachedAppState,

    // Utilities
    clearCache,
    storage: storageRef.current,
  };
};

export default useOfflineCapabilities;
export { OfflineStorage, SyncManager };
