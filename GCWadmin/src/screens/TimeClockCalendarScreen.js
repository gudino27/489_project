import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants';
import { ContentGlass } from '../components/GlassView';
import api from '../api/client';
import {
  formatDatePST,
  getTodayPST,
  extractPSTDate,
  getTimezoneAbbreviation,
} from '../utils/timezoneHelpers';

const TimeClockCalendarScreen = ({ navigation, route }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const employeeId = route?.params?.employeeId || user?.id;
  const isAdmin = user?.role === 'super_admin';
  
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthEntries, setMonthEntries] = useState([]);
  const [monthSummary, setMonthSummary] = useState({
    totalHours: 0,
    daysWorked: 0,
    overtimeHours: 0,
  });

  useEffect(() => {
    fetchMonthData();
  }, [currentDate, employeeId]);

  const fetchMonthData = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      
      const endpoint = isAdmin 
        ? `/admin/timeclock/entries/month?employeeId=${employeeId}&year=${year}&month=${month}`
        : `/timeclock/my-entries?startDate=${year}-${month}-01&endDate=${year}-${month}-31`;
      
      const response = await api.get(endpoint);
      
      if (response.data.success) {
        const entries = isAdmin ? response.data.entries : response.data.entries;
        processMonthEntries(entries);
      }
    } catch (error) {
      console.error('Error fetching month data:', error);
      Alert.alert(t('common.error'), t('timeclock.fetch_error'));
    } finally {
      setLoading(false);
    }
  };

  const processMonthEntries = (entries) => {
    // Group entries by date (PST)
    const entriesByDate = {};
    let totalHours = 0;
    let overtimeHours = 0;

    entries.forEach(entry => {
      // Extract date portion from PST timestamp
      const date = entry.date || extractPSTDate(entry.clock_in_time);
      if (!entriesByDate[date]) {
        entriesByDate[date] = {
          date,
          entries: [],
          totalHours: 0,
        };
      }
      entriesByDate[date].entries.push(entry);
      entriesByDate[date].totalHours += parseFloat(entry.total_hours || 0);

      totalHours += parseFloat(entry.total_hours || 0);
      overtimeHours += parseFloat(entry.overtime_hours || 0);
    });

    setMonthEntries(Object.values(entriesByDate));
    setMonthSummary({
      totalHours: totalHours.toFixed(2),
      daysWorked: Object.keys(entriesByDate).length,
      overtimeHours: overtimeHours.toFixed(2),
    });
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    const startPadding = firstDay.getDay(); // 0-6, Sunday-Saturday
    
    // Add padding for days before month starts
    for (let i = 0; i < startPadding; i++) {
      days.push({ type: 'padding', key: `padding-start-${i}` });
    }
    
    // Add actual days of month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEntry = monthEntries.find(e => e.date === dateStr);
      
      days.push({
        type: 'day',
        day,
        date: dateStr,
        hasEntry: !!dayEntry,
        totalHours: dayEntry?.totalHours || 0,
        isToday: dateStr === getTodayPST(),
        key: `day-${day}`,
      });
    }
    
    return days;
  };

  const getDayColor = (hours) => {
    if (hours === 0) return COLORS.glassDark;
    if (hours >= 8) return COLORS.success;
    if (hours >= 4) return COLORS.warning;
    return COLORS.error;
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayPress = (dayData) => {
    if (!dayData.hasEntry && isAdmin) {
      // Navigate to add manual entry
      navigation.navigate('AddTimeEntry', {
        employeeId,
        date: dayData.date,
      });
    } else if (dayData.hasEntry) {
      // Show day details or navigate to edit
      navigation.navigate('TimeEntryDetails', {
        date: dayData.date,
        employeeId,
      });
    }
  };

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

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
      {/* Month Navigation */}
      <ContentGlass style={styles.navigationCard}>
        <View style={styles.monthNavigation}>
          <TouchableOpacity onPress={handlePreviousMonth} style={styles.navButton}>
            <ChevronLeft size={24} color={COLORS.accent} />
          </TouchableOpacity>
          
          <View style={styles.monthTitleContainer}>
            <View style={styles.monthTitleRow}>
              <Text style={styles.monthTitle}>{monthName}</Text>
              <Text style={styles.timezone}>{getTimezoneAbbreviation()}</Text>
            </View>
            <TouchableOpacity onPress={handleToday} style={styles.todayButton}>
              <Text style={styles.todayButtonText}>{t('timeclock.today')}</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
            <ChevronRight size={24} color={COLORS.accent} />
          </TouchableOpacity>
        </View>
      </ContentGlass>

      {/* Month Summary */}
      <ContentGlass style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{monthSummary.totalHours}</Text>
            <Text style={styles.summaryLabel}>{t('timeclock.total_hours')}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{monthSummary.daysWorked}</Text>
            <Text style={styles.summaryLabel}>{t('timeclock.days_worked')}</Text>
          </View>
          {parseFloat(monthSummary.overtimeHours) > 0 && (
            <>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: COLORS.warning }]}>
                  {monthSummary.overtimeHours}
                </Text>
                <Text style={styles.summaryLabel}>{t('timeclock.overtime_hours')}</Text>
              </View>
            </>
          )}
        </View>
      </ContentGlass>

      {/* Calendar Grid */}
      <ContentGlass style={styles.calendarCard}>
        {/* Day Headers */}
        <View style={styles.weekHeader}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <View key={day} style={styles.dayHeader}>
              <Text style={styles.dayHeaderText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar Days */}
        <View style={styles.calendarGrid}>
          {getDaysInMonth().map((dayData) => {
            if (dayData.type === 'padding') {
              return <View key={dayData.key} style={styles.calendarDay} />;
            }

            return (
              <TouchableOpacity
                key={dayData.key}
                style={[
                  styles.calendarDay,
                  dayData.isToday && styles.calendarDayToday,
                ]}
                onPress={() => handleDayPress(dayData)}
                disabled={!dayData.hasEntry && !isAdmin}
              >
                <View
                  style={[
                    styles.dayContent,
                    { backgroundColor: getDayColor(dayData.totalHours) },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      dayData.hasEntry && styles.dayNumberActive,
                      dayData.isToday && styles.dayNumberToday,
                    ]}
                  >
                    {dayData.day}
                  </Text>
                  {dayData.hasEntry && (
                    <Text style={styles.dayHours}>
                      {dayData.totalHours.toFixed(1)}h
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ContentGlass>

      {/* Legend */}
      <ContentGlass style={styles.legendCard}>
        <Text style={styles.legendTitle}>{t('timeclock.legend')}</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: COLORS.success }]} />
            <Text style={styles.legendText}>8+ {t('timeclock.hours')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: COLORS.warning }]} />
            <Text style={styles.legendText}>4-8 {t('timeclock.hours')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: COLORS.error }]} />
            <Text style={styles.legendText}>{'<'}4 {t('timeclock.hours')}</Text>
          </View>
        </View>
      </ContentGlass>

      {/* Add Manual Entry Button (Admin Only) */}
      {isAdmin && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddTimeEntry', { employeeId })}
        >
          <Plus size={24} color={COLORS.background} />
          <Text style={styles.addButtonText}>{t('timeclock.add_time')}</Text>
        </TouchableOpacity>
      )}
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
  navigationCard: {
    padding: SPACING[3],
    marginBottom: SPACING[4],
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    padding: SPACING[2],
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.glassDark,
  },
  monthTitleContainer: {
    alignItems: 'center',
  },
  monthTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING[2],
  },
  monthTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
  },
  timezone: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.accent,
  },
  todayButton: {
    marginTop: SPACING[1],
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[1],
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accent,
  },
  todayButtonText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.background,
  },
  summaryCard: {
    padding: SPACING[4],
    marginBottom: SPACING[4],
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: TYPOGRAPHY['2xl'],
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.accent,
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textLight,
    marginTop: SPACING[1],
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.glassBorder,
    marginHorizontal: SPACING[2],
  },
  calendarCard: {
    padding: SPACING[3],
    marginBottom: SPACING[4],
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: SPACING[2],
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING[2],
  },
  dayHeaderText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.textLight,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 2,
  },
  calendarDayToday: {
    backgroundColor: COLORS.glassDark,
    borderRadius: RADIUS.md,
  },
  dayContent: {
    flex: 1,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING[1],
  },
  dayNumber: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.textLight,
  },
  dayNumberActive: {
    color: COLORS.background,
    fontWeight: TYPOGRAPHY.bold,
  },
  dayNumberToday: {
    color: COLORS.accent,
  },
  dayHours: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.background,
    marginTop: 2,
  },
  legendCard: {
    padding: SPACING[3],
    marginBottom: SPACING[4],
  },
  legendTitle: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
    marginBottom: SPACING[2],
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: RADIUS.sm,
  },
  legendText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textLight,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    padding: SPACING[4],
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.accent,
  },
  addButtonText: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.background,
  },
});

export default TimeClockCalendarScreen;
