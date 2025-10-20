# Time Clock iOS Updates Needed

Based on analysis of the webapp TimeClockManager.js implementation, here are the features and improvements needed for the iOS app to achieve feature parity.

## Current Status

**iOS App (GCWadmin):**
- ✅ Basic clock in/out
- ✅ Break management
- ✅ Current status display
- ✅ Pay period summary
- ✅ Calendar view (month)
- ✅ 106 translation keys
- ✅ Navigation integrated

**Webapp TimeClockManager.js:**
- ✅ All of the above
- ✅ PST Timezone handling
- ✅ Week view calendar
- ✅ Manual time entry (admin)
- ✅ Edit/Delete entries with audit log
- ✅ Tax calculator
- ✅ Payroll info management
- ✅ This Week / Last Week hours
- ✅ 162 translation keys

---

## Missing Features in iOS App

### 1. **PST Timezone Handling** ⚠️ CRITICAL

**Current Issue:** iOS app uses device timezone, not PST
**Webapp Solution:** Comprehensive PST timezone helpers

**What to Add:**
```javascript
// File: GCWadmin/src/utils/timezoneHelpers.js

const TIMEZONE = 'America/Los_Angeles';

// Parse PST timestamp from database: "2025-10-19 18:08:00"
export const parsePSTTimestamp = (pstTimestamp) => {
  if (!pstTimestamp) return null;
  const parts = pstTimestamp.split(/[- :]/);
  return new Date(Date.UTC(parts[0], parts[1]-1, parts[2], parts[3], parts[4], parts[5]));
};

// Format time in PST
export const formatTimePST = (dateTimeStr) => {
  if (!dateTimeStr) return '--:--';
  let date;
  if (typeof dateTimeStr === 'string' && dateTimeStr.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
    const parts = dateTimeStr.split(/[- :]/);
    date = new Date(Date.UTC(parts[0], parts[1]-1, parts[2], parts[3], parts[4], parts[5]));
  } else {
    date = new Date(dateTimeStr);
  }

  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};

// Get today's date in PST
export const getTodayPST = () => {
  const now = new Date();
  const pstDate = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  const [month, day, year] = pstDate.split('/');
  return `${year}-${month}-${day}`;
};

// Extract date from PST timestamp
export const extractPSTDate = (pstTimestamp) => {
  if (!pstTimestamp) return '';
  return pstTimestamp.split(' ')[0]; // "2025-10-19 18:08:00" -> "2025-10-19"
};

// Convert date to PST string
export const toPSTDateString = (date) => {
  const pstDate = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  const [month, day, year] = pstDate.split('/');
  return `${year}-${month}-${day}`;
};
```

**Files to Update:**
- Create: `GCWadmin/src/utils/timezoneHelpers.js`
- Update: `TimeClockScreen.js` - Replace all date/time formatting
- Update: `TimeClockCalendarScreen.js` - Use PST for date grouping

---

### 2. **Week View Toggle**

**Webapp has:** Month/Week toggle buttons

**What to Add to TimeClockCalendarScreen.js:**
```javascript
const [calendarView, setCalendarView] = useState('month'); // 'week' or 'month'

// Add toggle buttons
<View style={styles.viewToggle}>
  <TouchableOpacity
    style={[styles.toggleButton, calendarView === 'week' && styles.toggleButtonActive]}
    onPress={() => setCalendarView('week')}
  >
    <Text style={styles.toggleButtonText}>{t('timeclock.week_view')}</Text>
  </TouchableOpacity>
  <TouchableOpacity
    style={[styles.toggleButton, calendarView === 'month' && styles.toggleButtonActive]}
    onPress={() => setCalendarView('month')}
  >
    <Text style={styles.toggleButtonText}>{t('timeclock.month_view')}</Text>
  </TouchableOpacity>
</View>

// Render week view when active
{calendarView === 'week' ? renderWeekView() : renderMonthView()}
```

---

### 3. **This Week / Last Week Hours**

**Webapp has:** Quick summary buttons showing hours for current/last week

**What to Add to TimeClockScreen.js:**
```javascript
const [thisWeekHours, setThisWeekHours] = useState(0);
const [lastWeekHours, setLastWeekHours] = useState(0);

const fetchWeeklyHours = async () => {
  try {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const response = await api.get(
      `/timeclock/my-entries?startDate=${toPSTDateString(startOfWeek)}&endDate=${toPSTDateString(endOfWeek)}`
    );

    const totalHours = response.data.entries.reduce((sum, entry) =>
      sum + parseFloat(entry.total_hours || 0), 0
    );
    setThisWeekHours(totalHours);

    // Last week
    const lastWeekStart = new Date(startOfWeek);
    lastWeekStart.setDate(startOfWeek.getDate() - 7);
    const lastWeekEnd = new Date(endOfWeek);
    lastWeekEnd.setDate(endOfWeek.getDate() - 7);

    const lastWeekResponse = await api.get(
      `/timeclock/my-entries?startDate=${toPSTDateString(lastWeekStart)}&endDate=${toPSTDateString(lastWeekEnd)}`
    );

    const lastWeekTotal = lastWeekResponse.data.entries.reduce((sum, entry) =>
      sum + parseFloat(entry.total_hours || 0), 0
    );
    setLastWeekHours(lastWeekTotal);
  } catch (error) {
    console.error('Error fetching weekly hours:', error);
  }
};

// UI
<View style={styles.weekSummary}>
  <TouchableOpacity style={styles.weekButton}>
    <Text style={styles.weekLabel}>{t('timeclock.this_week')}</Text>
    <Text style={styles.weekHours}>{thisWeekHours.toFixed(2)}h</Text>
  </TouchableOpacity>
  <TouchableOpacity style={styles.weekButton}>
    <Text style={styles.weekLabel}>{t('timeclock.last_week')}</Text>
    <Text style={styles.weekHours}>{lastWeekHours.toFixed(2)}h</Text>
  </TouchableOpacity>
</View>
```

---

### 4. **Tax Calculator & Net Pay**

**Webapp has:** Tax rate input and net pay calculation

**What to Add:**
```javascript
// New screen: TaxCalculatorScreen.js
const TaxCalculatorScreen = () => {
  const [taxRate, setTaxRate] = useState('');
  const [payrollInfo, setPayrollInfo] = useState(null);

  const calculateNetPay = (grossPay, taxRate) => {
    const tax = grossPay * (taxRate / 100);
    return (grossPay - tax).toFixed(2);
  };

  return (
    <ScrollView>
      <ContentGlass>
        <Text>{t('timeclock.tax_calculator')}</Text>
        <TextInput
          placeholder={t('timeclock.tax_rate_placeholder')}
          value={taxRate}
          onChangeText={setTaxRate}
          keyboardType="decimal-pad"
        />
        {/* Show gross vs net */}
      </ContentGlass>
    </ScrollView>
  );
};
```

---

### 5. **Edit/Delete Time Entries**

**Webapp has:** Full edit modal with audit trail

**What to Add:**
Create new screen: `TimeEntryEditScreen.js`

```javascript
const TimeEntryEditScreen = ({ route, navigation }) => {
  const { entryId } = route.params;
  const [entry, setEntry] = useState(null);
  const [auditLog, setAuditLog] = useState([]);
  const [editForm, setEditForm] = useState({
    clockInTime: '',
    clockOutTime: '',
    breakMinutes: 0,
    notes: ''
  });

  const fetchEntry = async () => {
    // Load entry details
  };

  const fetchAuditLog = async () => {
    const response = await api.get(`/timeclock/admin/entry-audit/${entryId}`);
    setAuditLog(response.data.auditLog);
  };

  const handleSave = async () => {
    const response = await api.post(`/timeclock/admin/edit-entry/${entryId}`, {
      clockInTime: editForm.clockInTime,
      clockOutTime: editForm.clockOutTime,
      breakMinutes: editForm.breakMinutes,
      notes: editForm.notes,
      reason: 'Corrected entry'
    });

    if (response.data.success) {
      Alert.alert(t('common.success'), t('timeclock.entry_updated'));
      navigation.goBack();
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      t('timeclock.delete_entry'),
      t('timeclock.delete_confirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await api.delete(`/timeclock/admin/delete-entry/${entryId}`);
            navigation.goBack();
          }
        }
      ]
    );
  };

  // UI with datetime pickers, audit log section
};
```

---

### 6. **Manual Time Entry (Admin)**

**Webapp has:** Add manual entry modal for admins

**What to Add:**
Create new screen: `AddTimeEntryScreen.js`

```javascript
const AddTimeEntryScreen = ({ route, navigation }) => {
  const { employeeId, date } = route.params;
  const [manualEntry, setManualEntry] = useState({
    date: date || getTodayPST(),
    timeIn: '',
    timeOut: '',
    breakMinutes: 0,
    notes: ''
  });

  const handleSubmit = async () => {
    const response = await api.post('/timeclock/admin/add-manual-entry', {
      employeeId,
      date: manualEntry.date,
      clockInTime: `${manualEntry.date} ${manualEntry.timeIn}:00`,
      clockOutTime: manualEntry.timeOut ? `${manualEntry.date} ${manualEntry.timeOut}:00` : null,
      breakMinutes: parseInt(manualEntry.breakMinutes),
      notes: manualEntry.notes
    });

    if (response.data.success) {
      Alert.alert(t('common.success'), t('timeclock.entry_added'));
      navigation.goBack();
    }
  };

  // UI with date picker, time pickers
};
```

---

### 7. **Payroll Info Management**

**Webapp has:** Set hourly rate, overtime rate, employment type

**What to Add:**
New screen or modal for setting payroll info per employee.

---

## Missing Translation Keys

**Add to `GCWadmin/src/utils/translations.js`:**

```javascript
// English
"timeclock.week_view": "Week",
"timeclock.month_view": "Month",
"timeclock.this_week": "This Week",
"timeclock.last_week": "Last Week",
"timeclock.select_week": "Select Week",
"timeclock.tax_calculator": "Tax Calculator",
"timeclock.tax_rate_placeholder": "Enter tax rate (%)",
"timeclock.gross_pay": "Gross Pay",
"timeclock.net_pay": "Net Pay (after tax)",
"timeclock.save_tax_rate": "Save Tax Rate",
"timeclock.enter_time_manually": "Enter Time Manually",
"timeclock.time_in": "Time In",
"timeclock.time_out": "Time Out",
"timeclock.add_time": "Add Time Entry",
"timeclock.entry_added": "Time entry added successfully",
"timeclock.entry_updated": "Time entry updated successfully",
"timeclock.delete_entry": "Delete Entry",
"timeclock.delete_confirm": "Are you sure you want to delete this time entry?",
"timeclock.audit_trail": "Audit Trail",
"timeclock.no_changes": "No modifications yet",
"timeclock.modified_by": "Modified by",
"timeclock.modification_reason": "Reason",
"timeclock.payroll_info": "Payroll Information",
"timeclock.hourly_rate": "Hourly Rate",
"timeclock.overtime_rate": "Overtime Rate",
"timeclock.employment_type": "Employment Type",
"timeclock.salary": "Salary",
"timeclock.pay_period_type": "Pay Period Type",
"timeclock.timezone_indicator": "All times in PST/PDT",

// Spanish
"timeclock.week_view": "Semana",
"timeclock.month_view": "Mes",
"timeclock.this_week": "Esta Semana",
"timeclock.last_week": "Semana Pasada",
// ... etc
```

---

## Backend API Endpoints Needed

**Already exist on backend:**
- ✅ POST `/api/timeclock/save-tax-rate`
- ✅ POST `/api/timeclock/admin/add-manual-entry`
- ✅ POST `/api/timeclock/admin/edit-entry/:id`
- ✅ DELETE `/api/timeclock/admin/delete-entry/:id`
- ✅ GET `/api/timeclock/admin/entry-audit/:id`

---

## Implementation Priority

### **Phase 1: Critical (PST Timezone)**
1. Create `timezoneHelpers.js`
2. Update TimeClockScreen to use PST helpers
3. Update TimeClockCalendarScreen to group by PST date
4. Add timezone indicator to UI

### **Phase 2: This Week/Last Week**
1. Add fetchWeeklyHours function
2. Add week summary UI to TimeClockScreen
3. Add missing translation keys

### **Phase 3: Week View**
1. Add week/month toggle to TimeClockCalendarScreen
2. Implement week view rendering
3. Test navigation between views

### **Phase 4: Edit/Delete (Admin)**
1. Create TimeEntryEditScreen
2. Add audit log display
3. Integrate with calendar (tap entry to edit)
4. Add delete confirmation

### **Phase 5: Manual Entry (Admin)**
1. Create AddTimeEntryScreen
2. Add date/time pickers
3. Link from calendar view
4. Add admin-only visibility

### **Phase 6: Tax Calculator**
1. Add tax rate input to pay period card
2. Calculate and display net pay
3. Persist tax rate per employee

---

## Files to Create

1. `GCWadmin/src/utils/timezoneHelpers.js`
2. `GCWadmin/src/screens/TimeEntryEditScreen.js`
3. `GCWadmin/src/screens/AddTimeEntryScreen.js`
4. `GCWadmin/src/screens/TaxCalculatorScreen.js` (optional)

## Files to Update

1. `GCWadmin/src/screens/TimeClockScreen.js` - Add PST helpers, weekly hours
2. `GCWadmin/src/screens/TimeClockCalendarScreen.js` - Add week view, PST grouping
3. `GCWadmin/src/utils/translations.js` - Add ~56 missing keys
4. `GCWadmin/src/navigation/AppNavigator.js` - Add new screens

---

## Testing Checklist

After implementation:
- [ ] Times display in PST regardless of device timezone
- [ ] Entries group by PST date in calendar
- [ ] This Week/Last Week show correct hours
- [ ] Week view navigation works
- [ ] Can edit time entries (admin)
- [ ] Audit log shows all changes
- [ ] Can delete entries with confirmation
- [ ] Can add manual entries (admin)
- [ ] Tax calculator shows gross/net pay
- [ ] All new screens have full translations

---

## Summary

The iOS app has the core timeclock functionality but is missing:
1. **PST timezone handling** (critical for accuracy)
2. **Week view** in calendar
3. **This Week/Last Week summaries**
4. **Edit/Delete time entries** with audit trail
5. **Manual time entry** for admins
6. **Tax calculator** for net pay
7. **~56 translation keys**

The webapp TimeClockManager.js serves as the complete reference implementation.
