/**
 * Blockchain Integration Hook
 * React hook for integrating blockchain with dashboard components
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  pharmaBlockchain,
  CHAIN_STATUS,
  BLOCK_TYPES,
} from "../services/blockchain/PharmaBlockchainService";
import {
  TransactionFactory,
  TRANSACTION_TYPES,
} from "../services/blockchain/TransactionFactory";
import { smartContractRegistry } from "../services/blockchain/RegulatorySmartContracts";

/**
 * Main blockchain hook
 * @returns {object} Blockchain state and methods
 */
export const useBlockchain = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chainSummary, setChainSummary] = useState(null);
  const [latestBlock, setLatestBlock] = useState(null);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [recentBlocks, setRecentBlocks] = useState([]);

  const transactionFactory = useRef(null);
  const unsubscribe = useRef(null);

  // Initialize blockchain
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        await pharmaBlockchain.initialize();

        transactionFactory.current = new TransactionFactory(
          "PHARMA_FACILITY_001"
        );

        // Subscribe to blockchain events
        unsubscribe.current = pharmaBlockchain.subscribe((event, data) => {
          switch (event) {
            case "newBlock":
              setLatestBlock(data);
              setRecentBlocks((prev) => [data, ...prev].slice(0, 10));
              refreshSummary();
              break;
            case "newTransaction":
              setPendingTransactions((prev) => [...prev, data]);
              break;
            case "initialized":
              refreshSummary();
              break;
            default:
              break;
          }
        });

        await refreshSummary();
        setIsInitialized(true);
        setError(null);
      } catch (err) {
        console.error("Blockchain initialization error:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    init();

    return () => {
      if (unsubscribe.current) {
        unsubscribe.current();
      }
    };
  }, []);

  // Refresh chain summary
  const refreshSummary = useCallback(async () => {
    try {
      const summary = await pharmaBlockchain.getSummary();
      setChainSummary(summary);
      setLatestBlock(summary.latestBlock);
      setPendingTransactions(pharmaBlockchain.pendingTransactions);

      // Get recent blocks
      const chain = pharmaBlockchain.getChain();
      setRecentBlocks(chain.slice(-10).reverse());
    } catch (err) {
      console.error("Error refreshing summary:", err);
    }
  }, []);

  // Record sensor reading
  const recordSensorReading = useCallback(
    async (roomId, sensorType, value, unit, metadata = {}) => {
      if (!isInitialized) {
        throw new Error("Blockchain not initialized");
      }

      const tx = transactionFactory.current.createSensorReading(
        roomId,
        sensorType,
        value,
        unit,
        metadata
      );

      const txId = await pharmaBlockchain.addTransaction(tx);
      await refreshSummary();
      return txId;
    },
    [isInitialized, refreshSummary]
  );

  // Record room status change
  const recordRoomStatusChange = useCallback(
    async (roomId, previousStatus, newStatus, reason, metadata = {}) => {
      if (!isInitialized) {
        throw new Error("Blockchain not initialized");
      }

      const tx = transactionFactory.current.createRoomStatusChange(
        roomId,
        previousStatus,
        newStatus,
        reason,
        metadata
      );

      const txId = await pharmaBlockchain.addTransaction(tx);
      await refreshSummary();
      return txId;
    },
    [isInitialized, refreshSummary]
  );

  // Record deviation
  const recordDeviation = useCallback(
    async (
      roomId,
      deviationType,
      parameter,
      actualValue,
      expectedRange,
      severity,
      metadata = {}
    ) => {
      if (!isInitialized) {
        throw new Error("Blockchain not initialized");
      }

      const tx = transactionFactory.current.createDeviationTransaction(
        roomId,
        deviationType,
        parameter,
        actualValue,
        expectedRange,
        severity,
        metadata
      );

      const txId = await pharmaBlockchain.addTransaction(tx);

      // Also process through smart contract
      await smartContractRegistry.processDeviation({
        deviationType,
        severity,
        parameter,
        actualValue,
        expectedRange,
        roomId,
        timestamp: tx.timestamp,
        duration: metadata.duration || 0,
      });

      await refreshSummary();
      return txId;
    },
    [isInitialized, refreshSummary]
  );

  // Record alert
  const recordAlert = useCallback(
    async (roomId, alertType, alertLevel, message, metadata = {}) => {
      if (!isInitialized) {
        throw new Error("Blockchain not initialized");
      }

      const tx = transactionFactory.current.createAlertTransaction(
        roomId,
        alertType,
        alertLevel,
        message,
        metadata
      );

      const txId = await pharmaBlockchain.addTransaction(tx);
      await refreshSummary();
      return txId;
    },
    [isInitialized, refreshSummary]
  );

  // Record compliance check
  const recordComplianceCheck = useCallback(
    async (checkType, scope, result, findings = [], metadata = {}) => {
      if (!isInitialized) {
        throw new Error("Blockchain not initialized");
      }

      const tx = transactionFactory.current.createComplianceCheck(
        checkType,
        scope,
        result,
        findings,
        metadata
      );

      const txId = await pharmaBlockchain.addTransaction(tx);
      await refreshSummary();
      return txId;
    },
    [isInitialized, refreshSummary]
  );

  // Mine pending transactions
  const mineBlock = useCallback(async () => {
    if (!isInitialized) {
      throw new Error("Blockchain not initialized");
    }

    const block = await pharmaBlockchain.mineBlock();
    await refreshSummary();
    return block;
  }, [isInitialized, refreshSummary]);

  // Validate chain
  const validateChain = useCallback(async () => {
    if (!isInitialized) {
      throw new Error("Blockchain not initialized");
    }

    return await pharmaBlockchain.validateChain();
  }, [isInitialized]);

  // Verify transaction
  const verifyTransaction = useCallback(
    async (transactionId) => {
      if (!isInitialized) {
        throw new Error("Blockchain not initialized");
      }

      return await pharmaBlockchain.verifyTransaction(transactionId);
    },
    [isInitialized]
  );

  // Get transaction by ID
  const getTransaction = useCallback(
    (transactionId) => {
      if (!isInitialized) return null;
      return pharmaBlockchain.getTransaction(transactionId);
    },
    [isInitialized]
  );

  // Get transactions by type
  const getTransactionsByType = useCallback(
    (type, limit = 100) => {
      if (!isInitialized) return [];
      return pharmaBlockchain.getTransactionsByType(type, limit);
    },
    [isInitialized]
  );

  // Get block by number
  const getBlock = useCallback(
    (blockNumber) => {
      if (!isInitialized) return null;
      return pharmaBlockchain.getBlock(blockNumber);
    },
    [isInitialized]
  );

  // Get full chain
  const getChain = useCallback(() => {
    if (!isInitialized) return [];
    return pharmaBlockchain.getChain();
  }, [isInitialized]);

  return {
    // State
    isInitialized,
    isLoading,
    error,
    chainSummary,
    latestBlock,
    pendingTransactions,
    recentBlocks,

    // Recording methods
    recordSensorReading,
    recordRoomStatusChange,
    recordDeviation,
    recordAlert,
    recordComplianceCheck,

    // Blockchain operations
    mineBlock,
    validateChain,
    verifyTransaction,

    // Query methods
    getTransaction,
    getTransactionsByType,
    getBlock,
    getChain,

    // Utilities
    refreshSummary,
    TRANSACTION_TYPES,
    CHAIN_STATUS,
    BLOCK_TYPES,
  };
};

/**
 * Smart contracts hook
 * @returns {object} Smart contract state and methods
 */
export const useSmartContracts = () => {
  const [contracts, setContracts] = useState([]);
  const [executionHistory, setExecutionHistory] = useState([]);
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    refreshContracts();
    refreshStatistics();
  }, []);

  const refreshContracts = useCallback(() => {
    const allContracts = smartContractRegistry.getAllContracts();
    setContracts(
      allContracts.map((c) => ({
        id: c.id,
        name: c.name,
        framework: c.framework,
        status: c.status,
        version: c.version,
        executionCount: c.executionCount,
        lastExecuted: c.lastExecuted,
        violations: c.violations.length,
      }))
    );
  }, []);

  const refreshStatistics = useCallback(() => {
    const stats = smartContractRegistry.getStatistics();
    setStatistics(stats);
    setExecutionHistory(smartContractRegistry.getExecutionHistory(50));
  }, []);

  // Check temperature compliance
  const checkTemperatureCompliance = useCallback(
    async (roomType, temperature, roomId) => {
      const result = await smartContractRegistry.checkTemperatureCompliance({
        roomType,
        temperature,
        timestamp: new Date().toISOString(),
        roomId,
      });
      refreshStatistics();
      return result;
    },
    [refreshStatistics]
  );

  // Check humidity compliance
  const checkHumidityCompliance = useCallback(
    async (roomType, humidity, roomId) => {
      const result = await smartContractRegistry.checkHumidityCompliance({
        roomType,
        humidity,
        timestamp: new Date().toISOString(),
        roomId,
      });
      refreshStatistics();
      return result;
    },
    [refreshStatistics]
  );

  // Process deviation
  const processDeviation = useCallback(
    async (deviationData) => {
      const result = await smartContractRegistry.processDeviation(
        deviationData
      );
      refreshStatistics();
      return result;
    },
    [refreshStatistics]
  );

  // Check ALCOA compliance
  const checkALCOACompliance = useCallback(
    async (data) => {
      const result = await smartContractRegistry.checkALCOACompliance(data);
      refreshStatistics();
      return result;
    },
    [refreshStatistics]
  );

  // Log audit entry
  const logAuditEntry = useCallback(
    async (auditData) => {
      const result = await smartContractRegistry.logAuditEntry(auditData);
      refreshStatistics();
      return result;
    },
    [refreshStatistics]
  );

  return {
    contracts,
    executionHistory,
    statistics,
    checkTemperatureCompliance,
    checkHumidityCompliance,
    processDeviation,
    checkALCOACompliance,
    logAuditEntry,
    refreshContracts,
    refreshStatistics,
  };
};

/**
 * Blockchain monitor hook for real-time updates
 * @param {object} options
 * @returns {object}
 */
export const useBlockchainMonitor = (options = {}) => {
  const { pollingInterval = 5000 } = options;

  const [chainHealth, setChainHealth] = useState({
    status: "unknown",
    lastValidation: null,
    blockRate: 0,
    transactionRate: 0,
  });

  const blockchain = useBlockchain();
  const lastBlockCount = useRef(0);
  const lastTxCount = useRef(0);

  useEffect(() => {
    if (!blockchain.isInitialized) return;

    const monitor = async () => {
      try {
        const validation = await blockchain.validateChain();
        const summary = blockchain.chainSummary;

        // Calculate rates
        const blockRate = summary
          ? (summary.chainLength - lastBlockCount.current) /
            (pollingInterval / 1000)
          : 0;
        const txRate = summary
          ? (summary.totalTransactions - lastTxCount.current) /
            (pollingInterval / 1000)
          : 0;

        lastBlockCount.current = summary?.chainLength || 0;
        lastTxCount.current = summary?.totalTransactions || 0;

        setChainHealth({
          status: validation.isValid ? "healthy" : "compromised",
          lastValidation: new Date().toISOString(),
          validationDetails: validation,
          blockRate: blockRate.toFixed(2),
          transactionRate: txRate.toFixed(2),
          chainLength: summary?.chainLength || 0,
          totalTransactions: summary?.totalTransactions || 0,
          pendingTransactions: summary?.pendingTransactions || 0,
        });
      } catch (error) {
        setChainHealth((prev) => ({
          ...prev,
          status: "error",
          error: error.message,
        }));
      }
    };

    const interval = setInterval(monitor, pollingInterval);
    monitor(); // Initial check

    return () => clearInterval(interval);
  }, [
    blockchain.isInitialized,
    blockchain.chainSummary,
    blockchain.validateChain,
    pollingInterval,
  ]);

  return chainHealth;
};

export default useBlockchain;
