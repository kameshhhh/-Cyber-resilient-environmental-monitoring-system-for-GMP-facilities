import { supabase, TABLES } from "../config/supabase";
import { INITIAL_ROOMS } from "../utils/constants";

/**
 * Supabase Database Service
 * Handles all database operations for Medicine Storage Monitoring
 */

// ============================================
// ROOM OPERATIONS
// ============================================

/**
 * Initialize rooms in database (run once to seed data)
 */
export const initializeRooms = async () => {
  try {
    // Check if rooms already exist
    const { data: existingRooms, error: checkError } = await supabase
      .from(TABLES.ROOMS)
      .select("id")
      .limit(1);

    if (checkError) {
      console.error("Error checking rooms:", checkError);
      // Table might not exist, try to create it
      return { success: false, error: checkError };
    }

    // If rooms exist, don't reinitialize
    if (existingRooms && existingRooms.length > 0) {
      console.log("Rooms already initialized in database");
      return { success: true, alreadyExists: true };
    }

    // Insert initial rooms
    const roomsToInsert = INITIAL_ROOMS.map((room) => ({
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
      status: room.status,
      is_online: room.isOnline,
      last_updated: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from(TABLES.ROOMS)
      .insert(roomsToInsert)
      .select();

    if (error) {
      console.error("Error initializing rooms:", error);
      return { success: false, error };
    }

    console.log("Rooms initialized successfully:", data);
    return { success: true, data };
  } catch (err) {
    console.error("Exception initializing rooms:", err);
    return { success: false, error: err };
  }
};

/**
 * Fetch all rooms from database
 */
export const fetchRoomsFromDB = async () => {
  try {
    const { data, error } = await supabase
      .from(TABLES.ROOMS)
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching rooms:", error);
      return { success: false, error, data: null };
    }

    // Transform snake_case to camelCase
    const transformedRooms = data.map(transformRoomFromDB);
    return { success: true, data: transformedRooms };
  } catch (err) {
    console.error("Exception fetching rooms:", err);
    return { success: false, error: err, data: null };
  }
};

/**
 * Fetch single room by ID
 */
export const fetchRoomById = async (roomId) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.ROOMS)
      .select("*")
      .eq("id", roomId)
      .single();

    if (error) {
      console.error("Error fetching room:", error);
      return { success: false, error, data: null };
    }

    return { success: true, data: transformRoomFromDB(data) };
  } catch (err) {
    console.error("Exception fetching room:", err);
    return { success: false, error: err, data: null };
  }
};

/**
 * Update room conditions (sensor readings)
 */
export const updateRoomConditions = async (roomId, conditions, status) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.ROOMS)
      .update({
        conditions,
        status,
        last_updated: new Date().toISOString(),
      })
      .eq("id", roomId)
      .select()
      .single();

    if (error) {
      console.error("Error updating room conditions:", error);
      return { success: false, error };
    }

    return { success: true, data: transformRoomFromDB(data) };
  } catch (err) {
    console.error("Exception updating room:", err);
    return { success: false, error: err };
  }
};

/**
 * Batch update all rooms
 */
export const batchUpdateRooms = async (rooms) => {
  try {
    const updates = rooms.map((room) => ({
      id: room.id,
      conditions: room.conditions,
      status: room.status,
      last_updated: new Date().toISOString(),
    }));

    // Supabase doesn't support batch upsert well, so we do individual updates
    const results = await Promise.all(
      updates.map((update) =>
        supabase
          .from(TABLES.ROOMS)
          .update({
            conditions: update.conditions,
            status: update.status,
            last_updated: update.last_updated,
          })
          .eq("id", update.id)
      )
    );

    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      console.error("Some room updates failed:", errors);
      return { success: false, errors };
    }

    return { success: true };
  } catch (err) {
    console.error("Exception batch updating rooms:", err);
    return { success: false, error: err };
  }
};

// ============================================
// SENSOR READINGS OPERATIONS
// ============================================

/**
 * Record sensor reading to history
 */
export const recordSensorReading = async (roomId, reading) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.SENSOR_READINGS)
      .insert({
        room_id: roomId,
        temperature: reading.temperature,
        humidity: reading.humidity,
        pressure_differential: reading.pressureDifferential,
        status: reading.status,
        recorded_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error recording sensor reading:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error("Exception recording sensor reading:", err);
    return { success: false, error: err };
  }
};

/**
 * Fetch sensor history for a room
 */
export const fetchSensorHistory = async (roomId, hours = 24) => {
  try {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from(TABLES.SENSOR_READINGS)
      .select("*")
      .eq("room_id", roomId)
      .gte("recorded_at", since)
      .order("recorded_at", { ascending: true });

    if (error) {
      console.error("Error fetching sensor history:", error);
      return { success: false, error, data: [] };
    }

    return { success: true, data };
  } catch (err) {
    console.error("Exception fetching sensor history:", err);
    return { success: false, error: err, data: [] };
  }
};

// ============================================
// ALERTS OPERATIONS
// ============================================

/**
 * Create an alert
 */
export const createAlert = async (alert) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.ALERTS)
      .insert({
        room_id: alert.roomId,
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        details: alert.details,
        parameter: alert.parameter,
        value: alert.value,
        threshold: alert.threshold,
        acknowledged: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating alert:", error);
      return { success: false, error };
    }

    return { success: true, data: transformAlertFromDB(data) };
  } catch (err) {
    console.error("Exception creating alert:", err);
    return { success: false, error: err };
  }
};

/**
 * Fetch active alerts
 */
export const fetchActiveAlerts = async () => {
  try {
    const { data, error } = await supabase
      .from(TABLES.ALERTS)
      .select("*")
      .eq("acknowledged", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching alerts:", error);
      return { success: false, error, data: [] };
    }

    return { success: true, data: data.map(transformAlertFromDB) };
  } catch (err) {
    console.error("Exception fetching alerts:", err);
    return { success: false, error: err, data: [] };
  }
};

/**
 * Acknowledge an alert
 */
export const acknowledgeAlert = async (alertId, userId = "system") => {
  try {
    const { data, error } = await supabase
      .from(TABLES.ALERTS)
      .update({
        acknowledged: true,
        acknowledged_by: userId,
        acknowledged_at: new Date().toISOString(),
      })
      .eq("id", alertId)
      .select()
      .single();

    if (error) {
      console.error("Error acknowledging alert:", error);
      return { success: false, error };
    }

    return { success: true, data: transformAlertFromDB(data) };
  } catch (err) {
    console.error("Exception acknowledging alert:", err);
    return { success: false, error: err };
  }
};

// ============================================
// AUDIT TRAIL OPERATIONS
// ============================================

/**
 * Log audit entry
 */
export const logAuditEntry = async (entry) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.AUDIT_TRAIL)
      .insert({
        action: entry.action,
        entity_type: entry.entityType,
        entity_id: entry.entityId,
        user_id: entry.userId || "system",
        user_name: entry.userName || "System",
        details: entry.details,
        previous_value: entry.previousValue,
        new_value: entry.newValue,
        ip_address: entry.ipAddress,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error logging audit entry:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error("Exception logging audit entry:", err);
    return { success: false, error: err };
  }
};

/**
 * Fetch audit trail
 */
export const fetchAuditTrail = async (limit = 100, entityType = null) => {
  try {
    let query = supabase
      .from(TABLES.AUDIT_TRAIL)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (entityType) {
      query = query.eq("entity_type", entityType);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching audit trail:", error);
      return { success: false, error, data: [] };
    }

    return { success: true, data };
  } catch (err) {
    console.error("Exception fetching audit trail:", err);
    return { success: false, error: err, data: [] };
  }
};

// ============================================
// REAL-TIME SUBSCRIPTIONS
// ============================================

/**
 * Subscribe to room updates
 */
export const subscribeToRoomUpdates = (callback) => {
  const subscription = supabase
    .channel("room-updates")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: TABLES.ROOMS,
      },
      (payload) => {
        console.log("Room update received:", payload);
        callback(payload);
      }
    )
    .subscribe();

  return subscription;
};

/**
 * Subscribe to new alerts
 */
export const subscribeToAlerts = (callback) => {
  const subscription = supabase
    .channel("alert-updates")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: TABLES.ALERTS,
      },
      (payload) => {
        console.log("New alert received:", payload);
        callback(transformAlertFromDB(payload.new));
      }
    )
    .subscribe();

  return subscription;
};

/**
 * Unsubscribe from channel
 */
export const unsubscribe = (subscription) => {
  if (subscription) {
    supabase.removeChannel(subscription);
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Transform room data from DB format to app format
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
 * Transform alert data from DB format to app format
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
  createdAt: dbAlert.created_at,
});

// ============================================
// DATABASE INITIALIZATION
// ============================================

/**
 * Check database connection
 */
export const checkConnection = async () => {
  try {
    const { data, error } = await supabase
      .from(TABLES.ROOMS)
      .select("id")
      .limit(1);

    if (error) {
      console.error("Database connection error:", error);
      return { connected: false, error };
    }

    return { connected: true, data };
  } catch (err) {
    console.error("Exception checking connection:", err);
    return { connected: false, error: err };
  }
};

export default {
  // Room operations
  initializeRooms,
  fetchRoomsFromDB,
  fetchRoomById,
  updateRoomConditions,
  batchUpdateRooms,

  // Sensor operations
  recordSensorReading,
  fetchSensorHistory,

  // Alert operations
  createAlert,
  fetchActiveAlerts,
  acknowledgeAlert,

  // Audit operations
  logAuditEntry,
  fetchAuditTrail,

  // Subscriptions
  subscribeToRoomUpdates,
  subscribeToAlerts,
  unsubscribe,

  // Utilities
  checkConnection,
};
