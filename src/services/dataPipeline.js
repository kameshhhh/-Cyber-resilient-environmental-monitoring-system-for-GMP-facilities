/**
 * Data Pipeline Service
 *
 * Handles real-time data simulation with physics-based models,
 * WebSocket connections, and sensor error generation.
 */

import { INITIAL_ROOMS } from "../utils/constants";

// Room thermal model parameters
const THERMAL_MODELS = {
  "cold-room": {
    thermalMass: 500, // kJ/°C
    insulationR: 4.0, // m²·K/W
    coolingCapacity: 2000, // W
    doorHeatGain: 100, // W per open event
  },
  freezer: {
    thermalMass: 300,
    insulationR: 6.0,
    coolingCapacity: 3500,
    doorHeatGain: 150,
  },
  controlled: {
    thermalMass: 800,
    insulationR: 3.0,
    coolingCapacity: 1500,
    doorHeatGain: 50,
  },
};

/**
 * DataPipeline class for managing sensor data
 */
class DataPipeline {
  constructor() {
    this.websocket = null;
    this.simulationInterval = null;
    this.roomModels = new Map();
    this.subscribers = new Set();
    this.options = {
      mode: "mock",
      frequency: 5000, // 5 seconds
      failureRate: 0.02,
      drift: true,
    };
    this.isInitialized = false;
  }

  /**
   * Initialize the data pipeline
   */
  async initialize(options = {}) {
    this.options = { ...this.options, ...options };

    // Initialize room models
    INITIAL_ROOMS.forEach((room) => {
      this.roomModels.set(room.id, this.createRoomModel(room));
    });

    if (this.options.mode === "live") {
      await this.connectWebSocket();
      this.startDataValidation();
    } else {
      this.startAdvancedSimulation();
    }

    this.isInitialized = true;
    return this;
  }

  /**
   * Create a room model for physics simulation
   */
  createRoomModel(room) {
    const modelType = room.id.includes("freezer")
      ? "freezer"
      : room.id.includes("cold")
      ? "cold-room"
      : "controlled";
    const params = THERMAL_MODELS[modelType];

    return {
      id: room.id,
      name: room.name,
      modelType,
      params,
      state: {
        temperature: room.conditions.temperature.current,
        humidity: room.conditions.humidity.current,
        pressure: room.conditions.pressure.current,
        doorOpen: false,
        coolingActive: true,
        lastDoorEvent: null,
      },
      sensorAge: Math.random() * 2, // 0-2 years
      calibrationOffset: {
        temperature: (Math.random() - 0.5) * 0.2,
        humidity: (Math.random() - 0.5) * 2,
        pressure: (Math.random() - 0.5) * 0.1,
      },
      thresholds: {
        temperature: {
          min: room.conditions.temperature.min,
          max: room.conditions.temperature.max,
        },
        humidity: {
          min: room.conditions.humidity.min,
          max: room.conditions.humidity.max,
        },
        pressure: {
          min: room.conditions.pressure.min,
          max: room.conditions.pressure.max,
        },
      },
    };
  }

  /**
   * Start advanced physics-based simulation
   */
  startAdvancedSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }

    this.simulationInterval = setInterval(() => {
      this.roomModels.forEach((model, roomId) => {
        // Simulate external conditions
        const externalTemp = this.getExternalTemperature();
        const doorEvents = this.simulateDoorEvents(model);
        const equipmentState = this.simulateEquipment(model);

        // Calculate next values
        const nextTemp = this.calculateNextTemperature(
          model,
          externalTemp,
          doorEvents,
          equipmentState
        );

        const nextHumidity = this.calculateNextHumidity(
          model,
          doorEvents,
          model.state.temperature
        );

        const nextPressure = this.calculateNextPressure(model);

        // Add sensor noise and drift
        const readings = {
          temperature: this.applyReadingErrors(model, "temperature", nextTemp),
          humidity: this.applyReadingErrors(model, "humidity", nextHumidity),
          pressure: this.applyReadingErrors(model, "pressure", nextPressure),
        };

        // Update model state
        model.state.temperature = nextTemp;
        model.state.humidity = nextHumidity;
        model.state.pressure = nextPressure;

        // Emit updates
        this.emitSensorUpdate(roomId, readings);
      });
    }, this.options.frequency);
  }

  /**
   * Get simulated external temperature (diurnal cycle)
   */
  getExternalTemperature() {
    const now = new Date();
    const hour = now.getHours() + now.getMinutes() / 60;

    // Daily temperature cycle: coldest at 5am, hottest at 3pm
    const baseTemp = 22;
    const amplitude = 5;
    const phase = (hour - 5) * ((2 * Math.PI) / 24);

    return baseTemp + amplitude * Math.sin(phase) + (Math.random() - 0.5) * 2;
  }

  /**
   * Simulate door open/close events
   */
  simulateDoorEvents(model) {
    // Random door events based on time of day
    const now = new Date();
    const hour = now.getHours();

    // Higher probability during work hours
    let doorProbability = 0.02;
    if (hour >= 8 && hour <= 18) {
      doorProbability = 0.08;
    }

    if (Math.random() < doorProbability) {
      model.state.doorOpen = true;
      model.state.lastDoorEvent = Date.now();

      // Door stays open for 5-30 seconds
      setTimeout(() => {
        model.state.doorOpen = false;
      }, 5000 + Math.random() * 25000);

      return { doorOpened: true, duration: 5 + Math.random() * 25 };
    }

    return { doorOpened: model.state.doorOpen, duration: 0 };
  }

  /**
   * Simulate equipment state
   */
  simulateEquipment(model) {
    // Simulate occasional equipment issues
    let acEfficiency = 1.0;

    if (Math.random() < this.options.failureRate) {
      acEfficiency = 0.5 + Math.random() * 0.3; // 50-80% efficiency during issues
    }

    // Simulate power fluctuations
    if (Math.random() < 0.01) {
      model.state.coolingActive = false;
      setTimeout(() => {
        model.state.coolingActive = true;
      }, 1000 + Math.random() * 4000);
    }

    return {
      acEfficiency,
      coolingActive: model.state.coolingActive,
      compressorRunning: model.state.coolingActive && acEfficiency > 0.3,
    };
  }

  /**
   * Calculate next temperature using thermal dynamics
   */
  calculateNextTemperature(model, externalTemp, doorEvents, equipment) {
    const { params, state } = model;
    const dt = this.options.frequency / 1000; // Convert to seconds

    // Heat flow from outside
    const tempDiff = externalTemp - state.temperature;
    const heatFlowIn = tempDiff / (params.insulationR * 10); // Simplified

    // Heat removal from cooling
    const coolingPower = equipment.coolingActive
      ? params.coolingCapacity * equipment.acEfficiency
      : 0;
    const heatRemoval = coolingPower / (params.thermalMass * 1000);

    // Heat gain from door
    const doorHeat = doorEvents.doorOpened
      ? params.doorHeatGain / (params.thermalMass * 1000)
      : 0;

    // Calculate temperature change
    const deltaT = (heatFlowIn - heatRemoval + doorHeat) * dt;
    let newTemp = state.temperature + deltaT;

    // Add small random noise
    newTemp += (Math.random() - 0.5) * 0.1;

    // Determine target temperature and apply control
    const targetTemp =
      (model.thresholds.temperature.min + model.thresholds.temperature.max) / 2;

    // Simple PID-like control
    if (newTemp > targetTemp + 0.5 && equipment.coolingActive) {
      newTemp -= 0.05;
    } else if (newTemp < targetTemp - 0.5 && equipment.coolingActive) {
      newTemp += 0.02;
    }

    return Math.round(newTemp * 100) / 100;
  }

  /**
   * Calculate next humidity value
   */
  calculateNextHumidity(model, doorEvents, temperature) {
    const { state } = model;
    let humidity = state.humidity;

    // Door events affect humidity
    if (doorEvents.doorOpened) {
      humidity += (Math.random() - 0.3) * 3; // Usually increases
    }

    // Temperature affects humidity
    const tempEffect = (temperature - state.temperature) * -0.5;
    humidity += tempEffect;

    // Random drift
    humidity += (Math.random() - 0.5) * 0.5;

    // Apply dehumidifier control
    const targetHumidity =
      (model.thresholds.humidity.min + model.thresholds.humidity.max) / 2;
    if (humidity > targetHumidity + 5) {
      humidity -= 0.3;
    } else if (humidity < targetHumidity - 5) {
      humidity += 0.2;
    }

    // Clamp to reasonable values
    return Math.round(Math.max(15, Math.min(85, humidity)) * 10) / 10;
  }

  /**
   * Calculate next pressure value
   */
  calculateNextPressure(model) {
    const { state } = model;
    let pressure = state.pressure;

    // Small atmospheric fluctuations
    pressure += (Math.random() - 0.5) * 0.05;

    // Weather system simulation (slow changes)
    const weatherCycle = Math.sin(Date.now() / (6 * 60 * 60 * 1000)); // 6-hour cycle
    pressure += weatherCycle * 0.01;

    // Clamp to reasonable values
    return Math.round(Math.max(98, Math.min(104, pressure)) * 100) / 100;
  }

  /**
   * Apply sensor reading errors and drift
   */
  applyReadingErrors(model, parameter, trueValue) {
    // Base sensor error
    const baseError = {
      temperature: 0.1,
      humidity: 1.0,
      pressure: 0.05,
    }[parameter];

    // Age-related drift
    const ageFactor = this.options.drift ? model.sensorAge * 0.01 : 0;

    // Random noise
    const randomError = (Math.random() - 0.5) * baseError * 2;

    // Calibration offset
    const calibrationError = model.calibrationOffset[parameter];

    // Occasional sensor glitches
    let glitch = 0;
    if (Math.random() < 0.005) {
      glitch = (Math.random() - 0.5) * baseError * 5;
    }

    const reportedValue =
      trueValue +
      randomError +
      ageFactor * trueValue +
      calibrationError +
      glitch;

    // Add accuracy metadata
    const accuracy = 1 - Math.abs(reportedValue - trueValue) / trueValue;

    return {
      value: Math.round(reportedValue * 100) / 100,
      trueValue: Math.round(trueValue * 100) / 100,
      accuracy: Math.max(0, Math.min(1, accuracy)),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Emit sensor update to subscribers
   */
  emitSensorUpdate(roomId, readings) {
    const update = {
      roomId,
      timestamp: new Date().toISOString(),
      readings,
    };

    this.subscribers.forEach((callback) => {
      try {
        callback(update);
      } catch (error) {
        console.error("Error in subscriber callback:", error);
      }
    });
  }

  /**
   * Subscribe to sensor updates
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Connect to WebSocket (for live mode)
   */
  async connectWebSocket() {
    return new Promise((resolve, reject) => {
      // Mock WebSocket connection
      console.log("WebSocket connection simulated");
      resolve();
    });
  }

  /**
   * Start data validation
   */
  startDataValidation() {
    // Validate incoming data in live mode
    console.log("Data validation started");
  }

  /**
   * Set simulation scenario
   */
  setScenario(scenario) {
    switch (scenario) {
      case "power-outage":
        this.roomModels.forEach((model) => {
          model.state.coolingActive = false;
        });
        break;
      case "ac-failure":
        this.roomModels.forEach((model) => {
          model.params.coolingCapacity *= 0.3;
        });
        break;
      case "door-open":
        this.roomModels.forEach((model) => {
          model.state.doorOpen = true;
        });
        break;
      case "normal":
      default:
        this.roomModels.forEach((model) => {
          model.state.coolingActive = true;
          model.state.doorOpen = false;
          // Reset cooling capacity
          const modelType = model.modelType;
          model.params.coolingCapacity =
            THERMAL_MODELS[modelType].coolingCapacity;
        });
        break;
    }
  }

  /**
   * Set simulation speed multiplier
   */
  setSpeed(multiplier) {
    this.options.frequency = 5000 / multiplier;
    if (this.isInitialized) {
      this.startAdvancedSimulation();
    }
  }

  /**
   * Stop simulation
   */
  stop() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  /**
   * Resume simulation
   */
  resume() {
    if (!this.simulationInterval && this.isInitialized) {
      this.startAdvancedSimulation();
    }
  }

  /**
   * Get current room model state
   */
  getRoomModel(roomId) {
    return this.roomModels.get(roomId);
  }

  /**
   * Get all room models
   */
  getAllRoomModels() {
    return Array.from(this.roomModels.values());
  }

  /**
   * Manual sensor reading injection (for testing)
   */
  injectReading(roomId, parameter, value) {
    const model = this.roomModels.get(roomId);
    if (model) {
      model.state[parameter] = value;
      this.emitSensorUpdate(roomId, {
        [parameter]: {
          value,
          trueValue: value,
          accuracy: 1.0,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
}

// Singleton instance
const dataPipeline = new DataPipeline();

export default dataPipeline;
export { DataPipeline, THERMAL_MODELS };
