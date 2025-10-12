export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateMobileNumber(mobile: string): boolean {
  const mobileRegex = /^[6-9]\d{9}$/;
  return mobileRegex.test(mobile.replace(/\s+/g, ''));
}

export function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long' };
  }
  return { isValid: true };
}

export function validatePayAmount(amount: string): boolean {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num <= 100000;
}

export function validateWorkersNeeded(workers: string): boolean {
  const num = parseInt(workers);
  return !isNaN(num) && num > 0 && num <= 50;
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}