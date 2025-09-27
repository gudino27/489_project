import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const ClientModal = ({
  show,
  newClient,
  setNewClient,
  clientError,
  setClientError,
  activeClientTab,
  setActiveClientTab,
  clientAddress,
  setClientAddress,
  mapLoaded,
  autocomplete,
  initAutocomplete,
  loading,
  onClose,
  onSave,
  isEditing = false
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* Mobile: Full screen modal, Desktop: Fixed size modal */}
      <div className="bg-white w-full h-full md:rounded-lg md:w-full md:max-w-2xl md:mx-4 md:max-h-[90vh] md:h-auto overflow-hidden flex flex-col">
        {/* Header - sticky on mobile */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 md:px-6 md:py-6 flex justify-between items-center z-10">
          <h3 className="text-lg md:text-xl font-semibold text-gray-800">
            {isEditing ? 'Edit Client' : 'Add New Client'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 px-4 py-4 md:px-6 md:py-0 overflow-y-auto">
          {/* Error Alert */}
          {clientError && (
            <div className="mb-4 md:mb-6 bg-red-50 border border-red-200 rounded-lg p-3 md:p-4">
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
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab Navigation - Mobile optimized */}
          <div className="border-b border-gray-200 mb-4 md:mb-6">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveClientTab('details')}
                className={`flex-1 md:flex-none whitespace-nowrap py-3 px-4 md:px-1 border-b-2 font-medium text-sm text-center ${
                  activeClientTab === 'details'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Client Details
              </button>
              <button
                onClick={() => setActiveClientTab('address')}
                className={`flex-1 md:flex-none whitespace-nowrap py-3 px-4 md:px-1 border-b-2 font-medium text-sm text-center ${
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
            <div className="space-y-4 md:space-y-6">
              {/* Client Type - Mobile stacked */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  What Type Of Client Is This?
                </label>
                <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-8">
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

              {/* Name Fields - Mobile stacked */}
              <div className="space-y-4 md:space-y-0 md:flex md:gap-6">
                <div className="md:w-auto">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <select
                    value={newClient.title || ''}
                    onChange={(e) => setNewClient(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full md:w-auto px-3 py-3 md:py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 appearance-none bg-white text-base md:text-sm"
                    style={{ minWidth: '120px' }}
                  >
                    <option value="">No title</option>
                    <option value="Mr.">Mr.</option>
                    <option value="Mrs.">Mrs.</option>
                    <option value="Ms.">Ms.</option>
                    <option value="Dr.">Dr.</option>
                  </select>
                </div>

                {newClient.is_business ? (
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      value={newClient.company_name}
                      onChange={(e) => setNewClient(prev => ({ ...prev, company_name: e.target.value }))}
                      className="w-full px-3 py-3 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-base md:text-sm"
                      placeholder="Company Name"
                      required
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={newClient.first_name}
                        onChange={(e) => setNewClient(prev => ({ ...prev, first_name: e.target.value }))}
                        className="w-full px-3 py-3 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-base md:text-sm"
                        placeholder="First Name"
                        required
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={newClient.last_name}
                        onChange={(e) => setNewClient(prev => ({ ...prev, last_name: e.target.value }))}
                        className="w-full px-3 py-3 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-base md:text-sm"
                        placeholder="Last Name"
                        required
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Phone Number - Mobile optimized */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number
                  <span className="text-xs text-gray-500 ml-1">(email or phone required)</span>
                </label>
                <div className="space-y-3 md:space-y-0 md:flex md:items-center md:space-x-2">
                  <div className="flex items-center justify-between md:justify-start md:space-x-2">
                    <button
                      type="button"
                      onClick={() => setNewClient(prev => ({ ...prev, is_primary_phone: !prev.is_primary_phone }))}
                      className={`flex items-center p-2 rounded ${
                        newClient.is_primary_phone ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-400'
                      }`}
                      title={newClient.is_primary_phone ? "Primary phone number" : "Click to mark as primary"}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="ml-1 text-sm md:hidden">Primary</span>
                    </button>
                    <select className="flex-1 md:flex-none px-3 py-3 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-base md:text-sm">
                      <option>Main</option>
                      <option>Mobile</option>
                      <option>Work</option>
                      <option>Home</option>
                    </select>
                  </div>
                  <div className="flex items-center border border-gray-300 rounded-md">
                    <span className="px-3 py-3 md:py-2 bg-gray-50 border-r text-sm">🇺🇸 +1</span>
                    <input
                      type="tel"
                      value={newClient.phone}
                      onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                      className="px-3 py-3 md:py-2 flex-1 rounded-r-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-base md:text-sm"
                      placeholder="(555) 421-5245"
                    />
                  </div>
                </div>
              </div>

              {/* Email - Mobile optimized */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Email
                  <span className="text-xs text-gray-500 ml-1">(email or phone required)</span>
                </label>
                <div className="space-y-3 md:space-y-0 md:flex md:items-center md:space-x-2">
                  <div className="flex items-center justify-between md:justify-start md:space-x-2">
                    <button
                      type="button"
                      onClick={() => setNewClient(prev => ({ ...prev, is_primary_email: !prev.is_primary_email }))}
                      className={`flex items-center p-2 rounded ${
                        newClient.is_primary_email ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-400'
                      }`}
                      title={newClient.is_primary_email ? "Primary email address" : "Click to mark as primary"}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="ml-1 text-sm md:hidden">Primary</span>
                    </button>
                    <select className="flex-1 md:flex-none px-3 py-3 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-base md:text-sm">
                      <option>Main</option>
                      <option>Work</option>
                      <option>Personal</option>
                    </select>
                  </div>
                  <input
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-3 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-base md:text-sm"
                    placeholder="example@email.com"
                    required
                  />
                </div>
              </div>

              {/* Tax Exempt Toggle */}
              <div>
                <label className="flex items-center justify-between md:justify-start">
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
                    <div className={`block w-14 h-8 rounded-full transition-colors ${
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
            <div className="space-y-4 md:space-y-6">
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
                      className="w-full px-3 py-3 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-base md:text-sm"
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
                      className="w-full px-3 py-3 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-base md:text-sm"
                      placeholder="Apt, Suite, etc (optional)"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                      <input
                        type="text"
                        value={clientAddress.city}
                        onChange={(e) => setClientAddress(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full px-3 py-3 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-base md:text-sm"
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                      <input
                        type="text"
                        value={clientAddress.state}
                        onChange={(e) => setClientAddress(prev => ({ ...prev, state: e.target.value }))}
                        className="w-full px-3 py-3 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-base md:text-sm"
                        placeholder="State"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                    <input
                      type="text"
                      value={clientAddress.zip}
                      onChange={(e) => setClientAddress(prev => ({ ...prev, zip: e.target.value }))}
                      className="w-full px-3 py-3 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-base md:text-sm"
                      placeholder="ZIP Code"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer - sticky */}
        <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-4 md:px-6">
          <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3 md:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="w-full md:w-auto px-6 py-3 md:py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 text-base md:text-sm"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                onSave();
              }}
              disabled={loading}
              className="w-full md:w-auto px-6 py-3 md:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center justify-center text-base md:text-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {isEditing ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                isEditing ? 'Update Client' : 'Add Client'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientModal;