import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants';
import { ContentGlass } from '../components/GlassView';

const PaymentsScreen = () => {
  const [payments, setPayments] = useState([
    {
      id: 1,
      invoiceId: 'INV-001',
      customerName: 'John Smith',
      amount: 5000,
      method: 'Credit Card',
      status: 'completed',
      date: '2024-03-15',
      transactionId: 'TXN-12345',
    },
    {
      id: 2,
      invoiceId: 'INV-002',
      customerName: 'Sarah Johnson',
      amount: 3500,
      method: 'Bank Transfer',
      status: 'completed',
      date: '2024-03-14',
      transactionId: 'TXN-12346',
    },
    {
      id: 3,
      invoiceId: 'INV-003',
      customerName: 'Mike Davis',
      amount: 2000,
      method: 'Check',
      status: 'pending',
      date: '2024-03-13',
      transactionId: 'TXN-12347',
    },
    {
      id: 4,
      invoiceId: 'INV-004',
      customerName: 'Emily Brown',
      amount: 1500,
      method: 'Cash',
      status: 'failed',
      date: '2024-03-12',
      transactionId: 'TXN-12348',
    },
  ]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return COLORS.success;
      case 'pending':
        return COLORS.warning;
      case 'failed':
        return COLORS.error;
      default:
        return COLORS.textLight;
    }
  };

  const totalRevenue = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingAmount = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Info Card */}
        <ContentGlass style={styles.infoCard}>
          <Text style={styles.infoTitle}>Payment Management</Text>
          <Text style={styles.infoText}>
            Track all customer payments, process transactions, and manage payment methods.
          </Text>
        </ContentGlass>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <ContentGlass style={styles.statCard}>
            <Text style={styles.statValue}>{formatCurrency(totalRevenue)}</Text>
            <Text style={styles.statLabel}>Total Revenue</Text>
          </ContentGlass>
          <ContentGlass style={styles.statCard}>
            <Text style={styles.statValue}>{formatCurrency(pendingAmount)}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </ContentGlass>
        </View>

        <View style={styles.statsRow}>
          <ContentGlass style={styles.statCard}>
            <Text style={styles.statValue}>
              {payments.filter(p => p.status === 'completed').length}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </ContentGlass>
          <ContentGlass style={styles.statCard}>
            <Text style={styles.statValue}>
              {payments.filter(p => p.status === 'pending').length}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </ContentGlass>
          <ContentGlass style={styles.statCard}>
            <Text style={styles.statValue}>
              {payments.filter(p => p.status === 'failed').length}
            </Text>
            <Text style={styles.statLabel}>Failed</Text>
          </ContentGlass>
        </View>

        {/* Payments List */}
        {payments.map((payment) => (
          <ContentGlass key={payment.id} style={styles.paymentCard}>
            <View style={styles.paymentHeader}>
              <View style={styles.paymentInfo}>
                <Text style={styles.customerName}>{payment.customerName}</Text>
                <Text style={styles.invoiceId}>Invoice: {payment.invoiceId}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status) }]}>
                <Text style={styles.statusText}>
                  {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                </Text>
              </View>
            </View>

            <View style={styles.paymentDetails}>
              <Text style={styles.amount}>{formatCurrency(payment.amount)}</Text>
              <View style={styles.paymentMeta}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Method:</Text>
                  <Text style={styles.metaValue}>{payment.method}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Date:</Text>
                  <Text style={styles.metaValue}>{formatDate(payment.date)}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Transaction ID:</Text>
                  <Text style={styles.metaValue}>{payment.transactionId}</Text>
                </View>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.viewButton}>
                <Text style={styles.viewButtonText}>View Details</Text>
              </TouchableOpacity>
              {payment.status === 'pending' && (
                <TouchableOpacity style={styles.processButton}>
                  <Text style={styles.processButtonText}>Process</Text>
                </TouchableOpacity>
              )}
              {payment.status === 'failed' && (
                <TouchableOpacity style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              )}
            </View>
          </ContentGlass>
        ))}

        {/* Record Payment Button */}
        <TouchableOpacity style={styles.addButton}>
          <ContentGlass style={styles.addButtonInner}>
            <Text style={styles.addButtonText}>+ Record Payment</Text>
          </ContentGlass>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING[4],
    paddingBottom: SPACING[8],
  },
  infoCard: {
    padding: SPACING[4],
    marginBottom: SPACING[4],
    borderRadius: RADIUS.xl,
  },
  infoTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
    marginBottom: SPACING[2],
  },
  infoText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
    lineHeight: TYPOGRAPHY.lineHeights.relaxed * TYPOGRAPHY.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING[2],
    marginBottom: SPACING[4],
  },
  statCard: {
    flex: 1,
    padding: SPACING[3],
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  statValue: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.primary,
    marginBottom: SPACING[1],
    textAlign: 'center',
  },
  statLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  paymentCard: {
    padding: SPACING[4],
    marginBottom: SPACING[3],
    borderRadius: RADIUS.xl,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING[3],
  },
  paymentInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
    marginBottom: SPACING[1],
  },
  invoiceId: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textLight,
  },
  statusBadge: {
    paddingHorizontal: SPACING[2],
    paddingVertical: SPACING[1],
    borderRadius: RADIUS.base,
  },
  statusText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.white,
  },
  paymentDetails: {
    marginBottom: SPACING[3],
  },
  amount: {
    fontSize: TYPOGRAPHY['2xl'],
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.primary,
    marginBottom: SPACING[3],
  },
  paymentMeta: {
    gap: SPACING[2],
    paddingBottom: SPACING[3],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  metaItem: {
    flexDirection: 'row',
  },
  metaLabel: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
    width: 120,
  },
  metaValue: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.medium,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING[2],
  },
  viewButton: {
    flex: 1,
    paddingVertical: SPACING[2],
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
  },
  viewButtonText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.white,
  },
  processButton: {
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[4],
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.success,
    alignItems: 'center',
  },
  processButtonText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.white,
  },
  retryButton: {
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[4],
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.warning,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.white,
  },
  addButton: {
    marginTop: SPACING[2],
  },
  addButtonInner: {
    padding: SPACING[4],
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.primary,
  },
});

export default PaymentsScreen;
