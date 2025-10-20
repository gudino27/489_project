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
import { Clock, Play, Square, Coffee, Calendar } from 'lucide-react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants';
import { ContentGlass } from '../components/GlassView';
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
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
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

  // Fetch current pay period and weekly hours
  useEffect(() => {
    fetchCurrentPeriod();
    fetchWeeklyHours();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await api.get('/timeclock/current-status');
      if (response.data.success) {
        setStatus(response.data);
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentPeriod = async () => {
    try {
      const response = await api.get('/timeclock/current-period');
      if (response.data.success && response.data.hasPayPeriod) {
        setCurrentPeriod(response.data);
      }
    } catch (error) {
      console.error('Error fetching period:', error);
    }
  };

  const fetchWeeklyHours = async () => {
    try {
      // This Week
      const { startOfWeek, endOfWeek } = getCurrentWeekPST();
      const thisWeekResponse = await api.get(
        `/timeclock/my-entries?startDate=${toPSTDateString(startOfWeek)}&endDate=${toPSTDateString(endOfWeek)}`
      );

      if (thisWeekResponse.data.success) {
        const totalHours = thisWeekResponse.data.entries.reduce(
          (sum, entry) => sum + parseFloat(entry.total_hours || 0),
          0
        );
        setThisWeekHours(totalHours);
      }

      // Last Week
      const { startOfWeek: lastWeekStart, endOfWeek: lastWeekEnd } = getLastWeekPST();
      const lastWeekResponse = await api.get(
        `/timeclock/my-entries?startDate=${toPSTDateString(lastWeekStart)}&endDate=${toPSTDateString(lastWeekEnd)}`
      );

      if (lastWeekResponse.data.success) {
        const totalHours = lastWeekResponse.data.entries.reduce(
          (sum, entry) => sum + parseFloat(entry.total_hours || 0),
          0
        );
        setLastWeekHours(totalHours);
      }
    } catch (error) {
      console.error('Error fetching weekly hours:', error);
    }
  };

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
              const response = await api.post('/timeclock/clock-in', {
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
              const response = await api.post('/timeclock/clock-out');
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
        const response = await api.post('/timeclock/end-break');
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
                const response = await api.post('/timeclock/start-break', {
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
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Current Time */}
      <ContentGlass style={styles.timeCard}>
        <View style={styles.timeDisplay}>
          <Clock size={32} color={COLORS.accent} />
          <View style={styles.timeTextContainer}>
            <View style={styles.timeWithZone}>
              <Text style={styles.currentTime}>
                {currentTime.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })}
              </Text>
              <Text style={styles.timezone}>{getTimezoneAbbreviation()}</Text>
            </View>
            <Text style={styles.currentDate}>
              {currentTime.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
        </View>
      </ContentGlass>

      {/* Clock In/Out Status */}
      <ContentGlass style={styles.statusCard}>
        <Text style={styles.sectionTitle}>{t('timeclock.current_status')}</Text>
        
        {status.isClockedIn ? (
          <>
            <View style={styles.statusActive}>
              <View style={styles.statusIndicator} />
              <Text style={styles.statusText}>{t('timeclock.clocked_in')}</Text>
            </View>
            
            <View style={styles.statusDetails}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>{t('timeclock.clock_in_time')}:</Text>
                <Text style={styles.statusValue}>{formatTimePST(status.clockInTime)}</Text>
              </View>
              
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>{t('timeclock.elapsed_time')}:</Text>
                <Text style={styles.statusValue}>{calculateElapsedTime()}</Text>
              </View>
              
              {status.breakMinutes > 0 && (
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>{t('timeclock.break_time')}:</Text>
                  <Text style={styles.statusValue}>
                    {status.breakMinutes} {t('timeclock.minutes')}
                  </Text>
                </View>
              )}

              {status.isOnBreak && (
                <View style={[styles.statusRow, styles.breakIndicator]}>
                  <Coffee size={16} color={COLORS.warning} />
                  <Text style={[styles.statusValue, { color: COLORS.warning }]}>
                    {t('timeclock.on_break')}
                  </Text>
                </View>
              )}
            </View>
          </>
        ) : (
          <View style={styles.statusInactive}>
            <Text style={styles.statusText}>{t('timeclock.not_clocked_in')}</Text>
          </View>
        )}
      </ContentGlass>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {!status.isClockedIn ? (
          <TouchableOpacity
            style={[styles.primaryButton, styles.clockInButton]}
            onPress={handleClockIn}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color={COLORS.background} />
            ) : (
              <>
                <Play size={24} color={COLORS.background} fill={COLORS.background} />
                <Text style={styles.primaryButtonText}>{t('timeclock.clock_in')}</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.primaryButton, styles.clockOutButton]}
              onPress={handleClockOut}
              disabled={actionLoading || status.isOnBreak}
            >
              {actionLoading ? (
                <ActivityIndicator color={COLORS.background} />
              ) : (
                <>
                  <Square size={24} color={COLORS.background} fill={COLORS.background} />
                  <Text style={styles.primaryButtonText}>{t('timeclock.clock_out')}</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.secondaryButton,
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
                      styles.secondaryButtonText,
                      status.isOnBreak && styles.breakActiveButtonText,
                    ]}
                  >
                    {status.isOnBreak ? t('timeclock.end_break') : t('timeclock.start_break')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Current Pay Period Summary */}
      {currentPeriod && currentPeriod.hasPayPeriod && (
        <ContentGlass style={styles.periodCard}>
          <View style={styles.periodHeader}>
            <Text style={styles.sectionTitle}>{t('timeclock.current_period')}</Text>
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

      {/* Weekly Hours Summary */}
      <ContentGlass style={styles.weeklyCard}>
        <Text style={styles.sectionTitle}>{t('timeclock.weekly_hours')}</Text>
        <View style={styles.weeklyStats}>
          <View style={styles.weekBox}>
            <Text style={styles.weekLabel}>{t('timeclock.this_week')}</Text>
            <Text style={styles.weekValue}>{thisWeekHours.toFixed(2)} {t('timeclock.hours')}</Text>
          </View>
          <View style={styles.weekDivider} />
          <View style={styles.weekBox}>
            <Text style={styles.weekLabel}>{t('timeclock.last_week')}</Text>
            <Text style={styles.weekValue}>{lastWeekHours.toFixed(2)} {t('timeclock.hours')}</Text>
          </View>
        </View>
      </ContentGlass>

      {/* View History Button */}
      <TouchableOpacity
        style={styles.historyButton}
        onPress={() => navigation.navigate('TimeClockCalendar')}
      >
        <Calendar size={20} color={COLORS.accent} />
        <Text style={styles.historyButtonText}>{t('timeclock.view_history')}</Text>
      </TouchableOpacity>
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
  timeCard: {
    padding: SPACING[4],
    marginBottom: SPACING[4],
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
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
  statusCard: {
    padding: SPACING[4],
    marginBottom: SPACING[4],
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
    marginBottom: SPACING[3],
  },
  statusActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    marginBottom: SPACING[3],
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
  },
  statusText: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
  },
  statusInactive: {
    padding: SPACING[3],
    backgroundColor: COLORS.glassDark,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  statusDetails: {
    gap: SPACING[2],
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING[2],
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
    backgroundColor: COLORS.glassDark,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING[3],
    justifyContent: 'center',
    gap: SPACING[2],
  },
  actionButtons: {
    gap: SPACING[3],
    marginBottom: SPACING[4],
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    padding: SPACING[4],
    borderRadius: RADIUS.xl,
    minHeight: 60,
  },
  clockInButton: {
    backgroundColor: COLORS.success,
  },
  clockOutButton: {
    backgroundColor: COLORS.error,
  },
  primaryButtonText: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.background,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    padding: SPACING[3],
    borderRadius: RADIUS.xl,
    borderWidth: 2,
    borderColor: COLORS.accent,
    backgroundColor: 'transparent',
  },
  breakActiveButton: {
    backgroundColor: COLORS.warning,
    borderColor: COLORS.warning,
  },
  secondaryButtonText: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.accent,
  },
  breakActiveButtonText: {
    color: COLORS.background,
  },
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
});

export default TimeClockScreen;
