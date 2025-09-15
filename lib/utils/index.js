/**
 * @fileoverview Territory A & C - Utility Functions
 * @description Common utility functions for Territory A & C implementation
 */

import {
  ComplexityAnalyzer,
  complexityAnalyzer,
} from "./complexity-analyzer.js";

/**
 * Generate a unique identifier
 * @param {string} prefix - Optional prefix for the ID
 * @returns {string} Unique identifier
 */
export const generateId = (prefix = "ta") => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
};

/**
 * Validate and sanitize input data
 * @param {any} data - Data to validate
 * @param {Object} schema - Validation schema
 * @returns {{valid: boolean, data?: any, errors?: string[]}} Validation result
 */
export const validateInput = (data, schema = {}) => {
  const errors = [];

  if (schema.required && !data) {
    errors.push("Data is required");
    return { valid: false, errors };
  }

  if (schema.type && typeof data !== schema.type) {
    errors.push(`Expected type ${schema.type}, got ${typeof data}`);
  }

  if (
    schema.minLength &&
    typeof data === "string" &&
    data.length < schema.minLength
  ) {
    errors.push(`Minimum length is ${schema.minLength}`);
  }

  if (
    schema.maxLength &&
    typeof data === "string" &&
    data.length > schema.maxLength
  ) {
    errors.push(`Maximum length is ${schema.maxLength}`);
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true, data };
};

/**
 * Deep clone an object
 * @param {any} obj - Object to clone
 * @returns {any} Cloned object
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item));
  }

  const cloned = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }

  return cloned;
};

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {Object} options - Retry options
 * @returns {Promise<any>} Function result
 */
export const retry = async (fn, options = {}) => {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    factor = 2,
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts) {
        throw lastError;
      }

      const delay = Math.min(
        baseDelay * Math.pow(factor, attempt - 1),
        maxDelay
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

// Export Territory C complexity analyzer
export { ComplexityAnalyzer, complexityAnalyzer };
