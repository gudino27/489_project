import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  FileText,
  Eye,
  Edit,
  Send,
  Download,
  Plus,
  Search,
  X,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  Bell,
  Trash2,
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import * as invoiceAPI from '../api/invoices';
import { COLORS } from '../constants/colors';
import { SPACING } from '../constants/spacing';
import { TYPOGRAPHY } from '../constants/typography';
import { ContentGlass, TabGlass } from '../components/GlassView';
import InvoiceIcon from '../components/InvoiceIcon';

const InvoicesScreen = () => {
  const navigation = useNavigation();
  const { token } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, paid, overdue
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    if (token) {
      loadInvoices();
    }
  }, [token]);

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchTerm, filterStatus]);

  const loadInvoices = async () => {
    if (!token) {
      console.log('No auth token available');
      return;
    }

    try {
      setLoading(true);
      const data = await invoiceAPI.getAllInvoices();
      setInvoices(data);
    } catch (error) {
      console.error('Error loading invoices:', error);
      
      // Don't show alert if it's an auth error (user might not be logged in yet)
      if (error.error !== 'No authentication token provided' && error.error !== 'Unauthorized') {
        Alert.alert('Error', error.error || 'Failed to load invoices');
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInvoices();
    setRefreshing(false);
  }, []);

  const filterInvoices = () => {
    let filtered = [...invoices];

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (invoice) =>
          invoice.invoice_number?.toLowerCase().includes(term) ||
          invoice.client_name?.toLowerCase().includes(term) ||
          invoice.company_name?.toLowerCase().includes(term) ||
          invoice.first_name?.toLowerCase().includes(term) ||
          invoice.last_name?.toLowerCase().includes(term)
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((invoice) => invoice.status === filterStatus);
    }

    setFilteredInvoices(filtered);
  };

  // Calculate invoice statistics
  const calculateStats = () => {
    const total = invoices.length;
    const pendingAmount = invoices
      .filter((inv) => inv.status === 'pending')
      .reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0);
    const paidAmount = invoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0);
    const overdueCount = invoices.filter((inv) => inv.status === 'overdue').length;

    return { total, pendingAmount, paidAmount, overdueCount };
  };

  const stats = calculateStats();

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return COLORS.success;
      case 'pending':
        return COLORS.warning;
      case 'overdue':
        return COLORS.error;
      default:
        return COLORS.textLight;
    }
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return CheckCircle;
      case 'pending':
        return Clock;
      case 'overdue':
        return AlertCircle;
      default:
        return InvoiceIcon;
    }
  };

  const handleQuickAction = (action, invoice) => {
    switch (action) {
      case 'view':
        navigation.navigate('InvoiceDetails', { invoiceId: invoice.id, initialTab: 'details' });
        break;
      case 'edit':
        navigation.navigate('InvoiceDetails', { invoiceId: invoice.id, initialTab: 'edit' });
        break;
      case 'email':
      case 'sms':
        navigation.navigate('InvoiceDetails', { invoiceId: invoice.id, initialTab: 'send' });
        break;
      case 'download':
        navigation.navigate('InvoiceDetails', { invoiceId: invoice.id, initialTab: 'download' });
        break;
      case 'remind':
        navigation.navigate('InvoiceDetails', { invoiceId: invoice.id, initialTab: 'reminder' });
        break;
      case 'delete':
        navigation.navigate('InvoiceDetails', { invoiceId: invoice.id, initialTab: 'delete' });
        break;
      default:
        break;
    }
  };

  const renderStatsCard = (icon, label, value, color) => (
    <ContentGlass style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        {React.createElement(icon, { size: 20, color: color })}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </ContentGlass>
  );

  const renderInvoiceItem = ({ item }) => {
    const StatusIcon = getStatusIcon(item.status);
    
    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedInvoice(item);
          setShowSidePanel(true);
        }}
      >
        <ContentGlass style={styles.invoiceCard}>
          {/* Header with invoice number and status */}
          <View style={styles.invoiceHeader}>
            <View style={styles.invoiceNumberContainer}>
              <InvoiceIcon size={18} color={COLORS.textLight} style={styles.invoiceIcon} />
              <Text style={styles.invoiceNumber}>{item.invoice_number}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <StatusIcon size={14} color={COLORS.white} style={styles.statusIcon} />
              <Text style={styles.statusText}>{item.status?.toUpperCase()}</Text>
            </View>
          </View>

          {/* Client name */}
          <Text style={styles.clientName}>
            {item.is_business ? item.company_name : `${item.first_name} ${item.last_name}`}
          </Text>

          {/* Amount and Date */}
          <View style={styles.invoiceFooter}>
            <View>
              <Text style={styles.amount}>{formatCurrency(item.total_amount)}</Text>
              {item.due_date && (
                <Text style={styles.dueDate}>Due: {formatDate(item.due_date)}</Text>
              )}
            </View>
            <Text style={styles.date}>{formatDate(item.invoice_date || item.created_at)}</Text>
          </View>
        </ContentGlass>
      </TouchableOpacity>
    );
  };

  const renderFilterButton = (status, label) => (
    <TouchableOpacity onPress={() => setFilterStatus(status)}>
      <TabGlass
        style={[styles.filterButton, filterStatus === status && styles.filterButtonActive]}
        active={filterStatus === status}
      >
        <Text
          style={[
            styles.filterButtonText,
            filterStatus === status && styles.filterButtonTextActive,
          ]}
        >
          {label}
        </Text>
      </TabGlass>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading invoices...</Text>
      </View>
    );
  }

  // Show message if not authenticated
  if (!token) {
    return (
      <View style={styles.centerContainer}>
        <InvoiceIcon size={48} color={COLORS.textLight} style={{ opacity: 0.5, marginBottom: SPACING[3] }} />
        <Text style={styles.loadingText}>Please log in to view invoices</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Create Button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Invoice Management</Text>
        <TouchableOpacity
          style={styles.createHeaderButton}
          onPress={() => navigation.navigate('CreateInvoice')}
        >
          <Plus size={20} color={COLORS.white} />
          <Text style={styles.createHeaderButtonText}>Create</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Summary */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer}>
        {renderStatsCard(InvoiceIcon, 'Total Invoices', stats.total.toString(), COLORS.primary)}
        {renderStatsCard(
          Clock,
          'Pending',
          formatCurrency(stats.pendingAmount),
          COLORS.warning
        )}
        {renderStatsCard(CheckCircle, 'Paid', formatCurrency(stats.paidAmount), COLORS.success)}
        {renderStatsCard(AlertCircle, 'Overdue', stats.overdueCount.toString(), COLORS.error)}
      </ScrollView>

      {/* Search Bar */}
      <ContentGlass style={styles.searchContainer}>
        <Search size={20} color={COLORS.textLight} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by invoice number or client..."
          placeholderTextColor={COLORS.textLight}
          value={searchTerm}
          onChangeText={setSearchTerm}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchTerm ? (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <X size={20} color={COLORS.textLight} />
          </TouchableOpacity>
        ) : null}
      </ContentGlass>

      {/* Status Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {renderFilterButton('all', 'All')}
        {renderFilterButton('pending', 'Pending')}
        {renderFilterButton('paid', 'Paid')}
        {renderFilterButton('overdue', 'Overdue')}
      </ScrollView>

      {/* Invoice List */}
      <FlatList
        data={filteredInvoices}
        renderItem={renderInvoiceItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <ContentGlass style={styles.emptyContainer}>
            <InvoiceIcon size={48} color={COLORS.textLight} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>
              {searchTerm ? 'No invoices found' : 'No invoices created yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchTerm
                ? 'Try adjusting your search criteria'
                : 'Create your first invoice to get started'}
            </Text>
          </ContentGlass>
        }
      />

      {/* Side Panel Modal */}
      <Modal
        visible={showSidePanel && selectedInvoice !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSidePanel(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowSidePanel(false)}
          />
          {selectedInvoice && (
            <View style={styles.sidePanel}>
              {/* Header */}
              <View style={styles.sidePanelHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sidePanelTitle}>Invoice Actions</Text>
                  <Text style={styles.sidePanelSubtitle}>{selectedInvoice.invoice_number}</Text>
                  <Text style={styles.sidePanelClient}>
                    {selectedInvoice.is_business
                      ? selectedInvoice.company_name
                      : `${selectedInvoice.first_name} ${selectedInvoice.last_name}`}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowSidePanel(false)}
                  style={styles.closeButton}
                >
                  <X size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>

              {/* Action Buttons */}
              <ScrollView 
                style={styles.sidePanelActions}
                contentContainerStyle={{ paddingBottom: SPACING[4] }}
                showsVerticalScrollIndicator={false}
              >
                <TouchableOpacity
                  style={styles.sidePanelButton}
                  onPress={() => {
                    setShowSidePanel(false);
                    navigation.navigate('InvoiceDetails', { invoiceId: selectedInvoice.id, initialTab: 'details' });
                  }}
                >
                  <Eye size={20} color={COLORS.primary} />
                  <Text style={styles.sidePanelButtonText}>Invoice Details</Text>
                </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.sidePanelButton}
                    onPress={() => {
                      setShowSidePanel(false);
                      navigation.navigate('InvoiceDetails', { invoiceId: selectedInvoice.id, initialTab: 'payments' });
                    }}
                  >
                    <DollarSign size={20} color={COLORS.success} />
                    <Text style={styles.sidePanelButtonText}>Payments</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.sidePanelButton}
                    onPress={() => {
                      setShowSidePanel(false);
                      navigation.navigate('InvoiceDetails', { invoiceId: selectedInvoice.id, initialTab: 'edit' });
                    }}
                  >
                    <Edit size={20} color="#9333EA" />
                    <Text style={styles.sidePanelButtonText}>Edit Invoice</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.sidePanelButton}
                    onPress={() => {
                      setShowSidePanel(false);
                      navigation.navigate('InvoiceDetails', { invoiceId: selectedInvoice.id, initialTab: 'send' });
                    }}
                  >
                    <Send size={20} color={COLORS.success} />
                    <Text style={styles.sidePanelButtonText}>Send Email / SMS</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.sidePanelButton}
                    onPress={() => {
                      setShowSidePanel(false);
                      navigation.navigate('InvoiceDetails', { invoiceId: selectedInvoice.id, initialTab: 'download' });
                    }}
                  >
                    <Download size={20} color={COLORS.textLight} />
                    <Text style={styles.sidePanelButtonText}>Download PDF</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.sidePanelButton}
                    onPress={() => {
                      setShowSidePanel(false);
                      navigation.navigate('InvoiceDetails', { invoiceId: selectedInvoice.id, initialTab: 'reminder' });
                    }}
                  >
                    <Bell size={20} color="#F59E0B" />
                    <Text style={styles.sidePanelButtonText}>Manage Reminders</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.sidePanelButton, styles.sidePanelButtonDanger]}
                    onPress={() => {
                      setShowSidePanel(false);
                      navigation.navigate('InvoiceDetails', { invoiceId: selectedInvoice.id, initialTab: 'delete' });
                    }}
                  >
                    <Trash2 size={20} color={COLORS.error} />
                    <Text style={[styles.sidePanelButtonText, { color: COLORS.error }]}>Delete Invoice</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.sidePanelButton}
                    onPress={() => {
                      setShowSidePanel(false);
                      navigation.navigate('InvoiceDetails', { invoiceId: selectedInvoice.id, initialTab: 'analytics' });
                    }}
                  >
                    <FileText size={20} color={COLORS.primary} />
                    <Text style={styles.sidePanelButtonText}>Analytics</Text>
                  </TouchableOpacity>
                </ScrollView>

                {/* Footer with invoice details */}
                <View style={styles.sidePanelFooter}>
                  <View style={styles.sidePanelFooterRow}>
                    <Text style={styles.sidePanelFooterLabel}>Amount:</Text>
                    <Text style={styles.sidePanelFooterValue}>{formatCurrency(selectedInvoice.total_amount)}</Text>
                  </View>
                  <View style={styles.sidePanelFooterRow}>
                    <Text style={styles.sidePanelFooterLabel}>Status:</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedInvoice.status) }]}>
                      <Text style={styles.statusText}>{selectedInvoice.status?.toUpperCase()}</Text>
                    </View>
                  </View>
                  <View style={styles.sidePanelFooterRow}>
                    <Text style={styles.sidePanelFooterLabel}>Date:</Text>
                    <Text style={styles.sidePanelFooterValue}>{formatDate(selectedInvoice.invoice_date)}</Text>
                  </View>
                </View>
            </View>
          )}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING[3],
    fontSize: TYPOGRAPHY.base,
    color: COLORS.textLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
  },
  createHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[2],
    borderRadius: 8,
    gap: SPACING[1],
  },
  createHeaderButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
  },
  statsContainer: {
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
    maxHeight: 120,
  },
  statCard: {
    padding: SPACING[3],
    borderRadius: 12,
    marginRight: SPACING[3],
    minWidth: 140,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING[2],
  },
  statValue: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
    marginBottom: SPACING[0],
  },
  statLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING[4],
    marginBottom: SPACING[2],
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
    borderRadius: 8,
  },
  searchIcon: {
    marginRight: SPACING[2],
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.text,
    padding: 0,
  },
  filtersContainer: {
    marginBottom: SPACING[2],
    maxHeight: 50,
  },
  filtersContent: {
    paddingHorizontal: SPACING[4],
    gap: SPACING[2],
  },
  filterButton: {
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[2],
    borderRadius: 12,
  },
  filterButtonText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.semibold,
  },
  filterButtonTextActive: {
    color: COLORS.accent,
    fontWeight: TYPOGRAPHY.bold,
  },
  listContainer: {
    paddingHorizontal: SPACING[4],
    paddingBottom: SPACING[4],
  },
  invoiceCard: {
    borderRadius: 12,
    padding: SPACING[4],
    marginBottom: SPACING[3],
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING[2],
  },
  invoiceNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  invoiceIcon: {
    marginRight: SPACING[1],
  },
  invoiceNumber: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING[2],
    paddingVertical: SPACING[1],
    borderRadius: 12,
    gap: SPACING[1],
  },
  statusIcon: {
    marginRight: 2,
  },
  statusText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.white,
  },
  clientName: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
    marginBottom: SPACING[3],
  },
  invoiceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING[3],
  },
  amount: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.primary,
  },
  date: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textLight,
  },
  dueDate: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.error,
    marginTop: SPACING[0],
  },
  actionsContainer: {
    paddingTop: SPACING[3],
    borderTopWidth: 1,
    borderTopColor: COLORS.border + '30',
    gap: SPACING[2],
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: SPACING[2],
  },
  actionButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[2],
    flex: 1,
    minWidth: 60,
    borderRadius: 8,
    backgroundColor: COLORS.white + '50',
    gap: SPACING[1],
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.medium,
    textAlign: 'center',
  },
  emptyContainer: {
    padding: SPACING[8],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginTop: SPACING[4],
  },
  emptyIcon: {
    marginBottom: SPACING[3],
    opacity: 0.5,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.base,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.semibold,
    marginBottom: SPACING[1],
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  // Side Panel Styles
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidePanel: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '80%',
    maxWidth: 400,
    backgroundColor: COLORS.background,
    padding: SPACING[4],
  },
  sidePanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: SPACING[3],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '30',
    marginBottom: SPACING[3],
  },
  sidePanelTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
    marginBottom: SPACING[1],
  },
  sidePanelSubtitle: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
  },
  sidePanelClient: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.text,
    marginTop: SPACING[1],
  },
  closeButton: {
    padding: SPACING[1],
  },
  sidePanelActions: {
    flex: 1,
  },
  sidePanelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING[3],
    borderRadius: 8,
    backgroundColor: COLORS.white,
    marginBottom: SPACING[2],
    gap: SPACING[3],
  },
  sidePanelButtonDanger: {
    backgroundColor: COLORS.error + '10',
  },
  sidePanelButtonText: {
    fontSize: TYPOGRAPHY.base,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.medium,
  },
  sidePanelFooter: {
    paddingTop: SPACING[3],
    borderTopWidth: 1,
    borderTopColor: COLORS.border + '30',
    marginTop: SPACING[3],
    gap: SPACING[2],
  },
  sidePanelFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sidePanelFooterLabel: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
  },
  sidePanelFooterValue: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
  },
});

export default InvoicesScreen;
