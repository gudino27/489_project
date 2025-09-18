import React from 'react';
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
  calculateTotals,
  addLineItem,
  updateLineItem,
  removeLineItem,
  createInvoice,
  loading,
  setActiveView,
  isEditing = false,
  editingInvoiceNumber = null
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">
          {isEditing ? `Edit Invoice ${editingInvoiceNumber}` : 'Create New Invoice'}
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
            onClick={() => createInvoice(newInvoice)}
            disabled={loading || !newInvoice.client_id || newInvoice.line_items.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Invoice' : 'Create Invoice')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateInvoiceForm;