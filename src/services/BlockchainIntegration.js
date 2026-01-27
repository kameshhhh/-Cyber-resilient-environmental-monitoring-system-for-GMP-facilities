/**
 * Blockchain Integration Service
 * Automatically integrates room monitoring data with the blockchain
 */

import {
  pharmaBlockchain,
  CHAIN_STATUS,
} from "./blockchain/PharmaBlockchainService";
import {
  TransactionFactory,
  TRANSACTION_TYPES,
} from "./blockchain/TransactionFactory";
import { smartContractRegistry } from "./blockchain/RegulatorySmartContracts";

/**
 * Room type mapping for smart contracts
 */
const ROOM_TYPE_MAP = {
  "Cold Storage A": "cold_storage",
  "Cold Storage B": "cold_storage",
  "Controlled Room": "controlled_room",
  "Freezer Unit": "freezer",
  "Ambient Storage": "ambient",
};

/**
 * Blockchain Integration Service Class
 */
class BlockchainIntegrationService {
  constructor() {
    this.isInitialized = false;
    this.transactionFactory = null;
    this.recordingInterval = null;
    this.recordIntervalMs = 60000; // Record every minute
    this.rooms = [];
    this.previousStatus = {};
    this.deviationThresholds = {
      cold_storage: { tempMin: 2, tempMax: 8 },
      controlled_room: { tempMin: 20, tempMax: 25 },
      freezer: { tempMin: -25, tempMax: -15 },
      ambient: { tempMin: 15, tempMax: 30 },
    };
  }

  /**
   * Initialize the service
   * @param {string} facilityId
   */
  async initialize(facilityId = "PHARMA_FACILITY_001") {
    if (this.isInitialized) return;

    try {
      // Initialize blockchain
      await pharmaBlockchain.initialize();

      // Create transaction factory
      this.transactionFactory = new TransactionFactory(facilityId);

      this.isInitialized = true;
      console.log("Blockchain Integration Service initialized");

      return true;
    } catch (error) {
      console.error("Failed to initialize blockchain integration:", error);
      return false;
    }
  }

  /**
   * Start automatic recording
   * @param {function} getRooms - Function to get current room data
   * @param {number} intervalMs - Recording interval in milliseconds
   */
  startAutoRecording(getRooms, intervalMs = 60000) {
    if (this.recordingInterval) {
      this.stopAutoRecording();
    }

    this.recordIntervalMs = intervalMs;

    this.recordingInterval = setInterval(async () => {
      const rooms = getRooms();
      if (rooms && rooms.length > 0) {
        await this.recordRoomReadings(rooms);
      }
    }, intervalMs);

    console.log(`Auto recording started (interval: ${intervalMs}ms)`);
  }

  /**
   * Stop automatic recording
   */
  stopAutoRecording() {
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
      this.recordingInterval = null;
      console.log("Auto recording stopped");
    }
  }

  /**
   * Record current readings for all rooms
   * @param {array} rooms
   */
  async recordRoomReadings(rooms) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    for (const room of rooms) {
      try {
        // Get room type
        const roomType = ROOM_TYPE_MAP[room.name] || "ambient";

        // Get current readings
        const temperature =
          room.conditions?.temperature?.current ?? room.temperature;
        const humidity = room.conditions?.humidity?.current ?? room.humidity;
        const pressure =
          room.conditions?.pressureDifferential?.current ?? room.pressure ?? 0;

        // Record sensor readings
        if (temperature !== undefined) {
          await this.recordSensorReading(
            room.id,
            "temperature",
            temperature,
            "°C",
            room.name,
            roomType
          );
        }

        if (humidity !== undefined) {
          await this.recordSensorReading(
            room.id,
            "humidity",
            humidity,
            "%RH",
            room.name,
            roomType
          );
        }

        if (pressure !== undefined) {
          await this.recordSensorReading(
            room.id,
            "pressure",
            pressure,
            "Pa",
            room.name,
            roomType
          );
        }

        // Check for status changes
        if (this.previousStatus[room.id] !== room.status) {
          await this.recordStatusChange(
            room.id,
            this.previousStatus[room.id],
            room.status,
            room.name
          );
          this.previousStatus[room.id] = room.status;
        }

        // Run compliance checks via smart contracts
        await this.runComplianceChecks(
          room.id,
          roomType,
          temperature,
          humidity
        );

        // Check for deviations
        await this.checkForDeviations(room, roomType, temperature, humidity);
      } catch (error) {
        console.error(`Error recording data for room ${room.id}:`, error);
      }
    }

    // Auto-mine if we have enough pending transactions
    if (pharmaBlockchain.pendingTransactions.length >= 10) {
      console.log("Auto-mining block...");
      await pharmaBlockchain.mineBlock();
    }
  }

  /**
   * Record a sensor reading
   */
  async recordSensorReading(
    roomId,
    sensorType,
    value,
    unit,
    roomName,
    roomType
  ) {
    const tx = this.transactionFactory.createSensorReading(
      roomId,
      sensorType,
      value,
      unit,
      {
        roomName,
        roomType,
        source: "auto-recording",
      }
    );

    await pharmaBlockchain.addTransaction(tx);
  }

  /**
   * Record a status change
   */
  async recordStatusChange(roomId, previousStatus, newStatus, roomName) {
    const tx = this.transactionFactory.createRoomStatusChange(
      roomId,
      previousStatus || "unknown",
      newStatus,
      "Automatic status update from monitoring system",
      { roomName }
    );

    await pharmaBlockchain.addTransaction(tx);

    // Log audit entry
    await this.logAuditEntry("STATUS_CHANGE", roomId, {
      previousStatus,
      newStatus,
      roomName,
    });
  }

  /**
   * Run compliance checks via smart contracts
   */
  async runComplianceChecks(roomId, roomType, temperature, humidity) {
    try {
      // Temperature compliance
      if (temperature !== undefined) {
        const tempResult =
          await smartContractRegistry.checkTemperatureCompliance({
            roomType,
            temperature,
            timestamp: new Date().toISOString(),
            roomId,
          });

        if (tempResult.status === "fail") {
          await this.recordComplianceViolation(
            roomId,
            "temperature",
            tempResult
          );
        }
      }

      // Humidity compliance
      if (humidity !== undefined) {
        const humidResult = await smartContractRegistry.checkHumidityCompliance(
          {
            roomType,
            humidity,
            timestamp: new Date().toISOString(),
            roomId,
          }
        );

        if (humidResult.status === "fail") {
          await this.recordComplianceViolation(roomId, "humidity", humidResult);
        }
      }
    } catch (error) {
      console.error("Compliance check error:", error);
    }
  }

  /**
   * Record a compliance violation
   */
  async recordComplianceViolation(roomId, parameter, result) {
    const tx = this.transactionFactory.createComplianceCheck(
      result.contractId,
      parameter,
      "fail",
      result.details,
      {
        roomId,
        contractName: result.contractName,
        specifications: result.specifications,
        correctiveActions: result.correctiveActions,
      }
    );

    await pharmaBlockchain.addTransaction(tx);
  }

  /**
   * Check for deviations
   */
  async checkForDeviations(room, roomType, temperature, humidity) {
    const thresholds = this.deviationThresholds[roomType];
    if (!thresholds) return;

    // Temperature deviation check
    if (temperature !== undefined) {
      if (
        temperature < thresholds.tempMin ||
        temperature > thresholds.tempMax
      ) {
        const severity = this.calculateDeviationSeverity(
          temperature,
          thresholds.tempMin,
          thresholds.tempMax
        );

        const tx = this.transactionFactory.createDeviationTransaction(
          room.id,
          "environmental",
          "temperature",
          temperature,
          { min: thresholds.tempMin, max: thresholds.tempMax },
          severity,
          {
            roomName: room.name,
            roomType,
            deviation:
              temperature < thresholds.tempMin
                ? thresholds.tempMin - temperature
                : temperature - thresholds.tempMax,
          }
        );

        await pharmaBlockchain.addTransaction(tx);

        // Process through smart contract
        await smartContractRegistry.processDeviation({
          deviationType: "temperature",
          severity,
          parameter: "temperature",
          actualValue: temperature,
          expectedRange: { min: thresholds.tempMin, max: thresholds.tempMax },
          roomId: room.id,
          timestamp: new Date().toISOString(),
          duration: 0,
        });
      }
    }
  }

  /**
   * Calculate deviation severity
   */
  calculateDeviationSeverity(value, min, max) {
    const range = max - min;
    let deviation;

    if (value < min) {
      deviation = min - value;
    } else {
      deviation = value - max;
    }

    const deviationPercent = (deviation / range) * 100;

    if (deviationPercent > 50) return "critical";
    if (deviationPercent > 20) return "major";
    return "minor";
  }

  /**
   * Log an audit entry
   */
  async logAuditEntry(action, entityId, details) {
    try {
      await smartContractRegistry.logAuditEntry({
        action,
        entityType: "room",
        entityId,
        userId: "SYSTEM",
        timestamp: new Date().toISOString(),
        ...details,
      });
    } catch (error) {
      console.error("Audit logging error:", error);
    }
  }

  /**
   * Record an alert to blockchain
   * @param {object} alert
   */
  async recordAlert(alert) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const tx = this.transactionFactory.createAlertTransaction(
      alert.roomId,
      alert.type || "environmental",
      alert.severity || "warning",
      alert.message,
      {
        alertId: alert.id,
        parameter: alert.parameter,
        value: alert.value,
        threshold: alert.threshold,
      }
    );

    await pharmaBlockchain.addTransaction(tx);
    return tx.id;
  }

  /**
   * Get blockchain summary
   */
  async getSummary() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return await pharmaBlockchain.getSummary();
  }

  /**
   * Get chain validation status
   */
  async validateChain() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return await pharmaBlockchain.validateChain();
  }

  /**
   * Force mine a block
   */
  async mineBlock() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return await pharmaBlockchain.mineBlock();
  }

  /**
   * Get transactions for a specific room
   * @param {string} roomId
   * @param {number} limit
   */
  getTransactionsForRoom(roomId, limit = 50) {
    const chain = pharmaBlockchain.getChain();
    const transactions = [];

    for (const block of chain) {
      for (const tx of block.transactions) {
        if (tx.data?.roomId === roomId || tx.metadata?.roomId === roomId) {
          transactions.push({
            ...tx,
            blockNumber: block.blockNumber,
            blockHash: block.currentHash,
          });
        }
      }
    }

    return transactions.slice(-limit);
  }

  /**
   * Export audit trail for regulatory submission
   */
  async exportAuditTrail(options = {}) {
    const { startDate, endDate, roomId, transactionTypes } = options;

    const chain = pharmaBlockchain.getChain();
    const auditTrail = [];

    for (const block of chain) {
      const blockTime = new Date(block.timestamp);

      // Date filter
      if (startDate && blockTime < new Date(startDate)) continue;
      if (endDate && blockTime > new Date(endDate)) continue;

      for (const tx of block.transactions) {
        // Room filter
        if (
          roomId &&
          tx.data?.roomId !== roomId &&
          tx.metadata?.roomId !== roomId
        )
          continue;

        // Type filter
        if (
          transactionTypes &&
          transactionTypes.length > 0 &&
          !transactionTypes.includes(tx.type)
        )
          continue;

        auditTrail.push({
          transactionId: tx.id,
          type: tx.type,
          timestamp: tx.timestamp,
          blockNumber: block.blockNumber,
          blockHash: block.currentHash,
          merkleRoot: block.merkleRoot,
          data: tx.data,
          metadata: tx.metadata,
          regulatoryReferences: tx.regulatoryReferences,
          userId: tx.userId,
          facilityId: tx.facilityId,
          signature: tx.signature,
        });
      }
    }

    return {
      exportTimestamp: new Date().toISOString(),
      exportedBy: "SYSTEM",
      facilityId: pharmaBlockchain.facilityId,
      chainLength: chain.length,
      totalRecords: auditTrail.length,
      filters: options,
      auditTrail,
      chainValidation: await pharmaBlockchain.validateChain(),
    };
  }
}

// Export singleton instance
export const blockchainIntegration = new BlockchainIntegrationService();

export default BlockchainIntegrationService;
