import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { generateHistoricalData } from "../../services/mockApi";

const conditionColors = {
  temperature: "#3B82F6",
  humidity: "#10B981",
  pressure: "#8B5CF6",
};

const ConditionChart = ({ room }) => {
  const historicalData = useMemo(() => {
    return generateHistoricalData(room, 12);
  }, [room]);

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-700">24-Hour Trend</h4>

      {Object.entries(room.conditions).map(([key, condition]) => (
        <div key={key} className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-600 mb-2 capitalize">{key}</p>
          <ResponsiveContainer width="100%" height={100}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#9ca3af" />
              <YAxis
                domain={[
                  condition.min - (condition.max - condition.min) * 0.2,
                  condition.max + (condition.max - condition.min) * 0.2,
                ]}
                tick={{ fontSize: 10 }}
                stroke="#9ca3af"
                width={35}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
                formatter={(value) => [`${value} ${condition.unit}`, key]}
              />
              <ReferenceLine
                y={condition.max}
                stroke="#EF4444"
                strokeDasharray="5 5"
                label={{ value: "Max", fontSize: 10, fill: "#EF4444" }}
              />
              <ReferenceLine
                y={condition.min}
                stroke="#EF4444"
                strokeDasharray="5 5"
                label={{ value: "Min", fontSize: 10, fill: "#EF4444" }}
              />
              <Line
                type="monotone"
                dataKey={key}
                stroke={conditionColors[key]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
};

export default ConditionChart;
