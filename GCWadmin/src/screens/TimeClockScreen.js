import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Clock, Play, Square, Coffee, Calendar, Calculator, Plus, Users } from 'lucide-react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants';
import { ContentGlass } from '../components/GlassView';
import TaxCalculatorModal from '../components/TaxCalculatorModal';
import ManualEntryModal from '../components/ManualEntryModal';
import EditEntryModal from '../components/EditEntryModal';
import api from '../api/client';
import {
  formatTimePST,
  formatDatePST,
  getTodayPST,
  toPSTDateString,
  getCurrentWeekPST,
  getLastWeekPST,
  getTimezoneAbbreviation,
} from '../utils/timezoneHelpers';

const TimeClockScreen = ({ navigation }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const isAdmin = user?.role === 'super_admin';
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeView, setActiveView] = useState('employee'); // 'employee' or 'admin'
  const [status, setStatus] = useState({
    isClockedIn: false,
    isOnBreak: false,
    clockInTime: null,
    currentHours: '0.00',
    breakMinutes: 0,
  });
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [thisWeekHours, setThisWeekHours] = useState(0);
  const [lastWeekHours, setLastWeekHours] = useState(0);

  // Tax Calculator & Payroll
  const [showTaxCalculator, setShowTaxCalculator] = useState(false);
  const [payrollInfo, setPayrollInfo] = useState(null);
  const [employeeTaxRate, setEmployeeTaxRate] = useState(0);
  const [savingTaxRate, setSavingTaxRate] = useState(false);

  // Manual Entry (Admin)
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualEntry, setManualEntry] = useState({
    date: getTodayPST(),
    timeIn: '',
    timeOut: '',
    breakMinutes: 0,
    notes: ''
  });

  // Edit Entry
  const [editingEntry, setEditingEntry] = useState(null);
  const [editForm, setEditForm] = useState({
    clockInTime: '',
    clockOutTime: '',
    breakMinutes: 0,
    notes: ''
  });
  const [auditLog, setAuditLog] = useState([]);

  // Admin View Data
  const [liveEmployees, setLiveEmployees] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [employeePayrollInfo, setEmployeePayrollInfo] = useState({});
  const [showPayrollSection, setShowPayrollSection] = useState(false);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Fetch status on mount and every 30 seconds
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch current pay period, weekly hours, and payroll info
  useEffect(() => {
    fetchCurrentPeriod();
    fetchWeeklyHours();
    fetchPayrollInfo();
  }, []);

  const fetchStatus = async () => {
    try {
      console.log('⏰ Fetching time clock status...');
      const response = await api.get('/api/timeclock/current-status');
      console.log('⏰ Status response:', response.data);
      if (response.data.success) {
        setStatus(response.data);
      }
    } catch (error) {
      console.error('❌ Error fetching status:', error);
      console.error('❌ Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentPeriod = async () => {
    try {
      console.log('📅 Fetching current pay period...');
      const response = await api.get('/api/timeclock/current-period');
      console.log('📅 Period response:', response.data);
      if (response.data.success && response.data.hasPayPeriod) {
        setCurrentPeriod(response.data);
      }
    } catch (error) {
      console.error('❌ Error fetching period:', error);
      console.error('❌ Error details:', error.response?.data);
    }
  };

  const fetchWeeklyHours = async () => {
    try {
      console.log('📊 Fetching weekly hours...');
      // This Week
      const { startOfWeek, endOfWeek } = getCurrentWeekPST();
      const thisWeekResponse = await api.get(
        `/api/timeclock/my-entries?startDate=${toPSTDateString(startOfWeek)}&endDate=${toPSTDateString(endOfWeek)}`
      );

      if (thisWeekResponse.data.success) {
        const totalHours = thisWeekResponse.data.entries.reduce(
          (sum, entry) => sum + parseFloat(entry.total_hours || 0),
          0
        );
        setThisWeekHours(totalHours);
        console.log('📊 This week hours:', totalHours);
      }

      // Last Week
      const { startOfWeek: lastWeekStart, endOfWeek: lastWeekEnd } = getLastWeekPST();
      const lastWeekResponse = await api.get(
        `/api/timeclock/my-entries?startDate=${toPSTDateString(lastWeekStart)}&endDate=${toPSTDateString(lastWeekEnd)}`
      );

      if (lastWeekResponse.data.success) {
        const totalHours = lastWeekResponse.data.entries.reduce(
          (sum, entry) => sum + parseFloat(entry.total_hours || 0),
          0
        );
        setLastWeekHours(totalHours);
        console.log('📊 Last week hours:', totalHours);
      }
    } catch (error) {
      console.error('❌ Error fetching weekly hours:', error);
      console.error('❌ Error details:', error.response?.data);
    }
  };

  const fetchPayrollInfo = async () => {
    try {
      console.log('💰 Fetching payroll info...');
      const response = await api.get('/api/timeclock/my-payroll-info');
      console.log('💰 Payroll response:', response.data);
      if (response.data.success && response.data.payrollInfo) {
        setPayrollInfo(response.data.payrollInfo);
        setEmployeeTaxRate(response.data.payrollInfo.save_tax_rate || 0);
      }
    } catch (error) {
      console.error('❌ Error fetching payroll info:', error);
      console.error('❌ Error details:', error.response?.data);
    }
  };

  const saveTaxRate = async () => {
    if (!employeeTaxRate || employeeTaxRate < 0 || employeeTaxRate > 100) {
      Alert.alert(t('common.error'), 'Please enter a valid tax rate between 0 and 100');
      return;
    }

    setSavingTaxRate(true);
    try {
      const response = await api.post('/api/timeclock/save-tax-rate', {
        taxRate: parseFloat(employeeTaxRate)
      });

      if (response.data.success) {
        Alert.alert(t('common.success'), 'Tax rate saved successfully!');
        await fetchPayrollInfo();
      }
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error.response?.data?.message || 'Failed to save tax rate'
      );
    } finally {
      setSavingTaxRate(false);
    }
  };

  // Admin View Functions
  const fetchLiveEmployees = async () => {
    if (!isAdmin) return;
    try {
      console.log('👥 Fetching live employees...');
      const response = await api.get('/api/timeclock/admin/live-status');
      console.log('👥 Live employees response:', response.data);
      if (response.data.success) {
        setLiveEmployees(response.data.entries || []);
      }
    } catch (error) {
      console.error('❌ Error fetching live employees:', error);
    }
  };

  const fetchAllEmployees = async () => {
    if (!isAdmin) return;
    try {
      console.log('👥 Fetching all employees...');
      const response = await api.get('/api/users');
      console.log('👥 All employees response:', response.data);
      if (response.data.success) {
        setAllEmployees(response.data.users || []);
        // Fetch payroll info for each employee
        fetchAllPayrollInfo(response.data.users);
      }
    } catch (error) {
      console.error('❌ Error fetching employees:', error);
    }
  };

  const fetchAllPayrollInfo = async (employees) => {
    if (!isAdmin) return;
    try {
      const payrollData = {};
      for (const employee of employees) {
        try {
          const response = await api.get(`/api/timeclock/admin/payroll-info/${employee.id}`);
          if (response.data.success && response.data.payrollInfo) {
            payrollData[employee.id] = response.data.payrollInfo;
          }
        } catch (err) {
          console.log(`No payroll info for employee ${employee.id}`);
        }
      }
      setEmployeePayrollInfo(payrollData);
    } catch (error) {
      console.error('❌ Error fetching payroll info:', error);
    }
  };

  // Fetch admin data when switching to admin view
  useEffect(() => {
    if (activeView === 'admin' && isAdmin) {
      fetchLiveEmployees();
      fetchAllEmployees();
      // Refresh live employees every 30 seconds
      const interval = setInterval(fetchLiveEmployees, 30000);
      return () => clearInterval(interval);
    }
  }, [activeView, isAdmin]);

  const handleClockIn = async () => {
    Alert.alert(
      t('timeclock.clock_in'),
      t('timeclock.confirm_clock_in'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('timeclock.clock_in'),
          onPress: async () => {
            setActionLoading(true);
            try {
              const response = await api.post('/api/timeclock/clock-in', {
                location: 'Mobile App',
              });
              if (response.data.success) {
                Alert.alert(t('common.success'), t('timeclock.clocked_in_success'));
                await fetchStatus();
                await fetchCurrentPeriod();
                await fetchWeeklyHours();
              }
            } catch (error) {
              Alert.alert(
                t('common.error'),
                error.response?.data?.message || t('timeclock.clock_in_error')
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleClockOut = async () => {
    Alert.alert(
      t('timeclock.clock_out'),
      t('timeclock.confirm_clock_out'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('timeclock.clock_out'),
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              const response = await api.post('/api/timeclock/clock-out', {});
              if (response.data.success) {
                Alert.alert(
                  t('common.success'),
                  `${t('timeclock.clocked_out_success')}\n${t('timeclock.total_hours')}: ${response.data.totalHours}`
                );
                await fetchStatus();
                await fetchCurrentPeriod();
                await fetchWeeklyHours();
              }
            } catch (error) {
              Alert.alert(
                t('common.error'),
                error.response?.data?.message || t('timeclock.clock_out_error')
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleBreakToggle = async () => {
    if (status.isOnBreak) {
      // End break
      setActionLoading(true);
      try {
        const response = await api.post('/api/timeclock/end-break', {});
        if (response.data.success) {
          Alert.alert(
            t('common.success'),
            `${t('timeclock.break_ended')}\n${t('timeclock.break_duration')}: ${response.data.durationMinutes} ${t('timeclock.minutes')}`
          );
          await fetchStatus();
          await fetchWeeklyHours();
        }
      } catch (error) {
        Alert.alert(
          t('common.error'),
          error.response?.data?.message || t('timeclock.break_end_error')
        );
      } finally {
        setActionLoading(false);
      }
    } else {
      // Start break
      Alert.alert(
        t('timeclock.start_break'),
        t('timeclock.confirm_start_break'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('timeclock.start_break'),
            onPress: async () => {
              setActionLoading(true);
              try {
                const response = await api.post('/api/timeclock/start-break', {
                  breakType: 'regular',
                });
                if (response.data.success) {
                  Alert.alert(t('common.success'), t('timeclock.break_started'));
                  await fetchStatus();
                  await fetchWeeklyHours();
                }
              } catch (error) {
                Alert.alert(
                  t('common.error'),
                  error.response?.data?.message || t('timeclock.break_start_error')
                );
              } finally {
                setActionLoading(false);
              }
            },
          },
        ]
      );
    }
  };

  // Manual Entry Handlers (Admin Only)
  const handleManualEntryChange = (field, value) => {
    setManualEntry(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitManualEntry = async () => {
    setActionLoading(true);
    try {
      const response = await api.post('/api/timeclock/admin/add-manual-entry', {
        date: manualEntry.date,
        timeIn: manualEntry.timeIn,
        timeOut: manualEntry.timeOut,
        breakMinutes: parseInt(manualEntry.breakMinutes) || 0,
        notes: manualEntry.notes
      });

      if (response.data.success) {
        Alert.alert(t('common.success'), t('timeclock.manual_entry_added'));
        setShowManualEntry(false);
        setManualEntry({
          date: getTodayPST(),
          timeIn: '',
          timeOut: '',
          breakMinutes: 0,
          notes: ''
        });
        await fetchWeeklyHours();
        await fetchCurrentPeriod();
      }
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error.response?.data?.message || t('timeclock.manual_entry_error')
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Edit Entry Handlers
  const handleEditEntry = async (entry) => {
    setEditingEntry(entry);
    setEditForm({
      clockInTime: entry.clock_in_time,
      clockOutTime: entry.clock_out_time || '',
      breakMinutes: entry.break_minutes || 0,
      notes: ''
    });

    // Fetch audit log
    try {
      const response = await api.get(`/api/timeclock/admin/entry-audit/${entry.id}`);
      if (response.data.success) {
        setAuditLog(response.data.auditLog || []);
      }
    } catch (error) {
      console.error('Error fetching audit log:', error);
      setAuditLog([]);
    }
  };

  const handleEditFormChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveEditEntry = async () => {
    setActionLoading(true);
    try {
      const response = await api.put(`/api/timeclock/admin/edit-entry/${editingEntry.id}`, {
        clockInTime: editForm.clockInTime,
        clockOutTime: editForm.clockOutTime,
        breakMinutes: parseInt(editForm.breakMinutes) || 0,
        notes: editForm.notes
      });

      if (response.data.success) {
        Alert.alert(t('common.success'), t('timeclock.entry_updated'));
        setEditingEntry(null);
        setEditForm({ clockInTime: '', clockOutTime: '', breakMinutes: 0, notes: '' });
        setAuditLog([]);
        await fetchWeeklyHours();
        await fetchCurrentPeriod();
      }
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error.response?.data?.message || t('timeclock.entry_update_error')
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEntry = async () => {
    setActionLoading(true);
    try {
      const response = await api.delete(`/api/timeclock/admin/delete-entry/${editingEntry.id}`);

      if (response.data.success) {
        Alert.alert(t('common.success'), t('timeclock.entry_deleted'));
        setEditingEntry(null);
        setEditForm({ clockInTime: '', clockOutTime: '', breakMinutes: 0, notes: '' });
        setAuditLog([]);
        await fetchWeeklyHours();
        await fetchCurrentPeriod();
      }
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error.response?.data?.message || t('timeclock.entry_delete_error')
      );
    } finally {
      setActionLoading(false);
    }
  };

  const calculateElapsedTime = () => {
    if (!status.isClockedIn || !status.clockInTime) return '0h 0m';
    
    const clockIn = new Date(status.clockInTime);
    const now = new Date();
    const diffMs = now - clockIn;
    const diffMins = Math.floor(diffMs / 60000) - status.breakMinutes;
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.blue} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header with Time Clock Title */}
      <View style={styles.header}>
        <Clock size={28} color={COLORS.blue} />
        <Text style={styles.headerTitle}>Time Clock</Text>
      </View>

      {/* View Toggle for Admins - Three Buttons */}
      {isAdmin && (
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              styles.calendarViewButton,
            ]}
            onPress={() => navigation.navigate('TimeClockCalendar')}
          >
            <Calendar size={16} color={COLORS.background} />
            <Text style={[styles.viewToggleText, styles.calendarViewText]}>
              Calendar View
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              activeView === 'employee' && styles.viewToggleButtonActive,
            ]}
            onPress={() => setActiveView('employee')}
          >
            <Text
              style={[
                styles.viewToggleText,
                activeView === 'employee' && styles.viewToggleTextActive,
              ]}
            >
              Employee View
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              activeView === 'admin' && styles.viewToggleButtonActive,
            ]}
            onPress={() => setActiveView('admin')}
          >
            <Users size={16} color={activeView === 'admin' ? COLORS.blue : COLORS.textSecondary} />
            <Text
              style={[
                styles.viewToggleText,
                activeView === 'admin' && styles.viewToggleTextActive,
              ]}
            >
              Admin View
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Employee View: Show time clock interface */}
      {activeView === 'employee' && (
        <>
          {/* Workday-style Interface */}
          {/* Enter Time Section */}
          <ContentGlass style={styles.workdaySection}>
        <Text style={styles.workdaySectionTitle}>Enter Time</Text>
        
        {/* Week Summary Buttons */}
        <View style={styles.weekButtons}>
          <TouchableOpacity
            style={styles.weekButton}
            onPress={() => navigation.navigate('TimeClockCalendar')}
          >
            <Text style={styles.weekButtonLabel}>
              This Week ({thisWeekHours.toFixed(6)} Hours)
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.weekButton}
            onPress={() => navigation.navigate('TimeClockCalendar')}
          >
            <Text style={styles.weekButtonLabel}>
              Last Week ({lastWeekHours.toFixed(6)} Hours)
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.weekButton}
            onPress={() => navigation.navigate('TimeClockCalendar')}
          >
            <Text style={styles.weekButtonLabel}>Select Week</Text>
          </TouchableOpacity>
        </View>
      </ContentGlass>

      {/* Time Clock Section */}
      <ContentGlass style={styles.workdaySection}>
        <Text style={styles.workdaySectionTitle}>Time Clock</Text>
        
        {/* Clock Status Info */}
        {status.isClockedIn && (
          <View style={styles.clockStatus}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Clocked In:</Text>
              <Text style={styles.statusValue}>{formatTimePST(status.clockInTime)}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Elapsed:</Text>
              <Text style={styles.statusValue}>{calculateElapsedTime()}</Text>
            </View>
            {status.breakMinutes > 0 && (
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Break:</Text>
                <Text style={styles.statusValue}>
                  {status.breakMinutes} {t('timeclock.minutes')}
                </Text>
              </View>
            )}
            {status.isOnBreak && (
              <View style={[styles.statusRow, styles.breakIndicator]}>
                <Coffee size={16} color={COLORS.warning} />
                <Text style={[styles.statusValue, { color: COLORS.warning }]}>
                  On Break
                </Text>
              </View>
            )}
          </View>
        )}
        
        {/* Clock Actions */}
        <View style={styles.clockActions}>
          {!status.isClockedIn ? (
            <TouchableOpacity
              style={[styles.clockButton, styles.checkInButton]}
              onPress={handleClockIn}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color={COLORS.background} />
              ) : (
                <>
                  <Play size={20} color={COLORS.background} fill={COLORS.background} />
                  <Text style={styles.clockButtonText}>Check In</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.clockButton, styles.checkOutButton]}
                onPress={handleClockOut}
                disabled={actionLoading || status.isOnBreak}
              >
                {actionLoading ? (
                  <ActivityIndicator color={COLORS.background} />
                ) : (
                  <>
                    <Square size={20} color={COLORS.background} fill={COLORS.background} />
                    <Text style={styles.clockButtonText}>Check Out</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.clockButton,
                  styles.breakButton,
                  status.isOnBreak && styles.breakActiveButton,
                ]}
                onPress={handleBreakToggle}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color={status.isOnBreak ? COLORS.background : COLORS.accent} />
                ) : (
                  <>
                    <Coffee
                      size={20}
                      color={status.isOnBreak ? COLORS.background : COLORS.accent}
                    />
                    <Text
                      style={[
                        styles.clockButtonText,
                        !status.isOnBreak && styles.breakButtonText,
                      ]}
                    >
                      {status.isOnBreak ? 'End Break' : 'Start Break'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </ContentGlass>

      {/* Current Pay Period Summary */}
      {currentPeriod && currentPeriod.hasPayPeriod && (
        <ContentGlass style={styles.periodCard}>
          <View style={styles.periodHeader}>
            <Text style={styles.workdaySectionTitle}>{t('timeclock.current_period')}</Text>
            <Text style={styles.periodDates}>
              {formatDatePST(currentPeriod.payPeriod.startDate)} - {formatDatePST(currentPeriod.payPeriod.endDate)}
            </Text>
          </View>

          <View style={styles.periodStats}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{currentPeriod.summary.totalHours}</Text>
              <Text style={styles.statLabel}>{t('timeclock.total_hours')}</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statValue}>{currentPeriod.summary.daysWorked}</Text>
              <Text style={styles.statLabel}>{t('timeclock.days_worked')}</Text>
            </View>

            {parseFloat(currentPeriod.summary.overtimeHours) > 0 && (
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: COLORS.warning }]}>
                  {currentPeriod.summary.overtimeHours}
                </Text>
                <Text style={styles.statLabel}>{t('timeclock.overtime_hours')}</Text>
              </View>
            )}
          </View>

          {parseFloat(currentPeriod.summary.estimatedGrossPay) > 0 && (
            <View style={styles.estimatedPay}>
              <Text style={styles.estimatedPayLabel}>{t('timeclock.estimated_gross')}:</Text>
              <Text style={styles.estimatedPayValue}>
                ${parseFloat(currentPeriod.summary.estimatedGrossPay).toFixed(2)}
              </Text>
            </View>
          )}
        </ContentGlass>
      )}

      {/* Additional Actions Row */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.calculatorButton]}
          onPress={() => setShowTaxCalculator(true)}
        >
          <Calculator size={20} color={COLORS.background} />
          <Text style={styles.actionButtonText}>{t('timeclock.tax_calculator')}</Text>
        </TouchableOpacity>

        {(user?.role === 'super_admin' || user?.role === 'admin') && (
          <TouchableOpacity
            style={[styles.actionButton, styles.manualEntryButton]}
            onPress={() => setShowManualEntry(true)}
          >
            <Plus size={20} color={COLORS.background} />
            <Text style={styles.actionButtonText}>{t('timeclock.manual_entry')}</Text>
          </TouchableOpacity>
        )}
      </View>
      </>
      )}

      {/* Admin View: Show employee management */}
      {activeView === 'admin' && (
        <>
          {/* Hours Report Button */}
          <TouchableOpacity
            style={styles.hoursReportButton}
            onPress={() => navigation.navigate('TimeClockCalendar')}
          >
            <Text style={styles.hoursReportIcon}>📊</Text>
            <Text style={styles.hoursReportText}>View Hours Report & Export</Text>
          </TouchableOpacity>

          {/* Currently Clocked In Section */}
          <ContentGlass style={styles.adminSection}>
            <View style={styles.liveSectionHeader}>
              <Text style={styles.adminSectionTitle}>Currently Clocked In</Text>
              <View style={styles.liveCount}>
                <Users size={20} color={COLORS.blue} />
                <Text style={styles.liveCountText}>
                  {liveEmployees.length} {liveEmployees.length === 1 ? 'Employee' : 'Employees'}
                </Text>
              </View>
            </View>

            {liveEmployees.length === 0 ? (
              <View style={styles.emptyState}>
                <Clock size={48} color={COLORS.textLight} />
                <Text style={styles.emptyStateText}>No employees currently clocked in</Text>
              </View>
            ) : (
              <View style={styles.employeeList}>
                {liveEmployees.map((entry) => (
                  <View key={entry.id} style={styles.employeeCard}>
                    <View style={styles.employeeInfo}>
                      <Text style={styles.employeeName}>{entry.employee_name}</Text>
                      <View style={styles.employeeDetails}>
                        <Text style={styles.employeeDetailText}>
                          Clocked in at: {formatTimePST(entry.clock_in_time)}
                        </Text>
                        {entry.isOnBreak && (
                          <View style={styles.breakBadge}>
                            <Coffee size={14} color={COLORS.warning} />
                            <Text style={styles.breakBadgeText}>On Break</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={styles.employeeHours}>
                      <Text style={styles.hoursValue}>{entry.currentHours}</Text>
                      <Text style={styles.hoursLabel}>Hours Today</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ContentGlass>

          {/* Employee Payroll Management Section */}
          <ContentGlass style={styles.adminSection}>
            <View style={styles.sectionToggle}>
              <Text style={styles.adminSectionTitle}>Employee Payroll Management</Text>
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => setShowPayrollSection(!showPayrollSection)}
              >
                <Text style={styles.toggleButtonText}>
                  {showPayrollSection ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>

            {showPayrollSection && (
              <View style={styles.payrollManagement}>
                <Text style={styles.sectionDescription}>
                  Set hourly rates and employment details for employees
                </Text>
                {allEmployees.length === 0 ? (
                  <View style={styles.emptyState}>
                    <ActivityIndicator size="large" color={COLORS.blue} />
                    <Text style={styles.emptyStateText}>Loading employees...</Text>
                  </View>
                ) : (
                  <View style={styles.employeePayrollList}>
                    {allEmployees
                      .filter(employee => {
                        if (user?.role === 'super_admin') return true;
                        if (user?.role === 'admin') {
                          return employee.role === 'employee' || employee.role === 'admin';
                        }
                        return false;
                      })
                      .map((employee) => {
                        const payrollInfo = employeePayrollInfo[employee.id];
                        return (
                          <View key={employee.id} style={styles.payrollEmployeeCard}>
                            <View style={styles.payrollEmployeeInfo}>
                              <Text style={styles.payrollEmployeeName}>{employee.full_name}</Text>
                              <Text style={styles.payrollEmployeeRole}>{employee.role}</Text>
                              {payrollInfo ? (
                                <View style={styles.payrollSummary}>
                                  <View style={styles.payrollDetail}>
                                    <Text style={styles.payrollLabel}>Type:</Text>
                                    <Text style={styles.payrollValue}>
                                      {payrollInfo.employment_type === 'hourly' ? '⏰ Hourly' : '💼 Salary'}
                                    </Text>
                                  </View>
                                  {payrollInfo.employment_type === 'hourly' ? (
                                    <>
                                      <View style={styles.payrollDetail}>
                                        <Text style={styles.payrollLabel}>Rate:</Text>
                                        <Text style={styles.payrollValue}>
                                          ${payrollInfo.hourly_rate?.toFixed(2)}/hr
                                        </Text>
                                      </View>
                                      <View style={styles.payrollDetail}>
                                        <Text style={styles.payrollLabel}>OT Rate:</Text>
                                        <Text style={styles.payrollValue}>
                                          ${payrollInfo.overtime_rate?.toFixed(2)}/hr
                                        </Text>
                                      </View>
                                    </>
                                  ) : (
                                    <View style={styles.payrollDetail}>
                                      <Text style={styles.payrollLabel}>Salary:</Text>
                                      <Text style={styles.payrollValue}>
                                        ${payrollInfo.salary?.toFixed(2)}/yr
                                      </Text>
                                    </View>
                                  )}
                                  <View style={styles.payrollDetail}>
                                    <Text style={styles.payrollLabel}>Period:</Text>
                                    <Text style={styles.payrollValue}>
                                      {payrollInfo.pay_period_type === 'weekly' && '📅 Weekly'}
                                      {payrollInfo.pay_period_type === 'biweekly' && '📅 Bi-Weekly'}
                                      {payrollInfo.pay_period_type === 'semimonthly' && '📅 Semi-Monthly'}
                                      {payrollInfo.pay_period_type === 'monthly' && '📅 Monthly'}
                                    </Text>
                                  </View>
                                </View>
                              ) : (
                                <View style={styles.noPayrollInfo}>
                                  <Text style={styles.warningIcon}>⚠️</Text>
                                  <Text style={styles.noPayrollText}>No payroll info set</Text>
                                </View>
                              )}
                            </View>
                            <TouchableOpacity
                              style={styles.btnSetPayroll}
                              onPress={() => {
                                Alert.alert(
                                  'Payroll Management',
                                  'Payroll editing is available on the web app. Navigate to the desktop site to manage employee payroll.',
                                  [{ text: 'OK' }]
                                );
                              }}
                            >
                              <Text style={styles.btnSetPayrollText}>
                                {payrollInfo ? 'Edit' : 'Set'} Payroll Info
                              </Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                  </View>
                )}
              </View>
            )}
          </ContentGlass>
        </>
      )}

      {/* Modals */}
      <TaxCalculatorModal
        visible={showTaxCalculator}
        onClose={() => setShowTaxCalculator(false)}
        payrollInfo={payrollInfo}
        currentPeriod={currentPeriod}
        thisWeekHours={thisWeekHours}
        lastWeekHours={lastWeekHours}
        employeeTaxRate={employeeTaxRate}
        onTaxRateChange={setEmployeeTaxRate}
        onSaveTaxRate={saveTaxRate}
        savingTaxRate={savingTaxRate}
      />

      <ManualEntryModal
        visible={showManualEntry}
        onClose={() => setShowManualEntry(false)}
        manualEntry={manualEntry}
        onEntryChange={handleManualEntryChange}
        onSubmit={handleSubmitManualEntry}
        submitting={actionLoading}
      />

      <EditEntryModal
        visible={!!editingEntry}
        onClose={() => {
          setEditingEntry(null);
          setEditForm({ clockInTime: '', clockOutTime: '', breakMinutes: 0, notes: '' });
          setAuditLog([]);
        }}
        editingEntry={editingEntry}
        editForm={editForm}
        onFormChange={handleEditFormChange}
        onSave={handleSaveEditEntry}
        onDelete={handleDeleteEntry}
        auditLog={auditLog}
        saving={actionLoading}
        deleting={actionLoading}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING[4],
    paddingBottom: SPACING[8],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING[3],
    fontSize: TYPOGRAPHY.md,
    color: COLORS.textLight,
  },
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    marginBottom: SPACING[4],
  },
  headerTitle: {
    fontSize: TYPOGRAPHY['2xl'],
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
  },
  // Time display styles
  timeCard: {
    padding: SPACING[4],
    marginBottom: SPACING[4],
  },
  timeDisplay: {
    alignItems: 'flex-start',
  },
  timeTextContainer: {
    flex: 1,
  },
  timeWithZone: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING[2],
  },
  currentTime: {
    fontSize: TYPOGRAPHY['3xl'],
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
  },
  timezone: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.accent,
  },
  currentDate: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
    marginTop: SPACING[1],
  },
  // Workday-style section styles
  workdaySection: {
    padding: SPACING[4],
    marginBottom: SPACING[4],
  },
  workdaySectionTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
    marginBottom: SPACING[4],
  },
  // Week buttons styles
  weekButtons: {
    gap: SPACING[3],
  },
  weekButton: {
    backgroundColor: COLORS.glassDark,
    padding: SPACING[4],
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  weekButtonLabel: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
    textAlign: 'center',
  },
  // Clock status styles
  clockStatus: {
    backgroundColor: COLORS.glassDark,
    padding: SPACING[3],
    borderRadius: RADIUS.lg,
    marginBottom: SPACING[4],
    gap: SPACING[2],
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
  },
  statusValue: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
  },
  breakIndicator: {
    backgroundColor: COLORS.warningLight || '#FEF3C7',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
    justifyContent: 'center',
    gap: SPACING[2],
  },
  // Clock action buttons
  clockActions: {
    gap: SPACING[3],
  },
  clockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    padding: SPACING[4],
    borderRadius: RADIUS.lg,
    minHeight: 56,
  },
  checkInButton: {
    backgroundColor: COLORS.success,
  },
  checkOutButton: {
    backgroundColor: COLORS.error,
  },
  breakButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  breakActiveButton: {
    backgroundColor: COLORS.warning,
    borderColor: COLORS.warning,
  },
  clockButtonText: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.background,
  },
  breakButtonText: {
    color: COLORS.accent,
  },
  // Period card styles
  periodCard: {
    padding: SPACING[4],
    marginBottom: SPACING[4],
  },
  periodHeader: {
    marginBottom: SPACING[4],
  },
  periodDates: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
    marginTop: SPACING[1],
  },
  periodStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING[4],
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: TYPOGRAPHY['2xl'],
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.accent,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textLight,
    marginTop: SPACING[1],
    textAlign: 'center',
  },
  estimatedPay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING[3],
    borderTopWidth: 1,
    borderTopColor: COLORS.glassBorder,
  },
  estimatedPayLabel: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.textLight,
  },
  estimatedPayValue: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.success,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    padding: SPACING[3],
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.glassDark,
  },
  historyButtonText: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.accent,
  },
  weeklyCard: {
    padding: SPACING[4],
    marginBottom: SPACING[4],
  },
  weeklyStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekBox: {
    flex: 1,
    alignItems: 'center',
  },
  weekLabel: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
    marginBottom: SPACING[2],
  },
  weekValue: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.accent,
  },
  weekDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.glassBorder,
    marginHorizontal: SPACING[3],
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING[3],
    marginBottom: SPACING[4],
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    padding: SPACING[3],
    borderRadius: RADIUS.xl,
  },
  calculatorButton: {
    backgroundColor: COLORS.accent,
  },
  manualEntryButton: {
    backgroundColor: COLORS.success,
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.background,
  },
  // View Toggle styles - Three buttons
  viewToggle: {
    flexDirection: 'row',
    marginBottom: SPACING[4],
    gap: SPACING[2],
  },
  viewToggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[1],
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[2],
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.glassLight,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  viewToggleButtonActive: {
    backgroundColor: COLORS.glassDark,
    borderColor: COLORS.blue,
  },
  calendarViewButton: {
    backgroundColor: COLORS.blue,
    borderColor: COLORS.blue,
  },
  viewToggleText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.textSecondary,
  },
  viewToggleTextActive: {
    color: COLORS.blue,
  },
  calendarViewText: {
    color: COLORS.background,
  },
  // Admin View styles
  hoursReportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    padding: SPACING[4],
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.blue,
    marginBottom: SPACING[4],
  },
  hoursReportIcon: {
    fontSize: 20,
  },
  hoursReportText: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.background,
  },
  adminSection: {
    padding: SPACING[4],
    marginBottom: SPACING[4],
  },
  liveSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING[4],
  },
  adminSectionTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
  },
  liveCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.glassLight,
  },
  liveCountText: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.blue,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING[8],
  },
  emptyStateText: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.textLight,
    marginTop: SPACING[3],
  },
  employeeList: {
    gap: SPACING[3],
  },
  employeeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING[4],
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.glassLight,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
    marginBottom: SPACING[1],
  },
  employeeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    flexWrap: 'wrap',
  },
  employeeDetailText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
  },
  breakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
    paddingHorizontal: SPACING[2],
    paddingVertical: SPACING[1],
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.warning + '20',
  },
  breakBadgeText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.warning,
  },
  employeeHours: {
    alignItems: 'center',
    marginLeft: SPACING[3],
  },
  hoursValue: {
    fontSize: TYPOGRAPHY['2xl'],
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.blue,
  },
  hoursLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textLight,
    marginTop: SPACING[1],
  },
  sectionToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING[3],
  },
  toggleButton: {
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[2],
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.glassDark,
  },
  toggleButtonText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.blue,
  },
  payrollManagement: {
    marginTop: SPACING[3],
  },
  sectionDescription: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
    marginBottom: SPACING[4],
  },
  employeePayrollList: {
    gap: SPACING[3],
  },
  payrollEmployeeCard: {
    padding: SPACING[4],
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.glassLight,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  payrollEmployeeInfo: {
    marginBottom: SPACING[3],
  },
  payrollEmployeeName: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
    marginBottom: SPACING[1],
  },
  payrollEmployeeRole: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
    marginBottom: SPACING[3],
    textTransform: 'capitalize',
  },
  payrollSummary: {
    gap: SPACING[2],
  },
  payrollDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payrollLabel: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
  },
  payrollValue: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
  },
  noPayrollInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    padding: SPACING[3],
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.warning + '20',
  },
  warningIcon: {
    fontSize: 18,
  },
  noPayrollText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.warning,
    fontWeight: TYPOGRAPHY.semibold,
  },
  btnSetPayroll: {
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
  },
  btnSetPayrollText: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.background,
  },
});

export default TimeClockScreen;
