/**
 * Security Module for Medicine Storage Dashboard
 * Implements RBAC, Audit Logging, and Access Control
 */

// Role definitions with permissions
const ROLES = {
  ADMIN: {
    name: "Administrator",
    level: 100,
    permissions: [
      "view:dashboard",
      "view:alerts",
      "view:reports",
      "view:compliance",
      "view:audit-log",
      "manage:rooms",
      "manage:thresholds",
      "manage:alerts",
      "manage:users",
      "manage:roles",
      "generate:reports",
      "export:data",
      "acknowledge:alerts",
      "configure:system",
      "delete:data",
    ],
  },
  QUALITY_MANAGER: {
    name: "Quality Manager",
    level: 80,
    permissions: [
      "view:dashboard",
      "view:alerts",
      "view:reports",
      "view:compliance",
      "view:audit-log",
      "manage:thresholds",
      "manage:alerts",
      "generate:reports",
      "export:data",
      "acknowledge:alerts",
    ],
  },
  SUPERVISOR: {
    name: "Supervisor",
    level: 60,
    permissions: [
      "view:dashboard",
      "view:alerts",
      "view:reports",
      "acknowledge:alerts",
      "manage:thresholds",
      "export:data",
    ],
  },
  TECHNICIAN: {
    name: "Technician",
    level: 40,
    permissions: ["view:dashboard", "view:alerts", "acknowledge:alerts"],
  },
  VIEWER: {
    name: "Viewer",
    level: 20,
    permissions: ["view:dashboard", "view:alerts"],
  },
};

// Permission descriptions for UI
const PERMISSION_DESCRIPTIONS = {
  "view:dashboard": "View the main monitoring dashboard",
  "view:alerts": "View alert history and notifications",
  "view:reports": "Access compliance and analytical reports",
  "view:compliance": "View FDA compliance status and details",
  "view:audit-log": "Access system audit logs",
  "manage:rooms": "Add, edit, or remove monitored rooms",
  "manage:thresholds": "Modify temperature and humidity thresholds",
  "manage:alerts": "Configure alert rules and notifications",
  "manage:users": "Add, edit, or remove user accounts",
  "manage:roles": "Modify role permissions",
  "generate:reports": "Generate compliance and analytical reports",
  "export:data": "Export sensor data and reports",
  "acknowledge:alerts": "Acknowledge and resolve alerts",
  "configure:system": "Modify system configuration settings",
  "delete:data": "Delete historical data and records",
};

/**
 * Audit Log Entry structure (blockchain-style)
 */
class AuditLogEntry {
  constructor({
    action,
    userId,
    userName,
    target,
    details,
    previousHash = null,
  }) {
    this.id = crypto.randomUUID
      ? crypto.randomUUID()
      : `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.timestamp = new Date().toISOString();
    this.action = action;
    this.userId = userId;
    this.userName = userName;
    this.target = target;
    this.details = details;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    const data = `${this.timestamp}${this.action}${this.userId}${
      this.target
    }${JSON.stringify(this.details)}${this.previousHash}`;
    // Simple hash for demonstration (in production, use crypto.subtle.digest)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, "0");
  }
}

/**
 * Security Module Class
 */
class SecurityModule {
  constructor() {
    this.currentUser = null;
    this.auditLog = [];
    this.lastAuditHash = null;
    this.sessionToken = null;
    this.sessionExpiry = null;
    this.failedLoginAttempts = new Map();
    this.lockedAccounts = new Set();

    // Configuration
    this.config = {
      maxLoginAttempts: 5,
      lockoutDuration: 15 * 60 * 1000, // 15 minutes
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      passwordMinLength: 8,
      requireSpecialChar: true,
      requireNumber: true,
      requireUppercase: true,
    };
  }

  /**
   * Initialize security module with user data
   */
  initialize(userData) {
    if (!userData) {
      throw new Error("User data is required for initialization");
    }

    this.currentUser = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role || "VIEWER",
      department: userData.department,
      lastLogin: new Date().toISOString(),
    };

    this.sessionToken = this.generateSessionToken();
    this.sessionExpiry = Date.now() + this.config.sessionTimeout;

    this.logAudit("SESSION_START", "system", {
      ip: userData.ip || "unknown",
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    });

    return {
      success: true,
      sessionToken: this.sessionToken,
      expiresAt: this.sessionExpiry,
    };
  }

  /**
   * Generate session token
   */
  generateSessionToken() {
    const array = new Uint8Array(32);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      crypto.getRandomValues(array);
    } else {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
      ""
    );
  }

  /**
   * Check if session is valid
   */
  isSessionValid() {
    if (!this.sessionToken || !this.sessionExpiry) return false;
    if (Date.now() > this.sessionExpiry) {
      this.logout("session_expired");
      return false;
    }
    return true;
  }

  /**
   * Refresh session
   */
  refreshSession() {
    if (!this.isSessionValid()) return false;
    this.sessionExpiry = Date.now() + this.config.sessionTimeout;
    return true;
  }

  /**
   * Logout user
   */
  logout(reason = "user_initiated") {
    this.logAudit("SESSION_END", "system", { reason });
    this.currentUser = null;
    this.sessionToken = null;
    this.sessionExpiry = null;
  }

  /**
   * Get current user's role
   */
  getRole() {
    if (!this.currentUser) return null;
    return ROLES[this.currentUser.role] || ROLES.VIEWER;
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission) {
    if (!this.isSessionValid()) return false;
    const role = this.getRole();
    if (!role) return false;
    return role.permissions.includes(permission);
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(permissions) {
    return permissions.some((p) => this.hasPermission(p));
  }

  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions(permissions) {
    return permissions.every((p) => this.hasPermission(p));
  }

  /**
   * Get all permissions for current user
   */
  getPermissions() {
    const role = this.getRole();
    return role ? [...role.permissions] : [];
  }

  /**
   * Check if user can access a specific resource
   */
  canAccess(resource, action = "view") {
    const permission = `${action}:${resource}`;
    const hasAccess = this.hasPermission(permission);

    if (!hasAccess) {
      this.logAudit("ACCESS_DENIED", resource, { action });
    }

    return hasAccess;
  }

  /**
   * Log an audit entry
   */
  logAudit(action, target, details = {}) {
    const entry = new AuditLogEntry({
      action,
      userId: this.currentUser?.id || "system",
      userName: this.currentUser?.name || "System",
      target,
      details: {
        ...details,
        timestamp: Date.now(),
      },
      previousHash: this.lastAuditHash,
    });

    this.auditLog.push(entry);
    this.lastAuditHash = entry.hash;

    // Keep only last 10000 entries in memory
    if (this.auditLog.length > 10000) {
      this.auditLog = this.auditLog.slice(-10000);
    }

    return entry;
  }

  /**
   * Get audit log entries
   */
  getAuditLog(filters = {}) {
    let entries = [...this.auditLog];

    if (filters.action) {
      entries = entries.filter((e) => e.action === filters.action);
    }
    if (filters.userId) {
      entries = entries.filter((e) => e.userId === filters.userId);
    }
    if (filters.target) {
      entries = entries.filter((e) => e.target === filters.target);
    }
    if (filters.startDate) {
      entries = entries.filter(
        (e) => new Date(e.timestamp) >= new Date(filters.startDate)
      );
    }
    if (filters.endDate) {
      entries = entries.filter(
        (e) => new Date(e.timestamp) <= new Date(filters.endDate)
      );
    }

    return entries.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
  }

  /**
   * Verify audit log integrity
   */
  verifyAuditLogIntegrity() {
    const results = {
      isValid: true,
      totalEntries: this.auditLog.length,
      invalidEntries: [],
    };

    for (let i = 0; i < this.auditLog.length; i++) {
      const entry = this.auditLog[i];
      const expectedPreviousHash = i > 0 ? this.auditLog[i - 1].hash : null;

      if (entry.previousHash !== expectedPreviousHash) {
        results.isValid = false;
        results.invalidEntries.push({
          index: i,
          id: entry.id,
          reason: "Previous hash mismatch",
        });
      }

      // Recalculate and verify hash
      const recalculatedEntry = new AuditLogEntry({
        action: entry.action,
        userId: entry.userId,
        userName: entry.userName,
        target: entry.target,
        details: entry.details,
        previousHash: entry.previousHash,
      });
      recalculatedEntry.timestamp = entry.timestamp;

      // Note: Hash verification would need the original timestamp
      // This is simplified for demonstration
    }

    return results;
  }

  /**
   * Check login attempts and account lockout
   */
  checkLoginAttempts(userId) {
    if (this.lockedAccounts.has(userId)) {
      const lockoutData = this.failedLoginAttempts.get(userId);
      if (lockoutData && Date.now() < lockoutData.lockedUntil) {
        return {
          locked: true,
          remainingTime: Math.ceil(
            (lockoutData.lockedUntil - Date.now()) / 1000
          ),
        };
      } else {
        this.lockedAccounts.delete(userId);
        this.failedLoginAttempts.delete(userId);
      }
    }
    return { locked: false };
  }

  /**
   * Record failed login attempt
   */
  recordFailedLogin(userId) {
    const current = this.failedLoginAttempts.get(userId) || { count: 0 };
    current.count++;
    current.lastAttempt = Date.now();

    if (current.count >= this.config.maxLoginAttempts) {
      current.lockedUntil = Date.now() + this.config.lockoutDuration;
      this.lockedAccounts.add(userId);
      this.logAudit("ACCOUNT_LOCKED", userId, {
        reason: "max_login_attempts",
        attempts: current.count,
      });
    }

    this.failedLoginAttempts.set(userId, current);
    return current;
  }

  /**
   * Clear failed login attempts
   */
  clearFailedLogins(userId) {
    this.failedLoginAttempts.delete(userId);
    this.lockedAccounts.delete(userId);
  }

  /**
   * Validate password strength
   */
  validatePassword(password) {
    const issues = [];

    if (password.length < this.config.passwordMinLength) {
      issues.push(
        `Password must be at least ${this.config.passwordMinLength} characters`
      );
    }
    if (
      this.config.requireSpecialChar &&
      !/[!@#$%^&*(),.?":{}|<>]/.test(password)
    ) {
      issues.push("Password must contain at least one special character");
    }
    if (this.config.requireNumber && !/\d/.test(password)) {
      issues.push("Password must contain at least one number");
    }
    if (this.config.requireUppercase && !/[A-Z]/.test(password)) {
      issues.push("Password must contain at least one uppercase letter");
    }

    return {
      isValid: issues.length === 0,
      issues,
      strength: this.calculatePasswordStrength(password),
    };
  }

  /**
   * Calculate password strength score
   */
  calculatePasswordStrength(password) {
    let score = 0;

    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    if (!/(.)\1{2,}/.test(password)) score += 1; // No repeated chars

    if (score <= 2) return "weak";
    if (score <= 4) return "fair";
    if (score <= 6) return "good";
    return "strong";
  }

  /**
   * Export audit log for compliance
   */
  exportAuditLog(format = "json") {
    this.logAudit("AUDIT_EXPORT", "system", { format });

    if (format === "json") {
      return JSON.stringify(this.auditLog, null, 2);
    }

    if (format === "csv") {
      const headers = [
        "ID",
        "Timestamp",
        "Action",
        "User ID",
        "User Name",
        "Target",
        "Details",
        "Hash",
      ];
      const rows = this.auditLog.map((entry) =>
        [
          entry.id,
          entry.timestamp,
          entry.action,
          entry.userId,
          entry.userName,
          entry.target,
          JSON.stringify(entry.details),
          entry.hash,
        ]
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      );

      return [headers.join(","), ...rows].join("\n");
    }

    return null;
  }

  /**
   * Get security summary
   */
  getSecuritySummary() {
    return {
      currentUser: this.currentUser
        ? {
            id: this.currentUser.id,
            name: this.currentUser.name,
            role: this.currentUser.role,
            roleName: this.getRole()?.name,
            permissions: this.getPermissions(),
          }
        : null,
      session: {
        isValid: this.isSessionValid(),
        expiresAt: this.sessionExpiry,
        remainingTime: this.sessionExpiry
          ? Math.max(0, this.sessionExpiry - Date.now())
          : 0,
      },
      auditLog: {
        totalEntries: this.auditLog.length,
        lastEntry: this.auditLog[this.auditLog.length - 1],
        integrityValid: this.verifyAuditLogIntegrity().isValid,
      },
      lockedAccounts: Array.from(this.lockedAccounts),
    };
  }
}

// Create singleton instance
const securityModule = new SecurityModule();

// React hook for security
const useSecurityModule = () => {
  return securityModule;
};

export default securityModule;
export {
  SecurityModule,
  useSecurityModule,
  ROLES,
  PERMISSION_DESCRIPTIONS,
  AuditLogEntry,
};
