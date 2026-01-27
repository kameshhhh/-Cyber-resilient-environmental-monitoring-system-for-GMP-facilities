/**
 * Smart Contract Dashboard Component
 * Interface for viewing and executing regulatory smart contracts
 */

import React, { useState, useEffect, useCallback } from "react";
import { useSmartContracts } from "../../hooks/useBlockchain";
import "./SmartContractDashboard.css";

/**
 * Smart Contract Dashboard Main Component
 */
const SmartContractDashboard = () => {
  const {
    contracts,
    executionHistory,
    statistics,
    checkTemperatureCompliance,
    checkHumidityCompliance,
    processDeviation,
    checkALCOACompliance,
    refreshContracts,
    refreshStatistics,
  } = useSmartContracts();

  const [activeContract, setActiveContract] = useState(null);
  const [executionResult, setExecutionResult] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // Test data form state
  const [testForm, setTestForm] = useState({
    roomType: "cold_storage",
    roomId: "ROOM-001",
    temperature: 5,
    humidity: 45,
    userId: "QA_USER_001",
  });

  // Handle contract execution
  const handleExecuteContract = useCallback(
    async (contractId) => {
      setIsExecuting(true);
      setExecutionResult(null);

      try {
        let result;

        switch (contractId) {
          case "TC-001":
            result = await checkTemperatureCompliance(
              testForm.roomType,
              testForm.temperature,
              testForm.roomId
            );
            break;
          case "HC-001":
            result = await checkHumidityCompliance(
              testForm.roomType,
              testForm.humidity,
              testForm.roomId
            );
            break;
          case "DM-001":
            result = await processDeviation({
              deviationType: "temperature",
              severity: "major",
              parameter: "temperature",
              actualValue: testForm.temperature,
              expectedRange: { min: 2, max: 8 },
              roomId: testForm.roomId,
              timestamp: new Date().toISOString(),
              duration: 30 * 60 * 1000,
            });
            break;
          case "ALCOA-001":
            result = await checkALCOACompliance({
              timestamp: new Date().toISOString(),
              userId: testForm.userId,
              type: "sensor_reading",
              data: testForm,
              isOriginal: true,
            });
            break;
          default:
            throw new Error("Unknown contract");
        }

        setExecutionResult(result);
        refreshStatistics();
      } catch (error) {
        setExecutionResult({
          error: true,
          message: error.message,
        });
      } finally {
        setIsExecuting(false);
      }
    },
    [
      testForm,
      checkTemperatureCompliance,
      checkHumidityCompliance,
      processDeviation,
      checkALCOACompliance,
      refreshStatistics,
    ]
  );

  return (
    <div className="smart-contract-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-info">
          <h1>📜 Regulatory Smart Contracts</h1>
          <p>FDA 21 CFR Part 211 | EU GMP Annex 11 | WHO TRS 961 Compliance</p>
        </div>
        <button className="refresh-btn" onClick={refreshContracts}>
          🔄 Refresh
        </button>
      </header>

      {/* Statistics */}
      {statistics && (
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-value">{statistics.totalContracts}</span>
            <span className="stat-label">Active Contracts</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{statistics.totalExecutions}</span>
            <span className="stat-label">Total Executions</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {Object.values(statistics.contractStats || {}).reduce(
                (acc, c) => acc + c.violations,
                0
              )}
            </span>
            <span className="stat-label">Violations Detected</span>
          </div>
        </div>
      )}

      <div className="dashboard-content">
        {/* Contracts List */}
        <div className="contracts-panel">
          <h2>Available Contracts</h2>
          <div className="contracts-list">
            {contracts.map((contract) => (
              <div
                key={contract.id}
                className={`contract-card ${
                  activeContract?.id === contract.id ? "active" : ""
                }`}
                onClick={() => setActiveContract(contract)}
              >
                <div className="contract-header">
                  <span className="contract-id">{contract.id}</span>
                  <span className={`contract-status ${contract.status}`}>
                    {contract.status}
                  </span>
                </div>
                <h3>{contract.name}</h3>
                <div className="contract-meta">
                  <span className="framework">{contract.framework}</span>
                  <span className="executions">
                    {contract.executionCount} executions
                  </span>
                </div>
                {contract.violations > 0 && (
                  <div className="violations-badge">
                    ⚠️ {contract.violations} violations
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contract Details & Execution */}
        <div className="execution-panel">
          {activeContract ? (
            <>
              <div className="contract-details">
                <h2>{activeContract.name}</h2>
                <dl>
                  <dt>Contract ID</dt>
                  <dd>{activeContract.id}</dd>
                  <dt>Framework</dt>
                  <dd>{activeContract.framework}</dd>
                  <dt>Version</dt>
                  <dd>{activeContract.version}</dd>
                  <dt>Status</dt>
                  <dd className={activeContract.status}>
                    {activeContract.status}
                  </dd>
                  <dt>Execution Count</dt>
                  <dd>{activeContract.executionCount}</dd>
                  <dt>Last Executed</dt>
                  <dd>
                    {activeContract.lastExecuted
                      ? new Date(activeContract.lastExecuted).toLocaleString()
                      : "Never"}
                  </dd>
                </dl>
              </div>

              {/* Test Execution Form */}
              <div className="test-execution">
                <h3>Test Contract Execution</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Room Type</label>
                    <select
                      value={testForm.roomType}
                      onChange={(e) =>
                        setTestForm((prev) => ({
                          ...prev,
                          roomType: e.target.value,
                        }))
                      }
                    >
                      <option value="cold_storage">Cold Storage (2-8°C)</option>
                      <option value="controlled_room">
                        Controlled Room (20-25°C)
                      </option>
                      <option value="freezer">Freezer (-25 to -15°C)</option>
                      <option value="ambient">Ambient (15-30°C)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Room ID</label>
                    <input
                      type="text"
                      value={testForm.roomId}
                      onChange={(e) =>
                        setTestForm((prev) => ({
                          ...prev,
                          roomId: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Temperature (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={testForm.temperature}
                      onChange={(e) =>
                        setTestForm((prev) => ({
                          ...prev,
                          temperature: parseFloat(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Humidity (%RH)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={testForm.humidity}
                      onChange={(e) =>
                        setTestForm((prev) => ({
                          ...prev,
                          humidity: parseFloat(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>User ID</label>
                    <input
                      type="text"
                      value={testForm.userId}
                      onChange={(e) =>
                        setTestForm((prev) => ({
                          ...prev,
                          userId: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <button
                  className="execute-btn"
                  onClick={() => handleExecuteContract(activeContract.id)}
                  disabled={isExecuting}
                >
                  {isExecuting ? "⏳ Executing..." : "▶️ Execute Contract"}
                </button>
              </div>

              {/* Execution Result */}
              {executionResult && (
                <div
                  className={`execution-result ${
                    executionResult.error ? "error" : executionResult.status
                  }`}
                >
                  <h3>
                    {executionResult.error
                      ? "❌ Error"
                      : executionResult.status === "pass"
                      ? "✅ Compliance Passed"
                      : executionResult.status === "warning"
                      ? "⚠️ Warning"
                      : executionResult.status === "fail"
                      ? "❌ Compliance Failed"
                      : "📋 Result"}
                  </h3>

                  {executionResult.error ? (
                    <p>{executionResult.message}</p>
                  ) : (
                    <>
                      {/* Temperature/Humidity Results */}
                      {executionResult.specifications && (
                        <div className="spec-result">
                          <h4>Specifications</h4>
                          <p>
                            Range: {executionResult.specifications.min} -{" "}
                            {executionResult.specifications.max}{" "}
                            {executionResult.specifications.unit}
                          </p>
                        </div>
                      )}

                      {/* Details */}
                      {executionResult.details &&
                        executionResult.details.length > 0 && (
                          <div className="details-list">
                            <h4>Details</h4>
                            <ul>
                              {executionResult.details.map((detail, idx) => (
                                <li
                                  key={idx}
                                  className={detail.type?.toLowerCase()}
                                >
                                  <strong>{detail.type}:</strong>{" "}
                                  {detail.message}
                                  {detail.deviation && (
                                    <span className="deviation">
                                      {" "}
                                      (Deviation: {detail.deviation.toFixed(2)})
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                      {/* Corrective Actions */}
                      {executionResult.correctiveActions &&
                        executionResult.correctiveActions.length > 0 && (
                          <div className="corrective-actions">
                            <h4>Required Actions</h4>
                            <ul>
                              {executionResult.correctiveActions.map(
                                (action, idx) => (
                                  <li key={idx}>
                                    <span
                                      className={`priority ${action.priority?.toLowerCase()}`}
                                    >
                                      {action.priority}
                                    </span>
                                    <strong>{action.action}:</strong>{" "}
                                    {action.description}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}

                      {/* ALCOA+ Results */}
                      {executionResult.principleResults && (
                        <div className="alcoa-results">
                          <h4>
                            ALCOA+ Compliance (Score:{" "}
                            {executionResult.overallScore?.toFixed(0)}%)
                          </h4>
                          <div className="principles-grid">
                            {Object.entries(
                              executionResult.principleResults
                            ).map(([principle, data]) => (
                              <div
                                key={principle}
                                className={`principle ${
                                  data.passed ? "passed" : "failed"
                                }`}
                              >
                                <span className="principle-name">
                                  {principle.charAt(0).toUpperCase() +
                                    principle.slice(1)}
                                </span>
                                <span className="principle-status">
                                  {data.passed ? "✓" : "✗"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Deviation Classification */}
                      {executionResult.classification && (
                        <div className="classification">
                          <h4>Deviation Classification</h4>
                          <div
                            className={`class-badge ${executionResult.classification.level?.toLowerCase()}`}
                          >
                            {executionResult.classification.level}
                          </div>
                          <p>{executionResult.classification.description}</p>
                          <p>
                            Risk Score:{" "}
                            {executionResult.classification.riskScore}/10
                          </p>
                        </div>
                      )}

                      {/* Regulatory References */}
                      {executionResult.regulatoryReferences &&
                        executionResult.regulatoryReferences.length > 0 && (
                          <div className="regulatory-refs">
                            <h4>Regulatory References</h4>
                            <ul>
                              {executionResult.regulatoryReferences.map(
                                (ref, idx) => (
                                  <li key={idx}>
                                    <strong>{ref.code}:</strong>{" "}
                                    {ref.description}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}

                      {/* Hash */}
                      {executionResult.hash && (
                        <div className="result-hash">
                          <small>Result Hash: {executionResult.hash}</small>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="no-contract-selected">
              <div className="placeholder-icon">📜</div>
              <h3>Select a Contract</h3>
              <p>
                Choose a smart contract from the list to view details and
                execute compliance checks
              </p>
            </div>
          )}
        </div>

        {/* Execution History */}
        <div className="history-panel">
          <h2>Execution History</h2>
          {executionHistory.length === 0 ? (
            <div className="empty-history">
              <p>No executions yet</p>
            </div>
          ) : (
            <div className="history-list">
              {executionHistory
                .slice(-20)
                .reverse()
                .map((entry, idx) => (
                  <div key={idx} className={`history-entry ${entry.status}`}>
                    <div className="entry-header">
                      <span className="entry-contract">{entry.contractId}</span>
                      <span className={`entry-status ${entry.status}`}>
                        {entry.status}
                      </span>
                    </div>
                    <div className="entry-time">
                      {new Date(entry.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartContractDashboard;
