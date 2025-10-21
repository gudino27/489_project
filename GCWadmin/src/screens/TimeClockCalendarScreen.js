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
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Plus, Clock, Calendar } from 'lucide-react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants';
import { ContentGlass } from '../components/GlassView';
import api from '../api/client';
import {
  formatDatePST,
  formatTimePST,
  getTodayPST,
  extractPSTDate,
  getTimezoneAbbreviation,
  toPSTDateString,
} from '../utils/timezoneHelpers';

const TimeClockCalendarScreen = ({ navigation, route }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const employeeId = route?.params?.employeeId || user?.id;
  const isAdmin = user?.role === 'super_admin';
  
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState('month'); // 'month' or 'week'
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

      // Get last day of month for end date
      const lastDay = new Date(year, currentDate.getMonth() + 1, 0).getDate();
      const startDate = `${year}-${month}-01`;
      const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

      // Use the same endpoint for both admin and employee
      const response = await api.get(`/api/timeclock/my-entries?startDate=${startDate}&endDate=${endDate}`);

      if (response.data.success) {
        processMonthEntries(response.data.entries);
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

  const getWeekDays = () => {
    const days = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Go to Sunday
    
    const todayPST = getTodayPST();

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = toPSTDateString(date);
      const dayEntry = monthEntries.find(e => e.date === dateStr);

      days.push({
        type: 'day',
        day: date.getDate(),
        date: dateStr,
        hasEntry: !!dayEntry,
        totalHours: dayEntry?.totalHours || 0,
        isToday: dateStr === todayPST,
        key: `day-${dateStr}`,
        fullDate: date,
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
    if (calendarView === 'week') {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() - 7);
      setCurrentDate(newDate);
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    }
  };

  const handleNextMonth = () => {
    if (calendarView === 'week') {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + 7);
      setCurrentDate(newDate);
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayPress = (dayData) => {
    // Navigate to TimeEntryDetails screen for any day (with or without entries)
    navigation.navigate('TimeEntryDetails', {
      date: dayData.date,
      employeeId,
    });
  };

  const monthName = calendarView === 'week'
    ? `Week of ${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const days = calendarView === 'month' ? getDaysInMonth() : getWeekDays();

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.blue} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Month Navigation */}
        <ContentGlass style={styles.navigationCard}>
          <View style={styles.monthNavigation}>
            <TouchableOpacity onPress={handlePreviousMonth} style={styles.navButton}>
              <ChevronLeft size={24} color={COLORS.blue} />
              <Text style={styles.navButtonText}>
                {calendarView === 'month' ? 'Previous' : 'Prev Week'}
              </Text>
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
            <Text style={styles.navButtonText}>
              {calendarView === 'month' ? 'Next' : 'Next Week'}
            </Text>
            <ChevronRight size={24} color={COLORS.blue} />
          </TouchableOpacity>
        </View>

        {/* Week/Month Toggle */}
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              calendarView === 'week' && styles.viewToggleButtonActive,
            ]}
            onPress={() => setCalendarView('week')}
          >
            <Calendar size={16} color={calendarView === 'week' ? COLORS.blue : COLORS.textGray} />
            <Text
              style={[
                styles.viewToggleText,
                calendarView === 'week' && styles.viewToggleTextActive,
              ]}
            >
              Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              calendarView === 'month' && styles.viewToggleButtonActive,
            ]}
            onPress={() => setCalendarView('month')}
          >
            <Calendar size={16} color={calendarView === 'month' ? COLORS.blue : COLORS.textGray} />
            <Text
              style={[
                styles.viewToggleText,
                calendarView === 'month' && styles.viewToggleTextActive,
              ]}
            >
              Month
            </Text>
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
          {days.map((dayData) => {
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
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
    padding: SPACING[2],
    marginBottom: SPACING[3],
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
    padding: SPACING[1.5],
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.glassDark,
  },
  navButtonText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.blue,
  },
  monthTitleContainer: {
    alignItems: 'center',
    paddingVertical: SPACING[1],
  },
  monthTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING[1],
  },
  monthTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
  },
  timezone: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.blue,
  },
  todayButton: {
    marginTop: SPACING[0.5],
    paddingHorizontal: SPACING[2],
    paddingVertical: SPACING[0.5],
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.blue,
  },
  todayButtonText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.background,
  },
  summaryCard: {
    padding: SPACING[3],
    marginBottom: SPACING[3],
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
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.blue,
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textLight,
    marginTop: SPACING[0.5],
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.glassBorder,
    marginHorizontal: SPACING[2],
  },
  calendarCard: {
    padding: SPACING[2],
    marginBottom: SPACING[3],
    width: '100%',
    alignSelf: 'stretch',
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: SPACING[1],
    gap: 0,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING[1],
  },
  dayHeaderText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.textLight,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 1,
  },
  calendarDay: {
    width: `${(100 / 7) - 0.35}%`,
    aspectRatio: 1,
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
    color: COLORS.blue,
  },
  dayHours: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.background,
    marginTop: 2,
  },
  legendCard: {
    padding: SPACING[2],
    marginBottom: SPACING[3],
  },
  legendTitle: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
    marginBottom: SPACING[1],
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
  },
  legendColor: {
    width: 14,
    height: 14,
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
    padding: SPACING[3],
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.blue,
  },
  addButtonText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.background,
  },
  // View Toggle Styles
  viewToggle: {
    flexDirection: 'row',
    marginTop: SPACING[2],
    gap: SPACING[1],
  },
  viewToggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[1],
    paddingVertical: SPACING[1.5],
    paddingHorizontal: SPACING[2],
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.glassLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  viewToggleButtonActive: {
    backgroundColor: COLORS.gray100,
    borderColor: COLORS.blue,
  },
  viewToggleText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.textGray,
  },
  viewToggleTextActive: {
    color: COLORS.blue,
  },
});

export default TimeClockCalendarScreen;
