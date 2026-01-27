/**
 * Merkle Tree Implementation for Pharmaceutical Blockchain
 * Provides efficient verification of transaction integrity
 */

import { sha256, hashPair } from "./crypto";

/**
 * Merkle Tree class for transaction verification
 */
export class MerkleTree {
  constructor(transactions = []) {
    this.transactions = transactions;
    this.leaves = [];
    this.tree = [];
    this.root = "";
  }

  /**
   * Build the Merkle tree from transactions
   * @returns {Promise<string>} - The Merkle root
   */
  async build() {
    if (this.transactions.length === 0) {
      this.root = await sha256("EMPTY_MERKLE_ROOT");
      return this.root;
    }

    // Hash all transactions to create leaves
    this.leaves = await Promise.all(
      this.transactions.map((tx) => this.hashTransaction(tx))
    );

    // Build tree levels
    this.tree = [this.leaves];
    let currentLevel = this.leaves;

    while (currentLevel.length > 1) {
      const nextLevel = [];

      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right =
          i + 1 < currentLevel.length ? currentLevel[i + 1] : currentLevel[i];
        const parentHash = await hashPair(left, right);
        nextLevel.push(parentHash);
      }

      this.tree.push(nextLevel);
      currentLevel = nextLevel;
    }

    this.root = currentLevel[0];
    return this.root;
  }

  /**
   * Hash a transaction
   * @param {object} transaction
   * @returns {Promise<string>}
   */
  async hashTransaction(transaction) {
    const txData = {
      id: transaction.id,
      type: transaction.type,
      data: transaction.data,
      timestamp: transaction.timestamp,
      userId: transaction.userId,
      facilityId: transaction.facilityId,
    };
    return await sha256(txData);
  }

  /**
   * Get the Merkle root
   * @returns {string}
   */
  getRoot() {
    return this.root;
  }

  /**
   * Get proof for a transaction at given index
   * @param {number} index - Transaction index
   * @returns {object} - Merkle proof
   */
  getProof(index) {
    if (index < 0 || index >= this.leaves.length) {
      throw new Error("Transaction index out of range");
    }

    const proof = {
      leaf: this.leaves[index],
      path: [],
      indices: [],
      transactionIndex: index,
    };

    let currentIndex = index;

    for (let level = 0; level < this.tree.length - 1; level++) {
      const isRightNode = currentIndex % 2 === 1;
      const siblingIndex = isRightNode ? currentIndex - 1 : currentIndex + 1;

      if (siblingIndex < this.tree[level].length) {
        proof.path.push(this.tree[level][siblingIndex]);
        proof.indices.push(isRightNode ? 0 : 1); // 0 = sibling is left, 1 = sibling is right
      }

      currentIndex = Math.floor(currentIndex / 2);
    }

    return proof;
  }

  /**
   * Verify a Merkle proof
   * @param {object} proof - The proof to verify
   * @param {string} root - Expected Merkle root
   * @returns {Promise<boolean>}
   */
  async verifyProof(proof, root) {
    let computedHash = proof.leaf;

    for (let i = 0; i < proof.path.length; i++) {
      const sibling = proof.path[i];
      const siblingIsRight = proof.indices[i] === 1;

      if (siblingIsRight) {
        computedHash = await hashPair(computedHash, sibling);
      } else {
        computedHash = await hashPair(sibling, computedHash);
      }
    }

    return computedHash === root;
  }

  /**
   * Verify a transaction is in the tree
   * @param {object} transaction - Transaction to verify
   * @param {string} root - Expected Merkle root
   * @returns {Promise<object>} - Verification result
   */
  async verifyTransaction(transaction, root) {
    const txHash = await this.hashTransaction(transaction);
    const index = this.leaves.indexOf(txHash);

    if (index === -1) {
      return {
        verified: false,
        reason: "Transaction not found in tree",
      };
    }

    const proof = this.getProof(index);
    const isValid = await this.verifyProof(proof, root);

    return {
      verified: isValid,
      proof,
      transactionHash: txHash,
      merkleRoot: root,
    };
  }

  /**
   * Get tree visualization data
   * @returns {object}
   */
  getVisualization() {
    return {
      levels: this.tree.length,
      leaves: this.leaves.length,
      tree: this.tree.map((level, i) => ({
        level: i,
        nodes: level.map((hash) => hash.substring(0, 16) + "..."),
      })),
      root: this.root,
    };
  }
}

/**
 * Calculate Merkle root from transactions without building full tree
 * @param {array} transactions
 * @returns {Promise<string>}
 */
export async function calculateMerkleRoot(transactions) {
  const tree = new MerkleTree(transactions);
  return await tree.build();
}

/**
 * Create and return a complete Merkle tree with proofs
 * @param {array} transactions
 * @returns {Promise<object>}
 */
export async function createMerkleTreeWithProofs(transactions) {
  const tree = new MerkleTree(transactions);
  await tree.build();

  const proofs = transactions.map((_, index) => tree.getProof(index));

  return {
    root: tree.getRoot(),
    leaves: tree.leaves,
    proofs,
    visualization: tree.getVisualization(),
  };
}

export default MerkleTree;
