/**
 * Advanced Condition Engine
 *
 * Implements multi-factor analysis for pharmaceutical storage monitoring
 * with FDA CFR 211.46 compliance weighting and degradation prediction.
 */

// FDA CFR 211.46 compliance weights
const COMPLIANCE_WEIGHTS = {
  temperature: 0.35,
  humidity: 0.3,
  pressure: 0.15,
  stability: 0.1,
  trend: 0.07,
  duration: 0.03,
};

// Q10 degradation constants by medicine type
const DEGRADATION_CONSTANTS = {
  vaccine: { Q10: 2.5, baseRate: 0.01 },
  biologic: { Q10: 2.0, baseRate: 0.015 },
  pharmaceutical: { Q10: 1.8, baseRate: 0.008 },
  controlled: { Q10: 2.2, baseRate: 0.012 },
};

/**
 * ConditionEngine class for advanced status calculations
 */
class ConditionEngine {
  constructor() {
    this.thresholdMargin = 0.1; // 10% margin
  }

  /**
   * Calculate weighted score for a room
   * @param {Object} room - Room state object
   * @returns {Object} Score breakdown and predictions
   */
  calculateWeightedScore(room) {
    const factors = {
      temperature: this.calculateTemperatureRisk(room),
      humidity: this.calculateHumidityRisk(room),
      pressure: this.calculatePressureRisk(room),
      stability: this.calculateStabilityScore(room),
      trend: this.calculateTrendRisk(room),
      duration: this.calculateExposureDuration(room),
    };

    const score = this.normalizeScore(factors, COMPLIANCE_WEIGHTS);

    // Calculate degradation prediction
    const degradation = this.predictDegradation(
      room.medicines || [],
      room.conditions,
      room.category || "pharmaceutical"
    );

    return {
      score,
      breakdown: factors,
      predictedFailTime: degradation.timeToThreshold,
      overallStatus: this.scoreToStatus(score),
      recommendations: this.generateRecommendations(factors, room),
    };
  }

  /**
   * Calculate temperature risk factor (0-1, where 0 is best)
   */
  calculateTemperatureRisk(room) {
    const { conditions, thresholds } = room;
    if (!conditions?.temperature) return 0;

    const temp = conditions.temperature;
    const primary = thresholds?.primary?.temperature || {
      min: temp.min,
      max: temp.max,
    };
    const value = temp.value ?? temp.current;

    const range = primary.max - primary.min;
    const center = (primary.max + primary.min) / 2;
    const deviation = Math.abs(value - center);
    const normalizedDeviation = deviation / (range / 2);

    // Add trend factor
    let trendFactor = 0;
    if (temp.trend === "rising" && value > center) {
      trendFactor = 0.1;
    } else if (temp.trend === "falling" && value < center) {
      trendFactor = 0.1;
    }

    // Check if outside limits
    if (value < primary.min || value > primary.max) {
      return Math.min(1, normalizedDeviation + 0.3 + trendFactor);
    }

    return Math.min(1, normalizedDeviation * 0.7 + trendFactor);
  }

  /**
   * Calculate humidity risk factor
   */
  calculateHumidityRisk(room) {
    const { conditions, thresholds } = room;
    if (!conditions?.humidity) return 0;

    const humidity = conditions.humidity;
    const primary = thresholds?.primary?.humidity || {
      min: humidity.min,
      max: humidity.max,
    };
    const value = humidity.value ?? humidity.current;

    const range = primary.max - primary.min;
    const center = (primary.max + primary.min) / 2;
    const deviation = Math.abs(value - center);
    const normalizedDeviation = deviation / (range / 2);

    // Consider dew point risk
    let dewPointRisk = 0;
    if (humidity.dewPoint !== undefined) {
      const temp =
        conditions.temperature?.value ?? conditions.temperature?.current ?? 20;
      if (humidity.dewPoint > temp - 2) {
        dewPointRisk = 0.2; // Condensation risk
      }
    }

    if (value < primary.min || value > primary.max) {
      return Math.min(1, normalizedDeviation + 0.3 + dewPointRisk);
    }

    return Math.min(1, normalizedDeviation * 0.6 + dewPointRisk);
  }

  /**
   * Calculate pressure risk factor
   */
  calculatePressureRisk(room) {
    const { conditions, thresholds } = room;
    if (!conditions?.pressure) return 0;

    const pressure = conditions.pressure;
    const primary = thresholds?.primary?.pressure || {
      min: pressure.min,
      max: pressure.max,
    };
    const value = pressure.value ?? pressure.current;

    const range = primary.max - primary.min;
    const center = (primary.max + primary.min) / 2;
    const deviation = Math.abs(value - center);
    const normalizedDeviation = deviation / (range / 2);

    if (value < primary.min || value > primary.max) {
      return Math.min(1, normalizedDeviation + 0.2);
    }

    return Math.min(1, normalizedDeviation * 0.5);
  }

  /**
   * Calculate stability score based on variance in history
   */
  calculateStabilityScore(room) {
    const { conditions } = room;
    let totalVariance = 0;
    let count = 0;

    ["temperature", "humidity", "pressure"].forEach((param) => {
      if (conditions?.[param]?.history?.length > 0) {
        const history = conditions[param].history;
        const mean = history.reduce((a, b) => a + b, 0) / history.length;
        const variance =
          history.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
          history.length;
        const normalizedVariance = variance / Math.pow(mean, 2); // Coefficient of variation squared
        totalVariance += normalizedVariance;
        count++;
      }
    });

    if (count === 0) return 0;

    // Higher variance = higher risk
    return Math.min(1, (totalVariance / count) * 10);
  }

  /**
   * Calculate trend-based risk
   */
  calculateTrendRisk(room) {
    const { conditions, thresholds } = room;
    let riskScore = 0;

    ["temperature", "humidity", "pressure"].forEach((param) => {
      const condition = conditions?.[param];
      if (!condition) return;

      const value = condition.value ?? condition.current;
      const primary = thresholds?.primary?.[param] || {
        min: condition.min,
        max: condition.max,
      };
      const trend = condition.trend;

      // Rising trend near upper limit
      if (
        trend === "rising" &&
        value > primary.max - (primary.max - primary.min) * 0.2
      ) {
        riskScore += 0.3;
      }
      // Falling trend near lower limit
      if (
        trend === "falling" &&
        value < primary.min + (primary.max - primary.min) * 0.2
      ) {
        riskScore += 0.3;
      }
    });

    return Math.min(1, riskScore);
  }

  /**
   * Calculate exposure duration risk
   */
  calculateExposureDuration(room) {
    const { compliance } = room;
    if (!compliance?.violations?.length) return 0;

    const recentViolations = compliance.violations.filter((v) => {
      const violationTime = new Date(v.timestamp).getTime();
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      return violationTime > oneDayAgo;
    });

    const totalDuration = recentViolations.reduce(
      (sum, v) => sum + (v.duration || 0),
      0
    );

    // Risk increases with exposure time (max at 60 minutes)
    return Math.min(1, totalDuration / 60);
  }

  /**
   * Normalize score using weights
   */
  normalizeScore(factors, weights) {
    let weightedSum = 0;
    let totalWeight = 0;

    Object.keys(weights).forEach((key) => {
      if (factors[key] !== undefined) {
        weightedSum += factors[key] * weights[key];
        totalWeight += weights[key];
      }
    });

    // Return inverted score (higher is better)
    return totalWeight > 0 ? 1 - weightedSum / totalWeight : 1;
  }

  /**
   * Convert score to status
   */
  scoreToStatus(score) {
    if (score >= 0.8) return "optimal";
    if (score >= 0.6) return "warning";
    return "critical";
  }

  /**
   * Predict degradation using Arrhenius equation and Q10 rule
   */
  predictDegradation(medicines, conditions, category) {
    const constants =
      DEGRADATION_CONSTANTS[category] || DEGRADATION_CONSTANTS.pharmaceutical;
    const { Q10, baseRate } = constants;

    const temp =
      conditions?.temperature?.value ?? conditions?.temperature?.current ?? 25;
    const referenceTemp = 25; // Reference temperature in Celsius

    // Q10 rule: rate doubles every 10°C
    const tempDiff = temp - referenceTemp;
    const degradationMultiplier = Math.pow(Q10, tempDiff / 10);
    const adjustedRate = baseRate * degradationMultiplier;

    // Calculate time to threshold (10% degradation)
    const threshold = 0.1;
    const timeToThreshold = threshold / adjustedRate; // in hours

    // Find most sensitive medicine
    const affectedMedicines = medicines
      .filter((m) => m.sensitivity)
      .map((m) => ({
        name: m.name,
        id: m.id,
        adjustedRate: adjustedRate * m.sensitivity.temp,
      }))
      .sort((a, b) => b.adjustedRate - a.adjustedRate);

    return {
      timeToThreshold: Math.round(timeToThreshold * 10) / 10,
      degradationRate: adjustedRate,
      affectedMedicines: affectedMedicines.slice(0, 3).map((m) => m.name),
      recommendation: this.getDegradationRecommendation(
        timeToThreshold,
        temp,
        category
      ),
    };
  }

  /**
   * Get recommendation based on degradation prediction
   */
  getDegradationRecommendation(timeToThreshold, temp, category) {
    if (timeToThreshold < 1) {
      return "URGENT: Immediate action required. Move sensitive medicines to backup storage.";
    }
    if (timeToThreshold < 8) {
      return "WARNING: Schedule maintenance within 4 hours to prevent degradation.";
    }
    if (timeToThreshold < 24) {
      return "CAUTION: Monitor closely and plan preventive maintenance.";
    }
    return "Normal operation. Continue standard monitoring.";
  }

  /**
   * Generate recommendations based on factors
   */
  generateRecommendations(factors, room) {
    const recommendations = [];

    if (factors.temperature > 0.6) {
      recommendations.push({
        priority: "high",
        category: "temperature",
        message: "Temperature deviation detected. Check cooling system.",
        action: "inspect_cooling",
      });
    }

    if (factors.humidity > 0.6) {
      recommendations.push({
        priority: "high",
        category: "humidity",
        message:
          "Humidity outside optimal range. Check dehumidifier/humidifier.",
        action: "inspect_humidity_control",
      });
    }

    if (factors.stability > 0.5) {
      recommendations.push({
        priority: "medium",
        category: "stability",
        message:
          "Environmental instability detected. Check for door seals and insulation.",
        action: "inspect_insulation",
      });
    }

    if (factors.trend > 0.5) {
      recommendations.push({
        priority: "medium",
        category: "trend",
        message: "Adverse trend detected. Monitor closely for next 30 minutes.",
        action: "increase_monitoring",
      });
    }

    if (room.equipment?.filterAge > 60) {
      recommendations.push({
        priority: "low",
        category: "maintenance",
        message: "Air filter approaching replacement schedule.",
        action: "schedule_filter_replacement",
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Predict excursion probability within timeframe
   */
  predictExcursion(room, parameter, timeframeMinutes) {
    const condition = room.conditions?.[parameter];
    if (!condition || !condition.history || condition.history.length < 3) {
      return 0;
    }

    const history = condition.history.slice(-10);
    const value = condition.value ?? condition.current;
    const primary = room.thresholds?.primary?.[parameter] || {
      min: condition.min,
      max: condition.max,
    };

    // Calculate velocity (rate of change)
    const recentHistory = history.slice(-5);
    const velocity =
      (recentHistory[recentHistory.length - 1] - recentHistory[0]) /
      recentHistory.length;

    // Project future value
    const projectedValue = value + velocity * (timeframeMinutes / 5); // Assuming 5-min intervals

    // Calculate probability based on projected position relative to limits
    const distanceToLimit = Math.min(
      Math.abs(projectedValue - primary.max),
      Math.abs(projectedValue - primary.min)
    );
    const range = primary.max - primary.min;

    if (projectedValue > primary.max || projectedValue < primary.min) {
      return Math.min(
        1,
        0.8 +
          Math.abs(
            projectedValue -
              (projectedValue > primary.max ? primary.max : primary.min)
          ) /
            range
      );
    }

    return Math.max(0, 1 - distanceToLimit / (range / 2));
  }

  /**
   * Detect sensor drift
   */
  detectSensorDrift(room, parameter) {
    const condition = room.conditions?.[parameter];
    if (!condition || !condition.history || condition.history.length < 20) {
      return 0;
    }

    const history = condition.history;
    const firstHalf = history.slice(0, Math.floor(history.length / 2));
    const secondHalf = history.slice(Math.floor(history.length / 2));

    const firstMean = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondMean =
      secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const drift = Math.abs(secondMean - firstMean) / firstMean;
    return drift;
  }
}

// Singleton instance
const conditionEngine = new ConditionEngine();

// Export functions for compatibility with existing code
export const calculateWeightedScore = (room) =>
  conditionEngine.calculateWeightedScore(room);
export const predictExcursion = (room, param, time) =>
  conditionEngine.predictExcursion(room, param, time);
export const detectSensorDrift = (room, param) =>
  conditionEngine.detectSensorDrift(room, param);
export const predictDegradation = (medicines, conditions, category) =>
  conditionEngine.predictDegradation(medicines, conditions, category);

export default ConditionEngine;
export { conditionEngine, COMPLIANCE_WEIGHTS, DEGRADATION_CONSTANTS };
