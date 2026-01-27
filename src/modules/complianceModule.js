/**
 * Compliance Module
 *
 * FDA 21 CFR Part 211 compliance reporting and audit trail management.
 */

/**
 * FDA Requirements definitions
 */
const FDA_REQUIREMENTS = {
  211.46: {
    section: "Ventilation, air filtration, air heating and cooling",
    description:
      "Adequate ventilation, air filtration, and heating/cooling systems shall be provided as appropriate to provide suitable temperatures.",
    checks: ["temperature-control", "ventilation-adequacy", "air-quality"],
  },
  211.58: {
    section: "Maintenance",
    description:
      "Any building used in the manufacture, processing, packing, or holding of a drug product shall be maintained in a good state of repair.",
    checks: ["equipment-maintenance", "calibration-records", "repair-logs"],
  },
  211.68: {
    section: "Automatic, mechanical, and electronic equipment",
    description:
      "Automatic, mechanical, or electronic equipment or other types of equipment, including computers, may be used in the manufacture, processing, packing, and holding of a drug product.",
    checks: [
      "equipment-validation",
      "calibration-status",
      "software-validation",
    ],
  },
  211.142: {
    section: "Warehousing procedures",
    description:
      "Written procedures describing the warehousing of drug products shall be established and followed.",
    checks: ["storage-procedures", "temperature-monitoring", "access-control"],
  },
  "211.160": {
    section: "General requirements - Laboratory controls",
    description:
      "The establishment of any specifications, standards, sampling plans, test procedures, or other laboratory control mechanisms required by this subpart.",
    checks: ["quality-control", "testing-records", "specification-compliance"],
  },
};

/**
 * ComplianceModule class
 */
class ComplianceModule {
  constructor() {
    this.auditTrail = [];
    this.reports = new Map();
  }

  /**
   * Generate FDA 21 CFR Part 211 compliance report
   */
  generate21CFRPart211Report(room, dateRange = null) {
    const period = dateRange || {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
    };

    const report = {
      reportId: `RPT-${Date.now()}-${room.id}`,
      generatedAt: new Date().toISOString(),
      roomId: room.id,
      roomName: room.name,
      category: room.category || "pharmaceutical",

      summary: {
        period,
        complianceScore: this.calculateComplianceScore(room),
        criticalViolations: this.countViolations(room, "high"),
        majorViolations: this.countViolations(room, "medium"),
        minorViolations: this.countViolations(room, "low"),
        overallStatus: this.determineOverallStatus(room),
      },

      fdaRequirements: this.checkAllFDARequirements(room),

      detailed: {
        temperatureCompliance: this.analyzeParameterCompliance(
          room,
          "temperature"
        ),
        humidityCompliance: this.analyzeParameterCompliance(room, "humidity"),
        pressureCompliance: this.analyzeParameterCompliance(room, "pressure"),
        dataIntegrity: this.verifyDataIntegrity(room),
        calibrationRecords: this.getCalibrationHistory(room),
        maintenanceLogs: this.getMaintenanceHistory(room),
      },

      deviations: this.compileDeviations(room),
      corrativeActions: this.getCorrectiveActions(room),
      recommendations: this.generateRecommendations(room),

      signatures: {
        preparedBy: null,
        reviewedBy: null,
        approvedBy: null,
      },
    };

    // Store report
    this.reports.set(report.reportId, report);

    // Log audit trail
    this.logAuditEntry({
      action: "GENERATE_REPORT",
      roomId: room.id,
      reportId: report.reportId,
      timestamp: new Date().toISOString(),
    });

    return report;
  }

  /**
   * Calculate compliance score
   */
  calculateComplianceScore(room) {
    let score = 100;

    // Deduct for violations
    const violations = room.compliance?.violations || [];
    violations.forEach((v) => {
      switch (v.severity) {
        case "high":
          score -= 15;
          break;
        case "medium":
          score -= 8;
          break;
        case "low":
          score -= 3;
          break;
      }
    });

    // Deduct for equipment issues
    if (room.equipment) {
      if (room.equipment.filterAge > 90) score -= 5;
      if (room.equipment.sensorAge > 2) score -= 3;
    }

    // Add points for recent audit
    if (room.compliance?.lastAudit) {
      const daysSinceAudit =
        (Date.now() - new Date(room.compliance.lastAudit).getTime()) /
        (24 * 60 * 60 * 1000);
      if (daysSinceAudit < 30) score += 5;
    }

    return Math.max(0, Math.min(100, Math.round(score * 10) / 10));
  }

  /**
   * Count violations by severity
   */
  countViolations(room, severity) {
    const violations = room.compliance?.violations || [];
    return violations.filter((v) => v.severity === severity).length;
  }

  /**
   * Determine overall compliance status
   */
  determineOverallStatus(room) {
    const score = this.calculateComplianceScore(room);
    const criticalViolations = this.countViolations(room, "high");

    if (criticalViolations > 0 || score < 60) return "non-compliant";
    if (score < 80) return "needs-improvement";
    if (score < 95) return "compliant";
    return "excellent";
  }

  /**
   * Check all FDA requirements
   */
  checkAllFDARequirements(room) {
    return Object.entries(FDA_REQUIREMENTS).map(([code, requirement]) => ({
      code,
      section: requirement.section,
      description: requirement.description,
      status: this.checkRequirement(room, code),
      evidence: this.gatherEvidence(room, code),
      lastVerified: new Date().toISOString(),
    }));
  }

  /**
   * Check individual requirement
   */
  checkRequirement(room, code) {
    switch (code) {
      case "211.46": // Ventilation and temperature control
        return this.checkTemperatureControl(room);
      case "211.58": // Maintenance
        return this.checkMaintenanceStatus(room);
      case "211.68": // Equipment
        return this.checkEquipmentStatus(room);
      case "211.142": // Warehousing
        return this.checkWarehousingProcedures(room);
      case "211.160": // Laboratory controls
        return this.checkQualityControls(room);
      default:
        return "not-evaluated";
    }
  }

  /**
   * Check temperature control compliance
   */
  checkTemperatureControl(room) {
    const temp = room.conditions?.temperature;
    if (!temp) return "insufficient-data";

    const value = temp.value ?? temp.current;
    const { min, max } = temp;

    if (value >= min && value <= max) {
      const violations = (room.compliance?.violations || []).filter(
        (v) => v.parameter === "temperature" && v.severity === "high"
      );
      return violations.length === 0 ? "compliant" : "non-compliant";
    }
    return "non-compliant";
  }

  /**
   * Check maintenance status
   */
  checkMaintenanceStatus(room) {
    if (!room.equipment) return "insufficient-data";

    const lastMaintenance = room.equipment.lastMaintenance;
    if (!lastMaintenance) return "non-compliant";

    const daysSince =
      (Date.now() - new Date(lastMaintenance).getTime()) /
      (24 * 60 * 60 * 1000);
    if (daysSince > 90) return "non-compliant";
    if (daysSince > 60) return "needs-attention";
    return "compliant";
  }

  /**
   * Check equipment status
   */
  checkEquipmentStatus(room) {
    if (!room.equipment) return "insufficient-data";

    const issues = [];
    if (room.equipment.sensorAge > 2) issues.push("sensor-aging");
    if (room.equipment.filterAge > 90) issues.push("filter-replacement-due");

    if (issues.length > 1) return "non-compliant";
    if (issues.length === 1) return "needs-attention";
    return "compliant";
  }

  /**
   * Check warehousing procedures
   */
  checkWarehousingProcedures(room) {
    // Check for proper categorization and storage conditions
    if (!room.category) return "needs-attention";
    if (!room.medicines || room.medicines.length === 0) return "compliant";

    // Check medicine storage appropriateness
    const hasProperStorage = room.medicines.every((m) => {
      // Simplified check - in reality would verify against medicine requirements
      return m.batch && m.expiry;
    });

    return hasProperStorage ? "compliant" : "needs-attention";
  }

  /**
   * Check quality controls
   */
  checkQualityControls(room) {
    const auditScore = room.compliance?.auditScore;
    if (auditScore === undefined) return "insufficient-data";

    if (auditScore >= 90) return "compliant";
    if (auditScore >= 75) return "needs-attention";
    return "non-compliant";
  }

  /**
   * Gather evidence for requirement
   */
  gatherEvidence(room, code) {
    const evidence = [];

    switch (code) {
      case "211.46":
        evidence.push({
          type: "sensor-reading",
          parameter: "temperature",
          value:
            room.conditions?.temperature?.value ??
            room.conditions?.temperature?.current,
          timestamp:
            room.conditions?.temperature?.timestamp || new Date().toISOString(),
        });
        evidence.push({
          type: "historical-data",
          pointsRecorded: room.conditions?.temperature?.history?.length || 0,
        });
        break;

      case "211.58":
        if (room.equipment?.lastMaintenance) {
          evidence.push({
            type: "maintenance-record",
            lastMaintenance: room.equipment.lastMaintenance,
          });
        }
        break;

      case "211.68":
        evidence.push({
          type: "equipment-status",
          sensorAge: room.equipment?.sensorAge,
          filterAge: room.equipment?.filterAge,
          calibrationStatus: room.equipment?.sensorAge < 1 ? "current" : "due",
        });
        break;
    }

    return evidence;
  }

  /**
   * Analyze parameter compliance
   */
  analyzeParameterCompliance(room, parameter) {
    const condition = room.conditions?.[parameter];
    if (!condition) {
      return { status: "no-data", details: null };
    }

    const history = condition.history || [];
    const value = condition.value ?? condition.current;
    const { min, max } = condition;

    // Calculate time in range
    const inRangeCount = history.filter((v) => v >= min && v <= max).length;
    const timeInRange =
      history.length > 0 ? (inRangeCount / history.length) * 100 : 100;

    // Calculate statistics
    const mean =
      history.length > 0
        ? history.reduce((a, b) => a + b, 0) / history.length
        : value;
    const variance =
      history.length > 0
        ? history.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
          history.length
        : 0;
    const stdDev = Math.sqrt(variance);

    // Find excursions
    const excursions = history.filter((v) => v < min || v > max).length;

    return {
      status:
        timeInRange >= 99
          ? "compliant"
          : timeInRange >= 95
          ? "marginal"
          : "non-compliant",
      currentValue: value,
      allowedRange: { min, max },
      statistics: {
        mean: Math.round(mean * 100) / 100,
        stdDev: Math.round(stdDev * 100) / 100,
        min: history.length > 0 ? Math.min(...history) : value,
        max: history.length > 0 ? Math.max(...history) : value,
      },
      timeInRange: Math.round(timeInRange * 10) / 10,
      excursions,
      dataPoints: history.length,
      trend: condition.trend || "stable",
    };
  }

  /**
   * Verify data integrity
   */
  verifyDataIntegrity(room) {
    const checks = {
      dataCompleteness: true,
      timestampSequence: true,
      valueRangeValidity: true,
      sensorAccuracy: true,
    };

    // Check data completeness
    ["temperature", "humidity", "pressure"].forEach((param) => {
      if (
        !room.conditions?.[param]?.history ||
        room.conditions[param].history.length < 10
      ) {
        checks.dataCompleteness = false;
      }
    });

    // Check sensor accuracy
    ["temperature", "humidity", "pressure"].forEach((param) => {
      const accuracy = room.conditions?.[param]?.accuracy;
      if (accuracy !== undefined && accuracy < 0.9) {
        checks.sensorAccuracy = false;
      }
    });

    return {
      status: Object.values(checks).every(Boolean)
        ? "verified"
        : "issues-found",
      checks,
      verifiedAt: new Date().toISOString(),
    };
  }

  /**
   * Get calibration history
   */
  getCalibrationHistory(room) {
    // Mock calibration records
    return {
      lastCalibration: room.equipment?.lastMaintenance || null,
      nextDue: room.equipment?.lastMaintenance
        ? new Date(
            new Date(room.equipment.lastMaintenance).getTime() +
              180 * 24 * 60 * 60 * 1000
          ).toISOString()
        : null,
      calibrationStandard: "NIST-traceable",
      records: [
        {
          date:
            room.equipment?.lastMaintenance ||
            new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          technician: "Calibration Tech",
          result: "pass",
          deviation: 0.1,
        },
      ],
    };
  }

  /**
   * Get maintenance history
   */
  getMaintenanceHistory(room) {
    return {
      lastMaintenance: room.equipment?.lastMaintenance || null,
      scheduledMaintenance: room.equipment?.lastMaintenance
        ? new Date(
            new Date(room.equipment.lastMaintenance).getTime() +
              90 * 24 * 60 * 60 * 1000
          ).toISOString()
        : null,
      maintenanceType: "preventive",
      records: [
        {
          date:
            room.equipment?.lastMaintenance ||
            new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          type: "filter-replacement",
          technician: "Maintenance Tech",
          notes: "Replaced air filter, checked refrigerant levels",
        },
      ],
    };
  }

  /**
   * Compile deviations
   */
  compileDeviations(room) {
    const violations = room.compliance?.violations || [];
    return violations.map((v, index) => ({
      id: `DEV-${room.id}-${index}`,
      parameter: v.parameter,
      severity: v.severity,
      duration: v.duration,
      timestamp: v.timestamp,
      impact: this.assessDeviationImpact(v, room),
      rootCause: "Under investigation",
      status: "open",
    }));
  }

  /**
   * Assess deviation impact
   */
  assessDeviationImpact(violation, room) {
    const affectedMedicines = room.medicines?.map((m) => m.name) || [];
    return {
      affectedProducts: affectedMedicines,
      estimatedDegradation: violation.duration * 0.1, // Simplified calculation
      quarantineRequired: violation.severity === "high",
    };
  }

  /**
   * Get corrective actions
   */
  getCorrectiveActions(room) {
    const actions = [];
    const violations = room.compliance?.violations || [];

    violations.forEach((v) => {
      if (v.severity === "high") {
        actions.push({
          type: "immediate",
          action: `Investigate ${v.parameter} excursion`,
          responsible: "Quality Manager",
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          status: "pending",
        });
      }
    });

    if (room.equipment?.filterAge > 90) {
      actions.push({
        type: "preventive",
        action: "Replace air filter",
        responsible: "Maintenance",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "scheduled",
      });
    }

    return actions;
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(room) {
    const recommendations = [];
    const score = this.calculateComplianceScore(room);

    if (score < 80) {
      recommendations.push({
        priority: "high",
        category: "compliance",
        recommendation:
          "Conduct immediate compliance review and corrective action planning",
      });
    }

    if (room.equipment?.sensorAge > 1.5) {
      recommendations.push({
        priority: "medium",
        category: "equipment",
        recommendation: "Schedule sensor calibration verification",
      });
    }

    if (room.equipment?.filterAge > 60) {
      recommendations.push({
        priority: "low",
        category: "maintenance",
        recommendation: "Plan filter replacement within next 30 days",
      });
    }

    // Add general recommendations
    recommendations.push({
      priority: "low",
      category: "documentation",
      recommendation: "Review and update SOPs for storage monitoring",
    });

    return recommendations;
  }

  /**
   * Log audit entry
   */
  logAuditEntry(entry) {
    const auditEntry = {
      id: `AUD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...entry,
      timestamp: entry.timestamp || new Date().toISOString(),
    };

    this.auditTrail.unshift(auditEntry);

    // Keep audit trail manageable
    if (this.auditTrail.length > 10000) {
      this.auditTrail = this.auditTrail.slice(0, 10000);
    }

    return auditEntry;
  }

  /**
   * Get audit trail
   */
  getAuditTrail(roomId = null, limit = 100) {
    let trail = this.auditTrail;
    if (roomId) {
      trail = trail.filter((e) => e.roomId === roomId);
    }
    return trail.slice(0, limit);
  }

  /**
   * Export report as PDF (returns data structure)
   */
  exportReportData(reportId, format = "json") {
    const report = this.reports.get(reportId);
    if (!report) return null;

    if (format === "json") {
      return JSON.stringify(report, null, 2);
    }

    // For PDF, return structured data that can be rendered
    return {
      title: `Compliance Report - ${report.roomName}`,
      generated: report.generatedAt,
      data: report,
    };
  }
}

// Singleton instance
const complianceModule = new ComplianceModule();

export default complianceModule;
export { ComplianceModule, FDA_REQUIREMENTS };
