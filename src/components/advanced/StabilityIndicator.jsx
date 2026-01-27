import React, { useMemo } from "react";
import {
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaExclamationCircle,
} from "react-icons/fa";

/**
 * Trend direction calculation
 */
const calculateTrend = (history, periods = 6) => {
  if (!history || history.length < 2)
    return { direction: "stable", change: 0, velocity: 0 };

  const recent = history.slice(-periods);
  if (recent.length < 2) return { direction: "stable", change: 0, velocity: 0 };

  const first = recent[0];
  const last = recent[recent.length - 1];
  const change = last - first;
  const velocity = change / recent.length;

  // Calculate standard deviation for volatility
  const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
  const squaredDiffs = recent.map((v) => Math.pow(v - mean, 2));
  const stdDev = Math.sqrt(
    squaredDiffs.reduce((a, b) => a + b, 0) / recent.length
  );

  let direction = "stable";
  if (Math.abs(change) > stdDev * 0.5) {
    direction = change > 0 ? "rising" : "falling";
  }

  return { direction, change, velocity, stdDev };
};

/**
 * Mini Sparkline component
 */
const Sparkline = ({
  data,
  width = 60,
  height = 24,
  color = "#3B82F6",
  showDots = false,
}) => {
  const points = useMemo(() => {
    if (!data || data.length === 0) return "";

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const xStep = width / (data.length - 1 || 1);

    return data
      .map((value, index) => {
        const x = index * xStep;
        const y = height - ((value - min) / range) * (height - 4) - 2;
        return `${x},${y}`;
      })
      .join(" ");
  }, [data, width, height]);

  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ width, height }}
      >
        <span className="text-xs text-gray-400">No data</span>
      </div>
    );
  }

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDots &&
        data.map((value, index) => {
          const min = Math.min(...data);
          const max = Math.max(...data);
          const range = max - min || 1;
          const x = index * (width / (data.length - 1 || 1));
          const y = height - ((value - min) / range) * (height - 4) - 2;

          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="2"
              fill={index === data.length - 1 ? color : "white"}
              stroke={color}
              strokeWidth="1"
            />
          );
        })}
    </svg>
  );
};

/**
 * Stability Score Calculator
 */
const calculateStabilityScore = (history, targetMin, targetMax) => {
  if (!history || history.length < 2) return { score: 100, factors: [] };

  const target = (targetMin + targetMax) / 2;
  const range = targetMax - targetMin;

  // Calculate deviation from target
  const deviations = history.map((v) => Math.abs(v - target) / (range / 2));
  const avgDeviation =
    deviations.reduce((a, b) => a + b, 0) / deviations.length;

  // Calculate volatility (coefficient of variation)
  const mean = history.reduce((a, b) => a + b, 0) / history.length;
  const squaredDiffs = history.map((v) => Math.pow(v - mean, 2));
  const stdDev = Math.sqrt(
    squaredDiffs.reduce((a, b) => a + b, 0) / history.length
  );
  const cv = stdDev / (mean || 1);

  // Calculate out-of-range incidents
  const outOfRange = history.filter(
    (v) => v < targetMin || v > targetMax
  ).length;
  const outOfRangeRatio = outOfRange / history.length;

  // Calculate trend stability
  const trend = calculateTrend(history);
  const trendPenalty = Math.min(Math.abs(trend.velocity) * 10, 20);

  // Combine factors into stability score (0-100)
  const factors = [
    {
      name: "Deviation",
      value: Math.max(0, 100 - avgDeviation * 50),
      weight: 0.3,
    },
    { name: "Volatility", value: Math.max(0, 100 - cv * 200), weight: 0.25 },
    { name: "In-Range", value: (1 - outOfRangeRatio) * 100, weight: 0.35 },
    { name: "Trend", value: Math.max(0, 100 - trendPenalty), weight: 0.1 },
  ];

  const score = factors.reduce((acc, f) => acc + f.value * f.weight, 0);

  return { score: Math.round(score), factors };
};

/**
 * Stability Indicator Component
 */
const StabilityIndicator = ({
  history,
  targetMin,
  targetMax,
  label = "Stability",
  showDetails = true,
  showSparkline = true,
  compact = false,
}) => {
  const stability = useMemo(
    () => calculateStabilityScore(history, targetMin, targetMax),
    [history, targetMin, targetMax]
  );

  const trend = useMemo(() => calculateTrend(history), [history]);

  const getScoreColor = (score) => {
    if (score >= 90)
      return {
        bg: "bg-green-500",
        text: "text-green-700",
        light: "bg-green-100",
      };
    if (score >= 70)
      return {
        bg: "bg-yellow-500",
        text: "text-yellow-700",
        light: "bg-yellow-100",
      };
    return { bg: "bg-red-500", text: "text-red-700", light: "bg-red-100" };
  };

  const getTrendIcon = (direction) => {
    switch (direction) {
      case "rising":
        return <FaArrowUp className="text-orange-500" />;
      case "falling":
        return <FaArrowDown className="text-blue-500" />;
      default:
        return <FaMinus className="text-gray-400" />;
    }
  };

  const colors = getScoreColor(stability.score);

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <div
          className={`w-8 h-8 rounded-full ${colors.bg} flex items-center justify-center`}
        >
          <span className="text-xs font-bold text-white">
            {stability.score}
          </span>
        </div>
        {showSparkline && (
          <Sparkline
            data={history?.slice(-12)}
            color={colors.text.replace("text-", "#")}
            width={40}
            height={16}
          />
        )}
        {getTrendIcon(trend.direction)}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">{label}</h3>
        <div className="flex items-center space-x-2">
          {getTrendIcon(trend.direction)}
          <span className="text-xs text-gray-500 capitalize">
            {trend.direction}
          </span>
        </div>
      </div>

      {/* Score display */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="relative w-16 h-16">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="6"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke={
                stability.score >= 90
                  ? "#10B981"
                  : stability.score >= 70
                  ? "#F59E0B"
                  : "#EF4444"
              }
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${(stability.score / 100) * 2 * Math.PI * 28} ${
                2 * Math.PI * 28
              }`}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-gray-800">
              {stability.score}
            </span>
          </div>
        </div>

        {showSparkline && (
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-1">Recent Trend</p>
            <Sparkline
              data={history?.slice(-24)}
              color={
                stability.score >= 90
                  ? "#10B981"
                  : stability.score >= 70
                  ? "#F59E0B"
                  : "#EF4444"
              }
              width={100}
              height={32}
              showDots={false}
            />
          </div>
        )}
      </div>

      {/* Factor breakdown */}
      {showDetails && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600">Stability Factors</p>
          {stability.factors.map((factor) => (
            <div key={factor.name} className="flex items-center">
              <span className="text-xs text-gray-500 w-20">{factor.name}</span>
              <div className="flex-1 h-1.5 bg-gray-200 rounded-full mx-2">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    factor.value >= 80
                      ? "bg-green-500"
                      : factor.value >= 60
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${factor.value}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-600 w-8">
                {Math.round(factor.value)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Warning if unstable */}
      {stability.score < 70 && (
        <div className="mt-3 flex items-center space-x-2 p-2 bg-red-50 rounded-lg">
          <FaExclamationCircle className="text-red-500" />
          <span className="text-xs text-red-700">
            Parameter showing instability. Review required.
          </span>
        </div>
      )}
    </div>
  );
};

export default StabilityIndicator;
export { Sparkline, calculateStabilityScore, calculateTrend };
