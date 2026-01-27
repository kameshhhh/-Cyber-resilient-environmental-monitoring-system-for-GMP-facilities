/**
 * Blockchain Explorer Component
 * Visual interface for exploring the pharmaceutical blockchain
 */

import React, { useState, useEffect, useCallback } from "react";
import { useBlockchain, useBlockchainMonitor } from "../../hooks/useBlockchain";
import "./BlockchainExplorer.css";

/**
 * Main Blockchain Explorer Component
 */
const BlockchainExplorer = () => {
  const {
    isInitialized,
    isLoading,
    error,
    chainSummary,
    latestBlock,
    pendingTransactions,
    recentBlocks,
    mineBlock,
    validateChain,
    verifyTransaction,
    getTransaction,
    getBlock,
    getChain,
    refreshSummary,
  } = useBlockchain();

  const chainHealth = useBlockchainMonitor({ pollingInterval: 10000 });

  const [activeTab, setActiveTab] = useState("overview");
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [validationResult, setValidationResult] = useState(null);
  const [isMining, setIsMining] = useState(false);

  // Handle chain validation
  const handleValidateChain = useCallback(async () => {
    const result = await validateChain();
    setValidationResult(result);
  }, [validateChain]);

  // Handle mining
  const handleMineBlock = useCallback(async () => {
    if (pendingTransactions.length === 0) {
      alert("No pending transactions to mine");
      return;
    }

    setIsMining(true);
    try {
      await mineBlock();
    } catch (err) {
      console.error("Mining error:", err);
    } finally {
      setIsMining(false);
    }
  }, [mineBlock, pendingTransactions.length]);

  // Handle search
  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) return;

    // Try to find block by number
    const blockNum = parseInt(searchQuery);
    if (!isNaN(blockNum)) {
      const block = getBlock(blockNum);
      if (block) {
        setSelectedBlock(block);
        setActiveTab("blocks");
        return;
      }
    }

    // Try to find transaction by ID
    const txData = getTransaction(searchQuery);
    if (txData) {
      setSelectedTransaction(txData);
      setActiveTab("transactions");
      return;
    }

    alert("Block or transaction not found");
  }, [searchQuery, getBlock, getTransaction]);

  // Handle transaction verification
  const handleVerifyTransaction = useCallback(
    async (txId) => {
      const result = await verifyTransaction(txId);
      alert(
        result.verified
          ? `✓ Transaction verified!\nMerkle proof validated against block #${result.blockNumber}`
          : `✗ Verification failed: ${result.reason}`
      );
    },
    [verifyTransaction]
  );

  if (isLoading) {
    return (
      <div className="blockchain-explorer loading">
        <div className="loader">
          <div className="spinner"></div>
          <p>Initializing Blockchain...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="blockchain-explorer error">
        <div className="error-message">
          <h3>⚠️ Blockchain Error</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="blockchain-explorer">
      {/* Header */}
      <header className="explorer-header">
        <div className="header-left">
          <h1>🔗 Pharmaceutical Blockchain Explorer</h1>
          <span className={`chain-status ${chainHealth.status}`}>
            {chainHealth.status === "healthy"
              ? "✓ Chain Valid"
              : "⚠️ " + chainHealth.status}
          </span>
        </div>
        <div className="header-right">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search block # or transaction ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <button onClick={handleSearch}>🔍</button>
          </div>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="quick-stats">
        <StatCard
          icon="📦"
          label="Total Blocks"
          value={chainSummary?.chainLength || 0}
        />
        <StatCard
          icon="📄"
          label="Transactions"
          value={chainSummary?.totalTransactions || 0}
        />
        <StatCard
          icon="⏳"
          label="Pending"
          value={pendingTransactions.length}
          highlight={pendingTransactions.length > 0}
        />
        <StatCard
          icon="⚡"
          label="Difficulty"
          value={chainSummary?.difficulty || 0}
        />
      </div>

      {/* Tab Navigation */}
      <nav className="explorer-tabs">
        <button
          className={activeTab === "overview" ? "active" : ""}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={activeTab === "blocks" ? "active" : ""}
          onClick={() => setActiveTab("blocks")}
        >
          Blocks
        </button>
        <button
          className={activeTab === "transactions" ? "active" : ""}
          onClick={() => setActiveTab("transactions")}
        >
          Transactions
        </button>
        <button
          className={activeTab === "pending" ? "active" : ""}
          onClick={() => setActiveTab("pending")}
        >
          Pending ({pendingTransactions.length})
        </button>
        <button
          className={activeTab === "validation" ? "active" : ""}
          onClick={() => setActiveTab("validation")}
        >
          Validation
        </button>
      </nav>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === "overview" && (
          <OverviewTab
            chainSummary={chainSummary}
            chainHealth={chainHealth}
            latestBlock={latestBlock}
            onValidate={handleValidateChain}
          />
        )}

        {activeTab === "blocks" && (
          <BlocksTab
            blocks={getChain()}
            selectedBlock={selectedBlock}
            onSelectBlock={setSelectedBlock}
          />
        )}

        {activeTab === "transactions" && (
          <TransactionsTab
            chainSummary={chainSummary}
            selectedTransaction={selectedTransaction}
            onVerify={handleVerifyTransaction}
            getChain={getChain}
          />
        )}

        {activeTab === "pending" && (
          <PendingTab
            transactions={pendingTransactions}
            onMine={handleMineBlock}
            isMining={isMining}
          />
        )}

        {activeTab === "validation" && (
          <ValidationTab
            validationResult={validationResult}
            onValidate={handleValidateChain}
            chainHealth={chainHealth}
          />
        )}
      </div>
    </div>
  );
};

/**
 * Stat Card Component
 */
const StatCard = ({ icon, label, value, highlight }) => (
  <div className={`stat-card ${highlight ? "highlight" : ""}`}>
    <span className="stat-icon">{icon}</span>
    <div className="stat-info">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  </div>
);

/**
 * Overview Tab Component
 */
const OverviewTab = ({
  chainSummary,
  chainHealth,
  latestBlock,
  onValidate,
}) => (
  <div className="overview-tab">
    <div className="overview-grid">
      {/* Chain Info */}
      <div className="info-card">
        <h3>📊 Chain Information</h3>
        <dl>
          <dt>Facility ID</dt>
          <dd>{chainSummary?.facilityId || "N/A"}</dd>
          <dt>Created</dt>
          <dd>
            {chainSummary?.createdAt
              ? new Date(chainSummary.createdAt).toLocaleString()
              : "N/A"}
          </dd>
          <dt>Last Updated</dt>
          <dd>
            {chainSummary?.lastUpdated
              ? new Date(chainSummary.lastUpdated).toLocaleString()
              : "N/A"}
          </dd>
          <dt>Chain Status</dt>
          <dd className={chainSummary?.chainStatus?.toLowerCase()}>
            {chainSummary?.chainStatus || "Unknown"}
          </dd>
        </dl>
      </div>

      {/* Latest Block */}
      <div className="info-card">
        <h3>📦 Latest Block</h3>
        {latestBlock ? (
          <dl>
            <dt>Block #</dt>
            <dd>{latestBlock.blockNumber}</dd>
            <dt>Hash</dt>
            <dd className="hash">
              {latestBlock.currentHash?.substring(0, 16)}...
            </dd>
            <dt>Transactions</dt>
            <dd>{latestBlock.transactions?.length || 0}</dd>
            <dt>Type</dt>
            <dd>{latestBlock.blockType}</dd>
            <dt>Mined At</dt>
            <dd>{new Date(latestBlock.timestamp).toLocaleString()}</dd>
          </dl>
        ) : (
          <p>No blocks yet</p>
        )}
      </div>

      {/* Transaction Types */}
      <div className="info-card">
        <h3>📈 Transaction Types</h3>
        {chainSummary?.transactionTypes ? (
          <ul className="tx-types">
            {Object.entries(chainSummary.transactionTypes).map(
              ([type, count]) => (
                <li key={type}>
                  <span className="type-name">{type}</span>
                  <span className="type-count">{count}</span>
                </li>
              )
            )}
          </ul>
        ) : (
          <p>No transactions yet</p>
        )}
      </div>

      {/* Health Monitor */}
      <div className="info-card">
        <h3>🏥 Chain Health</h3>
        <dl>
          <dt>Status</dt>
          <dd className={chainHealth.status}>
            {chainHealth.status === "healthy"
              ? "✓ Healthy"
              : "⚠️ " + chainHealth.status}
          </dd>
          <dt>Block Rate</dt>
          <dd>{chainHealth.blockRate}/sec</dd>
          <dt>Transaction Rate</dt>
          <dd>{chainHealth.transactionRate}/sec</dd>
          <dt>Last Validation</dt>
          <dd>
            {chainHealth.lastValidation
              ? new Date(chainHealth.lastValidation).toLocaleString()
              : "Never"}
          </dd>
        </dl>
        <button className="validate-btn" onClick={onValidate}>
          🔍 Validate Chain
        </button>
      </div>
    </div>
  </div>
);

/**
 * Blocks Tab Component
 */
const BlocksTab = ({ blocks, selectedBlock, onSelectBlock }) => (
  <div className="blocks-tab">
    <div className="blocks-list">
      <h3>All Blocks</h3>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Hash</th>
            <th>Transactions</th>
            <th>Type</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {[...blocks].reverse().map((block) => (
            <tr
              key={block.blockNumber}
              className={
                selectedBlock?.blockNumber === block.blockNumber
                  ? "selected"
                  : ""
              }
              onClick={() => onSelectBlock(block)}
            >
              <td>{block.blockNumber}</td>
              <td className="hash">{block.currentHash?.substring(0, 12)}...</td>
              <td>{block.transactions?.length || 0}</td>
              <td>
                <span className={`block-type ${block.blockType}`}>
                  {block.blockType}
                </span>
              </td>
              <td>{new Date(block.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {selectedBlock && (
      <div className="block-detail">
        <h3>Block #{selectedBlock.blockNumber} Details</h3>
        <div className="detail-content">
          <dl>
            <dt>Block Number</dt>
            <dd>{selectedBlock.blockNumber}</dd>
            <dt>Current Hash</dt>
            <dd className="hash full">{selectedBlock.currentHash}</dd>
            <dt>Previous Hash</dt>
            <dd className="hash full">{selectedBlock.previousHash}</dd>
            <dt>Merkle Root</dt>
            <dd className="hash full">{selectedBlock.merkleRoot}</dd>
            <dt>Nonce</dt>
            <dd>{selectedBlock.nonce}</dd>
            <dt>Difficulty</dt>
            <dd>{selectedBlock.difficulty}</dd>
            <dt>Mined By</dt>
            <dd>{selectedBlock.minedBy}</dd>
          </dl>

          <h4>Transactions ({selectedBlock.transactions?.length || 0})</h4>
          <ul className="block-transactions">
            {selectedBlock.transactions?.map((tx) => (
              <li key={tx.id}>
                <span className="tx-type">{tx.type}</span>
                <span className="tx-id">{tx.id}</span>
              </li>
            ))}
          </ul>

          {selectedBlock.complianceChecks?.length > 0 && (
            <>
              <h4>Compliance Checks</h4>
              <ul className="compliance-checks">
                {selectedBlock.complianceChecks.map((check, idx) => (
                  <li key={idx} className={check.passed ? "passed" : "failed"}>
                    {check.type}: {check.passed ? "✓ Passed" : "✗ Failed"}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    )}
  </div>
);

/**
 * Transactions Tab Component
 */
const TransactionsTab = ({
  chainSummary,
  selectedTransaction,
  onVerify,
  getChain,
}) => {
  const [allTransactions, setAllTransactions] = useState([]);

  useEffect(() => {
    const chain = getChain();
    const txs = [];
    chain.forEach((block) => {
      block.transactions.forEach((tx) => {
        txs.push({
          ...tx,
          blockNumber: block.blockNumber,
          blockHash: block.currentHash,
        });
      });
    });
    setAllTransactions(txs.reverse());
  }, [getChain, chainSummary]);

  return (
    <div className="transactions-tab">
      <div className="transactions-list">
        <h3>All Transactions</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Block</th>
              <th>Timestamp</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allTransactions.slice(0, 50).map((tx) => (
              <tr key={tx.id}>
                <td className="tx-id">{tx.id.substring(0, 20)}...</td>
                <td>
                  <span className={`tx-type-badge ${tx.type}`}>{tx.type}</span>
                </td>
                <td>#{tx.blockNumber}</td>
                <td>{new Date(tx.timestamp).toLocaleString()}</td>
                <td>
                  <button
                    className="verify-btn"
                    onClick={() => onVerify(tx.id)}
                    title="Verify with Merkle Proof"
                  >
                    ✓ Verify
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedTransaction && (
        <div className="transaction-detail">
          <h3>Transaction Details</h3>
          <pre>{JSON.stringify(selectedTransaction, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

/**
 * Pending Transactions Tab Component
 */
const PendingTab = ({ transactions, onMine, isMining }) => (
  <div className="pending-tab">
    <div className="pending-header">
      <h3>Pending Transactions ({transactions.length})</h3>
      <button
        className="mine-btn"
        onClick={onMine}
        disabled={isMining || transactions.length === 0}
      >
        {isMining ? "⛏️ Mining..." : "⛏️ Mine Block"}
      </button>
    </div>

    {transactions.length === 0 ? (
      <div className="empty-state">
        <p>No pending transactions</p>
        <small>
          Transactions will appear here before being mined into blocks
        </small>
      </div>
    ) : (
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Type</th>
            <th>Timestamp</th>
            <th>Data Preview</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id}>
              <td className="tx-id">{tx.id.substring(0, 20)}...</td>
              <td>
                <span className={`tx-type-badge ${tx.type}`}>{tx.type}</span>
              </td>
              <td>{new Date(tx.timestamp).toLocaleString()}</td>
              <td className="data-preview">
                {JSON.stringify(tx.data).substring(0, 50)}...
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

/**
 * Validation Tab Component
 */
const ValidationTab = ({ validationResult, onValidate, chainHealth }) => (
  <div className="validation-tab">
    <div className="validation-header">
      <h3>Chain Validation</h3>
      <button className="validate-btn" onClick={onValidate}>
        🔍 Run Full Validation
      </button>
    </div>

    {validationResult ? (
      <div
        className={`validation-result ${
          validationResult.isValid ? "valid" : "invalid"
        }`}
      >
        <h4>
          {validationResult.isValid
            ? "✅ Chain Integrity Verified"
            : "❌ Chain Integrity Compromised"}
        </h4>

        <dl>
          <dt>Total Blocks</dt>
          <dd>{validationResult.totalBlocks}</dd>
          <dt>Validated Blocks</dt>
          <dd>{validationResult.validatedBlocks}</dd>
          <dt>Validation Time</dt>
          <dd>{validationResult.validationTime}ms</dd>
        </dl>

        {validationResult.invalidBlocks?.length > 0 && (
          <div className="invalid-blocks">
            <h5>Invalid Blocks</h5>
            <ul>
              {validationResult.invalidBlocks.map((block, idx) => (
                <li key={idx}>
                  Block #{block.blockNumber}: {block.reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    ) : (
      <div className="validation-placeholder">
        <p>Click "Run Full Validation" to verify the entire blockchain</p>
        <small>
          This will verify hash linkage, Merkle roots, and Proof of Work for all
          blocks
        </small>
      </div>
    )}

    <div className="health-info">
      <h4>Real-time Health Monitor</h4>
      <dl>
        <dt>Current Status</dt>
        <dd className={chainHealth.status}>{chainHealth.status}</dd>
        <dt>Last Check</dt>
        <dd>
          {chainHealth.lastValidation
            ? new Date(chainHealth.lastValidation).toLocaleString()
            : "Never"}
        </dd>
        <dt>Chain Length</dt>
        <dd>{chainHealth.chainLength}</dd>
        <dt>Total Transactions</dt>
        <dd>{chainHealth.totalTransactions}</dd>
      </dl>
    </div>
  </div>
);

export default BlockchainExplorer;
