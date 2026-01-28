import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  FlatList,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import {
  Calendar,
  Clock,
  CheckCircle,
  Circle,
  PlayCircle,
  Edit,
  Trash2,
  Send,
  Mail,
  MessageSquare,
  Plus,
  X,
  ChevronLeft,
} from 'lucide-react-native';
import { ContentGlass } from '../components/GlassView';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import * as timelinesApi from '../api/timelines';

const TABS = [
  { id: 'list', label: 'Timelines', IconComponent: Calendar },
  { id: 'create', label: 'Create', IconComponent: Plus },
];

const ProjectTimelineScreen = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('list');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timelines, setTimelines] = useState([]);
  const [selectedTimeline, setSelectedTimeline] = useState(null);
  const [createMode, setCreateMode] = useState('invoice');
  const [invoices, setInvoices] = useState([]);
  const [showSendLinkModal, setShowSendLinkModal] = useState(false);
  const [editingPhase, setEditingPhase] = useState(null);

  // Form data for creating timeline
  const [createFormData, setCreateFormData] = useState({
    invoice_id: '',
    client_name: '',
    client_email: '',
    client_phone: '',
    client_language: 'en',
  });

  // Form data for editing phase
  const [phaseFormData, setPhaseFormData] = useState({
    status: '',
    estimated_completion: '',
    notes: '',
  });

  useEffect(() => {
    if (token) {
      loadTimelines();
      loadInvoices();
    }
  }, [token]);

  const loadTimelines = async () => {
    try {
      setLoading(true);
      const data = await timelinesApi.getTimelines();
      setTimelines(data);
    } catch (error) {
      console.error('Failed to load timelines:', error);
      Alert.alert('Error', 'Failed to load timelines');
    } finally {
      setLoading(false);
    }
  };

  const loadInvoices = async () => {
    try {
      const data = await timelinesApi.getInvoices();
      setInvoices(data);
    } catch (error) {
      console.error('Failed to load invoices:', error);
    }
  };

  const loadTimelineDetails = async (timelineIdOrInvoiceId, isInvoiceBased = true) => {
    try {
      setLoading(true);
      const data = isInvoiceBased
        ? await timelinesApi.getTimelineByInvoiceId(timelineIdOrInvoiceId)
        : await timelinesApi.getTimelineById(timelineIdOrInvoiceId);
      setSelectedTimeline(data);
    } catch (error) {
      console.error('Failed to load timeline details:', error);
      Alert.alert('Error', 'Failed to load timeline details');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTimeline = async () => {
    try {
      setLoading(true);
      if (createMode === 'invoice') {
        if (!createFormData.invoice_id) {
          Alert.alert('Error', 'Please select an invoice');
          return;
        }
        await timelinesApi.createTimeline(
          parseInt(createFormData.invoice_id),
          createFormData.client_language
        );
      } else {
        if (!createFormData.client_name || !createFormData.client_email) {
          Alert.alert('Error', 'Please fill in required fields');
          return;
        }
        const result = await timelinesApi.createStandaloneTimeline(
          createFormData.client_name,
          createFormData.client_email,
          createFormData.client_phone,
          createFormData.client_language
        );

        // Load the newly created timeline
        if (result.timeline) {
          await loadTimelineDetails(result.timeline.id, false);
        }
      }

      await loadTimelines();
      setActiveTab('list');
      setCreateFormData({
        invoice_id: '',
        client_name: '',
        client_email: '',
        client_phone: '',
        client_language: 'en',
      });
      Alert.alert('Success', 'Timeline created successfully!');
    } catch (error) {
      console.error('Failed to create timeline:', error);
      Alert.alert('Error', 'Failed to create timeline');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePhase = async () => {
    if (!editingPhase) return;

    try {
      setLoading(true);
      await timelinesApi.updatePhase(editingPhase.id, phaseFormData);

      // Reload timeline details
      if (selectedTimeline) {
        const isInvoiceBased = !!selectedTimeline.invoice_id;
        await loadTimelineDetails(
          isInvoiceBased ? selectedTimeline.invoice_id : selectedTimeline.id,
          isInvoiceBased
        );
      }

      setEditingPhase(null);
      Alert.alert('Success', 'Phase updated successfully!');
    } catch (error) {
      console.error('Failed to update phase:', error);
      Alert.alert('Error', 'Failed to update phase');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTimeline = async (timelineId) => {
    Alert.alert(
      'Delete Timeline',
      'Are you sure you want to delete this timeline?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await timelinesApi.deleteTimeline(timelineId);
              await loadTimelines();
              setSelectedTimeline(null);
              Alert.alert('Success', 'Timeline deleted successfully!');
            } catch (error) {
              console.error('Failed to delete timeline:', error);
              Alert.alert('Error', 'Failed to delete timeline');
            }
          },
        },
      ]
    );
  };

  const handleSendLink = async (method) => {
    if (!selectedTimeline) return;

    try {
      setLoading(true);
      const result = await timelinesApi.sendTimelineLink(selectedTimeline.id, method);

      let message = '';
      if (method === 'email' && result.results.email === 'sent') {
        message = 'Email sent successfully!';
      } else if (method === 'sms' && result.results.sms === 'sent') {
        message = 'SMS sent successfully!';
      } else if (method === 'both') {
        const emailStatus = result.results.email === 'sent' ? '✓ Email' :
                           result.results.email === 'no_email' ? '⚠ No email address' :
                           '✗ Email failed';
        const smsStatus = result.results.sms === 'sent' ? '✓ SMS' :
                         result.results.sms === 'no_phone' ? '⚠ No phone number' :
                         '✗ SMS failed';
        message = `${emailStatus}\n${smsStatus}`;
      }

      Alert.alert('Link Sent', message || 'Link sent!');
      setShowSendLinkModal(false);
    } catch (error) {
      console.error('Failed to send link:', error);
      Alert.alert('Error', 'Failed to send timeline link');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLanguage = async (newLanguage) => {
    if (!selectedTimeline) return;

    try {
      await timelinesApi.updateTimeline(selectedTimeline.id, {
        client_language: newLanguage,
      });

      setSelectedTimeline(prev => ({
        ...prev,
        client_language: newLanguage,
      }));

      await loadTimelines();
      Alert.alert('Success', `Language updated to ${newLanguage === 'es' ? 'Español' : 'English'}`);
    } catch (error) {
      console.error('Failed to update language:', error);
      Alert.alert('Error', 'Failed to update language');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTimelines();
    setRefreshing(false);
  };

  const getPhaseLabel = (phaseKey) => {
    const labels = {
      design: 'Design',
      materials: 'Materials Ordered',
      fabrication: 'Fabrication',
      installation: 'Installation',
      completion: 'Completion',
    };
    return labels[phaseKey] || phaseKey;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: { bg: COLORS.warningBg, text: COLORS.warning, border: COLORS.warningBorder },
      in_progress: { bg: COLORS.infoBg || '#EFF6FF', text: COLORS.info, border: '#BFDBFE' },
      completed: { bg: COLORS.successBg, text: COLORS.success, border: COLORS.successBorder },
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: Circle,
      in_progress: PlayCircle,
      completed: CheckCircle,
    };
    return icons[status] || Circle;
  };

  const renderTimelineCard = ({ item }) => {
    const isInvoiceBased = !!item.invoice_id;
    const displayName = item.client_name || 'Unknown Client';
    const displaySubtitle = isInvoiceBased
      ? `Invoice #${item.invoice_number}`
      : item.client_email || 'Standalone Project';
    const isSelected = selectedTimeline?.id === item.id;

    return (
      <TouchableOpacity
        onPress={() => loadTimelineDetails(isInvoiceBased ? item.invoice_id : item.id, isInvoiceBased)}
        style={[
          styles.timelineCard,
          isSelected && styles.timelineCardSelected,
        ]}
      >
        <View style={styles.timelineCardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.timelineCardTitle}>{displayName}</Text>
            <Text style={styles.timelineCardSubtitle}>{displaySubtitle}</Text>
          </View>
          <View style={styles.timelineCardBadges}>
            {!isInvoiceBased && (
              <View style={styles.standaloneBadge}>
                <Text style={styles.standaloneBadgeText}>Standalone</Text>
              </View>
            )}
            <View style={styles.languageBadge}>
              <Text style={styles.languageBadgeText}>
                {item.client_language === 'es' ? 'ES' : 'EN'}
              </Text>
            </View>
          </View>
        </View>
        <Text style={styles.timelineCardDate}>
          Created {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderPhaseCard = ({ item: phase }) => {
    const isEditing = editingPhase?.id === phase.id;
    const statusColors = getStatusColor(phase.status);
    const StatusIcon = getStatusIcon(phase.status);

    if (isEditing) {
      return (
        <ContentGlass intensity="light" style={styles.phaseCardEditing}>
          <Text style={styles.phaseEditTitle}>
            Edit: {getPhaseLabel(phase.phase_name_key)}
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Status</Text>
            <View style={styles.pickerContainer}>
              <TouchableOpacity
                style={[styles.statusButton, phaseFormData.status === 'pending' && styles.statusButtonActive]}
                onPress={() => setPhaseFormData({ ...phaseFormData, status: 'pending' })}
              >
                <Text style={styles.statusButtonText}>Pending</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusButton, phaseFormData.status === 'in_progress' && styles.statusButtonActive]}
                onPress={() => setPhaseFormData({ ...phaseFormData, status: 'in_progress' })}
              >
                <Text style={styles.statusButtonText}>In Progress</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusButton, phaseFormData.status === 'completed' && styles.statusButtonActive]}
                onPress={() => setPhaseFormData({ ...phaseFormData, status: 'completed' })}
              >
                <Text style={styles.statusButtonText}>Completed</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Estimated Completion</Text>
            <TextInput
              style={styles.input}
              value={phaseFormData.estimated_completion}
              onChangeText={(text) => setPhaseFormData({ ...phaseFormData, estimated_completion: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={phaseFormData.notes}
              onChangeText={(text) => setPhaseFormData({ ...phaseFormData, notes: text })}
              placeholder="Add notes about this phase..."
              placeholderTextColor={COLORS.textLight}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setEditingPhase(null)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleUpdatePhase}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </ContentGlass>
      );
    }

    return (
      <ContentGlass intensity="light" style={styles.phaseCard}>
        <View style={styles.phaseCardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.phaseCardTitle}>
              {getPhaseLabel(phase.phase_name_key)}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColors.bg, borderColor: statusColors.border }]}>
              <StatusIcon size={14} color={statusColors.text} />
              <Text style={[styles.statusBadgeText, { color: statusColors.text }]}>
                {phase.status.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              setEditingPhase(phase);
              setPhaseFormData({
                status: phase.status,
                estimated_completion: phase.estimated_completion || '',
                notes: phase.notes || '',
              });
            }}
          >
            <Edit size={18} color={COLORS.textMedium} />
          </TouchableOpacity>
        </View>

        {phase.estimated_completion && (
          <Text style={styles.phaseDetail}>
            <Text style={styles.phaseDetailLabel}>Est. Completion: </Text>
            {new Date(phase.estimated_completion).toLocaleDateString()}
          </Text>
        )}

        {phase.actual_completion && (
          <Text style={[styles.phaseDetail, { color: COLORS.success }]}>
            <Text style={styles.phaseDetailLabel}>Completed: </Text>
            {new Date(phase.actual_completion).toLocaleDateString()}
          </Text>
        )}

        {phase.notes && (
          <View style={styles.phaseNotes}>
            <Text style={styles.phaseNotesText}>{phase.notes}</Text>
          </View>
        )}
      </ContentGlass>
    );
  };

  const renderTimelineList = () => {
    if (loading && timelines.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading timelines...</Text>
        </View>
      );
    }

    if (timelines.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Calendar size={48} color={COLORS.textLight} />
          <Text style={styles.emptyText}>No timelines yet</Text>
          <Text style={styles.emptySubtext}>Create one to get started</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={timelines}
        renderItem={renderTimelineCard}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={styles.listContent}
      />
    );
  };

  const renderTimelineDetails = () => {
    if (!selectedTimeline) {
      return (
        <View style={styles.emptyContainer}>
          <Calendar size={48} color={COLORS.textLight} />
          <Text style={styles.emptyText}>Select a timeline</Text>
          <Text style={styles.emptySubtext}>Choose a timeline from the list to view details</Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.detailsContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setSelectedTimeline(null)}
        >
          <ChevronLeft size={24} color={COLORS.text} />
          <Text style={styles.backButtonText}>Back to List</Text>
        </TouchableOpacity>

        {/* Client Info Card */}
        <ContentGlass intensity="medium" style={styles.clientCard}>
          <View style={styles.clientHeader}>
            <View style={styles.clientAvatar}>
              <Text style={styles.clientAvatarText}>
                {selectedTimeline.client_name?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.clientName}>{selectedTimeline.client_name}</Text>
              <Text style={styles.clientSubtitle}>
                {selectedTimeline.invoice_number
                  ? `Invoice #${selectedTimeline.invoice_number}`
                  : selectedTimeline.client_email}
              </Text>
            </View>
          </View>

          <View style={styles.clientActions}>
            <View style={styles.languageSelector}>
              <TouchableOpacity
                style={[
                  styles.languageButton,
                  selectedTimeline.client_language === 'en' && styles.languageButtonActive,
                ]}
                onPress={() => handleUpdateLanguage('en')}
              >
                <Text style={styles.languageButtonText}>🇺🇸 EN</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.languageButton,
                  selectedTimeline.client_language === 'es' && styles.languageButtonActive,
                ]}
                onPress={() => handleUpdateLanguage('es')}
              >
                <Text style={styles.languageButtonText}>🇲🇽 ES</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.sendLinkButton}
              onPress={() => setShowSendLinkModal(true)}
            >
              <Send size={16} color={COLORS.white} />
              <Text style={styles.sendLinkButtonText}>Send Link</Text>
            </TouchableOpacity>
          </View>

          {(selectedTimeline.client_email || selectedTimeline.client_phone) && (
            <View style={styles.clientInfo}>
              {selectedTimeline.client_email && (
                <View style={styles.clientInfoRow}>
                  <Text style={styles.clientInfoLabel}>Email</Text>
                  <Text style={styles.clientInfoValue}>{selectedTimeline.client_email}</Text>
                </View>
              )}
              {selectedTimeline.client_phone && (
                <View style={styles.clientInfoRow}>
                  <Text style={styles.clientInfoLabel}>Phone</Text>
                  <Text style={styles.clientInfoValue}>{selectedTimeline.client_phone}</Text>
                </View>
              )}
            </View>
          )}
        </ContentGlass>

        {/* Delete Button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteTimeline(selectedTimeline.id)}
        >
          <Trash2 size={16} color={COLORS.error} />
          <Text style={styles.deleteButtonText}>Delete Timeline</Text>
        </TouchableOpacity>

        {/* Phases Section */}
        <Text style={styles.sectionTitle}>Project Phases</Text>
        {selectedTimeline.phases && selectedTimeline.phases.length > 0 ? (
          selectedTimeline.phases.map((phase) => (
            <View key={phase.id}>{renderPhaseCard({ item: phase })}</View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Clock size={32} color={COLORS.textLight} />
            <Text style={styles.emptyText}>No phases yet</Text>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderCreateForm = () => {
    const availableInvoices = invoices.filter(inv => !inv.has_timeline);

    return (
      <ScrollView
        style={styles.createContainer}
        contentContainerStyle={styles.createContent}
      >
        <Text style={styles.createTitle}>Create Project Timeline</Text>

        {/* Mode Toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              createMode === 'invoice' && styles.modeButtonActive,
            ]}
            onPress={() => setCreateMode('invoice')}
          >
            <Text
              style={[
                styles.modeButtonText,
                createMode === 'invoice' && styles.modeButtonTextActive,
              ]}
            >
              With Invoice
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeButton,
              createMode === 'standalone' && styles.modeButtonActive,
            ]}
            onPress={() => setCreateMode('standalone')}
          >
            <Text
              style={[
                styles.modeButtonText,
                createMode === 'standalone' && styles.modeButtonTextActive,
              ]}
            >
              Standalone
            </Text>
          </TouchableOpacity>
        </View>

        {/* Invoice-based Form */}
        {createMode === 'invoice' && (
          <View>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Select Invoice *</Text>
              <ScrollView horizontal style={styles.invoicePicker}>
                {availableInvoices.map((invoice) => (
                  <TouchableOpacity
                    key={invoice.id}
                    style={[
                      styles.invoiceCard,
                      createFormData.invoice_id === invoice.id.toString() && styles.invoiceCardSelected,
                    ]}
                    onPress={() => setCreateFormData({ ...createFormData, invoice_id: invoice.id.toString() })}
                  >
                    <Text style={styles.invoiceCardNumber}>#{invoice.invoice_number}</Text>
                    <Text style={styles.invoiceCardClient}>{invoice.client_name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Client Language</Text>
              <View style={styles.languageSelector}>
                <TouchableOpacity
                  style={[
                    styles.languageButton,
                    createFormData.client_language === 'en' && styles.languageButtonActive,
                  ]}
                  onPress={() => setCreateFormData({ ...createFormData, client_language: 'en' })}
                >
                  <Text style={styles.languageButtonText}>🇺🇸 English</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.languageButton,
                    createFormData.client_language === 'es' && styles.languageButtonActive,
                  ]}
                  onPress={() => setCreateFormData({ ...createFormData, client_language: 'es' })}
                >
                  <Text style={styles.languageButtonText}>🇲🇽 Español</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Standalone Form */}
        {createMode === 'standalone' && (
          <View>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Client Name *</Text>
              <TextInput
                style={styles.input}
                value={createFormData.client_name}
                onChangeText={(text) => setCreateFormData({ ...createFormData, client_name: text })}
                placeholder="John Doe"
                placeholderTextColor={COLORS.textLight}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Client Email *</Text>
              <TextInput
                style={styles.input}
                value={createFormData.client_email}
                onChangeText={(text) => setCreateFormData({ ...createFormData, client_email: text })}
                placeholder="john@example.com"
                placeholderTextColor={COLORS.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Client Phone (optional)</Text>
              <TextInput
                style={styles.input}
                value={createFormData.client_phone}
                onChangeText={(text) => setCreateFormData({ ...createFormData, client_phone: text })}
                placeholder="+1 (555) 123-4567"
                placeholderTextColor={COLORS.textLight}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Client Language</Text>
              <View style={styles.languageSelector}>
                <TouchableOpacity
                  style={[
                    styles.languageButton,
                    createFormData.client_language === 'en' && styles.languageButtonActive,
                  ]}
                  onPress={() => setCreateFormData({ ...createFormData, client_language: 'en' })}
                >
                  <Text style={styles.languageButtonText}>🇺🇸 English</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.languageButton,
                    createFormData.client_language === 'es' && styles.languageButtonActive,
                  ]}
                  onPress={() => setCreateFormData({ ...createFormData, client_language: 'es' })}
                >
                  <Text style={styles.languageButtonText}>🇲🇽 Español</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreateTimeline}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <Text style={styles.createButtonText}>Create Timeline</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Project Timelines</Text>
        <Text style={styles.headerSubtitle}>Manage project progress and client updates</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'list' && (
          selectedTimeline ? renderTimelineDetails() : renderTimelineList()
        )}
        {activeTab === 'create' && renderCreateForm()}
      </View>

      {/* Send Link Modal */}
      <Modal
        visible={showSendLinkModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSendLinkModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Timeline Link</Text>
              <TouchableOpacity onPress={() => setShowSendLinkModal(false)}>
                <X size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Choose how to send the project timeline link to {selectedTimeline?.client_name}
            </Text>

            <View style={styles.sendOptions}>
              {selectedTimeline?.client_email && (
                <TouchableOpacity
                  style={styles.sendOption}
                  onPress={() => handleSendLink('email')}
                >
                  <View style={[styles.sendOptionIcon, { backgroundColor: '#DBEAFE' }]}>
                    <Mail size={24} color={COLORS.blue} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sendOptionTitle}>Email</Text>
                    <Text style={styles.sendOptionSubtitle}>{selectedTimeline.client_email}</Text>
                  </View>
                </TouchableOpacity>
              )}

              {selectedTimeline?.client_phone && (
                <TouchableOpacity
                  style={styles.sendOption}
                  onPress={() => handleSendLink('sms')}
                >
                  <View style={[styles.sendOptionIcon, { backgroundColor: '#D1FAE5' }]}>
                    <MessageSquare size={24} color={COLORS.success} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sendOptionTitle}>Text Message</Text>
                    <Text style={styles.sendOptionSubtitle}>{selectedTimeline.client_phone}</Text>
                  </View>
                </TouchableOpacity>
              )}

              {selectedTimeline?.client_email && selectedTimeline?.client_phone && (
                <TouchableOpacity
                  style={styles.sendOption}
                  onPress={() => handleSendLink('both')}
                >
                  <View style={[styles.sendOptionIcon, { backgroundColor: '#EDE9FE' }]}>
                    <Send size={24} color="#8B5CF6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sendOptionTitle}>Email & SMS</Text>
                    <Text style={styles.sendOptionSubtitle}>Send via both methods</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowSendLinkModal(false)}
            >
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs / 2,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textGray,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.md,
  },
  tab: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.blue,
  },
  tabText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.textGray,
  },
  tabTextActive: {
    color: COLORS.blue,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.base,
    color: COLORS.textGray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
  },
  emptySubtext: {
    marginTop: SPACING.xs,
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textGray,
  },
  listContent: {
    padding: SPACING.sm,
  },
  timelineCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  timelineCardSelected: {
    borderColor: COLORS.blue,
  },
  timelineCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  timelineCardTitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  timelineCardSubtitle: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textGray,
  },
  timelineCardBadges: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  standaloneBadge: {
    backgroundColor: '#DBEAFE',
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
  },
  standaloneBadgeText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.medium,
    color: '#1E40AF',
  },
  languageBadge: {
    backgroundColor: COLORS.gray200,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
  },
  languageBadgeText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.text,
  },
  timelineCardDate: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textLight,
  },
  detailsContainer: {
    flex: 1,
    padding: SPACING.sm,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    padding: SPACING.sm,
  },
  backButtonText: {
    marginLeft: SPACING.xs,
    fontSize: TYPOGRAPHY.base,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.medium,
  },
  clientCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientAvatarText: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.white,
  },
  clientName: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
  },
  clientSubtitle: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textGray,
    marginTop: SPACING.xs / 2,
  },
  clientActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  languageSelector: {
    flexDirection: 'row',
    gap: SPACING.xs,
    flex: 1,
  },
  languageButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  languageButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: COLORS.blue,
  },
  languageButtonText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.text,
  },
  sendLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.blue,
  },
  sendLinkButtonText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.white,
  },
  clientInfo: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
  },
  clientInfoRow: {
    marginBottom: SPACING.sm,
  },
  clientInfoLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textGray,
    marginBottom: SPACING.xs / 2,
  },
  clientInfoValue: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.text,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.errorBg,
    marginBottom: SPACING.lg,
  },
  deleteButtonText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.error,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  phaseCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
  },
  phaseCardEditing: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.blue,
  },
  phaseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  phaseCardTitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.medium,
  },
  editButton: {
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.gray100,
  },
  phaseDetail: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textGray,
    marginBottom: SPACING.xs,
  },
  phaseDetailLabel: {
    fontWeight: TYPOGRAPHY.semibold,
  },
  phaseNotes: {
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.gray50,
    borderRadius: RADIUS.sm,
  },
  phaseNotesText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textMedium,
  },
  phaseEditTitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  formGroup: {
    marginBottom: SPACING.md,
  },
  formLabel: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    fontSize: TYPOGRAPHY.base,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  statusButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: COLORS.blue,
  },
  statusButtonText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.text,
  },
  formActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.gray200,
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.text,
  },
  saveButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.blue,
  },
  saveButtonText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.white,
  },
  createContainer: {
    flex: 1,
  },
  createContent: {
    padding: SPACING.sm,
  },
  createTitle: {
    fontSize: TYPOGRAPHY['2xl'],
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  modeToggle: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  modeButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: COLORS.blue,
    borderWidth: 2,
  },
  modeButtonText: {
    fontSize: TYPOGRAPHY.base,
    color: COLORS.textGray,
  },
  modeButtonTextActive: {
    color: COLORS.blue,
    fontWeight: TYPOGRAPHY.semibold,
  },
  invoicePicker: {
    flexDirection: 'row',
  },
  invoiceCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    marginRight: SPACING.sm,
    minWidth: 120,
  },
  invoiceCardSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: COLORS.blue,
    borderWidth: 2,
  },
  invoiceCardNumber: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs / 2,
  },
  invoiceCardClient: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textGray,
  },
  createButton: {
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  createButtonDisabled: {
    backgroundColor: COLORS.gray400,
  },
  createButtonText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
  },
  modalSubtitle: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textGray,
    marginBottom: SPACING.lg,
  },
  sendOptions: {
    gap: SPACING.md,
  },
  sendOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  sendOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendOptionTitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
  },
  sendOptionSubtitle: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textGray,
    marginTop: SPACING.xs / 2,
  },
  modalCancelButton: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.gray200,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.text,
  },
});

export default ProjectTimelineScreen;
