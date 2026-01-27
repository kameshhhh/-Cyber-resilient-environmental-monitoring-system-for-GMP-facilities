/**
 * Predictive Maintenance Module
 *
 * Equipment failure prediction using operational metrics analysis.
 */

/**
 * Equipment health thresholds
 */
const HEALTH_THRESHOLDS = {
  compressor: {
    cyclesPerDay: { warning: 50, critical: 80 },
    efficiency: { warning: 0.75, critical: 0.5 },
    ageYears: { warning: 8, critical: 12 },
  },
  filter: {
    ageDays: { warning: 60, critical: 90 },
    pressureDrop: { warning: 150, critical: 250 }, // Pa
  },
  sensor: {
    ageYears: { warning: 1.5, critical: 2.5 },
    drift: { warning: 0.03, critical: 0.08 },
  },
  bearings: {
    vibration: { warning: 2.5, critical: 7.0 }, // mm/s
    temperature: { warning: 60, critical: 80 }, // °C
  },
};

/**
 * Maintenance cost estimates (USD)
 */
const MAINTENANCE_COSTS = {
  filterReplacement: 150,
  sensorCalibration: 200,
  sensorReplacement: 500,
  compressorService: 800,
  compressorReplacement: 3500,
  bearingReplacement: 1200,
  refrigerantRecharge: 350,
  generalService: 250,
};

/**
 * PredictiveMaintenance class
 */
class PredictiveMaintenance {
  constructor() {
    this.maintenanceHistory = new Map();
    this.predictions = new Map();
  }

  /**
   * Predict equipment failure for a room
   */
  predictEquipmentFailure(room) {
    const equipment = room.equipment || this.getDefaultEquipment();

    // Analyze each component
    const compressorHealth = this.analyzeCompressorHealth(room, equipment);
    const filterHealth = this.analyzeFilterHealth(equipment);
    const sensorHealth = this.analyzeSensorHealth(room, equipment);
    const bearingHealth = this.analyzeBearingHealth(equipment);

    // Calculate overall equipment health
    const overallHealth = this.calculateOverallHealth([
      { component: "compressor", health: compressorHealth, weight: 0.35 },
      { component: "filter", health: filterHealth, weight: 0.25 },
      { component: "sensor", health: sensorHealth, weight: 0.25 },
      { component: "bearings", health: bearingHealth, weight: 0.15 },
    ]);

    // Generate prediction
    const prediction = {
      roomId: room.id,
      timestamp: new Date().toISOString(),
      overallHealth,
      components: {
        compressor: compressorHealth,
        filter: filterHealth,
        sensor: sensorHealth,
        bearings: bearingHealth,
      },
      nextService: this.calculateNextServiceDate([
        compressorHealth,
        filterHealth,
        sensorHealth,
        bearingHealth,
      ]),
      recommendations: this.generateMaintenanceRecommendations({
        compressor: compressorHealth,
        filter: filterHealth,
        sensor: sensorHealth,
        bearings: bearingHealth,
      }),
      estimatedCosts: this.estimateMaintenanceCosts({
        compressor: compressorHealth,
        filter: filterHealth,
        sensor: sensorHealth,
        bearings: bearingHealth,
      }),
      riskAssessment: this.assessMaintenanceRisk(overallHealth),
    };

    // Store prediction
    this.predictions.set(room.id, prediction);

    return prediction;
  }

  /**
   * Get default equipment metrics
   */
  getDefaultEquipment() {
    return {
      compressorCycles: 25000,
      lastMaintenance: new Date(
        Date.now() - 45 * 24 * 60 * 60 * 1000
      ).toISOString(),
      filterAge: 45,
      sensorAge: 1.0,
      runTime: 8760, // hours per year
      vibrationData: 1.5,
      acousticData: 45, // dB
    };
  }

  /**
   * Analyze compressor health
   */
  analyzeCompressorHealth(room, equipment) {
    const cycles = equipment.compressorCycles || 25000;
    const conditions = room.conditions || {};

    // Estimate cycles per day based on temperature differential
    const temp =
      conditions.temperature?.value ?? conditions.temperature?.current ?? 5;
    const targetTemp =
      (conditions.temperature?.min + conditions.temperature?.max) / 2 || 5;
    const tempDiff = Math.abs(temp - targetTemp);

    const estimatedCyclesPerDay = 20 + tempDiff * 5;

    // Calculate efficiency based on cooling performance
    const efficiency = this.calculateCoolingEfficiency(room);

    // Estimate remaining life
    const expectedLifeCycles = 100000;
    const remainingCycles = expectedLifeCycles - cycles;
    const remainingDays = remainingCycles / estimatedCyclesPerDay;

    // Determine health score
    let healthScore = 1.0;

    if (efficiency < HEALTH_THRESHOLDS.compressor.efficiency.critical) {
      healthScore *= 0.4;
    } else if (efficiency < HEALTH_THRESHOLDS.compressor.efficiency.warning) {
      healthScore *= 0.7;
    }

    if (
      estimatedCyclesPerDay > HEALTH_THRESHOLDS.compressor.cyclesPerDay.critical
    ) {
      healthScore *= 0.5;
    } else if (
      estimatedCyclesPerDay > HEALTH_THRESHOLDS.compressor.cyclesPerDay.warning
    ) {
      healthScore *= 0.8;
    }

    return {
      status: this.healthToStatus(healthScore),
      healthScore: Math.round(healthScore * 100) / 100,
      metrics: {
        totalCycles: cycles,
        cyclesPerDay: Math.round(estimatedCyclesPerDay),
        efficiency: Math.round(efficiency * 100) / 100,
        remainingLife: Math.max(0, Math.round(remainingDays)),
      },
      issues: this.identifyCompressorIssues(efficiency, estimatedCyclesPerDay),
      maintenanceRequired: healthScore < 0.7,
    };
  }

  /**
   * Calculate cooling efficiency
   */
  calculateCoolingEfficiency(room) {
    const conditions = room.conditions || {};
    const temp =
      conditions.temperature?.value ?? conditions.temperature?.current;
    const target = conditions.temperature
      ? (conditions.temperature.min + conditions.temperature.max) / 2
      : null;

    if (temp === undefined || target === null) return 0.9;

    const deviation = Math.abs(temp - target);
    const range = (conditions.temperature.max - conditions.temperature.min) / 2;

    return Math.max(0.3, 1 - (deviation / range) * 0.5);
  }

  /**
   * Identify compressor issues
   */
  identifyCompressorIssues(efficiency, cyclesPerDay) {
    const issues = [];

    if (efficiency < HEALTH_THRESHOLDS.compressor.efficiency.critical) {
      issues.push({
        type: "critical",
        message: "Compressor efficiency critically low",
      });
    } else if (efficiency < HEALTH_THRESHOLDS.compressor.efficiency.warning) {
      issues.push({
        type: "warning",
        message: "Compressor efficiency below optimal",
      });
    }

    if (cyclesPerDay > HEALTH_THRESHOLDS.compressor.cyclesPerDay.critical) {
      issues.push({
        type: "critical",
        message: "Excessive compressor cycling detected",
      });
    } else if (
      cyclesPerDay > HEALTH_THRESHOLDS.compressor.cyclesPerDay.warning
    ) {
      issues.push({
        type: "warning",
        message: "Compressor cycling above normal",
      });
    }

    return issues;
  }

  /**
   * Analyze filter health
   */
  analyzeFilterHealth(equipment) {
    const filterAge = equipment.filterAge || 45;

    let healthScore = 1.0;

    if (filterAge > HEALTH_THRESHOLDS.filter.ageDays.critical) {
      healthScore = 0.3;
    } else if (filterAge > HEALTH_THRESHOLDS.filter.ageDays.warning) {
      healthScore = 0.6;
    } else {
      healthScore =
        1 - (filterAge / HEALTH_THRESHOLDS.filter.ageDays.critical) * 0.3;
    }

    const remainingLife = Math.max(
      0,
      HEALTH_THRESHOLDS.filter.ageDays.critical - filterAge
    );

    return {
      status: this.healthToStatus(healthScore),
      healthScore: Math.round(healthScore * 100) / 100,
      metrics: {
        ageDays: filterAge,
        remainingLife,
        replacementDue: filterAge > HEALTH_THRESHOLDS.filter.ageDays.warning,
      },
      issues:
        filterAge > HEALTH_THRESHOLDS.filter.ageDays.warning
          ? [{ type: "warning", message: "Filter replacement recommended" }]
          : [],
      maintenanceRequired:
        filterAge > HEALTH_THRESHOLDS.filter.ageDays.critical,
    };
  }

  /**
   * Analyze sensor health
   */
  analyzeSensorHealth(room, equipment) {
    const sensorAge = equipment.sensorAge || 1.0;
    const conditions = room.conditions || {};

    // Estimate drift based on history variance
    let estimatedDrift = 0;
    ["temperature", "humidity", "pressure"].forEach((param) => {
      const history = conditions[param]?.history || [];
      if (history.length > 10) {
        const mean = history.reduce((a, b) => a + b, 0) / history.length;
        const recentMean = history.slice(-5).reduce((a, b) => a + b, 0) / 5;
        const drift = Math.abs(recentMean - mean) / mean;
        estimatedDrift = Math.max(estimatedDrift, drift);
      }
    });

    let healthScore = 1.0;

    if (sensorAge > HEALTH_THRESHOLDS.sensor.ageYears.critical) {
      healthScore *= 0.4;
    } else if (sensorAge > HEALTH_THRESHOLDS.sensor.ageYears.warning) {
      healthScore *= 0.7;
    }

    if (estimatedDrift > HEALTH_THRESHOLDS.sensor.drift.critical) {
      healthScore *= 0.5;
    } else if (estimatedDrift > HEALTH_THRESHOLDS.sensor.drift.warning) {
      healthScore *= 0.75;
    }

    const issues = [];
    if (sensorAge > HEALTH_THRESHOLDS.sensor.ageYears.warning) {
      issues.push({
        type: "warning",
        message: "Sensor calibration verification recommended",
      });
    }
    if (estimatedDrift > HEALTH_THRESHOLDS.sensor.drift.warning) {
      issues.push({
        type: "warning",
        message: "Possible sensor drift detected",
      });
    }

    return {
      status: this.healthToStatus(healthScore),
      healthScore: Math.round(healthScore * 100) / 100,
      metrics: {
        ageYears: Math.round(sensorAge * 10) / 10,
        estimatedDrift: Math.round(estimatedDrift * 1000) / 10, // percentage
        calibrationDue: sensorAge > 1,
      },
      issues,
      maintenanceRequired: healthScore < 0.6,
    };
  }

  /**
   * Analyze bearing health (simulated)
   */
  analyzeBearingHealth(equipment) {
    const vibration = equipment.vibrationData || 1.5;

    let healthScore = 1.0;

    if (vibration > HEALTH_THRESHOLDS.bearings.vibration.critical) {
      healthScore = 0.3;
    } else if (vibration > HEALTH_THRESHOLDS.bearings.vibration.warning) {
      healthScore = 0.6;
    } else {
      healthScore =
        1 - (vibration / HEALTH_THRESHOLDS.bearings.vibration.critical) * 0.3;
    }

    const issues = [];
    if (vibration > HEALTH_THRESHOLDS.bearings.vibration.warning) {
      issues.push({
        type: "warning",
        message: "Elevated vibration levels detected",
      });
    }

    return {
      status: this.healthToStatus(healthScore),
      healthScore: Math.round(healthScore * 100) / 100,
      metrics: {
        vibration: Math.round(vibration * 10) / 10,
        temperature: 45 + Math.random() * 10,
      },
      issues,
      maintenanceRequired: healthScore < 0.5,
    };
  }

  /**
   * Calculate overall equipment health
   */
  calculateOverallHealth(components) {
    let weightedSum = 0;
    let totalWeight = 0;

    components.forEach(({ health, weight }) => {
      weightedSum += health.healthScore * weight;
      totalWeight += weight;
    });

    const overallScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

    return {
      score: Math.round(overallScore * 100) / 100,
      status: this.healthToStatus(overallScore),
      componentCount: components.length,
      criticalComponents: components.filter((c) => c.health.healthScore < 0.5)
        .length,
    };
  }

  /**
   * Convert health score to status
   */
  healthToStatus(score) {
    if (score >= 0.8) return "good";
    if (score >= 0.5) return "fair";
    return "poor";
  }

  /**
   * Calculate next service date
   */
  calculateNextServiceDate(componentHealths) {
    const daysUntilService = [];

    componentHealths.forEach((health) => {
      if (health.metrics.remainingLife !== undefined) {
        daysUntilService.push(health.metrics.remainingLife);
      }
      if (health.maintenanceRequired) {
        daysUntilService.push(7); // Urgent if maintenance required
      }
    });

    const minDays =
      daysUntilService.length > 0 ? Math.min(...daysUntilService) : 30;

    return {
      date: new Date(Date.now() + minDays * 24 * 60 * 60 * 1000).toISOString(),
      daysUntil: Math.max(0, minDays),
      urgency: minDays < 7 ? "urgent" : minDays < 14 ? "soon" : "scheduled",
    };
  }

  /**
   * Generate maintenance recommendations
   */
  generateMaintenanceRecommendations(components) {
    const recommendations = [];

    // Compressor recommendations
    if (components.compressor.maintenanceRequired) {
      recommendations.push({
        priority: "high",
        component: "compressor",
        action: "Schedule compressor service",
        reason: "Compressor health below acceptable threshold",
        estimatedDuration: "4 hours",
      });
    }
    if (components.compressor.metrics.efficiency < 0.75) {
      recommendations.push({
        priority: "medium",
        component: "compressor",
        action: "Check refrigerant levels",
        reason: "Reduced cooling efficiency detected",
        estimatedDuration: "1 hour",
      });
    }

    // Filter recommendations
    if (components.filter.metrics.replacementDue) {
      recommendations.push({
        priority: components.filter.healthScore < 0.5 ? "high" : "medium",
        component: "filter",
        action: "Replace air filter",
        reason: `Filter age: ${components.filter.metrics.ageDays} days`,
        estimatedDuration: "30 minutes",
      });
    }

    // Sensor recommendations
    if (components.sensor.metrics.calibrationDue) {
      recommendations.push({
        priority: "medium",
        component: "sensors",
        action: "Calibrate sensors",
        reason: `Sensor age: ${components.sensor.metrics.ageYears} years`,
        estimatedDuration: "2 hours",
      });
    }
    if (components.sensor.metrics.estimatedDrift > 3) {
      recommendations.push({
        priority: "high",
        component: "sensors",
        action: "Verify sensor accuracy",
        reason: "Possible calibration drift detected",
        estimatedDuration: "1 hour",
      });
    }

    // Bearing recommendations
    if (components.bearings.maintenanceRequired) {
      recommendations.push({
        priority: "high",
        component: "bearings",
        action: "Inspect motor bearings",
        reason: "Elevated vibration levels",
        estimatedDuration: "3 hours",
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Estimate maintenance costs
   */
  estimateMaintenanceCosts(components) {
    let totalEstimate = 0;
    const breakdown = [];

    // Base service cost
    breakdown.push({
      item: "General Service",
      cost: MAINTENANCE_COSTS.generalService,
    });
    totalEstimate += MAINTENANCE_COSTS.generalService;

    // Component-specific costs
    if (components.filter.metrics.replacementDue) {
      breakdown.push({
        item: "Filter Replacement",
        cost: MAINTENANCE_COSTS.filterReplacement,
      });
      totalEstimate += MAINTENANCE_COSTS.filterReplacement;
    }

    if (components.sensor.metrics.calibrationDue) {
      breakdown.push({
        item: "Sensor Calibration",
        cost: MAINTENANCE_COSTS.sensorCalibration,
      });
      totalEstimate += MAINTENANCE_COSTS.sensorCalibration;
    }

    if (components.compressor.healthScore < 0.5) {
      breakdown.push({
        item: "Compressor Service",
        cost: MAINTENANCE_COSTS.compressorService,
      });
      totalEstimate += MAINTENANCE_COSTS.compressorService;
    }

    if (components.compressor.metrics.efficiency < 0.6) {
      breakdown.push({
        item: "Refrigerant Recharge",
        cost: MAINTENANCE_COSTS.refrigerantRecharge,
      });
      totalEstimate += MAINTENANCE_COSTS.refrigerantRecharge;
    }

    if (components.bearings.healthScore < 0.5) {
      breakdown.push({
        item: "Bearing Inspection/Replacement",
        cost: MAINTENANCE_COSTS.bearingReplacement,
      });
      totalEstimate += MAINTENANCE_COSTS.bearingReplacement;
    }

    return {
      total: totalEstimate,
      breakdown,
      currency: "USD",
      confidence: "estimate",
    };
  }

  /**
   * Assess maintenance risk
   */
  assessMaintenanceRisk(overallHealth) {
    const score = overallHealth.score;

    if (score < 0.4) {
      return {
        level: "high",
        description:
          "High risk of equipment failure. Immediate attention required.",
        impactPotential: "Possible temperature excursion and product loss",
        recommendedAction: "Schedule emergency maintenance within 48 hours",
      };
    }

    if (score < 0.6) {
      return {
        level: "medium",
        description: "Moderate risk. Equipment showing signs of wear.",
        impactPotential: "Potential for reduced efficiency and reliability",
        recommendedAction: "Schedule preventive maintenance within 1 week",
      };
    }

    if (score < 0.8) {
      return {
        level: "low",
        description:
          "Low risk. Equipment functioning within acceptable parameters.",
        impactPotential: "Minor efficiency loss possible",
        recommendedAction: "Continue monitoring. Schedule routine maintenance.",
      };
    }

    return {
      level: "minimal",
      description: "Equipment in good condition.",
      impactPotential: "None expected",
      recommendedAction: "Maintain regular monitoring schedule",
    };
  }

  /**
   * Get prediction for a room
   */
  getPrediction(roomId) {
    return this.predictions.get(roomId);
  }

  /**
   * Get all predictions
   */
  getAllPredictions() {
    return Array.from(this.predictions.values());
  }

  /**
   * Schedule maintenance
   */
  scheduleMaintenance(roomId, maintenanceType, scheduledDate) {
    const history = this.maintenanceHistory.get(roomId) || [];
    history.push({
      id: `MAINT-${Date.now()}`,
      roomId,
      type: maintenanceType,
      scheduledDate,
      status: "scheduled",
      createdAt: new Date().toISOString(),
    });
    this.maintenanceHistory.set(roomId, history);

    return history[history.length - 1];
  }

  /**
   * Get maintenance history
   */
  getMaintenanceHistory(roomId) {
    return this.maintenanceHistory.get(roomId) || [];
  }
}

// Singleton instance
const predictiveMaintenance = new PredictiveMaintenance();

export default predictiveMaintenance;
export { PredictiveMaintenance, HEALTH_THRESHOLDS, MAINTENANCE_COSTS };
