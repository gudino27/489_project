import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as invoiceAPI from '../api/invoices';
import { COLORS } from '../constants/colors';

const InvoiceDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { invoiceId } = route.params;

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    loadInvoiceDetails();
  }, [invoiceId]);

  const loadInvoiceDetails = async () => {
    try {
      setLoading(true);
      const data = await invoiceAPI.getInvoiceById(invoiceId);
      setInvoice(data);
    } catch (error) {
      console.error('Error loading invoice:', error);
      Alert.alert('Error', error.error || 'Failed to load invoice');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleEmailInvoice = async () => {
    Alert.prompt(
      'Email Invoice',
      'Enter email message (optional)',
      async (message) => {
        try {
          setActionLoading('email');
          await invoiceAPI.emailInvoice(invoiceId, {
            message: message || '',
            language: 'en',
          });
          Alert.alert('Success', 'Invoice sent successfully');
        } catch (error) {
          Alert.alert('Error', error.error || 'Failed to send invoice');
        } finally {
          setActionLoading('');
        }
      },
      'plain-text'
    );
  };

  const handleSendSMS = async () => {
    if (!invoice.client?.phone) {
      Alert.alert('Error', 'Client has no phone number');
      return;
    }

    Alert.alert(
      'Send SMS Reminder',
      `Send invoice reminder to ${invoice.client.phone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            try {
              setActionLoading('sms');
              await invoiceAPI.sendInvoiceSMS(invoiceId, {
                phone: invoice.client.phone,
                message: `Payment reminder for invoice ${invoice.invoice_number}`,
              });
              Alert.alert('Success', 'SMS sent successfully');
            } catch (error) {
              Alert.alert('Error', error.error || 'Failed to send SMS');
            } finally {
              setActionLoading('');
            }
          },
        },
      ]
    );
  };

  const handleDownloadPDF = async () => {
    try {
      setActionLoading('pdf');
      const pdfBlob = await invoiceAPI.generateInvoicePDF(invoiceId, 'en');
      // TODO: Implement PDF viewing/sharing
      Alert.alert('PDF Generated', 'PDF generation successful. Share functionality coming soon.');
    } catch (error) {
      Alert.alert('Error', error.error || 'Failed to generate PDF');
    } finally {
      setActionLoading('');
    }
  };

  const handleDeleteInvoice = () => {
    Alert.alert(
      'Delete Invoice',
      `Are you sure you want to delete invoice ${invoice.invoice_number}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading('delete');
              await invoiceAPI.deleteInvoice(invoiceId);
              Alert.alert('Success', 'Invoice deleted successfully');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', error.error || 'Failed to delete invoice');
              setActionLoading('');
            }
          },
        },
      ]
    );
  };

  const handleAddPayment = () => {
    Alert.alert('Add Payment', 'Payment functionality coming soon');
    // TODO: Navigate to add payment screen
  };

  const handleShareInvoice = async () => {
    if (!invoice.token) {
      Alert.alert('Error', 'No shareable link available for this invoice');
      return;
    }

    const shareUrl = `https://gudinocustom.com/invoice/${invoice.token}`;
    try {
      await Share.share({
        message: `Invoice ${invoice.invoice_number} - ${shareUrl}`,
        url: shareUrl,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
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
        <Text style={styles.errorText}>Invoice not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(invoice.status) }]}>
            <Text style={styles.statusText}>{invoice.status?.toUpperCase()}</Text>
          </View>
        </View>

        {/* Client Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client Information</Text>
          <View style={styles.infoCard}>
            <Text style={styles.clientName}>
              {invoice.is_business
                ? invoice.company_name
                : `${invoice.first_name} ${invoice.last_name}`}
            </Text>
            {invoice.email && <Text style={styles.infoText}>📧 {invoice.email}</Text>}
            {invoice.phone && <Text style={styles.infoText}>📱 {invoice.phone}</Text>}
            {invoice.address && <Text style={styles.infoText}>📍 {invoice.address}</Text>}
          </View>
        </View>

        {/* Invoice Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invoice Details</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Issue Date:</Text>
              <Text style={styles.infoValue}>{formatDate(invoice.created_at)}</Text>
            </View>
            {invoice.due_date && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Due Date:</Text>
                <Text style={[styles.infoValue, { color: COLORS.error }]}>
                  {formatDate(invoice.due_date)}
                </Text>
              </View>
            )}
            {invoice.project_description && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Description:</Text>
                <Text style={styles.infoValue}>{invoice.project_description}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Line Items */}
        {invoice.line_items && invoice.line_items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Line Items</Text>
            {invoice.line_items.map((item, index) => (
              <View key={index} style={styles.lineItem}>
                <View style={styles.lineItemHeader}>
                  <Text style={styles.lineItemName}>{item.description || item.label}</Text>
                  <Text style={styles.lineItemAmount}>{formatCurrency(item.amount)}</Text>
                </View>
                {item.quantity && (
                  <Text style={styles.lineItemDetails}>
                    Qty: {item.quantity} × {formatCurrency(item.unit_price || item.amount / item.quantity)}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Totals */}
        <View style={styles.section}>
          <View style={styles.totalsCard}>
            {invoice.subtotal && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal:</Text>
                <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
              </View>
            )}
            {invoice.tax_amount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax:</Text>
                <Text style={styles.totalValue}>{formatCurrency(invoice.tax_amount)}</Text>
              </View>
            )}
            {invoice.discount_amount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount:</Text>
                <Text style={[styles.totalValue, { color: COLORS.success }]}>
                  -{formatCurrency(invoice.discount_amount)}
                </Text>
              </View>
            )}
            <View style={styles.totalRowFinal}>
              <Text style={styles.totalLabelFinal}>Total:</Text>
              <Text style={styles.totalValueFinal}>{formatCurrency(invoice.total_amount)}</Text>
            </View>
          </View>
        </View>

        {/* Payment History */}
        {invoice.payments && invoice.payments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment History</Text>
            {invoice.payments.map((payment, index) => (
              <View key={index} style={styles.paymentItem}>
                <View style={styles.paymentHeader}>
                  <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
                  <Text style={styles.paymentDate}>{formatDate(payment.payment_date)}</Text>
                </View>
                {payment.payment_method && (
                  <Text style={styles.paymentMethod}>Method: {payment.payment_method}</Text>
                )}
                {payment.notes && <Text style={styles.paymentNotes}>{payment.notes}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.infoCard}>
              <Text style={styles.notesText}>{invoice.notes}</Text>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.actionButton, styles.emailButton]}
          onPress={handleEmailInvoice}
          disabled={!!actionLoading}
        >
          {actionLoading === 'email' ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <Text style={styles.actionButtonText}>✉️ Email</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.smsButton]}
          onPress={handleSendSMS}
          disabled={!!actionLoading}
        >
          {actionLoading === 'sms' ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <Text style={styles.actionButtonText}>💬 SMS</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.pdfButton]}
          onPress={handleDownloadPDF}
          disabled={!!actionLoading}
        >
          {actionLoading === 'pdf' ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <Text style={styles.actionButtonText}>📄 PDF</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.moreButton]}
          onPress={() => {
            Alert.alert('More Actions', '', [
              { text: 'Add Payment', onPress: handleAddPayment },
              { text: 'Share Link', onPress: handleShareInvoice },
              { text: 'Delete Invoice', onPress: handleDeleteInvoice, style: 'destructive' },
              { text: 'Cancel', style: 'cancel' },
            ]);
          }}
          disabled={!!actionLoading}
        >
          <Text style={styles.actionButtonText}>⋯</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textLight,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  invoiceNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  clientName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: COLORS.textLight,
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  lineItem: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  lineItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lineItemName: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
    flex: 1,
  },
  lineItemAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  lineItemDetails: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
  },
  totalsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  totalValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  totalRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: COLORS.border,
  },
  totalLabelFinal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  totalValueFinal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  paymentItem: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  paymentDate: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  paymentMethod: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
  },
  paymentNotes: {
    fontSize: 14,
    color: COLORS.text,
    marginTop: 4,
    fontStyle: 'italic',
  },
  notesText: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
  },
  actionBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailButton: {
    backgroundColor: COLORS.info,
  },
  smsButton: {
    backgroundColor: COLORS.success,
  },
  pdfButton: {
    backgroundColor: COLORS.primary,
  },
  moreButton: {
    backgroundColor: COLORS.darkGray,
    flex: 0.5,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default InvoiceDetailsScreen;
