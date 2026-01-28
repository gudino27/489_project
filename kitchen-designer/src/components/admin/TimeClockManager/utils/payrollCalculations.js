// Helper to calculate current pay period earnings
export const calculateCurrentPayPeriodAmount = (payrollInfo, hours) => {
  if (!payrollInfo || hours === 0) return 0;

  if (payrollInfo.employment_type === "hourly") {
    const regularHours = Math.min(hours, 40);
    const overtimeHours = Math.max(hours - 40, 0);
    const regularPay = regularHours * (payrollInfo.hourly_rate || 0);
    const overtimePay = overtimeHours * (payrollInfo.overtime_rate || 0);
    return regularPay + overtimePay;
  } else {
    // For salary, calculate based on pay period type
    const annualSalary = payrollInfo.salary || 0;
    switch (payrollInfo.pay_period_type) {
      case "weekly":
        return annualSalary / 52;
      case "biweekly":
        return annualSalary / 26;
      case "semimonthly":
        return annualSalary / 24;
      case "monthly":
        return annualSalary / 12;
      default:
        return annualSalary / 26; // Default to biweekly
    }
  }
};
