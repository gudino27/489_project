import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as invoiceAPI from '../api/invoices';
import { COLORS } from '../constants/colors';
import { ContentGlass, NavGlass } from '../components/GlassView';

const CreateInvoiceScreen = () => {
  const navigation = useNavigation();

  // Form state
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  const [lineItems, setLineItems] = useState([]);
  const [newLineItem, setNewLineItem] = useState({
    title: '',
    description: '',
    quantity: '1',
    unit_price: '75',
  });

  const [taxRate, setTaxRate] = useState('0');
  const [discountAmount, setDiscountAmount] = useState('0');

  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);

  useEffect(() => {
    loadClients();
    generateInvoiceNumber();
  }, []);

  useEffect(() => {
    if (clientSearch.length >= 2) {
      searchClients();
    } else {
      setSearchResults([]);
      setShowClientDropdown(false);
    }
  }, [clientSearch]);

  const loadClients = async () => {
    try {
      const data = await invoiceAPI.getAllClients();
      setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
      // Don't show error to user, just log it
      // The user can still create invoices by typing client info manually
    }
  };

  const generateInvoiceNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    setInvoiceNumber(`INV-${timestamp}`);
  };

  const searchClients = async () => {
    try {
      setSearching(true);
      const results = await invoiceAPI.searchClients(clientSearch);
      setSearchResults(results);
      setShowClientDropdown(true);
    } catch (error) {
      console.error('Error searching clients:', error);
    } finally {
      setSearching(false);
    }
  };

  const selectClient = (client) => {
    setSelectedClient(client);
    setClientSearch(
      client.is_business
        ? client.company_name
        : `${client.first_name} ${client.last_name}`
    );
    setShowClientDropdown(false);
  };

  const addLineItem = () => {
    if (!newLineItem.title.trim()) {
      Alert.alert('Error', 'Please enter a title for the line item');
      return;
    }

    const quantity = parseFloat(newLineItem.quantity) || 1;
    const unitPrice = parseFloat(newLineItem.unit_price) || 0;
    const totalPrice = quantity * unitPrice;

    const item = {
      id: Date.now(),
      title: newLineItem.title,
      description: newLineItem.description,
      quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
    };

    setLineItems([...lineItems, item]);
    setNewLineItem({
      title: '',
      description: '',
      quantity: '1',
      unit_price: '75',
    });
  };

  const removeLineItem = (id) => {
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.total_price, 0);
    const tax = subtotal * (parseFloat(taxRate) / 100);
    const discount = parseFloat(discountAmount) || 0;
    const total = subtotal + tax - discount;

    return { subtotal, tax, discount, total };
  };

  const handleCreateInvoice = async () => {
    if (!selectedClient) {
      Alert.alert('Error', 'Please select a client');
      return;
    }

    if (lineItems.length === 0) {
      Alert.alert('Error', 'Please add at least one line item');
      return;
    }

    const totals = calculateTotals();

    const invoiceData = {
      client_id: selectedClient.id,
      invoice_number: invoiceNumber,
      due_date: dueDate || null,
      project_description: description,
      notes,
      line_items: lineItems.map((item) => ({
        title: item.title,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      })),
      subtotal: totals.subtotal,
      tax_rate: parseFloat(taxRate),
      tax_amount: totals.tax,
      discount_amount: totals.discount,
      total_amount: totals.total,
      status: 'pending',
    };

    try {
      setLoading(true);
      await invoiceAPI.createInvoice(invoiceData);
      Alert.alert('Success', 'Invoice created successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error creating invoice:', error);
      Alert.alert('Error', error.error || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
  };

  const totals = calculateTotals();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Client Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client *</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Search for client..."
              value={clientSearch}
              onChangeText={setClientSearch}
              autoCapitalize="words"
            />
            {searching && <ActivityIndicator style={styles.searchLoader} />}
          </View>

          {showClientDropdown && searchResults.length > 0 && (
            <ContentGlass style={styles.dropdown}>
              {searchResults.map((client) => (
                <TouchableOpacity
                  key={client.id}
                  style={styles.dropdownItem}
                  onPress={() => selectClient(client)}
                >
                  <Text style={styles.dropdownText}>
                    {client.is_business
                      ? client.company_name
                      : `${client.first_name} ${client.last_name}`}
                  </Text>
                  {client.email && (
                    <Text style={styles.dropdownSubtext}>{client.email}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ContentGlass>
          )}

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => Alert.alert('Create Client', 'Client creation coming soon')}
          >
            <Text style={styles.linkButtonText}>+ Create New Client</Text>
          </TouchableOpacity>
        </View>

        {/* Invoice Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invoice Details</Text>

          <Text style={styles.label}>Invoice Number</Text>
          <TextInput
            style={styles.input}
            value={invoiceNumber}
            onChangeText={setInvoiceNumber}
            placeholder="INV-000000"
          />

          <Text style={styles.label}>Due Date (Optional)</Text>
          <TextInput
            style={styles.input}
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="YYYY-MM-DD"
          />

          <Text style={styles.label}>Project Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Brief description of the project..."
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional notes..."
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Line Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Line Items</Text>

          {lineItems.map((item) => (
            <ContentGlass key={item.id} style={styles.lineItemCard}>
              <View style={styles.lineItemHeader}>
                <Text style={styles.lineItemTitle}>{item.title}</Text>
                <TouchableOpacity onPress={() => removeLineItem(item.id)}>
                  <Text style={styles.removeButton}>✕</Text>
                </TouchableOpacity>
              </View>
              {item.description ? (
                <Text style={styles.lineItemDesc}>{item.description}</Text>
              ) : null}
              <View style={styles.lineItemFooter}>
                <Text style={styles.lineItemQty}>
                  Qty: {item.quantity} × {formatCurrency(item.unit_price)}
                </Text>
                <Text style={styles.lineItemTotal}>
                  {formatCurrency(item.total_price)}
                </Text>
              </View>
            </ContentGlass>
          ))}

          {/* Add Line Item Form */}
          <View style={styles.addItemForm}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={newLineItem.title}
              onChangeText={(text) => setNewLineItem({ ...newLineItem, title: text })}
              placeholder="Item title"
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.input}
              value={newLineItem.description}
              onChangeText={(text) => setNewLineItem({ ...newLineItem, description: text })}
              placeholder="Item description"
            />

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Quantity</Text>
                <TextInput
                  style={styles.input}
                  value={newLineItem.quantity}
                  onChangeText={(text) => setNewLineItem({ ...newLineItem, quantity: text })}
                  keyboardType="numeric"
                  placeholder="1"
                />
              </View>

              <View style={styles.halfInput}>
                <Text style={styles.label}>Unit Price</Text>
                <TextInput
                  style={styles.input}
                  value={newLineItem.unit_price}
                  onChangeText={(text) => setNewLineItem({ ...newLineItem, unit_price: text })}
                  keyboardType="numeric"
                  placeholder="75.00"
                />
              </View>
            </View>

            <TouchableOpacity style={styles.addButton} onPress={addLineItem}>
              <Text style={styles.addButtonText}>+ Add Line Item</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tax and Discount */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tax & Discount</Text>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Tax Rate (%)</Text>
              <TextInput
                style={styles.input}
                value={taxRate}
                onChangeText={setTaxRate}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>

            <View style={styles.halfInput}>
              <Text style={styles.label}>Discount ($)</Text>
              <TextInput
                style={styles.input}
                value={discountAmount}
                onChangeText={setDiscountAmount}
                keyboardType="numeric"
                placeholder="0.00"
              />
            </View>
          </View>
        </View>

        {/* Totals Summary */}
        <ContentGlass style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatCurrency(totals.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax ({taxRate}%):</Text>
            <Text style={styles.totalValue}>{formatCurrency(totals.tax)}</Text>
          </View>
          {totals.discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount:</Text>
              <Text style={[styles.totalValue, { color: COLORS.success }]}>
                -{formatCurrency(totals.discount)}
              </Text>
            </View>
          )}
          <View style={styles.totalRowFinal}>
            <Text style={styles.totalLabelFinal}>Total:</Text>
            <Text style={styles.totalValueFinal}>{formatCurrency(totals.total)}</Text>
          </View>
        </ContentGlass>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Create Button */}
      <NavGlass style={styles.footer}>
        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreateInvoice}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.createButtonText}>Create Invoice</Text>
          )}
        </TouchableOpacity>
      </NavGlass>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  scrollView: {
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
    marginTop: 12,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  searchLoader: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  dropdown: {
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dropdownText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  dropdownSubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 2,
  },
  linkButton: {
    marginTop: 8,
  },
  linkButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  lineItemCard: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  lineItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lineItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  removeButton: {
    fontSize: 20,
    color: COLORS.error,
    fontWeight: 'bold',
    padding: 4,
  },
  lineItemDesc: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
  },
  lineItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  lineItemQty: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  lineItemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  addItemForm: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  totalsSection: {
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
    fontWeight: '500',
    color: COLORS.text,
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
  footer: {
    padding: 16,
    paddingBottom: 24,
  },
  createButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CreateInvoiceScreen;
