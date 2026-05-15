export const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validatePhone = (phone) => {
  // Basic phone validation - can be enhanced
  return phone.length >= 10;
};

export const validatePassword = (password) => {
  // At least 6 characters
  return password.length >= 6;
};

export const validateSchoolId = (schoolId) => {
  return schoolId.length >= 5;
};

export const validateForm = (formData, requiredFields) => {
  const missing = requiredFields.filter((field) => !formData[field]);
  if (missing.length > 0) {
    return { valid: false, error: `Missing: ${missing.join(', ')}` };
  }
  return { valid: true };
};
