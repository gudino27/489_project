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
import { COLORS } from '../constants/colors';
import { ContentGlass } from '../components/GlassView';
import { useAuth } from '../contexts/AuthContext';

const TABS = [
  { id: 'settings', label: 'Settings', icon: '⚙️' },
  { id: 'recipients', label: 'Recipients', icon: '👥' },
  { id: 'history', label: 'History', icon: '📜' },
];

const MESSAGE_TYPES = [
  { value: 'design_submission', label: 'Design Submissions', description: 'New design submission notifications' },
  { value: 'test_sms', label: 'Test SMS', description: 'Test SMS messages for routing' },
];

const SmsRoutingScreen = () => {
  const { token, API_BASE, getAuthHeaders, getAuthHeadersJson } = useAuth();
  
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
        console.error('Failed to fetch SMS settings:', response.status);
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
        console.error('Failed to fetch recipients:', response.status);
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
        console.error('Failed to fetch employees:', response.status);
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
        console.error('Failed to fetch history:', response.status);
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
                <Text style={styles.testButtonText}>🧪 Test</Text>
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>SMS Recipients</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <Text style={styles.addButtonText}>{showAddForm ? '✕ Cancel' : '➕ Add Recipient'}</Text>
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
            placeholder="Recipient name"
          />

          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            value={newRecipient.phone_number}
            onChangeText={(text) => setNewRecipient({ ...newRecipient, phone_number: text })}
            placeholder="(509) 555-0100"
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
                placeholder="Name"
              />
              <TextInput
                style={styles.input}
                value={recipient.phone_number}
                onChangeText={(text) => {
                  const updated = recipients.map((r) => (r.id === recipient.id ? { ...r, phone_number: text } : r));
                  setRecipients(updated);
                }}
                placeholder="Phone"
                keyboardType="phone-pad"
              />
              <View style={styles.recipientActions}>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={() => updateRecipient(recipient.id, recipient)}
                >
                  <Text style={styles.saveButtonText}>💾 Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setEditingRecipient(null);
                    fetchRecipients();
                  }}
                >
                  <Text style={styles.cancelButtonText}>✕ Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              <View style={styles.recipientHeader}>
                <View>
                  <Text style={styles.recipientName}>{recipient.name}</Text>
                  <Text style={styles.recipientPhone}>📱 {recipient.phone_number}</Text>
                  <Text style={styles.recipientType}>Type: {MESSAGE_TYPES.find((t) => t.value === recipient.message_type)?.label}</Text>
                  <Text style={styles.recipientPriority}>Priority: {recipient.priority_order}</Text>
                </View>
              </View>
              <View style={styles.recipientActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setEditingRecipient(recipient.id)}
                >
                  <Text style={styles.editButtonText}>✏️ Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteRecipient(recipient.id)}
                >
                  <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      renderItem={({ item }) => (
        <ContentGlass style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyType}>{MESSAGE_TYPES.find((t) => t.value === item.message_type)?.label}</Text>
            <View style={[styles.historyStatus, item.status === 'success' ? styles.historyStatusSuccess : styles.historyStatusError]}>
              <Text style={styles.historyStatusText}>{item.status === 'success' ? '✓' : '✗'} {item.status}</Text>
            </View>
          </View>
          <Text style={styles.historyRecipient}>To: {item.recipient_name} ({item.phone_number})</Text>
          <Text style={styles.historyMessage}>{item.message}</Text>
          <Text style={styles.historyDate}>📅 {formatDate(item.sent_at)}</Text>
          {item.error_message && <Text style={styles.historyError}>Error: {item.error_message}</Text>}
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
        <Text style={styles.headerTitle}>💬 SMS Routing</Text>
        <Text style={styles.headerSubtitle}>Manage SMS notification routing</Text>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
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
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
  },
  tabBar: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    maxHeight: 60,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabActive: {
    backgroundColor: COLORS.primary + '20',
  },
  tabIcon: {
    fontSize: 16,
  },
  tabLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  settingsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  settingsHeaderText: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  settingsDescription: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  testButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  testButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },
  settingsRow: {
    gap: 12,
  },
  settingField: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  pickerContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
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
    fontSize: 14,
    color: COLORS.text,
  },
  statusButtonTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  modeButton: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
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
    fontSize: 12,
    color: COLORS.text,
  },
  modeButtonTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  addForm: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    marginBottom: 8,
  },
  radioGroup: {
    marginBottom: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  radioSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  radioLabel: {
    fontSize: 14,
    color: COLORS.text,
  },
  employeeSelector: {
    marginBottom: 12,
  },
  employeeOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    marginRight: 8,
  },
  employeeOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  employeeOptionText: {
    fontSize: 13,
    color: COLORS.text,
  },
  employeeOptionTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 12,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  recipientCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  recipientHeader: {
    marginBottom: 12,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  recipientPhone: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  recipientType: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  recipientPriority: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  recipientActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  editButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: COLORS.error,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.success,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  historyList: {
    padding: 16,
  },
  historyCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyType: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  historyStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  historyStatusSuccess: {
    backgroundColor: COLORS.successBg || '#d4edda',
  },
  historyStatusError: {
    backgroundColor: COLORS.errorBg || '#f8d7da',
  },
  historyStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  historyRecipient: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  historyMessage: {
    fontSize: 13,
    color: COLORS.text,
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  historyError: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textLight,
  },
});

export default SmsRoutingScreen;
