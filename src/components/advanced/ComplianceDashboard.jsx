import React, { useMemo, useState } from "react";
import {
  FaShieldAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaFileAlt,
  FaDownload,
  FaCalendarAlt,
  FaThermometerHalf,
  FaTint,
  FaHistory,
  FaChartLine,
  FaClipboardList,
  FaScroll,
} from "react-icons/fa";

// Import new compliance components
import {
  ComplianceOverview,
  RequirementsMatrix,
  AuditTrail,
  ReportsDashboard,
} from "../compliance";

/**
 * Compliance Score Ring
 */
const ComplianceScoreRing = ({ score, size = 120 }) => {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${(score / 100) * circumference} ${circumference}`;

  const getColor = () => {
    if (score >= 90) return "#10B981";
    if (score >= 70) return "#F59E0B";
    return "#EF4444";
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="8"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-gray-800">{score}</span>
        <span className="text-sm text-gray-500">/ 100</span>
      </div>
    </div>
  );
};

/**
 * Compliance Requirement Card
 */
const RequirementCard = ({ requirement, isExpanded, onToggle }) => {
  const { id, title, status, description, findings = [], score } = requirement;

  const getStatusIcon = () => {
    switch (status) {
      case "compliant":
        return <FaCheckCircle className="text-green-500" />;
      case "warning":
        return <FaExclamationTriangle className="text-yellow-500" />;
      case "non-compliant":
        return <FaTimesCircle className="text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBg = () => {
    switch (status) {
      case "compliant":
        return "bg-green-50 border-green-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "non-compliant":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className={`rounded-lg border ${getStatusBg()} overflow-hidden`}>
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-opacity-80"
        onClick={onToggle}
      >
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <p className="text-sm font-medium text-gray-800">{title}</p>
            <p className="text-xs text-gray-500">{id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {score !== undefined && (
            <span className="text-sm font-medium text-gray-600">{score}%</span>
          )}
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
        <div className="px-3 pb-3 border-t border-current border-opacity-10">
          <p className="text-sm text-gray-600 mt-2 mb-3">{description}</p>

          {findings.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase">
                Findings
              </p>
              {findings.map((finding, index) => (
                <div
                  key={index}
                  className={`
                    p-2 rounded text-xs
                    ${
                      finding.severity === "critical"
                        ? "bg-red-100 text-red-800"
                        : finding.severity === "warning"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-700"
                    }
                  `}
                >
                  {finding.message}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Audit Trail Item
 */
const AuditTrailItem = ({ entry }) => {
  return (
    <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
        <FaHistory className="text-blue-600 text-sm" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-800">{entry.action}</p>
        <div className="flex items-center space-x-2 mt-1">
          <span className="text-xs text-gray-500">{entry.user}</span>
          <span className="text-xs text-gray-400">•</span>
          <span className="text-xs text-gray-500">
            {new Date(entry.timestamp).toLocaleString()}
          </span>
        </div>
        {entry.details && (
          <p className="text-xs text-gray-400 mt-1">{entry.details}</p>
        )}
      </div>
    </div>
  );
};

/**
 * Report Generator Card
 */
const ReportGeneratorCard = ({ onGenerate, isGenerating }) => {
  const [reportType, setReportType] = useState("monthly");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const reportTypes = [
    { id: "daily", label: "Daily Summary" },
    { id: "weekly", label: "Weekly Report" },
    { id: "monthly", label: "Monthly Compliance" },
    { id: "quarterly", label: "Quarterly Audit" },
    { id: "annual", label: "Annual Review" },
  ];

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
      <div className="flex items-center space-x-2 mb-4">
        <FaFileAlt className="text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-800">Generate Report</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Report Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {reportTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setReportType(type.id)}
                className={`
                  px-3 py-2 text-sm rounded-lg border transition-colors
                  ${
                    reportType === type.id
                      ? "bg-blue-50 border-blue-500 text-blue-700"
                      : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                  }
                `}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, start: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, end: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <button
          onClick={() => onGenerate?.({ type: reportType, ...dateRange })}
          disabled={isGenerating}
          className={`
            w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium
            ${
              isGenerating
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }
          `}
        >
          <FaDownload />
          <span>{isGenerating ? "Generating..." : "Generate Report"}</span>
        </button>
      </div>
    </div>
  );
};

/**
 * Main Compliance Dashboard Component
 * Enhanced with pharmaceutical compliance tabs: Overview, Requirements, Audit Trail, Reports
 */
const ComplianceDashboard = ({
  complianceData,
  auditTrail = [],
  onGenerateReport,
  onExportData,
  roomId = "cold-storage-1",
}) => {
  const [expandedRequirement, setExpandedRequirement] = useState(null);
  const [activeView, setActiveView] = useState("overview");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Tab configuration with icons
  const tabs = [
    { id: "overview", label: "Overview", icon: FaChartLine },
    { id: "requirements", label: "Requirements", icon: FaClipboardList },
    { id: "audit-trail", label: "Audit Trail", icon: FaScroll },
    { id: "reports", label: "Reports", icon: FaFileAlt },
  ];

  // Calculate overall compliance score
  const overallScore = useMemo(() => {
    if (!complianceData?.requirements) return 0;
    const scores = complianceData.requirements
      .filter((r) => r.score !== undefined)
      .map((r) => r.score);
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [complianceData]);

  // Group requirements by status
  const requirementsByStatus = useMemo(() => {
    if (!complianceData?.requirements)
      return { compliant: [], warning: [], "non-compliant": [] };
    return complianceData.requirements.reduce(
      (acc, req) => {
        const status = req.status || "compliant";
        if (!acc[status]) acc[status] = [];
        acc[status].push(req);
        return acc;
      },
      { compliant: [], warning: [], "non-compliant": [] }
    );
  }, [complianceData]);

  const handleGenerateReport = async (options) => {
    setIsGeneratingReport(true);
    try {
      await onGenerateReport?.(options);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Sample requirements if none provided
  const requirements = complianceData?.requirements || [
    {
      id: "21 CFR 211.46",
      title: "Ventilation, Air Filtration, Heating and Cooling",
      status: "compliant",
      score: 95,
      description:
        "Buildings used for pharmaceutical manufacturing shall have adequate ventilation, air filtration, air heating, and cooling systems.",
      findings: [],
    },
    {
      id: "21 CFR 211.58",
      title: "Maintenance",
      status: "warning",
      score: 78,
      description:
        "Any building used in the manufacture shall be maintained in a good state of repair.",
      findings: [
        { severity: "warning", message: "Filter replacement due in 14 days" },
      ],
    },
    {
      id: "21 CFR 211.68",
      title: "Equipment Cleaning and Maintenance",
      status: "compliant",
      score: 92,
      description:
        "Equipment used for manufacturing shall be of appropriate design, adequate size, and suitably located.",
      findings: [],
    },
    {
      id: "21 CFR 211.142",
      title: "Warehousing Procedures",
      status: "compliant",
      score: 88,
      description:
        "Written procedures describing the warehousing of drug products shall be established and followed.",
      findings: [],
    },
    {
      id: "21 CFR 211.160",
      title: "Laboratory Controls - General Requirements",
      status: "non-compliant",
      score: 65,
      description:
        "Scientifically sound and appropriate specifications, standards, sampling plans, and test procedures.",
      findings: [
        {
          severity: "critical",
          message: "Sensor calibration overdue by 5 days",
        },
        { severity: "warning", message: "Documentation gap detected" },
      ],
    },
  ];

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <FaShieldAlt className="text-blue-600 text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                FDA Compliance Dashboard
              </h1>
              <p className="text-sm text-gray-500">
                21 CFR Part 211 - Storage Requirements
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Last Audit</p>
              <p className="text-sm font-medium text-gray-700">
                {complianceData?.lastAudit
                  ? new Date(complianceData.lastAudit).toLocaleDateString()
                  : "Not available"}
              </p>
            </div>
            <ComplianceScoreRing score={overallScore} size={80} />
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="flex space-x-4 border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`
                flex items-center space-x-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors
                ${
                  activeView === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }
              `}
              >
                <Icon className="text-sm" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content - Enhanced with new compliance components */}
      {activeView === "overview" && <ComplianceOverview roomId={roomId} />}

      {activeView === "requirements" && <RequirementsMatrix roomId={roomId} />}

      {activeView === "audit-trail" && <AuditTrail roomId={roomId} />}

      {activeView === "reports" && <ReportsDashboard roomId={roomId} />}
    </div>
  );
};

export default ComplianceDashboard;
export { ComplianceScoreRing, RequirementCard, ReportGeneratorCard };
