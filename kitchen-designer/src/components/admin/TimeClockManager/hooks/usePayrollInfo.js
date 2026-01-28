import { useState, useEffect } from 'react';

// Hook to manage payroll information and tax rate
export const usePayrollInfo = (token, API_BASE, t, onPayPeriodTypeChange) => {
  const [payrollInfo, setPayrollInfo] = useState(null);
  const [employeeTaxRate, setEmployeeTaxRate] = useState(0);
  const [savingTaxRate, setSavingTaxRate] = useState(false);

  const fetchPayrollInfo = async (employeeId = null) => {
    try {
      let response;
      if (employeeId) {
        // Admin fetching specific employee's info
        response = await fetch(
          `${API_BASE}/api/timeclock/admin/payroll-info/${employeeId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        // Employee fetching their own info
        response = await fetch(`${API_BASE}/api/timeclock/my-payroll-info`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      const data = await response.json();

      if (data.success && data.payrollInfo) {
        if (!employeeId) {
          // Employee viewing their own info
          setPayrollInfo(data.payrollInfo);
          setEmployeeTaxRate(data.payrollInfo.save_tax_rate || 0);
          // Notify parent if pay period type needs to be processed
          if (data.payrollInfo.pay_period_type && onPayPeriodTypeChange) {
            onPayPeriodTypeChange(data.payrollInfo.pay_period_type);
          }
        }
        return data.payrollInfo;
      } else {
        // Clear payroll info if none exists
        if (!employeeId) {
          setPayrollInfo(null);
          setEmployeeTaxRate(0);
        }
        return null;
      }
    } catch (error) {
      console.error("Error fetching payroll info:", error);
      // Clear on error
      if (!employeeId) {
        setPayrollInfo(null);
        setEmployeeTaxRate(0);
      }
      return null;
    }
  };

  const saveTaxRate = async () => {
    setSavingTaxRate(true);
    try {
      const response = await fetch(`${API_BASE}/api/timeclock/save-tax-rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          taxRate: parseFloat(employeeTaxRate),
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(t("timeclock.tax_rate_saved_success"));
        await fetchPayrollInfo(); // Refresh to get updated info
      } else {
        alert(data.message ? `${t('common.error')}: ${data.message}` : t("timeclock.failed_save_tax_rate"));
      }
    } catch (error) {
      console.error("Error saving tax rate:", error);
      alert(t("timeclock.failed_save_tax_rate"));
    } finally {
      setSavingTaxRate(false);
    }
  };

  // Fetch payroll info on mount if token is available
  useEffect(() => {
    if (token) {
      fetchPayrollInfo();
    }
  }, [token]);

  return {
    payrollInfo,
    employeeTaxRate,
    setEmployeeTaxRate,
    savingTaxRate,
    fetchPayrollInfo,
    saveTaxRate,
  };
};
