import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  FaExclamationTriangle,
  FaChartLine,
  FaFileAlt,
  FaCalendarAlt,
  FaThermometerHalf,
  FaTint,
  FaCompressArrowsAlt,
  FaShieldAlt,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/**
 * Real-time Compliance Metrics Card
 */
const MetricCard = ({
  title,
  value,
  trend,
  icon: Icon,
  color = "blue",
  subtext,
  onClick,
}) => {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    yellow: "bg-yellow-100 text-yellow-600",
    red: "bg-red-100 text-red-600",
    purple: "bg-purple-100 text-purple-600",
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-md border border-gray-100 p-4 ${
        onClick ? "cursor-pointer hover:shadow-lg" : ""
      } transition-all`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div
          className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center`}
        >
          <Icon className="text-lg" />
        </div>
        {trend && (
          <div
            className={`flex items-center space-x-1 text-xs ${
              trend > 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend > 0 ? <FaArrowUp /> : <FaArrowDown />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-sm text-gray-500">{title}</p>
        {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
      </div>
    </div>
  );
};

/**
 * KPI Card with Mini Chart
 */
const KPICard = ({
  title,
  value,
  target,
  unit,
  description,
  chartData,
  color = "blue",
}) => {
  const percentage = target
    ? Math.min((parseFloat(value) / target) * 100, 100)
    : 0;
  const isGood = parseFloat(value) <= target;

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <span
          className={`px-2 py-0.5 rounded text-xs ${
            isGood ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          Target: {target}
          {unit}
        </span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        {chartData && (
          <div className="w-24 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={isGood ? "#10B981" : "#EF4444"}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      <div className="mt-3">
        <div className="w-full h-2 bg-gray-200 rounded-full">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isGood ? "bg-green-500" : "bg-red-500"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Parameter Compliance Bar
 */
const ParameterComplianceBar = ({
  parameter,
  value,
  min,
  max,
  status,
  history,
}) => {
  const parameterConfig = {
    temperature: {
      icon: FaThermometerHalf,
      unit: "°C",
      color: "blue",
      label: "Temperature",
    },
    humidity: { icon: FaTint, unit: "%", color: "cyan", label: "Humidity" },
    pressure: {
      icon: FaCompressArrowsAlt,
      unit: "Pa",
      color: "purple",
      label: "Pressure",
    },
    "differential-pressure": {
      icon: FaCompressArrowsAlt,
      unit: "Pa",
      color: "indigo",
      label: "Differential Pressure",
    },
  };

  const config = parameterConfig[parameter] || {
    icon: FaChartLine,
    unit: "",
    color: "gray",
    label: parameter,
  };
  const Icon = config.icon;
  const range = max - min;
  const position = ((value - min) / range) * 100;
  const clampedPosition = Math.max(0, Math.min(100, position));

  const statusColors = {
    compliant: "bg-green-500",
    deviation: "bg-yellow-500",
    critical: "bg-red-500",
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Icon className={`text-${config.color}-500`} />
          <span className="font-medium text-gray-700">{config.label}</span>
        </div>
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            status === "compliant"
              ? "bg-green-100 text-green-700"
              : status === "deviation"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {status?.toUpperCase()}
        </span>
      </div>

      <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
        {/* Safe zone */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-200 via-green-200 to-red-200" />

        {/* Current value indicator */}
        <div
          className={`absolute top-0 bottom-0 w-1 ${
            statusColors[status] || "bg-blue-500"
          }`}
          style={{ left: `${clampedPosition}%`, transform: "translateX(-50%)" }}
        />

        {/* Value label */}
        <div
          className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 bg-gray-800 text-white px-2 py-0.5 rounded text-xs"
          style={{ left: `${clampedPosition}%` }}
        >
          {value?.toFixed(1)}
          {config.unit}
        </div>
      </div>

      <div className="flex justify-between mt-1 text-xs text-gray-500">
        <span>
          {min}
          {config.unit}
        </span>
        <span>
          {max}
          {config.unit}
        </span>
      </div>

      {/* Mini trend chart */}
      {history && history.length > 0 && (
        <div className="mt-3 h-12">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={
                  status === "compliant"
                    ? "#10B981"
                    : status === "deviation"
                    ? "#F59E0B"
                    : "#EF4444"
                }
                strokeWidth={1.5}
                dot={false}
              />
              <Tooltip
                contentStyle={{ fontSize: "10px", padding: "4px 8px" }}
                formatter={(val) => [`${val}${config.unit}`, config.label]}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

/**
 * Active Deviation Card
 */
const DeviationCard = ({ deviation, onAcknowledge, onEscalate }) => {
  const severityColors = {
    low: "border-l-blue-500 bg-blue-50",
    medium: "border-l-yellow-500 bg-yellow-50",
    high: "border-l-orange-500 bg-orange-50",
    critical: "border-l-red-500 bg-red-50",
  };

  return (
    <div
      className={`rounded-lg border-l-4 ${
        severityColors[deviation.severity]
      } p-4`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${
                deviation.severity === "critical"
                  ? "bg-red-200 text-red-800"
                  : deviation.severity === "high"
                  ? "bg-orange-200 text-orange-800"
                  : deviation.severity === "medium"
                  ? "bg-yellow-200 text-yellow-800"
                  : "bg-blue-200 text-blue-800"
              }`}
            >
              {deviation.severity.toUpperCase()}
            </span>
            <span className="text-xs text-gray-500">{deviation.id}</span>
          </div>
          <p className="font-medium text-gray-800 mt-1">{deviation.title}</p>
          <p className="text-sm text-gray-600 mt-1">{deviation.description}</p>
          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
            <span>Duration: {deviation.duration} min</span>
            <span>Parameter: {deviation.parameter}</span>
            <span>Value: {deviation.value}</span>
          </div>
        </div>
      </div>
      <div className="flex space-x-2 mt-3">
        <button
          onClick={() => onAcknowledge(deviation.id)}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          Acknowledge
        </button>
        <button
          onClick={() => onEscalate(deviation.id)}
          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Escalate to CAPA
        </button>
      </div>
    </div>
  );
};

/**
 * Main Compliance Overview Component
 */
const ComplianceOverview = ({ roomId }) => {
  const [realTimeStatus, setRealTimeStatus] = useState({
    overallStatus: "compliant",
    currentExcursion: null,
    excursionTrend: 0,
    stabilityScore: 98.5,
    stabilityTrend: 2.3,
    dataPoints: 1440,
    gapsCount: 2,
    criticalGaps: 0,
    nextAudit: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    auditDaysRemaining: 30,
    parameters: {
      temperature: {
        currentValue: 5.2,
        regulatoryMin: 2,
        regulatoryMax: 8,
        status: "compliant",
        history: [],
      },
      humidity: {
        currentValue: 45,
        regulatoryMin: 30,
        regulatoryMax: 65,
        status: "compliant",
        history: [],
      },
      pressure: {
        currentValue: 101325,
        regulatoryMin: 100000,
        regulatoryMax: 103000,
        status: "compliant",
        history: [],
      },
      "differential-pressure": {
        currentValue: 15,
        regulatoryMin: 10,
        regulatoryMax: 25,
        status: "compliant",
        history: [],
      },
    },
  });

  const [metrics, setMetrics] = useState({
    dataIntegrity: 99.2,
    integrityTrend: [
      { value: 98.5 },
      { value: 98.8 },
      { value: 99.0 },
      { value: 99.2 },
    ],
    mtbf: 720,
    mtbfTrend: 5,
    deviationRate: 0.3,
    capaClosure: 12,
    openCAPAs: 2,
    activeDeviations: [],
  });

  // Simulate real-time updates
  useEffect(() => {
    const generateHistory = () => {
      return Array.from({ length: 20 }, (_, i) => ({
        time: i,
        value: 5 + Math.random() * 2 - 1,
      }));
    };

    const interval = setInterval(() => {
      setRealTimeStatus((prev) => {
        const newTemp = 5 + Math.random() * 3 - 1.5;
        const newHumidity = 45 + Math.random() * 20 - 10;
        const tempStatus =
          newTemp < 2 || newTemp > 8
            ? "critical"
            : newTemp < 3 || newTemp > 7
            ? "deviation"
            : "compliant";
        const humidityStatus =
          newHumidity < 30 || newHumidity > 65
            ? "critical"
            : newHumidity < 35 || newHumidity > 60
            ? "deviation"
            : "compliant";

        return {
          ...prev,
          stabilityScore: Math.max(
            90,
            Math.min(100, prev.stabilityScore + (Math.random() - 0.5) * 2)
          ),
          dataPoints: prev.dataPoints + 1,
          overallStatus:
            tempStatus === "critical" || humidityStatus === "critical"
              ? "critical"
              : tempStatus === "deviation" || humidityStatus === "deviation"
              ? "deviation"
              : "compliant",
          parameters: {
            temperature: {
              ...prev.parameters.temperature,
              currentValue: newTemp,
              status: tempStatus,
              history: [
                ...(prev.parameters.temperature.history || []).slice(-19),
                { value: newTemp },
              ],
            },
            humidity: {
              ...prev.parameters.humidity,
              currentValue: newHumidity,
              status: humidityStatus,
              history: [
                ...(prev.parameters.humidity.history || []).slice(-19),
                { value: newHumidity },
              ],
            },
            pressure: {
              ...prev.parameters.pressure,
              currentValue: 101325 + Math.random() * 500 - 250,
              history: [
                ...(prev.parameters.pressure.history || []).slice(-19),
                { value: 101325 + Math.random() * 500 - 250 },
              ],
            },
            "differential-pressure": {
              ...prev.parameters["differential-pressure"],
              currentValue: 15 + Math.random() * 5 - 2.5,
              history: [
                ...(
                  prev.parameters["differential-pressure"].history || []
                ).slice(-19),
                { value: 15 + Math.random() * 5 - 2.5 },
              ],
            },
          },
        };
      });
    }, 3000);

    // Initialize history
    setRealTimeStatus((prev) => ({
      ...prev,
      parameters: {
        temperature: {
          ...prev.parameters.temperature,
          history: generateHistory(),
        },
        humidity: {
          ...prev.parameters.humidity,
          history: Array.from({ length: 20 }, () => ({
            value: 45 + Math.random() * 10 - 5,
          })),
        },
        pressure: {
          ...prev.parameters.pressure,
          history: Array.from({ length: 20 }, () => ({
            value: 101325 + Math.random() * 200 - 100,
          })),
        },
        "differential-pressure": {
          ...prev.parameters["differential-pressure"],
          history: Array.from({ length: 20 }, () => ({
            value: 15 + Math.random() * 3 - 1.5,
          })),
        },
      },
    }));

    return () => clearInterval(interval);
  }, [roomId]);

  // Generate sample deviations
  useEffect(() => {
    setMetrics((prev) => ({
      ...prev,
      activeDeviations: [
        {
          id: "DEV-2024-001",
          title: "Temperature Excursion",
          description:
            "Temperature briefly exceeded upper limit during maintenance window",
          severity: "medium",
          duration: 15,
          parameter: "temperature",
          value: "8.5°C",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
      ],
    }));
  }, []);

  const handleAcknowledge = useCallback((id) => {
    setMetrics((prev) => ({
      ...prev,
      activeDeviations: prev.activeDeviations.filter((d) => d.id !== id),
    }));
  }, []);

  const handleEscalate = useCallback((id) => {
    setMetrics((prev) => ({
      ...prev,
      activeDeviations: prev.activeDeviations.filter((d) => d.id !== id),
      openCAPAs: prev.openCAPAs + 1,
    }));
  }, []);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Real-time Compliance Status */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <FaShieldAlt className="text-2xl text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Live Compliance Status
              </h3>
              <p className="text-sm text-gray-500">
                Real-time regulatory monitoring
              </p>
            </div>
          </div>
          <span
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              realTimeStatus.overallStatus === "compliant"
                ? "bg-green-100 text-green-700"
                : realTimeStatus.overallStatus === "deviation"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {realTimeStatus.overallStatus.toUpperCase()}
          </span>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Current Excursion"
            value={realTimeStatus.currentExcursion || "None"}
            trend={realTimeStatus.excursionTrend}
            icon={FaExclamationTriangle}
            color={realTimeStatus.currentExcursion ? "red" : "green"}
          />
          <MetricCard
            title="24h Stability Score"
            value={`${realTimeStatus.stabilityScore.toFixed(1)}%`}
            trend={realTimeStatus.stabilityTrend}
            icon={FaChartLine}
            subtext={`Based on ${realTimeStatus.dataPoints} readings`}
            color="blue"
          />
          <MetricCard
            title="Regulatory Gaps"
            value={realTimeStatus.gapsCount}
            icon={FaFileAlt}
            subtext={`${realTimeStatus.criticalGaps} critical`}
            color={realTimeStatus.criticalGaps > 0 ? "red" : "yellow"}
          />
          <MetricCard
            title="Next Audit"
            value={formatDate(realTimeStatus.nextAudit)}
            icon={FaCalendarAlt}
            subtext={`Due in ${realTimeStatus.auditDaysRemaining} days`}
            color={realTimeStatus.auditDaysRemaining < 7 ? "yellow" : "green"}
          />
        </div>

        {/* Parameter Compliance */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-4">
            Parameter Compliance (Last 60 minutes)
          </h4>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(realTimeStatus.parameters).map(([param, data]) => (
              <ParameterComplianceBar
                key={param}
                parameter={param}
                value={data.currentValue}
                min={data.regulatoryMin}
                max={data.regulatoryMax}
                status={data.status}
                history={data.history}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Compliance KPIs */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Compliance Key Performance Indicators
        </h3>
        <div className="grid grid-cols-4 gap-4">
          <KPICard
            title="Data Integrity Score"
            value={`${metrics.dataIntegrity}%`}
            target={99.5}
            unit="%"
            description="ALCOA+ compliance"
            chartData={metrics.integrityTrend}
          />
          <KPICard
            title="Mean Time Between Failures"
            value={`${metrics.mtbf}h`}
            target={500}
            unit="h"
            description="Equipment reliability"
          />
          <KPICard
            title="Deviation Rate"
            value={`${metrics.deviationRate}%`}
            target={1.0}
            unit="%"
            description="Monthly deviations"
          />
          <KPICard
            title="CAPA Closure Time"
            value={`${metrics.capaClosure}d`}
            target={30}
            unit="d"
            description="Average closure time"
          />
        </div>
      </div>

      {/* Active Deviations */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Active Deviations & CAPAs
          <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded text-sm">
            {metrics.activeDeviations.length + metrics.openCAPAs} Open
          </span>
        </h3>
        {metrics.activeDeviations.length > 0 ? (
          <div className="space-y-4">
            {metrics.activeDeviations.map((deviation) => (
              <DeviationCard
                key={deviation.id}
                deviation={deviation}
                onAcknowledge={handleAcknowledge}
                onEscalate={handleEscalate}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FaCheckCircle className="mx-auto text-4xl text-green-500 mb-2" />
            <p>No active deviations</p>
          </div>
        )}
      </div>
    </div>
  );
};

const FaCheckCircle = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
      clipRule="evenodd"
    />
  </svg>
);

export default ComplianceOverview;
