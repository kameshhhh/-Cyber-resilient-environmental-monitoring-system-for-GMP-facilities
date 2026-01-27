/**
 * Blockchain Services Index
 * Central export for all blockchain-related services
 */

// Cryptographic utilities
export {
  sha256,
  generateKeyPair,
  signData,
  verifySignature,
  calculateBlockHash,
  exportPublicKey,
  exportPrivateKey,
  importPrivateKey,
  importPublicKey,
  generateNonce,
} from "./crypto";

// Merkle Tree implementation
export {
  MerkleTree,
  calculateMerkleRoot,
  createMerkleTreeWithProofs,
} from "./MerkleTree";

// Transaction Factory
export {
  TransactionFactory,
  TRANSACTION_TYPES,
  createTransactionId,
  REGULATORY_REFERENCES,
} from "./TransactionFactory";

// Core Blockchain Service
export {
  default as PharmaBlockchainService,
  pharmaBlockchain,
  CHAIN_STATUS,
  BLOCK_TYPES,
} from "./PharmaBlockchainService";

// Smart Contracts
export {
  SmartContractRegistry,
  smartContractRegistry,
  TemperatureComplianceContract,
  HumidityComplianceContract,
  DeviationManagementContract,
  ALCOAComplianceContract,
  AuditTrailContract,
  CONTRACT_STATUS,
  COMPLIANCE_RESULT,
  REGULATORY_FRAMEWORKS,
  STORAGE_SPECIFICATIONS,
} from "./RegulatorySmartContracts";
