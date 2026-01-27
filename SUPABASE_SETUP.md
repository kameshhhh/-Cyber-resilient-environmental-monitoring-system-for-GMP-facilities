# Supabase Database Setup Guide

## 🚀 Quick Setup

### Step 1: Create Database Tables

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/ckwrklqafnauufcokmrd
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `supabase/schema.sql`
5. Click **Run** to execute the SQL

### Step 2: Enable Realtime (If Not Already Enabled)

1. Go to **Database** → **Replication**
2. Make sure the `rooms` and `alerts` tables have realtime enabled
3. Toggle the switch next to each table if needed

### Step 3: Verify Setup

1. Go to **Table Editor** in the left sidebar
2. You should see these tables:
   - `rooms` (with 4 pharmaceutical storage rooms)
   - `sensor_readings` (empty, will populate with sensor data)
   - `alerts` (empty, will populate with alerts)
   - `audit_trail` (empty, will populate with audit logs)
   - `medicines` (empty, optional medicine catalog)

## 📊 Database Tables

### `rooms`

Stores the pharmaceutical storage rooms and their current conditions:

- Room 1: Ultra-Critical (Cryo) - mRNA vaccines, gene therapies
- Room 2: High Sensitivity (Cold) - Biologics, monoclonal antibodies
- Room 3: Freeze-Sensitive (Adjuvanted) - Aluminum-adjuvanted vaccines
- Room 4: Moisture-Sensitive (Ambient) - Dry powder formulations

### `sensor_readings`

Historical sensor data for compliance reporting:

- Temperature readings
- Humidity readings
- Pressure differential readings
- Timestamps for audit trail

### `alerts`

System alerts with severity levels:

- `info` - Informational notifications
- `warning` - Conditions approaching limits
- `critical` - Immediate attention required
- `emergency` - Emergency response needed

### `audit_trail`

21 CFR Part 11 compliant audit logging:

- All system actions logged
- User identification
- Timestamps
- Previous and new values

## 🔧 Configuration

The Supabase client is configured in `src/config/supabase.js`:

```javascript
const supabaseUrl = "https://ckwrklqafnauufcokmrd.supabase.co";
const supabaseAnonKey = "your-anon-key";
```

## 🔄 Feature Toggle

To switch between cloud (Supabase) and local storage:

Edit `src/contexts/DashboardContext.jsx`:

```javascript
// Set to true for Supabase cloud database
// Set to false for local storage (offline mode)
const USE_SUPABASE = true;
```

## 🌐 Connection Status

The dashboard header shows connection status:

- **☁️ Cloud** - Connected to Supabase, data syncing
- **🔄 Syncing...** - Data being uploaded to cloud
- **💾 Local** - Using local storage (offline mode)

## 📝 API Functions

### Room Operations

- `fetchRoomsFromDB()` - Get all rooms
- `initializeRooms()` - Seed initial room data
- `updateRoomConditions(roomId, conditions)` - Update room conditions
- `batchUpdateRooms(rooms)` - Bulk update rooms

### Alert Operations

- `createAlert(alert)` - Create new alert
- `fetchActiveAlerts()` - Get unacknowledged alerts
- `acknowledgeAlert(alertId)` - Mark alert as acknowledged

### Sensor Readings

- `recordSensorReading(roomId, reading)` - Log sensor data

### Audit Trail

- `logAuditEntry(entry)` - Log system action

### Real-time Subscriptions

- `subscribeToRoomUpdates(callback)` - Live room updates
- `subscribeToAlerts(callback)` - Live alert notifications

## 🔒 Security

Row Level Security (RLS) is enabled on all tables. The current policies allow:

- Public read/write access with anon key (for demo purposes)

For production, you should:

1. Implement proper authentication
2. Update RLS policies to restrict access
3. Use service role key only on server-side

## 🐛 Troubleshooting

### "Table does not exist" error

Run the SQL schema in Supabase SQL Editor.

### "Permission denied" error

Check that RLS policies are correctly configured.

### Data not syncing

1. Check browser console for errors
2. Verify Supabase URL and anon key
3. Check network connectivity

### Offline fallback

If Supabase is unavailable, the app automatically falls back to local storage.
