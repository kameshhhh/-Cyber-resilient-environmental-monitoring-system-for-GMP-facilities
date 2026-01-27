/**
 * Transaction Factory for Pharmaceutical Blockchain
 * Creates standardized transactions for different operations
 */

import { generateTransactionId, sha256 } from "./crypto";

/**
 * Transaction types enum
 */
export const TRANSACTION_TYPES = {
  SENSOR_READING: "sensor_reading",
  ROOM_STATUS_CHANGE: "room_status_change",
  MEDICINE_INVENTORY: "medicine_inventory",
  DEVIATION: "deviation",
  CAPA: "capa",
  AUDIT: "audit",
  ALERT: "alert",
  SMART_CONTRACT: "smart_contract",
  USER_ACTION: "user_action",
  SYSTEM: "system",
  COMPLIANCE_CHECK: "compliance_check",
};

/**
 * Regulatory references mapping
 */
export const REGULATORY_REFERENCES = {
  FDA_STORAGE: ["21CFR211.42", "21CFR211.46", "21CFR211.68"],
  FDA_RECORDS: ["21CFR211.180", "21CFR211.188"],
  FDA_DEVIATION: ["21CFR211.192"],
  FDA_DISTRIBUTION: ["21CFR211.142", "21CFR211.150"],
  EU_GMP: ["EU-GMP-Annex11", "EU-GMP-Annex15", "PIC/S-PE-009"],
  WHO: ["WHO-TRS-961", "WHO-EPI-LOG"],
  ICH: ["ICH-Q1A", "ICH-Q7", "ICH-Q10"],
};

/**
 * Transaction Factory Class
 */
export class TransactionFactory {
  constructor(facilityId = "DEFAULT_FACILITY", userId = "SYSTEM") {
    this.facilityId = facilityId;
    this.userId = userId;
  }

  /**
   * Set the current user
   * @param {string} userId
   */
  setUser(userId) {
    this.userId = userId;
  }

  /**
   * Set the facility ID
   * @param {string} facilityId
   */
  setFacility(facilityId) {
    this.facilityId = facilityId;
  }

  /**
   * Create base transaction structure
   * @param {string} type
   * @param {object} data
   * @param {array} regulatoryRefs
   * @returns {object}
   */
  createBaseTransaction(type, data, regulatoryRefs = []) {
    return {
      id: generateTransactionId(type),
      type,
      data,
      timestamp: new Date().toISOString(),
      signature: "", // Will be signed later
      userId: this.userId,
      facilityId: this.facilityId,
      regulatoryReferences: regulatoryRefs,
      metadata: {
        version: "1.0.0",
        dataIntegrity: "ALCOA+",
        createdAt: Date.now(),
      },
    };
  }

  /**
   * Create sensor reading transaction
   * @param {object} reading - Sensor reading data
   * @param {string} roomId - Room identifier
   * @param {string} sensorId - Sensor identifier
   * @returns {object}
   */
  createSensorReadingTransaction(reading, roomId, sensorId) {
    const data = {
      reading: {
        temperature: reading.temperature,
        humidity: reading.humidity,
        pressure: reading.pressure || reading.pressureDifferential,
        timestamp: reading.timestamp || new Date().toISOString(),
      },
      roomId,
      sensorId: sensorId || `sensor-${roomId}`,
      qualityMetrics: {
        sensorAccuracy: reading.accuracy || 99.5,
        calibrationDate: reading.calibrationDate || null,
        readingQuality: "VALID",
      },
    };

    const tx = this.createBaseTransaction(
      TRANSACTION_TYPES.SENSOR_READING,
      data,
      REGULATORY_REFERENCES.FDA_STORAGE
    );

    tx.metadata = {
      ...tx.metadata,
      verificationLevel: "automated",
      requiresAudit: false,
      retentionPeriod: "7 years",
    };

    return tx;
  }

  /**
   * Create room status change transaction
   * @param {string} roomId
   * @param {string} oldStatus
   * @param {string} newStatus
   * @param {string} reason
   * @param {object} conditions - Current conditions
   * @returns {object}
   */
  createRoomStatusChangeTransaction(
    roomId,
    oldStatus,
    newStatus,
    reason,
    conditions = {}
  ) {
    const severity = this.getStatusChangeSeverity(oldStatus, newStatus);

    const data = {
      roomId,
      oldStatus,
      newStatus,
      reason,
      timestamp: new Date().toISOString(),
      conditions,
      impactAssessment: {
        severity,
        affectedProducts: [],
        requiresInvestigation: severity === "critical" || severity === "major",
        estimatedImpactDuration: null,
      },
    };

    const tx = this.createBaseTransaction(
      TRANSACTION_TYPES.ROOM_STATUS_CHANGE,
      data,
      [
        ...REGULATORY_REFERENCES.FDA_STORAGE,
        ...REGULATORY_REFERENCES.FDA_DEVIATION,
      ]
    );

    tx.metadata = {
      ...tx.metadata,
      severity,
      requiresCAPA: newStatus === "red" || newStatus === "critical",
      notificationRequired: severity !== "minor",
      escalationLevel: this.getEscalationLevel(severity),
    };

    return tx;
  }

  /**
   * Create medicine inventory transaction
   * @param {string} medicineId
   * @param {string} action - 'add' | 'update' | 'remove' | 'quarantine' | 'release'
   * @param {object} details
   * @returns {object}
   */
  createMedicineInventoryTransaction(medicineId, action, details) {
    const data = {
      medicineId,
      action,
      details: {
        ...details,
        batchNumber: details.batchNumber,
        expiryDate: details.expiryDate,
        quantity: details.quantity,
        location: details.location || details.roomId,
        serialNumber: details.serialNumber,
      },
      timestamp: new Date().toISOString(),
      previousState: details.previousState || null,
    };

    const tx = this.createBaseTransaction(
      TRANSACTION_TYPES.MEDICINE_INVENTORY,
      data,
      REGULATORY_REFERENCES.FDA_DISTRIBUTION
    );

    tx.metadata = {
      ...tx.metadata,
      traceabilityLevel: "full",
      requiresVerification: ["remove", "quarantine"].includes(action),
      serialization: !!details.serialNumber,
      gdpCompliant: true,
    };

    return tx;
  }

  /**
   * Create deviation transaction
   * @param {string} deviationId
   * @param {string} action - 'create' | 'update' | 'resolve' | 'escalate'
   * @param {object} deviationData
   * @returns {object}
   */
  createDeviationTransaction(deviationId, action, deviationData) {
    const data = {
      deviationId,
      action,
      deviationData: {
        ...deviationData,
        severity: deviationData.severity,
        parameter: deviationData.parameter,
        actualValue: deviationData.actualValue,
        expectedRange: deviationData.expectedRange,
        duration: deviationData.duration,
        rootCause: deviationData.rootCause || null,
        correctiveActions: deviationData.correctiveActions || [],
      },
      timestamp: new Date().toISOString(),
    };

    const tx = this.createBaseTransaction(TRANSACTION_TYPES.DEVIATION, data, [
      ...REGULATORY_REFERENCES.FDA_DEVIATION,
      ...REGULATORY_REFERENCES.EU_GMP,
    ]);

    tx.metadata = {
      ...tx.metadata,
      requiresCAPA: ["critical", "major"].includes(deviationData.severity),
      regulatoryReporting: deviationData.requiresReporting || false,
      investigationRequired: true,
      timeToResolve: this.getResolutionTimeframe(deviationData.severity),
    };

    return tx;
  }

  /**
   * Create CAPA (Corrective and Preventive Action) transaction
   * @param {string} capaId
   * @param {string} action
   * @param {object} capaData
   * @returns {object}
   */
  createCAPATransaction(capaId, action, capaData) {
    const data = {
      capaId,
      action,
      capaData: {
        ...capaData,
        title: capaData.title,
        description: capaData.description,
        type: capaData.type, // 'corrective' | 'preventive'
        priority: capaData.priority,
        assignedTo: capaData.assignedTo,
        dueDate: capaData.dueDate,
        relatedDeviations: capaData.relatedDeviations || [],
        effectivenessCheck: capaData.effectivenessCheck || null,
      },
      timestamp: new Date().toISOString(),
    };

    const tx = this.createBaseTransaction(
      TRANSACTION_TYPES.CAPA,
      data,
      REGULATORY_REFERENCES.FDA_DEVIATION
    );

    tx.metadata = {
      ...tx.metadata,
      requiresManagementReview: capaData.priority === "critical",
      effectivenessVerificationRequired: true,
      closureApprovalRequired: true,
    };

    return tx;
  }

  /**
   * Create audit transaction
   * @param {string} auditId
   * @param {string} action - 'start' | 'update' | 'complete' | 'findings'
   * @param {object} auditData
   * @returns {object}
   */
  createAuditTransaction(auditId, action, auditData) {
    const data = {
      auditId,
      action,
      auditData: {
        ...auditData,
        auditType: auditData.auditType, // 'internal' | 'external' | 'regulatory'
        scope: auditData.scope,
        auditors: auditData.auditors,
        findingsCount: auditData.findings?.length || 0,
        observations: auditData.observations || [],
        nonConformities: auditData.nonConformities || [],
      },
      timestamp: new Date().toISOString(),
    };

    const tx = this.createBaseTransaction(TRANSACTION_TYPES.AUDIT, data, [
      ...REGULATORY_REFERENCES.FDA_RECORDS,
      ...REGULATORY_REFERENCES.EU_GMP,
    ]);

    tx.metadata = {
      ...tx.metadata,
      immutable: true,
      requiresSignOff: action === "complete",
      regulatoryBody: auditData.regulatoryBody || null,
      retentionPeriod: "10 years",
    };

    return tx;
  }

  /**
   * Create alert transaction
   * @param {string} alertId
   * @param {string} action - 'create' | 'acknowledge' | 'resolve' | 'escalate'
   * @param {object} alertData
   * @returns {object}
   */
  createAlertTransaction(alertId, action, alertData) {
    const data = {
      alertId,
      action,
      alertData: {
        ...alertData,
        severity: alertData.severity,
        type: alertData.type,
        message: alertData.message,
        roomId: alertData.roomId,
        parameter: alertData.parameter,
        value: alertData.value,
        threshold: alertData.threshold,
      },
      timestamp: new Date().toISOString(),
    };

    const tx = this.createBaseTransaction(
      TRANSACTION_TYPES.ALERT,
      data,
      REGULATORY_REFERENCES.FDA_STORAGE
    );

    tx.metadata = {
      ...tx.metadata,
      responseTimeRequired: this.getAlertResponseTime(alertData.severity),
      escalationPath: this.getEscalationPath(alertData.severity),
    };

    return tx;
  }

  /**
   * Create smart contract execution transaction
   * @param {string} contractId
   * @param {string} functionName
   * @param {object} parameters
   * @param {object} result
   * @returns {object}
   */
  createSmartContractTransaction(contractId, functionName, parameters, result) {
    const data = {
      contractId,
      functionName,
      parameters,
      result,
      executionTimestamp: new Date().toISOString(),
      gasUsed: 0, // Placeholder for future implementation
      status: result.success ? "SUCCESS" : "FAILED",
    };

    const tx = this.createBaseTransaction(
      TRANSACTION_TYPES.SMART_CONTRACT,
      data,
      result.regulatoryReferences || []
    );

    tx.metadata = {
      ...tx.metadata,
      contractVersion: result.contractVersion || "1.0.0",
      deterministic: true,
      replayable: true,
    };

    return tx;
  }

  /**
   * Create compliance check transaction
   * @param {string} checkId
   * @param {string} checkType
   * @param {object} checkResult
   * @returns {object}
   */
  createComplianceCheckTransaction(checkId, checkType, checkResult) {
    const data = {
      checkId,
      checkType,
      result: {
        compliant: checkResult.compliant,
        score: checkResult.score,
        violations: checkResult.violations || [],
        recommendations: checkResult.recommendations || [],
        checkedAt: new Date().toISOString(),
      },
      framework: checkResult.framework,
      scope: checkResult.scope,
    };

    const tx = this.createBaseTransaction(
      TRANSACTION_TYPES.COMPLIANCE_CHECK,
      data,
      checkResult.regulatoryReferences || REGULATORY_REFERENCES.FDA_RECORDS
    );

    tx.metadata = {
      ...tx.metadata,
      automated: checkResult.automated !== false,
      requiresReview: !checkResult.compliant,
      nextCheckDue: checkResult.nextCheckDue,
    };

    return tx;
  }

  /**
   * Get severity of status change
   * @param {string} oldStatus
   * @param {string} newStatus
   * @returns {string}
   */
  getStatusChangeSeverity(oldStatus, newStatus) {
    const severityMap = {
      green_to_yellow: "minor",
      green_to_red: "critical",
      yellow_to_red: "major",
      yellow_to_green: "info",
      red_to_yellow: "major",
      red_to_green: "info",
    };

    const key = `${oldStatus}_to_${newStatus}`;
    return severityMap[key] || "minor";
  }

  /**
   * Get escalation level based on severity
   * @param {string} severity
   * @returns {number}
   */
  getEscalationLevel(severity) {
    const levels = {
      info: 0,
      minor: 1,
      major: 2,
      critical: 3,
    };
    return levels[severity] || 0;
  }

  /**
   * Get resolution timeframe based on severity
   * @param {string} severity
   * @returns {string}
   */
  getResolutionTimeframe(severity) {
    const timeframes = {
      critical: "24 hours",
      major: "72 hours",
      minor: "30 days",
      info: "90 days",
    };
    return timeframes[severity] || "30 days";
  }

  /**
   * Get alert response time requirement
   * @param {string} severity
   * @returns {string}
   */
  getAlertResponseTime(severity) {
    const times = {
      critical: "15 minutes",
      major: "1 hour",
      minor: "4 hours",
      info: "24 hours",
    };
    return times[severity] || "4 hours";
  }

  /**
   * Get escalation path for alert
   * @param {string} severity
   * @returns {array}
   */
  getEscalationPath(severity) {
    const paths = {
      critical: ["operator", "supervisor", "manager", "director", "qa_head"],
      major: ["operator", "supervisor", "manager"],
      minor: ["operator", "supervisor"],
      info: ["operator"],
    };
    return paths[severity] || ["operator"];
  }
}

// Export singleton factory with default settings
export const transactionFactory = new TransactionFactory();

export default TransactionFactory;
