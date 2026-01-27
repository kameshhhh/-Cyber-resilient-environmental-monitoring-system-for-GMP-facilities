import {
  getStatusColor,
  calculateRoomStatus,
  getConditionStatus,
  validateInputs,
  generateAlerts,
  getProgressPercentage,
} from "../services/statusCalculator";

describe("getStatusColor", () => {
  it("should return green for values in optimal range (center 80%)", () => {
    // Range: 2-8, margin: 0.6, optimal: 2.6-7.4
    expect(getStatusColor(5, 2, 8)).toBe("green");
    expect(getStatusColor(4, 2, 8)).toBe("green");
    expect(getStatusColor(6, 2, 8)).toBe("green");
  });

  it("should return yellow for values in marginal range (outer 20%)", () => {
    // Range: 2-8, margin: 0.6, marginal: 2-2.6 or 7.4-8
    expect(getStatusColor(2.3, 2, 8)).toBe("yellow");
    expect(getStatusColor(7.7, 2, 8)).toBe("yellow");
    expect(getStatusColor(2, 2, 8)).toBe("yellow");
    expect(getStatusColor(8, 2, 8)).toBe("yellow");
  });

  it("should return red for values outside allowed range", () => {
    expect(getStatusColor(1, 2, 8)).toBe("red");
    expect(getStatusColor(9, 2, 8)).toBe("red");
    expect(getStatusColor(-5, 2, 8)).toBe("red");
    expect(getStatusColor(15, 2, 8)).toBe("red");
  });

  it("should handle negative temperature ranges", () => {
    // Range: -25 to -15, margin: 1
    expect(getStatusColor(-20, -25, -15)).toBe("green");
    expect(getStatusColor(-24.5, -25, -15)).toBe("yellow");
    expect(getStatusColor(-26, -25, -15)).toBe("red");
  });
});

describe("calculateRoomStatus", () => {
  it("should return green when all conditions are optimal", () => {
    const room = {
      conditions: {
        temperature: { min: 2, max: 8, current: 5 },
        humidity: { min: 30, max: 60, current: 45 },
        pressure: { min: 100, max: 101.3, current: 100.6 },
      },
    };
    expect(calculateRoomStatus(room)).toBe("green");
  });

  it("should return yellow when at least one condition is marginal", () => {
    const room = {
      conditions: {
        temperature: { min: 2, max: 8, current: 7.8 }, // marginal
        humidity: { min: 30, max: 60, current: 45 },
        pressure: { min: 100, max: 101.3, current: 100.6 },
      },
    };
    expect(calculateRoomStatus(room)).toBe("yellow");
  });

  it("should return red when at least one condition is critical", () => {
    const room = {
      conditions: {
        temperature: { min: 2, max: 8, current: 10 }, // critical
        humidity: { min: 30, max: 60, current: 45 },
        pressure: { min: 100, max: 101.3, current: 100.6 },
      },
    };
    expect(calculateRoomStatus(room)).toBe("red");
  });

  it("should return red over yellow when both exist", () => {
    const room = {
      conditions: {
        temperature: { min: 2, max: 8, current: 10 }, // critical
        humidity: { min: 30, max: 60, current: 32 }, // marginal
        pressure: { min: 100, max: 101.3, current: 100.6 },
      },
    };
    expect(calculateRoomStatus(room)).toBe("red");
  });
});

describe("getConditionStatus", () => {
  it("should return correct status info for optimal condition", () => {
    const condition = { min: 2, max: 8, current: 5 };
    const status = getConditionStatus(condition);

    expect(status.status).toBe("green");
    expect(status.label).toBe("Optimal");
    expect(status.isAboveRange).toBe(false);
    expect(status.isBelowRange).toBe(false);
  });

  it("should indicate when value is above range", () => {
    const condition = { min: 2, max: 8, current: 10 };
    const status = getConditionStatus(condition);

    expect(status.status).toBe("red");
    expect(status.isAboveRange).toBe(true);
    expect(status.isBelowRange).toBe(false);
  });

  it("should indicate when value is below range", () => {
    const condition = { min: 2, max: 8, current: 0 };
    const status = getConditionStatus(condition);

    expect(status.status).toBe("red");
    expect(status.isAboveRange).toBe(false);
    expect(status.isBelowRange).toBe(true);
  });

  it("should calculate percentage correctly", () => {
    const condition = { min: 0, max: 100, current: 50 };
    const status = getConditionStatus(condition);
    expect(status.percentage).toBe(50);
  });
});

describe("validateInputs", () => {
  it("should validate correct inputs", () => {
    const values = { temperature: 5, humidity: 45, pressure: 100.5 };
    const roomConfig = {
      conditions: {
        temperature: { min: 2, max: 8 },
        humidity: { min: 30, max: 60 },
        pressure: { min: 100, max: 101.3 },
      },
    };
    const result = validateInputs(values, roomConfig);
    expect(result.isValid).toBe(true);
    expect(Object.keys(result.errors).length).toBe(0);
  });

  it("should reject invalid inputs", () => {
    const values = { temperature: "invalid", humidity: 45 };
    const roomConfig = {
      conditions: {
        temperature: { min: 2, max: 8 },
        humidity: { min: 30, max: 60 },
      },
    };
    const result = validateInputs(values, roomConfig);
    expect(result.isValid).toBe(false);
    expect(result.errors.temperature).toBe("Invalid value");
  });
});

describe("generateAlerts", () => {
  it("should generate no alerts for optimal rooms", () => {
    const rooms = [
      {
        id: "room-1",
        name: "Test Room",
        conditions: {
          temperature: { min: 2, max: 8, current: 5, unit: "°C" },
          humidity: { min: 30, max: 60, current: 45, unit: "%" },
        },
      },
    ];
    const alerts = generateAlerts(rooms);
    expect(alerts.length).toBe(0);
  });

  it("should generate warning alerts for marginal conditions", () => {
    const rooms = [
      {
        id: "room-1",
        name: "Test Room",
        conditions: {
          temperature: { min: 2, max: 8, current: 7.8, unit: "°C" },
          humidity: { min: 30, max: 60, current: 45, unit: "%" },
        },
      },
    ];
    const alerts = generateAlerts(rooms);
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe("warning");
    expect(alerts[0].condition).toBe("temperature");
  });

  it("should generate critical alerts for out-of-range conditions", () => {
    const rooms = [
      {
        id: "room-1",
        name: "Test Room",
        conditions: {
          temperature: { min: 2, max: 8, current: 10, unit: "°C" },
          humidity: { min: 30, max: 60, current: 45, unit: "%" },
        },
      },
    ];
    const alerts = generateAlerts(rooms);
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe("critical");
  });

  it("should sort alerts by severity (critical first)", () => {
    const rooms = [
      {
        id: "room-1",
        name: "Test Room",
        conditions: {
          temperature: { min: 2, max: 8, current: 7.8, unit: "°C" }, // warning
          humidity: { min: 30, max: 60, current: 80, unit: "%" }, // critical
        },
      },
    ];
    const alerts = generateAlerts(rooms);
    expect(alerts.length).toBe(2);
    expect(alerts[0].severity).toBe("critical");
    expect(alerts[1].severity).toBe("warning");
  });
});

describe("getProgressPercentage", () => {
  it("should calculate correct percentage", () => {
    expect(getProgressPercentage(5, 0, 10)).toBe(50);
    expect(getProgressPercentage(0, 0, 10)).toBe(0);
    expect(getProgressPercentage(10, 0, 10)).toBe(100);
  });

  it("should clamp percentage to 0-100", () => {
    expect(getProgressPercentage(-5, 0, 10)).toBe(0);
    expect(getProgressPercentage(15, 0, 10)).toBe(100);
  });
});
