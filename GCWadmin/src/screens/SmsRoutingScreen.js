import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  FlatList,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../constants';
import {
  Settings, Users, History, Send, Phone, Plus,
  Pencil, Trash2, Check, X, RefreshCw, MessageSquare,
  ToggleLeft, ToggleRight, ChevronDown, AlertCircle,
  Clock,
} from 'lucide-react-native';
import { ContentGlass } from '../components/GlassView';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const TABS = [
  { id: 'settings', label: 'Settings', IconComponent: Settings },
  { id: 'recipients', label: 'Recipients', IconComponent: Users },
  { id: 'history', label: 'History', IconComponent: History },
];

const SmsRoutingScreen = () => {
  const { token, API_BASE, getAuthHeaders, getAuthHeadersJson } = useAuth();
  const { t } = useLanguage();

  const MESSAGE_TYPES = [
    { value: 'design_submission', label: t('smsRouting.messageTypes.designSubmissions'), description: t('smsRouting.messageTypes.designSubmissionsDesc') },
    { value: 'test_sms', label: t('smsRouting.messageTypes.testSms'), description: t('smsRouting.messageTypes.testSmsDesc') },
  ];
  
  const [activeTab, setActiveTab] = useState('settings');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data states
  const [smsSettings, setSmsSettings] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [history, setHistory] = useState([]);
  
  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState(null);
  const [newRecipient, setNewRecipient] = useState({
    message_type: 'design_submission',
    employee_id: '',
    phone_number: '',
    name: '',
    priority_order: 1,
  });

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    
    if (activeTab === 'settings') {
      fetchSmsSettings();
    } else if (activeTab === 'recipients') {
      fetchRecipients();
      fetchEmployees();
    } else if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, token]);

  const fetchData = async () => {
    if (!token) return;
    await Promise.all([
      fetchSmsSettings(),
      fetchRecipients(),
      fetchEmployees(),
      fetchHistory(),
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const fetchSmsSettings = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/api/admin/sms-routing/settings`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setSmsSettings(data);
      } else {
        console.error(t('smsRouting.errors.fetchSettings'), response.status);
      }
    } catch (error) {
      console.error('Error fetching SMS settings:', error);
    }
  };

  const fetchRecipients = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/api/admin/sms-routing/recipients`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setRecipients(data);
      } else {
        console.error(t('smsRouting.errors.fetchRecipients'), response.status);
      }
    } catch (error) {
      console.error('Error fetching recipients:', error);
    }
  };

  const fetchEmployees = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/api/employees?includeInactive=false`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      } else {
        console.error(t('smsRouting.errors.fetchEmployees'), response.status);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchHistory = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/api/admin/sms-routing/history?limit=50`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      } else {
        console.error(t('smsRouting.errors.fetchHistory'), response.status);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const updateSmsSettings = async (messageType, settings) => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/sms-routing/settings/${messageType}`, {
        method: 'PUT',
        headers: getAuthHeadersJson(),
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        Alert.alert('Success', 'Settings updated successfully');
        fetchSmsSettings();
      } else {
        Alert.alert('Error', 'Failed to update settings');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const testSmsRouting = async (messageType) => {
    Alert.alert(
      'Test SMS',
      `Send a test SMS for ${MESSAGE_TYPES.find(t => t.value === messageType)?.label}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            if (!token) return;
            setLoading(true);
            try {
              const response = await fetch(`${API_BASE}/api/admin/sms-routing/test/${messageType}`, {
                method: 'POST',
                headers: getAuthHeadersJson(),
                body: JSON.stringify({
                  message: `Test SMS routing for ${messageType} - sent at ${new Date().toLocaleTimeString()}`,
                }),
              });

              const result = await response.json();
              if (response.ok && result.success) {
                Alert.alert('Success', `Test SMS sent to ${result.details.totalSent} recipient(s)`);
                fetchHistory();
              } else {
                Alert.alert('Error', `Test failed: ${result.message || 'Unknown error'}`);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to send test SMS');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const addRecipient = async () => {
    if (!newRecipient.name || !newRecipient.phone_number) {
      Alert.alert('Error', 'Please fill in name and phone number');
      return;
    }

    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/sms-routing/recipients`, {
        method: 'POST',
        headers: getAuthHeadersJson(),
        body: JSON.stringify(newRecipient),
      });

      if (response.ok) {
        Alert.alert('Success', 'Recipient added successfully');
        setNewRecipient({
          message_type: 'design_submission',
          employee_id: '',
          phone_number: '',
          name: '',
          priority_order: 1,
        });
        setShowAddForm(false);
        fetchRecipients();
      } else {
        Alert.alert('Error', 'Failed to add recipient');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add recipient');
    } finally {
      setLoading(false);
    }
  };

  const updateRecipient = async (id, data) => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/sms-routing/recipients/${id}`, {
        method: 'PUT',
        headers: getAuthHeadersJson(),
        body: JSON.stringify(data),
      });

      if (response.ok) {
        Alert.alert('Success', 'Recipient updated successfully');
        setEditingRecipient(null);
        fetchRecipients();
      } else {
        Alert.alert('Error', 'Failed to update recipient');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update recipient');
    } finally {
      setLoading(false);
    }
  };

  const deleteRecipient = async (id) => {
    Alert.alert(
      'Delete Recipient',
      'Are you sure you want to delete this recipient?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!token) return;
            setLoading(true);
            try {
              const response = await fetch(`${API_BASE}/api/admin/sms-routing/recipients/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
              });

              if (response.ok) {
                Alert.alert('Success', 'Recipient deleted successfully');
                fetchRecipients();
              } else {
                Alert.alert('Error', 'Failed to delete recipient');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete recipient');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const renderSettingsTab = () => (
    <ScrollView
      style={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />}
    >
      <Text style={styles.sectionTitle}>SMS Settings</Text>
      {MESSAGE_TYPES.map((messageType) => {
        const settings = smsSettings.find((s) => s.message_type === messageType.value) || {
          is_enabled: true,
          routing_mode: 'single',
        };

        return (
          <ContentGlass key={messageType.value} style={styles.settingsCard}>
            <View style={styles.settingsHeader}>
              <View style={styles.settingsHeaderText}>
                <Text style={styles.settingsTitle}>{messageType.label}</Text>
                <Text style={styles.settingsDescription}>{messageType.description}</Text>
              </View>
              <TouchableOpacity
                style={styles.testButton}
                onPress={() => testSmsRouting(messageType.value)}
                disabled={loading}
              >
                <Send size={14} color={COLORS.white} />
                <Text style={styles.testButtonText}>Test</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.settingsRow}>
              <View style={styles.settingField}>
                <Text style={styles.fieldLabel}>Status</Text>
                <View style={styles.pickerContainer}>
                  <TouchableOpacity
                    style={[styles.statusButton, settings.is_enabled && styles.statusButtonActive]}
                    onPress={() => updateSmsSettings(messageType.value, { ...settings, is_enabled: true })}
                  >
                    <Text style={[styles.statusButtonText, settings.is_enabled && styles.statusButtonTextActive]}>
                      Enabled
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.statusButton, !settings.is_enabled && styles.statusButtonActive]}
                    onPress={() => updateSmsSettings(messageType.value, { ...settings, is_enabled: false })}
                  >
                    <Text style={[styles.statusButtonText, !settings.is_enabled && styles.statusButtonTextActive]}>
                      Disabled
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.settingField}>
                <Text style={styles.fieldLabel}>Routing Mode</Text>
                <View style={styles.pickerContainer}>
                  {['single', 'all', 'rotation'].map((mode) => (
                    <TouchableOpacity
                      key={mode}
                      style={[styles.modeButton, settings.routing_mode === mode && styles.modeButtonActive]}
                      onPress={() => updateSmsSettings(messageType.value, { ...settings, routing_mode: mode })}
                    >
                      <Text style={[styles.modeButtonText, settings.routing_mode === mode && styles.modeButtonTextActive]}>
                        {mode === 'single' ? 'Single' : mode === 'all' ? 'All' : 'Rotation'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </ContentGlass>
        );
      })}
    </ScrollView>
  );

  const renderRecipientsTab = () => (
    <ScrollView
      style={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>SMS Recipients</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? (
            <>
              <X size={14} color={COLORS.white} />
              <Text style={styles.addButtonText}>Cancel</Text>
            </>
          ) : (
            <>
              <Plus size={14} color={COLORS.white} />
              <Text style={styles.addButtonText}>Add Recipient</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {showAddForm && (
        <ContentGlass style={styles.addForm}>
          <Text style={styles.formTitle}>Add New Recipient</Text>
          
          <Text style={styles.label}>Message Type</Text>
          <View style={styles.radioGroup}>
            {MESSAGE_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={styles.radioOption}
                onPress={() => setNewRecipient({ ...newRecipient, message_type: type.value })}
              >
                <View style={[styles.radio, newRecipient.message_type === type.value && styles.radioSelected]} />
                <Text style={styles.radioLabel}>{type.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Employee (Optional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.employeeSelector}>
            {employees.map((emp) => (
              <TouchableOpacity
                key={emp.id}
                style={[styles.employeeOption, newRecipient.employee_id === String(emp.id) && styles.employeeOptionSelected]}
                onPress={() => {
                  setNewRecipient({
                    ...newRecipient,
                    employee_id: String(emp.id),
                    name: emp.name,
                    phone_number: emp.phone || newRecipient.phone_number,
                  });
                }}
              >
                <Text style={[styles.employeeOptionText, newRecipient.employee_id === String(emp.id) && styles.employeeOptionTextSelected]}>
                  {emp.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={newRecipient.name}
            onChangeText={(text) => setNewRecipient({ ...newRecipient, name: text })}
            placeholder={t('smsRouting.placeholders.recipientName')}
          />

          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            value={newRecipient.phone_number}
            onChangeText={(text) => setNewRecipient({ ...newRecipient, phone_number: text })}
            placeholder={t('smsRouting.placeholders.phone')}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Priority Order</Text>
          <TextInput
            style={styles.input}
            value={String(newRecipient.priority_order)}
            onChangeText={(text) => setNewRecipient({ ...newRecipient, priority_order: parseInt(text) || 1 })}
            keyboardType="number-pad"
          />

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={addRecipient}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitButtonText}>Add Recipient</Text>
            )}
          </TouchableOpacity>
        </ContentGlass>
      )}

      {recipients.map((recipient) => (
        <ContentGlass key={recipient.id} style={styles.recipientCard}>
          {editingRecipient === recipient.id ? (
            <View>
              <TextInput
                style={styles.input}
                value={recipient.name}
                onChangeText={(text) => {
                  const updated = recipients.map((r) => (r.id === recipient.id ? { ...r, name: text } : r));
                  setRecipients(updated);
                }}
                placeholder={t('smsRouting.placeholders.name')}
              />
              <TextInput
                style={styles.input}
                value={recipient.phone_number}
                onChangeText={(text) => {
                  const updated = recipients.map((r) => (r.id === recipient.id ? { ...r, phone_number: text } : r));
                  setRecipients(updated);
                }}
                placeholder={t('smsRouting.placeholders.phoneShort')}
                keyboardType="phone-pad"
              />
              <View style={styles.recipientActions}>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={() => updateRecipient(recipient.id, recipient)}
                >
                  <Check size={14} color={COLORS.white} />
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setEditingRecipient(null);
                    fetchRecipients();
                  }}
                >
                  <X size={14} color={COLORS.text} />
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              <View style={styles.recipientHeader}>
                <View>
                  <Text style={styles.recipientName}>{recipient.name}</Text>
                  <View style={styles.recipientPhoneRow}>
                    <Phone size={14} color={COLORS.textLight} />
                    <Text style={styles.recipientPhone}>{recipient.phone_number}</Text>
                  </View>
                  <Text style={styles.recipientType}>Type: {MESSAGE_TYPES.find((t) => t.value === recipient.message_type)?.label}</Text>
                  <Text style={styles.recipientPriority}>Priority: {recipient.priority_order}</Text>
                </View>
              </View>
              <View style={styles.recipientActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setEditingRecipient(recipient.id)}
                >
                  <Pencil size={14} color={COLORS.white} />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteRecipient(recipient.id)}
                >
                  <Trash2 size={14} color={COLORS.white} />
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ContentGlass>
      ))}
    </ScrollView>
  );

  const renderHistoryTab = () => (
    <FlatList
      data={history}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />}
      renderItem={({ item }) => (
        <ContentGlass style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyType}>{MESSAGE_TYPES.find((t) => t.value === item.message_type)?.label}</Text>
            <View style={[styles.historyStatus, item.status === 'success' ? styles.historyStatusSuccess : styles.historyStatusError]}>
              {item.status === 'success' ? (
                <Check size={12} color={COLORS.success} />
              ) : (
                <X size={12} color={COLORS.error} />
              )}
              <Text style={[styles.historyStatusText, item.status === 'success' ? styles.historyStatusTextSuccess : styles.historyStatusTextError]}>
                {item.status}
              </Text>
            </View>
          </View>
          <Text style={styles.historyRecipient}>To: {item.recipient_name} ({item.phone_number})</Text>
          <Text style={styles.historyMessage}>{item.message}</Text>
          <View style={styles.historyDateRow}>
            <Clock size={12} color={COLORS.textLight} />
            <Text style={styles.historyDate}>{formatDate(item.sent_at)}</Text>
          </View>
          {item.error_message && (
            <View style={styles.historyErrorRow}>
              <AlertCircle size={12} color={COLORS.error} />
              <Text style={styles.historyError}>Error: {item.error_message}</Text>
            </View>
          )}
        </ContentGlass>
      )}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No SMS history found</Text>
        </View>
      }
      contentContainerStyle={styles.historyList}
    />
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'settings':
        return renderSettingsTab();
      case 'recipients':
        return renderRecipientsTab();
      case 'history':
        return renderHistoryTab();
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <MessageSquare size={24} color={COLORS.primary} />
          <Text style={styles.headerTitle}>SMS Routing</Text>
        </View>
        <Text style={styles.headerSubtitle}>Manage SMS notification routing</Text>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        {TABS.map((tab) => {
          const IconComponent = tab.IconComponent;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <IconComponent size={16} color={activeTab === tab.id ? COLORS.primary : COLORS.textLight} />
              <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Content */}
      {renderTabContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING[4],
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  headerTitle: {
    fontSize: TYPOGRAPHY['2xl'],
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
    marginTop: SPACING[1],
  },
  tabBar: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    maxHeight: 60,
  },
  tab: {
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
    marginHorizontal: SPACING[1],
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  tabActive: {
    backgroundColor: COLORS.primary + '20',
  },
  tabLabel: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
    fontWeight: TYPOGRAPHY.medium,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.bold,
  },
  tabContent: {
    flex: 1,
    padding: SPACING[4],
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
    marginBottom: SPACING[3],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING[3],
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
  },
  settingsCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING[4],
    marginBottom: SPACING[3],
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING[4],
  },
  settingsHeaderText: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
    marginBottom: SPACING[1],
  },
  settingsDescription: {
    fontSize: TYPOGRAPHY.xs + 1,
    color: COLORS.textLight,
  },
  testButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
  },
  testButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.xs + 1,
    fontWeight: TYPOGRAPHY.semibold,
  },
  settingsRow: {
    gap: SPACING[3],
  },
  settingField: {
    marginBottom: SPACING[3],
  },
  fieldLabel: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
    marginBottom: SPACING[2],
  },
  pickerContainer: {
    flexDirection: 'row',
    gap: SPACING[2],
  },
  statusButton: {
    flex: 1,
    padding: SPACING[3],
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  statusButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  statusButtonText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.text,
  },
  statusButtonTextActive: {
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.semibold,
  },
  modeButton: {
    flex: 1,
    padding: SPACING[2] + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  modeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  modeButtonText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.text,
  },
  modeButtonTextActive: {
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.semibold,
  },
  addForm: {
    borderRadius: RADIUS.xl,
    padding: SPACING[4],
    marginBottom: SPACING[4],
  },
  formTitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
    marginBottom: SPACING[4],
  },
  label: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
    marginBottom: SPACING[2],
    marginTop: SPACING[2],
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING[3],
    fontSize: TYPOGRAPHY.sm,
    marginBottom: SPACING[2],
  },
  radioGroup: {
    marginBottom: SPACING[3],
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING[2],
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginRight: SPACING[2],
  },
  radioSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  radioLabel: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.text,
  },
  employeeSelector: {
    marginBottom: SPACING[3],
  },
  employeeOption: {
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    marginRight: SPACING[2],
  },
  employeeOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  employeeOptionText: {
    fontSize: TYPOGRAPHY.xs + 1,
    color: COLORS.text,
  },
  employeeOptionTextSelected: {
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.semibold,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING[3] + 2,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING[3],
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
  },
  recipientCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING[4],
    marginBottom: SPACING[3],
  },
  recipientHeader: {
    marginBottom: SPACING[3],
  },
  recipientName: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
    marginBottom: SPACING[1],
  },
  recipientPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
    marginBottom: SPACING[1],
  },
  recipientPhone: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
  },
  recipientType: {
    fontSize: TYPOGRAPHY.xs + 1,
    color: COLORS.textLight,
    marginBottom: SPACING[1],
  },
  recipientPriority: {
    fontSize: TYPOGRAPHY.xs + 1,
    color: COLORS.textLight,
  },
  recipientActions: {
    flexDirection: 'row',
    gap: SPACING[2],
  },
  editButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: SPACING[2] + 2,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[1],
  },
  editButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: COLORS.error,
    padding: SPACING[2] + 2,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[1],
  },
  deleteButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.success,
    padding: SPACING[2] + 2,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[1],
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    padding: SPACING[2] + 2,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[1],
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
  },
  historyList: {
    padding: SPACING[4],
  },
  historyCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING[4],
    marginBottom: SPACING[3],
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING[2],
  },
  historyType: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
  },
  historyStatus: {
    paddingHorizontal: SPACING[2],
    paddingVertical: SPACING[1],
    borderRadius: RADIUS.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
  },
  historyStatusSuccess: {
    backgroundColor: COLORS.successBg || '#d4edda',
  },
  historyStatusError: {
    backgroundColor: COLORS.errorBg || '#f8d7da',
  },
  historyStatusText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semibold,
  },
  historyStatusTextSuccess: {
    color: COLORS.success,
  },
  historyStatusTextError: {
    color: COLORS.error,
  },
  historyRecipient: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
    marginBottom: SPACING[1],
  },
  historyMessage: {
    fontSize: TYPOGRAPHY.xs + 1,
    color: COLORS.text,
    marginBottom: SPACING[1],
  },
  historyDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
  },
  historyDate: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textLight,
  },
  historyErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
    marginTop: SPACING[1],
  },
  historyError: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.error,
  },
  emptyState: {
    padding: SPACING[8],
    alignItems: 'center',
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
  },
});

export default SmsRoutingScreen;
