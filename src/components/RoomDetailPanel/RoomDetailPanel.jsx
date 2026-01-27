import React, { useState } from "react";
import {
  FaThermometerHalf,
  FaTint,
  FaCompressArrowsAlt,
  FaPills,
  FaInfoCircle,
  FaShieldAlt,
  FaCog,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaFlask,
  FaClipboardList,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
  FaSnowflake,
  FaWind,
} from "react-icons/fa";
import { MEDICINE_DATABASE } from "../../utils/constants";

// Status color configurations
const statusColors = {
  green: {
    bg: "bg-green-500",
    bgLight: "bg-green-50",
    text: "text-green-700",
    border: "border-green-300",
  },
  yellow: {
    bg: "bg-yellow-500",
    bgLight: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-300",
  },
  red: {
    bg: "bg-red-500",
    bgLight: "bg-red-50",
    text: "text-red-700",
    border: "border-red-300",
  },
};

// Tier badge colors
const tierColors = {
  "Ultra-Critical": { bg: "bg-purple-600", text: "text-white" },
  "High Sensitivity": { bg: "bg-blue-600", text: "text-white" },
  "Freeze-Sensitive": { bg: "bg-cyan-600", text: "text-white" },
  "Moisture-Sensitive": { bg: "bg-orange-500", text: "text-white" },
};

/**
 * Section Header Component
 */
const SectionHeader = ({ icon: Icon, title, color = "text-gray-700" }) => (
  <div className="flex items-center space-x-2 mb-3">
    <Icon className={`text-lg ${color}`} />
    <h3 className="font-semibold text-gray-800">{title}</h3>
  </div>
);

/**
 * Medicine Card Component - Shows detailed medicine info
 */
const MedicineCard = ({ medicineKey, medicineName }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const medicineInfo = MEDICINE_DATABASE[medicineKey];

  if (!medicineInfo) {
    return (
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center space-x-2">
          <FaPills className="text-blue-500" />
          <span className="font-medium text-blue-800">{medicineName}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <FaPills className="text-blue-600" />
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-800">{medicineInfo.name}</p>
            <p className="text-xs text-gray-500">{medicineInfo.type}</p>
          </div>
        </div>
        {isExpanded ? (
          <FaChevronUp className="text-gray-400" />
        ) : (
          <FaChevronDown className="text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 pt-0 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="p-2 bg-gray-50 rounded">
              <p className="text-xs text-gray-500">Manufacturer</p>
              <p className="text-sm font-medium">{medicineInfo.manufacturer}</p>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <p className="text-xs text-gray-500">Storage Temp</p>
              <p className="text-sm font-medium">{medicineInfo.storageTemp}</p>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <p className="text-xs text-gray-500">Shelf Life</p>
              <p className="text-sm font-medium">{medicineInfo.shelfLife}</p>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <p className="text-xs text-gray-500">Batch Tracking</p>
              <p className="text-sm font-medium">
                {medicineInfo.batchTracking ? "Required" : "Optional"}
              </p>
            </div>
          </div>
          {medicineInfo.criticalNote && (
            <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-200">
              <div className="flex items-start space-x-2">
                <FaExclamationTriangle className="text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800">
                  {medicineInfo.criticalNote}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Condition Display Component
 */
const ConditionDisplay = ({ condition, label, icon: Icon, status }) => {
  const colors = statusColors[status] || statusColors.green;

  return (
    <div className={`p-4 rounded-lg ${colors.bgLight} border ${colors.border}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Icon className={colors.text} />
          <span className="font-medium text-gray-700">{label}</span>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} text-white`}
        >
          {status.toUpperCase()}
        </span>
      </div>
      <div className="flex items-baseline space-x-1">
        <span className={`text-2xl font-bold ${colors.text}`}>
          {condition.current}
        </span>
        <span className="text-gray-500">{condition.unit}</span>
      </div>
      <div className="mt-2 flex justify-between text-xs text-gray-500">
        <span>
          Min: {condition.min}
          {condition.unit}
        </span>
        <span>
          Max: {condition.max}
          {condition.unit}
        </span>
      </div>
      {condition.note && (
        <p className="mt-2 text-xs text-gray-600 italic">{condition.note}</p>
      )}
      {condition.freezeNote && (
        <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-700 flex items-center space-x-1">
          <FaSnowflake />
          <span>{condition.freezeNote}</span>
        </div>
      )}
    </div>
  );
};

/**
 * Action Protocol Card Component
 */
const ActionProtocolCard = ({ level, protocol, isActive }) => {
  const configs = {
    green: {
      icon: FaCheckCircle,
      bg: "bg-green-50",
      border: "border-green-300",
      iconColor: "text-green-500",
      title: "Normal Operations (Green)",
    },
    yellow: {
      icon: FaExclamationTriangle,
      bg: "bg-yellow-50",
      border: "border-yellow-300",
      iconColor: "text-yellow-500",
      title: "Quarantine & Test (Yellow)",
    },
    red: {
      icon: FaTimesCircle,
      bg: "bg-red-50",
      border: "border-red-300",
      iconColor: "text-red-500",
      title: "Discard Protocol (Red)",
    },
  };

  const config = configs[level];
  const Icon = config.icon;

  return (
    <div
      className={`p-3 rounded-lg border-2 ${config.bg} ${
        isActive
          ? config.border + " ring-2 ring-offset-1"
          : "border-transparent"
      }`}
    >
      <div className="flex items-start space-x-2">
        <Icon className={`${config.iconColor} mt-0.5 flex-shrink-0`} />
        <div>
          <p className="font-medium text-gray-800 text-sm">{config.title}</p>
          <p className="text-xs text-gray-600 mt-1">{protocol}</p>
        </div>
      </div>
      {isActive && (
        <div className="mt-2 text-xs font-medium text-gray-700 bg-white px-2 py-1 rounded inline-block">
          ← Current Status
        </div>
      )}
    </div>
  );
};

/**
 * Main Room Detail Panel Component
 */
const RoomDetailPanel = ({ room, onClose }) => {
  const [activeTab, setActiveTab] = useState("overview");

  if (!room) return null;

  const {
    id,
    name,
    tier,
    description,
    medicines = [],
    medicineDetails = [],
    conditions = {},
    stabilityRationale = {},
    actionProtocols = {},
    equipment = {},
    complianceRequirements = [],
    status = "green",
  } = room;

  // Representative Product Examples data for each room
  const productExamples = {
    "room-1-cryo": {
      products:
        "Comirnaty (Pfizer), Kymriah (CAR-T), Zolgensma, Viral Seed Lots",
      temperature: "-90°C to -60°C",
      humidity: "<40% (To prevent frost build-up)",
      pressure: "+15 to +30 Pa",
      rationale:
        "Molecular Integrity: Prevents lipid shell rupture and mRNA strand breakage.",
    },
    "room-2-cold": {
      products: "Humira (mAbs), Lantus (Insulin), Covishield, Avonex",
      temperature: "2°C to 8°C",
      humidity: "45% - 55%",
      pressure: "+10 to +20 Pa",
      rationale:
        "Protein Folding: Prevents aggregation (clumping) which causes toxicity/loss of efficacy.",
    },
    "room-3-adjuvanted": {
      products: "Infanrix (DTaP), Engerix-B, Albumin, IVIG",
      temperature: "3°C to 8°C",
      humidity: "45% - 55%",
      pressure: "+10 to +20 Pa",
      rationale:
        "Colloidal Stability: Freezing causes irreversible clumping of aluminum adjuvants.",
    },
    "room-4-ambient": {
      products: "Stamaril (Yellow Fever), Augmentin (Dry Syrup), Advair (DPI)",
      temperature: "15°C to 25°C",
      humidity: "<30% (Strict)",
      pressure: "+5 to +15 Pa",
      rationale:
        "Hygroscopic Stability: Moisture causes 'melting' of dry powders and chemical hydrolysis.",
    },
  };

  const currentProductExample = productExamples[id];

  const tierColor = tierColors[tier] || {
    bg: "bg-gray-500",
    text: "text-white",
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: FaInfoCircle },
    { id: "medicines", label: "Medicines", icon: FaPills },
    { id: "conditions", label: "Conditions", icon: FaThermometerHalf },
    { id: "protocols", label: "Protocols", icon: FaClipboardList },
    { id: "compliance", label: "Compliance", icon: FaShieldAlt },
  ];

  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h2 className="text-xl font-bold">{name}</h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${tierColor.bg} ${tierColor.text}`}
              >
                {tier}
              </span>
            </div>
            <p className="text-slate-300 text-sm">{description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-600 rounded-lg transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        {/* Status Indicator */}
        <div className="mt-4 flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                statusColors[status]?.bg || "bg-gray-400"
              } animate-pulse`}
            />
            <span className="text-sm font-medium">
              Status: {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
          <div className="text-slate-400 text-sm">
            {medicines.length} medicines stored
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Icon className="text-sm" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Representative Product Examples */}
            {currentProductExample && (
              <div>
                <SectionHeader
                  icon={FaPills}
                  title="Representative Product Examples"
                  color="text-blue-600"
                />
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                  {/* Products */}
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                      Products Stored
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {currentProductExample.products
                        .split(", ")
                        .map((product, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 bg-white text-blue-700 text-sm font-medium rounded-full border border-blue-200 shadow-sm"
                          >
                            {product}
                          </span>
                        ))}
                    </div>
                  </div>

                  {/* Storage Requirements Grid */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-white p-3 rounded-lg border border-blue-100">
                      <div className="flex items-center space-x-2 mb-1">
                        <FaThermometerHalf className="text-red-500" />
                        <span className="text-xs font-medium text-gray-500">
                          Temperature
                        </span>
                      </div>
                      <p className="text-sm font-bold text-gray-800">
                        {currentProductExample.temperature}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-blue-100">
                      <div className="flex items-center space-x-2 mb-1">
                        <FaTint className="text-blue-500" />
                        <span className="text-xs font-medium text-gray-500">
                          Humidity
                        </span>
                      </div>
                      <p className="text-sm font-bold text-gray-800">
                        {currentProductExample.humidity}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-blue-100">
                      <div className="flex items-center space-x-2 mb-1">
                        <FaCompressArrowsAlt className="text-purple-500" />
                        <span className="text-xs font-medium text-gray-500">
                          Pressure
                        </span>
                      </div>
                      <p className="text-sm font-bold text-gray-800">
                        {currentProductExample.pressure}
                      </p>
                    </div>
                  </div>

                  {/* Rationale */}
                  <div className="bg-white p-3 rounded-lg border border-blue-100">
                    <div className="flex items-start space-x-2">
                      <FaFlask className="text-purple-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                          Storage Rationale
                        </p>
                        <p className="text-sm text-gray-700">
                          {currentProductExample.rationale}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stability Rationale */}
            {stabilityRationale && (
              <div>
                <SectionHeader
                  icon={FaFlask}
                  title="Stability Rationale"
                  color="text-purple-600"
                />
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h4 className="font-semibold text-purple-800 mb-2">
                    {stabilityRationale.title || "Storage Rationale"}
                  </h4>
                  <p className="text-gray-700 text-sm mb-3">
                    {stabilityRationale.impact ||
                      "Maintains product stability and efficacy."}
                  </p>
                  {stabilityRationale.details &&
                    stabilityRationale.details.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-600 uppercase">
                          Critical Factors:
                        </p>
                        <ul className="grid grid-cols-2 gap-1">
                          {stabilityRationale.details.map((detail, idx) => (
                            <li
                              key={idx}
                              className="text-xs text-gray-600 flex items-center space-x-1"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div>
              <SectionHeader
                icon={FaThermometerHalf}
                title="Current Readings"
                color="text-blue-600"
              />
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <FaThermometerHalf className="mx-auto text-blue-500 text-xl mb-1" />
                  <p className="text-lg font-bold text-blue-700">
                    {conditions.temperature?.current}
                    {conditions.temperature?.unit}
                  </p>
                  <p className="text-xs text-gray-500">Temperature</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                  <FaTint className="mx-auto text-green-500 text-xl mb-1" />
                  <p className="text-lg font-bold text-green-700">
                    {conditions.humidity?.current}
                    {conditions.humidity?.unit}
                  </p>
                  <p className="text-xs text-gray-500">Humidity</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <FaCompressArrowsAlt className="mx-auto text-purple-500 text-xl mb-1" />
                  <p className="text-lg font-bold text-purple-700">
                    {conditions.pressureDifferential?.current}
                    {conditions.pressureDifferential?.unit}
                  </p>
                  <p className="text-xs text-gray-500">Pressure Diff</p>
                </div>
              </div>
            </div>

            {/* Equipment Summary */}
            {equipment && Object.keys(equipment).length > 0 && (
              <div>
                <SectionHeader
                  icon={FaCog}
                  title="Equipment"
                  color="text-gray-600"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-xs text-gray-500">Primary Cooling</p>
                    <p className="text-sm font-medium">
                      {equipment.primaryCooling || "N/A"}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-xs text-gray-500">Backup System</p>
                    <p className="text-sm font-medium">
                      {equipment.backup || "N/A"}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-xs text-gray-500">Monitoring</p>
                    <p className="text-sm font-medium">
                      {equipment.monitoring || "N/A"}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-xs text-gray-500">Alarm Delay</p>
                    <p className="text-sm font-medium">
                      {equipment.alarmDelay || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Medicines Tab */}
        {activeTab === "medicines" && (
          <div className="space-y-4">
            <SectionHeader
              icon={FaPills}
              title={`Stored Medicines (${medicines.length})`}
              color="text-blue-600"
            />
            <p className="text-sm text-gray-600 mb-4">
              Click on each medicine to view detailed storage requirements and
              critical handling notes.
            </p>
            <div className="space-y-3">
              {medicines.map((medicine, index) => (
                <MedicineCard
                  key={index}
                  medicineKey={medicineDetails[index]}
                  medicineName={medicine}
                />
              ))}
            </div>
          </div>
        )}

        {/* Conditions Tab */}
        {activeTab === "conditions" && (
          <div className="space-y-4">
            <SectionHeader
              icon={FaThermometerHalf}
              title="Environmental Conditions"
              color="text-blue-600"
            />
            <div className="space-y-4">
              {conditions.temperature && (
                <ConditionDisplay
                  condition={conditions.temperature}
                  label="Temperature"
                  icon={FaThermometerHalf}
                  status={status}
                />
              )}
              {conditions.humidity && (
                <ConditionDisplay
                  condition={conditions.humidity}
                  label="Humidity"
                  icon={FaTint}
                  status={status}
                />
              )}
              {conditions.pressureDifferential && (
                <ConditionDisplay
                  condition={conditions.pressureDifferential}
                  label="Pressure Differential"
                  icon={FaWind}
                  status={status}
                />
              )}
            </div>
          </div>
        )}

        {/* Protocols Tab */}
        {activeTab === "protocols" && (
          <div className="space-y-4">
            <SectionHeader
              icon={FaClipboardList}
              title="Action Protocols"
              color="text-orange-600"
            />
            <p className="text-sm text-gray-600 mb-4">
              Response protocols based on current environmental status. The
              active protocol is highlighted.
            </p>
            <div className="space-y-3">
              <ActionProtocolCard
                level="green"
                protocol={
                  actionProtocols?.green ||
                  "Normal Operations: Product remains in standard inventory."
                }
                isActive={status === "green"}
              />
              <ActionProtocolCard
                level="yellow"
                protocol={
                  actionProtocols?.yellow ||
                  "Quarantine & Test: Perform quality assessment before release."
                }
                isActive={status === "yellow"}
              />
              <ActionProtocolCard
                level="red"
                protocol={
                  actionProtocols?.red ||
                  "Discard Protocol: Initiate disposal procedure due to potential degradation."
                }
                isActive={status === "red"}
              />
            </div>
          </div>
        )}

        {/* Compliance Tab */}
        {activeTab === "compliance" && (
          <div className="space-y-4">
            <SectionHeader
              icon={FaShieldAlt}
              title="Compliance Requirements"
              color="text-green-600"
            />
            <div className="bg-green-50 rounded-lg p-4 border border-green-200 mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <FaCheckCircle className="text-green-600" />
                <span className="font-medium text-green-800">
                  This room complies with the following standards:
                </span>
              </div>
            </div>
            <div className="space-y-2">
              {complianceRequirements.map((req, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-green-300 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <FaShieldAlt className="text-green-600 text-sm" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{req}</p>
                    <p className="text-xs text-gray-500">
                      {req.includes("FDA")
                        ? "U.S. Food and Drug Administration"
                        : req.includes("EU GMP")
                        ? "European Union Good Manufacturing Practice"
                        : req.includes("WHO")
                        ? "World Health Organization"
                        : req.includes("ICH")
                        ? "International Council for Harmonisation"
                        : req.includes("PIC/S")
                        ? "Pharmaceutical Inspection Co-operation Scheme"
                        : req.includes("USP")
                        ? "United States Pharmacopeia"
                        : "Regulatory Standard"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomDetailPanel;
