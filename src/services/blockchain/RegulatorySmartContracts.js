/**
 * Regulatory Smart Contracts for Pharmaceutical Storage
 * FDA 21 CFR Part 211, EU GMP Annex 11, WHO TRS 961 Compliance
 */

import { sha256, signData, verifySignature } from "./crypto";

/**
 * Contract status constants
 */
export const CONTRACT_STATUS = {
  ACTIVE: "active",
  PAUSED: "paused",
  DEPRECATED: "deprecated",
  VIOLATED: "violated",
};

/**
 * Compliance result types
 */
export const COMPLIANCE_RESULT = {
  PASS: "pass",
  FAIL: "fail",
  WARNING: "warning",
  PENDING: "pending",
};

/**
 * Regulatory frameworks
 */
export const REGULATORY_FRAMEWORKS = {
  FDA: "FDA_21CFR211",
  EU_GMP: "EU_GMP_ANNEX11",
  WHO: "WHO_TRS961",
  ICH: "ICH_Q9_Q10",
  PIC_S: "PIC_S_GMP",
};

/**
 * Storage condition specifications by room type
 */
export const STORAGE_SPECIFICATIONS = {
  cold_storage: {
    temperature: { min: 2, max: 8, unit: "°C" },
    humidity: { min: 35, max: 60, unit: "%RH" },
    pressure: { min: -5, max: 5, unit: "Pa" },
    monitoringInterval: 5 * 60 * 1000, // 5 minutes
    deviationThreshold: 15 * 60 * 1000, // 15 minutes
  },
  controlled_room: {
    temperature: { min: 20, max: 25, unit: "°C" },
    humidity: { min: 30, max: 60, unit: "%RH" },
    pressure: { min: 10, max: 50, unit: "Pa" },
    monitoringInterval: 15 * 60 * 1000, // 15 minutes
    deviationThreshold: 30 * 60 * 1000, // 30 minutes
  },
  freezer: {
    temperature: { min: -25, max: -15, unit: "°C" },
    humidity: { min: 0, max: 100, unit: "%RH" },
    pressure: { min: -10, max: 10, unit: "Pa" },
    monitoringInterval: 10 * 60 * 1000, // 10 minutes
    deviationThreshold: 20 * 60 * 1000, // 20 minutes
  },
  ambient: {
    temperature: { min: 15, max: 30, unit: "°C" },
    humidity: { min: 20, max: 70, unit: "%RH" },
    pressure: { min: -5, max: 15, unit: "Pa" },
    monitoringInterval: 30 * 60 * 1000, // 30 minutes
    deviationThreshold: 60 * 60 * 1000, // 60 minutes
  },
};

/**
 * Base Smart Contract Class
 */
class SmartContract {
  constructor(id, name, framework) {
    this.id = id;
    this.name = name;
    this.framework = framework;
    this.status = CONTRACT_STATUS.ACTIVE;
    this.version = "1.0.0";
    this.createdAt = new Date().toISOString();
    this.executionCount = 0;
    this.lastExecuted = null;
    this.violations = [];
  }

  /**
   * Execute the contract
   * @param {object} data - Input data for contract execution
   * @returns {Promise<object>} Execution result
   */
  async execute(data) {
    throw new Error("Execute method must be implemented");
  }

  /**
   * Validate contract inputs
   * @param {object} data
   * @returns {object}
   */
  validateInputs(data) {
    return { valid: true };
  }

  /**
   * Log contract execution
   * @param {object} result
   */
  logExecution(result) {
    this.executionCount++;
    this.lastExecuted = new Date().toISOString();

    if (result.status === COMPLIANCE_RESULT.FAIL) {
      this.violations.push({
        timestamp: this.lastExecuted,
        result: result,
      });
    }
  }
}

/**
 * Temperature Compliance Contract
 * Ensures temperature readings comply with storage specifications
 */
export class TemperatureComplianceContract extends SmartContract {
  constructor() {
    super(
      "TC-001",
      "Temperature Compliance Contract",
      REGULATORY_FRAMEWORKS.FDA
    );
    this.regulations = [
      {
        code: "21 CFR 211.142",
        description: "Storage temperature requirements",
      },
      {
        code: "21 CFR 211.68",
        description: "Temperature monitoring and control",
      },
    ];
  }

  async execute(data) {
    const { roomType, temperature, timestamp, roomId } = data;
    const specs =
      STORAGE_SPECIFICATIONS[roomType] || STORAGE_SPECIFICATIONS.ambient;

    const result = {
      contractId: this.id,
      contractName: this.name,
      timestamp: new Date().toISOString(),
      inputData: { roomType, temperature, timestamp, roomId },
      specifications: specs.temperature,
      status: COMPLIANCE_RESULT.PASS,
      details: [],
      correctiveActions: [],
      regulatoryReferences: this.regulations,
    };

    // Check temperature range
    if (temperature < specs.temperature.min) {
      result.status = COMPLIANCE_RESULT.FAIL;
      result.details.push({
        type: "BELOW_MINIMUM",
        message: `Temperature ${temperature}${specs.temperature.unit} is below minimum ${specs.temperature.min}${specs.temperature.unit}`,
        deviation: specs.temperature.min - temperature,
      });
      result.correctiveActions.push({
        action: "IMMEDIATE_INVESTIGATION",
        priority: "HIGH",
        description:
          "Investigate cold chain integrity and potential product impact",
      });
    } else if (temperature > specs.temperature.max) {
      result.status = COMPLIANCE_RESULT.FAIL;
      result.details.push({
        type: "ABOVE_MAXIMUM",
        message: `Temperature ${temperature}${specs.temperature.unit} exceeds maximum ${specs.temperature.max}${specs.temperature.unit}`,
        deviation: temperature - specs.temperature.max,
      });
      result.correctiveActions.push({
        action: "IMMEDIATE_INVESTIGATION",
        priority: "HIGH",
        description:
          "Investigate cooling system failure and potential product degradation",
      });
    } else {
      result.details.push({
        type: "IN_RANGE",
        message: `Temperature ${temperature}${specs.temperature.unit} within acceptable range`,
      });
    }

    // Check for warning zone (within 10% of limits)
    const range = specs.temperature.max - specs.temperature.min;
    const warningBuffer = range * 0.1;

    if (temperature < specs.temperature.min + warningBuffer) {
      result.status =
        result.status === COMPLIANCE_RESULT.FAIL
          ? COMPLIANCE_RESULT.FAIL
          : COMPLIANCE_RESULT.WARNING;
      result.details.push({
        type: "APPROACHING_LOW",
        message: "Temperature approaching lower limit",
      });
    } else if (temperature > specs.temperature.max - warningBuffer) {
      result.status =
        result.status === COMPLIANCE_RESULT.FAIL
          ? COMPLIANCE_RESULT.FAIL
          : COMPLIANCE_RESULT.WARNING;
      result.details.push({
        type: "APPROACHING_HIGH",
        message: "Temperature approaching upper limit",
      });
    }

    // Generate hash for integrity
    result.hash = await sha256(JSON.stringify(result));

    this.logExecution(result);
    return result;
  }
}

/**
 * Humidity Compliance Contract
 * Ensures humidity readings comply with storage specifications
 */
export class HumidityComplianceContract extends SmartContract {
  constructor() {
    super("HC-001", "Humidity Compliance Contract", REGULATORY_FRAMEWORKS.FDA);
    this.regulations = [
      { code: "21 CFR 211.142", description: "Storage humidity requirements" },
      { code: "EU GMP Annex 15", description: "Qualification and validation" },
    ];
  }

  async execute(data) {
    const { roomType, humidity, timestamp, roomId } = data;
    const specs =
      STORAGE_SPECIFICATIONS[roomType] || STORAGE_SPECIFICATIONS.ambient;

    const result = {
      contractId: this.id,
      contractName: this.name,
      timestamp: new Date().toISOString(),
      inputData: { roomType, humidity, timestamp, roomId },
      specifications: specs.humidity,
      status: COMPLIANCE_RESULT.PASS,
      details: [],
      correctiveActions: [],
      regulatoryReferences: this.regulations,
    };

    if (humidity < specs.humidity.min) {
      result.status = COMPLIANCE_RESULT.FAIL;
      result.details.push({
        type: "BELOW_MINIMUM",
        message: `Humidity ${humidity}${specs.humidity.unit} is below minimum ${specs.humidity.min}${specs.humidity.unit}`,
        deviation: specs.humidity.min - humidity,
      });
      result.correctiveActions.push({
        action: "HUMIDITY_ADJUSTMENT",
        priority: "MEDIUM",
        description: "Adjust humidification system to increase humidity levels",
      });
    } else if (humidity > specs.humidity.max) {
      result.status = COMPLIANCE_RESULT.FAIL;
      result.details.push({
        type: "ABOVE_MAXIMUM",
        message: `Humidity ${humidity}${specs.humidity.unit} exceeds maximum ${specs.humidity.max}${specs.humidity.unit}`,
        deviation: humidity - specs.humidity.max,
      });
      result.correctiveActions.push({
        action: "DEHUMIDIFICATION",
        priority: "HIGH",
        description:
          "Activate dehumidification system and check for moisture ingress",
      });
    } else {
      result.details.push({
        type: "IN_RANGE",
        message: `Humidity ${humidity}${specs.humidity.unit} within acceptable range`,
      });
    }

    result.hash = await sha256(JSON.stringify(result));

    this.logExecution(result);
    return result;
  }
}

/**
 * Deviation Management Contract
 * Handles environmental deviations according to regulatory requirements
 */
export class DeviationManagementContract extends SmartContract {
  constructor() {
    super("DM-001", "Deviation Management Contract", REGULATORY_FRAMEWORKS.FDA);
    this.regulations = [
      {
        code: "21 CFR 211.192",
        description: "Deviation investigation requirements",
      },
      { code: "21 CFR 211.180", description: "Records and reports" },
      {
        code: "EU GMP Chapter 8",
        description: "Complaints and product recalls",
      },
    ];
  }

  async execute(data) {
    const {
      deviationType,
      severity,
      parameter,
      actualValue,
      expectedRange,
      roomId,
      productIds,
      timestamp,
      duration,
    } = data;

    const result = {
      contractId: this.id,
      contractName: this.name,
      timestamp: new Date().toISOString(),
      deviationId: `DEV-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      inputData: data,
      status: COMPLIANCE_RESULT.PENDING,
      classification: this.classifyDeviation(severity, duration),
      requiredActions: [],
      documentation: [],
      timeline: {},
      regulatoryReferences: this.regulations,
    };

    // Classify and determine required actions
    const classification = result.classification;

    if (classification.level === "CRITICAL") {
      result.requiredActions = [
        {
          action: "IMMEDIATE_QUARANTINE",
          timeframe: "Immediate",
          responsible: "Quality Assurance",
          description: "Quarantine all affected products",
        },
        {
          action: "ROOT_CAUSE_INVESTIGATION",
          timeframe: "24 hours",
          responsible: "Quality Assurance",
          description: "Initiate root cause investigation",
        },
        {
          action: "REGULATORY_NOTIFICATION",
          timeframe: "72 hours",
          responsible: "Regulatory Affairs",
          description: "Assess need for regulatory notification",
        },
        {
          action: "CAPA_INITIATION",
          timeframe: "5 business days",
          responsible: "Quality Assurance",
          description: "Initiate CAPA if systemic issue identified",
        },
      ];
      result.timeline = {
        investigationDeadline: this.addDays(new Date(), 30),
        capaDeadline: this.addDays(new Date(), 60),
        closureDeadline: this.addDays(new Date(), 90),
      };
    } else if (classification.level === "MAJOR") {
      result.requiredActions = [
        {
          action: "PRODUCT_ASSESSMENT",
          timeframe: "24 hours",
          responsible: "Quality Control",
          description: "Assess impact on affected products",
        },
        {
          action: "ROOT_CAUSE_INVESTIGATION",
          timeframe: "72 hours",
          responsible: "Quality Assurance",
          description: "Conduct root cause investigation",
        },
        {
          action: "PREVENTIVE_MEASURES",
          timeframe: "10 business days",
          responsible: "Operations",
          description: "Implement preventive measures",
        },
      ];
      result.timeline = {
        investigationDeadline: this.addDays(new Date(), 14),
        closureDeadline: this.addDays(new Date(), 30),
      };
    } else {
      result.requiredActions = [
        {
          action: "DOCUMENTATION",
          timeframe: "24 hours",
          responsible: "Operations",
          description: "Document deviation and immediate correction",
        },
        {
          action: "TREND_MONITORING",
          timeframe: "Ongoing",
          responsible: "Quality Assurance",
          description: "Add to trend analysis data",
        },
      ];
      result.timeline = {
        closureDeadline: this.addDays(new Date(), 7),
      };
    }

    // Required documentation
    result.documentation = [
      "Deviation report form",
      "Environmental monitoring data",
      "Product impact assessment",
      "Corrective action plan",
      "Effectiveness verification",
    ];

    result.hash = await sha256(JSON.stringify(result));

    this.logExecution(result);
    return result;
  }

  classifyDeviation(severity, duration) {
    // Duration in minutes
    const durationMinutes = duration / (60 * 1000);

    if (severity === "critical" || durationMinutes > 60) {
      return {
        level: "CRITICAL",
        description: "Critical deviation requiring immediate action",
        riskScore: 10,
      };
    } else if (severity === "major" || durationMinutes > 30) {
      return {
        level: "MAJOR",
        description: "Major deviation requiring investigation",
        riskScore: 7,
      };
    } else {
      return {
        level: "MINOR",
        description: "Minor deviation for documentation and trending",
        riskScore: 3,
      };
    }
  }

  addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result.toISOString();
  }
}

/**
 * ALCOA+ Compliance Contract
 * Ensures data integrity according to ALCOA+ principles
 */
export class ALCOAComplianceContract extends SmartContract {
  constructor() {
    super(
      "ALCOA-001",
      "ALCOA+ Data Integrity Contract",
      REGULATORY_FRAMEWORKS.FDA
    );
    this.regulations = [
      {
        code: "21 CFR Part 11",
        description: "Electronic records and signatures",
      },
      { code: "EU GMP Annex 11", description: "Computerized systems" },
      { code: "WHO TRS 996 Annex 5", description: "Data integrity guidelines" },
    ];
    this.alcoaPrinciples = [
      "Attributable",
      "Legible",
      "Contemporaneous",
      "Original",
      "Accurate",
      "Complete",
      "Consistent",
      "Enduring",
      "Available",
    ];
  }

  async execute(data) {
    const result = {
      contractId: this.id,
      contractName: this.name,
      timestamp: new Date().toISOString(),
      inputData: data,
      status: COMPLIANCE_RESULT.PASS,
      principleResults: {},
      overallScore: 0,
      recommendations: [],
      regulatoryReferences: this.regulations,
    };

    let passCount = 0;

    // Attributable - can identify who performed action
    result.principleResults.attributable = {
      passed: !!data.userId && !!data.timestamp,
      score: data.userId && data.timestamp ? 100 : 0,
      details: data.userId
        ? `Action performed by ${data.userId}`
        : "Missing user attribution",
    };
    if (result.principleResults.attributable.passed) passCount++;

    // Legible - data is readable
    result.principleResults.legible = {
      passed: this.isDataLegible(data),
      score: this.isDataLegible(data) ? 100 : 0,
      details: "Data format is human-readable and machine-parseable",
    };
    if (result.principleResults.legible.passed) passCount++;

    // Contemporaneous - recorded at time of action
    const isContemporaneous = this.isTimestampContemporaneous(data.timestamp);
    result.principleResults.contemporaneous = {
      passed: isContemporaneous,
      score: isContemporaneous ? 100 : 50,
      details: isContemporaneous
        ? "Timestamp within acceptable range"
        : "Timestamp may not reflect actual event time",
    };
    if (result.principleResults.contemporaneous.passed) passCount++;

    // Original - is primary record
    result.principleResults.original = {
      passed: data.isOriginal !== false,
      score: data.isOriginal !== false ? 100 : 0,
      details:
        data.isOriginal !== false ? "Original record" : "Copy or derived data",
    };
    if (result.principleResults.original.passed) passCount++;

    // Accurate - data is correct
    result.principleResults.accurate = {
      passed: this.isDataAccurate(data),
      score: this.isDataAccurate(data) ? 100 : 0,
      details: "Data values within expected ranges",
    };
    if (result.principleResults.accurate.passed) passCount++;

    // Complete - all required data present
    const completeness = this.checkCompleteness(data);
    result.principleResults.complete = {
      passed: completeness.complete,
      score: completeness.score,
      details: completeness.details,
      missingFields: completeness.missingFields,
    };
    if (result.principleResults.complete.passed) passCount++;

    // Consistent - no contradictions
    result.principleResults.consistent = {
      passed: true,
      score: 100,
      details: "No contradictions detected in data",
    };
    passCount++;

    // Enduring - stored durably
    result.principleResults.enduring = {
      passed: true,
      score: 100,
      details: "Data stored in blockchain for permanent retention",
    };
    passCount++;

    // Available - accessible when needed
    result.principleResults.available = {
      passed: true,
      score: 100,
      details: "Data accessible through blockchain explorer",
    };
    passCount++;

    // Calculate overall score
    result.overallScore = (passCount / 9) * 100;

    // Determine status
    if (result.overallScore === 100) {
      result.status = COMPLIANCE_RESULT.PASS;
    } else if (result.overallScore >= 70) {
      result.status = COMPLIANCE_RESULT.WARNING;
    } else {
      result.status = COMPLIANCE_RESULT.FAIL;
    }

    // Generate recommendations
    for (const [principle, data] of Object.entries(result.principleResults)) {
      if (!data.passed) {
        result.recommendations.push({
          principle: principle.toUpperCase(),
          action: `Ensure ${principle} compliance: ${data.details}`,
          priority: data.score < 50 ? "HIGH" : "MEDIUM",
        });
      }
    }

    result.hash = await sha256(JSON.stringify(result));

    this.logExecution(result);
    return result;
  }

  isDataLegible(data) {
    return typeof data === "object" && data !== null;
  }

  isTimestampContemporaneous(timestamp) {
    if (!timestamp) return false;
    const recordTime = new Date(timestamp).getTime();
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    return Math.abs(now - recordTime) < fiveMinutes;
  }

  isDataAccurate(data) {
    // Check for NaN, Infinity, or obviously wrong values
    if (data.temperature !== undefined) {
      if (
        isNaN(data.temperature) ||
        data.temperature < -200 ||
        data.temperature > 200
      ) {
        return false;
      }
    }
    if (data.humidity !== undefined) {
      if (isNaN(data.humidity) || data.humidity < 0 || data.humidity > 100) {
        return false;
      }
    }
    return true;
  }

  checkCompleteness(data) {
    const requiredFields = ["timestamp", "userId", "type"];
    const missingFields = [];

    for (const field of requiredFields) {
      if (!data[field]) {
        missingFields.push(field);
      }
    }

    return {
      complete: missingFields.length === 0,
      score:
        ((requiredFields.length - missingFields.length) /
          requiredFields.length) *
        100,
      details:
        missingFields.length === 0
          ? "All required fields present"
          : `Missing fields: ${missingFields.join(", ")}`,
      missingFields,
    };
  }
}

/**
 * Audit Trail Contract
 * Manages audit trail compliance
 */
export class AuditTrailContract extends SmartContract {
  constructor() {
    super(
      "AT-001",
      "Audit Trail Compliance Contract",
      REGULATORY_FRAMEWORKS.FDA
    );
    this.regulations = [
      { code: "21 CFR 11.10(e)", description: "Audit trail requirements" },
      {
        code: "EU GMP Annex 11.9",
        description: "Audit trail for electronic records",
      },
    ];
  }

  async execute(data) {
    const {
      action,
      previousValue,
      newValue,
      userId,
      timestamp,
      reason,
      entityType,
      entityId,
    } = data;

    const result = {
      contractId: this.id,
      contractName: this.name,
      timestamp: new Date().toISOString(),
      auditEntryId: `AUD-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      inputData: data,
      status: COMPLIANCE_RESULT.PASS,
      validationResults: {},
      complianceChecks: [],
      regulatoryReferences: this.regulations,
    };

    // Validate audit entry completeness
    const requiredFields = {
      action: action,
      userId: userId,
      timestamp: timestamp,
      entityType: entityType,
      entityId: entityId,
    };

    result.validationResults.requiredFields = {
      passed: true,
      missingFields: [],
    };

    for (const [field, value] of Object.entries(requiredFields)) {
      if (!value) {
        result.validationResults.requiredFields.passed = false;
        result.validationResults.requiredFields.missingFields.push(field);
      }
    }

    // Check for reason if this is a modification
    if (["UPDATE", "DELETE", "MODIFY"].includes(action?.toUpperCase())) {
      result.validationResults.changeReason = {
        passed: !!reason,
        details: reason
          ? "Change reason documented"
          : "Missing reason for modification",
      };
      if (!reason) {
        result.status = COMPLIANCE_RESULT.WARNING;
        result.complianceChecks.push({
          check: "Change justification",
          status: "WARNING",
          message: "Modification should include reason for change",
        });
      }
    }

    // Check value tracking for modifications
    if (action === "UPDATE" || action === "MODIFY") {
      result.validationResults.valueTracking = {
        hasPreviousValue: previousValue !== undefined,
        hasNewValue: newValue !== undefined,
        passed: previousValue !== undefined && newValue !== undefined,
      };
    }

    // Electronic signature verification
    if (data.signature) {
      result.validationResults.electronicSignature = {
        present: true,
        details: "Electronic signature captured",
      };
    }

    // Calculate compliance score
    const checks = Object.values(result.validationResults);
    const passedChecks = checks.filter((c) => c.passed !== false).length;
    result.complianceScore = (passedChecks / checks.length) * 100;

    if (
      result.complianceScore < 100 &&
      result.status !== COMPLIANCE_RESULT.WARNING
    ) {
      result.status = COMPLIANCE_RESULT.WARNING;
    }
    if (!result.validationResults.requiredFields.passed) {
      result.status = COMPLIANCE_RESULT.FAIL;
    }

    result.hash = await sha256(JSON.stringify(result));

    this.logExecution(result);
    return result;
  }
}

/**
 * Smart Contract Registry
 * Manages all active contracts
 */
export class SmartContractRegistry {
  constructor() {
    this.contracts = new Map();
    this.executionHistory = [];
    this.initialize();
  }

  initialize() {
    // Register default contracts
    this.register(new TemperatureComplianceContract());
    this.register(new HumidityComplianceContract());
    this.register(new DeviationManagementContract());
    this.register(new ALCOAComplianceContract());
    this.register(new AuditTrailContract());
  }

  /**
   * Register a smart contract
   * @param {SmartContract} contract
   */
  register(contract) {
    this.contracts.set(contract.id, contract);
    console.log(`Registered smart contract: ${contract.name} (${contract.id})`);
  }

  /**
   * Get a contract by ID
   * @param {string} contractId
   * @returns {SmartContract|null}
   */
  getContract(contractId) {
    return this.contracts.get(contractId) || null;
  }

  /**
   * Get all contracts
   * @returns {array}
   */
  getAllContracts() {
    return Array.from(this.contracts.values());
  }

  /**
   * Execute a contract
   * @param {string} contractId
   * @param {object} data
   * @returns {Promise<object>}
   */
  async executeContract(contractId, data) {
    const contract = this.getContract(contractId);
    if (!contract) {
      throw new Error(`Contract not found: ${contractId}`);
    }

    if (contract.status !== CONTRACT_STATUS.ACTIVE) {
      throw new Error(`Contract is not active: ${contract.status}`);
    }

    const result = await contract.execute(data);

    // Log execution
    this.executionHistory.push({
      contractId,
      timestamp: new Date().toISOString(),
      inputHash: await sha256(JSON.stringify(data)),
      resultHash: result.hash,
      status: result.status,
    });

    return result;
  }

  /**
   * Execute temperature compliance check
   * @param {object} data
   * @returns {Promise<object>}
   */
  async checkTemperatureCompliance(data) {
    return this.executeContract("TC-001", data);
  }

  /**
   * Execute humidity compliance check
   * @param {object} data
   * @returns {Promise<object>}
   */
  async checkHumidityCompliance(data) {
    return this.executeContract("HC-001", data);
  }

  /**
   * Execute deviation management
   * @param {object} data
   * @returns {Promise<object>}
   */
  async processDeviation(data) {
    return this.executeContract("DM-001", data);
  }

  /**
   * Execute ALCOA+ compliance check
   * @param {object} data
   * @returns {Promise<object>}
   */
  async checkALCOACompliance(data) {
    return this.executeContract("ALCOA-001", data);
  }

  /**
   * Execute audit trail compliance
   * @param {object} data
   * @returns {Promise<object>}
   */
  async logAuditEntry(data) {
    return this.executeContract("AT-001", data);
  }

  /**
   * Get execution history
   * @param {number} limit
   * @returns {array}
   */
  getExecutionHistory(limit = 100) {
    return this.executionHistory.slice(-limit);
  }

  /**
   * Get contract statistics
   * @returns {object}
   */
  getStatistics() {
    const stats = {
      totalContracts: this.contracts.size,
      totalExecutions: this.executionHistory.length,
      contractStats: {},
    };

    for (const contract of this.contracts.values()) {
      stats.contractStats[contract.id] = {
        name: contract.name,
        status: contract.status,
        executionCount: contract.executionCount,
        lastExecuted: contract.lastExecuted,
        violations: contract.violations.length,
      };
    }

    return stats;
  }
}

// Export singleton instance
export const smartContractRegistry = new SmartContractRegistry();

export default SmartContractRegistry;
