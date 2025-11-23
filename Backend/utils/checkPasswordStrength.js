module.exports = function checkPasswordStrength(password) {
  if (!password) {
    return { valid: false, message: "Password is required" };
  }

  // Minimum 8 chars
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters long" };
  }

  // No whitespace
  if (/\s/.test(password)) {
    return { valid: false, message: "Password must not contain spaces" };
  }

  // Lowercase
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one lowercase letter" };
  }

  // Uppercase
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one uppercase letter" };
  }

  // Number
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one number" };
  }
  return { valid: true, message: "Strong password" };
};
