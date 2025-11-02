import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  Linking,
} from 'react-native';
import {
  FileText,
  DollarSign,
  Edit,
  Send,
  Eye,
  Download,
  Bell,
  Trash2,
  BarChart3,
  User,
  Calendar,
  ChevronLeft,
  Mail,
  Phone,
  MapPin,
  MessageCircle,
} from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import * as invoiceAPI from '../../api/invoices';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../constants';
import { ContentGlass, TabGlass } from '../../components/GlassView';

const InvoiceDetailsScreen = ({ route, navigation }) => {
  const { invoiceId, initialTab = 'details' } = route.params;
  const { token } = useAuth();
  const { t } = useLanguage();
  
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Email/SMS state
  const [emailMessage, setEmailMessage] = useState('');
  const [smsMessage, setSmsMessage] = useState('');
  const [sending, setSending] = useState(false);
  
  // Tracking state
  const [trackingData, setTrackingData] = useState(null);
  const [loadingTracking, setLoadingTracking] = useState(false);

  const tabs = [
    { id: 'details', label: 'Details', icon: FileText },
    { id: 'payments', label: 'Payments', icon: DollarSign },
    { id: 'edit', label: 'Edit', icon: Edit },
    { id: 'send', label: 'Send', icon: Send },
    { id: 'track', label: 'Track', icon: Eye },
    { id: 'download', label: 'Download', icon: Download },
    { id: 'reminder', label: 'Reminder', icon: Bell },
    { id: 'delete', label: 'Delete', icon: Trash2 },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  useEffect(() => {
    if (token && invoiceId) {
      loadInvoice();
    }
  }, [token, invoiceId]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const data = await invoiceAPI.getInvoiceById(invoiceId);
      setInvoice(data);
    } catch (error) {
      console.error('Error loading invoice:', error);
      Alert.alert('Error', error.error || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInvoice();
    setRefreshing(false);
  };

  const handleSendEmail = async () => {
    if (!emailMessage.trim()) {
      Alert.alert('Error', 'Please enter an email message');
      return;
    }

    try {
      setSending(true);
      await invoiceAPI.emailInvoice(invoiceId, { message: emailMessage });
      Alert.alert('Success', 'Invoice email sent successfully');
      setEmailMessage('');
    } catch (error) {
      console.error('Error sending email:', error);
      Alert.alert('Error', error.error || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const handleSendSMS = async () => {
    if (!smsMessage.trim()) {
      Alert.alert('Error', 'Please enter an SMS message');
      return;
    }

    try {
      setSending(true);
      await invoiceAPI.sendInvoiceSMS(invoiceId, { message: smsMessage });
      Alert.alert('Success', 'SMS sent successfully');
      setSmsMessage('');
    } catch (error) {
      console.error('Error sending SMS:', error);
      Alert.alert('Error', error.error || 'Failed to send SMS');
    } finally {
      setSending(false);
    }
  };

  const loadTrackingData = async () => {
    try {
      setLoadingTracking(true);
      // For now, we'll show tracking info from the invoice data
      // If there's a specific tracking endpoint per invoice, it would be:
      // const data = await invoiceAPI.getInvoiceTracking(invoiceId);
      setTrackingData({
        views: invoice?.view_count || 0,
        lastViewed: invoice?.last_viewed_at,
        isViewed: invoice?.is_viewed || false,
        trackingEnabled: invoice?.has_token || false,
      });
    } catch (error) {
      console.error('Error loading tracking:', error);
    } finally {
      setLoadingTracking(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      Alert.alert('Download PDF', 'PDF download functionality will be implemented with file system access');
      // This would need react-native-fs or expo-file-system
      // const pdfData = await invoiceAPI.generateInvoicePDF(invoiceId);
      // Save to device
    } catch (error) {
      console.error('Error downloading PDF:', error);
      Alert.alert('Error', error.error || 'Failed to download PDF');
    }
  };

  const handleDeleteInvoice = async () => {
    Alert.alert(
      'Delete Invoice',
      `Are you sure you want to delete invoice ${invoice?.invoice_number}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await invoiceAPI.deleteInvoice(invoiceId);
              Alert.alert('Success', 'Invoice deleted successfully');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting invoice:', error);
              Alert.alert('Error', error.error || 'Failed to delete invoice');
            }
          },
        },
      ]
    );
  };

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

  const renderDetailsTab = () => {
    if (!invoice) return null;

    const clientName = invoice.is_business
      ? invoice.company_name
      : `${invoice.first_name} ${invoice.last_name}`;

    const totalPaid = invoice.payments?.reduce(
      (sum, payment) => sum + parseFloat(payment.payment_amount || 0),
      0
    ) || 0;
    const remainingBalance = parseFloat(invoice.total_amount || 0) - totalPaid;

    return (
      <ScrollView
        style={styles.tabContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Invoice Document Style */}
        <ContentGlass style={styles.invoiceDocument}>
          {/* Invoice Header */}
          <View style={styles.invoiceDocHeader}>
            <Text style={styles.invoiceDocNumber}>{invoice.invoice_number}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(invoice.status) }]}>
              <Text style={styles.statusText}>{invoice.status?.toUpperCase()}</Text>
            </View>
          </View>

          {/* Client Information */}
          <View style={styles.docSection}>
            <Text style={styles.docSectionTitle}>Client Information</Text>
            <Text style={styles.docClientName}>{clientName}</Text>
            {invoice.email && (
              <View style={styles.docInfoRow}>
                <Mail size={14} color={COLORS.primary} />
                <Text style={styles.docInfoText}>{invoice.email}</Text>
              </View>
            )}
            {invoice.phone && (
              <View style={styles.docInfoRow}>
                <Phone size={14} color={COLORS.primary} />
                <Text style={styles.docInfoText}>{invoice.phone}</Text>
              </View>
            )}
            {invoice.address && (
              <View style={styles.docInfoRow}>
                <MapPin size={14} color={COLORS.primary} />
                <Text style={styles.docInfoText}>{invoice.address}</Text>
              </View>
            )}
          </View>

          {/* Invoice Details */}
          <View style={styles.docSection}>
            <Text style={styles.docSectionTitle}>Invoice Details</Text>
            <View style={styles.docDetailsGrid}>
              <View style={styles.docDetailItem}>
                <Text style={styles.docDetailLabel}>Issue Date:</Text>
                <Text style={styles.docDetailValue}>{formatDate(invoice.invoice_date)}</Text>
              </View>
              <View style={styles.docDetailItem}>
                <Text style={styles.docDetailLabel}>Due Date:</Text>
                <Text style={[styles.docDetailValue, { color: COLORS.error }]}>
                  {formatDate(invoice.due_date)}
                </Text>
              </View>
            </View>
          </View>

          {/* Line Items */}
          <View style={styles.docSection}>
            <Text style={styles.docSectionTitle}>Line Items</Text>
            {invoice.line_items?.map((item, index) => (
              <View key={index} style={styles.docLineItem}>
                <View style={styles.docLineItemHeader}>
                  <Text style={styles.docLineItemTitle}>{item.title || item.description}</Text>
                  <Text style={styles.docLineItemTotal}>
                    {formatCurrency(item.quantity * parseFloat(item.unit_price || 0))}
                  </Text>
                </View>
                <Text style={styles.docLineItemQty}>
                  Qty: {item.quantity} × {formatCurrency(item.unit_price)}
                </Text>
              </View>
            ))}
          </View>

          {/* Totals */}
          <View style={styles.docSection}>
            <Text style={styles.docSectionTitle}>Totals</Text>
            <View style={styles.docTotalsContainer}>
              <View style={styles.docTotalRow}>
                <Text style={styles.docTotalLabel}>Subtotal:</Text>
                <Text style={styles.docTotalValue}>{formatCurrency(invoice.subtotal)}</Text>
              </View>
              {parseFloat(invoice.tax_amount || 0) > 0 && (
                <View style={styles.docTotalRow}>
                  <Text style={styles.docTotalLabel}>Tax:</Text>
                  <Text style={styles.docTotalValue}>{formatCurrency(invoice.tax_amount)}</Text>
                </View>
              )}
              <View style={styles.docTotalRowFinal}>
                <Text style={styles.docTotalLabelFinal}>Total:</Text>
                <Text style={styles.docTotalValueFinal}>{formatCurrency(invoice.total_amount)}</Text>
              </View>
            </View>
          </View>

          {/* Notes */}
          {invoice.notes && (
            <View style={styles.docSection}>
              <Text style={styles.docSectionTitle}>Notes</Text>
              <Text style={styles.docNotesText}>{invoice.notes}</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.docActionsContainer}>
            <TouchableOpacity
              style={[styles.docActionButton, { backgroundColor: '#4A90E2' }]}
              onPress={() => setActiveTab('send')}
            >
              <Mail size={22} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.docActionButton, { backgroundColor: '#50C878' }]}
              onPress={() => setActiveTab('send')}
            >
              <MessageCircle size={22} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.docActionButton, { backgroundColor: '#808080' }]}
              onPress={() => setActiveTab('download')}
            >
              <Download size={22} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.docActionButton, { backgroundColor: '#5B6B7A' }]}
              onPress={() => setActiveTab('edit')}
            >
              <Edit size={22} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </ContentGlass>
      </ScrollView>
    );
  };

  const renderPaymentsTab = () => {
    if (!invoice) return null;

    const totalPaid = invoice.payments?.reduce(
      (sum, payment) => sum + parseFloat(payment.payment_amount || 0),
      0
    ) || 0;
    const remainingBalance = parseFloat(invoice.total_amount || 0) - totalPaid;

    return (
      <ScrollView style={styles.tabContent}>
        {/* Payment Summary */}
        <ContentGlass style={styles.card}>
          <View style={styles.paymentSummary}>
            <View style={styles.paymentSummaryItem}>
              <Text style={styles.paymentSummaryLabel}>Total Amount</Text>
              <Text style={styles.paymentSummaryValue}>{formatCurrency(invoice.total_amount)}</Text>
            </View>
            <View style={styles.paymentSummaryItem}>
              <Text style={styles.paymentSummaryLabel}>Total Paid</Text>
              <Text style={[styles.paymentSummaryValue, { color: COLORS.success }]}>
                {formatCurrency(totalPaid)}
              </Text>
            </View>
            <View style={styles.paymentSummaryItem}>
              <Text style={styles.paymentSummaryLabel}>Balance Due</Text>
              <Text style={[styles.paymentSummaryValue, { color: remainingBalance > 0 ? COLORS.error : COLORS.success }]}>
                {formatCurrency(remainingBalance)}
              </Text>
            </View>
          </View>
        </ContentGlass>

        {/* Add Payment Button */}
        {remainingBalance > 0 && (
          <TouchableOpacity
            style={styles.addPaymentButton}
            onPress={() => Alert.alert('Add Payment', 'Payment functionality coming soon')}
          >
            <DollarSign size={20} color={COLORS.white} />
            <Text style={styles.addPaymentButtonText}>Add Payment</Text>
          </TouchableOpacity>
        )}

        {/* Payment History */}
        <ContentGlass style={styles.card}>
          <View style={styles.cardHeader}>
            <DollarSign size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Payment History</Text>
          </View>
          {invoice.payments && invoice.payments.length > 0 ? (
            invoice.payments.map((payment, index) => (
              <View key={index} style={styles.paymentItem}>
                <View style={styles.paymentItemHeader}>
                  <Text style={styles.paymentItemDate}>{formatDate(payment.payment_date)}</Text>
                  <Text style={styles.paymentItemAmount}>{formatCurrency(payment.payment_amount)}</Text>
                </View>
                {payment.payment_method && (
                  <Text style={styles.paymentItemMethod}>Method: {payment.payment_method}</Text>
                )}
                {payment.notes && (
                  <Text style={styles.paymentItemNotes}>{payment.notes}</Text>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No payments recorded yet</Text>
          )}
        </ContentGlass>
      </ScrollView>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'details':
        return renderDetailsTab();
      case 'payments':
        return renderPaymentsTab();
      case 'edit':
        return (
          <View style={styles.tabContent}>
            <ContentGlass style={styles.card}>
              <Text style={styles.placeholderText}>Edit functionality coming soon</Text>
              <Text style={styles.placeholderSubtext}>
                This will allow you to edit invoice details, line items, and client information.
              </Text>
            </ContentGlass>
          </View>
        );
      case 'send':
        return (
          <ScrollView style={styles.tabContent}>
            {/* Email Section */}
            <ContentGlass style={styles.card}>
              <View style={styles.cardHeader}>
                <Mail size={20} color={COLORS.primary} />
                <Text style={styles.cardTitle}>Send via Email</Text>
              </View>
              
              {invoice?.email ? (
                <>
                  <View style={styles.infoGroup}>
                    <Text style={styles.infoLabel}>Recipient</Text>
                    <Text style={styles.infoValue}>{invoice.email}</Text>
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Custom Message (Optional)</Text>
                    <TextInput
                      style={styles.textArea}
                      value={emailMessage}
                      onChangeText={setEmailMessage}
                      placeholder={t('invoiceDetails.emailPlaceholder')}
                      placeholderTextColor={COLORS.textLight}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>
                  
                  <TouchableOpacity
                    style={[styles.sendButton, sending && styles.sendButtonDisabled]}
                    onPress={handleSendEmail}
                    disabled={sending}
                  >
                    {sending ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <>
                        <Mail size={20} color={COLORS.white} />
                        <Text style={styles.sendButtonText}>Send Email</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={styles.emptyText}>No email address on file for this client</Text>
              )}
            </ContentGlass>

            {/* SMS Section */}
            <ContentGlass style={styles.card}>
              <View style={styles.cardHeader}>
                <MessageCircle size={20} color={COLORS.primary} />
                <Text style={styles.cardTitle}>Send via SMS</Text>
              </View>
              
              {invoice?.phone ? (
                <>
                  <View style={styles.infoGroup}>
                    <Text style={styles.infoLabel}>Recipient</Text>
                    <Text style={styles.infoValue}>{invoice.phone}</Text>
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>SMS Message</Text>
                    <TextInput
                      style={styles.textArea}
                      value={smsMessage}
                      onChangeText={setSmsMessage}
                      placeholder={t('invoiceDetails.smsPlaceholder')}
                      placeholderTextColor={COLORS.textLight}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      maxLength={160}
                    />
                    <Text style={styles.characterCount}>{smsMessage.length}/160</Text>
                  </View>
                  
                  <TouchableOpacity
                    style={[styles.sendButton, { backgroundColor: COLORS.success }, sending && styles.sendButtonDisabled]}
                    onPress={handleSendSMS}
                    disabled={sending}
                  >
                    {sending ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <>
                        <MessageCircle size={20} color={COLORS.white} />
                        <Text style={styles.sendButtonText}>Send SMS</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={styles.emptyText}>No phone number on file for this client</Text>
              )}
            </ContentGlass>
          </ScrollView>
        );
      case 'track':
        return (
          <ScrollView style={styles.tabContent}>
            <ContentGlass style={styles.card}>
              <View style={styles.cardHeader}>
                <Eye size={20} color={COLORS.primary} />
                <Text style={styles.cardTitle}>Invoice Tracking</Text>
              </View>
              
              {!trackingData && (
                <TouchableOpacity
                  style={styles.loadTrackingButton}
                  onPress={loadTrackingData}
                  disabled={loadingTracking}
                >
                  {loadingTracking ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <>
                      <Eye size={20} color={COLORS.primary} />
                      <Text style={styles.loadTrackingButtonText}>Load Tracking Data</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
              
              {trackingData && (
                <View style={styles.trackingInfo}>
                  <View style={styles.trackingItem}>
                    <Text style={styles.trackingLabel}>Total Views</Text>
                    <Text style={styles.trackingValue}>{trackingData.views}</Text>
                  </View>
                  
                  <View style={styles.trackingItem}>
                    <Text style={styles.trackingLabel}>Status</Text>
                    <View style={[
                      styles.trackingStatusBadge,
                      { backgroundColor: trackingData.isViewed ? COLORS.success : COLORS.warning }
                    ]}>
                      <Text style={styles.trackingStatusText}>
                        {trackingData.isViewed ? 'Viewed' : 'Not Viewed'}
                      </Text>
                    </View>
                  </View>
                  
                  {trackingData.lastViewed && (
                    <View style={styles.trackingItem}>
                      <Text style={styles.trackingLabel}>Last Viewed</Text>
                      <Text style={styles.trackingValue}>{formatDate(trackingData.lastViewed)}</Text>
                    </View>
                  )}
                  
                  <View style={styles.trackingItem}>
                    <Text style={styles.trackingLabel}>Tracking Link</Text>
                    <Text style={styles.trackingValue}>
                      {trackingData.trackingEnabled ? t('invoiceDetails.trackingActive') : t('invoiceDetails.trackingNotGenerated')}
                    </Text>
                  </View>
                </View>
              )}
            </ContentGlass>
            
            <ContentGlass style={styles.card}>
              <Text style={styles.infoText}>
                Tracking allows you to see when clients view their invoices. Views are recorded when clients access their invoice through the unique link sent via email or SMS.
              </Text>
            </ContentGlass>
          </ScrollView>
        );
      case 'download':
        return (
          <View style={styles.tabContent}>
            <ContentGlass style={styles.card}>
              <View style={styles.cardHeader}>
                <Download size={20} color={COLORS.primary} />
                <Text style={styles.cardTitle}>Download Invoice PDF</Text>
              </View>
              
              <Text style={styles.infoText}>
                Download a PDF version of this invoice for printing or sharing.
              </Text>
              
              <TouchableOpacity
                style={styles.downloadButton}
                onPress={handleDownloadPDF}
              >
                <Download size={20} color={COLORS.white} />
                <Text style={styles.downloadButtonText}>Download PDF</Text>
              </TouchableOpacity>
            </ContentGlass>
          </View>
        );
      case 'reminder':
        return (
          <View style={styles.tabContent}>
            <ContentGlass style={styles.card}>
              <Text style={styles.placeholderText}>Payment reminder settings coming soon</Text>
              <Text style={styles.placeholderSubtext}>
                Set up automatic payment reminders to be sent before and after the due date.
              </Text>
            </ContentGlass>
          </View>
        );
      case 'delete':
        return (
          <View style={styles.tabContent}>
            <ContentGlass style={styles.card}>
              <View style={styles.cardHeader}>
                <Trash2 size={20} color={COLORS.error} />
                <Text style={[styles.cardTitle, { color: COLORS.error }]}>Delete Invoice</Text>
              </View>
              
              <Text style={styles.warningText}>
                ⚠️ Warning: This action cannot be undone. Deleting this invoice will permanently remove it from the system along with all associated payment records.
              </Text>
              
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDeleteInvoice}
              >
                <Trash2 size={20} color={COLORS.white} />
                <Text style={styles.deleteButtonText}>Delete Invoice</Text>
              </TouchableOpacity>
            </ContentGlass>
          </View>
        );
      case 'analytics':
        return (
          <View style={styles.tabContent}>
            <ContentGlass style={styles.card}>
              <Text style={styles.placeholderText}>Invoice analytics coming soon</Text>
              <Text style={styles.placeholderSubtext}>
                View detailed analytics about this invoice including payment patterns and client engagement.
              </Text>
            </ContentGlass>
          </View>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading invoice...</Text>
      </View>
    );
  }

  if (!invoice) {
    return (
      <View style={styles.centerContainer}>
        <FileText size={48} color={COLORS.textLight} style={{ opacity: 0.5, marginBottom: SPACING[3] }} />
        <Text style={styles.loadingText}>Invoice not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backIconButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Invoice {invoice.invoice_number}</Text>
          <View style={[styles.headerStatusBadge, { backgroundColor: getStatusColor(invoice.status) }]}>
            <Text style={styles.headerStatusText}>{invoice.status?.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
            >
              <TabGlass
                style={styles.tab}
                active={isActive}
              >
                <Icon size={16} color={isActive ? COLORS.accent : COLORS.textLight} />
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TabGlass>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Tab Content */}
      {renderTabContent()}
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
  backButton: {
    marginTop: SPACING[4],
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[2],
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backIconButton: {
    marginRight: SPACING[2],
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
  },
  headerStatusBadge: {
    paddingHorizontal: SPACING[2],
    paddingVertical: SPACING[1],
    borderRadius: RADIUS.full,
  },
  headerStatusText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.white,
  },
  tabsContainer: {
    maxHeight: 60,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabsContent: {
    paddingHorizontal: SPACING[4],
    gap: SPACING[2],
    paddingVertical: SPACING[2],
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
    borderRadius: RADIUS.md,
    gap: SPACING[1],
  },
  tabText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
    fontWeight: TYPOGRAPHY.medium,
  },
  tabTextActive: {
    color: COLORS.accent,
    fontWeight: TYPOGRAPHY.bold,
  },
  tabContent: {
    flex: 1,
    padding: SPACING[4],
  },
  card: {
    padding: SPACING[4],
    borderRadius: RADIUS.lg,
    marginBottom: SPACING[3],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    marginBottom: SPACING[3],
    paddingBottom: SPACING[2],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '30',
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusItem: {
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textLight,
    marginBottom: SPACING[1],
  },
  statusBadge: {
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[1],
    borderRadius: RADIUS.full,
  },
  statusText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.white,
  },
  statusValue: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
  },
  infoGroup: {
    flexDirection: 'row',
    marginBottom: SPACING[2],
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: SPACING[2],
    marginTop: 2,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textLight,
    marginBottom: SPACING[0],
  },
  infoValue: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.medium,
  },
  lineItem: {
    paddingVertical: SPACING[3],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '30',
  },
  lineItemTitle: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
    marginBottom: SPACING[1],
  },
  lineItemDescription: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.text,
    marginBottom: SPACING[1],
  },
  lineItemNotes: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textLight,
    marginBottom: SPACING[2],
    fontStyle: 'italic',
  },
  lineItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lineItemQuantity: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textLight,
  },
  lineItemPrice: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING[2],
  },
  totalLabel: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
  },
  totalValue: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.text,
  },
  totalRowFinal: {
    borderTopWidth: 2,
    borderTopColor: COLORS.border,
    marginTop: SPACING[2],
    paddingTop: SPACING[3],
  },
  totalLabelFinal: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
  },
  totalValueFinal: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.primary,
  },
  notesText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.text,
    lineHeight: 20,
  },
  paymentSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  paymentSummaryItem: {
    alignItems: 'center',
  },
  paymentSummaryLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textLight,
    marginBottom: SPACING[1],
    textAlign: 'center',
  },
  paymentSummaryValue: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
  },
  addPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    borderRadius: RADIUS.md,
    marginBottom: SPACING[3],
    gap: SPACING[2],
  },
  addPaymentButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
  },
  paymentItem: {
    paddingVertical: SPACING[3],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '30',
  },
  paymentItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING[1],
  },
  paymentItemDate: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
  },
  paymentItemAmount: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.success,
  },
  paymentItemMethod: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textLight,
    marginBottom: SPACING[1],
  },
  paymentItemNotes: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.text,
    fontStyle: 'italic',
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
    textAlign: 'center',
    paddingVertical: SPACING[4],
  },
  placeholderText: {
    fontSize: TYPOGRAPHY.base,
    color: COLORS.textLight,
    textAlign: 'center',
    paddingVertical: SPACING[8],
  },
  placeholderSubtext: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: SPACING[2],
  },
  inputGroup: {
    marginTop: SPACING[3],
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
    marginBottom: SPACING[2],
  },
  textArea: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING[3],
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.text,
    minHeight: 100,
    backgroundColor: COLORS.white,
  },
  characterCount: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textLight,
    textAlign: 'right',
    marginTop: SPACING[1],
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: SPACING[4],
    borderRadius: RADIUS.md,
    marginTop: SPACING[4],
    gap: SPACING[2],
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.white,
  },
  loadTrackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING[3],
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: SPACING[2],
  },
  loadTrackingButtonText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.primary,
  },
  trackingInfo: {
    marginTop: SPACING[3],
  },
  trackingItem: {
    paddingVertical: SPACING[3],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '30',
  },
  trackingLabel: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
    marginBottom: SPACING[1],
  },
  trackingValue: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
  },
  trackingStatusBadge: {
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[1],
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  trackingStatusText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.white,
  },
  infoText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: SPACING[4],
    borderRadius: RADIUS.md,
    marginTop: SPACING[4],
    gap: SPACING[2],
  },
  downloadButtonText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.white,
  },
  warningText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
    lineHeight: 20,
    backgroundColor: COLORS.error + '10',
    padding: SPACING[3],
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.error + '30',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error,
    padding: SPACING[4],
    borderRadius: RADIUS.md,
    marginTop: SPACING[4],
    gap: SPACING[2],
  },
  deleteButtonText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.white,
  },
  // Invoice Document Styles
  invoiceDocument: {
    padding: SPACING[4],
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.background,
  },
  invoiceDocHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING[4],
    paddingBottom: SPACING[3],
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
  },
  invoiceDocNumber: {
    fontSize: TYPOGRAPHY['2xl'],
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
  },
  docSection: {
    marginBottom: SPACING[4],
    paddingBottom: SPACING[3],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '30',
  },
  docSectionTitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
    marginBottom: SPACING[2],
  },
  docClientName: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
    marginBottom: SPACING[2],
  },
  docInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    marginTop: SPACING[1],
  },
  docInfoText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
  },
  docDetailsGrid: {
    gap: SPACING[2],
  },
  docDetailItem: {
    marginBottom: SPACING[2],
  },
  docDetailLabel: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
  },
  docDetailValue: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
    marginTop: SPACING[1],
  },
  docLineItem: {
    marginBottom: SPACING[3],
    paddingBottom: SPACING[2],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '20',
  },
  docLineItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING[1],
  },
  docLineItemTitle: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
    flex: 1,
  },
  docLineItemTotal: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
  },
  docLineItemQty: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textLight,
  },
  docTotalsContainer: {
    backgroundColor: COLORS.background + '80',
    padding: SPACING[3],
    borderRadius: RADIUS.md,
  },
  docTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING[2],
  },
  docTotalLabel: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
  },
  docTotalValue: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.text,
  },
  docTotalRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SPACING[2],
    borderTopWidth: 2,
    borderTopColor: COLORS.border,
    marginTop: SPACING[1],
  },
  docTotalLabelFinal: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
  },
  docTotalValueFinal: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
  },
  docNotesText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.text,
    lineHeight: 20,
    padding: SPACING[3],
    backgroundColor: COLORS.background + '60',
    borderRadius: RADIUS.md,
  },
  docActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: SPACING[3],
    marginTop: SPACING[4],
    paddingTop: SPACING[4],
    borderTopWidth: 1,
    borderTopColor: COLORS.border + '30',
  },
  docActionButton: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default InvoiceDetailsScreen;
