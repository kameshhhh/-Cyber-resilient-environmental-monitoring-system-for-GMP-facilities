// Status colors
export const STATUS_COLORS = {
  GREEN: "#10B981",
  YELLOW: "#F59E0B",
  RED: "#EF4444",
};

// Status labels
export const STATUS_LABELS = {
  GREEN: "Optimal",
  YELLOW: "Marginal",
  RED: "Critical",
};

// Condition icons mapping
export const CONDITION_ICONS = {
  temperature: "FaThermometerHalf",
  humidity: "FaTint",
  pressure: "FaCompressArrowsAlt",
  pressureDifferential: "FaArrowsAltV",
};

/**
 * Room Stability Tiers & Pharmaceutical Storage Configuration
 * Based on FDA 21 CFR Part 211, EU GMP Annex 15, WHO TRS 961, ICH Q1A
 */

// Action Protocols for each status level
export const ACTION_PROTOCOLS = {
  GREEN: {
    label: "Normal Operations",
    action:
      "Product remains in standard inventory. Batch remains 'Released' for shipping.",
  },
  YELLOW: {
    label: "Quarantine & Test",
    action:
      "Perform 'Analytical Ultracentrifugation' to check LNP integrity. Hold for QA review.",
  },
  RED: {
    label: "Discard Protocol",
    action:
      "Irreversible degradation of mRNA strands and loss of sterility. Initiate disposal procedure.",
  },
};

// Room-specific stability rationales
export const STABILITY_RATIONALES = {
  "room-1-cryo": {
    title: "Molecular Integrity",
    description:
      "Prevents lipid shell rupture and mRNA strand breakage. Ultra-low temperatures maintain lipid nanoparticle (LNP) structure essential for vaccine efficacy.",
    criticalFactors: [
      "LNP stability",
      "mRNA integrity",
      "Lipid crystallization prevention",
    ],
  },
  "room-2-cold": {
    title: "Protein Folding",
    description:
      "Prevents aggregation (clumping) which causes toxicity/loss of efficacy. Maintains tertiary structure of monoclonal antibodies and insulin.",
    criticalFactors: [
      "Protein aggregation",
      "Deamidation prevention",
      "Oxidation control",
    ],
  },
  "room-3-adjuvanted": {
    title: "Colloidal Stability",
    description:
      "Freezing causes irreversible clumping of aluminum adjuvants. Maintains vaccine potency and injection safety.",
    criticalFactors: [
      "Aluminum salt stability",
      "Antigen adsorption",
      "Particle size distribution",
    ],
  },
  "room-4-ambient": {
    title: "Hygroscopic Stability",
    description:
      "Moisture causes 'melting' of dry powders and chemical hydrolysis. Prevents cake collapse and maintains powder flowability.",
    criticalFactors: [
      "Moisture content",
      "Powder flowability",
      "Chemical stability",
    ],
  },
};

// Detailed threshold configurations for status calculation
export const ROOM_THRESHOLDS = {
  "room-1-cryo": {
    temperature: {
      green: { min: -90, max: -60 },
      yellow: { min: -59, max: -40 },
      red: {
        min: -20,
        max: Infinity,
        note: "Any duration above -40°C or >2 hours above -60°C",
      },
    },
    humidity: {
      green: { min: 0, max: 40 },
      yellow: { min: 40, max: 60 },
      red: { min: 60, max: 100 },
    },
    pressureDifferential: {
      green: { min: 15, max: 30 },
      yellow: { min: 5, max: 14 },
      red: {
        min: -10,
        max: 0,
        note: "Neutral or negative pressure - contamination risk",
      },
    },
  },
  "room-2-cold": {
    temperature: {
      green: { min: 2, max: 8 },
      yellow: { min: 9, max: 15, minYellow: -2, maxYellow: 1 },
      red: {
        min: 15,
        max: Infinity,
        note: ">15°C for 4+ hours or <2°C (freezing risk)",
      },
    },
    humidity: {
      green: { min: 45, max: 55 },
      yellow: { min: 56, max: 70 },
      red: { min: 70, max: 100 },
    },
    pressureDifferential: {
      green: { min: 10, max: 20 },
      yellow: { min: 5, max: 9 },
      red: { min: -10, max: 0 },
    },
  },
  "room-3-adjuvanted": {
    temperature: {
      green: { min: 3, max: 8 },
      yellow: { min: 9, max: 20, minYellow: 0, maxYellow: 2 },
      red: { min: -20, max: -1, note: "Freezing causes irreversible damage" },
    },
    humidity: {
      green: { min: 45, max: 55 },
      yellow: { min: 56, max: 70 },
      red: { min: 70, max: 100 },
    },
    pressureDifferential: {
      green: { min: 10, max: 20 },
      yellow: { min: 5, max: 9 },
      red: { min: -10, max: 0 },
    },
  },
  "room-4-ambient": {
    temperature: {
      green: { min: 15, max: 25 },
      yellow: { min: 26, max: 30 },
      red: { min: 35, max: Infinity },
    },
    humidity: {
      green: { min: 0, max: 30 },
      yellow: { min: 31, max: 50 },
      red: { min: 60, max: 100 },
    },
    pressureDifferential: {
      green: { min: 5, max: 15 },
      yellow: { min: 1, max: 4 },
      red: { min: -10, max: 0 },
    },
  },
};

// Medicine database with detailed pharmaceutical information
export const MEDICINE_DATABASE = {
  // Room 1: Ultra-Critical (Cryo) Products
  comirnaty: {
    name: "Comirnaty (Pfizer-BioNTech)",
    type: "mRNA COVID-19 Vaccine",
    manufacturer: "Pfizer/BioNTech",
    storageTemp: "-90°C to -60°C",
    shelfLife: "6 months at ultra-cold",
    criticalNote: "Must not exceed -60°C for >2 hours",
    batchTracking: true,
  },
  kymriah: {
    name: "Kymriah (CAR-T)",
    type: "CAR-T Cell Therapy",
    manufacturer: "Novartis",
    storageTemp: "-120°C to -80°C",
    shelfLife: "1 year",
    criticalNote: "Patient-specific autologous therapy",
    batchTracking: true,
  },
  zolgensma: {
    name: "Zolgensma",
    type: "Gene Therapy (AAV9)",
    manufacturer: "Novartis",
    storageTemp: "-60°C or below",
    shelfLife: "18 months",
    criticalNote: "Single-dose gene replacement therapy",
    batchTracking: true,
  },
  "viral-seed": {
    name: "Viral Seed Lots",
    type: "Vaccine Manufacturing Stock",
    manufacturer: "Various",
    storageTemp: "-70°C to -60°C",
    shelfLife: "Varies",
    criticalNote: "Master/Working seed lot system",
    batchTracking: true,
  },
  // Room 2: High Sensitivity (Cold) Products
  humira: {
    name: "Humira (Adalimumab)",
    type: "Monoclonal Antibody (mAb)",
    manufacturer: "AbbVie",
    storageTemp: "2°C to 8°C",
    shelfLife: "24 months",
    criticalNote: "Do not freeze - protein aggregation risk",
    batchTracking: true,
  },
  lantus: {
    name: "Lantus (Insulin Glargine)",
    type: "Long-acting Insulin",
    manufacturer: "Sanofi",
    storageTemp: "2°C to 8°C",
    shelfLife: "28 days after opening",
    criticalNote: "Freezing destroys insulin structure",
    batchTracking: true,
  },
  covishield: {
    name: "Covishield",
    type: "Viral Vector COVID-19 Vaccine",
    manufacturer: "Serum Institute/AstraZeneca",
    storageTemp: "2°C to 8°C",
    shelfLife: "6 months",
    criticalNote: "Standard cold chain vaccine",
    batchTracking: true,
  },
  avonex: {
    name: "Avonex (Interferon beta-1a)",
    type: "Multiple Sclerosis Treatment",
    manufacturer: "Biogen",
    storageTemp: "2°C to 8°C",
    shelfLife: "24 months",
    criticalNote: "Protect from light",
    batchTracking: true,
  },
  // Room 3: Freeze-Sensitive (Adjuvanted) Products
  infanrix: {
    name: "Infanrix (DTaP)",
    type: "Diphtheria-Tetanus-Pertussis Vaccine",
    manufacturer: "GSK",
    storageTemp: "2°C to 8°C",
    shelfLife: "36 months",
    criticalNote: "Aluminum adjuvant - never freeze",
    batchTracking: true,
  },
  "engerix-b": {
    name: "Engerix-B",
    type: "Hepatitis B Vaccine",
    manufacturer: "GSK",
    storageTemp: "2°C to 8°C",
    shelfLife: "36 months",
    criticalNote: "Contains aluminum hydroxide adjuvant",
    batchTracking: true,
  },
  albumin: {
    name: "Human Albumin 20%",
    type: "Plasma Protein Fraction",
    manufacturer: "Various",
    storageTemp: "2°C to 8°C",
    shelfLife: "36 months",
    criticalNote: "Do not freeze - protein denaturation",
    batchTracking: true,
  },
  ivig: {
    name: "IVIG (Immunoglobulin)",
    type: "Intravenous Immunoglobulin",
    manufacturer: "Various",
    storageTemp: "2°C to 8°C",
    shelfLife: "24-36 months",
    criticalNote: "Pooled human plasma product",
    batchTracking: true,
  },
  // Room 4: Moisture-Sensitive (Ambient) Products
  stamaril: {
    name: "Stamaril",
    type: "Yellow Fever Vaccine (Lyophilized)",
    manufacturer: "Sanofi Pasteur",
    storageTemp: "2°C to 25°C",
    shelfLife: "36 months",
    criticalNote: "Reconstitute before use - moisture sensitive",
    batchTracking: true,
  },
  "augmentin-ds": {
    name: "Augmentin Dry Syrup",
    type: "Antibiotic (Amoxicillin/Clavulanate)",
    manufacturer: "GSK",
    storageTemp: "15°C to 25°C",
    shelfLife: "24 months dry, 7 days reconstituted",
    criticalNote: "Hygroscopic - keep container tightly closed",
    batchTracking: false,
  },
  advair: {
    name: "Advair Diskus (DPI)",
    type: "Dry Powder Inhaler",
    manufacturer: "GSK",
    storageTemp: "15°C to 25°C",
    shelfLife: "24 months",
    criticalNote: "Moisture causes powder clumping",
    batchTracking: false,
  },
};

// Initial room configurations based on pharmaceutical data sheets
export const INITIAL_ROOMS = [
  {
    id: "room-1-cryo",
    name: "Room 1: Ultra-Critical (Cryo)",
    shortName: "Cryo Storage",
    tier: "Ultra-Critical",
    description:
      "Ultra-low temperature storage for mRNA vaccines, gene therapies, and viral seed lots",
    medicines: [
      "Comirnaty (Pfizer)",
      "Kymriah (CAR-T)",
      "Zolgensma",
      "Viral Seed Lots",
    ],
    medicineDetails: ["comirnaty", "kymriah", "zolgensma", "viral-seed"],
    conditions: {
      temperature: {
        min: -90,
        max: -60,
        current: -75,
        unit: "°C",
        criticalLow: -95,
        criticalHigh: -40,
        yellowLow: -59,
        yellowHigh: -40,
      },
      humidity: {
        min: 0,
        max: 40,
        current: 25,
        unit: "%",
        criticalHigh: 60,
        yellowHigh: 60,
        note: "Low humidity prevents frost build-up",
      },
      pressureDifferential: {
        min: 15,
        max: 30,
        current: 22,
        unit: "Pa",
        criticalLow: 0,
        yellowLow: 5,
        note: "Positive pressure prevents contamination",
      },
    },
    stabilityRationale: {
      title: "Molecular Integrity",
      impact: "Prevents lipid shell rupture and mRNA strand breakage",
      details: [
        "LNP (Lipid Nanoparticle) structure preservation",
        "mRNA stability maintenance",
        "Prevention of lipid crystallization",
        "Cryoprotectant efficacy",
      ],
    },
    actionProtocols: {
      green: "Normal Operations: Batch remains 'Released' for shipping.",
      yellow:
        "Quarantine & Test: Perform 'Analytical Ultracentrifugation' to check LNP integrity.",
      red: "Discard: Irreversible degradation of mRNA strands and loss of sterility.",
    },
    equipment: {
      primaryCooling: "Cascade Refrigeration System",
      backup: "LN2 Backup System",
      monitoring: "24/7 Continuous with 1-min intervals",
      alarmDelay: "0 minutes (immediate)",
    },
    complianceRequirements: [
      "FDA 21 CFR 211.142",
      "EU GMP Annex 15",
      "WHO PQS E006",
    ],
    lastUpdated: new Date().toISOString(),
    status: "green",
    isOnline: true,
  },
  {
    id: "room-2-cold",
    name: "Room 2: High Sensitivity (Cold)",
    shortName: "Cold Storage",
    tier: "High Sensitivity",
    description:
      "Standard cold storage for biologics, monoclonal antibodies, and insulin products",
    medicines: ["Humira (mAbs)", "Lantus (Insulin)", "Covishield", "Avonex"],
    medicineDetails: ["humira", "lantus", "covishield", "avonex"],
    conditions: {
      temperature: {
        min: 2,
        max: 8,
        current: 5,
        unit: "°C",
        criticalLow: -2,
        criticalHigh: 15,
        yellowLow: 1,
        yellowHigh: 9,
        freezeWarning: true,
      },
      humidity: {
        min: 45,
        max: 55,
        current: 50,
        unit: "%",
        criticalHigh: 70,
        yellowHigh: 70,
      },
      pressureDifferential: {
        min: 10,
        max: 20,
        current: 15,
        unit: "Pa",
        criticalLow: 0,
        yellowLow: 5,
      },
    },
    stabilityRationale: {
      title: "Protein Folding",
      impact:
        "Prevents aggregation (clumping) which causes toxicity/loss of efficacy",
      details: [
        "Tertiary structure maintenance",
        "Prevention of protein aggregation",
        "Deamidation control",
        "Oxidation prevention",
      ],
    },
    actionProtocols: {
      green: "Safe: Product remains in standard inventory.",
      yellow:
        "Quarantine & Test: Perform 'Analytical Ultracentrifugation' to check LNP integrity.",
      red: "Discard: Irreversible degradation of mRNA strands and loss of sterility.",
    },
    equipment: {
      primaryCooling: "Pharmaceutical-grade Refrigeration",
      backup: "Redundant Compressor System",
      monitoring: "24/7 Continuous with 5-min intervals",
      alarmDelay: "5 minutes",
    },
    complianceRequirements: [
      "FDA 21 CFR 211.142",
      "EU GMP Annex 15",
      "ICH Q1A",
    ],
    lastUpdated: new Date().toISOString(),
    status: "green",
    isOnline: true,
  },
  {
    id: "room-3-adjuvanted",
    name: "Room 3: Freeze-Sensitive (Adjuvanted)",
    shortName: "Adjuvanted Storage",
    tier: "Freeze-Sensitive",
    description:
      "Storage for aluminum-adjuvanted vaccines and freeze-sensitive biologics",
    medicines: ["Infanrix (DTaP)", "Engerix-B", "Albumin", "IVIG"],
    medicineDetails: ["infanrix", "engerix-b", "albumin", "ivig"],
    conditions: {
      temperature: {
        min: 3,
        max: 8,
        current: 5.5,
        unit: "°C",
        criticalLow: 0,
        criticalHigh: 15,
        yellowLow: 2,
        yellowHigh: 9,
        freezeWarning: true,
        freezeNote: "NEVER FREEZE - Irreversible adjuvant clumping",
      },
      humidity: {
        min: 45,
        max: 55,
        current: 50,
        unit: "%",
        criticalHigh: 70,
        yellowHigh: 70,
      },
      pressureDifferential: {
        min: 10,
        max: 20,
        current: 15,
        unit: "Pa",
        criticalLow: 0,
        yellowLow: 5,
      },
    },
    stabilityRationale: {
      title: "Colloidal Stability",
      impact: "Freezing causes irreversible clumping of aluminum adjuvants",
      details: [
        "Aluminum salt particle size maintenance",
        "Antigen adsorption preservation",
        "Prevention of adjuvant aggregation",
        "Injection safety maintenance",
      ],
    },
    actionProtocols: {
      green: "Safe: Product remains in standard inventory.",
      yellow:
        "Quarantine & Test: Perform 'Analytical Ultracentrifugation' to check LNP integrity.",
      red: "Discard: Irreversible degradation of mRNA strands and loss of sterility.",
    },
    equipment: {
      primaryCooling: "Pharmaceutical-grade Refrigeration",
      backup: "Anti-freeze Protection System",
      monitoring: "24/7 Continuous with 5-min intervals",
      alarmDelay: "5 minutes",
    },
    complianceRequirements: ["FDA 21 CFR 211.142", "WHO TRS 961", "PIC/S GDP"],
    lastUpdated: new Date().toISOString(),
    status: "green",
    isOnline: true,
  },
  {
    id: "room-4-ambient",
    name: "Room 4: Moisture-Sensitive (Ambient)",
    shortName: "Ambient Storage",
    tier: "Moisture-Sensitive",
    description:
      "Controlled ambient storage for hygroscopic pharmaceuticals and dry powder formulations",
    medicines: [
      "Stamaril (Yellow Fever)",
      "Augmentin (Dry Syrup)",
      "Advair (DPI)",
    ],
    medicineDetails: ["stamaril", "augmentin-ds", "advair"],
    conditions: {
      temperature: {
        min: 15,
        max: 25,
        current: 20,
        unit: "°C",
        criticalLow: 10,
        criticalHigh: 35,
        yellowLow: 14,
        yellowHigh: 30,
      },
      humidity: {
        min: 0,
        max: 30,
        current: 22,
        unit: "%",
        criticalHigh: 60,
        yellowHigh: 50,
        note: "Strict humidity control - <30% required",
        strictControl: true,
      },
      pressureDifferential: {
        min: 5,
        max: 15,
        current: 10,
        unit: "Pa",
        criticalLow: 0,
        yellowLow: 1,
      },
    },
    stabilityRationale: {
      title: "Hygroscopic Stability",
      impact:
        "Moisture causes 'melting' of dry powders and chemical hydrolysis",
      details: [
        "Prevention of moisture absorption",
        "Powder flowability maintenance",
        "Chemical hydrolysis prevention",
        "Cake collapse prevention",
      ],
    },
    actionProtocols: {
      green: "Safe: Powders remain dry and 'flowable'.",
      yellow:
        "Test: Check for 'cake collapse' or moisture content (Karl Fischer test).",
      red: "Discard: Hydrolysis (chemical breakdown) or clumping.",
    },
    equipment: {
      primaryCooling: "HVAC with Dehumidification",
      backup: "Desiccant System",
      monitoring: "24/7 Continuous with 15-min intervals",
      alarmDelay: "15 minutes",
    },
    complianceRequirements: ["FDA 21 CFR 211.142", "ICH Q1A", "USP <659>"],
    lastUpdated: new Date().toISOString(),
    status: "green",
    isOnline: true,
  },
];

// Update interval in milliseconds
export const UPDATE_INTERVAL = 5000;

// Margin percentage for status calculation
export const MARGIN_PERCENTAGE = 0.1;

// Local storage keys
export const STORAGE_KEYS = {
  ROOMS: "medicine-monitor-rooms",
  ALERTS: "medicine-monitor-alerts",
  SETTINGS: "medicine-monitor-settings",
};

// Alert severity levels
export const ALERT_SEVERITIES = {
  INFO: { level: 0, label: "Info", color: "#3B82F6" },
  WARNING: { level: 1, label: "Warning", color: "#F59E0B" },
  CRITICAL: { level: 2, label: "Critical", color: "#EF4444" },
  EMERGENCY: { level: 3, label: "Emergency", color: "#7C3AED" },
};

// Compliance frameworks
export const COMPLIANCE_FRAMEWORKS = {
  FDA: {
    name: "FDA 21 CFR Part 211",
    requirements: ["211.46", "211.58", "211.68", "211.142", "211.160"],
  },
  EU_GMP: {
    name: "EU GMP",
    requirements: ["Annex 11", "Annex 15"],
  },
  WHO: {
    name: "WHO TRS",
    requirements: ["TRS 961", "PQS E006"],
  },
  ICH: {
    name: "ICH Guidelines",
    requirements: ["Q1A(R2)", "Q1E", "Q7"],
  },
};
