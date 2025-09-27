import React, { useState, useEffect } from 'react';

// GOOGLE MAPS CONFIGURATION:
// Google Maps address autocomplete is configured with API key: AIzaSyC-CkhQ7yM-ZCLP-kxarII_J3putM9Poo4
// Using traditional Google Maps JavaScript API with Places library for maximum compatibility.
// The script loads dynamically when the client modal is opened.
import {
  Plus,
  Edit,
  Eye,
  DollarSign,
  FileText,
  User,
  Check,
  Clock,
  CreditCard,
  AlertCircle,
  Download,
  Send,
  MessageCircle,
  Trash2,
  Bell
} from 'lucide-react';

// Import extracted components
import InvoiceList from './invoices/components/InvoiceList';
import ClientManagement from './invoices/components/ClientManagement';
import StatusBadge from './invoices/components/StatusBadge';
import EmailModal from './invoices/modals/EmailModal';
import ClientModal from './invoices/modals/ClientModal';
import SmsModal from './invoices/modals/SmsModal';
import DeleteModal from './invoices/modals/DeleteModal';
import PaymentModal from './invoices/modals/PaymentModal';
import EditPaymentModal from './invoices/modals/EditPaymentModal';
import DeletePaymentModal from './invoices/modals/DeletePaymentModal';
import CreateInvoiceForm from './invoices/forms/CreateInvoiceForm';

const InvoiceManager = ({ token, API_BASE, userRole }) => {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [lineItemLabels, setLineItemLabels] = useState([]);
  const [taxRates, setTaxRates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState('list'); // 'list', 'create', 'edit', 'view', 'clients', 'tax-rates'
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInvoice, setEmailInvoice] = useState(null);
  const [emailMessage, setEmailMessage] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [smsInvoice, setSmsInvoice] = useState(null);
  const [smsMessage, setSmsMessage] = useState('');
  const [smsSending, setSmsSending] = useState(false);
  const [customPhoneNumber, setCustomPhoneNumber] = useState('');
  const [useCustomPhone, setUseCustomPhone] = useState(false);
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('');
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [liveTrackingData, setLiveTrackingData] = useState(null);
  const [trackingInterval, setTrackingInterval] = useState(null);
  const [activeClientTab, setActiveClientTab] = useState('details');
  const [clientAddress, setClientAddress] = useState({
    street: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States'
  });
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [editingInvoiceNumber, setEditingInvoiceNumber] = useState(false);
  const [tempInvoiceNumber, setTempInvoiceNumber] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInvoice, setDeleteInvoice] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editingTaxRate, setEditingTaxRate] = useState(null);
  const [newTaxRate, setNewTaxRate] = useState({
    city: '',
    state: '',
    tax_rate: '',
    description: ''
  });
  const [selectedTaxRates, setSelectedTaxRates] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [bulkTaxRates, setBulkTaxRates] = useState('');
  const [bulkOperationLoading, setBulkOperationLoading] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderInvoice, setReminderInvoice] = useState(null);
  const [reminderSettings, setReminderSettings] = useState({ reminders_enabled: false, reminder_days: '7,14,30' });
  const [reminderHistory, setReminderHistory] = useState([]);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminderMessage, setReminderMessage] = useState('');
  const [reminderType, setReminderType] = useState('both');
  const [editingClient, setEditingClient] = useState(null);
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState(null);
  const [addingPayment, setAddingPayment] = useState(false);
  const [allPayments, setAllPayments] = useState([]);
  const [editingPayment, setEditingPayment] = useState(null);
  const [deletingPayment, setDeletingPayment] = useState(null);
  const [activeInvoiceTab, setActiveInvoiceTab] = useState('details');
  const [newLabel, setNewLabel] = useState({
    label: '',
    description: ''
  });
  const [showBulkLabelModal, setShowBulkLabelModal] = useState(false);
  const [bulkLabels, setBulkLabels] = useState('');
  const [bulkLabelOperationLoading, setBulkLabelOperationLoading] = useState(false);
  const [newClient, setNewClient] = useState({
    is_business: false,
    title: '',
    company_name: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    tax_exempt_number: '',
    is_primary_phone: false,
    is_primary_email: false
  });

  // Error handling for client creation
  const [clientError, setClientError] = useState(null);

  // Google Maps state
  const [autocomplete, setAutocomplete] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setMapLoaded(true);
        return;
      }

      // Check if script is already loading
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyC-CkhQ7yM-ZCLP-kxarII_J3putM9Poo4&libraries=places&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;
      script.onerror = () => console.error('Failed to load Google Maps API');

      // Define global callback
      window.initGoogleMaps = () => {
        setMapLoaded(true);
        delete window.initGoogleMaps; // Clean up
      };

      document.head.appendChild(script);
    };

    if (showClientModal && !mapLoaded) {
      loadGoogleMaps();
    }
  }, [showClientModal, mapLoaded]);

  // Initialize Google Places Autocomplete
  const initAutocomplete = (inputElement) => {
    if (!inputElement || !window.google || !window.google.maps || !window.google.maps.places) return;

    try {
      const options = {
        types: ['address'],
        componentRestrictions: { country: 'us' },
        fields: ['address_components', 'geometry', 'name']
      };

      const autocompleteInstance = new window.google.maps.places.Autocomplete(inputElement, options);

      autocompleteInstance.addListener('place_changed', () => {
        const place = autocompleteInstance.getPlace();

        if (!place.geometry) {
          console.warn(`No details available for input: '${place.name || inputElement.value}'`);
          return;
        }

        if (place.address_components) {
          const addressComponents = place.address_components;
          const address = {
            street: '',
            street2: '',
            city: '',
            state: '',
            zip: '',
            country: 'United States'
          };

          // Parse address components
          addressComponents.forEach(component => {
            const types = component.types;

            if (types.includes('street_number')) {
              address.street = component.long_name + ' ';
            } else if (types.includes('route')) {
              address.street += component.long_name;
            } else if (types.includes('subpremise')) {
              address.street2 = component.long_name;
            } else if (types.includes('locality')) {
              address.city = component.long_name;
            } else if (types.includes('administrative_area_level_1')) {
              address.state = component.short_name;
            } else if (types.includes('postal_code')) {
              address.zip = component.long_name;
            } else if (types.includes('country')) {
              address.country = component.long_name;
            }
          });

          setClientAddress(address);
        }
      });

      setAutocomplete(autocompleteInstance);
    } catch (error) {
      console.error('Error initializing autocomplete:', error);
    }
  };

  // Reset Google Maps state and clear errors when modal closes
  useEffect(() => {
    if (!showClientModal) {
      setAutocomplete(null);
      setMapLoaded(false);
      setClientError(null); // Clear errors when modal closes
    }
  }, [showClientModal]);
  const [newInvoice, setNewInvoice] = useState({
    client_id: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    line_items: [],
    subtotal: 0,
    tax_rate: 0, // No default tax rate - user must select
    tax_amount: 0,
    discount_amount: 0,
    markup_amount: 0,
    total_amount: 0,
    notes: ''
  });

  // Fetch initial data
  useEffect(() => {
    fetchInvoices();
    fetchClients();
    fetchLineItemLabels();
    fetchTaxRates();
  }, []);

  // Debounced client search
  useEffect(() => {
    // Clear immediately when search term is empty
    if (clientSearchTerm.length === 0) {
      setSearchResults([]);
      setShowClientDropdown(false);
      return;
    }

    // Clear results immediately if less than 2 characters
    if (clientSearchTerm.length === 1) {
      setSearchResults([]);
      return;
    }

    // Debounce search for 2+ characters
    const debounceTimer = setTimeout(() => {
      if (clientSearchTerm.length >= 2) {
        searchClients(clientSearchTerm);
      }
    }, 300); // 300ms delay

    return () => clearTimeout(debounceTimer);
  }, [clientSearchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showClientDropdown && !event.target.closest('.client-dropdown-container')) {
        setShowClientDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showClientDropdown]);

  // Filter invoices based on search term
  useEffect(() => {
    if (!invoiceSearchTerm.trim()) {
      setFilteredInvoices(invoices);
      return;
    }

    const searchLower = invoiceSearchTerm.toLowerCase();
    const filtered = invoices.filter(invoice => {
      const clientName = invoice.is_business
        ? invoice.company_name?.toLowerCase() || ''
        : `${invoice.first_name?.toLowerCase() || ''} ${invoice.last_name?.toLowerCase() || ''}`;

      return (
        invoice.invoice_number?.toLowerCase().includes(searchLower) ||
        clientName.includes(searchLower) ||
        invoice.total_amount?.toString().includes(searchLower) ||
        invoice.email?.toLowerCase().includes(searchLower) ||
        invoice.status?.toLowerCase().includes(searchLower)
      );
    });

    setFilteredInvoices(filtered);
  }, [invoices, invoiceSearchTerm]);

  const fetchInvoices = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/invoices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/clients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchLineItemLabels = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/line-item-labels`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLineItemLabels(data);
      }
    } catch (error) {
      console.error('Error fetching line item labels:', error);
    }
  };

  const fetchTaxRates = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/tax-rates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('💰 Tax Rates Loaded:', data.map(rate => ({
          id: rate.id,
          city: rate.city,
          state_code: rate.state_code,
          tax_rate: rate.tax_rate,
          percentage: `${rate.tax_rate.toFixed(2)}%`
        })));
        setTaxRates(data);
      }
    } catch (error) {
      console.error('Error fetching tax rates:', error);
    }
  };

  const fetchLiveTrackingData = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/invoices/tracking`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLiveTrackingData(data);
      } else {
        console.error('Tracking API error:', response.status, response.statusText);
        if (response.status === 404) {
          console.error('Tracking endpoint not found. Check if server is running and endpoint exists.');
        } else if (response.status === 401) {
          console.error('Authentication failed. Check token validity.');
        }
      }
    } catch (error) {
      console.error('Error fetching live tracking data:', error);
    }
  };

  // Start live tracking when on tracking view
  const startLiveTracking = () => {
    if (trackingInterval) return; // Already running

    fetchLiveTrackingData(); // Initial fetch
    const interval = setInterval(fetchLiveTrackingData, 30000); // Update every 30 seconds
    setTrackingInterval(interval);
  };

  // Stop live tracking
  const stopLiveTracking = () => {
    if (trackingInterval) {
      clearInterval(trackingInterval);
      setTrackingInterval(null);
    }
  };

  // Start/stop tracking based on active view
  useEffect(() => {
    if (activeView === 'tracking') {
      startLiveTracking();
    } else {
      stopLiveTracking();
    }

    if (activeView === 'payments') {
      fetchAllPayments();
    }

    return () => stopLiveTracking(); // Cleanup on unmount
  }, [activeView]);

  const createTaxRate = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/admin/tax-rates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          city: newTaxRate.city.trim() || null,
          state_code: newTaxRate.state.trim().toUpperCase(),
          tax_rate: (() => {
            const inputRate = newTaxRate.tax_rate;
            const parsedRate = parseFloat(inputRate);
            // Store as percentage, NOT decimal
            console.log('🔧 Tax Rate Creation Debug:', {
              input: inputRate,
              parsed: parsedRate,
              stored_as_percentage: parsedRate
            });
            return parsedRate;
          })(),
          description: newTaxRate.description.trim() || null
        })
      });

      if (response.ok) {
        await fetchTaxRates();
        setNewTaxRate({ city: '', state: '', tax_rate: '', description: '' });
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create tax rate');
      }
    } catch (error) {
      console.error('Error creating tax rate:', error);
      setError('Failed to create tax rate');
    } finally {
      setLoading(false);
    }
  };

  const updateTaxRate = async (id, updates) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/admin/tax-rates/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          city: updates.city?.trim() || null,
          state_code: (updates.state_code || updates.state)?.trim().toUpperCase(),
          tax_rate: (() => {
            const inputRate = updates.tax_rate;
            const parsedRate = parseFloat(inputRate);
            // Store as percentage, NOT decimal
            console.log('🔧 Tax Rate Update Debug:', {
              input: inputRate,
              parsed: parsedRate,
              stored_as_percentage: parsedRate
            });
            return parsedRate;
          })(),
          description: updates.description?.trim() || null
        })
      });

      if (response.ok) {
        await fetchTaxRates();
        setEditingTaxRate(null);
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update tax rate');
      }
    } catch (error) {
      console.error('Error updating tax rate:', error);
      setError('Failed to update tax rate');
    } finally {
      setLoading(false);
    }
  };

  const deleteTaxRate = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/admin/tax-rates/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        await fetchTaxRates();
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete tax rate');
      }
    } catch (error) {
      console.error('Error deleting tax rate:', error);
      setError('Failed to delete tax rate');
    } finally {
      setLoading(false);
    }
  };

  const bulkDeleteTaxRates = async () => {
    if (selectedTaxRates.length === 0) {
      setError('Please select tax rates to delete');
      return;
    }

    try {
      setBulkOperationLoading(true);
      const response = await fetch(`${API_BASE}/api/admin/tax-rates/bulk-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ids: selectedTaxRates })
      });

      const data = await response.json();

      if (response.ok) {
        await fetchTaxRates();
        setSelectedTaxRates([]);
        setSelectAll(false);
        setError('');
        alert(data.message + (data.errors.length > 0 ? '\n\nErrors:\n' + data.errors.join('\n') : ''));
      } else {
        setError(data.error || 'Failed to bulk delete tax rates');
      }
    } catch (error) {
      console.error('Error bulk deleting tax rates:', error);
      setError('Failed to bulk delete tax rates');
    } finally {
      setBulkOperationLoading(false);
    }
  };

  const bulkAddTaxRates = async () => {
    if (!bulkTaxRates.trim()) {
      setError('Please enter tax rates data');
      return;
    }

    try {
      setBulkOperationLoading(true);

      // Parse CSV format: state_code,city,tax_rate,description
      const lines = bulkTaxRates.trim().split('\n');
      const taxRatesArray = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(',').map(part => part.trim());
        if (parts.length < 2) {
          setError(`Invalid format on line ${i + 1}. Expected: state_code,city,tax_rate,description`);
          return;
        }

        taxRatesArray.push({
          state_code: parts[0],
          city: parts[1] || '',
          tax_rate: parseFloat(parts[2]), // Store as percentage
          description: parts[3] || ''
        });
      }

      const response = await fetch(`${API_BASE}/api/admin/tax-rates/bulk-add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ taxRates: taxRatesArray })
      });

      const data = await response.json();

      if (response.ok) {
        await fetchTaxRates();
        setBulkTaxRates('');
        setShowBulkAddModal(false);
        setError('');
        alert(data.message + (data.errors.length > 0 ? '\n\nErrors:\n' + data.errors.join('\n') : ''));
      } else {
        setError(data.error || 'Failed to bulk add tax rates');
      }
    } catch (error) {
      console.error('Error bulk adding tax rates:', error);
      setError('Failed to bulk add tax rates');
    } finally {
      setBulkOperationLoading(false);
    }
  };

  const toggleTaxRateSelection = (id) => {
    setSelectedTaxRates(prev =>
      prev.includes(id)
        ? prev.filter(taxRateId => taxRateId !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedTaxRates([]);
    } else {
      setSelectedTaxRates(taxRates.map(rate => rate.id));
    }
    setSelectAll(!selectAll);
  };

  const openReminderModal = async (invoice) => {
    try {
      setReminderInvoice(invoice);
      setShowReminderModal(true);

      // Fetch reminder settings
      const settingsResponse = await fetch(`${API_BASE}/api/admin/invoices/${invoice.id}/reminder-settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (settingsResponse.ok) {
        const settings = await settingsResponse.json();
        setReminderSettings(settings);
      }

      // Fetch reminder history
      const historyResponse = await fetch(`${API_BASE}/api/admin/invoices/${invoice.id}/reminder-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (historyResponse.ok) {
        const history = await historyResponse.json();
        setReminderHistory(history);
      }
    } catch (error) {
      console.error('Error opening reminder modal:', error);
      setError('Failed to load reminder information');
    }
  };

  const updateReminderSettings = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/invoices/${reminderInvoice.id}/reminder-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(reminderSettings)
      });

      if (response.ok) {
        setError('');
        alert('Reminder settings updated successfully');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update reminder settings');
      }
    } catch (error) {
      console.error('Error updating reminder settings:', error);
      setError('Failed to update reminder settings');
    }
  };

  const sendManualReminder = async () => {
    try {
      setSendingReminder(true);
      const response = await fetch(`${API_BASE}/api/admin/invoices/${reminderInvoice.id}/send-reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          reminder_type: reminderType,
          custom_message: reminderMessage.trim() || undefined
        })
      });

      if (response.ok) {
        const result = await response.json();
        setError('');
        alert(`Reminder sent successfully! ${result.emailSent ? '✅ Email sent' : ''} ${result.smsSent ? '✅ SMS sent' : ''}`);
        setReminderMessage('');

        // Refresh reminder history
        const historyResponse = await fetch(`${API_BASE}/api/admin/invoices/${reminderInvoice.id}/reminder-history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (historyResponse.ok) {
          const history = await historyResponse.json();
          setReminderHistory(history);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to send reminder');
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      setError('Failed to send reminder');
    } finally {
      setSendingReminder(false);
    }
  };

  const deleteClient = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/admin/clients/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        await fetchClients();
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete client');
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      setError('Failed to delete client');
    } finally {
      setLoading(false);
    }
  };

  const updateClient = async (id, updates) => {
    setLoading(true);
    setClientError(null); // Clear previous errors

    // Client-side validation
    const validationErrors = [];

    // Check if at least email or phone is provided
    const hasEmail = updates.email && updates.email.trim();
    const hasPhone = updates.phone && updates.phone.trim();

    if (!hasEmail && !hasPhone) {
      validationErrors.push('Either email address or phone number is required');
    }

    // Validate email format if provided
    if (hasEmail && !/\S+@\S+\.\S+/.test(updates.email)) {
      validationErrors.push('Please enter a valid email address');
    }

    if (updates.is_business) {
      if (!updates.company_name || !updates.company_name.trim()) {
        validationErrors.push('Company name is required for business clients');
      }
    } else {
      if (!updates.first_name || !updates.first_name.trim()) {
        validationErrors.push('First name is required');
      }
      if (!updates.last_name || !updates.last_name.trim()) {
        validationErrors.push('Last name is required');
      }
    }

    if (validationErrors.length > 0) {
      setClientError({
        title: 'Missing Required Information',
        messages: validationErrors
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/admin/clients/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        await fetchClients();
        setEditingClient(null);
        setShowEditClientModal(false);
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update client');
      }
    } catch (error) {
      console.error('Error updating client:', error);
      setError('Failed to update client');
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const calculateTotals = (lineItems, taxRate = 0, discountAmount = 0, markupAmount = 0) => {
    const subtotal = lineItems.reduce((sum, item) => sum + (item.total_price || 0), 0);
    // Round tax rate to avoid floating point precision issues
    const roundedTaxRate = Math.round(taxRate * 10000) / 10000; // Round to 4 decimal places
    const taxAmount = Math.round(subtotal * roundedTaxRate/10 ) / 10; // Round to 2 decimal places
    const total = Math.round((subtotal + taxAmount - discountAmount + markupAmount) * 100) / 100;
    
    // Debug logging
    console.log('🧮 Tax Calculation Debug:');
    console.log('  Line Items:', lineItems.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price
    })));
    console.log('  Subtotal:', subtotal);
    console.log('  Tax Rate (original):', taxRate, `(${(taxRate ).toFixed(2)}%)`);
    console.log('  Tax Rate (rounded):', roundedTaxRate, `(${(roundedTaxRate).toFixed(2)}%)`);
    console.log('  Tax Amount:', taxAmount);
    console.log('  Discount Amount:', discountAmount);
    console.log('  Markup Amount:', markupAmount);
    console.log('  Final Total:', total);
    console.log('  Calculation: ', `${subtotal} + ${taxAmount} - ${discountAmount} + ${markupAmount} = ${total}`);

    return {
      subtotal,
      taxAmount,
      total
    };
  };

  // Add line item (works for both create and edit modes)
  const addLineItem = () => {
    const newLineItem = {
      description: '',
      quantity: 1,
      unit: '',
      unit_price: 0,
      total_price: 0,
      item_type: ''
    };

    // Determine which state to update based on current view
    if (activeView === 'edit' && editingInvoice) {
      setEditingInvoice(prev => ({
        ...prev,
        line_items: [...(prev.line_items || []), newLineItem]
      }));
    } else {
      setNewInvoice(prev => ({
        ...prev,
        line_items: [...prev.line_items, newLineItem]
      }));
    }
  };

  // Update line item (works for both create and edit modes)
  const updateLineItem = (index, field, value) => {
    // Determine which invoice to work with
    const currentInvoice = activeView === 'edit' && editingInvoice ? editingInvoice : newInvoice;
    const setCurrentInvoice = activeView === 'edit' && editingInvoice ? setEditingInvoice : setNewInvoice;

    const updatedItems = [...(currentInvoice.line_items || [])];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Recalculate total price for this line item
    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].total_price = Math.round(updatedItems[index].quantity * updatedItems[index].unit_price * 100) / 100;

      console.log(`📋 Line Item Update Debug:`, {
        index,
        field,
        value,
        quantity: updatedItems[index].quantity,
        unit_price: updatedItems[index].unit_price,
        calculated_total: updatedItems[index].total_price
      });
    }

    // Recalculate invoice totals
    const totals = calculateTotals(
      updatedItems,
      currentInvoice.tax_rate,
      currentInvoice.discount_amount,
      currentInvoice.markup_amount
    );

    setCurrentInvoice(prev => ({
      ...prev,
      line_items: updatedItems,
      subtotal: totals.subtotal,
      tax_amount: totals.taxAmount,
      total_amount: totals.total
    }));
  };

  // Remove line item (works for both create and edit modes)
  const removeLineItem = (index) => {
    // Determine which invoice to work with
    const currentInvoice = activeView === 'edit' && editingInvoice ? editingInvoice : newInvoice;
    const setCurrentInvoice = activeView === 'edit' && editingInvoice ? setEditingInvoice : setNewInvoice;

    const updatedItems = (currentInvoice.line_items || []).filter((_, i) => i !== index);
    const totals = calculateTotals(
      updatedItems,
      currentInvoice.tax_rate,
      currentInvoice.discount_amount,
      currentInvoice.markup_amount
    );

    setCurrentInvoice(prev => ({
      ...prev,
      line_items: updatedItems,
      subtotal: totals.subtotal,
      tax_amount: totals.taxAmount,
      total_amount: totals.total
    }));
  };

  // Create invoice
  const createInvoice = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/admin/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newInvoice)
      });

      if (response.ok) {
        await fetchInvoices();
        setActiveView('list');
        // Reset form
        setNewInvoice({
          client_id: '',
          invoice_date: new Date().toISOString().split('T')[0],
          due_date: '',
          line_items: [],
          subtotal: 0,
          tax_rate: 0,
          tax_amount: 0,
          discount_amount: 0,
          markup_amount: 0,
          total_amount: 0,
          notes: ''
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create invoice');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      setError('Failed to create invoice');
    }

    setLoading(false);
  };
  // Search clients function
  const searchClients = async (searchTerm) => {
    setIsSearching(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/clients/search?q=${encodeURIComponent(searchTerm)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
        setShowClientDropdown(true);
      }
    } catch (error) {
      console.error('Error searching clients:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Send email function
  const sendInvoiceEmail = async (language = 'english') => {
    setEmailSending(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/invoices/${emailInvoice.id}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: emailMessage,
          language: language
        })
      });

      if (response.ok) {
        const data = await response.json();
        setShowEmailModal(false);
        setEmailMessage('');
        setEmailInvoice(null);
        // Show success message
        alert(`Invoice email sent successfully to ${data.sentTo}`);
      } else {
        const errorData = await response.json();
        alert(`Failed to send email: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setEmailSending(false);
    }
  };

  // Create client function
  const createClient = async (clientData = null) => {
    setLoading(true);
    setClientError(null); // Clear previous errors

    const clientToSubmit = clientData || newClient;

    console.log('Debug - Client data being validated:', clientToSubmit);

    // Client-side validation
    const validationErrors = [];

    // Check if at least email or phone is provided
    const hasEmail = clientToSubmit.email && clientToSubmit.email.trim();
    const hasPhone = clientToSubmit.phone && clientToSubmit.phone.trim();

    if (!hasEmail && !hasPhone) {
      validationErrors.push('Either email address or phone number is required');
    }

    // Validate email format if provided
    if (hasEmail && !/\S+@\S+\.\S+/.test(clientToSubmit.email)) {
      validationErrors.push('Please enter a valid email address');
    }

    if (clientToSubmit.is_business) {
      if (!clientToSubmit.company_name || !clientToSubmit.company_name.trim()) {
        validationErrors.push('Company name is required for business clients');
      }
    } else {
      if (!clientToSubmit.first_name || !clientToSubmit.first_name.trim()) {
        validationErrors.push('First name is required');
      }
      if (!clientToSubmit.last_name || !clientToSubmit.last_name.trim()) {
        validationErrors.push('Last name is required');
      }
    }

    if (validationErrors.length > 0) {
      setClientError({
        title: 'Missing Required Information',
        messages: validationErrors
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/admin/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(clientToSubmit)
      });

      if (response.ok) {
        const newClientData = await response.json();
        setShowClientModal(false);
        setClientError(null);

        // Auto-select the newly created client
        setNewInvoice(prev => ({ ...prev, client_id: newClientData.id }));
        const clientName = newClient.is_business
          ? newClient.company_name
          : `${newClient.first_name} ${newClient.last_name}`;
        setClientSearchTerm(clientName);

        // Reset form
        setNewClient({
          is_business: false,
          title: '',
          company_name: '',
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          address: '',
          tax_exempt_number: '',
          is_primary_phone: false,
          is_primary_email: false
        });

        fetchClients(); // Refresh client list
      } else {
        const errorData = await response.json();
        setClientError({
          title: 'Failed to Create Client',
          messages: [errorData.error || 'Unknown server error occurred']
        });
      }
    } catch (error) {
      console.error('Error creating client:', error);
      setClientError({
        title: 'Connection Error',
        messages: ['Failed to create client. Please check your connection and try again.']
      });
    } finally {
      setLoading(false);
    }
  };

  // Send SMS function
  const sendInvoiceSms = async () => {
    setSmsSending(true);
    try {
      const requestBody = {
        message: smsMessage
      };

      // Add custom phone number if super admin is using override
      if (useCustomPhone && customPhoneNumber && userRole === 'super_admin') {
        requestBody.customPhone = customPhoneNumber;
      }

      const response = await fetch(`${API_BASE}/api/admin/invoices/${smsInvoice.id}/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const data = await response.json();
        setShowSmsModal(false);
        setSmsMessage('');
        setSmsInvoice(null);
        alert(`Invoice SMS sent successfully to ${data.sentTo}`);
      } else {
        const errorData = await response.json();
        alert(`Failed to send SMS: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      alert('Failed to send SMS. Please try again.');
    } finally {
      setSmsSending(false);
    }
  };


  // Download PDF function
  const downloadInvoicePdf = async (invoice) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/invoices/${invoice.id}/pdf`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Get the PDF blob
        const pdfBlob = await response.blob();

        // Create download link
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${invoice.invoice_number}.pdf`;
        document.body.appendChild(link);
        link.click();

        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      } else {
        const errorData = await response.json();
        alert(`Failed to generate PDF: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  // Fetch all payments for payment management
  const fetchAllPayments = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/payments`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAllPayments(data);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  // Update payment
  const updatePayment = async (paymentId, paymentData) => {
    const response = await fetch(`${API_BASE}/api/admin/payments/${paymentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update payment');
    }

    return await response.json();
  };

  // Delete payment
  const deletePayment = async (paymentId) => {
    const response = await fetch(`${API_BASE}/api/admin/payments/${paymentId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete payment');
    }

    return true;
  };

  // Add payment to invoice
  const addPayment = async (paymentData) => {
    setAddingPayment(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/invoices/${paymentInvoice.id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(paymentData)
      });

      if (response.ok) {
        setShowPaymentModal(false);
        setPaymentInvoice(null);
        setAddingPayment(false);

        // Refresh invoices to update payment status
        await fetchInvoices();

        // Refresh the selected invoice details if we're viewing this invoice
        if (selectedInvoice && selectedInvoice.id === paymentInvoice.id) {
          await loadInvoiceDetails(selectedInvoice.id);
        }

        // Show success message
        alert('Payment added successfully!');
      } else {
        const errorData = await response.json();
        setError(`Failed to add payment: ${errorData.error}`);
        setAddingPayment(false);
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      setError('Failed to add payment. Please try again.');
      setAddingPayment(false);
    }
  };

  // Edit payment handler
  const handleEditPayment = async (paymentData) => {
    if (!editingPayment) return;

    try {
      const updatedPayment = await updatePayment(editingPayment.id, paymentData);
      if (updatedPayment) {
        const invoiceId = editingPayment.invoice_id;
        setEditingPayment(null);

        // Add a small delay to ensure database transaction is complete
        await new Promise(resolve => setTimeout(resolve, 200));

        // Refresh invoices to update payment status
        await fetchInvoices();

        // Refresh the selected invoice details if we're viewing this invoice
        if (selectedInvoice && selectedInvoice.id === invoiceId) {
          await loadInvoiceDetails(selectedInvoice.id);
        }

        alert('Payment updated successfully!');
      }
    } catch (error) {
      console.error('Error editing payment:', error);
      setError('Failed to update payment. Please try again.');
    }
  };

  // Delete payment handler
  const handleDeletePayment = async () => {
    if (!deletingPayment) return;

    try {
      await deletePayment(deletingPayment.id);
      setDeletingPayment(null);
      await fetchAllPayments(); // Refresh payments list
      await fetchInvoices(); // Refresh invoices to update payment status

      // Refresh the selected invoice details if we're viewing this invoice
      if (selectedInvoice && selectedInvoice.id === deletingPayment.invoice_id) {
        await loadInvoiceDetails(selectedInvoice.id);
      }

      alert('Payment deleted successfully!');
    } catch (error) {
      console.error('Error deleting payment:', error);
      setError('Failed to delete payment. Please try again.');
    }
  };

  // Create label function
  const createLabel = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/line-item-labels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newLabel)
      });

      if (response.ok) {
        setShowLabelModal(false);
        setNewLabel({
          label: '',
          description: ''
        });
        fetchLineItemLabels(); // Refresh labels
        alert('Label created successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to create label: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error creating label:', error);
      alert('Failed to create label. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Invoice list view
  const renderInvoiceList = () => (
    <InvoiceList
      filteredInvoices={filteredInvoices}
      invoices={invoices}
      invoiceSearchTerm={invoiceSearchTerm}
      setInvoiceSearchTerm={setInvoiceSearchTerm}
      setActiveView={setActiveView}
      loadInvoiceDetails={loadInvoiceDetails}
      setEmailInvoice={setEmailInvoice}
      setShowEmailModal={setShowEmailModal}
      setSmsInvoice={setSmsInvoice}
      setShowSmsModal={setShowSmsModal}
      downloadInvoicePdf={downloadInvoicePdf}
      openReminderModal={openReminderModal}
      setDeleteInvoice={setDeleteInvoice}
      setShowDeleteModal={setShowDeleteModal}
      setShowClientModal={setShowClientModal}
      setShowLabelModal={setShowLabelModal}
    />
  );


  // Create invoice form
  const renderCreateInvoiceForm = () => (
    <CreateInvoiceForm
      error={error}
      newInvoice={newInvoice}
      setNewInvoice={setNewInvoice}
      clientSearchTerm={clientSearchTerm}
      setClientSearchTerm={setClientSearchTerm}
      showClientDropdown={showClientDropdown}
      setShowClientDropdown={setShowClientDropdown}
      searchResults={searchResults}
      isSearching={isSearching}
      setShowClientModal={setShowClientModal}
      taxRates={taxRates}
      lineItemLabels={lineItemLabels}
      token={token}
      API_BASE={API_BASE}
      calculateTotals={calculateTotals}
      addLineItem={addLineItem}
      updateLineItem={updateLineItem}
      removeLineItem={removeLineItem}
      createInvoice={createInvoice}
      loading={loading}
      setActiveView={setActiveView}
    />
  );

  // Load full invoice details
  const loadInvoiceDetails = async (invoiceId, forEdit = false) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/invoices/${invoiceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const invoice = await response.json();
        setSelectedInvoice(invoice);

        if (forEdit) {
          // Set up editing state - deep clone the invoice for editing
          setEditingInvoice({
            ...invoice,
            line_items: invoice.line_items?.map(item => ({ ...item })) || []
          });
        }
      } else {
        setError('Failed to load invoice details');
      }
    } catch (error) {
      console.error('Error loading invoice:', error);
      setError('Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };

  // Update invoice number
  const updateInvoiceNumber = async () => {
    if (!tempInvoiceNumber.trim() || tempInvoiceNumber === selectedInvoice.invoice_number) {
      setEditingInvoiceNumber(false);
      setTempInvoiceNumber('');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/invoices/${selectedInvoice.id}/invoice-number`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ invoice_number: tempInvoiceNumber.trim() })
      });

      if (response.ok) {
        const result = await response.json();
        setSelectedInvoice(prev => ({ ...prev, invoice_number: result.invoice_number }));
        setEditingInvoiceNumber(false);
        setTempInvoiceNumber('');

        // Refresh invoices list
        fetchInvoices();
        alert('Invoice number updated successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to update invoice number: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error updating invoice number:', error);
      alert('Failed to update invoice number. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Delete invoice
  const handleDeleteInvoice = async () => {
    if (!deleteInvoice) return;

    setDeleting(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/invoices/${deleteInvoice.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        setShowDeleteModal(false);
        setDeleteInvoice(null);

        // If we're viewing the deleted invoice, go back to list
        if (selectedInvoice && selectedInvoice.id === deleteInvoice.id) {
          setSelectedInvoice(null);
          setActiveView('list');
        }

        // Refresh invoices list
        fetchInvoices();
        alert('Invoice deleted successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to delete invoice: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Failed to delete invoice. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // Invoice detail view with tabs
  const renderInvoiceView = () => {
    if (!selectedInvoice) return null;

    const clientName = selectedInvoice.is_business
      ? selectedInvoice.company_name
      : `${selectedInvoice.first_name} ${selectedInvoice.last_name}`;

    // Tab definitions
    const tabs = [
      { id: 'details', label: 'Invoice Details', icon: '📄' },
      { id: 'payments', label: 'Payments', icon: '💰' },
      { id: 'edit', label: 'Edit', icon: '✏️' },
      { id: 'send', label: 'Send', icon: '📧' },
      { id: 'track', label: 'Track', icon: '👁️' },
      { id: 'download', label: 'Download', icon: '⬇️' },
      { id: 'reminder', label: 'Reminder', icon: '⏰' },
      { id: 'delete', label: 'Delete', icon: '🗑️' },
      { id: 'analytics', label: 'Analytics', icon: '📊' }
    ];

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {editingInvoiceNumber ? (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">Invoice</span>
                <input
                  type="text"
                  value={tempInvoiceNumber}
                  onChange={(e) => setTempInvoiceNumber(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      updateInvoiceNumber();
                    } else if (e.key === 'Escape') {
                      setEditingInvoiceNumber(false);
                      setTempInvoiceNumber('');
                    }
                  }}
                  onBlur={updateInvoiceNumber}
                  autoFocus
                  className="text-2xl font-bold border-b-2 border-blue-500 bg-transparent focus:outline-none min-w-0"
                  style={{ width: `${Math.max(tempInvoiceNumber.length * 1.2, 8)}ch` }}
                />
              </div>
            ) : (
              <h2
                className="text-2xl font-bold cursor-pointer hover:text-blue-600 transition-colors"
                onClick={() => {
                  setEditingInvoiceNumber(true);
                  setTempInvoiceNumber(selectedInvoice.invoice_number);
                }}
                title="Click to edit invoice number"
              >
                Invoice {selectedInvoice.invoice_number}
              </h2>
            )}
          </div>

          <button
            onClick={() => setActiveView('list')}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2 text-sm border border-gray-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Invoices
          </button>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveInvoiceTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeInvoiceTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {/* Invoice Details Tab */}
          {activeInvoiceTab === 'details' && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Client Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User size={18} />
                Client Information
              </h3>
              <div className="space-y-2">
                <p><strong>Name:</strong> {clientName}</p>
                <p><strong>Email:</strong> {selectedInvoice.email}</p>
                <p><strong>Phone:</strong> {selectedInvoice.phone}</p>
                {selectedInvoice.address && (
                  <p><strong>Address:</strong> {selectedInvoice.address}</p>
                )}
                {selectedInvoice.tax_exempt_number && (
                  <p><strong>Tax Exempt:</strong> {selectedInvoice.tax_exempt_number}</p>
                )}
              </div>
            </div>

            {/* Invoice Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText size={18} />
                Invoice Details
              </h3>
              <div className="space-y-2">
                <p><strong>Invoice Date:</strong> {new Date(selectedInvoice.invoice_date).toLocaleDateString()}</p>
                <p><strong>Due Date:</strong> {new Date(selectedInvoice.due_date).toLocaleDateString()}</p>
                <p><strong>Status:</strong>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${selectedInvoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                    selectedInvoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                    {selectedInvoice.status.charAt(0).toUpperCase() + selectedInvoice.status.slice(1)}
                  </span>
                </p>
                <p><strong>Total Amount:</strong> ${selectedInvoice.total_amount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Line Items</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Description</th>
                    <th className="px-4 py-2 text-center">Quantity</th>
                    <th className="px-4 py-2 text-right">Unit Price</th>
                    <th className="px-4 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.line_items?.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-4 py-2">
                        <div>
                          {item.title && (
                            <p className="font-semibold text-gray-900 mb-1">{item.title}</p>
                          )}
                          <p className="text-gray-700">{item.description}</p>
                          {item.notes && (
                            <p className="text-sm text-gray-500">{item.notes}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center">{item.quantity}</td>
                      <td className="px-4 py-2 text-right">${parseFloat(item.unit_price).toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">${(item.quantity * parseFloat(item.unit_price)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-4 flex justify-end">
              <div className="w-64">
                <div className="flex justify-between py-1">
                  <span>Subtotal:</span>
                  <span>${(selectedInvoice.subtotal || 0).toFixed(2)}</span>
                </div>
                {(selectedInvoice.discount_amount || 0) > 0 && (
                  <div className="flex justify-between py-1 text-green-600">
                    <span>Discount:</span>
                    <span>-${(selectedInvoice.discount_amount || 0).toFixed(2)}</span>
                  </div>
                )}
                {(selectedInvoice.markup_amount || 0) > 0 && (
                  <div className="flex justify-between py-1">
                    <span>Markup:</span>
                    <span>${(selectedInvoice.markup_amount || 0).toFixed(2)}</span>
                  </div>
                )}
                {(selectedInvoice.tax_amount || 0) > 0 && (
                  <div className="flex justify-between py-1">
                    <span>Tax ({((selectedInvoice.tax_rate || 0)).toFixed(2)}%):</span>
                    <span>${(selectedInvoice.tax_amount || 0).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-t border-gray-300 font-bold text-lg">
                  <span>Total:</span>
                  <span>${(selectedInvoice.total_amount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {selectedInvoice.notes && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Notes</h3>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                <p className="text-gray-700">{selectedInvoice.notes}</p>
              </div>
            </div>
          )}

              </div>
            )}

          {/* Payments Tab */}
          {activeInvoiceTab === 'payments' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <DollarSign size={18} />
                  Payment History
                </h3>
                <button
                  onClick={() => {
                    setPaymentInvoice(selectedInvoice);
                    setShowPaymentModal(true);
                  }}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Payment
                </button>
              </div>

              {/* Payment Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-sm text-green-600 font-medium">Total Paid</div>
                  <div className="text-xl font-bold text-green-700">
                    ${((selectedInvoice.total_amount || 0) - (selectedInvoice.balance_due || 0)).toFixed(2)}
                  </div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="text-sm text-orange-600 font-medium">Balance Due</div>
                  <div className="text-xl font-bold text-orange-700">
                    ${(selectedInvoice.balance_due || 0).toFixed(2)}
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm text-blue-600 font-medium">Total Amount</div>
                  <div className="text-xl font-bold text-blue-700">
                    ${(selectedInvoice.total_amount || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Payments Table */}
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                {selectedInvoice.payments && selectedInvoice.payments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Check #</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedInvoice.payments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {new Date(payment.payment_date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-2 text-sm font-medium text-green-600">
                              ${parseFloat(payment.payment_amount).toFixed(2)}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                payment.payment_method === 'cash' ? 'bg-green-100 text-green-800' :
                                payment.payment_method === 'check' ? 'bg-blue-100 text-blue-800' :
                                payment.payment_method.includes('card') ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {payment.payment_method.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {payment.check_number || '-'}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500 max-w-xs truncate">
                              {payment.notes || '-'}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              <button
                                onClick={() => setEditingPayment(payment)}
                                className="text-blue-600 hover:text-blue-900 mr-2 text-xs"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setDeletingPayment(payment)}
                                className="text-red-600 hover:text-red-900 text-xs"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <DollarSign size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No payments recorded</p>
                    <p className="text-sm">Click "Add Payment" to record the first payment for this invoice.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Edit Tab */}
          {activeInvoiceTab === 'edit' && (
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Edit className="text-blue-600" size={24} />
                <h3 className="text-lg font-semibold">Edit Invoice</h3>
              </div>
              <p className="text-gray-600 mb-6">Modify invoice details, line items, and amounts. Changes will be saved automatically.</p>
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    loadInvoiceDetails(selectedInvoice.id, true);
                    setActiveView('edit');
                  }}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Edit size={18} />
                  Start Editing Invoice
                </button>
              </div>
            </div>
          )}

          {/* Send Tab */}
          {activeInvoiceTab === 'send' && (
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Send className="text-green-600" size={24} />
                <h3 className="text-lg font-semibold">Send Invoice</h3>
              </div>
              <p className="text-gray-600 mb-6">Send invoice notifications to your client via email or SMS.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Send Email */}
                <div className="border border-green-200 rounded-lg p-6 bg-green-50">
                  <div className="flex items-center gap-3 mb-4">
                    <Send className="text-green-600" size={20} />
                    <h4 className="font-medium">Email Invoice</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Send a professional email with the invoice attached as PDF</p>
                  <button
                    onClick={() => {
                      setEmailInvoice(selectedInvoice);
                      setShowEmailModal(true);
                    }}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Send Email
                  </button>
                </div>

                {/* Send SMS */}
                <div className="border border-blue-200 rounded-lg p-6 bg-blue-50">
                  <div className="flex items-center gap-3 mb-4">
                    <MessageCircle className="text-blue-600" size={20} />
                    <h4 className="font-medium">SMS Notification</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Send a quick SMS notification about the invoice</p>
                  <button
                    onClick={() => {
                      setSmsInvoice(selectedInvoice);
                      setShowSmsModal(true);
                    }}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Send SMS
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Track Tab */}
          {activeInvoiceTab === 'track' && (
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <h3 className="text-lg font-semibold">Track Invoice</h3>
              </div>
              <p className="text-gray-600 mb-6">Monitor invoice status, payment history, and client interactions.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status Timeline */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Status Timeline
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">Invoice Created</p>
                        <p className="text-xs text-gray-500">{new Date(selectedInvoice.invoice_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${selectedInvoice.status === 'paid' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <div>
                        <p className="text-sm font-medium">Payment Status</p>
                        <p className="text-xs text-gray-500 capitalize">{selectedInvoice.status}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium mb-4">Quick Stats</h4>
                  <div className="space-y-2">
                    <p className="text-sm"><strong>Total Amount:</strong> ${selectedInvoice.total_amount.toFixed(2)}</p>
                    <p className="text-sm"><strong>Balance Due:</strong> ${(selectedInvoice.balance_due || 0).toFixed(2)}</p>
                    <p className="text-sm"><strong>Days Outstanding:</strong> {Math.floor((new Date() - new Date(selectedInvoice.invoice_date)) / (1000 * 60 * 60 * 24))}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Download Tab */}
          {activeInvoiceTab === 'download' && (
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Download className="text-gray-600" size={24} />
                <h3 className="text-lg font-semibold">Download Invoice</h3>
              </div>
              <p className="text-gray-600 mb-6">Generate and download various formats of this invoice for your records.</p>

              <div className="max-w-md mx-auto">
                <div className="border border-gray-200 rounded-lg p-6 text-center">
                  <Download className="text-gray-400 mx-auto mb-4" size={48} />
                  <h4 className="font-medium mb-2">PDF Invoice</h4>
                  <p className="text-sm text-gray-600 mb-4">Download a professionally formatted PDF copy of this invoice</p>
                  <button
                    onClick={() => downloadInvoicePdf(selectedInvoice)}
                    className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 flex items-center justify-center gap-2"
                  >
                    <Download size={16} />
                    Download PDF
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reminder Tab */}
          {activeInvoiceTab === 'reminder' && (
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold">Payment Reminders</h3>
              </div>
              <p className="text-gray-600 mb-6">Schedule automated payment reminders for overdue invoices.</p>

              <div className="max-w-md mx-auto">
                <div className="border border-orange-200 rounded-lg p-6 bg-orange-50 text-center">
                  <svg className="w-12 h-12 text-orange-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h4 className="font-medium mb-2">Automated Reminders</h4>
                  <p className="text-sm text-gray-600 mb-4">Set up automatic payment reminder notifications</p>
                  <button
                    onClick={() => {
                      alert('Set reminder feature coming soon!');
                    }}
                    className="w-full bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Configure Reminders
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Tab */}
          {activeInvoiceTab === 'delete' && (
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <h3 className="text-lg font-semibold text-red-600">Delete Invoice</h3>
              </div>

              <div className="max-w-md mx-auto">
                <div className="border border-red-200 rounded-lg p-6 bg-red-50">
                  <div className="text-center mb-6">
                    <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <h4 className="font-medium text-red-700 mb-2">Permanent Deletion</h4>
                    <p className="text-sm text-red-600 mb-4">This action cannot be undone. The invoice and all associated data will be permanently removed.</p>
                  </div>

                  <div className="bg-white border border-red-200 rounded p-3 mb-4">
                    <p className="text-sm text-gray-700"><strong>Invoice:</strong> #{selectedInvoice.invoice_number}</p>
                    <p className="text-sm text-gray-700"><strong>Amount:</strong> ${selectedInvoice.total_amount.toFixed(2)}</p>
                    <p className="text-sm text-gray-700"><strong>Client:</strong> {clientName}</p>
                  </div>

                  <button
                    onClick={() => {
                      setDeleteInvoice(selectedInvoice);
                      setShowDeleteModal(true);
                    }}
                    className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Invoice Permanently
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeInvoiceTab === 'analytics' && (
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="text-lg font-semibold">Invoice Analytics</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Performance Metrics */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Performance Metrics
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Days Outstanding</span>
                      <span className="text-sm font-medium">{Math.floor((new Date() - new Date(selectedInvoice.invoice_date)) / (1000 * 60 * 60 * 24))} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Payment Progress</span>
                      <span className="text-sm font-medium">{Math.round(((selectedInvoice.total_amount - (selectedInvoice.balance_due || 0)) / selectedInvoice.total_amount) * 100)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <span className={`text-sm font-medium ${selectedInvoice.status === 'paid' ? 'text-green-600' : selectedInvoice.status === 'overdue' ? 'text-red-600' : 'text-yellow-600'}`}>
                        {selectedInvoice.status.charAt(0).toUpperCase() + selectedInvoice.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Financial Breakdown */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    Financial Summary
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Amount</span>
                      <span className="text-sm font-medium">${selectedInvoice.total_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Amount Paid</span>
                      <span className="text-sm font-medium text-green-600">${((selectedInvoice.total_amount || 0) - (selectedInvoice.balance_due || 0)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Balance Due</span>
                      <span className="text-sm font-medium text-red-600">${(selectedInvoice.balance_due || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  };


  // Client Management View
  const renderClientManagement = () => (
    <ClientManagement
      clients={clients}
      loading={loading}
      setActiveView={setActiveView}
      setEditingClient={setEditingClient}
      setShowEditClientModal={setShowEditClientModal}
      deleteClient={deleteClient}
    />
  );


  // Clear all labels function
  const clearAllLabels = async () => {
    if (!window.confirm('Are you sure you want to delete ALL labels? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const deletePromises = lineItemLabels.map(label =>
        fetch(`${API_BASE}/api/admin/line-item-labels/${label.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
      );

      await Promise.all(deletePromises);
      await fetchLineItemLabels(); // Refresh the list
      alert('All labels have been deleted successfully!');
    } catch (error) {
      console.error('Error deleting labels:', error);
      alert('Failed to delete some labels. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Bulk create labels function
  const bulkCreateLabels = async () => {
    if (!bulkLabels.trim()) {
      setError('Please enter labels to add');
      return;
    }

    setBulkLabelOperationLoading(true);
    try {
      // Parse CSV format - comma-separated values on each line
      const labelsArray = bulkLabels
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .flatMap(line => {
          // Split by comma and create separate labels for each
          return line.split(',').map(label => ({
            label: label.trim()
          }));
        })
        .filter(item => item.label.length > 0);

      if (labelsArray.length === 0) {
        setError('No valid labels found');
        return;
      }

      // Create all labels
      const createPromises = labelsArray.map(labelData =>
        fetch(`${API_BASE}/api/admin/line-item-labels`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(labelData)
        })
      );

      const responses = await Promise.all(createPromises);
      const errors = [];

      for (let i = 0; i < responses.length; i++) {
        if (!responses[i].ok) {
          const errorData = await responses[i].json();
          errors.push(`Line ${i + 1}: ${errorData.error}`);
        }
      }

      await fetchLineItemLabels(); // Refresh the list
      setBulkLabels('');
      setShowBulkLabelModal(false);
      setError('');

      const successCount = responses.filter(r => r.ok).length;
      let message = `Successfully created ${successCount} labels!`;
      if (errors.length > 0) {
        message += `\n\nErrors:\n${errors.join('\n')}`;
      }
      alert(message);

    } catch (error) {
      console.error('Error bulk creating labels:', error);
      setError('Failed to bulk create labels');
    } finally {
      setBulkLabelOperationLoading(false);
    }
  };

  // Label Management View
  const renderLabelManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Line Item Labels</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowBulkLabelModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Bulk Add Labels
          </button>
          <button
            onClick={clearAllLabels}
            disabled={loading || lineItemLabels.length === 0}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Clearing...' : 'Clear All Labels'}
          </button>
          <button
            onClick={() => setActiveView('list')}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Back to Invoices
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Label
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Default Price
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {lineItemLabels.map((label) => (
              <tr key={label.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                  {label.label}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${label.default_unit_price?.toFixed(2) || '0.00'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPaymentManagement = () => {

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Payment Management</h2>
          <button
            onClick={() => setActiveView('list')}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Back to Invoices
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Payment Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Collected</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${allPayments.reduce((sum, payment) => sum + parseFloat(payment.payment_amount), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Payments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {allPayments.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CreditCard className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Card Payments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {allPayments.filter(p => p.payment_method.includes('card')).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Cash Payments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {allPayments.filter(p => p.payment_method === 'cash').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Records Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b">
            <h3 className="text-lg font-semibold text-gray-900">All Payment Records</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allPayments.map((payment) => {
                  const clientName = payment.is_business
                    ? payment.company_name
                    : `${payment.first_name} ${payment.last_name}`;

                  return (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        {payment.invoice_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {clientName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        ${parseFloat(payment.payment_amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${payment.payment_method === 'cash' ? 'bg-green-100 text-green-800' :
                          payment.payment_method === 'check' ? 'bg-blue-100 text-blue-800' :
                            payment.payment_method.includes('card') ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                          }`}>
                          {payment.payment_method.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.check_number || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {payment.notes || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setEditingPayment(payment)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeletingPayment(payment)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {allPayments.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No payment records found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Edit invoice handler
  const handleEditInvoice = async (invoiceData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/admin/invoices/${editingInvoice.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(invoiceData)
      });

      if (response.ok) {
        const updatedInvoice = await response.json();
        setEditingInvoice(null);

        // Reload full invoice details to ensure we have complete data including payments
        await loadInvoiceDetails(updatedInvoice.id);
        setActiveView('view');
        await fetchInvoices(); // Refresh the list
        alert('Invoice updated successfully!');
      } else {
        const errorData = await response.json();
        setError(`Failed to update invoice: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
      setError('Failed to update invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Edit invoice form renderer
  const renderEditInvoiceForm = () => {
    if (!editingInvoice) {
      return (
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Edit Invoice</h2>
          <p>No invoice selected for editing.</p>
          <button
            onClick={() => setActiveView('list')}
            className="mt-4 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Back to Invoices
          </button>
        </div>
      );
    }

    return (
      <CreateInvoiceForm
        error={error}
        newInvoice={editingInvoice}
        setNewInvoice={setEditingInvoice}
        clientSearchTerm={clientSearchTerm}
        setClientSearchTerm={setClientSearchTerm}
        showClientDropdown={showClientDropdown}
        setShowClientDropdown={setShowClientDropdown}
        searchResults={searchResults}
        isSearching={isSearching}
        setShowClientModal={setShowClientModal}
        taxRates={taxRates}
        lineItemLabels={lineItemLabels}
        token={token}
        API_BASE={API_BASE}
        calculateTotals={calculateTotals}
        addLineItem={addLineItem}
        updateLineItem={updateLineItem}
        removeLineItem={removeLineItem}
        createInvoice={handleEditInvoice}
        loading={loading}
        setActiveView={setActiveView}
        isEditing={true}
        editingInvoiceNumber={editingInvoice.invoice_number}
      />
    );
  };

  const renderTaxRateManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Tax Rate Management</h2>
        <button
          onClick={() => setActiveView('list')}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
        >
          Back to Invoices
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Add New Tax Rate Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Add New Tax Rate</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newTaxRate.state}
              onChange={(e) => setNewTaxRate(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
              className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="WA"
              maxLength="2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            <input
              type="text"
              value={newTaxRate.city}
              onChange={(e) => setNewTaxRate(prev => ({ ...prev, city: e.target.value }))}
              className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="Sunnyside"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tax Rate (%) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.001"
              value={newTaxRate.tax_rate}
              onChange={(e) => setNewTaxRate(prev => ({ ...prev, tax_rate: e.target.value }))}
              className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="8.3"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <input
              type="text"
              value={newTaxRate.description}
              onChange={(e) => setNewTaxRate(prev => ({ ...prev, description: e.target.value }))}
              className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="Optional description"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={createTaxRate}
            disabled={loading || !newTaxRate.state || !newTaxRate.tax_rate}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding...' : 'Add Tax Rate'}
          </button>
        </div>
      </div>

      {/* Bulk Operations */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">
              {selectedTaxRates.length} selected
            </span>
            {selectedTaxRates.length > 0 && (
              <button
                onClick={bulkDeleteTaxRates}
                disabled={bulkOperationLoading}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:bg-gray-400 flex items-center gap-2"
              >
                <Trash2 size={16} />
                {bulkOperationLoading ? 'Deleting...' : `Delete Selected (${selectedTaxRates.length})`}
              </button>
            )}
          </div>
          <button
            onClick={() => setShowBulkAddModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Plus size={16} />
            Bulk Add Tax Rates
          </button>
        </div>
      </div>

      {/* Tax Rates Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                State
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                City
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tax Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {taxRates.map((rate) => (
              <tr key={rate.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedTaxRates.includes(rate.id)}
                    onChange={() => toggleTaxRateSelection(rate.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingTaxRate?.id === rate.id ? (
                    <input
                      type="text"
                      value={editingTaxRate.state_code || editingTaxRate.state}
                      onChange={(e) => setEditingTaxRate(prev => ({ ...prev, state_code: e.target.value.toUpperCase() }))}
                      className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                      maxLength="2"
                    />
                  ) : (
                    <span className="font-medium text-gray-900">{rate.state_code}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingTaxRate?.id === rate.id ? (
                    <input
                      type="text"
                      value={editingTaxRate.city || ''}
                      onChange={(e) => setEditingTaxRate(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                    />
                  ) : (
                    <span className="text-sm text-gray-600">{rate.city || '-'}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingTaxRate?.id === rate.id ? (
                    <input
                      type="number"
                      step="0.001"
                      value={editingTaxRate.tax_rate}
                      onChange={(e) => setEditingTaxRate(prev => ({ ...prev, tax_rate: e.target.value }))}
                      className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                    />
                  ) : (
                    <span className="text-sm text-gray-900">{(rate.tax_rate || 0).toFixed(3)}%</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingTaxRate?.id === rate.id ? (
                    <input
                      type="text"
                      value={editingTaxRate.description || ''}
                      onChange={(e) => setEditingTaxRate(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                    />
                  ) : (
                    <span className="text-sm text-gray-500">{rate.description || '-'}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {editingTaxRate?.id === rate.id ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => updateTaxRate(rate.id, editingTaxRate)}
                        disabled={loading}
                        className="text-green-600 hover:text-green-900 disabled:text-gray-400"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => setEditingTaxRate(null)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingTaxRate({
                          id: rate.id,
                          city: rate.city,
                          state: rate.state,
                          tax_rate: rate.tax_rate // Already stored as percentage
                        })}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete the tax rate for ${rate.city}, ${rate.state}?`)) {
                            deleteTaxRate(rate.id);
                          }
                        }}
                        disabled={loading}
                        className="text-red-600 hover:text-red-900 disabled:text-gray-400"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {taxRates.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No tax rates configured. Add one above to get started.
          </div>
        )}
      </div>
    </div>
  );

  const renderLiveTracking = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Live Invoice Tracking</h2>
          <div className="flex items-center gap-2 text-sm text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live - Updates every 30s</span>
          </div>
        </div>
        <button
          onClick={() => setActiveView('list')}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
        >
          Back to Invoices
        </button>
      </div>

      {liveTrackingData ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  View Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Viewed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Link Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {liveTrackingData.map((invoice) => (
                <tr key={invoice.id} className={`hover:bg-gray-50 ${invoice.is_viewed ? 'bg-green-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="text-gray-400 mr-2" size={16} />
                      <span className="font-medium">{invoice.invoice_number}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {invoice.client_name}
                      </div>
                      <div className="text-sm text-gray-500">{invoice.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${invoice.total_amount?.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                      invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        invoice.view_count > 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {invoice.view_count} view{invoice.view_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.last_viewed ? (
                      <div>
                        <div>{new Date(invoice.last_viewed).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(invoice.last_viewed).toLocaleTimeString()}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">Never</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {invoice.has_token ? (
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          <span className="text-sm text-green-700">Active Link</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                          <span className="text-sm text-gray-500">No Link</span>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {liveTrackingData.length === 0 && (
            <div className="text-center py-8">
              <Eye className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-sm text-gray-500">No tracking data available</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading live tracking data...</p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {liveTrackingData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                <p className="text-2xl font-semibold text-gray-900">{liveTrackingData.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Viewed Invoices</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {liveTrackingData.filter(inv => inv.is_viewed).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {liveTrackingData.reduce((sum, inv) => sum + inv.view_count, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Views</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {liveTrackingData.filter(inv => !inv.is_viewed && inv.has_token).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderBulkAddModal = () => {
    if (!showBulkAddModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Bulk Add Tax Rates</h3>
              <button
                onClick={() => {
                  setShowBulkAddModal(false);
                  setBulkTaxRates('');
                  setError('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                Enter tax rates in CSV format, one per line:
                <br />
                <strong>Format:</strong> state_code,city,tax_rate_percentage,description
                <br />
                <strong>Example:</strong>
              </p>
              <div className="bg-gray-100 p-3 rounded text-sm font-mono mb-4">
                WA,Sunnyside,8.3,Sunnyside city tax<br />
                WA,Seattle,10.25,Seattle combined rate<br />
                OR,Portland,0,Oregon no sales tax
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax Rates Data
              </label>
              <textarea
                value={bulkTaxRates}
                onChange={(e) => setBulkTaxRates(e.target.value)}
                className="w-full h-40 p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="WA,Sunnyside,8.3,Sunnyside city tax&#10;WA,Seattle,10.25,Seattle combined rate"
              />
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowBulkAddModal(false);
                  setBulkTaxRates('');
                  setError('');
                }}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={bulkAddTaxRates}
                disabled={bulkOperationLoading || !bulkTaxRates.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {bulkOperationLoading ? 'Adding...' : 'Add Tax Rates'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Bulk Label Modal
  const renderBulkLabelModal = () => (
    showBulkLabelModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw] max-h-[80vh] overflow-y-auto">
          <h3 className="text-lg font-bold mb-4">Bulk Add Labels</h3>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Enter labels in CSV format. Use commas to separate multiple labels on the same line.
            </p>
            <p className="text-xs text-gray-500 mb-3">
              Examples:<br/>
              • Kitchen Cabinets, Bathroom Vanities, Appliances<br/>
              • Countertops, Hardware, Labor<br/>
              • Flooring, Paint, Electrical
            </p>
          </div>

          <textarea
            value={bulkLabels}
            onChange={(e) => setBulkLabels(e.target.value)}
            className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none h-48"
            placeholder="Kitchen Cabinets, Bathroom Vanities, Appliances
Countertops, Hardware, Labor
Flooring, Paint, Electrical
Plumbing, HVAC, Demolition"
          />

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowBulkLabelModal(false);
                setBulkLabels('');
                setError('');
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={bulkLabelOperationLoading}
            >
              Cancel
            </button>
            <button
              onClick={bulkCreateLabels}
              disabled={bulkLabelOperationLoading || !bulkLabels.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {bulkLabelOperationLoading ? 'Creating...' : 'Create Labels'}
            </button>
          </div>

          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    )
  );

  const renderReminderModal = () => null;
  const renderEditClientModal = () => (
    <ClientModal
      show={showEditClientModal}
      newClient={editingClient || {}}
      setNewClient={setEditingClient}
      clientError={clientError}
      setClientError={setClientError}
      activeClientTab={activeClientTab}
      setActiveClientTab={setActiveClientTab}
      clientAddress={clientAddress}
      setClientAddress={setClientAddress}
      mapLoaded={mapLoaded}
      autocomplete={autocomplete}
      initAutocomplete={initAutocomplete}
      loading={loading}
      isEditing={true}
      onClose={() => {
        setShowEditClientModal(false);
        setEditingClient(null);
        setClientError(null);
      }}
      onSave={() => updateClient(editingClient.id, editingClient)}
    />
  );
  const renderLabelModal = () => null;

  // Main render
  return (
    <div className="p-6">
      {activeView === 'list' && renderInvoiceList()}
      {activeView === 'create' && renderCreateInvoiceForm()}
      {activeView === 'view' && renderInvoiceView()}
      {activeView === 'edit' && renderEditInvoiceForm()}
      {activeView === 'clients' && renderClientManagement()}
      {activeView === 'payments' && renderPaymentManagement()}
      {activeView === 'tax-rates' && renderTaxRateManagement()}
      {activeView === 'labels' && renderLabelManagement()}
      {activeView === 'tracking' && renderLiveTracking()}
      <EmailModal
        show={showEmailModal}
        emailInvoice={emailInvoice}
        emailMessage={emailMessage}
        setEmailMessage={setEmailMessage}
        emailSending={emailSending}
        onCancel={() => {
          setShowEmailModal(false);
          setEmailMessage('');
          setEmailInvoice(null);
        }}
        onSend={sendInvoiceEmail}
      />
      <SmsModal
        show={showSmsModal}
        smsInvoice={smsInvoice}
        smsMessage={smsMessage}
        setSmsMessage={setSmsMessage}
        smsSending={smsSending}
        userRole={userRole}
        useCustomPhone={useCustomPhone}
        setUseCustomPhone={setUseCustomPhone}
        customPhoneNumber={customPhoneNumber}
        setCustomPhoneNumber={setCustomPhoneNumber}
        onCancel={() => {
          setShowSmsModal(false);
          setSmsMessage('');
          setSmsInvoice(null);
          setUseCustomPhone(false);
          setCustomPhoneNumber('');
        }}
        onSend={sendInvoiceSms}
      />
      <ClientModal
        show={showClientModal}
        newClient={newClient}
        setNewClient={setNewClient}
        clientError={clientError}
        setClientError={setClientError}
        activeClientTab={activeClientTab}
        setActiveClientTab={setActiveClientTab}
        clientAddress={clientAddress}
        setClientAddress={setClientAddress}
        mapLoaded={mapLoaded}
        autocomplete={autocomplete}
        initAutocomplete={initAutocomplete}
        loading={loading}
        onClose={() => {
          setShowClientModal(false);
          setNewClient({
            title: '',
            first_name: '',
            last_name: '',
            company_name: '',
            email: '',
            phone: '',
            is_business: false,
            tax_exempt_number: '',
            is_primary_phone: true,
            is_primary_email: true
          });
          setClientAddress({
            street: '',
            street2: '',
            city: '',
            state: '',
            zip: ''
          });
          setActiveClientTab('details');
          setClientError(null);
        }}
        onSave={createClient}
      />
      {renderBulkAddModal()}
      {renderBulkLabelModal()}
      {renderReminderModal()}
      {renderEditClientModal()}
      {renderLabelModal()}
      <PaymentModal
        show={showPaymentModal}
        invoice={paymentInvoice}
        onCancel={() => {
          setShowPaymentModal(false);
          setPaymentInvoice(null);
          setAddingPayment(false);
        }}
        onSubmit={addPayment}
        isSubmitting={addingPayment}
      />
      <EditPaymentModal
        show={!!editingPayment}
        payment={editingPayment}
        invoice={editingPayment ? invoices.find(inv => inv.id === editingPayment.invoice_id) : null}
        onCancel={() => setEditingPayment(null)}
        onSubmit={handleEditPayment}
        isSubmitting={loading}
      />
      <DeletePaymentModal
        show={!!deletingPayment}
        payment={deletingPayment}
        invoice={deletingPayment ? invoices.find(inv => inv.id === deletingPayment.invoice_id) : null}
        onCancel={() => setDeletingPayment(null)}
        onConfirm={handleDeletePayment}
        isDeleting={loading}
      />
      <DeleteModal
        show={showDeleteModal}
        deleteInvoice={deleteInvoice}
        deleting={deleting}
        onCancel={() => {
          setShowDeleteModal(false);
          setDeleteInvoice(null);
        }}
        onConfirm={handleDeleteInvoice}
      />
    </div>
  );
};

export default InvoiceManager;