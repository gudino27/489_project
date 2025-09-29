import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';

const CreateInvoiceForm = ({
  error,
  newInvoice,
  setNewInvoice,
  clientSearchTerm,
  setClientSearchTerm,
  showClientDropdown,
  setShowClientDropdown,
  searchResults,
  isSearching,
  setShowClientModal,
  taxRates,
  lineItemLabels,
  token,
  API_BASE,
  calculateTotals,
  addLineItem,
  updateLineItem,
  removeLineItem,
  createInvoice,
  loading,
  setActiveView,
  isEditing = false,
  editingInvoiceNumber
}) => {
  const [showCreateLabelModal, setShowCreateLabelModal] = useState(false);
  const [newLabel, setNewLabel] = useState({ label: '' });
  const [creatingLabel, setCreatingLabel] = useState(false);
  const [newLineItem, setNewLineItem] = useState({
    title: '',
    description: '',
    quantity: 1,
    unit_price: 75,
    item_type: ''
  });
  const [selectedClientName, setSelectedClientName] = useState('');

  const createLabel = async () => {
    if (!newLabel.label.trim()) return;

    setCreatingLabel(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/line-item-labels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          label: newLabel.label.trim()
        })
      });

      if (response.ok) {
        setShowCreateLabelModal(false);
        setNewLabel({ label: '' });
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(`Failed to create label: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error creating label:', error);
      alert('Failed to create label. Please try again.');
    } finally {
      setCreatingLabel(false);
    }
  };

  const addLineItemFromForm = () => {
    if (!newLineItem.title.trim()) {
      alert('Please enter a title for the line item.');
      return;
    }

    // Create the new line item with all data
    const quantity = parseFloat(newLineItem.quantity) || 1;
    const unitPrice = parseFloat(newLineItem.unit_price) || 75;
    const totalPrice = quantity * unitPrice;

    const newItem = {
      title: newLineItem.title,
      description: newLineItem.description,
      quantity: quantity,
      unit_price: unitPrice,
      item_type: newLineItem.item_type,
      total_price: totalPrice
    };

    // Add the complete item to the invoice
    setNewInvoice(prev => {
      const updatedLineItems = [...prev.line_items, newItem];
      const totals = calculateTotals(
        updatedLineItems,
        prev.tax_rate,
        prev.discount_amount,
        prev.markup_amount
      );

      return {
        ...prev,
        line_items: updatedLineItems,
        subtotal: totals.subtotal,
        tax_amount: totals.taxAmount,
        total_amount: totals.total
      };
    });

    // Clear the form
    setNewLineItem({
      title: '',
      description: '',
      quantity: 1,
      unit_price: 75,
      item_type: ''
    });
  };

  // Fetch client name when editing an existing invoice
  useEffect(() => {
    const fetchClientName = async () => {
      if (isEditing && newInvoice.client_id && !clientSearchTerm) {
        try {
          const response = await fetch(`${API_BASE}/api/admin/clients/${newInvoice.client_id}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          if (response.ok) {
            const client = await response.json();
            const clientName = client.is_business
              ? client.company_name
              : `${client.first_name} ${client.last_name}`;
            setSelectedClientName(clientName);
            setClientSearchTerm(clientName);
          }
        } catch (error) {
          console.error('Error fetching client details:', error);
        }
      }
    };

    fetchClientName();
  }, [isEditing, newInvoice.client_id, token, API_BASE, clientSearchTerm, setClientSearchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">
          {isEditing ? `Edit Invoice ${editingInvoiceNumber.split('-')[2] || newInvoice?.invoice_number || 'Unknown'}` : 'Create New Invoice'}
        </h2>
        <button
          onClick={() => setActiveView('list')}
          className="text-gray-600 hover:text-gray-900 text-sm sm:text-base self-start sm:self-auto"
        >
          ← Back to List
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
                  ✓ Selected: {clientSearchTerm || selectedClientName || `Client ID: ${newInvoice.client_id}`}
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
                console.log('📊 Tax Rate Selection Debug:');
                console.log('  Selected value:', e.target.value);
                console.log('  Parsed tax rate:', taxRate);
                console.log('  Current invoice state:', {
                  line_items: newInvoice.line_items,
                  discount_amount: newInvoice.discount_amount,
                  markup_amount: newInvoice.markup_amount
                });

                const totals = calculateTotals(
                  newInvoice.line_items,
                  taxRate,
                  newInvoice.discount_amount,
                  newInvoice.markup_amount
                );

                console.log('  New totals:', totals);

                setNewInvoice(prev => ({
                  ...prev,
                  tax_rate: taxRate,
                  tax_amount: totals.taxAmount,
                  total_amount: totals.total
                }));
              }}
              className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="0">No Tax - 0.00%</option>
              {taxRates.map((rate) => (
                <option key={rate.id} value={rate.tax_rate}>
                  {rate.city ? `${rate.city} Tax` : `${rate.state_code} Tax`} - {rate.tax_rate.toFixed(2)}%
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Line Items */}
        <div className="mt-8">
          <div className="mb-4">
            <h3 className="text-lg font-medium">Line Items</h3>
          </div>

          {/* Header Row - Desktop Only */}
          <div className="hidden lg:grid grid-cols-11 gap-2 items-center p-3 bg-gray-800 text-white rounded-lg mb-3 font-medium text-sm">
            <div className="col-span-4">Item Details</div>
            <div className="col-span-1">Qty</div>
            <div className="col-span-2">Unit</div>
            <div className="col-span-2">Rate ($)</div>
            <div className="col-span-2">Amount</div>
          </div>

          {/* Mobile Header */}
          <div className="lg:hidden p-3 bg-gray-800 text-white rounded-lg mb-3 font-medium text-sm text-center">
            Line Items
          </div>

          <div className="space-y-4">
            {/* Top input form for creating new items - Desktop */}
            <div className="hidden lg:grid grid-cols-11 gap-2 items-start p-3 bg-gray-50 rounded-lg">
              <div className="col-span-4 space-y-2">
                <input
                  type="text"
                  placeholder="Title"
                  value={newLineItem?.title || ''}
                  onChange={(e) => setNewLineItem(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none text-sm font-medium"
                />
                <textarea
                  placeholder="Description"
                  value={newLineItem?.description || ''}
                  onChange={(e) => setNewLineItem(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none text-sm resize-none"
                  rows="2"
                />
                <button
                  type="button"
                  onClick={addLineItemFromForm}
                  className="text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                  style={{backgroundColor: 'rgb(110, 110, 110)'}}
                >
                  + Add Item
                </button>
              </div>

              <div className="col-span-1">
                <input
                  type="number"
                  step="0.01"
                  placeholder="1"
                  value={newLineItem?.quantity || 1}
                  onChange={(e) => setNewLineItem(prev => ({ ...prev, quantity: e.target.value }))}
                  className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none text-sm"
                />
              </div>

              <div className="col-span-2">
                <div className="flex gap-2">
                  <select
                    value={newLineItem?.item_type || ''}
                    onChange={(e) => setNewLineItem(prev => ({ ...prev, item_type: e.target.value }))}
                    className="flex-1 p-2 border rounded focus:border-blue-500 focus:outline-none text-sm"
                  >
                    <option value="">Unit</option>
                    {lineItemLabels.map((label) => (
                      <option key={label.id} value={label.label}>
                        {label.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowCreateLabelModal(true)}
                    className="px-2 py-1 text-white rounded hover:opacity-80 text-xs flex items-center justify-center"
                    style={{backgroundColor: 'rgb(110, 110, 110)'}}
                    title="Create new label"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="col-span-2">
                <input
                  type="number"
                  step="0.01"
                  placeholder="75"
                  value={newLineItem?.unit_price || 75}
                  onChange={(e) => setNewLineItem(prev => ({ ...prev, unit_price: e.target.value }))}
                  className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none text-sm"
                />
              </div>

              <div className="col-span-2">
                <span className="text-lg font-bold" style={{color: 'rgb(110, 110, 110)'}}>
                  ${((newLineItem?.quantity || 1) * (newLineItem?.unit_price || 75)).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Top input form for creating new items - Mobile */}
            <div className="lg:hidden p-1 bg-gray-50 rounded-lg space-y-2">
              <div className="space-y-1">
                <div >
                  <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    placeholder="Enter item title"
                    value={newLineItem?.title || ''}
                    onChange={(e) => setNewLineItem(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    placeholder="Enter item description"
                    value={newLineItem?.description || ''}
                    onChange={(e) => setNewLineItem(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none text-sm resize-none"
                    rows="3"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="1"
                      value={newLineItem?.quantity || 1}
                      onChange={(e) => setNewLineItem(prev => ({ ...prev, quantity: e.target.value }))}
                      className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Rate ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="75"
                      value={newLineItem?.unit_price || 75}
                      onChange={(e) => setNewLineItem(prev => ({ ...prev, unit_price: e.target.value }))}
                      className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Unit Type</label>
                  <div className="flex gap-2">
                    <select
                      value={newLineItem?.item_type || ''}
                      onChange={(e) => setNewLineItem(prev => ({ ...prev, item_type: e.target.value }))}
                      className="flex-1 p-3 border rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                    >
                      <option value="">Select unit type</option>
                      {lineItemLabels.map((label) => (
                        <option key={label.id} value={label.label}>
                          {label.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowCreateLabelModal(true)}
                      className="w-12 h-12 text-white rounded-lg hover:opacity-80 flex items-center justify-center"
                      style={{backgroundColor: 'rgb(110, 110, 110)'}}
                      title="Create new label"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Total Amount</div>
                    <div className="text-xl font-bold" style={{color: 'rgb(110, 110, 110)'}}>
                      ${((newLineItem?.quantity || 1) * (newLineItem?.unit_price || 75)).toFixed(2)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addLineItemFromForm}
                    className="text-white px-6 py-3 rounded-lg text-sm font-medium"
                    style={{backgroundColor: 'rgb(110, 110, 110)'}}
                  >
                    + Add Item
                  </button>
                </div>
              </div>
            </div>

            {/* Display added line items with inline editing */}
            {newInvoice.line_items.map((item, index) => (
              <div key={index} className="space-y-3">
                {/* Desktop Layout */}
                <div className="hidden lg:grid grid-cols-11 gap-2 items-center p-3 bg-white border rounded-lg">
                  <div className="col-span-4 space-y-2">
                    <input
                      type="text"
                      value={item.title || ''}
                      onChange={(e) => updateLineItem(index, 'title', e.target.value)}
                      className="w-full p-1 border rounded focus:border-blue-500 focus:outline-none font-medium text-sm"
                      placeholder="Item title"
                    />
                    <textarea
                      value={item.description || ''}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                      className="w-full p-1 border rounded focus:border-blue-500 focus:outline-none text-sm text-gray-600 resize-none"
                      placeholder="Description"
                      rows="2"
                    />
                  </div>
                  <div className="col-span-1">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity || 1}
                      onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-full p-1 border rounded focus:border-blue-500 focus:outline-none text-center text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <select
                      value={item.item_type || 'Unit'}
                      onChange={(e) => updateLineItem(index, 'item_type', e.target.value)}
                      className="w-full p-1 border rounded focus:border-blue-500 focus:outline-none text-center text-sm"
                    >
                      <option value="Unit">Unit</option>
                      <option value="Hour">Hour</option>
                      <option value="Day">Day</option>
                      <option value="Week">Week</option>
                      <option value="Month">Month</option>
                      <option value="Year">Year</option>
                      <option value="Linear Foot">Linear Foot</option>
                      <option value="Square Foot">Square Foot</option>
                      <option value="Cubic Foot">Cubic Foot</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unit_price || ''}
                      onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      className="w-full p-1 border rounded focus:border-blue-500 focus:outline-none text-center text-sm"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-lg font-bold" style={{color: 'rgb(110, 110, 110)'}}>
                      ${item.total_price?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>

                {/* Mobile Layout */}
                <div className="lg:hidden p-4 bg-white border rounded-lg space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 mb-1">Item #{index + 1}</div>
                      <div className="text-lg font-bold" style={{color: 'rgb(110, 110, 110)'}}>
                        ${item.total_price?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLineItem(index)}
                      className="text-white px-4 py-2 rounded-lg hover:opacity-80 text-sm font-medium"
                      style={{backgroundColor: 'rgb(110, 110, 110)', minHeight: '44px'}}
                    >
                      Delete
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        value={item.title || ''}
                        onChange={(e) => updateLineItem(index, 'title', e.target.value)}
                        className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none font-medium text-sm"
                        placeholder="Item title"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={item.description || ''}
                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                        className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none text-sm text-gray-600 resize-none"
                        placeholder="Description"
                        rows="3"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity || 1}
                          onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Rate ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unit_price || ''}
                          onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Unit Type</label>
                      <select
                        value={item.item_type || 'Unit'}
                        onChange={(e) => updateLineItem(index, 'item_type', e.target.value)}
                        className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                      >
                        <option value="Unit">Unit</option>
                        <option value="Hour">Hour</option>
                        <option value="Day">Day</option>
                        <option value="Week">Week</option>
                        <option value="Month">Month</option>
                        <option value="Year">Year</option>
                        <option value="Linear Foot">Linear Foot</option>
                        <option value="Square Foot">Square Foot</option>
                        <option value="Cubic Foot">Cubic Foot</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Delete button below each item - Desktop Only */}
                <div className="hidden lg:block pl-3">
                  <button
                    type="button"
                    onClick={() => removeLineItem(index)}
                    className="text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
                    style={{backgroundColor: 'rgb(110, 110, 110)'}}
                  >
                    Delete Item
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
                  console.log('💸 Discount Change Debug:', {
                    old_discount: newInvoice.discount_amount,
                    new_discount: discountAmount,
                    tax_rate: newInvoice.tax_rate,
                    markup_amount: newInvoice.markup_amount
                  });

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
                  console.log('💰 Markup Change Debug:', {
                    old_markup: newInvoice.markup_amount,
                    new_markup: markupAmount,
                    tax_rate: newInvoice.tax_rate,
                    discount_amount: newInvoice.discount_amount
                  });

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
            onClick={() => createInvoice(newInvoice)}
            disabled={loading || !newInvoice.client_id || newInvoice.line_items.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Invoice' : 'Create Invoice')}
          </button>
        </div>
      </div>

      {/* Create Label Modal */}
      {showCreateLabelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
            <h3 className="text-lg font-bold mb-4">Create New Label</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Label Name *
                </label>
                <input
                  type="text"
                  value={newLabel.label}
                  onChange={(e) => setNewLabel(prev => ({ ...prev, label: e.target.value }))}
                  className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="Enter label name..."
                  autoFocus
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowCreateLabelModal(false);
                  setNewLabel({ label: '' });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={creatingLabel}
              >
                Cancel
              </button>
              <button
                onClick={createLabel}
                disabled={creatingLabel || !newLabel.label.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingLabel ? 'Creating...' : 'Create Label'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateInvoiceForm;