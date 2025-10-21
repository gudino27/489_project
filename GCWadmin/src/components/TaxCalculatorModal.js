import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { X, DollarSign, Calculator } from 'lucide-react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants';
import { ContentGlass } from './GlassView';

const TaxCalculatorModal = ({
  visible,
  onClose,
  payrollInfo,
  currentPeriod,
  thisWeekHours,
  lastWeekHours,
  employeeTaxRate,
  onTaxRateChange,
  onSaveTaxRate,
  savingTaxRate
}) => {
  const { t } = useLanguage();

  const calculateNetPay = () => {
    if (!payrollInfo || !currentPeriod?.summary) return null;

    const totalHours = parseFloat(currentPeriod.summary.totalHours || 0);
    const overtimeHours = parseFloat(currentPeriod.summary.overtimeHours || 0);
    const regularHours = totalHours - overtimeHours;

    let grossPay = 0;

    if (payrollInfo.employment_type === 'hourly') {
      const hourlyRate = parseFloat(payrollInfo.hourly_rate || 0);
      const overtimeRate = parseFloat(payrollInfo.overtime_rate || hourlyRate * 1.5);

      grossPay = (regularHours * hourlyRate) + (overtimeHours * overtimeRate);
    } else if (payrollInfo.employment_type === 'salary') {
      const salary = parseFloat(payrollInfo.salary || 0);
      const payPeriodType = payrollInfo.pay_period_type || 'biweekly';

      if (payPeriodType === 'weekly') {
        grossPay = salary / 52;
      } else if (payPeriodType === 'biweekly') {
        grossPay = salary / 26;
      } else if (payPeriodType === 'semimonthly') {
        grossPay = salary / 24;
      } else if (payPeriodType === 'monthly') {
        grossPay = salary / 12;
      }
    }

    const taxAmount = (grossPay * (employeeTaxRate / 100));
    const netPay = grossPay - taxAmount;

    return {
      grossPay: grossPay.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      netPay: netPay.toFixed(2),
      regularHours: regularHours.toFixed(2),
      overtimeHours: overtimeHours.toFixed(2),
      totalHours: totalHours.toFixed(2)
    };
  };

  const payInfo = calculateNetPay();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <ContentGlass style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.headerLeft}>
                <Calculator size={24} color={COLORS.accent} />
                <Text style={styles.modalTitle}>{t('timeclock.tax_calculator')}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Weekly Hours Summary */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('timeclock.weekly_summary')}</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{t('timeclock.this_week')}:</Text>
                  <Text style={styles.summaryValue}>{thisWeekHours.toFixed(2)} {t('timeclock.hours')}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{t('timeclock.last_week')}:</Text>
                  <Text style={styles.summaryValue}>{lastWeekHours.toFixed(2)} {t('timeclock.hours')}</Text>
                </View>
              </View>

              {/* Tax Rate Input */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('timeclock.tax_rate_setting')}</Text>
                <Text style={styles.helperText}>
                  {t('timeclock.tax_rate_helper')}
                </Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    value={employeeTaxRate.toString()}
                    onChangeText={onTaxRateChange}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={COLORS.textLight}
                  />
                  <Text style={styles.inputSuffix}>%</Text>
                </View>
                <TouchableOpacity
                  style={[styles.saveButton, savingTaxRate && styles.saveButtonDisabled]}
                  onPress={onSaveTaxRate}
                  disabled={savingTaxRate}
                >
                  {savingTaxRate ? (
                    <ActivityIndicator color={COLORS.background} />
                  ) : (
                    <>
                      <DollarSign size={16} color={COLORS.background} />
                      <Text style={styles.saveButtonText}>{t('timeclock.save_tax_rate')}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Pay Calculation */}
              {payInfo && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t('timeclock.pay_calculation')}</Text>

                  <View style={styles.payCard}>
                    <View style={styles.payRow}>
                      <Text style={styles.payLabel}>{t('timeclock.regular_hours')}:</Text>
                      <Text style={styles.payValue}>{payInfo.regularHours}</Text>
                    </View>
                    {parseFloat(payInfo.overtimeHours) > 0 && (
                      <View style={styles.payRow}>
                        <Text style={styles.payLabel}>{t('timeclock.overtime_hours')}:</Text>
                        <Text style={[styles.payValue, { color: COLORS.warning }]}>
                          {payInfo.overtimeHours}
                        </Text>
                      </View>
                    )}
                    <View style={styles.payRow}>
                      <Text style={styles.payLabel}>{t('timeclock.total_hours')}:</Text>
                      <Text style={styles.payValue}>{payInfo.totalHours}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.payRow}>
                      <Text style={styles.payLabel}>{t('timeclock.gross_pay')}:</Text>
                      <Text style={[styles.payValue, styles.grossPay]}>
                        ${payInfo.grossPay}
                      </Text>
                    </View>
                    <View style={styles.payRow}>
                      <Text style={styles.payLabel}>
                        {t('timeclock.estimated_tax')} ({employeeTaxRate}%):
                      </Text>
                      <Text style={[styles.payValue, { color: COLORS.error }]}>
                        -${payInfo.taxAmount}
                      </Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.payRow}>
                      <Text style={styles.netPayLabel}>{t('timeclock.net_pay')}:</Text>
                      <Text style={styles.netPayValue}>${payInfo.netPay}</Text>
                    </View>
                  </View>

                  <Text style={styles.disclaimer}>
                    {t('timeclock.tax_disclaimer')}
                  </Text>
                </View>
              )}
            </ScrollView>
          </ContentGlass>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING[4],
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  modalContent: {
    borderRadius: RADIUS['2xl'],
    padding: SPACING[4],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING[4],
    paddingBottom: SPACING[3],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
  },
  closeButton: {
    padding: SPACING[2],
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.glassDark,
  },
  modalBody: {
    maxHeight: 600,
  },
  section: {
    marginBottom: SPACING[5],
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
    marginBottom: SPACING[3],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING[2],
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.textLight,
  },
  summaryValue: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.accent,
  },
  helperText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
    marginBottom: SPACING[3],
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING[3],
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.glassDark,
    borderRadius: RADIUS.lg,
    padding: SPACING[3],
    fontSize: TYPOGRAPHY.md,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  inputSuffix: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.accent,
    marginLeft: SPACING[2],
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    backgroundColor: COLORS.accent,
    padding: SPACING[3],
    borderRadius: RADIUS.lg,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.background,
  },
  payCard: {
    backgroundColor: COLORS.glassDark,
    borderRadius: RADIUS.lg,
    padding: SPACING[4],
    marginBottom: SPACING[3],
  },
  payRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING[2],
  },
  payLabel: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
  },
  payValue: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
  },
  grossPay: {
    color: COLORS.accent,
    fontSize: TYPOGRAPHY.lg,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.glassBorder,
    marginVertical: SPACING[3],
  },
  netPayLabel: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
  },
  netPayValue: {
    fontSize: TYPOGRAPHY['2xl'],
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.success,
  },
  disclaimer: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default TaxCalculatorModal;
