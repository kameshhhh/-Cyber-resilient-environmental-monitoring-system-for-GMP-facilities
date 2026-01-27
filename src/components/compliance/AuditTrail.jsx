import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FaPlay,
  FaPause,
  FaDownload,
  FaSearch,
  FaCheckCircle,
  FaTimesCircle,
  FaLock,
  FaUserShield,
  FaHistory,
} from "react-icons/fa";

/**
 * Calculate SHA-256 hash (simplified for demo)
 */
const calculateHash = (data) => {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, "0");
};

/**
 * Audit Stream Entry Component
 */
const AuditStreamEntry = ({ entry, isNew, onInspect }) => {
  const actionColors = {
    DATA_MODIFICATION: "bg-blue-100 text-blue-700",
    SETPOINT_CHANGE: "bg-purple-100 text-purple-700",
    CALIBRATION: "bg-green-100 text-green-700",
    OVERRIDE: "bg-red-100 text-red-700",
    REPORT_GENERATION: "bg-yellow-100 text-yellow-700",
    LOGIN: "bg-gray-100 text-gray-700",
    LOGOUT: "bg-gray-100 text-gray-700",
    ALERT_ACKNOWLEDGE: "bg-orange-100 text-orange-700",
    THRESHOLD_CHANGE: "bg-pink-100 text-pink-700",
    DEVIATION_CREATED: "bg-red-100 text-red-700",
    CAPA_INITIATED: "bg-amber-100 text-amber-700",
  };

  return (
    <div
      className={`flex items-start space-x-3 p-3 rounded-lg transition-all duration-300 ${
        isNew ? "bg-blue-50 border-l-4 border-blue-500" : "hover:bg-gray-50"
      }`}
    >
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
          actionColors[entry.action] || "bg-gray-100 text-gray-700"
        }`}
      >
        <FaHistory className="text-sm" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${
              actionColors[entry.action] || "bg-gray-100 text-gray-700"
            }`}
          >
            {entry.action.replace(/_/g, " ")}
          </span>
          {isNew && (
            <span className="px-2 py-0.5 bg-blue-500 text-white rounded text-xs animate-pulse">
              NEW
            </span>
          )}
        </div>
        <p className="text-sm text-gray-800 mt-1">{entry.details}</p>
        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
          <span className="flex items-center space-x-1">
            <FaUserShield />
            <span>{entry.userName}</span>
          </span>
          <span>{new Date(entry.timestamp).toLocaleString()}</span>
          <span className="font-mono text-gray-400">{entry.ipAddress}</span>
        </div>
      </div>
      <button
        onClick={() => onInspect(entry)}
        className="flex-shrink-0 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
      >
        <FaSearch />
      </button>
    </div>
  );
};

/**
 * Audit Table Row Component
 */
const AuditTableRow = ({ entry }) => {
  const [verificationStatus, setVerificationStatus] = useState(null);

  const handleVerify = async () => {
    setVerificationStatus("verifying");
    await new Promise((resolve) => setTimeout(resolve, 500));
    setVerificationStatus(entry.isValid ? "valid" : "invalid");
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 text-xs text-gray-600 font-mono">
        {new Date(entry.timestamp).toISOString()}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-blue-700">
              {entry.userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">
              {entry.userName}
            </p>
            <p className="text-xs text-gray-500">{entry.userId}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            entry.action.includes("OVERRIDE") ||
            entry.action.includes("DEVIATION")
              ? "bg-red-100 text-red-700"
              : entry.action.includes("CALIBRATION")
              ? "bg-green-100 text-green-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {entry.action.replace(/_/g, " ")}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
        {entry.details}
      </td>
      <td className="px-4 py-3 text-xs text-gray-500 font-mono">
        {entry.ipAddress}
      </td>
      <td className="px-4 py-3 text-xs text-gray-400 font-mono truncate max-w-24">
        {entry.hash?.substring(0, 12)}...
      </td>
      <td className="px-4 py-3">
        <button
          onClick={handleVerify}
          disabled={verificationStatus === "verifying"}
          className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
            verificationStatus === "valid"
              ? "bg-green-100 text-green-700"
              : verificationStatus === "invalid"
              ? "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {verificationStatus === "verifying" ? (
            <span className="animate-spin">⟳</span>
          ) : verificationStatus === "valid" ? (
            <FaCheckCircle />
          ) : verificationStatus === "invalid" ? (
            <FaTimesCircle />
          ) : (
            <FaLock />
          )}
          <span>
            {verificationStatus === "verifying"
              ? "Verifying..."
              : verificationStatus === "valid"
              ? "Valid"
              : verificationStatus === "invalid"
              ? "Invalid"
              : "Verify"}
          </span>
        </button>
      </td>
    </tr>
  );
};

/**
 * Blockchain Block Component
 */
const BlockchainBlock = ({ entry, index, previousHash, isValid }) => {
  return (
    <div className="relative">
      {index > 0 && (
        <div className="absolute -left-8 top-1/2 w-8 h-0.5 bg-gray-300" />
      )}

      <div
        className={`w-32 p-3 rounded-lg border-2 ${
          isValid ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gray-700">
            Block #{index}
          </span>
          {isValid ? (
            <FaCheckCircle className="text-green-500 text-sm" />
          ) : (
            <FaTimesCircle className="text-red-500 text-sm" />
          )}
        </div>

        <div className="space-y-1">
          <div>
            <p className="text-xs text-gray-500">Hash</p>
            <p className="text-xs font-mono text-gray-700 truncate">
              {entry.hash?.substring(0, 8)}...
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Prev</p>
            <p className="text-xs font-mono text-gray-700 truncate">
              {previousHash === "Genesis"
                ? "Genesis"
                : previousHash?.substring(0, 8) + "..."}
            </p>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-600 truncate">{entry.action}</p>
          <p className="text-xs text-gray-400">
            {new Date(entry.timestamp).toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Main Audit Trail Component
 */
const AuditTrail = ({ roomId }) => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [liveStream, setLiveStream] = useState([]);
  const [isStreaming, setIsStreaming] = useState(true);
  const [filters, setFilters] = useState({
    user: "all",
    action: "all",
    dateRange: "today",
  });
  const [selectedEntry, setSelectedEntry] = useState(null);
  const streamRef = useRef(null);

  // Generate mock audit entries
  const generateMockEntry = useCallback(() => {
    const actions = [
      "DATA_MODIFICATION",
      "SETPOINT_CHANGE",
      "CALIBRATION",
      "ALERT_ACKNOWLEDGE",
      "REPORT_GENERATION",
      "THRESHOLD_CHANGE",
      "LOGIN",
    ];
    const users = [
      { id: "USR001", name: "John Smith" },
      { id: "USR002", name: "Jane Doe" },
      { id: "USR003", name: "Bob Johnson" },
      { id: "SYSTEM", name: "System" },
    ];

    const action = actions[Math.floor(Math.random() * actions.length)];
    const user = users[Math.floor(Math.random() * users.length)];

    const details = {
      DATA_MODIFICATION: "Updated temperature reading from 5.2°C to 5.3°C",
      SETPOINT_CHANGE: "Changed temperature setpoint from 5.0°C to 5.5°C",
      CALIBRATION: "Completed sensor calibration - Deviation: 0.1°C",
      ALERT_ACKNOWLEDGE: "Acknowledged high humidity alert",
      REPORT_GENERATION: "Generated daily compliance report",
      THRESHOLD_CHANGE: "Modified alert threshold from 8.0°C to 7.5°C",
      LOGIN: "User logged in from dashboard",
    };

    const entry = {
      id: `AUD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      action,
      userId: user.id,
      userName: user.name,
      details: details[action],
      ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
      previousHash: auditLogs.length > 0 ? auditLogs[0].hash : "GENESIS",
      roomId,
      isValid: true,
    };

    entry.hash = calculateHash(entry);
    return entry;
  }, [roomId, auditLogs]);

  // Initialize with mock data
  useEffect(() => {
    const initialEntries = [];
    for (let i = 0; i < 50; i++) {
      const entry = {
        id: `AUD-${Date.now() - i * 60000}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        timestamp: new Date(Date.now() - i * 60000).toISOString(),
        action: [
          "DATA_MODIFICATION",
          "SETPOINT_CHANGE",
          "CALIBRATION",
          "ALERT_ACKNOWLEDGE",
          "REPORT_GENERATION",
        ][Math.floor(Math.random() * 5)],
        userId: ["USR001", "USR002", "USR003", "SYSTEM"][
          Math.floor(Math.random() * 4)
        ],
        userName: ["John Smith", "Jane Doe", "Bob Johnson", "System"][
          Math.floor(Math.random() * 4)
        ],
        details: "Historical audit entry",
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        previousHash: i > 0 ? initialEntries[i - 1]?.hash : "GENESIS",
        roomId,
        isValid: true,
      };
      entry.hash = calculateHash(entry);
      initialEntries.push(entry);
    }
    setAuditLogs(initialEntries);
    setLiveStream(initialEntries.slice(0, 10));
  }, [roomId]);

  // Simulate real-time stream
  useEffect(() => {
    if (isStreaming) {
      streamRef.current = setInterval(() => {
        const newEntry = generateMockEntry();
        setAuditLogs((prev) => [newEntry, ...prev.slice(0, 999)]);
        setLiveStream((prev) => [newEntry, ...prev.slice(0, 49)]);
      }, 5000);
    }

    return () => {
      if (streamRef.current) {
        clearInterval(streamRef.current);
      }
    };
  }, [isStreaming, generateMockEntry]);

  // Filter audit logs
  const filteredLogs = auditLogs.filter((entry) => {
    if (filters.user !== "all" && entry.userId !== filters.user) return false;
    if (filters.action !== "all" && entry.action !== filters.action)
      return false;
    return true;
  });

  // Get unique users
  const uniqueUsers = [
    ...new Map(
      auditLogs.map((e) => [e.userId, { id: e.userId, name: e.userName }])
    ).values(),
  ];

  // Validate chain integrity
  const validateChain = useCallback(() => {
    for (let i = 1; i < auditLogs.length; i++) {
      if (auditLogs[i].previousHash !== auditLogs[i - 1].hash) {
        return false;
      }
    }
    return true;
  }, [auditLogs]);

  const handleExport = useCallback(() => {
    const csv = [
      ["Timestamp", "User", "Action", "Details", "IP Address", "Hash"].join(
        ","
      ),
      ...auditLogs.map((e) =>
        [
          e.timestamp,
          e.userName,
          e.action,
          `"${e.details}"`,
          e.ipAddress,
          e.hash,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_trail_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [auditLogs]);

  return (
    <div className="space-y-6">
      {/* Live Audit Stream */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <FaHistory className="text-2xl text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                <span>Live Audit Trail</span>
                {isStreaming && (
                  <span className="flex items-center space-x-1 px-2 py-0.5 bg-red-500 text-white rounded-full text-xs">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span>LIVE</span>
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-500">
                Real-time activity monitoring
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsStreaming(!isStreaming)}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg ${
                isStreaming
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {isStreaming ? <FaPause /> : <FaPlay />}
              <span>{isStreaming ? "Pause" : "Resume"}</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center space-x-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg"
            >
              <FaDownload />
              <span>Export</span>
            </button>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto space-y-2">
          {liveStream.map((entry, index) => (
            <AuditStreamEntry
              key={entry.id}
              entry={entry}
              isNew={index === 0}
              onInspect={setSelectedEntry}
            />
          ))}
        </div>
      </div>

      {/* Audit Trail Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Complete Audit Trail
          </h3>
          <div className="flex items-center space-x-3">
            <select
              value={filters.user}
              onChange={(e) => setFilters({ ...filters, user: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Users</option>
              {uniqueUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>

            <select
              value={filters.action}
              onChange={(e) =>
                setFilters({ ...filters, action: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Actions</option>
              {[
                "DATA_MODIFICATION",
                "SETPOINT_CHANGE",
                "CALIBRATION",
                "OVERRIDE",
                "REPORT_GENERATION",
              ].map((action) => (
                <option key={action} value={action}>
                  {action.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Timestamp (UTC)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Details
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  IP Address
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Hash
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Integrity
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.slice(0, 20).map((entry) => (
                <AuditTableRow key={entry.id} entry={entry} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Blockchain Visualization */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Audit Trail Integrity (Blockchain-style)
        </h3>
        <div className="overflow-x-auto">
          <div className="flex items-center space-x-8 pb-4 min-w-max">
            {auditLogs.slice(0, 8).map((entry, index) => (
              <BlockchainBlock
                key={entry.id}
                entry={entry}
                index={index}
                previousHash={index > 0 ? auditLogs[index - 1].hash : "Genesis"}
                isValid={entry.isValid}
              />
            ))}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div
            className={`flex items-center space-x-2 ${
              validateChain() ? "text-green-600" : "text-red-600"
            }`}
          >
            {validateChain() ? (
              <>
                <FaCheckCircle />
                <span className="font-medium">✓ Chain Integrity Valid</span>
                <span className="text-sm text-gray-500">
                  - All {auditLogs.length} blocks verified
                </span>
              </>
            ) : (
              <>
                <FaTimesCircle />
                <span className="font-medium">✗ Chain Compromised</span>
                <span className="text-sm text-gray-500">
                  - Integrity check failed
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Entry Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Audit Entry Details
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Entry ID</p>
                <p className="text-sm font-mono text-gray-800">
                  {selectedEntry.id}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Timestamp</p>
                <p className="text-sm text-gray-800">
                  {new Date(selectedEntry.timestamp).toISOString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">User</p>
                <p className="text-sm text-gray-800">
                  {selectedEntry.userName} ({selectedEntry.userId})
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Action</p>
                <p className="text-sm text-gray-800">{selectedEntry.action}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Details</p>
                <p className="text-sm text-gray-800">{selectedEntry.details}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Hash</p>
                <p className="text-sm font-mono text-gray-800 break-all">
                  {selectedEntry.hash}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Previous Hash</p>
                <p className="text-sm font-mono text-gray-800 break-all">
                  {selectedEntry.previousHash}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedEntry(null)}
              className="mt-4 w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditTrail;
