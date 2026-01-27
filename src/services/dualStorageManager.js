/**
 * Dual Storage Manager
 * Handles synchronization between LocalStorage and Supabase
 * Implements offline-first architecture with real-time sync
 */

import { supabase, TABLES } from "../config/supabase";
import { INITIAL_ROOMS } from "../utils/constants";

// ============================================
// STORAGE KEYS
// ============================================
const STORAGE_KEYS = {
  ROOMS: "pharma-monitor-rooms",
  ALERTS: "pharma-monitor-alerts",
  SENSOR_READINGS: "pharma-monitor-sensor-readings",
  SYNC_QUEUE: "pharma-monitor-sync-queue",
  SYNC_METADATA: "pharma-monitor-sync-metadata",
  AUDIT_TRAIL: "pharma-monitor-audit-trail",
};

// ============================================
// SYNC STATUS TYPES
// ============================================
export const SYNC_STATUS = {
  IDLE: "idle",
  SYNCING: "syncing",
  SYNCED: "synced",
  ERROR: "error",
  OFFLINE: "offline",
};

// ============================================
// LOCAL STORAGE OPERATIONS
// ============================================

/**
 * Save data to localStorage with timestamp
 */
export const saveToLocal = (key, data) => {
  try {
    const payload = {
      data,
      timestamp: new Date().toISOString(),
      version: 1,
    };
    localStorage.setItem(key, JSON.stringify(payload));
    console.log(`💾 Saved to localStorage: ${key}`);
    return { success: true };
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
    return { success: false, error };
  }
};

/**
 * Load data from localStorage
 */
export const loadFromLocal = (key) => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return { success: true, data: null, timestamp: null };

    const parsed = JSON.parse(stored);
    return {
      success: true,
      data: parsed.data,
      timestamp: parsed.timestamp,
      version: parsed.version,
    };
  } catch (error) {
    console.error(`Error loading from localStorage (${key}):`, error);
    return { success: false, data: null, error };
  }
};

/**
 * Remove data from localStorage
 */
export const removeFromLocal = (key) => {
  try {
    localStorage.removeItem(key);
    return { success: true };
  } catch (error) {
    console.error(`Error removing from localStorage (${key}):`, error);
    return { success: false, error };
  }
};

// ============================================
// ROOMS - DUAL STORAGE
// ============================================

/**
 * Save rooms to both localStorage and Supabase
 */
export const saveRooms = async (rooms, options = {}) => {
  const { skipSupabase = false, skipLocal = false } = options;
  const results = { local: null, supabase: null };

  // Always save to localStorage first (offline-first)
  if (!skipLocal) {
    results.local = saveToLocal(STORAGE_KEYS.ROOMS, rooms);
  }

  // Sync to Supabase if online and not skipped
  if (!skipSupabase && navigator.onLine) {
    try {
      const roomsForDB = rooms.map((room) => ({
        id: room.id,
        name: room.name,
        short_name: room.shortName,
        tier: room.tier,
        description: room.description,
        medicines: room.medicines,
        medicine_details: room.medicineDetails,
        conditions: room.conditions,
        stability_rationale: room.stabilityRationale,
        action_protocols: room.actionProtocols,
        equipment: room.equipment,
        compliance_requirements: room.complianceRequirements,
        status: room.status || "green",
        is_online: room.isOnline !== false,
        last_updated: new Date().toISOString(),
      }));

      const { error } = await supabase.from(TABLES.ROOMS).upsert(roomsForDB, {
        onConflict: "id",
      });

      if (error) throw error;
      results.supabase = { success: true };
      console.log("☁️ Synced rooms to Supabase");
    } catch (error) {
      console.error("Error syncing rooms to Supabase:", error);
      results.supabase = { success: false, error };
      // Queue for later sync
      await queueForSync("rooms", "upsert", rooms);
    }
  } else if (!navigator.onLine) {
    // Queue for sync when back online
    await queueForSync("rooms", "upsert", rooms);
    results.supabase = { success: false, offline: true };
  }

  return results;
};

/**
 * Load rooms with offline-first approach
 */
export const loadRooms = async (options = {}) => {
  const { forceRefresh = false, preferLocal = false } = options;

  // Try localStorage first
  const localResult = loadFromLocal(STORAGE_KEYS.ROOMS);
  const localRooms = localResult.data;
  const localTimestamp = localResult.timestamp;

  // If offline or preferLocal, return local data
  if (!navigator.onLine || preferLocal) {
    if (localRooms && localRooms.length > 0) {
      console.log("📦 Loaded rooms from localStorage (offline)");
      return {
        success: true,
        data: localRooms,
        source: "local",
        timestamp: localTimestamp,
      };
    }
    // Return initial rooms as fallback
    return {
      success: true,
      data: INITIAL_ROOMS,
      source: "initial",
      timestamp: null,
    };
  }

  // Try Supabase if online
  try {
    const { data: dbRooms, error } = await supabase
      .from(TABLES.ROOMS)
      .select("*")
      .order("name");

    if (error) throw error;

    if (dbRooms && dbRooms.length > 0) {
      // Transform from DB format
      const transformedRooms = dbRooms.map(transformRoomFromDB);

      // Update localStorage with fresh data
      saveToLocal(STORAGE_KEYS.ROOMS, transformedRooms);

      console.log("☁️ Loaded rooms from Supabase");
      return {
        success: true,
        data: transformedRooms,
        source: "supabase",
        timestamp: new Date().toISOString(),
      };
    }

    // No data in Supabase, use local or initial
    if (localRooms && localRooms.length > 0) {
      return {
        success: true,
        data: localRooms,
        source: "local",
        timestamp: localTimestamp,
      };
    }

    return {
      success: true,
      data: INITIAL_ROOMS,
      source: "initial",
      timestamp: null,
    };
  } catch (error) {
    console.error("Error loading from Supabase, falling back to local:", error);

    // Fallback to localStorage
    if (localRooms && localRooms.length > 0) {
      return {
        success: true,
        data: localRooms,
        source: "local",
        timestamp: localTimestamp,
        supabaseError: error,
      };
    }

    return {
      success: true,
      data: INITIAL_ROOMS,
      source: "initial",
      timestamp: null,
      supabaseError: error,
    };
  }
};

// ============================================
// ALERTS - DUAL STORAGE
// ============================================

/**
 * Save alerts to both localStorage and Supabase
 */
export const saveAlerts = async (alerts, options = {}) => {
  const {
    skipSupabase = false,
    skipLocal = false,
    onlyCritical = false,
  } = options;
  const results = { local: null, supabase: null };

  // Always save to localStorage
  if (!skipLocal) {
    results.local = saveToLocal(STORAGE_KEYS.ALERTS, alerts);
  }

  // Sync critical alerts to Supabase
  if (!skipSupabase && navigator.onLine) {
    try {
      const alertsToSync = onlyCritical
        ? alerts.filter((a) => a.severity === "critical" && !a.acknowledged)
        : alerts.filter((a) => !a.acknowledged);

      if (alertsToSync.length > 0) {
        const alertsForDB = alertsToSync.map((alert) => ({
          id: alert.id,
          room_id: alert.roomId,
          type: alert.type,
          severity: alert.severity,
          message: alert.message,
          details: alert.details,
          parameter: alert.parameter,
          value: alert.value,
          threshold: alert.threshold,
          acknowledged: alert.acknowledged || false,
          created_at: alert.timestamp || new Date().toISOString(),
        }));

        const { error } = await supabase
          .from(TABLES.ALERTS)
          .upsert(alertsForDB, {
            onConflict: "id",
          });

        if (error) throw error;
        results.supabase = { success: true, synced: alertsToSync.length };
      }
    } catch (error) {
      console.error("Error syncing alerts to Supabase:", error);
      results.supabase = { success: false, error };
      await queueForSync("alerts", "upsert", alerts);
    }
  }

  return results;
};

/**
 * Load alerts with offline-first approach
 */
export const loadAlerts = async () => {
  const localResult = loadFromLocal(STORAGE_KEYS.ALERTS);
  const localAlerts = localResult.data || [];

  if (!navigator.onLine) {
    return {
      success: true,
      data: localAlerts,
      source: "local",
    };
  }

  try {
    const { data: dbAlerts, error } = await supabase
      .from(TABLES.ALERTS)
      .select("*")
      .eq("acknowledged", false)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    if (dbAlerts && dbAlerts.length > 0) {
      const transformedAlerts = dbAlerts.map(transformAlertFromDB);
      // Merge with local alerts, prefer remote
      const mergedAlerts = mergeAlerts(localAlerts, transformedAlerts);
      saveToLocal(STORAGE_KEYS.ALERTS, mergedAlerts);

      return {
        success: true,
        data: mergedAlerts,
        source: "supabase",
      };
    }

    return {
      success: true,
      data: localAlerts,
      source: "local",
    };
  } catch (error) {
    return {
      success: true,
      data: localAlerts,
      source: "local",
      supabaseError: error,
    };
  }
};

// ============================================
// SENSOR READINGS - DUAL STORAGE
// ============================================

/**
 * Save sensor reading to localStorage and Supabase
 */
export const saveSensorReading = async (roomId, reading) => {
  const timestamp = new Date().toISOString();
  const readingWithMeta = {
    id: `${roomId}-${timestamp}`,
    roomId,
    ...reading,
    timestamp,
  };

  // Save to localStorage buffer
  const localResult = loadFromLocal(STORAGE_KEYS.SENSOR_READINGS);
  const readings = localResult.data || [];
  readings.push(readingWithMeta);

  // Keep only last 1000 readings per room to prevent localStorage overflow
  const filteredReadings = readings.slice(-4000);
  saveToLocal(STORAGE_KEYS.SENSOR_READINGS, filteredReadings);

  // Sync to Supabase if online
  if (navigator.onLine) {
    try {
      const { error } = await supabase.from(TABLES.SENSOR_READINGS).insert({
        room_id: roomId,
        temperature: reading.temperature,
        humidity: reading.humidity,
        pressure_differential: reading.pressureDifferential,
        status: reading.status,
        recorded_at: timestamp,
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error syncing sensor reading:", error);
      await queueForSync("sensor_readings", "insert", readingWithMeta);
    }
  } else {
    await queueForSync("sensor_readings", "insert", readingWithMeta);
  }
};

/**
 * Load sensor readings for a room
 */
export const loadSensorReadings = async (roomId, limit = 100) => {
  const localResult = loadFromLocal(STORAGE_KEYS.SENSOR_READINGS);
  const allReadings = localResult.data || [];
  const localReadings = allReadings
    .filter((r) => r.roomId === roomId)
    .slice(-limit);

  if (!navigator.onLine) {
    return { success: true, data: localReadings, source: "local" };
  }

  try {
    const { data: dbReadings, error } = await supabase
      .from(TABLES.SENSOR_READINGS)
      .select("*")
      .eq("room_id", roomId)
      .order("recorded_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    if (dbReadings && dbReadings.length > 0) {
      return {
        success: true,
        data: dbReadings.map(transformSensorReadingFromDB),
        source: "supabase",
      };
    }

    return { success: true, data: localReadings, source: "local" };
  } catch (error) {
    return { success: true, data: localReadings, source: "local" };
  }
};

// ============================================
// SYNC QUEUE MANAGEMENT
// ============================================

/**
 * Add item to sync queue for later processing
 */
export const queueForSync = async (table, action, data) => {
  const localResult = loadFromLocal(STORAGE_KEYS.SYNC_QUEUE);
  const queue = localResult.data || [];

  const queueItem = {
    id: `${table}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    table,
    action,
    data,
    createdAt: new Date().toISOString(),
    attempts: 0,
    lastAttempt: null,
  };

  queue.push(queueItem);
  saveToLocal(STORAGE_KEYS.SYNC_QUEUE, queue);

  console.log(`📋 Queued for sync: ${table} (${action})`);
  return queueItem;
};

/**
 * Get pending sync items
 */
export const getPendingSync = () => {
  const localResult = loadFromLocal(STORAGE_KEYS.SYNC_QUEUE);
  return localResult.data || [];
};

/**
 * Process sync queue
 */
export const processSyncQueue = async () => {
  if (!navigator.onLine) {
    return { success: false, reason: "offline", processed: 0 };
  }

  const queue = getPendingSync();
  if (queue.length === 0) {
    return { success: true, processed: 0 };
  }

  console.log(`🔄 Processing sync queue: ${queue.length} items`);

  let processed = 0;
  const errors = [];
  const remainingQueue = [];

  for (const item of queue) {
    try {
      await processSyncItem(item);
      processed++;
    } catch (error) {
      item.attempts++;
      item.lastAttempt = new Date().toISOString();
      item.lastError = error.message;

      // Keep in queue if less than 5 attempts
      if (item.attempts < 5) {
        remainingQueue.push(item);
      } else {
        errors.push({ item, error: error.message });
      }
    }
  }

  // Update queue with remaining items
  saveToLocal(STORAGE_KEYS.SYNC_QUEUE, remainingQueue);

  return {
    success: errors.length === 0,
    processed,
    remaining: remainingQueue.length,
    errors,
  };
};

/**
 * Process single sync item
 */
const processSyncItem = async (item) => {
  const { table, action, data } = item;

  switch (table) {
    case "rooms":
      if (action === "upsert") {
        const roomsForDB = (Array.isArray(data) ? data : [data]).map(
          (room) => ({
            id: room.id,
            name: room.name,
            short_name: room.shortName,
            tier: room.tier,
            conditions: room.conditions,
            status: room.status || "green",
            last_updated: new Date().toISOString(),
          })
        );
        const { error } = await supabase
          .from(TABLES.ROOMS)
          .upsert(roomsForDB, { onConflict: "id" });
        if (error) throw error;
      }
      break;

    case "sensor_readings":
      if (action === "insert") {
        const { error } = await supabase.from(TABLES.SENSOR_READINGS).insert({
          room_id: data.roomId,
          temperature: data.temperature,
          humidity: data.humidity,
          pressure_differential: data.pressureDifferential,
          status: data.status,
          recorded_at: data.timestamp,
        });
        if (error) throw error;
      }
      break;

    case "alerts":
      if (action === "upsert") {
        const alertsForDB = (Array.isArray(data) ? data : [data]).map(
          (alert) => ({
            id: alert.id,
            room_id: alert.roomId,
            type: alert.type,
            severity: alert.severity,
            message: alert.message,
            acknowledged: alert.acknowledged || false,
            created_at: alert.timestamp,
          })
        );
        const { error } = await supabase
          .from(TABLES.ALERTS)
          .upsert(alertsForDB, { onConflict: "id" });
        if (error) throw error;
      }
      break;

    default:
      console.warn(`Unknown table in sync queue: ${table}`);
  }
};

// ============================================
// SYNC METADATA
// ============================================

/**
 * Save sync metadata
 */
export const saveSyncMetadata = (metadata) => {
  const existing = loadFromLocal(STORAGE_KEYS.SYNC_METADATA).data || {};
  const updated = {
    ...existing,
    ...metadata,
    lastUpdated: new Date().toISOString(),
  };
  saveToLocal(STORAGE_KEYS.SYNC_METADATA, updated);
};

/**
 * Get sync metadata
 */
export const getSyncMetadata = () => {
  return loadFromLocal(STORAGE_KEYS.SYNC_METADATA).data || {};
};

// ============================================
// AUDIT TRAIL - LOCAL STORAGE
// ============================================

/**
 * Log audit entry locally and to Supabase
 */
export const logAuditEntry = async (entry) => {
  const timestamp = new Date().toISOString();
  const auditEntry = {
    id: `audit-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
    ...entry,
    timestamp,
  };

  // Save locally
  const localResult = loadFromLocal(STORAGE_KEYS.AUDIT_TRAIL);
  const auditTrail = localResult.data || [];
  auditTrail.push(auditEntry);

  // Keep only last 500 entries
  saveToLocal(STORAGE_KEYS.AUDIT_TRAIL, auditTrail.slice(-500));

  // Sync to Supabase if online
  if (navigator.onLine) {
    try {
      await supabase.from(TABLES.AUDIT_TRAIL).insert({
        action: entry.action,
        entity_type: entry.entityType,
        entity_id: entry.entityId,
        user_id: entry.userId,
        user_name: entry.userName,
        details: entry.details,
        previous_value: entry.previousValue,
        new_value: entry.newValue,
        created_at: timestamp,
      });
    } catch (error) {
      console.error("Error syncing audit entry:", error);
    }
  }

  return auditEntry;
};

// ============================================
// TRANSFORM FUNCTIONS
// ============================================

/**
 * Transform room from database format to app format
 */
const transformRoomFromDB = (dbRoom) => ({
  id: dbRoom.id,
  name: dbRoom.name,
  shortName: dbRoom.short_name,
  tier: dbRoom.tier,
  description: dbRoom.description,
  medicines: dbRoom.medicines,
  medicineDetails: dbRoom.medicine_details,
  conditions: dbRoom.conditions,
  stabilityRationale: dbRoom.stability_rationale,
  actionProtocols: dbRoom.action_protocols,
  equipment: dbRoom.equipment,
  complianceRequirements: dbRoom.compliance_requirements,
  status: dbRoom.status,
  isOnline: dbRoom.is_online,
  lastUpdated: dbRoom.last_updated,
});

/**
 * Transform alert from database format
 */
const transformAlertFromDB = (dbAlert) => ({
  id: dbAlert.id,
  roomId: dbAlert.room_id,
  type: dbAlert.type,
  severity: dbAlert.severity,
  message: dbAlert.message,
  details: dbAlert.details,
  parameter: dbAlert.parameter,
  value: dbAlert.value,
  threshold: dbAlert.threshold,
  acknowledged: dbAlert.acknowledged,
  acknowledgedBy: dbAlert.acknowledged_by,
  acknowledgedAt: dbAlert.acknowledged_at,
  timestamp: dbAlert.created_at,
});

/**
 * Transform sensor reading from database format
 */
const transformSensorReadingFromDB = (dbReading) => ({
  id: dbReading.id,
  roomId: dbReading.room_id,
  temperature: dbReading.temperature,
  humidity: dbReading.humidity,
  pressureDifferential: dbReading.pressure_differential,
  status: dbReading.status,
  timestamp: dbReading.recorded_at,
});

/**
 * Merge alerts, preferring remote over local by ID
 */
const mergeAlerts = (localAlerts, remoteAlerts) => {
  const remoteIds = new Set(remoteAlerts.map((a) => a.id));
  const uniqueLocal = localAlerts.filter((a) => !remoteIds.has(a.id));
  return [...remoteAlerts, ...uniqueLocal].slice(0, 200);
};

// ============================================
// NETWORK STATUS HELPERS
// ============================================

/**
 * Check if currently online
 */
export const isOnline = () => navigator.onLine;

/**
 * Check Supabase connection
 */
export const checkSupabaseConnection = async () => {
  if (!navigator.onLine) {
    return { connected: false, reason: "offline" };
  }

  try {
    const { error } = await supabase.from(TABLES.ROOMS).select("id").limit(1);
    if (error) throw error;
    return { connected: true };
  } catch (error) {
    return { connected: false, reason: error.message };
  }
};

// ============================================
// CLEAR ALL DATA
// ============================================

/**
 * Clear all local storage data
 */
export const clearAllLocalData = () => {
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
  console.log("🗑️ Cleared all local storage data");
};

export default {
  // Storage keys
  STORAGE_KEYS,
  SYNC_STATUS,

  // Room operations
  saveRooms,
  loadRooms,

  // Alert operations
  saveAlerts,
  loadAlerts,

  // Sensor readings
  saveSensorReading,
  loadSensorReadings,

  // Sync operations
  queueForSync,
  getPendingSync,
  processSyncQueue,

  // Metadata
  saveSyncMetadata,
  getSyncMetadata,

  // Audit
  logAuditEntry,

  // Helpers
  isOnline,
  checkSupabaseConnection,
  clearAllLocalData,
};
