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
  Calendar,
  Check,
  Clock,
  AlertCircle,
  Download,
  Send,
  MessageCircle,
  Trash2
} from 'lucide-react';

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
    tax_rate: ''
  });
  const [editingClient, setEditingClient] = useState(null);
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [newLabel, setNewLabel] = useState({
    label: '',
    item_type: 'material',
    description: ''
  });
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
    tax_rate: 0.065, // Default WA rate
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
          city: newTaxRate.city.trim(),
          state: newTaxRate.state.trim().toUpperCase(),
          tax_rate: parseFloat(newTaxRate.tax_rate)
        })
      });

      if (response.ok) {
        await fetchTaxRates();
        setNewTaxRate({ city: '', state: '', tax_rate: '' });
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
          city: updates.city.trim(),
          state: updates.state.trim().toUpperCase(),
          tax_rate: parseFloat(updates.tax_rate)
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
    try {
      setLoading(true);
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
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount - discountAmount + markupAmount;
    
    return {
      subtotal,
      taxAmount,
      total
    };
  };

  // Add line item
  const addLineItem = () => {
    const newLineItem = {
      description: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      item_type: 'material'
    };
    setNewInvoice(prev => ({
      ...prev,
      line_items: [...prev.line_items, newLineItem]
    }));
  };

  // Update line item
  const updateLineItem = (index, field, value) => {
    const updatedItems = [...newInvoice.line_items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Recalculate total price for this line item
    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].total_price = updatedItems[index].quantity * updatedItems[index].unit_price;
    }
    
    // Recalculate invoice totals
    const totals = calculateTotals(
      updatedItems, 
      newInvoice.tax_rate, 
      newInvoice.discount_amount, 
      newInvoice.markup_amount
    );
    
    setNewInvoice(prev => ({
      ...prev,
      line_items: updatedItems,
      subtotal: totals.subtotal,
      tax_amount: totals.taxAmount,
      total_amount: totals.total
    }));
  };

  // Remove line item
  const removeLineItem = (index) => {
    const updatedItems = newInvoice.line_items.filter((_, i) => i !== index);
    const totals = calculateTotals(
      updatedItems, 
      newInvoice.tax_rate, 
      newInvoice.discount_amount, 
      newInvoice.markup_amount
    );
    
    setNewInvoice(prev => ({
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
          tax_rate: 0.065,
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

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: Clock },
      sent: { color: 'bg-blue-100 text-blue-800', icon: Send },
      partial: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
      paid: { color: 'bg-green-100 text-green-800', icon: Check }
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon size={12} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
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
  const sendInvoiceEmail = async () => {
    setEmailSending(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/invoices/${emailInvoice.id}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: emailMessage })
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
    
    // Client-side validation
    const validationErrors = [];
    
    if (!clientToSubmit.email || !clientToSubmit.email.trim()) {
      validationErrors.push('Email address is required');
    } else if (!/\S+@\S+\.\S+/.test(clientToSubmit.email)) {
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
          item_type: 'material',
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Invoice Management</h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveView('clients')}
            className="bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2 text-sm"
          >
            <User size={16} />
            Clients
          </button>
          <button
            onClick={() => setActiveView('tax-rates')}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
          >
            <DollarSign size={16} />
            Tax Rates
          </button>
          <button
            onClick={() => setActiveView('tracking')}
            className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2 text-sm"
          >
            <Eye size={16} />
            Live Tracking
          </button>
          <button
            onClick={() => setShowClientModal(true)}
            className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            Add Client
          </button>
          <button
            onClick={() => setActiveView('labels')}
            className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2 text-sm"
          >
            <FileText size={16} />
            Labels
          </button>
          <button
            onClick={() => setShowLabelModal(true)}
            className="bg-orange-600 text-white px-3 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            Add Label
          </button>
          <button
            onClick={() => setActiveView('create')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={20} />
            Create Invoice
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={invoiceSearchTerm}
                onChange={(e) => setInvoiceSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search invoices by number, client name, email, amount, or status..."
              />
              {invoiceSearchTerm && (
                <button
                  onClick={() => setInvoiceSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          {invoiceSearchTerm && (
            <div className="text-sm text-gray-500">
              {filteredInvoices.length} of {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Invoice table */}
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
                Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredInvoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FileText className="text-gray-400 mr-2" size={16} />
                    <span className="font-medium">{invoice.invoice_number}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {invoice.is_business ? invoice.company_name : `${invoice.first_name} ${invoice.last_name}`}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${invoice.total_amount?.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={invoice.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(invoice.invoice_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button
                    onClick={() => {
                      loadInvoiceDetails(invoice.id);
                      setActiveView('view');
                    }}
                    className="text-blue-600 hover:text-blue-900"
                    title="View Invoice"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => {
                      loadInvoiceDetails(invoice.id, true);
                      setActiveView('edit');
                    }}
                    className="text-purple-600 hover:text-purple-900"
                    title="Edit Invoice"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => {
                      setEmailInvoice(invoice);
                      setShowEmailModal(true);
                    }}
                    className="text-green-600 hover:text-green-900"
                    title="Send Email"
                  >
                    <Send size={16} />
                  </button>
                  <button 
                    onClick={() => {
                      setSmsInvoice(invoice);
                      setShowSmsModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                    title="Send SMS"
                  >
                    <MessageCircle size={16} />
                  </button>
                  <button 
                    onClick={() => downloadInvoicePdf(invoice)}
                    className="text-gray-600 hover:text-gray-900" 
                    title="Download PDF"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    onClick={() => {
                      setDeleteInvoice(invoice);
                      setShowDeleteModal(true);
                    }}
                    className="text-red-600 hover:text-red-900"
                    title="Delete Invoice"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredInvoices.length === 0 && invoiceSearchTerm && (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center">
                  <div className="text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-sm">No invoices found matching "{invoiceSearchTerm}"</p>
                    <p className="text-xs text-gray-400 mt-1">Try adjusting your search terms</p>
                  </div>
                </td>
              </tr>
            )}
            {invoices.length === 0 && !invoiceSearchTerm && (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center">
                  <div className="text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm">No invoices created yet</p>
                    <p className="text-xs text-gray-400 mt-1">Create your first invoice to get started</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Create invoice form
  const renderCreateInvoiceForm = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Create New Invoice</h2>
        <button
          onClick={() => setActiveView('list')}
          className="text-gray-600 hover:text-gray-900"
        >
          Back to List
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client Selection */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client *
            </label>
            <div className="relative client-dropdown-container">
              <div className="relative">
                <input
                  type="text"
                  value={clientSearchTerm}
                  onChange={(e) => {
                    const value = e.target.value;
                    setClientSearchTerm(value);
                    setNewInvoice(prev => ({ ...prev, client_id: '' }));
                    
                    // Show dropdown when user starts typing
                    if (value.length > 0) {
                      setShowClientDropdown(true);
                    }
                  }}
                  onFocus={() => setShowClientDropdown(true)}
                  onClick={() => setShowClientDropdown(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setShowClientDropdown(false);
                      setClientSearchTerm('');
                    }
                  }}
                  className="w-full p-3 pr-20 border rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="Click to select client or type to search..."
                  required={!newInvoice.client_id}
                />
                {/* Clear button */}
                {clientSearchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setClientSearchTerm('');
                      setNewInvoice(prev => ({ ...prev, client_id: '' }));
                      setShowClientDropdown(false);
                    }}
                    className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                
                {/* Dropdown button */}
                <button
                  type="button"
                  onClick={() => setShowClientDropdown(!showClientDropdown)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              
              {/* Dropdown with search results */}
              {showClientDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {/* Add New Client Option - Always visible */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowClientModal(true);
                      setShowClientDropdown(false);
                      setClientSearchTerm('');
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 flex items-center gap-2 text-blue-600 font-medium"
                  >
                    <Plus size={16} />
                    Add New Client
                  </button>
                  
                  {/* Show message when no search term */}
                  {clientSearchTerm.length === 0 && (
                    <div className="px-4 py-3 text-gray-500 text-center text-sm">
                      Type to search existing clients
                    </div>
                  )}
                  
                  {/* Search Results */}
                  {clientSearchTerm.length >= 2 && searchResults.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => {
                        setNewInvoice(prev => ({ ...prev, client_id: client.id }));
                        setClientSearchTerm(
                          client.is_business 
                            ? client.company_name 
                            : `${client.first_name} ${client.last_name}`
                        );
                        setShowClientDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          {client.is_business 
                            ? client.company_name 
                            : `${client.first_name} ${client.last_name}`}
                        </div>
                        <div className="text-sm text-gray-500">
                          {client.email}
                        </div>
                      </div>
                    </button>
                  ))}
                  
                  {/* No results message */}
                  {clientSearchTerm.length >= 2 && searchResults.length === 0 && !isSearching && (
                    <div className="px-4 py-3 text-gray-500 text-center text-sm">
                      No clients found matching "{clientSearchTerm}"
                    </div>
                  )}
                  
                  {/* Loading indicator */}
                  {isSearching && clientSearchTerm.length >= 2 && (
                    <div className="px-4 py-3 text-gray-500 text-center text-sm flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      Searching...
                    </div>
                  )}
                </div>
              )}
              
              {/* Selected client display */}
              {newInvoice.client_id && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                  ✓ Selected: {clientSearchTerm}
                </div>
              )}
            </div>
          </div>

          {/* Invoice Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invoice Date *
            </label>
            <input
              type="date"
              value={newInvoice.invoice_date}
              onChange={(e) => setNewInvoice(prev => ({ ...prev, invoice_date: e.target.value }))}
              className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date *
            </label>
            <input
              type="date"
              value={newInvoice.due_date}
              onChange={(e) => setNewInvoice(prev => ({ ...prev, due_date: e.target.value }))}
              className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* Tax Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tax Rate
            </label>
            <select
              value={newInvoice.tax_rate}
              onChange={(e) => {
                const taxRate = parseFloat(e.target.value);
                const totals = calculateTotals(
                  newInvoice.line_items,
                  taxRate,
                  newInvoice.discount_amount,
                  newInvoice.markup_amount
                );
                setNewInvoice(prev => ({
                  ...prev,
                  tax_rate: taxRate,
                  tax_amount: totals.taxAmount,
                  total_amount: totals.total
                }));
              }}
              className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
            >
              {taxRates.map((rate) => (
                <option key={rate.id} value={rate.tax_rate}>
                  {rate.state_code} - {(rate.tax_rate * 100).toFixed(2)}%
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Line Items */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Line Items</h3>
            <button
              type="button"
              onClick={addLineItem}
              className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Plus size={16} />
              Add Line
            </button>
          </div>

          <div className="space-y-3">
            {newInvoice.line_items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-center p-3 bg-gray-50 rounded-lg">
                <div className="col-span-4">
                  <input
                    type="text"
                    placeholder="Item description"
                    value={item.description}
                    onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                    className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <select
                    value={item.item_type}
                    onChange={(e) => updateLineItem(index, 'item_type', e.target.value)}
                    className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none text-sm"
                  >
                    <option value="material">Material</option>
                    <option value="labor">Labor</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={item.quantity}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || value === null) {
                        updateLineItem(index, 'quantity', '');
                      } else {
                        updateLineItem(index, 'quantity', value);
                      }
                    }}
                    onBlur={(e) => {
                      // Convert to number on blur for validation
                      const value = e.target.value;
                      if (value === '' || value === null) {
                        updateLineItem(index, 'quantity', 0);
                      } else {
                        const numValue = parseFloat(value);
                        updateLineItem(index, 'quantity', isNaN(numValue) ? 0 : numValue);
                      }
                    }}
                    onFocus={(e) => e.target.select()}
                    className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={item.unit_price}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || value === null) {
                        updateLineItem(index, 'unit_price', '');
                      } else {
                        updateLineItem(index, 'unit_price', value);
                      }
                    }}
                    onBlur={(e) => {
                      // Convert to number on blur for validation
                      const value = e.target.value;
                      if (value === '' || value === null) {
                        updateLineItem(index, 'unit_price', 0);
                      } else {
                        const numValue = parseFloat(value);
                        updateLineItem(index, 'unit_price', isNaN(numValue) ? 0 : numValue);
                      }
                    }}
                    onFocus={(e) => e.target.select()}
                    className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none text-sm"
                  />
                </div>
                <div className="col-span-1">
                  <span className="text-sm font-medium">${item.total_price?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="col-span-1">
                  <button
                    type="button"
                    onClick={() => removeLineItem(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={newInvoice.discount_amount === 0 ? '' : newInvoice.discount_amount}
                onChange={(e) => {
                  const value = e.target.value;
                  let discountAmount = 0;
                  if (value !== '') {
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue)) {
                      discountAmount = numValue;
                    }
                  }
                  const totals = calculateTotals(
                    newInvoice.line_items,
                    newInvoice.tax_rate,
                    discountAmount,
                    newInvoice.markup_amount
                  );
                  setNewInvoice(prev => ({
                    ...prev,
                    discount_amount: discountAmount,
                    total_amount: totals.total
                  }));
                }}
                onFocus={(e) => e.target.select()}
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Markup Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={newInvoice.markup_amount === 0 ? '' : newInvoice.markup_amount}
                onChange={(e) => {
                  const value = e.target.value;
                  let markupAmount = 0;
                  if (value !== '') {
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue)) {
                      markupAmount = numValue;
                    }
                  }
                  const totals = calculateTotals(
                    newInvoice.line_items,
                    newInvoice.tax_rate,
                    newInvoice.discount_amount,
                    markupAmount
                  );
                  setNewInvoice(prev => ({
                    ...prev,
                    markup_amount: markupAmount,
                    total_amount: totals.total
                  }));
                }}
                onFocus={(e) => e.target.select()}
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${newInvoice.subtotal?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>${newInvoice.tax_amount?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>${newInvoice.total_amount?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            value={newInvoice.notes}
            onChange={(e) => setNewInvoice(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
            placeholder="Additional notes..."
          />
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => setActiveView('list')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={createInvoice}
            disabled={loading || !newInvoice.client_id || newInvoice.line_items.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </div>
    </div>
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

  // Invoice detail view
  const renderInvoiceView = () => {
    if (!selectedInvoice) return null;

    const clientName = selectedInvoice.is_business 
      ? selectedInvoice.company_name 
      : `${selectedInvoice.first_name} ${selectedInvoice.last_name}`;

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
          <div className="flex gap-2">
            <button
              onClick={() => {
                loadInvoiceDetails(selectedInvoice.id, true);
                setActiveView('edit');
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
            >
              <Edit size={16} />
              Edit Invoice
            </button>
            <button
              onClick={() => downloadInvoicePdf(selectedInvoice)}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2 text-sm"
            >
              <Download size={16} />
              Download PDF
            </button>
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
        </div>

        {/* Invoice Details */}
        <div className="bg-white rounded-lg shadow p-6">
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
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    selectedInvoice.status === 'paid' ? 'bg-green-100 text-green-800' :
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
                          <p className="font-medium">{item.description}</p>
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
                  <span>${(selectedInvoice.subtotal_amount || 0).toFixed(2)}</span>
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
                    <span>Tax ({((selectedInvoice.tax_rate || 0) * 100).toFixed(2)}%):</span>
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

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setEmailInvoice(selectedInvoice);
                setShowEmailModal(true);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Send size={16} />
              Send Email
            </button>
            <button
              onClick={() => {
                setSmsInvoice(selectedInvoice);
                setShowSmsModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <MessageCircle size={16} />
              Send SMS
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Email Modal
  const renderEmailModal = () => {
    if (!showEmailModal || !emailInvoice) return null;
    
    const clientName = emailInvoice.is_business 
      ? emailInvoice.company_name 
      : `${emailInvoice.first_name} ${emailInvoice.last_name}`;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <h3 className="text-lg font-semibold mb-4">Send Invoice Email</h3>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Invoice:</strong> {emailInvoice.invoice_number}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Client:</strong> {clientName}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              <strong>Email:</strong> {emailInvoice.email}
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Additional Message (Optional)
            </label>
            <textarea
              value={emailMessage}
              onChange={(e) => setEmailMessage(e.target.value)}
              rows={4}
              className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="Add a personal message to include with the invoice..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowEmailModal(false);
                setEmailMessage('');
                setEmailInvoice(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={emailSending}
            >
              Cancel
            </button>
            <button
              onClick={sendInvoiceEmail}
              disabled={emailSending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {emailSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Send Email
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Client Management View
  const renderClientManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Client Management</h2>
        <button
          onClick={() => setActiveView('list')}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
        >
          Back to Invoices
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name/Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">
                    {client.is_business ? client.company_name : `${client.first_name} ${client.last_name}`}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {client.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {client.phone}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    client.is_business 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {client.is_business ? 'Business' : 'Individual'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditingClient({...client});
                        setShowEditClientModal(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Edit client"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete ${client.is_business ? client.company_name : `${client.first_name} ${client.last_name}`}? This action cannot be undone.`)) {
                          deleteClient(client.id);
                        }
                      }}
                      disabled={loading}
                      className="text-red-600 hover:text-red-900 disabled:text-gray-400"
                      title="Delete client"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Label Management View
  const renderLabelManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Line Item Labels</h2>
        <button
          onClick={() => setActiveView('list')}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
        >
          Back to Invoices
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Label
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {lineItemLabels.map((label) => (
              <tr key={label.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                  {label.label}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    label.item_type === 'material' 
                      ? 'bg-blue-100 text-blue-800'
                      : label.item_type === 'labor'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {label.item_type}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {label.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            <input
              type="text"
              value={newTaxRate.city}
              onChange={(e) => setNewTaxRate(prev => ({ ...prev, city: e.target.value }))}
              className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="Enter city name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State
            </label>
            <input
              type="text"
              value={newTaxRate.state}
              onChange={(e) => setNewTaxRate(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
              className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="WA"
              maxLength="2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tax Rate (%)
            </label>
            <input
              type="number"
              step="0.001"
              value={newTaxRate.tax_rate}
              onChange={(e) => setNewTaxRate(prev => ({ ...prev, tax_rate: e.target.value }))}
              className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="6.5"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={createTaxRate}
              disabled={loading || !newTaxRate.city || !newTaxRate.state || !newTaxRate.tax_rate}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Tax Rate'}
            </button>
          </div>
        </div>
      </div>

      {/* Tax Rates Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                City
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                State
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tax Rate
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
                  {editingTaxRate?.id === rate.id ? (
                    <input
                      type="text"
                      value={editingTaxRate.city}
                      onChange={(e) => setEditingTaxRate(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                    />
                  ) : (
                    <span className="font-medium text-gray-900">{rate.city}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingTaxRate?.id === rate.id ? (
                    <input
                      type="text"
                      value={editingTaxRate.state}
                      onChange={(e) => setEditingTaxRate(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
                      className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                      maxLength="2"
                    />
                  ) : (
                    <span className="text-sm text-gray-500">{rate.state}</span>
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
                    <span className="text-sm text-gray-900">{(rate.tax_rate * 100).toFixed(3)}%</span>
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
                          tax_rate: rate.tax_rate
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

  // Client Modal
  const renderClientModal = () => {
    if (!showClientModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[95vh] overflow-hidden">
          {/* Form */}
          <div className="p-6 overflow-y-auto">
            <h3 className="text-xl font-semibold mb-6 text-gray-800">Add New Client</h3>
            
            {/* Error Alert */}
            {clientError && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        {clientError.title}
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <ul className="list-disc pl-5 space-y-1">
                          {clientError.messages.map((message, index) => (
                            <li key={index}>{message}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setClientError(null)}
                      className="inline-flex text-red-400 hover:text-red-600 focus:outline-none"
                    >
                      <span className="sr-only">Dismiss</span>
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveClientTab('details')}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                    activeClientTab === 'details'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Client Details
                </button>
                <button
                  onClick={() => setActiveClientTab('address')}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                    activeClientTab === 'address'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Service Address
                </button>
              </nav>
            </div>

            {activeClientTab === 'details' ? (
              <div className="space-y-6">
                {/* Client Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    What Type Of Client Is This?
                  </label>
                  <div className="flex items-center space-x-8">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={!newClient.is_business}
                        onChange={() => setNewClient(prev => ({ ...prev, is_business: false }))}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Individual / Residential</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={newClient.is_business}
                        onChange={() => setNewClient(prev => ({ ...prev, is_business: true }))}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Business / Commercial</span>
                    </label>
                  </div>
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div className="max-w-[120px]">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <select 
                      value={newClient.title || ''}
                      onChange={(e) => setNewClient(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="">No title</option>
                      <option value="Mr.">Mr.</option>
                      <option value="Mrs.">Mrs.</option>
                      <option value="Ms.">Ms.</option>
                      <option value="Dr.">Dr.</option>
                    </select>
                  </div>
                  
                  {newClient.is_business ? (
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        value={newClient.company_name}
                        onChange={(e) => setNewClient(prev => ({ ...prev, company_name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Company Name"
                        required
                      />
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name *
                        </label>
                        <input
                          type="text"
                          value={newClient.first_name}
                          onChange={(e) => setNewClient(prev => ({ ...prev, first_name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="First Name"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          value={newClient.last_name}
                          onChange={(e) => setNewClient(prev => ({ ...prev, last_name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="Last Name"
                          required
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setNewClient(prev => ({ ...prev, is_primary_phone: !prev.is_primary_phone }))}
                      className={`flex items-center p-1 rounded ${newClient.is_primary_phone ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-400'}`}
                      title={newClient.is_primary_phone ? "Primary phone number" : "Click to mark as primary"}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                    <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500">
                      <option>Main</option>
                      <option>Mobile</option>
                      <option>Work</option>
                      <option>Home</option>
                    </select>
                    <div className="flex items-center border border-gray-300 rounded-md">
                      <span className="px-3 py-2 bg-gray-50 border-r text-sm">🇺🇸 +1</span>
                      <input
                        type="tel"
                        value={newClient.phone}
                        onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                        className="px-3 py-2 flex-1 rounded-r-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="(555) 421-5245"
                      />
                    </div>
                    <button type="button" className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md">
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setNewClient(prev => ({ ...prev, is_primary_email: !prev.is_primary_email }))}
                      className={`flex items-center p-1 rounded ${newClient.is_primary_email ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-400'}`}
                      title={newClient.is_primary_email ? "Primary email address" : "Click to mark as primary"}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                    <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500">
                      <option>Main</option>
                      <option>Work</option>
                      <option>Personal</option>
                    </select>
                    <input
                      type="email"
                      value={newClient.email}
                      onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="example@email.com"
                      required
                    />
                    <button type="button" className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md">
                      +
                    </button>
                  </div>
                </div>

                {/* Tax Exempt Toggle */}
                <div>
                  <label className="flex items-center">
                    <span className="text-sm font-medium text-gray-700 mr-3">Is This Client Tax Exempt?</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={!!newClient.tax_exempt_number}
                        onChange={(e) => setNewClient(prev => ({ 
                          ...prev, 
                          tax_exempt_number: e.target.checked ? 'pending' : '' 
                        }))}
                        className="sr-only"
                      />
                      <div className={`block bg-gray-600 w-14 h-8 rounded-full transition-colors ${
                        newClient.tax_exempt_number ? 'bg-green-500' : 'bg-gray-300'
                      }`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
                        newClient.tax_exempt_number ? 'transform translate-x-6' : ''
                      }`}></div>
                    </div>
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Billing Address Section */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Billing Address</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                      <input
                        ref={(input) => {
                          if (input && mapLoaded && !autocomplete) {
                            initAutocomplete(input);
                          }
                        }}
                        type="text"
                        value={clientAddress.street}
                        onChange={(e) => setClientAddress(prev => ({ ...prev, street: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Start typing an address..."
                      />
                      {!mapLoaded && (
                        <p className="text-xs text-gray-500 mt-1">Loading address suggestions...</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Apt, Suite, etc (optional)</label>
                      <input
                        type="text"
                        value={clientAddress.street2}
                        onChange={(e) => setClientAddress(prev => ({ ...prev, street2: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Apt, Suite, etc (optional)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                      <input
                        type="text"
                        value={clientAddress.city}
                        onChange={(e) => setClientAddress(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="City"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">State/Province</label>
                        <input
                          type="text"
                          value={clientAddress.state}
                          onChange={(e) => setClientAddress(prev => ({ ...prev, state: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="State/Province"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Zip/Postal code</label>
                        <input
                          type="text"
                          value={clientAddress.zip}
                          onChange={(e) => setClientAddress(prev => ({ ...prev, zip: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="Zip/Postal code"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                      <input
                        type="text"
                        value={clientAddress.country}
                        onChange={(e) => setClientAddress(prev => ({ ...prev, country: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Country"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={() => {
                  setShowClientModal(false);
                  setNewClient({
                    is_business: false,
                    company_name: '',
                    first_name: '',
                    last_name: '',
                    email: '',
                    phone: '',
                    address: '',
                    tax_exempt_number: ''
                  });
                  setClientAddress({
                    street: '',
                    street2: '',
                    city: '',
                    state: '',
                    zip: '',
                    country: 'United States'
                  });
                  setActiveClientTab('details');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                Close
              </button>
              <button
                onClick={() => {
                  // Combine address fields
                  const fullAddress = [
                    clientAddress.street,
                    clientAddress.street2,
                    clientAddress.city,
                    clientAddress.state,
                    clientAddress.zip,
                    clientAddress.country
                  ].filter(Boolean).join(', ');
                  
                  // Update newClient with combined address
                  const clientToCreate = {
                    ...newClient,
                    address: fullAddress || newClient.address
                  };
                  
                  // Create the client with combined data
                  createClient(clientToCreate);
                }}
                disabled={loading || !newClient.email || 
                  (newClient.is_business ? !newClient.company_name : !newClient.first_name || !newClient.last_name)}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Label Modal
  const renderLabelModal = () => {
    if (!showLabelModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <h3 className="text-lg font-semibold mb-4">Add New Label</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Label *</label>
              <input
                type="text"
                value={newLabel.label}
                onChange={(e) => setNewLabel(prev => ({ ...prev, label: e.target.value }))}
                className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="e.g., Custom Cabinets, Installation, etc."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Item Type *</label>
              <select
                value={newLabel.item_type}
                onChange={(e) => setNewLabel(prev => ({ ...prev, item_type: e.target.value }))}
                className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
                required
              >
                <option value="material">Material</option>
                <option value="labor">Labor</option>
                <option value="service">Service</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={newLabel.description}
                onChange={(e) => setNewLabel(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="Optional description for this label type"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => {
                setShowLabelModal(false);
                setNewLabel({
                  label: '',
                  item_type: 'material',
                  description: ''
                });
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={createLabel}
              disabled={loading || !newLabel.label}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Label'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderEditClientModal = () => {
    if (!showEditClientModal || !editingClient) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">Edit Client</h3>
          
          <div className="space-y-4">
            {/* Client Type Toggle */}
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={!editingClient.is_business}
                  onChange={() => setEditingClient(prev => ({ ...prev, is_business: false }))}
                  className="mr-2"
                />
                Individual
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={editingClient.is_business}
                  onChange={() => setEditingClient(prev => ({ ...prev, is_business: true }))}
                  className="mr-2"
                />
                Business
              </label>
            </div>

            {editingClient.is_business ? (
              <div>
                <label className="block text-sm font-medium mb-2">Company Name *</label>
                <input
                  type="text"
                  value={editingClient.company_name}
                  onChange={(e) => setEditingClient(prev => ({ ...prev, company_name: e.target.value }))}
                  className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">First Name *</label>
                  <input
                    type="text"
                    value={editingClient.first_name}
                    onChange={(e) => setEditingClient(prev => ({ ...prev, first_name: e.target.value }))}
                    className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Last Name *</label>
                  <input
                    type="text"
                    value={editingClient.last_name}
                    onChange={(e) => setEditingClient(prev => ({ ...prev, last_name: e.target.value }))}
                    className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Email *</label>
              <input
                type="email"
                value={editingClient.email}
                onChange={(e) => setEditingClient(prev => ({ ...prev, email: e.target.value }))}
                className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <input
                type="tel"
                value={editingClient.phone}
                onChange={(e) => setEditingClient(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Address</label>
              <textarea
                value={editingClient.address}
                onChange={(e) => setEditingClient(prev => ({ ...prev, address: e.target.value }))}
                rows={3}
                className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="Full address including city, state, and ZIP"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tax Exempt Number</label>
              <input
                type="text"
                value={editingClient.tax_exempt_number}
                onChange={(e) => setEditingClient(prev => ({ ...prev, tax_exempt_number: e.target.value }))}
                className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="Optional tax exempt number"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => {
                setShowEditClientModal(false);
                setEditingClient(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={() => updateClient(editingClient.id, editingClient)}
              disabled={loading || 
                (editingClient.is_business ? !editingClient.company_name : !editingClient.first_name || !editingClient.last_name) || 
                !editingClient.email}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Client'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // SMS Modal
  const renderSmsModal = () => {
    if (!showSmsModal || !smsInvoice) return null;
    
    const clientName = smsInvoice.is_business 
      ? smsInvoice.company_name 
      : `${smsInvoice.first_name} ${smsInvoice.last_name}`;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <h3 className="text-lg font-semibold mb-4">Send Invoice SMS</h3>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Invoice:</strong> {smsInvoice.invoice_number}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Client:</strong> {clientName}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              <strong>Phone:</strong> {smsInvoice.phone || 'Not provided'}
            </p>
          </div>

          {/* Super Admin Phone Override */}
          {userRole === 'super_admin' && (
            <div className="mb-4">
              <label className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={useCustomPhone}
                  onChange={(e) => setUseCustomPhone(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm font-medium">Send to different phone number</span>
              </label>
              
              {useCustomPhone && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Custom Phone Number
                  </label>
                  <input
                    type="tel"
                    value={customPhoneNumber}
                    onChange={(e) => setCustomPhoneNumber(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="e.g., (509) 790-3516"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Override client phone number (admin only)
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Additional Message (Optional)
            </label>
            <textarea
              value={smsMessage}
              onChange={(e) => setSmsMessage(e.target.value)}
              rows={4}
              className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="Add a brief message to include with the SMS..."
              maxLength={160}
            />
            <p className="text-xs text-gray-500 mt-1">
              {smsMessage.length}/160 characters
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowSmsModal(false);
                setSmsMessage('');
                setSmsInvoice(null);
                setCustomPhoneNumber('');
                setUseCustomPhone(false);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={smsSending}
            >
              Cancel
            </button>
            <button
              onClick={sendInvoiceSms}
              disabled={smsSending || (useCustomPhone && !customPhoneNumber)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {smsSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </>
              ) : (
                <>
                  <MessageCircle size={16} />
                  Send SMS
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Delete confirmation modal
  const renderDeleteModal = () => {
    if (!showDeleteModal || !deleteInvoice) return null;
    
    const clientName = deleteInvoice.is_business 
      ? deleteInvoice.company_name 
      : `${deleteInvoice.first_name} ${deleteInvoice.last_name}`;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <div className="flex items-center mb-4">
            <AlertCircle className="text-red-600 mr-3" size={24} />
            <h3 className="text-lg font-semibold text-red-800">Delete Invoice</h3>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete this invoice? This action cannot be undone.
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="space-y-2 text-sm">
                <p><strong>Invoice:</strong> {deleteInvoice.invoice_number}</p>
                <p><strong>Client:</strong> {clientName}</p>
                <p><strong>Amount:</strong> ${(deleteInvoice.total_amount || 0).toFixed(2)}</p>
                <p><strong>Date:</strong> {new Date(deleteInvoice.invoice_date).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm font-medium">
                ⚠️ This will permanently delete:
              </p>
              <ul className="text-yellow-700 text-sm mt-2 ml-4 list-disc">
                <li>Invoice and all line items</li>
                <li>Payment records</li>
                <li>Client access tokens</li>
                <li>All related data</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteInvoice(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteInvoice}
              disabled={deleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {deleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Delete Invoice
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Edit Invoice Form
  const renderEditInvoiceForm = () => {
    if (!editingInvoice) return null;

    const updateEditingInvoice = (field, value) => {
      setEditingInvoice(prev => ({ ...prev, [field]: value }));
    };

    const updateEditLineItem = (index, field, value) => {
      setEditingInvoice(prev => ({
        ...prev,
        line_items: prev.line_items.map((item, i) => 
          i === index ? { ...item, [field]: value } : item
        )
      }));
    };

    const addEditLineItem = () => {
      setEditingInvoice(prev => ({
        ...prev,
        line_items: [...prev.line_items, {
          description: '',
          quantity: 1,
          unit_price: 0,
          notes: '',
          label_id: null
        }]
      }));
    };

    const removeEditLineItem = (index) => {
      setEditingInvoice(prev => ({
        ...prev,
        line_items: prev.line_items.filter((_, i) => i !== index)
      }));
    };

    const saveInvoiceChanges = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/api/admin/invoices/${editingInvoice.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            client_id: editingInvoice.client_id,
            invoice_date: editingInvoice.invoice_date,
            due_date: editingInvoice.due_date,
            line_items: editingInvoice.line_items,
            discount_amount: editingInvoice.discount_amount || 0,
            markup_amount: editingInvoice.markup_amount || 0,
            tax_rate: editingInvoice.tax_rate || 0,
            notes: editingInvoice.notes || '',
            status: editingInvoice.status
          })
        });

        if (response.ok) {
          const updatedInvoice = await response.json();
          setSelectedInvoice(updatedInvoice);
          setEditingInvoice(null);
          setActiveView('view');
          fetchInvoices(); // Refresh the list
          setError('');
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to update invoice');
        }
      } catch (error) {
        console.error('Error updating invoice:', error);
        setError('Failed to update invoice');
      } finally {
        setLoading(false);
      }
    };

    // Calculate totals for editing invoice
    const subtotal = editingInvoice.line_items?.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0));
    }, 0) || 0;

    const discountAmount = parseFloat(editingInvoice.discount_amount || 0);
    const markupAmount = parseFloat(editingInvoice.markup_amount || 0);
    const taxRate = parseFloat(editingInvoice.tax_rate || 0);
    
    const afterDiscount = subtotal - discountAmount;
    const afterMarkup = afterDiscount + markupAmount;
    const taxAmount = afterMarkup * (taxRate / 100);
    const total = afterMarkup + taxAmount;

    const clientName = editingInvoice.is_business 
      ? editingInvoice.company_name 
      : `${editingInvoice.first_name} ${editingInvoice.last_name}`;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Edit Invoice</h2>
            <p className="text-gray-600 mt-1">Invoice #{editingInvoice.invoice_number}</p>
            <p className="text-sm text-gray-500">Client: {clientName}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setEditingInvoice(null);
                setActiveView('view');
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={saveInvoiceChanges}
              disabled={loading || editingInvoice.line_items?.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          {/* Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice Date
              </label>
              <input
                type="date"
                value={editingInvoice.invoice_date}
                onChange={(e) => updateEditingInvoice('invoice_date', e.target.value)}
                className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={editingInvoice.due_date}
                onChange={(e) => updateEditingInvoice('due_date', e.target.value)}
                className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={editingInvoice.status}
                onChange={(e) => updateEditingInvoice('status', e.target.value)}
                className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Line Items */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Line Items</h3>
              <button
                onClick={addEditLineItem}
                className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Plus size={16} />
                Add Item
              </button>
            </div>

            <div className="space-y-3">
              {editingInvoice.line_items?.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-start p-4 border rounded-lg">
                  <div className="col-span-1">
                    <select
                      value={item.label_id || ''}
                      onChange={(e) => updateEditLineItem(index, 'label_id', e.target.value || null)}
                      className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none text-sm"
                    >
                      <option value="">Select Label</option>
                      {lineItemLabels.map(label => (
                        <option key={label.id} value={label.id}>{label.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      value={item.quantity}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || value === null) {
                          updateEditLineItem(index, 'quantity', '');
                        } else {
                          updateEditLineItem(index, 'quantity', value);
                        }
                      }}
                      onBlur={(e) => {
                        const value = e.target.value;
                        if (value === '' || value === null) {
                          updateEditLineItem(index, 'quantity', 0);
                        } else {
                          const numValue = parseFloat(value);
                          updateEditLineItem(index, 'quantity', isNaN(numValue) ? 0 : numValue);
                        }
                      }}
                      onFocus={(e) => e.target.select()}
                      className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={item.unit_price}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || value === null) {
                          updateEditLineItem(index, 'unit_price', '');
                        } else {
                          updateEditLineItem(index, 'unit_price', value);
                        }
                      }}
                      onBlur={(e) => {
                        const value = e.target.value;
                        if (value === '' || value === null) {
                          updateEditLineItem(index, 'unit_price', 0);
                        } else {
                          const numValue = parseFloat(value);
                          updateEditLineItem(index, 'unit_price', isNaN(numValue) ? 0 : numValue);
                        }
                      }}
                      onFocus={(e) => e.target.select()}
                      className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none text-sm"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      placeholder="Item description"
                      value={item.description}
                      onChange={(e) => updateEditLineItem(index, 'description', e.target.value)}
                      className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="Notes (optional)"
                      value={item.notes}
                      onChange={(e) => updateEditLineItem(index, 'notes', e.target.value)}
                      className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none text-sm"
                    />
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    <span className="text-sm font-medium">
                      ${((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)).toFixed(2)}
                    </span>
                  </div>
                  <div className="col-span-1">
                    <button
                      onClick={() => removeEditLineItem(index)}
                      className="text-red-600 hover:text-red-900 p-2"
                      title="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Adjustments */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={editingInvoice.discount_amount || ''}
                onChange={(e) => updateEditingInvoice('discount_amount', e.target.value)}
                className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Markup Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={editingInvoice.markup_amount || ''}
                onChange={(e) => updateEditingInvoice('markup_amount', e.target.value)}
                className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={editingInvoice.tax_rate || ''}
                onChange={(e) => updateEditingInvoice('tax_rate', e.target.value)}
                className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Totals */}
          <div className="border-t pt-4">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {markupAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Markup:</span>
                    <span>${markupAmount.toFixed(2)}</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Tax ({taxRate}%):</span>
                    <span>${taxAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={editingInvoice.notes || ''}
              onChange={(e) => updateEditingInvoice('notes', e.target.value)}
              rows={3}
              className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="Additional notes..."
            />
          </div>
        </div>
      </div>
    );
  };

  // Live Tracking View
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
                    <StatusBadge status={invoice.status} />
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


  // Main render
  return (
    <div className="p-6">
      {activeView === 'list' && renderInvoiceList()}
      {activeView === 'create' && renderCreateInvoiceForm()}
      {activeView === 'view' && renderInvoiceView()}
      {activeView === 'edit' && renderEditInvoiceForm()}
      {activeView === 'clients' && renderClientManagement()}
      {activeView === 'tax-rates' && renderTaxRateManagement()}
      {activeView === 'labels' && renderLabelManagement()}
      {activeView === 'tracking' && renderLiveTracking()}
      {renderEmailModal()}
      {renderSmsModal()}
      {renderClientModal()}
      {renderEditClientModal()}
      {renderLabelModal()}
      {renderDeleteModal()}
    </div>
  );
};

export default InvoiceManager;