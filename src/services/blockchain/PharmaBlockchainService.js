/**
 * Pharmaceutical Blockchain Service
 * Core blockchain implementation with mining, validation, and consensus
 */

import {
  sha256,
  calculateBlockHash,
  signData,
  verifySignature,
  generateKeyPair,
  exportPublicKey,
  exportPrivateKey,
  importPrivateKey,
  generateNonce,
} from "./crypto";
import { MerkleTree, calculateMerkleRoot } from "./MerkleTree";
import { TransactionFactory, TRANSACTION_TYPES } from "./TransactionFactory";

/**
 * Sync status constants
 */
export const CHAIN_STATUS = {
  VALID: "VALID",
  INVALID: "INVALID",
  SYNCING: "SYNCING",
  RECOVERING: "RECOVERING",
};

/**
 * Block types
 */
export const BLOCK_TYPES = {
  GENESIS: "genesis",
  DATA: "data",
  AUDIT: "audit",
  COMPLIANCE: "compliance",
  EMERGENCY: "emergency",
};

/**
 * IndexedDB database name and stores
 */
const DB_NAME = "PharmaBlockchain";
const DB_VERSION = 1;
const STORES = {
  CHAIN: "blockchain",
  PENDING: "pendingTransactions",
  KEYS: "cryptoKeys",
  CONFIG: "config",
};

/**
 * Pharmaceutical Blockchain Service Class
 */
class PharmaBlockchainService {
  constructor() {
    this.chain = [];
    this.pendingTransactions = [];
    this.difficulty = 3; // Number of leading zeros required
    this.blockSize = 10; // Transactions per block
    this.miningReward = 0; // No mining rewards for pharmaceutical use
    this.isInitialized = false;
    this.privateKey = null;
    this.publicKey = null;
    this.facilityId = "PHARMA_FACILITY_001";
    this.db = null;
    this.subscribers = [];
    this.transactionFactory = new TransactionFactory(this.facilityId);
  }

  /**
   * Initialize the blockchain
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Open IndexedDB
      await this.openDatabase();

      // Load or generate keys
      await this.loadOrGenerateKeys();

      // Load existing chain or create genesis
      const existingChain = await this.loadChainFromStorage();

      if (existingChain && existingChain.length > 0) {
        this.chain = existingChain;
        console.log(`Loaded blockchain with ${this.chain.length} blocks`);
      } else {
        await this.createGenesisBlock();
        console.log("Created new blockchain with genesis block");
      }

      // Load pending transactions
      await this.loadPendingTransactions();

      this.isInitialized = true;
      this.notifySubscribers("initialized", { chainLength: this.chain.length });
    } catch (error) {
      console.error("Blockchain initialization failed:", error);
      throw error;
    }
  }

  /**
   * Open IndexedDB database
   */
  async openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create stores
        if (!db.objectStoreNames.contains(STORES.CHAIN)) {
          const chainStore = db.createObjectStore(STORES.CHAIN, {
            keyPath: "blockNumber",
          });
          chainStore.createIndex("hash", "currentHash", { unique: true });
          chainStore.createIndex("timestamp", "timestamp", { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.PENDING)) {
          const pendingStore = db.createObjectStore(STORES.PENDING, {
            keyPath: "id",
          });
          pendingStore.createIndex("timestamp", "timestamp", { unique: false });
          pendingStore.createIndex("type", "type", { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.KEYS)) {
          db.createObjectStore(STORES.KEYS, { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains(STORES.CONFIG)) {
          db.createObjectStore(STORES.CONFIG, { keyPath: "key" });
        }
      };
    });
  }

  /**
   * Load or generate cryptographic keys
   */
  async loadOrGenerateKeys() {
    try {
      const transaction = this.db.transaction([STORES.KEYS], "readonly");
      const store = transaction.objectStore(STORES.KEYS);
      const request = store.get("facility-keys");

      const result = await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      if (result && result.privateKey) {
        this.privateKey = await importPrivateKey(result.privateKey);
        this.publicKey = result.publicKey;
        console.log("Loaded existing cryptographic keys");
      } else {
        await this.generateAndSaveKeys();
      }
    } catch (error) {
      console.error("Error loading keys:", error);
      await this.generateAndSaveKeys();
    }
  }

  /**
   * Generate and save new cryptographic keys
   */
  async generateAndSaveKeys() {
    const keyPair = await generateKeyPair();
    this.privateKey = keyPair.privateKey;
    this.publicKey = await exportPublicKey(keyPair.publicKey);

    const privateKeyExport = await exportPrivateKey(keyPair.privateKey);

    const transaction = this.db.transaction([STORES.KEYS], "readwrite");
    const store = transaction.objectStore(STORES.KEYS);

    await new Promise((resolve, reject) => {
      const request = store.put({
        id: "facility-keys",
        privateKey: privateKeyExport,
        publicKey: this.publicKey,
        createdAt: new Date().toISOString(),
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    console.log("Generated new cryptographic keys");
  }

  /**
   * Create the genesis block
   */
  async createGenesisBlock() {
    const genesisData = {
      message: "Pharmaceutical Storage Blockchain - Genesis Block",
      version: "1.0.0",
      facilityId: this.facilityId,
      createdAt: new Date().toISOString(),
      complianceFrameworks: [
        "FDA 21 CFR Part 211",
        "EU GMP Annex 11",
        "WHO TRS 961",
      ],
    };

    const genesisTransaction = {
      id: "genesis-tx-001",
      type: "system",
      data: genesisData,
      timestamp: new Date().toISOString(),
      userId: "SYSTEM",
      facilityId: this.facilityId,
      regulatoryReferences: [],
      metadata: { isGenesis: true },
    };

    const merkleRoot = await calculateMerkleRoot([genesisTransaction]);

    const genesisBlock = {
      blockNumber: 0,
      timestamp: new Date().toISOString(),
      previousHash: "0".repeat(64),
      transactions: [genesisTransaction],
      merkleRoot,
      nonce: 0,
      difficulty: 0,
      minedBy: "SYSTEM",
      facilityId: this.facilityId,
      blockType: BLOCK_TYPES.GENESIS,
      version: "1.0.0",
      complianceChecks: [],
      regulatoryStamp: {
        framework: "FDA 21 CFR Part 211",
        timestamp: new Date().toISOString(),
        valid: true,
      },
    };

    // Calculate hash
    genesisBlock.currentHash = await calculateBlockHash(genesisBlock);

    // Sign block
    genesisBlock.signature = await signData(
      genesisBlock.currentHash,
      this.privateKey
    );

    this.chain.push(genesisBlock);
    await this.saveBlockToStorage(genesisBlock);

    return genesisBlock;
  }

  /**
   * Add a transaction to the pending pool
   * @param {object} transaction
   * @returns {Promise<string>} Transaction ID
   */
  async addTransaction(transaction) {
    // Validate transaction
    const validation = await this.validateTransaction(transaction);
    if (!validation.valid) {
      throw new Error(`Invalid transaction: ${validation.reason}`);
    }

    // Sign transaction if not already signed
    if (!transaction.signature) {
      transaction.signature = await signData(
        JSON.stringify(transaction.data),
        this.privateKey
      );
    }

    // Add to pending pool
    this.pendingTransactions.push(transaction);
    await this.savePendingTransaction(transaction);

    // Notify subscribers
    this.notifySubscribers("newTransaction", transaction);

    // Auto-mine if we have enough transactions
    if (this.pendingTransactions.length >= this.blockSize) {
      await this.mineBlock();
    }

    return transaction.id;
  }

  /**
   * Validate a transaction
   * @param {object} transaction
   * @returns {Promise<object>}
   */
  async validateTransaction(transaction) {
    // Check required fields
    if (!transaction.id || !transaction.type || !transaction.timestamp) {
      return { valid: false, reason: "Missing required fields" };
    }

    // Check transaction type
    if (!Object.values(TRANSACTION_TYPES).includes(transaction.type)) {
      return { valid: false, reason: "Invalid transaction type" };
    }

    // Check for duplicate
    const isDuplicate =
      this.pendingTransactions.some((tx) => tx.id === transaction.id) ||
      this.chain.some((block) =>
        block.transactions.some((tx) => tx.id === transaction.id)
      );

    if (isDuplicate) {
      return { valid: false, reason: "Duplicate transaction" };
    }

    // Verify signature if present
    if (transaction.signature && transaction.signerPublicKey) {
      const isValid = await verifySignature(
        JSON.stringify(transaction.data),
        transaction.signature,
        transaction.signerPublicKey
      );
      if (!isValid) {
        return { valid: false, reason: "Invalid signature" };
      }
    }

    return { valid: true };
  }

  /**
   * Mine a new block
   * @param {string} minerAddress
   * @returns {Promise<object>} The mined block
   */
  async mineBlock(minerAddress = null) {
    if (this.pendingTransactions.length === 0) {
      console.log("No pending transactions to mine");
      return null;
    }

    const previousBlock = this.getLatestBlock();
    const blockNumber = previousBlock.blockNumber + 1;
    const transactions = this.pendingTransactions.slice(0, this.blockSize);

    // Calculate Merkle root
    const merkleRoot = await calculateMerkleRoot(transactions);

    // Prepare block data
    const blockData = {
      blockNumber,
      timestamp: new Date().toISOString(),
      previousHash: previousBlock.currentHash,
      transactions,
      merkleRoot,
      nonce: 0,
      difficulty: this.difficulty,
      minedBy: minerAddress || this.facilityId,
      facilityId: this.facilityId,
      blockType: this.determineBlockType(transactions),
      version: "1.0.0",
    };

    // Mine block (Proof of Work)
    console.log(`Mining block #${blockNumber}...`);
    const startTime = Date.now();
    let nonce = 0;
    let hash = "";
    const target = "0".repeat(this.difficulty);

    do {
      blockData.nonce = nonce;
      hash = await calculateBlockHash(blockData);

      if (hash.substring(0, this.difficulty) === target) {
        break;
      }

      nonce++;

      // Yield to prevent blocking
      if (nonce % 1000 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    } while (true);

    const miningTime = Date.now() - startTime;
    console.log(`Block mined in ${miningTime}ms with nonce ${nonce}`);

    // Finalize block
    const newBlock = {
      ...blockData,
      currentHash: hash,
      complianceChecks: await this.runComplianceChecks(transactions),
      regulatoryStamp: {
        framework: "FDA 21 CFR Part 211",
        timestamp: new Date().toISOString(),
        valid: true,
      },
    };

    // Sign block
    newBlock.signature = await signData(newBlock.currentHash, this.privateKey);

    // Add to chain
    this.chain.push(newBlock);

    // Remove mined transactions from pending
    const minedTxIds = new Set(transactions.map((tx) => tx.id));
    this.pendingTransactions = this.pendingTransactions.filter(
      (tx) => !minedTxIds.has(tx.id)
    );

    // Save to storage
    await this.saveBlockToStorage(newBlock);
    await this.clearMinedTransactions(minedTxIds);

    // Notify subscribers
    this.notifySubscribers("newBlock", newBlock);

    // Log audit event
    await this.logBlockMiningEvent(newBlock, miningTime);

    return newBlock;
  }

  /**
   * Determine block type based on transactions
   * @param {array} transactions
   * @returns {string}
   */
  determineBlockType(transactions) {
    const types = transactions.map((tx) => tx.type);

    if (types.includes("deviation") || types.includes("alert")) {
      return BLOCK_TYPES.EMERGENCY;
    }
    if (types.includes("audit") || types.includes("compliance_check")) {
      return BLOCK_TYPES.AUDIT;
    }
    if (types.every((t) => t === "compliance_check")) {
      return BLOCK_TYPES.COMPLIANCE;
    }
    return BLOCK_TYPES.DATA;
  }

  /**
   * Run compliance checks on transactions
   * @param {array} transactions
   * @returns {Promise<array>}
   */
  async runComplianceChecks(transactions) {
    const checks = [];

    for (const tx of transactions) {
      // ALCOA+ check
      const alcoaCheck = {
        type: "ALCOA+",
        transaction: tx.id,
        attributable: !!tx.userId,
        legible: true,
        contemporaneous: this.isTimestampRecent(tx.timestamp),
        original: true,
        accurate: true,
        complete: !!tx.data && Object.keys(tx.data).length > 0,
        consistent: true,
        enduring: true,
        available: true,
        passed: true,
      };

      alcoaCheck.passed =
        alcoaCheck.attributable &&
        alcoaCheck.contemporaneous &&
        alcoaCheck.complete;

      checks.push(alcoaCheck);

      // Regulatory reference check
      if (tx.regulatoryReferences && tx.regulatoryReferences.length > 0) {
        checks.push({
          type: "REGULATORY_REFERENCE",
          transaction: tx.id,
          references: tx.regulatoryReferences,
          verified: true,
        });
      }
    }

    return checks;
  }

  /**
   * Check if timestamp is recent (within 24 hours)
   * @param {string} timestamp
   * @returns {boolean}
   */
  isTimestampRecent(timestamp) {
    const txTime = new Date(timestamp).getTime();
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    return now - txTime < twentyFourHours;
  }

  /**
   * Validate the entire blockchain
   * @returns {Promise<object>}
   */
  async validateChain() {
    const result = {
      isValid: true,
      totalBlocks: this.chain.length,
      validatedBlocks: 0,
      invalidBlocks: [],
      validationTime: 0,
      details: [],
    };

    const startTime = Date.now();

    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // Check hash linkage
      if (currentBlock.previousHash !== previousBlock.currentHash) {
        result.isValid = false;
        result.invalidBlocks.push({
          blockNumber: currentBlock.blockNumber,
          reason: "Hash linkage broken",
          expected: previousBlock.currentHash,
          actual: currentBlock.previousHash,
        });
        continue;
      }

      // Verify block hash
      const calculatedHash = await calculateBlockHash(currentBlock);
      if (calculatedHash !== currentBlock.currentHash) {
        result.isValid = false;
        result.invalidBlocks.push({
          blockNumber: currentBlock.blockNumber,
          reason: "Block hash mismatch",
          expected: currentBlock.currentHash,
          actual: calculatedHash,
        });
        continue;
      }

      // Verify Merkle root
      const calculatedMerkle = await calculateMerkleRoot(
        currentBlock.transactions
      );
      if (calculatedMerkle !== currentBlock.merkleRoot) {
        result.isValid = false;
        result.invalidBlocks.push({
          blockNumber: currentBlock.blockNumber,
          reason: "Merkle root mismatch",
          expected: currentBlock.merkleRoot,
          actual: calculatedMerkle,
        });
        continue;
      }

      // Verify Proof of Work
      const target = "0".repeat(currentBlock.difficulty);
      if (!currentBlock.currentHash.startsWith(target)) {
        result.isValid = false;
        result.invalidBlocks.push({
          blockNumber: currentBlock.blockNumber,
          reason: "Invalid Proof of Work",
          difficulty: currentBlock.difficulty,
        });
        continue;
      }

      result.validatedBlocks++;
    }

    result.validationTime = Date.now() - startTime;
    result.details.push({
      message: result.isValid
        ? "Chain integrity verified"
        : "Chain integrity compromised",
      timestamp: new Date().toISOString(),
    });

    return result;
  }

  /**
   * Get the latest block
   * @returns {object}
   */
  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Get the full chain
   * @returns {array}
   */
  getChain() {
    return [...this.chain];
  }

  /**
   * Get chain length
   * @returns {number}
   */
  getChainLength() {
    return this.chain.length;
  }

  /**
   * Get block by number
   * @param {number} blockNumber
   * @returns {object|null}
   */
  getBlock(blockNumber) {
    return (
      this.chain.find((block) => block.blockNumber === blockNumber) || null
    );
  }

  /**
   * Get block by hash
   * @param {string} hash
   * @returns {object|null}
   */
  getBlockByHash(hash) {
    return this.chain.find((block) => block.currentHash === hash) || null;
  }

  /**
   * Get transaction by ID
   * @param {string} transactionId
   * @returns {object|null}
   */
  getTransaction(transactionId) {
    for (const block of this.chain) {
      const tx = block.transactions.find((t) => t.id === transactionId);
      if (tx) {
        return {
          transaction: tx,
          blockNumber: block.blockNumber,
          blockHash: block.currentHash,
        };
      }
    }
    return null;
  }

  /**
   * Get transactions by type
   * @param {string} type
   * @param {number} limit
   * @returns {array}
   */
  getTransactionsByType(type, limit = 100) {
    const transactions = [];

    for (
      let i = this.chain.length - 1;
      i >= 0 && transactions.length < limit;
      i--
    ) {
      const block = this.chain[i];
      for (const tx of block.transactions) {
        if (tx.type === type && transactions.length < limit) {
          transactions.push({
            ...tx,
            blockNumber: block.blockNumber,
            blockHash: block.currentHash,
          });
        }
      }
    }

    return transactions;
  }

  /**
   * Verify a transaction with Merkle proof
   * @param {string} transactionId
   * @returns {Promise<object>}
   */
  async verifyTransaction(transactionId) {
    const txData = this.getTransaction(transactionId);

    if (!txData) {
      return {
        verified: false,
        reason: "Transaction not found",
      };
    }

    const block = this.getBlock(txData.blockNumber);
    const merkleTree = new MerkleTree(block.transactions);
    await merkleTree.build();

    const txIndex = block.transactions.findIndex(
      (tx) => tx.id === transactionId
    );
    const proof = merkleTree.getProof(txIndex);
    const isValid = await merkleTree.verifyProof(proof, block.merkleRoot);

    return {
      verified: isValid,
      transaction: txData.transaction,
      blockNumber: txData.blockNumber,
      blockHash: block.currentHash,
      merkleProof: proof,
      merkleRoot: block.merkleRoot,
    };
  }

  /**
   * Get blockchain summary
   * @returns {Promise<object>}
   */
  async getSummary() {
    const validation = await this.validateChain();

    let totalTransactions = 0;
    const transactionTypes = {};

    for (const block of this.chain) {
      totalTransactions += block.transactions.length;
      for (const tx of block.transactions) {
        transactionTypes[tx.type] = (transactionTypes[tx.type] || 0) + 1;
      }
    }

    return {
      chainLength: this.chain.length,
      totalTransactions,
      pendingTransactions: this.pendingTransactions.length,
      latestBlock: this.getLatestBlock(),
      chainStatus: validation.isValid
        ? CHAIN_STATUS.VALID
        : CHAIN_STATUS.INVALID,
      transactionTypes,
      difficulty: this.difficulty,
      facilityId: this.facilityId,
      createdAt: this.chain[0]?.timestamp,
      lastUpdated: this.getLatestBlock()?.timestamp,
    };
  }

  // Storage methods
  async saveBlockToStorage(block) {
    const transaction = this.db.transaction([STORES.CHAIN], "readwrite");
    const store = transaction.objectStore(STORES.CHAIN);

    return new Promise((resolve, reject) => {
      const request = store.put(block);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async loadChainFromStorage() {
    const transaction = this.db.transaction([STORES.CHAIN], "readonly");
    const store = transaction.objectStore(STORES.CHAIN);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const blocks = request.result.sort(
          (a, b) => a.blockNumber - b.blockNumber
        );
        resolve(blocks);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async savePendingTransaction(tx) {
    const transaction = this.db.transaction([STORES.PENDING], "readwrite");
    const store = transaction.objectStore(STORES.PENDING);

    return new Promise((resolve, reject) => {
      const request = store.put(tx);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async loadPendingTransactions() {
    const transaction = this.db.transaction([STORES.PENDING], "readonly");
    const store = transaction.objectStore(STORES.PENDING);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        this.pendingTransactions = request.result;
        resolve(this.pendingTransactions);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearMinedTransactions(txIds) {
    const transaction = this.db.transaction([STORES.PENDING], "readwrite");
    const store = transaction.objectStore(STORES.PENDING);

    for (const txId of txIds) {
      store.delete(txId);
    }
  }

  async logBlockMiningEvent(block, miningTime) {
    const auditTx = this.transactionFactory.createAuditTransaction(
      `mining-${block.blockNumber}`,
      "complete",
      {
        auditType: "system",
        scope: "block_mining",
        blockNumber: block.blockNumber,
        blockHash: block.currentHash,
        miningTime,
        transactionCount: block.transactions.length,
      }
    );

    // Don't add to pending to avoid infinite loop
    console.log("Block mining logged:", auditTx.id);
  }

  // Subscription methods
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  }

  notifySubscribers(event, data) {
    this.subscribers.forEach((callback) => {
      try {
        callback(event, data);
      } catch (error) {
        console.error("Subscriber notification error:", error);
      }
    });
  }
}

// Export singleton instance
export const pharmaBlockchain = new PharmaBlockchainService();

export default PharmaBlockchainService;
