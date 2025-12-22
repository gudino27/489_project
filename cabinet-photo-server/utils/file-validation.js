/**
 * File Validation Utility
 *
 * Provides file upload sanitization and validation for enhanced security.
 * Prevents path traversal attacks and validates file types.
 */

const path = require('path');

/**
 * Validates and sanitizes file extension
 * @param {string} filename - Original filename
 * @returns {string} - Sanitized file extension
 * @throws {Error} - If file type is not allowed
 */
function sanitizeExtension(filename) {
  const ext = path.extname(filename).toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

  if (!allowedExtensions.includes(ext)) {
    throw new Error(`Invalid file type. Allowed: ${allowedExtensions.join(', ')}`);
  }

  return ext;
}

/**
 * Sanitizes filename to prevent path traversal and special character exploits
 * @param {string} originalname - Original filename from upload
 * @returns {string} - Sanitized filename
 */
function sanitizeFilename(originalname) {
  // Remove any path traversal attempts
  const basename = path.basename(originalname);

  // Remove special characters except dots and dashes
  const sanitized = basename.replace(/[^a-zA-Z0-9.-]/g, '_');

  // Prevent hidden files
  if (sanitized.startsWith('.')) {
    return 'file' + sanitized;
  }

  return sanitized;
}

/**
 * Validates file upload
 * @param {Object} file - Multer file object
 * @returns {Object} - { valid: boolean, error: string }
 */
function validateFileUpload(file) {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  try {
    // Validate extension
    sanitizeExtension(file.originalname);

    // Validate MIME type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return {
        valid: false,
        error: `Invalid MIME type. Allowed: ${allowedMimeTypes.join(', ')}`
      };
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`
      };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Generates safe filename for storage
 * @param {Object} file - Multer file object
 * @param {string} prefix - Optional prefix for filename
 * @returns {string} - Safe filename with timestamp
 */
function generateSafeFilename(file, prefix = '') {
  const sanitizedOriginal = sanitizeFilename(file.originalname);
  const ext = path.extname(sanitizedOriginal);
  const name = path.basename(sanitizedOriginal, ext);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);

  return `${prefix}${prefix ? '_' : ''}${name}_${timestamp}_${random}${ext}`;
}

module.exports = {
  sanitizeExtension,
  sanitizeFilename,
  validateFileUpload,
  generateSafeFilename
};
