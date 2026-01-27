import React, { useState, useCallback, useRef } from "react";
import {
  FaFileAlt,
  FaFilePdf,
  FaFileExcel,
  FaDownload,
  FaSpinner,
  FaCheckCircle,
  FaClock,
  FaCalendarAlt,
  FaCalendarWeek,
  FaShieldAlt,
  FaFlask,
  FaSignature,
  FaCloudUploadAlt,
  FaHistory,
  FaPlay,
  FaEye,
} from "react-icons/fa";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

/**
 * Report Template Configuration
 */
const REPORT_TEMPLATES = [
  {
    id: "daily-compliance",
    name: "Daily Compliance Report",
    description:
      "Comprehensive 24-hour compliance summary with temperature excursions, alerts, and parameter trends",
    icon: FaCalendarAlt,
    color: "blue",
    frequency: "Daily",
    estimatedTime: "2-3 min",
    sections: [
      "Executive Summary",
      "Parameter Compliance",
      "Excursion Details",
      "Alert History",
      "Recommendations",
    ],
    formats: ["PDF", "Excel"],
    regulatory: ["FDA 21 CFR Part 211", "EU GMP Annex 15"],
  },
  {
    id: "weekly-summary",
    name: "Weekly Summary Report",
    description:
      "Week-over-week analysis with trend patterns, CAPA progress, and calibration status",
    icon: FaCalendarWeek,
    color: "green",
    frequency: "Weekly",
    estimatedTime: "3-5 min",
    sections: [
      "Weekly Overview",
      "Trend Analysis",
      "CAPA Status",
      "Calibration Report",
      "Resource Utilization",
    ],
    formats: ["PDF", "Excel", "PowerPoint"],
    regulatory: ["FDA 21 CFR Part 211", "ICH Q1A"],
  },
  {
    id: "monthly-audit",
    name: "Monthly Audit Report",
    description:
      "Full audit trail with blockchain verification, user activity, and system changes",
    icon: FaHistory,
    color: "purple",
    frequency: "Monthly",
    estimatedTime: "5-8 min",
    sections: [
      "Audit Summary",
      "User Activity",
      "System Changes",
      "Data Integrity",
      "Chain Verification",
    ],
    formats: ["PDF"],
    regulatory: ["FDA 21 CFR Part 11", "EU GMP Annex 11"],
  },
  {
    id: "fda-483-response",
    name: "FDA 483 Response Package",
    description:
      "Pre-formatted response to FDA observations with supporting documentation",
    icon: FaShieldAlt,
    color: "red",
    frequency: "On-demand",
    estimatedTime: "10-15 min",
    sections: [
      "Observation Summary",
      "Root Cause Analysis",
      "Corrective Actions",
      "Evidence Package",
      "Implementation Timeline",
    ],
    formats: ["PDF"],
    regulatory: ["FDA 21 CFR Part 211", "FDA 21 CFR Part 11"],
  },
  {
    id: "ema-inspection",
    name: "EMA Inspection Package",
    description: "Comprehensive package for European regulatory inspections",
    icon: FaFileAlt,
    color: "yellow",
    frequency: "On-demand",
    estimatedTime: "15-20 min",
    sections: [
      "Site Overview",
      "QMS Documentation",
      "Validation Status",
      "Deviation History",
      "Training Records",
    ],
    formats: ["PDF", "ZIP Archive"],
    regulatory: ["EU GMP Annex 15", "EU GMP Annex 11", "PIC/S GDP"],
  },
  {
    id: "stability-study",
    name: "Stability Study Report",
    description:
      "ICH-compliant stability data analysis with statistical evaluation",
    icon: FaFlask,
    color: "indigo",
    frequency: "Quarterly",
    estimatedTime: "8-12 min",
    sections: [
      "Study Protocol",
      "Environmental Data",
      "Statistical Analysis",
      "Trend Projections",
      "Shelf-life Assessment",
    ],
    formats: ["PDF", "Excel"],
    regulatory: ["ICH Q1A(R2)", "ICH Q1E", "WHO TRS 961"],
  },
];

/**
 * Report Card Component
 */
const ReportCard = ({ template, onGenerate, isGenerating }) => {
  const Icon = template.icon;
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600 border-blue-200",
    green: "bg-green-100 text-green-600 border-green-200",
    purple: "bg-purple-100 text-purple-600 border-purple-200",
    red: "bg-red-100 text-red-600 border-red-200",
    yellow: "bg-yellow-100 text-yellow-600 border-yellow-200",
    indigo: "bg-indigo-100 text-indigo-600 border-indigo-200",
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-lg ${
            colorClasses[template.color]
          } flex items-center justify-center border`}
        >
          <Icon className="text-xl" />
        </div>
        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
          {template.frequency}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        {template.name}
      </h3>
      <p className="text-sm text-gray-500 mb-4">{template.description}</p>

      <div className="space-y-3 mb-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Sections Included</p>
          <div className="flex flex-wrap gap-1">
            {template.sections.slice(0, 3).map((section) => (
              <span
                key={section}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
              >
                {section}
              </span>
            ))}
            {template.sections.length > 3 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                +{template.sections.length - 3} more
              </span>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-1">Regulatory Frameworks</p>
          <div className="flex flex-wrap gap-1">
            {template.regulatory.map((reg) => (
              <span
                key={reg}
                className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs"
              >
                {reg}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center space-x-1">
            <FaClock />
            <span>Est. {template.estimatedTime}</span>
          </span>
          <span className="flex items-center space-x-1">
            {template.formats.map((format) => (
              <span key={format} className="flex items-center">
                {format === "PDF" && <FaFilePdf className="text-red-500" />}
                {format === "Excel" && (
                  <FaFileExcel className="text-green-500" />
                )}
                {format === "PowerPoint" && (
                  <FaFileAlt className="text-orange-500" />
                )}
              </span>
            ))}
          </span>
        </div>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={() => onGenerate(template)}
          disabled={isGenerating}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg ${
            isGenerating
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {isGenerating ? (
            <>
              <FaSpinner className="animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <FaPlay />
              <span>Generate</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

/**
 * Generated Report Item
 */
const GeneratedReportItem = ({ report, onDownload, onPreview }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
      <div className="flex items-center space-x-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            report.status === "completed"
              ? "bg-green-100 text-green-600"
              : report.status === "failed"
              ? "bg-red-100 text-red-600"
              : "bg-blue-100 text-blue-600"
          }`}
        >
          {report.status === "completed" ? (
            <FaCheckCircle />
          ) : report.status === "failed" ? (
            <FaFileAlt />
          ) : (
            <FaSpinner className="animate-spin" />
          )}
        </div>
        <div>
          <p className="font-medium text-gray-800">{report.name}</p>
          <p className="text-xs text-gray-500">
            Generated: {new Date(report.generatedAt).toLocaleString()} •{" "}
            {report.format}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {report.signed && (
          <span className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
            <FaSignature />
            <span>Signed</span>
          </span>
        )}
        <button
          onClick={() => onPreview(report)}
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
        >
          <FaEye />
        </button>
        <button
          onClick={() => onDownload(report)}
          className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
        >
          <FaDownload />
        </button>
      </div>
    </div>
  );
};

/**
 * Report Generation Progress Modal
 */
const GenerationProgressModal = ({ isOpen, report, progress, onClose }) => {
  if (!isOpen) return null;

  const stages = [
    "Collecting data...",
    "Analyzing compliance status...",
    "Generating charts...",
    "Compiling sections...",
    "Applying digital signature...",
    "Finalizing report...",
  ];

  const currentStageIndex = Math.min(Math.floor(progress / 16.67), 5);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Generating {report?.name}
        </h3>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium text-blue-600">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            {stages.map((stage, index) => (
              <div
                key={stage}
                className={`flex items-center space-x-2 text-sm ${
                  index < currentStageIndex
                    ? "text-green-600"
                    : index === currentStageIndex
                    ? "text-blue-600"
                    : "text-gray-400"
                }`}
              >
                {index < currentStageIndex ? (
                  <FaCheckCircle />
                ) : index === currentStageIndex ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                )}
                <span>{stage}</span>
              </div>
            ))}
          </div>
        </div>

        {progress >= 100 && (
          <button
            onClick={onClose}
            className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            View Report
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Main Reports Dashboard Component
 */
const ReportsDashboard = ({ roomId }) => {
  const [generatingReport, setGeneratingReport] = useState(null);
  const [progress, setProgress] = useState(0);
  const [generatedReports, setGeneratedReports] = useState([
    {
      id: "rpt-001",
      name: "Daily Compliance Report",
      templateId: "daily-compliance",
      generatedAt: new Date(Date.now() - 86400000).toISOString(),
      format: "PDF",
      status: "completed",
      signed: true,
      fileSize: "2.4 MB",
    },
    {
      id: "rpt-002",
      name: "Weekly Summary Report",
      templateId: "weekly-summary",
      generatedAt: new Date(Date.now() - 172800000).toISOString(),
      format: "Excel",
      status: "completed",
      signed: false,
      fileSize: "1.8 MB",
    },
  ]);
  const progressRef = useRef(null);

  const reportStats = {
    totalGenerated: generatedReports.length,
    signedReports: generatedReports.filter((r) => r.signed).length,
    pendingSubmission: 2,
    scheduledReports: 5,
  };

  const handleGenerate = useCallback((template) => {
    setGeneratingReport(template);
    setProgress(0);

    progressRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressRef.current);

          const newReport = {
            id: `rpt-${Date.now()}`,
            name: template.name,
            templateId: template.id,
            generatedAt: new Date().toISOString(),
            format: template.formats[0],
            status: "completed",
            signed: false,
            fileSize: `${(Math.random() * 3 + 0.5).toFixed(1)} MB`,
          };
          setGeneratedReports((prev) => [newReport, ...prev]);

          return 100;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 500);
  }, []);

  const handleCloseProgress = useCallback(() => {
    setGeneratingReport(null);
    setProgress(0);
  }, []);

  const handleDownload = useCallback((report) => {
    const link = document.createElement("a");
    link.href = "#";
    link.download = `${report.name.replace(/\s+/g, "_")}_${
      new Date(report.generatedAt).toISOString().split("T")[0]
    }.pdf`;
    link.click();
  }, []);

  const handlePreview = useCallback((report) => {
    alert(`Preview: ${report.name}`);
  }, []);

  const complianceScoreData = [
    { name: "Compliant", value: 92, color: "#22C55E" },
    { name: "Minor Issues", value: 5, color: "#F59E0B" },
    { name: "Non-Compliant", value: 3, color: "#EF4444" },
  ];

  const monthlyReportData = [
    { month: "Jan", reports: 45 },
    { month: "Feb", reports: 52 },
    { month: "Mar", reports: 48 },
    { month: "Apr", reports: 61 },
    { month: "May", reports: 55 },
    { month: "Jun", reports: 67 },
  ];

  return (
    <div className="space-y-6">
      {/* Report Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Generated</p>
              <p className="text-2xl font-bold text-gray-800">
                {reportStats.totalGenerated}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaFileAlt className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Digitally Signed</p>
              <p className="text-2xl font-bold text-green-600">
                {reportStats.signedReports}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FaSignature className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Submission</p>
              <p className="text-2xl font-bold text-yellow-600">
                {reportStats.pendingSubmission}
              </p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FaCloudUploadAlt className="text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Scheduled</p>
              <p className="text-2xl font-bold text-purple-600">
                {reportStats.scheduledReports}
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <FaClock className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Compliance Distribution
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={complianceScoreData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {complianceScoreData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Reports Generated (6 Months)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyReportData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="reports" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Report Templates */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Report Templates
        </h3>
        <div className="grid grid-cols-3 gap-6">
          {REPORT_TEMPLATES.map((template) => (
            <ReportCard
              key={template.id}
              template={template}
              onGenerate={handleGenerate}
              isGenerating={generatingReport?.id === template.id}
            />
          ))}
        </div>
      </div>

      {/* Generated Reports History */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Recently Generated Reports
        </h3>
        <div className="space-y-3">
          {generatedReports.map((report) => (
            <GeneratedReportItem
              key={report.id}
              report={report}
              onDownload={handleDownload}
              onPreview={handlePreview}
            />
          ))}
        </div>
      </div>

      {/* Generation Progress Modal */}
      <GenerationProgressModal
        isOpen={generatingReport !== null}
        report={generatingReport}
        progress={progress}
        onClose={handleCloseProgress}
      />
    </div>
  );
};

export default ReportsDashboard;
