import React, { useState, useEffect } from 'react';
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
  Send
} from 'lucide-react';

const InvoiceManager = ({ token, API_BASE }) => {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [lineItemLabels, setLineItemLabels] = useState([]);
  const [taxRates, setTaxRates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState('list'); // 'list', 'create', 'edit', 'view', 'clients'
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInvoice, setEmailInvoice] = useState(null);
  const [emailMessage, setEmailMessage] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [newLabel, setNewLabel] = useState({
    label: '',
    item_type: 'material',
    description: ''
  });
  const [newClient, setNewClient] = useState({
    is_business: false,
    company_name: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    tax_exempt_number: ''
  });
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
  const createClient = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newClient)
      });

      if (response.ok) {
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
        fetchClients(); // Refresh client list
        alert('Client created successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to create client: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error creating client:', error);
      alert('Failed to create client. Please try again.');
    } finally {
      setLoading(false);
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
            {invoices.map((invoice) => (
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
                      setSelectedInvoice(invoice);
                      setActiveView('view');
                    }}
                    className="text-blue-600 hover:text-blue-900"
                    title="View Invoice"
                  >
                    <Eye size={16} />
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
                  <button className="text-gray-600 hover:text-gray-900" title="Download PDF">
                    <Download size={16} />
                  </button>
                </td>
              </tr>
            ))}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client *
            </label>
            <select
              value={newInvoice.client_id}
              onChange={(e) => setNewInvoice(prev => ({ ...prev, client_id: e.target.value }))}
              className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
              required
            >
              <option value="">Select a client...</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.is_business ? client.company_name : `${client.first_name} ${client.last_name}`}
                </option>
              ))}
            </select>
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
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Unit Price"
                    value={item.unit_price}
                    onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
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
                value={newInvoice.discount_amount}
                onChange={(e) => {
                  const discountAmount = parseFloat(e.target.value) || 0;
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
                value={newInvoice.markup_amount}
                onChange={(e) => {
                  const markupAmount = parseFloat(e.target.value) || 0;
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

  // Client Modal
  const renderClientModal = () => {
    if (!showClientModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">Add New Client</h3>
          
          <div className="space-y-4">
            {/* Client Type Toggle */}
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={!newClient.is_business}
                  onChange={() => setNewClient(prev => ({ ...prev, is_business: false }))}
                  className="mr-2"
                />
                Individual
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={newClient.is_business}
                  onChange={() => setNewClient(prev => ({ ...prev, is_business: true }))}
                  className="mr-2"
                />
                Business
              </label>
            </div>

            {/* Conditional Fields */}
            {newClient.is_business ? (
              <div>
                <label className="block text-sm font-medium mb-2">Company Name *</label>
                <input
                  type="text"
                  value={newClient.company_name}
                  onChange={(e) => setNewClient(prev => ({ ...prev, company_name: e.target.value }))}
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
                    value={newClient.first_name}
                    onChange={(e) => setNewClient(prev => ({ ...prev, first_name: e.target.value }))}
                    className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Last Name *</label>
                  <input
                    type="text"
                    value={newClient.last_name}
                    onChange={(e) => setNewClient(prev => ({ ...prev, last_name: e.target.value }))}
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
                value={newClient.email}
                onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <input
                type="tel"
                value={newClient.phone}
                onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Address</label>
              <textarea
                value={newClient.address}
                onChange={(e) => setNewClient(prev => ({ ...prev, address: e.target.value }))}
                rows={3}
                className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>

            {newClient.is_business && (
              <div>
                <label className="block text-sm font-medium mb-2">Tax Exempt Number</label>
                <input
                  type="text"
                  value={newClient.tax_exempt_number}
                  onChange={(e) => setNewClient(prev => ({ ...prev, tax_exempt_number: e.target.value }))}
                  className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="For tax-exempt businesses"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
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
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={createClient}
              disabled={loading || !newClient.email || 
                (newClient.is_business ? !newClient.company_name : !newClient.first_name || !newClient.last_name)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Client'}
            </button>
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

  // Main render
  return (
    <div className="p-6">
      {activeView === 'list' && renderInvoiceList()}
      {activeView === 'create' && renderCreateInvoiceForm()}
      {activeView === 'clients' && renderClientManagement()}
      {activeView === 'labels' && renderLabelManagement()}
      {renderEmailModal()}
      {renderClientModal()}
      {renderLabelModal()}
    </div>
  );
};

export default InvoiceManager;