import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  FaSearch,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaFileAlt,
  FaUpload,
} from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Regulatory requirements database
const REGULATORY_REQUIREMENTS = [
  {
    id: "FDA-211.46",
    regulation: "FDA 21 CFR Part 211",
    section: "211.46",
    title: "Ventilation, air filtration, air heating and cooling",
    description:
      "Adequate ventilation, air filtration, air heating and cooling shall be provided.",
    priority: "critical",
    requirements: {
      temperature: { min: 2, max: 8, unit: "°C" },
      humidity: { min: 30, max: 65, unit: "%" },
      "differential-pressure": { min: 10, max: 30, unit: "Pa" },
    },
    evidence: [
      "Environmental monitoring records",
      "HVAC qualification documents",
    ],
    lastVerified: "2024-01-15",
    nextReview: "2024-07-15",
  },
  {
    id: "FDA-211.58",
    regulation: "FDA 21 CFR Part 211",
    section: "211.58",
    title: "Maintenance",
    description:
      "Any building used in manufacture shall be maintained in a good state of repair.",
    priority: "high",
    requirements: {
      "calibration-status": { value: "current" },
      "maintenance-schedule": { value: "compliant" },
    },
    evidence: ["Maintenance logs", "Calibration certificates"],
    lastVerified: "2024-01-10",
    nextReview: "2024-04-10",
  },
  {
    id: "FDA-211.68",
    regulation: "FDA 21 CFR Part 211",
    section: "211.68",
    title: "Automatic, mechanical, and electronic equipment",
    description:
      "Equipment shall be routinely calibrated, inspected, or checked according to a written program.",
    priority: "critical",
    requirements: {
      "sensor-calibration": { interval: 365, unit: "days" },
      "data-integrity": { min: 99, unit: "%" },
    },
    evidence: [
      "Calibration records",
      "Validation protocols",
      "Data integrity reports",
    ],
    lastVerified: "2024-01-05",
    nextReview: "2024-04-05",
  },
  {
    id: "FDA-211.142",
    regulation: "FDA 21 CFR Part 211",
    section: "211.142",
    title: "Warehousing procedures",
    description:
      "Written procedures describing warehousing shall be established and followed.",
    priority: "high",
    requirements: {
      temperature: { min: 2, max: 8, unit: "°C" },
      "storage-mapping": { value: "completed" },
    },
    evidence: ["SOPs", "Temperature mapping reports"],
    lastVerified: "2024-01-12",
    nextReview: "2024-07-12",
  },
  {
    id: "FDA-211.160",
    regulation: "FDA 21 CFR Part 211",
    section: "211.160",
    title: "General requirements for laboratory controls",
    description:
      "Laboratory controls shall include scientifically sound specifications and test procedures.",
    priority: "critical",
    requirements: {
      "testing-frequency": { value: "per-SOP" },
      "oos-investigations": { max: 2, unit: "per-month" },
    },
    evidence: ["Test results", "OOS investigation reports"],
    lastVerified: "2024-01-08",
    nextReview: "2024-04-08",
  },
  {
    id: "EU-GMP-A15-1",
    regulation: "EU GMP Annex 15",
    section: "Chapter 1",
    title: "Qualification and Validation",
    description:
      "Critical equipment and processes shall be qualified and validated.",
    priority: "critical",
    requirements: {
      "iq-oq-pq": { value: "completed" },
      requalification: { interval: 365, unit: "days" },
    },
    evidence: ["Qualification protocols", "Validation master plan"],
    lastVerified: "2024-01-20",
    nextReview: "2025-01-20",
  },
  {
    id: "EU-GMP-A15-3",
    regulation: "EU GMP Annex 15",
    section: "Chapter 3",
    title: "Temperature Mapping",
    description:
      "Temperature mapping studies shall be performed for storage areas.",
    priority: "high",
    requirements: {
      "mapping-frequency": { interval: 365, unit: "days" },
      "sensor-placement": { value: "per-mapping-study" },
    },
    evidence: ["Temperature mapping reports", "Sensor location diagrams"],
    lastVerified: "2024-01-18",
    nextReview: "2025-01-18",
  },
  {
    id: "WHO-TRS961-8",
    regulation: "WHO TRS 961",
    section: "Annex 8",
    title: "Stability testing guidelines",
    description:
      "Storage conditions shall be maintained within specified limits.",
    priority: "critical",
    requirements: {
      temperature: { min: 2, max: 8, unit: "°C", tolerance: 2 },
      humidity: { min: 35, max: 60, unit: "%" },
    },
    evidence: ["Stability study data", "Environmental monitoring records"],
    lastVerified: "2024-01-14",
    nextReview: "2024-07-14",
  },
  {
    id: "PICS-GDP-9",
    regulation: "PIC/S GDP",
    section: "Chapter 9",
    title: "Transportation",
    description:
      "Temperature-sensitive products shall be transported under controlled conditions.",
    priority: "high",
    requirements: {
      "transport-validation": { value: "completed" },
      "temperature-monitoring": { value: "continuous" },
    },
    evidence: ["Transport validation reports", "Temperature logs"],
    lastVerified: "2024-01-22",
    nextReview: "2024-07-22",
  },
  {
    id: "ICH-Q1A-2",
    regulation: "ICH Q1A(R2)",
    section: "Section 2",
    title: "Stress Testing",
    description:
      "Storage conditions for stability studies shall be documented.",
    priority: "medium",
    requirements: {
      temperature: { min: 2, max: 8, unit: "°C" },
      "light-exposure": { value: "controlled" },
    },
    evidence: ["Stability protocols", "Light exposure records"],
    lastVerified: "2024-01-25",
    nextReview: "2025-01-25",
  },
];

/**
 * Requirement Card Component
 */
const RequirementCard = ({
  requirement,
  status,
  onAddEvidence,
  onRequestVerification,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusConfig = {
    compliant: {
      bg: "bg-green-50",
      border: "border-green-200",
      icon: FaCheckCircle,
      iconColor: "text-green-500",
      badge: "bg-green-100 text-green-700",
    },
    partial: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      icon: FaExclamationTriangle,
      iconColor: "text-yellow-500",
      badge: "bg-yellow-100 text-yellow-700",
    },
    "non-compliant": {
      bg: "bg-red-50",
      border: "border-red-200",
      icon: FaTimesCircle,
      iconColor: "text-red-500",
      badge: "bg-red-100 text-red-700",
    },
  };

  const priorityColors = {
    critical: "bg-red-100 text-red-700",
    high: "bg-orange-100 text-orange-700",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-blue-100 text-blue-700",
  };

  const config = statusConfig[status.status] || statusConfig.compliant;
  const StatusIcon = config.icon;

  return (
    <div
      className={`rounded-lg border ${config.border} ${config.bg} overflow-hidden`}
    >
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <StatusIcon className={`text-xl ${config.iconColor}`} />
          <div>
            <div className="flex items-center space-x-2">
              <p className="font-medium text-gray-800">{requirement.title}</p>
              <span
                className={`px-2 py-0.5 rounded text-xs ${
                  priorityColors[requirement.priority]
                }`}
              >
                {requirement.priority.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              {requirement.id} • {requirement.regulation}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${config.badge}`}
          >
            {status.score}%
          </span>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200 bg-white bg-opacity-50">
          <p className="text-sm text-gray-600 mt-3">
            {requirement.description}
          </p>

          {/* Requirements */}
          <div className="mt-4">
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">
              Requirements
            </p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(requirement.requirements).map(([key, spec]) => (
                <div
                  key={key}
                  className="flex items-center justify-between bg-white rounded p-2 text-sm"
                >
                  <span className="text-gray-600">
                    {key.replace(/-/g, " ")}
                  </span>
                  <span className="font-medium text-gray-800">
                    {spec.min !== undefined
                      ? `${spec.min}-${spec.max}${spec.unit}`
                      : spec.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Evidence */}
          <div className="mt-4">
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">
              Required Evidence
            </p>
            <div className="flex flex-wrap gap-2">
              {requirement.evidence.map((ev, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-white rounded text-xs text-gray-600 border border-gray-200"
                >
                  <FaFileAlt className="inline mr-1" />
                  {ev}
                </span>
              ))}
            </div>
          </div>

          {/* Issues */}
          {status.issues && status.issues.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                Issues Found
              </p>
              <div className="space-y-2">
                {status.issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className="flex items-start space-x-2 bg-red-50 rounded p-2 text-sm text-red-700"
                  >
                    <FaExclamationTriangle className="mt-0.5 flex-shrink-0" />
                    <span>{issue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-2 mt-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddEvidence(requirement.id);
              }}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              <FaUpload />
              <span>Upload Evidence</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRequestVerification(requirement.id);
              }}
              className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
            >
              Request Verification
            </button>
          </div>

          {/* Dates */}
          <div className="flex items-center space-x-4 mt-4 text-xs text-gray-500">
            <span>
              Last Verified:{" "}
              {new Date(requirement.lastVerified).toLocaleDateString()}
            </span>
            <span>
              Next Review:{" "}
              {new Date(requirement.nextReview).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Gap Analysis Chart
 */
const GapAnalysisChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="category" tick={{ fontSize: 12 }} />
        <YAxis
          label={{
            value: "Gap Score",
            angle: -90,
            position: "insideLeft",
            fontSize: 12,
          }}
        />
        <Tooltip />
        <Legend />
        <Bar dataKey="critical" fill="#EF4444" name="Critical Gaps" />
        <Bar dataKey="major" fill="#F59E0B" name="Major Gaps" />
        <Bar dataKey="minor" fill="#10B981" name="Minor Gaps" />
      </BarChart>
    </ResponsiveContainer>
  );
};

/**
 * Main Requirements Matrix Component
 */
const RequirementsMatrix = ({ roomId, currentData }) => {
  const [requirements] = useState(REGULATORY_REQUIREMENTS);
  const [filter, setFilter] = useState({
    regulation: "all",
    status: "all",
    priority: "all",
    search: "",
  });
  const [complianceStatus, setComplianceStatus] = useState({});

  // Calculate compliance status for each requirement
  useEffect(() => {
    const calculateCompliance = () => {
      const status = {};
      requirements.forEach((req) => {
        let score = 100;
        let issues = [];

        // Check each parameter requirement
        Object.entries(req.requirements).forEach(([param, spec]) => {
          const value = currentData?.[param];
          if (value !== undefined) {
            if (spec.min !== undefined && spec.max !== undefined) {
              if (value < spec.min || value > spec.max) {
                score -= 25;
                issues.push(
                  `${param} (${value}) is outside range ${spec.min}-${spec.max}${spec.unit}`
                );
              }
            }
          }
        });

        // Random simulation for demo
        const randomFactor = Math.random() * 20 - 10;
        score = Math.max(0, Math.min(100, score + randomFactor));

        status[req.id] = {
          score: Math.round(score),
          status:
            score >= 90
              ? "compliant"
              : score >= 70
              ? "partial"
              : "non-compliant",
          issues,
          lastChecked: new Date().toISOString(),
        };
      });
      setComplianceStatus(status);
    };

    calculateCompliance();
    const interval = setInterval(calculateCompliance, 30000);
    return () => clearInterval(interval);
  }, [requirements, currentData]);

  // Filter requirements
  const filteredRequirements = useMemo(() => {
    return requirements.filter((req) => {
      if (
        filter.regulation !== "all" &&
        !req.regulation.includes(filter.regulation)
      )
        return false;
      if (filter.priority !== "all" && req.priority !== filter.priority)
        return false;
      if (filter.status !== "all") {
        const status = complianceStatus[req.id]?.status;
        if (status !== filter.status) return false;
      }
      if (filter.search) {
        const search = filter.search.toLowerCase();
        if (
          !req.title.toLowerCase().includes(search) &&
          !req.description.toLowerCase().includes(search) &&
          !req.id.toLowerCase().includes(search)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [requirements, filter, complianceStatus]);

  // Gap analysis data
  const gapAnalysisData = useMemo(() => {
    const categories = [
      "Temperature",
      "Humidity",
      "Calibration",
      "Documentation",
      "Validation",
    ];
    return categories.map((cat) => ({
      category: cat,
      critical: Math.floor(Math.random() * 3),
      major: Math.floor(Math.random() * 5),
      minor: Math.floor(Math.random() * 8),
    }));
  }, []);

  // Get unique regulations
  const uniqueRegulations = useMemo(() => {
    return [...new Set(requirements.map((r) => r.regulation.split(" ")[0]))];
  }, [requirements]);

  const handleAddEvidence = useCallback((reqId) => {
    alert(`Upload evidence for ${reqId}`);
  }, []);

  const handleRequestVerification = useCallback((reqId) => {
    alert(`Verification requested for ${reqId}`);
  }, []);

  const generateGapReport = useCallback(() => {
    alert("Generating gap report...");
  }, []);

  const autoGenerateCAPAs = useCallback(() => {
    alert("Auto-generating CAPAs for critical gaps...");
  }, []);

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Regulation Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter.regulation === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              onClick={() => setFilter({ ...filter, regulation: "all" })}
            >
              All Regulations
            </button>
            {uniqueRegulations.map((reg) => (
              <button
                key={reg}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter.regulation === reg
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                onClick={() => setFilter({ ...filter, regulation: reg })}
              >
                {reg}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search requirements..."
                value={filter.search}
                onChange={(e) =>
                  setFilter({ ...filter, search: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Status</option>
            <option value="compliant">Compliant</option>
            <option value="partial">Partial</option>
            <option value="non-compliant">Non-Compliant</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filter.priority}
            onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Priority</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Requirements Grid */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Regulatory Requirements
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({filteredRequirements.length} of {requirements.length})
            </span>
          </h3>
          <div className="flex items-center space-x-2 text-sm">
            <span className="flex items-center space-x-1">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="text-gray-600">Compliant</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
              <span className="text-gray-600">Partial</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              <span className="text-gray-600">Non-Compliant</span>
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {filteredRequirements.map((req) => (
            <RequirementCard
              key={req.id}
              requirement={req}
              status={
                complianceStatus[req.id] || {
                  score: 100,
                  status: "compliant",
                  issues: [],
                }
              }
              onAddEvidence={handleAddEvidence}
              onRequestVerification={handleRequestVerification}
            />
          ))}
        </div>
      </div>

      {/* Gap Analysis */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Compliance Gap Analysis
        </h3>
        <GapAnalysisChart data={gapAnalysisData} />
        <div className="flex space-x-4 mt-4">
          <button
            onClick={generateGapReport}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FaFileAlt />
            <span>Generate Gap Report</span>
          </button>
          <button
            onClick={autoGenerateCAPAs}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <FaExclamationTriangle />
            <span>Auto-Create CAPAs for Critical Gaps</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequirementsMatrix;
