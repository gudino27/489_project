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
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as invoiceAPI from '../api/invoices';
import { COLORS } from '../constants/colors';
import { ContentGlass, NavGlass } from '../components/GlassView';
import EmailSendModal from '../components/EmailSendModal';
import SMSSendModal from '../components/SMSSendModal';

const TABS = [
  { id: 'details', label: 'Details', icon: '📋' },
  { id: 'payments', label: 'Payments', icon: '💰' },
  { id: 'edit', label: 'Edit', icon: '✏️' },
  { id: 'send', label: 'Send', icon: '📤' },
  { id: 'track', label: 'Track', icon: '📊' },
  { id: 'download', label: 'Download', icon: '📥' },
  { id: 'reminder', label: 'Reminder', icon: '⏰' },
  { id: 'delete', label: 'Delete', icon: '🗑️' },
  { id: 'analytics', label: 'Analytics', icon: '📈' },
];

const InvoiceDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { invoiceId, initialTab } = route.params;

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [activeTab, setActiveTab] = useState(initialTab || 'details');
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    project_description: '',
    notes: '',
    due_date: '',
    discount_amount: '0',
    tax_rate: '0',
    line_items: [],
  });
  const [isEditingInvoice, setIsEditingInvoice] = useState(false);
  const [taxRates, setTaxRates] = useState([]);
  const [trackingData, setTrackingData] = useState(null);
  const [reminderHistory, setReminderHistory] = useState([]);
  const [loadingTracking, setLoadingTracking] = useState(false);
  
  // Tax rate modal state
  const [showTaxRateModal, setShowTaxRateModal] = useState(false);
  const [taxSearchTerm, setTaxSearchTerm] = useState('');
  const [showAddTaxModal, setShowAddTaxModal] = useState(false);
  const [newTaxRate, setNewTaxRate] = useState({
    state_code: '',
    city: '',
    tax_rate: '',
    description: '',
  });
  const [creatingTaxRate, setCreatingTaxRate] = useState(false);
  const [newLineItem, setNewLineItem] = useState({
    title: '',
    description: '',
    quantity: '',
    unit_price: '',
  });
  
  // Email and SMS modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [showSMSModal, setShowSMSModal] = useState(false);
  const [smsSending, setSmsSending] = useState(false);

  useEffect(() => {
    loadInvoiceDetails();
  }, [invoiceId]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const loadInvoiceDetails = async () => {
    try {
      setLoading(true);
      const data = await invoiceAPI.getInvoiceById(invoiceId);
      setInvoice(data);
      
      // Initialize edit form with current invoice data
      setEditForm({
        project_description: data.project_description || '',
        notes: data.notes || '',
        due_date: data.due_date ? new Date(data.due_date).toISOString().split('T')[0] : '',
        discount_amount: String(data.discount_amount || '0'),
        tax_rate: String(data.tax_rate || '0'),
        line_items: data.line_items ? JSON.parse(JSON.stringify(data.line_items)) : [],
      });
    } catch (error) {
      console.error('Error loading invoice:', error);
      Alert.alert('Error', error.error || 'Failed to load invoice');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const loadTaxRates = async () => {
    try {
      const rates = await invoiceAPI.getTaxRates();
      setTaxRates(rates);
    } catch (error) {
      console.error('Error loading tax rates:', error);
    }
  };

  const handleSelectTaxRate = (rate) => {
    // Tax rate from API might be stored as decimal (0.083) or percentage (8.3)
    const taxValue = rate.tax_rate > 1 ? rate.tax_rate : rate.tax_rate * 100;
    setEditForm(prev => ({ ...prev, tax_rate: String(taxValue) }));
    setShowTaxRateModal(false);
    setTaxSearchTerm('');
  };

  const handleCreateTaxRate = async () => {
    if (!newTaxRate.state_code.trim() || !newTaxRate.city.trim() || !newTaxRate.tax_rate) {
      Alert.alert('Error', 'Please fill in State, City, and Tax Rate');
      return;
    }

    try {
      setCreatingTaxRate(true);
      
      // Import necessary modules
      const apiClient = (await import('../api/client')).default;
      
      // Create tax rate via API
      const response = await apiClient.post('/api/admin/tax-rates', {
        state_code: newTaxRate.state_code.toUpperCase(),
        city: newTaxRate.city,
        tax_rate: parseFloat(newTaxRate.tax_rate),
        description: newTaxRate.description || null,
      });

      // Show success
      Alert.alert('Success', 'Tax rate created successfully', [
        {
          text: 'OK',
          onPress: async () => {
            // Reload tax rates
            await loadTaxRates();
            
            // Select the new tax rate
            setEditForm(prev => ({ ...prev, tax_rate: newTaxRate.tax_rate }));
            
            // Reset and close add modal
            setNewTaxRate({ state_code: '', city: '', tax_rate: '', description: '' });
            setShowAddTaxModal(false);
            
            // Close both modals (user is done)
            setShowTaxRateModal(false);
          }
        }
      ]);
    } catch (error) {
      console.error('Error creating tax rate:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to create tax rate');
    } finally {
      setCreatingTaxRate(false);
    }
  };

  const getFilteredTaxRates = () => {
    if (!taxSearchTerm) return taxRates;
    
    const searchLower = taxSearchTerm.toLowerCase();
    return taxRates.filter(rate => 
      rate.city?.toLowerCase().includes(searchLower) ||
      rate.state_code?.toLowerCase().includes(searchLower) ||
      rate.description?.toLowerCase().includes(searchLower)
    );
  };

  const loadTrackingData = async () => {
    try {
      setLoadingTracking(true);
      const allTracking = await invoiceAPI.getInvoiceTracking();
      // Filter for current invoice
      const currentInvoiceTracking = allTracking.find(t => t.id === invoiceId);
      setTrackingData(currentInvoiceTracking || null);
    } catch (error) {
      console.error('Error loading tracking data:', error);
    } finally {
      setLoadingTracking(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'edit') {
      loadTaxRates();
    } else if (activeTab === 'track') {
      loadTrackingData();
    }
  }, [activeTab]);

  const handleEmailInvoice = () => {
    setShowEmailModal(true);
  };

  const handleSendEmail = async (emailData) => {
    try {
      setEmailSending(true);
      await invoiceAPI.emailInvoice(invoiceId, emailData);
      Alert.alert('Success', 'Invoice sent successfully');
      setShowEmailModal(false);
    } catch (error) {
      Alert.alert('Error', error.error || 'Failed to send invoice');
    } finally {
      setEmailSending(false);
    }
  };

  const handleSendSMS = () => {
    setShowSMSModal(true);
  };

  const handleSendSMSMessage = async (smsData) => {
    try {
      setSmsSending(true);
      await invoiceAPI.sendInvoiceSMS(invoiceId, smsData);
      Alert.alert('Success', 'SMS sent successfully');
      setShowSMSModal(false);
    } catch (error) {
      Alert.alert('Error', error.error || 'Failed to send SMS');
    } finally {
      setSmsSending(false);
    }
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

  const calculateEditFormTotals = () => {
    const lineItems = editForm.line_items || [];
    const subtotal = lineItems.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unit_price) || 0;
      return sum + (quantity * unitPrice);
    }, 0);
    
    const taxRate = parseFloat(editForm.tax_rate) || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const discount = parseFloat(editForm.discount_amount) || 0;
    const total = subtotal + taxAmount - discount;
    
    return { subtotal, taxAmount, total };
  };

  const handleAddLineItem = () => {
    // Validate title is required
    if (!newLineItem.title?.trim()) {
      Alert.alert('Error', 'Please enter an item title');
      return;
    }
    
    // Create the item with parsed values
    const itemToAdd = {
      title: newLineItem.title.trim(),
      description: newLineItem.description?.trim() || '',
      quantity: parseFloat(newLineItem.quantity) || 1,
      unit_price: parseFloat(newLineItem.unit_price) || 0,
    };
    
    // Add to line items
    setEditForm(prev => ({
      ...prev,
      line_items: [...prev.line_items, itemToAdd],
    }));
    
    // Clear the form for next item
    setNewLineItem({
      title: '',
      description: '',
      quantity: '',
      unit_price: '',
    });
  };

  const handleUpdateLineItem = (index, field, value) => {
    setEditForm(prev => {
      const newLineItems = [...prev.line_items];
      newLineItems[index] = {
        ...newLineItems[index],
        [field]: value,
      };
      return { ...prev, line_items: newLineItems };
    });
  };

  const handleDeleteLineItem = (index) => {
    Alert.alert(
      'Delete Line Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setEditForm(prev => ({
              ...prev,
              line_items: prev.line_items.filter((_, i) => i !== index),
            }));
          },
        },
      ]
    );
  };

  const handleSaveEdit = async () => {
    try {
      setIsEditingInvoice(true);
      
      const totals = calculateEditFormTotals();
      
      const updateData = {
        project_description: editForm.project_description,
        notes: editForm.notes,
        due_date: editForm.due_date || null,
        discount_amount: parseFloat(editForm.discount_amount) || 0,
        tax_rate: parseFloat(editForm.tax_rate) || 0,
        line_items: editForm.line_items,
        subtotal: totals.subtotal,
        tax_amount: totals.taxAmount,
        total_amount: totals.total,
      };
      
      await invoiceAPI.updateInvoice(invoiceId, updateData);
      Alert.alert('Success', 'Invoice updated successfully');
      
      // Reload invoice data
      await loadInvoiceDetails();
      
      // Switch to details tab
      setActiveTab('details');
    } catch (error) {
      console.error('Error updating invoice:', error);
      Alert.alert('Error', error.error || 'Failed to update invoice');
    } finally {
      setIsEditingInvoice(false);
    }
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

  // Tab render functions
  const renderDetailsTab = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollContent}>
      {/* Client Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Client Information</Text>
        <ContentGlass style={styles.infoCard}>
          <Text style={styles.clientName}>
            {invoice.is_business
              ? invoice.company_name
              : `${invoice.first_name} ${invoice.last_name}`}
          </Text>
          {invoice.email && <Text style={styles.infoText}>📧 {invoice.email}</Text>}
          {invoice.phone && <Text style={styles.infoText}>📱 {invoice.phone}</Text>}
          {invoice.address && <Text style={styles.infoText}>📍 {invoice.address}</Text>}
        </ContentGlass>
      </View>

      {/* Invoice Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Invoice Details</Text>
        <ContentGlass style={styles.infoCard}>
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
        </ContentGlass>
      </View>

      {/* Line Items */}
      {invoice.line_items && invoice.line_items.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Line Items</Text>
          {invoice.line_items.map((item, index) => {
            const quantity = parseFloat(item.quantity) || 1;
            const unitPrice = parseFloat(item.unit_price) || 0;
            const total = quantity * unitPrice;
            
            return (
              <ContentGlass key={index} style={styles.lineItem}>
                <View style={styles.lineItemHeader}>
                  <Text style={styles.lineItemName}>{item.title || item.description || item.label || 'Unnamed Item'}</Text>
                  <Text style={styles.lineItemAmount}>{formatCurrency(total)}</Text>
                </View>
                <Text style={styles.lineItemDetails}>
                  Qty: {quantity} × {formatCurrency(unitPrice)} per unit
                </Text>
                {item.description && item.title && (
                  <Text style={styles.lineItemDescription}>{item.description}</Text>
                )}
              </ContentGlass>
            );
          })}
        </View>
      )}

      {/* Totals */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Totals</Text>
        <ContentGlass style={styles.totalsCard}>
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
        </ContentGlass>
      </View>

      {/* Notes */}
      {invoice.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <ContentGlass style={styles.infoCard}>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </ContentGlass>
        </View>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderPaymentsTab = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment History</Text>
        {invoice.payments && invoice.payments.length > 0 ? (
          invoice.payments.map((payment, index) => (
            <ContentGlass key={index} style={styles.paymentItem}>
              <View style={styles.paymentHeader}>
                <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
                <Text style={styles.paymentDate}>{formatDate(payment.payment_date)}</Text>
              </View>
              {payment.payment_method && (
                <Text style={styles.paymentMethod}>Method: {payment.payment_method}</Text>
              )}
              {payment.notes && <Text style={styles.paymentNotes}>{payment.notes}</Text>}
            </ContentGlass>
          ))
        ) : (
          <ContentGlass style={styles.emptyState}>
            <Text style={styles.emptyText}>💰 No payments recorded yet</Text>
          </ContentGlass>
        )}
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleAddPayment}
      >
        <Text style={styles.primaryButtonText}>➕ Add Payment</Text>
      </TouchableOpacity>

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderEditTab = () => {
    const totals = calculateEditFormTotals();
    
    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Edit Invoice</Text>
          
          <ContentGlass style={styles.formCard}>
            {/* Invoice Number (Read-only) */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Invoice Number</Text>
              <View style={styles.readOnlyInput}>
                <Text style={styles.readOnlyText}>{invoice.invoice_number}</Text>
              </View>
            </View>

            {/* Client (Read-only) */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Client</Text>
              <View style={styles.readOnlyInput}>
                <Text style={styles.readOnlyText}>
                  {invoice.is_business
                    ? invoice.company_name
                    : `${invoice.first_name} ${invoice.last_name}`}
                </Text>
              </View>
            </View>

            {/* Project Description */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Project Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editForm.project_description}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, project_description: text }))}
                placeholder="Enter project description..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Due Date */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Due Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={editForm.due_date}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, due_date: text }))}
                placeholder="2024-12-31"
              />
            </View>

            {/* Tax Rate Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Tax Rate (%)</Text>
              <TouchableOpacity
                style={styles.taxRateSelector}
                onPress={() => setShowTaxRateModal(true)}
              >
                <Text style={styles.taxRateSelectorText}>
                  {editForm.tax_rate ? `${parseFloat(editForm.tax_rate).toFixed(3)}%` : 'Select tax rate...'}
                </Text>
                <Text style={styles.taxRateSelectorIcon}>▼</Text>
              </TouchableOpacity>
              <Text style={styles.helperText}>
                Tap to select from available tax rates or add a new one
              </Text>
            </View>

            {/* Discount Amount */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Discount Amount ($)</Text>
              <TextInput
                style={styles.input}
                value={editForm.discount_amount}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, discount_amount: text }))}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>
          </ContentGlass>
        </View>

        {/* Line Items Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Line Items</Text>
          </View>

          {/* Add New Line Item Form - TOP */}
          <ContentGlass style={[styles.editLineItem, styles.addLineItemForm]}>
            <View style={styles.lineItemEditHeader}>
              <Text style={styles.addItemTitle}>➕ Add New Item</Text>
            </View>

            <TextInput
              style={styles.lineItemTitleInput}
              value={newLineItem.title}
              onChangeText={(text) => setNewLineItem(prev => ({ ...prev, title: text }))}
              placeholder="Item title *"
              editable={!isEditingInvoice}
            />

            <View style={styles.lineItemInputRow}>
              <View style={styles.lineItemInputGroup}>
                <Text style={styles.lineItemInputLabel}>Qty</Text>
                <TextInput
                  style={styles.lineItemInput}
                  value={newLineItem.quantity}
                  onChangeText={(text) => setNewLineItem(prev => ({ ...prev, quantity: text }))}
                  keyboardType="decimal-pad"
                  placeholder="1"
                  editable={!isEditingInvoice}
                />
              </View>

              <View style={styles.lineItemInputGroup}>
                <Text style={styles.lineItemInputLabel}>Unit Price ($)</Text>
                <TextInput
                  style={styles.lineItemInput}
                  value={newLineItem.unit_price}
                  onChangeText={(text) => setNewLineItem(prev => ({ ...prev, unit_price: text }))}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  editable={!isEditingInvoice}
                />
              </View>

              <View style={styles.lineItemInputGroup}>
                <Text style={styles.lineItemInputLabel}>Total</Text>
                <View style={styles.lineItemTotal}>
                  <Text style={styles.lineItemTotalText}>
                    {formatCurrency((parseFloat(newLineItem.quantity) || 0) * (parseFloat(newLineItem.unit_price) || 0))}
                  </Text>
                </View>
              </View>
            </View>

            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              value={newLineItem.description}
              onChangeText={(text) => setNewLineItem(prev => ({ ...prev, description: text }))}
              placeholder="Item description (optional)"
              editable={!isEditingInvoice}
            />

            <TouchableOpacity
              style={styles.addLineItemButton}
              onPress={handleAddLineItem}
              disabled={isEditingInvoice}
            >
              <Text style={styles.addLineItemButtonText}>+ Add Item</Text>
            </TouchableOpacity>
          </ContentGlass>

          {/* Existing Line Items - BELOW */}
          {editForm.line_items.map((item, index) => (
            <ContentGlass key={index} style={styles.editLineItem}>
              <View style={styles.lineItemEditHeader}>
                <TextInput
                  style={styles.lineItemTitleInput}
                  value={item.title || item.description}
                  onChangeText={(text) => handleUpdateLineItem(index, 'title', text)}
                  placeholder="Item title"
                  editable={!isEditingInvoice}
                />
                <TouchableOpacity
                  style={styles.deleteItemButton}
                  onPress={() => handleDeleteLineItem(index)}
                  disabled={isEditingInvoice}
                >
                  <Text style={styles.deleteItemText}>🗑️</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.lineItemInputRow}>
                <View style={styles.lineItemInputGroup}>
                  <Text style={styles.lineItemInputLabel}>Qty</Text>
                  <TextInput
                    style={styles.lineItemInput}
                    value={item.quantity === '' ? '' : String(item.quantity)}
                    onChangeText={(text) => handleUpdateLineItem(index, 'quantity', text)}
                    keyboardType="decimal-pad"
                    placeholder="1"
                    editable={!isEditingInvoice}
                  />
                </View>

                <View style={styles.lineItemInputGroup}>
                  <Text style={styles.lineItemInputLabel}>Unit Price ($)</Text>
                  <TextInput
                    style={styles.lineItemInput}
                    value={item.unit_price === '' ? '' : String(item.unit_price)}
                    onChangeText={(text) => handleUpdateLineItem(index, 'unit_price', text)}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    editable={!isEditingInvoice}
                  />
                </View>

                <View style={styles.lineItemInputGroup}>
                  <Text style={styles.lineItemInputLabel}>Total</Text>
                  <View style={styles.lineItemTotal}>
                    <Text style={styles.lineItemTotalText}>
                      {formatCurrency((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0))}
                    </Text>
                  </View>
                </View>
              </View>

              <TextInput
                style={[styles.input, { marginTop: 8 }]}
                value={item.description || ''}
                onChangeText={(text) => handleUpdateLineItem(index, 'description', text)}
                placeholder="Item description (optional)"
                editable={!isEditingInvoice}
              />
            </ContentGlass>
          ))}

          {editForm.line_items.length === 0 && (
            <ContentGlass style={styles.emptyState}>
              <Text style={styles.emptyText}>No line items yet. Add one above.</Text>
            </ContentGlass>
          )}
        </View>

        {/* Totals Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Updated Totals</Text>
          <ContentGlass style={styles.totalsCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>{formatCurrency(totals.subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax ({editForm.tax_rate}%):</Text>
              <Text style={styles.totalValue}>{formatCurrency(totals.taxAmount)}</Text>
            </View>
            {parseFloat(editForm.discount_amount) > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount:</Text>
                <Text style={[styles.totalValue, { color: COLORS.success }]}>
                  -{formatCurrency(editForm.discount_amount)}
                </Text>
              </View>
            )}
            <View style={styles.totalRowFinal}>
              <Text style={styles.totalLabelFinal}>New Total:</Text>
              <Text style={styles.totalValueFinal}>{formatCurrency(totals.total)}</Text>
            </View>
          </ContentGlass>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <ContentGlass style={styles.formCard}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editForm.notes}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, notes: text }))}
                placeholder="Add any additional notes..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </ContentGlass>
        </View>

        {/* Action Buttons */}
        <View style={styles.formButtons}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => {
              // Reset form to original values
              setEditForm({
                project_description: invoice.project_description || '',
                notes: invoice.notes || '',
                due_date: invoice.due_date ? new Date(invoice.due_date).toISOString().split('T')[0] : '',
                discount_amount: String(invoice.discount_amount || '0'),
                tax_rate: String(invoice.tax_rate || '0'),
                line_items: invoice.line_items ? JSON.parse(JSON.stringify(invoice.line_items)) : [],
              });
              setActiveTab('details');
            }}
            disabled={isEditingInvoice}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSaveEdit}
            disabled={isEditingInvoice}
          >
            {isEditingInvoice ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.saveButtonText}>💾 Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    );
  };

  const renderSendTab = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Send Invoice</Text>
        
        <TouchableOpacity
          style={[styles.sendButton, styles.emailButton]}
          onPress={handleEmailInvoice}
          disabled={!!actionLoading}
        >
          {actionLoading === 'email' ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <>
              <Text style={styles.sendButtonIcon}>✉️</Text>
              <Text style={styles.sendButtonText}>Send via Email</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sendButton, styles.smsButton]}
          onPress={handleSendSMS}
          disabled={!!actionLoading || !invoice.phone}
        >
          {actionLoading === 'sms' ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <>
              <Text style={styles.sendButtonIcon}>💬</Text>
              <Text style={styles.sendButtonText}>Send via SMS</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sendButton, styles.shareButton]}
          onPress={handleShareInvoice}
        >
          <Text style={styles.sendButtonIcon}>🔗</Text>
          <Text style={styles.sendButtonText}>Share Link</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderTrackTab = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Invoice Tracking</Text>
        
        {loadingTracking ? (
          <ContentGlass style={styles.emptyState}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.emptyText}>Loading tracking data...</Text>
          </ContentGlass>
        ) : trackingData ? (
          <>
            {/* View Count Card */}
            <ContentGlass style={styles.trackingCard}>
              <View style={styles.trackingHeader}>
                <Text style={styles.trackingIcon}>👁️</Text>
                <View style={styles.trackingInfo}>
                  <Text style={styles.trackingLabel}>Total Views</Text>
                  <Text style={styles.trackingValue}>{trackingData.view_count || 0}</Text>
                </View>
              </View>
              <Text style={styles.trackingNote}>
                {trackingData.is_viewed 
                  ? '✅ Invoice has been viewed by client' 
                  : '⏳ Not yet viewed by client'}
              </Text>
            </ContentGlass>

            {/* Last Viewed */}
            {trackingData.last_viewed && (
              <ContentGlass style={styles.trackingCard}>
                <View style={styles.trackingHeader}>
                  <Text style={styles.trackingIcon}>�</Text>
                  <View style={styles.trackingInfo}>
                    <Text style={styles.trackingLabel}>Last Viewed</Text>
                    <Text style={styles.trackingValue}>{formatDate(trackingData.last_viewed)}</Text>
                  </View>
                </View>
              </ContentGlass>
            )}

            {/* Location Data */}
            {(trackingData.city || trackingData.country) && (
              <ContentGlass style={styles.trackingCard}>
                <View style={styles.trackingHeader}>
                  <Text style={styles.trackingIcon}>📍</Text>
                  <View style={styles.trackingInfo}>
                    <Text style={styles.trackingLabel}>Location</Text>
                    <Text style={styles.trackingValue}>
                      {trackingData.city && trackingData.region 
                        ? `${trackingData.city}, ${trackingData.region}` 
                        : trackingData.city || trackingData.region || 'Unknown'}
                    </Text>
                    {trackingData.country && (
                      <Text style={styles.trackingSubtext}>{trackingData.country}</Text>
                    )}
                  </View>
                </View>
              </ContentGlass>
            )}

            {/* Link Status */}
            <ContentGlass style={styles.trackingCard}>
              <View style={styles.trackingHeader}>
                <Text style={styles.trackingIcon}>🔗</Text>
                <View style={styles.trackingInfo}>
                  <Text style={styles.trackingLabel}>Link Status</Text>
                  <Text style={[
                    styles.trackingValue,
                    { color: trackingData.has_token ? COLORS.success : COLORS.textLight }
                  ]}>
                    {trackingData.has_token ? 'Active Link' : 'No Link Generated'}
                  </Text>
                </View>
              </View>
              {trackingData.has_token && invoice.token && (
                <TouchableOpacity
                  style={styles.copyLinkButton}
                  onPress={() => {
                    Share.share({
                      message: `https://gudinocustom.com/invoice/${invoice.token}`,
                    });
                  }}
                >
                  <Text style={styles.copyLinkText}>📋 Share Link</Text>
                </TouchableOpacity>
              )}
            </ContentGlass>
          </>
        ) : (
          <ContentGlass style={styles.emptyState}>
            <Text style={styles.placeholderIcon}>📊</Text>
            <Text style={styles.placeholderTitle}>No Tracking Data</Text>
            <Text style={styles.placeholderText}>
              Tracking data will appear once the invoice is viewed
            </Text>
          </ContentGlass>
        )}
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderDownloadTab = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Download Invoice</Text>
        
        <TouchableOpacity
          style={[styles.sendButton, styles.pdfButton]}
          onPress={handleDownloadPDF}
          disabled={!!actionLoading}
        >
          {actionLoading === 'pdf' ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <>
              <Text style={styles.sendButtonIcon}>📄</Text>
              <Text style={styles.sendButtonText}>Generate PDF</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderReminderTab = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Reminders</Text>
        
        {/* Send Reminder Buttons */}
        <ContentGlass style={styles.formCard}>
          <Text style={styles.formLabel}>Send Payment Reminder</Text>
          
          <TouchableOpacity
            style={[styles.sendButton, styles.emailButton]}
            onPress={handleEmailInvoice}
            disabled={!!actionLoading || !invoice.email}
          >
            {actionLoading === 'email' ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <>
                <Text style={styles.sendButtonIcon}>✉️</Text>
                <Text style={styles.sendButtonText}>Send Email Reminder</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sendButton, styles.smsButton]}
            onPress={handleSendSMS}
            disabled={!!actionLoading || !invoice.phone}
          >
            {actionLoading === 'sms' ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <>
                <Text style={styles.sendButtonIcon}>💬</Text>
                <Text style={styles.sendButtonText}>Send SMS Reminder</Text>
              </>
            )}
          </TouchableOpacity>
        </ContentGlass>

        {/* Reminder History */}
        <Text style={styles.sectionTitle}>Reminder History</Text>
        {reminderHistory.length > 0 ? (
          reminderHistory.map((reminder, index) => (
            <ContentGlass key={index} style={styles.reminderCard}>
              <View style={styles.reminderHeader}>
                <Text style={styles.reminderType}>
                  {reminder.reminder_type === 'both' ? '📧💬 Email & SMS' :
                   reminder.reminder_type === 'email' ? '📧 Email' : '💬 SMS'}
                </Text>
                <Text style={styles.reminderDate}>{formatDate(reminder.sent_date)}</Text>
              </View>
              {reminder.custom_message && (
                <Text style={styles.reminderMessage}>{reminder.custom_message}</Text>
              )}
            </ContentGlass>
          ))
        ) : (
          <ContentGlass style={styles.emptyState}>
            <Text style={styles.placeholderIcon}>⏰</Text>
            <Text style={styles.placeholderText}>No reminders sent yet</Text>
          </ContentGlass>
        )}

        {/* Invoice Status Info */}
        <ContentGlass style={styles.statusInfoCard}>
          <Text style={styles.statusInfoTitle}>Invoice Status</Text>
          <View style={styles.statusInfoRow}>
            <Text style={styles.statusInfoLabel}>Status:</Text>
            <View style={[styles.statusBadgeSmall, { backgroundColor: getStatusColor(invoice.status) }]}>
              <Text style={styles.statusTextSmall}>{invoice.status?.toUpperCase()}</Text>
            </View>
          </View>
          {invoice.due_date && (
            <View style={styles.statusInfoRow}>
              <Text style={styles.statusInfoLabel}>Due Date:</Text>
              <Text style={styles.statusInfoValue}>{formatDate(invoice.due_date)}</Text>
            </View>
          )}
          <View style={styles.statusInfoRow}>
            <Text style={styles.statusInfoLabel}>Amount Due:</Text>
            <Text style={[styles.statusInfoValue, { fontWeight: 'bold', color: COLORS.primary }]}>
              {formatCurrency(invoice.total_amount)}
            </Text>
          </View>
        </ContentGlass>
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderDeleteTab = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollContent}>
      <View style={styles.section}>
        <ContentGlass style={styles.dangerCard}>
          <Text style={styles.dangerIcon}>⚠️</Text>
          <Text style={styles.dangerTitle}>Delete Invoice</Text>
          <Text style={styles.dangerText}>
            This action cannot be undone. The invoice and all associated data will be permanently deleted.
          </Text>
          
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleDeleteInvoice}
            disabled={!!actionLoading}
          >
            {actionLoading === 'delete' ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.dangerButtonText}>🗑️ Delete Invoice</Text>
            )}
          </TouchableOpacity>
        </ContentGlass>
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderAnalyticsTab = () => {
    const daysOutstanding = invoice.created_at 
      ? Math.floor((new Date() - new Date(invoice.created_at)) / (1000 * 60 * 60 * 24))
      : 0;
    
    const daysTillDue = invoice.due_date
      ? Math.floor((new Date(invoice.due_date) - new Date()) / (1000 * 60 * 60 * 24))
      : null;
    
    const paymentPercentage = invoice.payments && invoice.payments.length > 0
      ? (invoice.payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) / invoice.total_amount) * 100
      : 0;
    
    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invoice Analytics</Text>
          
          {/* Status Overview */}
          <ContentGlass style={styles.analyticsCard}>
            <Text style={styles.analyticsCardTitle}>📊 Status Overview</Text>
            <View style={styles.analyticsGrid}>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsLabel}>Status</Text>
                <View style={[styles.statusBadgeSmall, { backgroundColor: getStatusColor(invoice.status) }]}>
                  <Text style={styles.statusTextSmall}>{invoice.status?.toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsLabel}>Days Outstanding</Text>
                <Text style={styles.analyticsValue}>{daysOutstanding} days</Text>
              </View>
              {daysTillDue !== null && (
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsLabel}>Days Till Due</Text>
                  <Text style={[
                    styles.analyticsValue,
                    { color: daysTillDue < 0 ? COLORS.error : daysTillDue < 7 ? COLORS.warning : COLORS.success }
                  ]}>
                    {daysTillDue < 0 ? `${Math.abs(daysTillDue)} days overdue` : `${daysTillDue} days`}
                  </Text>
                </View>
              )}
            </View>
          </ContentGlass>

          {/* Financial Breakdown */}
          <ContentGlass style={styles.analyticsCard}>
            <Text style={styles.analyticsCardTitle}>💰 Financial Breakdown</Text>
            <View style={styles.analyticsBreakdown}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Subtotal</Text>
                <Text style={styles.breakdownValue}>{formatCurrency(invoice.subtotal || 0)}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Tax ({invoice.tax_rate || 0}%)</Text>
                <Text style={styles.breakdownValue}>{formatCurrency(invoice.tax_amount || 0)}</Text>
              </View>
              {invoice.discount_amount > 0 && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Discount</Text>
                  <Text style={[styles.breakdownValue, { color: COLORS.success }]}>
                    -{formatCurrency(invoice.discount_amount)}
                  </Text>
                </View>
              )}
              <View style={[styles.breakdownRow, styles.breakdownTotal]}>
                <Text style={styles.breakdownTotalLabel}>Total</Text>
                <Text style={styles.breakdownTotalValue}>{formatCurrency(invoice.total_amount)}</Text>
              </View>
            </View>
          </ContentGlass>

          {/* Payment Progress */}
          {invoice.payments && invoice.payments.length > 0 && (
            <ContentGlass style={styles.analyticsCard}>
              <Text style={styles.analyticsCardTitle}>💵 Payment Progress</Text>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[
                    styles.progressFill,
                    { width: `${Math.min(paymentPercentage, 100)}%` }
                  ]} />
                </View>
                <Text style={styles.progressText}>
                  {paymentPercentage.toFixed(1)}% paid ({invoice.payments.length} payment{invoice.payments.length !== 1 ? 's' : ''})
                </Text>
              </View>
              
              <View style={styles.paymentSummary}>
                <View style={styles.paymentSummaryItem}>
                  <Text style={styles.paymentSummaryLabel}>Total Paid</Text>
                  <Text style={styles.paymentSummaryValue}>
                    {formatCurrency(invoice.payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0))}
                  </Text>
                </View>
                <View style={styles.paymentSummaryItem}>
                  <Text style={styles.paymentSummaryLabel}>Remaining</Text>
                  <Text style={[styles.paymentSummaryValue, { color: COLORS.error }]}>
                    {formatCurrency(invoice.total_amount - invoice.payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0))}
                  </Text>
                </View>
              </View>
            </ContentGlass>
          )}

          {/* Line Items Breakdown */}
          {invoice.line_items && invoice.line_items.length > 0 && (
            <ContentGlass style={styles.analyticsCard}>
              <Text style={styles.analyticsCardTitle}>📦 Line Items ({invoice.line_items.length})</Text>
              {invoice.line_items.map((item, index) => {
                const qty = parseFloat(item.quantity) || 1;
                const price = parseFloat(item.unit_price) || 0;
                const total = qty * price;
                const percentage = (total / (invoice.subtotal || 1)) * 100;
                
                return (
                  <View key={index} style={styles.lineItemAnalytics}>
                    <View style={styles.lineItemAnalyticsHeader}>
                      <Text style={styles.lineItemAnalyticsName}>{item.title || item.description || 'Item'}</Text>
                      <Text style={styles.lineItemAnalyticsAmount}>{formatCurrency(total)}</Text>
                    </View>
                    <View style={styles.lineItemAnalyticsBar}>
                      <View style={[
                        styles.lineItemAnalyticsFill,
                        { width: `${percentage}%` }
                      ]} />
                    </View>
                    <Text style={styles.lineItemAnalyticsDetails}>
                      {qty} × {formatCurrency(price)} ({percentage.toFixed(1)}% of subtotal)
                    </Text>
                  </View>
                );
              })}
            </ContentGlass>
          )}

          {/* Tracking Stats */}
          {trackingData && (
            <ContentGlass style={styles.analyticsCard}>
              <Text style={styles.analyticsCardTitle}>👁️ Engagement</Text>
              <View style={styles.analyticsGrid}>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsLabel}>Views</Text>
                  <Text style={styles.analyticsValue}>{trackingData.view_count || 0}</Text>
                </View>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsLabel}>Status</Text>
                  <Text style={[
                    styles.analyticsValue,
                    { color: trackingData.is_viewed ? COLORS.success : COLORS.textLight }
                  ]}>
                    {trackingData.is_viewed ? 'Viewed' : 'Not Viewed'}
                  </Text>
                </View>
              </View>
            </ContentGlass>
          )}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    );
  };

  const renderTaxRateModal = () => {
    if (!showTaxRateModal) return null;
    
    return (
      <Modal
        visible={showTaxRateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowTaxRateModal(false);
          setTaxSearchTerm('');
        }}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowTaxRateModal(false);
            setTaxSearchTerm('');
          }}
        >
          <TouchableOpacity 
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContainer}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Tax Rate</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowTaxRateModal(false);
                  setTaxSearchTerm('');
                }}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <TextInput
              style={styles.searchInput}
              value={taxSearchTerm}
              onChangeText={setTaxSearchTerm}
              placeholder="Search by city, state, or description..."
              placeholderTextColor={COLORS.textLight}
            />

            {/* Add New Tax Rate Button */}
            <TouchableOpacity
              style={styles.addNewTaxButton}
              onPress={() => {
                setShowTaxRateModal(false);
                setShowAddTaxModal(true);
              }}
            >
              <Text style={styles.addNewTaxButtonText}>➕ Add New Tax Rate</Text>
            </TouchableOpacity>

            {/* Tax Rates List */}
            <FlatList
              data={getFilteredTaxRates()}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => {
                const displayRate = item.tax_rate > 1 ? item.tax_rate : item.tax_rate * 100;
                return (
                  <TouchableOpacity
                    style={styles.taxRateItem}
                    onPress={() => handleSelectTaxRate(item)}
                  >
                    <View style={styles.taxRateInfo}>
                      <Text style={styles.taxRateLocation}>
                        {item.city}, {item.state_code}
                      </Text>
                      {item.description && (
                        <Text style={styles.taxRateDescription}>{item.description}</Text>
                      )}
                    </View>
                    <Text style={styles.taxRateValue}>{displayRate.toFixed(3)}%</Text>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyTaxList}>
                  <Text style={styles.emptyTaxText}>
                    {taxSearchTerm ? 'No tax rates found' : 'No tax rates available'}
                  </Text>
                </View>
              }
              style={styles.taxRateList}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  };

  const renderAddTaxModal = () => {
    if (!showAddTaxModal) return null;
    
    return (
      <Modal
        visible={showAddTaxModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowAddTaxModal(false);
          setNewTaxRate({ state_code: '', city: '', tax_rate: '', description: '' });
          setShowTaxRateModal(true);
        }}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowAddTaxModal(false);
            setNewTaxRate({ state_code: '', city: '', tax_rate: '', description: '' });
            setShowTaxRateModal(true);
          }}
        >
          <TouchableOpacity 
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContainer}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Tax Rate</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddTaxModal(false);
                  setNewTaxRate({ state_code: '', city: '', tax_rate: '', description: '' });
                  setShowTaxRateModal(true);
                }}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.addTaxForm}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>State Code *</Text>
                <TextInput
                  style={styles.input}
                  value={newTaxRate.state_code}
                  onChangeText={(text) => setNewTaxRate(prev => ({ ...prev, state_code: text.toUpperCase() }))}
                  placeholder="WA"
                  maxLength={2}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>City *</Text>
                <TextInput
                  style={styles.input}
                  value={newTaxRate.city}
                  onChangeText={(text) => setNewTaxRate(prev => ({ ...prev, city: text }))}
                  placeholder="Sunnyside"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Tax Rate (%) *</Text>
                <TextInput
                  style={styles.input}
                  value={newTaxRate.tax_rate}
                  onChangeText={(text) => setNewTaxRate(prev => ({ ...prev, tax_rate: text }))}
                  placeholder="8.3"
                  keyboardType="decimal-pad"
                />
                <Text style={styles.helperText}>Enter as percentage (e.g., 8.3 for 8.3%)</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newTaxRate.description}
                  onChangeText={(text) => setNewTaxRate(prev => ({ ...prev, description: text }))}
                  placeholder="Combined city and state tax"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setShowAddTaxModal(false);
                  setNewTaxRate({ state_code: '', city: '', tax_rate: '', description: '' });
                  setShowTaxRateModal(true);
                }}
                disabled={creatingTaxRate}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalSaveButton]}
                onPress={handleCreateTaxRate}
                disabled={creatingTaxRate}
              >
                {creatingTaxRate ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.modalSaveButtonText}>Create Tax Rate</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'details':
        return renderDetailsTab();
      case 'payments':
        return renderPaymentsTab();
      case 'edit':
        return renderEditTab();
      case 'send':
        return renderSendTab();
      case 'track':
        return renderTrackTab();
      case 'download':
        return renderDownloadTab();
      case 'reminder':
        return renderReminderTab();
      case 'delete':
        return renderDeleteTab();
      case 'analytics':
        return renderAnalyticsTab();
      default:
        return renderDetailsTab();
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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(invoice.status) }]}>
            <Text style={styles.statusText}>{invoice.status?.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* Tab Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
      >
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && styles.activeTab,
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[
              styles.tabLabel,
              activeTab === tab.id && styles.activeTabLabel,
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Tax Rate Selection Modal */}
      {renderTaxRateModal()}

      {/* Add Tax Rate Modal */}
      {renderAddTaxModal()}

      {/* Email Send Modal */}
      <EmailSendModal
        visible={showEmailModal}
        invoice={invoice}
        onClose={() => setShowEmailModal(false)}
        onSend={handleSendEmail}
        sending={emailSending}
      />

      {/* SMS Send Modal */}
      <SMSSendModal
        visible={showSMSModal}
        invoice={invoice}
        onClose={() => setShowSMSModal(false)}
        onSend={handleSendSMSMessage}
        sending={smsSending}
      />
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
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textLight,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
  },
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  tabBar: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    maxHeight: 60,
  },
  tabBarContent: {
    paddingHorizontal: 8,
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
  activeTab: {
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
  activeTabLabel: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  tabContent: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
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
    borderRadius: 12,
    padding: 16,
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
    borderRadius: 12,
    padding: 16,
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
  emptyState: {
    padding: 40,
    alignItems: 'center',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  emailButton: {
    backgroundColor: COLORS.info,
  },
  smsButton: {
    backgroundColor: COLORS.success,
  },
  shareButton: {
    backgroundColor: COLORS.primary,
  },
  pdfButton: {
    backgroundColor: COLORS.primary,
  },
  sendButtonIcon: {
    fontSize: 24,
  },
  sendButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  placeholderCard: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 40,
  },
  placeholderIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  dangerCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.error,
  },
  dangerIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  dangerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.error,
    marginBottom: 12,
  },
  dangerText: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  dangerButton: {
    backgroundColor: COLORS.error,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  formCard: {
    borderRadius: 12,
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.text,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 10,
  },
  readOnlyInput: {
    backgroundColor: COLORS.lightGray,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  readOnlyText: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.lightGray,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  editLineItem: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  lineItemEditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  lineItemTitleInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  deleteItemButton: {
    padding: 8,
  },
  deleteItemText: {
    fontSize: 20,
  },
  lineItemInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  lineItemInputGroup: {
    flex: 1,
  },
  lineItemInputLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  lineItemInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
  },
  lineItemTotal: {
    backgroundColor: COLORS.lightGray,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    justifyContent: 'center',
  },
  lineItemTotalText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  lineItemDescription: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 4,
    fontStyle: 'italic',
  },
  addLineItemForm: {
    backgroundColor: COLORS.primary + '08',
    borderWidth: 2,
    borderColor: COLORS.primary + '30',
    borderStyle: 'dashed',
  },
  addItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 8,
  },
  addLineItemButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  addLineItemButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  trackingCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  trackingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trackingIcon: {
    fontSize: 32,
  },
  trackingInfo: {
    flex: 1,
  },
  trackingLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  trackingValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  trackingSubtext: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
  },
  trackingNote: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 12,
  },
  copyLinkButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 12,
    alignItems: 'center',
  },
  copyLinkText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  reminderCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reminderType: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  reminderDate: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  reminderMessage: {
    fontSize: 14,
    color: COLORS.text,
    fontStyle: 'italic',
  },
  statusInfoCard: {
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    backgroundColor: COLORS.lightGray + '80',
  },
  statusInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  statusInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusInfoLabel: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  statusInfoValue: {
    fontSize: 14,
    color: COLORS.text,
  },
  statusBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusTextSmall: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  analyticsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  analyticsCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  analyticsItem: {
    flex: 1,
    minWidth: '45%',
  },
  analyticsLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 6,
  },
  analyticsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  analyticsBreakdown: {
    gap: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  breakdownLabel: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  breakdownTotal: {
    borderBottomWidth: 0,
    borderTopWidth: 2,
    borderTopColor: COLORS.border,
    marginTop: 8,
    paddingTop: 12,
  },
  breakdownTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  breakdownTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 12,
    backgroundColor: COLORS.lightGray,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  paymentSummary: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentSummaryItem: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    padding: 12,
    borderRadius: 8,
  },
  paymentSummaryLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  paymentSummaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  lineItemAnalytics: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  lineItemAnalyticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  lineItemAnalyticsName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  lineItemAnalyticsAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  lineItemAnalyticsBar: {
    height: 6,
    backgroundColor: COLORS.lightGray,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  lineItemAnalyticsFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  lineItemAnalyticsDetails: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  taxRateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  taxRateSelectorText: {
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
  },
  taxRateSelectorIcon: {
    fontSize: 14,
    color: COLORS.textLight,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 24,
    color: COLORS.textLight,
  },
  searchInput: {
    backgroundColor: COLORS.lightGray,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.text,
    margin: 16,
  },
  addNewTaxButton: {
    backgroundColor: COLORS.success,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  addNewTaxButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  taxRateList: {
    maxHeight: 400,
  },
  taxRateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  taxRateInfo: {
    flex: 1,
  },
  taxRateLocation: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  taxRateDescription: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  taxRateValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 12,
  },
  emptyTaxList: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTaxText: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  addTaxForm: {
    padding: 16,
    maxHeight: 400,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButton: {
    backgroundColor: COLORS.lightGray,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalCancelButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  modalSaveButton: {
    backgroundColor: COLORS.primary,
  },
  modalSaveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default InvoiceDetailsScreen;
