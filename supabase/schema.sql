-- =====================================================
-- Medicine Storage Condition Monitoring Dashboard
-- Supabase Database Schema
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ROOMS TABLE
-- Stores storage room configurations and current state
-- =====================================================
CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    short_name TEXT,
    tier TEXT,
    description TEXT,
    medicines JSONB DEFAULT '[]'::jsonb,
    medicine_details JSONB DEFAULT '[]'::jsonb,
    conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
    stability_rationale JSONB,
    action_protocols JSONB,
    equipment JSONB,
    compliance_requirements JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'green' CHECK (status IN ('green', 'yellow', 'red', 'offline')),
    is_online BOOLEAN DEFAULT true,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_last_updated ON rooms(last_updated);

-- =====================================================
-- SENSOR_READINGS TABLE
-- Historical sensor data for analytics and compliance
-- =====================================================
CREATE TABLE IF NOT EXISTS sensor_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id TEXT REFERENCES rooms(id) ON DELETE CASCADE,
    temperature DECIMAL(6,2),
    humidity DECIMAL(5,2),
    pressure_differential DECIMAL(6,2),
    status TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for time-series queries
CREATE INDEX IF NOT EXISTS idx_sensor_readings_room_id ON sensor_readings(room_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_recorded_at ON sensor_readings(recorded_at);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_room_time ON sensor_readings(room_id, recorded_at DESC);

-- =====================================================
-- ALERTS TABLE
-- System alerts and notifications
-- =====================================================
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id TEXT REFERENCES rooms(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical', 'emergency')),
    message TEXT NOT NULL,
    details JSONB,
    parameter TEXT,
    value DECIMAL(10,2),
    threshold DECIMAL(10,2),
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_by TEXT,
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for alert queries
CREATE INDEX IF NOT EXISTS idx_alerts_room_id ON alerts(room_id);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);

-- =====================================================
-- AUDIT_TRAIL TABLE
-- Compliance audit logging (21 CFR Part 11)
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_trail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    user_id TEXT,
    user_name TEXT,
    details JSONB,
    previous_value JSONB,
    new_value JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_audit_trail_entity ON audit_trail(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_user ON audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_created_at ON audit_trail(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_trail_action ON audit_trail(action);

-- =====================================================
-- MEDICINES TABLE
-- Medicine catalog with storage requirements
-- =====================================================
CREATE TABLE IF NOT EXISTS medicines (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT,
    manufacturer TEXT,
    storage_temp TEXT,
    shelf_life TEXT,
    critical_note TEXT,
    batch_tracking BOOLEAN DEFAULT false,
    room_id TEXT REFERENCES rooms(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medicines_room_id ON medicines(room_id);
CREATE INDEX IF NOT EXISTS idx_medicines_type ON medicines(type);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS for secure access
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for anon key)
CREATE POLICY "Allow public read access on rooms" ON rooms
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert on rooms" ON rooms
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on rooms" ON rooms
    FOR UPDATE USING (true);

CREATE POLICY "Allow public read access on sensor_readings" ON sensor_readings
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert on sensor_readings" ON sensor_readings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access on alerts" ON alerts
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert on alerts" ON alerts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on alerts" ON alerts
    FOR UPDATE USING (true);

CREATE POLICY "Allow public read access on audit_trail" ON audit_trail
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert on audit_trail" ON audit_trail
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access on medicines" ON medicines
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert on medicines" ON medicines
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- REALTIME SUBSCRIPTIONS
-- Enable realtime for live updates
-- =====================================================

-- Enable realtime for rooms table
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;

-- Enable realtime for alerts table  
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update last_updated timestamp
CREATE OR REPLACE FUNCTION update_last_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for rooms table
DROP TRIGGER IF EXISTS rooms_updated_at ON rooms;
CREATE TRIGGER rooms_updated_at
    BEFORE UPDATE ON rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated();

-- Function to auto-create audit entry on room update
CREATE OR REPLACE FUNCTION audit_room_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_trail (
            action,
            entity_type,
            entity_id,
            details,
            previous_value,
            new_value
        ) VALUES (
            'ROOM_UPDATED',
            'room',
            NEW.id,
            jsonb_build_object(
                'status_changed', OLD.status != NEW.status,
                'conditions_changed', OLD.conditions != NEW.conditions
            ),
            jsonb_build_object('status', OLD.status, 'conditions', OLD.conditions),
            jsonb_build_object('status', NEW.status, 'conditions', NEW.conditions)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic audit logging (optional - can be disabled for performance)
-- DROP TRIGGER IF EXISTS audit_rooms_trigger ON rooms;
-- CREATE TRIGGER audit_rooms_trigger
--     AFTER UPDATE ON rooms
--     FOR EACH ROW
--     EXECUTE FUNCTION audit_room_changes();

-- =====================================================
-- VIEWS FOR ANALYTICS
-- =====================================================

-- View for room status summary
CREATE OR REPLACE VIEW room_status_summary AS
SELECT 
    status,
    COUNT(*) as room_count,
    ARRAY_AGG(name) as room_names
FROM rooms
GROUP BY status;

-- View for recent alerts
CREATE OR REPLACE VIEW recent_alerts AS
SELECT 
    a.*,
    r.name as room_name,
    r.tier as room_tier
FROM alerts a
LEFT JOIN rooms r ON a.room_id = r.id
WHERE a.created_at > NOW() - INTERVAL '24 hours'
ORDER BY a.created_at DESC;

-- View for sensor readings aggregation (last 24 hours)
CREATE OR REPLACE VIEW sensor_stats_24h AS
SELECT 
    room_id,
    AVG(temperature) as avg_temperature,
    MIN(temperature) as min_temperature,
    MAX(temperature) as max_temperature,
    AVG(humidity) as avg_humidity,
    MIN(humidity) as min_humidity,
    MAX(humidity) as max_humidity,
    AVG(pressure_differential) as avg_pressure_diff,
    COUNT(*) as reading_count
FROM sensor_readings
WHERE recorded_at > NOW() - INTERVAL '24 hours'
GROUP BY room_id;

-- =====================================================
-- INITIAL DATA SEED (Optional)
-- Run this after creating tables to seed initial rooms
-- =====================================================

-- Insert Room 1: Ultra-Critical (Cryo)
INSERT INTO rooms (id, name, short_name, tier, description, medicines, conditions, status, is_online)
VALUES (
    'room-1-cryo',
    'Room 1: Ultra-Critical (Cryo)',
    'Cryo Storage',
    'Ultra-Critical',
    'Ultra-low temperature storage for mRNA vaccines, gene therapies, and viral seed lots',
    '["Comirnaty (Pfizer)", "Kymriah (CAR-T)", "Zolgensma", "Viral Seed Lots"]'::jsonb,
    '{
        "temperature": {"min": -90, "max": -60, "current": -75, "unit": "°C"},
        "humidity": {"min": 0, "max": 40, "current": 25, "unit": "%"},
        "pressureDifferential": {"min": 15, "max": 30, "current": 22, "unit": "Pa"}
    }'::jsonb,
    'green',
    true
) ON CONFLICT (id) DO NOTHING;

-- Insert Room 2: High Sensitivity (Cold)
INSERT INTO rooms (id, name, short_name, tier, description, medicines, conditions, status, is_online)
VALUES (
    'room-2-cold',
    'Room 2: High Sensitivity (Cold)',
    'Cold Storage',
    'High Sensitivity',
    'Standard cold storage for biologics, monoclonal antibodies, and insulin products',
    '["Humira (mAbs)", "Lantus (Insulin)", "Covishield", "Avonex"]'::jsonb,
    '{
        "temperature": {"min": 2, "max": 8, "current": 5, "unit": "°C"},
        "humidity": {"min": 45, "max": 55, "current": 50, "unit": "%"},
        "pressureDifferential": {"min": 10, "max": 20, "current": 15, "unit": "Pa"}
    }'::jsonb,
    'green',
    true
) ON CONFLICT (id) DO NOTHING;

-- Insert Room 3: Freeze-Sensitive (Adjuvanted)
INSERT INTO rooms (id, name, short_name, tier, description, medicines, conditions, status, is_online)
VALUES (
    'room-3-adjuvanted',
    'Room 3: Freeze-Sensitive (Adjuvanted)',
    'Adjuvanted Storage',
    'Freeze-Sensitive',
    'Storage for aluminum-adjuvanted vaccines and freeze-sensitive biologics',
    '["Infanrix (DTaP)", "Engerix-B", "Albumin", "IVIG"]'::jsonb,
    '{
        "temperature": {"min": 3, "max": 8, "current": 5.5, "unit": "°C"},
        "humidity": {"min": 45, "max": 55, "current": 50, "unit": "%"},
        "pressureDifferential": {"min": 10, "max": 20, "current": 15, "unit": "Pa"}
    }'::jsonb,
    'green',
    true
) ON CONFLICT (id) DO NOTHING;

-- Insert Room 4: Moisture-Sensitive (Ambient)
INSERT INTO rooms (id, name, short_name, tier, description, medicines, conditions, status, is_online)
VALUES (
    'room-4-ambient',
    'Room 4: Moisture-Sensitive (Ambient)',
    'Ambient Storage',
    'Moisture-Sensitive',
    'Controlled ambient storage for hygroscopic pharmaceuticals and dry powder formulations',
    '["Stamaril (Yellow Fever)", "Augmentin (Dry Syrup)", "Advair (DPI)"]'::jsonb,
    '{
        "temperature": {"min": 15, "max": 25, "current": 20, "unit": "°C"},
        "humidity": {"min": 0, "max": 30, "current": 22, "unit": "%"},
        "pressureDifferential": {"min": 5, "max": 15, "current": 10, "unit": "Pa"}
    }'::jsonb,
    'green',
    true
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant permissions on tables
GRANT ALL ON rooms TO anon;
GRANT ALL ON sensor_readings TO anon;
GRANT ALL ON alerts TO anon;
GRANT ALL ON audit_trail TO anon;
GRANT ALL ON medicines TO anon;

GRANT ALL ON rooms TO authenticated;
GRANT ALL ON sensor_readings TO authenticated;
GRANT ALL ON alerts TO authenticated;
GRANT ALL ON audit_trail TO authenticated;
GRANT ALL ON medicines TO authenticated;

-- Grant permissions on views
GRANT SELECT ON room_status_summary TO anon;
GRANT SELECT ON recent_alerts TO anon;
GRANT SELECT ON sensor_stats_24h TO anon;

GRANT SELECT ON room_status_summary TO authenticated;
GRANT SELECT ON recent_alerts TO authenticated;
GRANT SELECT ON sensor_stats_24h TO authenticated;
