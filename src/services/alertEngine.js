/**
 * Alert Engine Service
 *
 * Rule-based alert evaluation with escalation,
 * anomaly detection, and cross-parameter correlation.
 */

import { conditionEngine } from "../engines/conditionEngine";

// Alert severity levels
const SEVERITY = {
  CRITICAL: "critical",
  WARNING: "warning",
  INFO: "info",
};

// Notification channels
const CHANNELS = {
  UI: "ui",
  EMAIL: "email",
  SMS: "sms",
  PUSH: "push",
  ALARM: "alarm",
};

/**
 * AlertEngine class for managing alerts
 */
class AlertEngine {
  constructor() {
    this.rules = this.initializeRules();
    this.activeAlerts = new Map();
    this.alertHistory = [];
    this.escalationTimers = new Map();
    this.subscribers = new Set();
    this.correlationWindow = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Initialize alert rules
   */
  initializeRules() {
    return [
      // Temperature excursion rules
      {
        id: "temp-emergency-high",
        name: "Temperature Emergency (High)",
        condition: (room) => {
          const temp = room.conditions?.temperature;
          const emergency = room.thresholds?.emergency?.temperature;
          if (!temp || !emergency) return false;
          const value = temp.value ?? temp.current;
          return value > emergency.max;
        },
        severity: SEVERITY.CRITICAL,
        message: (room) => {
          const temp = room.conditions.temperature;
          const value = temp.value ?? temp.current;
          return `EMERGENCY: Temperature at ${value}${temp.unit} exceeds emergency threshold`;
        },
        actions: [
          "notify-pharmacist",
          "start-backup-cooling",
          "log-compliance-violation",
          "activate-alarm",
        ],
        escalation: {
          after: 5 * 60 * 1000, // 5 minutes
          actions: ["notify-facility-manager", "escalate-to-qc"],
        },
        channels: [CHANNELS.UI, CHANNELS.SMS, CHANNELS.ALARM],
      },
      {
        id: "temp-emergency-low",
        name: "Temperature Emergency (Low)",
        condition: (room) => {
          const temp = room.conditions?.temperature;
          const emergency = room.thresholds?.emergency?.temperature;
          if (!temp || !emergency) return false;
          const value = temp.value ?? temp.current;
          return value < emergency.min;
        },
        severity: SEVERITY.CRITICAL,
        message: (room) => {
          const temp = room.conditions.temperature;
          const value = temp.value ?? temp.current;
          return `EMERGENCY: Temperature at ${value}${temp.unit} below emergency threshold`;
        },
        actions: [
          "notify-pharmacist",
          "check-heating",
          "log-compliance-violation",
        ],
        escalation: {
          after: 5 * 60 * 1000,
          actions: ["notify-facility-manager"],
        },
        channels: [CHANNELS.UI, CHANNELS.SMS, CHANNELS.ALARM],
      },
      {
        id: "temp-warning-high",
        name: "Temperature Warning (High)",
        condition: (room) => {
          const temp = room.conditions?.temperature;
          const primary = room.thresholds?.primary?.temperature || {
            min: temp?.min,
            max: temp?.max,
          };
          if (!temp) return false;
          const value = temp.value ?? temp.current;
          return (
            value > primary.max &&
            value <=
              (room.thresholds?.emergency?.temperature?.max ||
                primary.max * 1.2)
          );
        },
        severity: SEVERITY.WARNING,
        message: (room) => {
          const temp = room.conditions.temperature;
          const value = temp.value ?? temp.current;
          return `Temperature at ${value}${temp.unit} exceeds primary threshold`;
        },
        actions: ["notify-operator", "increase-cooling"],
        channels: [CHANNELS.UI, CHANNELS.PUSH],
      },
      {
        id: "temp-warning-low",
        name: "Temperature Warning (Low)",
        condition: (room) => {
          const temp = room.conditions?.temperature;
          const primary = room.thresholds?.primary?.temperature || {
            min: temp?.min,
            max: temp?.max,
          };
          if (!temp) return false;
          const value = temp.value ?? temp.current;
          return (
            value < primary.min &&
            value >=
              (room.thresholds?.emergency?.temperature?.min ||
                primary.min * 0.8)
          );
        },
        severity: SEVERITY.WARNING,
        message: (room) => {
          const temp = room.conditions.temperature;
          const value = temp.value ?? temp.current;
          return `Temperature at ${value}${temp.unit} below primary threshold`;
        },
        actions: ["notify-operator", "check-cooling-level"],
        channels: [CHANNELS.UI, CHANNELS.PUSH],
      },
      // Humidity rules
      {
        id: "humidity-emergency",
        name: "Humidity Emergency",
        condition: (room) => {
          const humidity = room.conditions?.humidity;
          const emergency = room.thresholds?.emergency?.humidity || {
            min: 15,
            max: 80,
          };
          if (!humidity) return false;
          const value = humidity.value ?? humidity.current;
          return value < emergency.min || value > emergency.max;
        },
        severity: SEVERITY.CRITICAL,
        message: (room) => {
          const humidity = room.conditions.humidity;
          const value = humidity.value ?? humidity.current;
          return `EMERGENCY: Humidity at ${value}${humidity.unit} outside emergency limits`;
        },
        actions: [
          "notify-pharmacist",
          "check-hvac",
          "log-compliance-violation",
        ],
        channels: [CHANNELS.UI, CHANNELS.SMS],
      },
      {
        id: "humidity-warning",
        name: "Humidity Warning",
        condition: (room) => {
          const humidity = room.conditions?.humidity;
          const primary = room.thresholds?.primary?.humidity || {
            min: humidity?.min,
            max: humidity?.max,
          };
          if (!humidity) return false;
          const value = humidity.value ?? humidity.current;
          return value < primary.min || value > primary.max;
        },
        severity: SEVERITY.WARNING,
        message: (room) => {
          const humidity = room.conditions.humidity;
          const value = humidity.value ?? humidity.current;
          return `Humidity at ${value}${humidity.unit} outside optimal range`;
        },
        actions: ["notify-operator", "adjust-dehumidifier"],
        channels: [CHANNELS.UI],
      },
      // Trend prediction rules
      {
        id: "trend-prediction-temp",
        name: "Temperature Trend Prediction",
        condition: (room) => {
          try {
            const probability = conditionEngine.predictExcursion(
              room,
              "temperature",
              30
            );
            return probability > 0.7;
          } catch (e) {
            return false;
          }
        },
        severity: SEVERITY.WARNING,
        message: (room) =>
          `Temperature trending toward threshold (>70% probability within 30min)`,
        actions: ["preemptive-adjustment", "send-maintenance-alert"],
        channels: [CHANNELS.UI, CHANNELS.PUSH],
      },
      // Sensor drift detection
      {
        id: "sensor-drift",
        name: "Sensor Calibration Drift",
        condition: (room) => {
          try {
            const tempDrift = conditionEngine.detectSensorDrift(
              room,
              "temperature"
            );
            const humidityDrift = conditionEngine.detectSensorDrift(
              room,
              "humidity"
            );
            return tempDrift > 0.05 || humidityDrift > 0.05;
          } catch (e) {
            return false;
          }
        },
        severity: SEVERITY.INFO,
        message: () =>
          `Possible sensor calibration drift detected. Schedule recalibration.`,
        actions: ["schedule-calibration", "increase-validation-frequency"],
        channels: [CHANNELS.UI],
      },
      // Stability alert
      {
        id: "stability-warning",
        name: "Environmental Instability",
        condition: (room) => {
          const score = conditionEngine.calculateWeightedScore(room);
          return score.breakdown?.stability > 0.6;
        },
        severity: SEVERITY.WARNING,
        message: () => `Environmental conditions showing high variability`,
        actions: ["check-door-seals", "inspect-insulation"],
        channels: [CHANNELS.UI],
      },
      // Equipment-related alerts
      {
        id: "equipment-maintenance",
        name: "Equipment Maintenance Due",
        condition: (room) => {
          if (!room.equipment) return false;
          const filterAge = room.equipment.filterAge || 0;
          const lastMaintenance = room.equipment.lastMaintenance;
          const daysSinceMaintenance = lastMaintenance
            ? (Date.now() - new Date(lastMaintenance).getTime()) /
              (24 * 60 * 60 * 1000)
            : 999;
          return filterAge > 90 || daysSinceMaintenance > 90;
        },
        severity: SEVERITY.INFO,
        message: (room) => {
          const filterAge = room.equipment?.filterAge || 0;
          return `Preventive maintenance recommended (Filter age: ${filterAge} days)`;
        },
        actions: ["schedule-maintenance"],
        channels: [CHANNELS.UI],
      },
    ];
  }

  /**
   * Evaluate all rules for a room
   */
  evaluateRoom(room) {
    const alerts = [];

    // Rule-based evaluation
    this.rules.forEach((rule) => {
      try {
        if (rule.condition(room)) {
          const alert = this.createAlert(rule, room);
          alerts.push(alert);
          this.handleNewAlert(alert, rule);
        } else {
          // Clear existing alert if condition no longer met
          this.clearAlert(room.id, rule.id);
        }
      } catch (error) {
        console.error(`Error evaluating rule ${rule.id}:`, error);
      }
    });

    // Cross-parameter correlation alerts
    const correlationAlerts = this.checkCorrelations(room);
    alerts.push(...correlationAlerts);

    // Anomaly detection (simplified ML-like detection)
    const anomalyAlerts = this.detectAnomalies(room);
    alerts.push(...anomalyAlerts);

    return this.prioritizeAlerts(alerts);
  }

  /**
   * Create an alert from a rule
   */
  createAlert(rule, room) {
    return {
      id: `${room.id}-${rule.id}-${Date.now()}`,
      ruleId: rule.id,
      roomId: room.id,
      roomName: room.name,
      severity: rule.severity,
      message:
        typeof rule.message === "function" ? rule.message(room) : rule.message,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      actions: rule.actions || [],
      channels: rule.channels || [CHANNELS.UI],
      escalation: rule.escalation,
      metadata: {
        conditions: {
          temperature:
            room.conditions?.temperature?.value ??
            room.conditions?.temperature?.current,
          humidity:
            room.conditions?.humidity?.value ??
            room.conditions?.humidity?.current,
          pressure:
            room.conditions?.pressure?.value ??
            room.conditions?.pressure?.current,
        },
      },
    };
  }

  /**
   * Handle a new alert
   */
  handleNewAlert(alert, rule) {
    const alertKey = `${alert.roomId}-${alert.ruleId}`;

    // Check if this alert already exists (avoid duplicates)
    if (this.activeAlerts.has(alertKey)) {
      // Update existing alert
      const existing = this.activeAlerts.get(alertKey);
      existing.lastSeen = new Date().toISOString();
      existing.occurrences = (existing.occurrences || 1) + 1;
      return;
    }

    // Store active alert
    this.activeAlerts.set(alertKey, {
      ...alert,
      occurrences: 1,
      firstSeen: alert.timestamp,
      lastSeen: alert.timestamp,
    });

    // Set up escalation timer if applicable
    if (rule.escalation) {
      const timer = setTimeout(() => {
        this.escalateAlert(alertKey, rule.escalation);
      }, rule.escalation.after);
      this.escalationTimers.set(alertKey, timer);
    }

    // Notify subscribers
    this.notifySubscribers("new", alert);

    // Add to history
    this.alertHistory.unshift({
      ...alert,
      type: "created",
    });

    // Keep history manageable
    if (this.alertHistory.length > 1000) {
      this.alertHistory = this.alertHistory.slice(0, 1000);
    }
  }

  /**
   * Clear an alert when condition is resolved
   */
  clearAlert(roomId, ruleId) {
    const alertKey = `${roomId}-${ruleId}`;

    if (this.activeAlerts.has(alertKey)) {
      const alert = this.activeAlerts.get(alertKey);

      // Cancel escalation timer
      if (this.escalationTimers.has(alertKey)) {
        clearTimeout(this.escalationTimers.get(alertKey));
        this.escalationTimers.delete(alertKey);
      }

      // Remove from active alerts
      this.activeAlerts.delete(alertKey);

      // Add to history
      this.alertHistory.unshift({
        ...alert,
        type: "resolved",
        resolvedAt: new Date().toISOString(),
      });

      // Notify subscribers
      this.notifySubscribers("resolved", alert);
    }
  }

  /**
   * Escalate an alert
   */
  escalateAlert(alertKey, escalation) {
    const alert = this.activeAlerts.get(alertKey);
    if (!alert || alert.acknowledged) return;

    alert.escalated = true;
    alert.escalatedAt = new Date().toISOString();
    alert.escalationActions = escalation.actions;

    // Notify subscribers of escalation
    this.notifySubscribers("escalated", alert);

    // Add to history
    this.alertHistory.unshift({
      ...alert,
      type: "escalated",
    });
  }

  /**
   * Check for cross-parameter correlations
   */
  checkCorrelations(room) {
    const alerts = [];
    const conditions = room.conditions;

    if (!conditions) return alerts;

    // Temperature-Humidity correlation (condensation risk)
    const temp =
      conditions.temperature?.value ?? conditions.temperature?.current;
    const humidity = conditions.humidity?.value ?? conditions.humidity?.current;
    const dewPoint = conditions.humidity?.dewPoint;

    if (dewPoint !== undefined && temp !== undefined) {
      if (temp - dewPoint < 2) {
        alerts.push({
          id: `${room.id}-condensation-${Date.now()}`,
          ruleId: "correlation-condensation",
          roomId: room.id,
          roomName: room.name,
          severity: SEVERITY.WARNING,
          message: `Condensation risk: Temperature (${temp}°C) approaching dew point (${dewPoint.toFixed(
            1
          )}°C)`,
          timestamp: new Date().toISOString(),
          acknowledged: false,
          actions: ["increase-dehumidification", "check-air-circulation"],
          channels: [CHANNELS.UI],
        });
      }
    }

    // Rapid multi-parameter change (possible door event or system failure)
    const tempHistory = conditions.temperature?.history || [];
    const humidityHistory = conditions.humidity?.history || [];

    if (tempHistory.length >= 3 && humidityHistory.length >= 3) {
      const tempChange = Math.abs(
        tempHistory[tempHistory.length - 1] -
          tempHistory[tempHistory.length - 3]
      );
      const humidityChange = Math.abs(
        humidityHistory[humidityHistory.length - 1] -
          humidityHistory[humidityHistory.length - 3]
      );

      if (tempChange > 2 && humidityChange > 5) {
        alerts.push({
          id: `${room.id}-rapid-change-${Date.now()}`,
          ruleId: "correlation-rapid-change",
          roomId: room.id,
          roomName: room.name,
          severity: SEVERITY.WARNING,
          message: `Rapid environmental change detected. Check for door events or system issues.`,
          timestamp: new Date().toISOString(),
          acknowledged: false,
          actions: ["check-doors", "verify-equipment"],
          channels: [CHANNELS.UI],
        });
      }
    }

    return alerts;
  }

  /**
   * Detect anomalies using statistical methods
   */
  detectAnomalies(room) {
    const alerts = [];
    const conditions = room.conditions;

    if (!conditions) return alerts;

    ["temperature", "humidity", "pressure"].forEach((param) => {
      const condition = conditions[param];
      if (!condition?.history || condition.history.length < 10) return;

      const history = condition.history;
      const mean = history.reduce((a, b) => a + b, 0) / history.length;
      const stdDev = Math.sqrt(
        history.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
          history.length
      );

      const currentValue = condition.value ?? condition.current;
      const zScore = Math.abs((currentValue - mean) / stdDev);

      // Alert if value is more than 3 standard deviations from mean
      if (zScore > 3) {
        alerts.push({
          id: `${room.id}-anomaly-${param}-${Date.now()}`,
          ruleId: `anomaly-${param}`,
          roomId: room.id,
          roomName: room.name,
          severity: SEVERITY.INFO,
          message: `Anomaly detected: ${param} value (${currentValue}) is ${zScore.toFixed(
            1
          )} standard deviations from normal`,
          timestamp: new Date().toISOString(),
          acknowledged: false,
          actions: ["verify-sensor", "investigate"],
          channels: [CHANNELS.UI],
        });
      }
    });

    return alerts;
  }

  /**
   * Prioritize alerts by severity and recency
   */
  prioritizeAlerts(alerts) {
    const severityOrder = {
      [SEVERITY.CRITICAL]: 0,
      [SEVERITY.WARNING]: 1,
      [SEVERITY.INFO]: 2,
    };

    return alerts.sort((a, b) => {
      // First by severity
      const severityDiff =
        severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;

      // Then by timestamp (most recent first)
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  }

  /**
   * Subscribe to alert notifications
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify all subscribers
   */
  notifySubscribers(eventType, alert) {
    this.subscribers.forEach((callback) => {
      try {
        callback({ type: eventType, alert });
      } catch (error) {
        console.error("Error in alert subscriber:", error);
      }
    });
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId, userId = "unknown") {
    for (const [key, alert] of this.activeAlerts) {
      if (alert.id === alertId) {
        alert.acknowledged = true;
        alert.acknowledgedBy = userId;
        alert.acknowledgedAt = new Date().toISOString();

        // Cancel escalation
        if (this.escalationTimers.has(key)) {
          clearTimeout(this.escalationTimers.get(key));
          this.escalationTimers.delete(key);
        }

        this.notifySubscribers("acknowledged", alert);
        return true;
      }
    }
    return false;
  }

  /**
   * Get all active alerts
   */
  getActiveAlerts() {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit = 100) {
    return this.alertHistory.slice(0, limit);
  }

  /**
   * Get alerts for a specific room
   */
  getAlertsForRoom(roomId) {
    return Array.from(this.activeAlerts.values()).filter(
      (alert) => alert.roomId === roomId
    );
  }

  /**
   * Clear all alerts (for testing/reset)
   */
  clearAllAlerts() {
    this.escalationTimers.forEach((timer) => clearTimeout(timer));
    this.escalationTimers.clear();
    this.activeAlerts.clear();
  }
}

// Singleton instance
const alertEngine = new AlertEngine();

export default alertEngine;
export { AlertEngine, SEVERITY, CHANNELS };
