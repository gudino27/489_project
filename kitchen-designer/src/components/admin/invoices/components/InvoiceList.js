import React from 'react';
import {
  Plus,
  Edit,
  Eye,
  DollarSign,
  FileText,
  User,
  Send,
  MessageCircle,
  Trash2,
  Download,
  Bell
} from 'lucide-react';
import StatusBadge from './StatusBadge';

const InvoiceList = ({
  filteredInvoices,
  invoices,
  invoiceSearchTerm,
  setInvoiceSearchTerm,
  setActiveView,
  loadInvoiceDetails,
  setEmailInvoice,
  setShowEmailModal,
  setSmsInvoice,
  setShowSmsModal,
  downloadInvoicePdf,
  openReminderModal,
  setDeleteInvoice,
  setShowDeleteModal,
  setShowClientModal,
  setShowLabelModal
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">Invoice Management</h2>
        <div className="flex gap-2 flex-wrap justify-center sm:justify-end">
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
            onClick={() => setActiveView('payments')}
            className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
          >
            <DollarSign size={16} />
            Payments
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
      <div className="bg-white rounded-lg shadow p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
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

      {/* Desktop Invoice table */}
      <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
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
                    onClick={() => openReminderModal(invoice)}
                    className="text-orange-600 hover:text-orange-900" 
                    title="Manage Reminders"
                  >
                    <Bell size={16} />
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

      {/* Mobile Invoice cards */}
      <div className="lg:hidden space-y-3">
        {filteredInvoices.map((invoice) => (
          <div key={invoice.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <FileText className="text-gray-400 mr-2" size={16} />
                <span className="font-medium text-sm">{invoice.invoice_number}</span>
              </div>
              <StatusBadge status={invoice.status} />
            </div>
            
            <div className="mb-3">
              <div className="text-sm font-medium text-gray-900 mb-1">
                {invoice.is_business ? invoice.company_name : `${invoice.first_name} ${invoice.last_name}`}
              </div>
              <div className="text-sm text-gray-500">
                {new Date(invoice.invoice_date).toLocaleDateString()}
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold text-gray-900">
                ${invoice.total_amount?.toFixed(2)}
              </div>
            </div>
            
            {/* Mobile Actions */}
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => {
                  loadInvoiceDetails(invoice.id);
                  setActiveView('view');
                }}
                className="flex flex-col items-center justify-center p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                title="View"
              >
                <Eye size={18} />
                <span className="text-xs mt-1">View</span>
              </button>
              <button
                onClick={() => {
                  loadInvoiceDetails(invoice.id, true);
                  setActiveView('edit');
                }}
                className="flex flex-col items-center justify-center p-2 text-purple-600 hover:bg-purple-50 rounded-md"
                title="Edit"
              >
                <Edit size={18} />
                <span className="text-xs mt-1">Edit</span>
              </button>
              <button 
                onClick={() => {
                  setEmailInvoice(invoice);
                  setShowEmailModal(true);
                }}
                className="flex flex-col items-center justify-center p-2 text-green-600 hover:bg-green-50 rounded-md"
                title="Email"
              >
                <Send size={18} />
                <span className="text-xs mt-1">Email</span>
              </button>
              <button 
                onClick={() => downloadInvoicePdf(invoice)}
                className="flex flex-col items-center justify-center p-2 text-gray-600 hover:bg-gray-50 rounded-md"
                title="Download"
              >
                <Download size={18} />
                <span className="text-xs mt-1">PDF</span>
              </button>
            </div>
            
            {/* Secondary actions row */}
            <div className="grid grid-cols-3 gap-2 mt-2">
              <button 
                onClick={() => {
                  setSmsInvoice(invoice);
                  setShowSmsModal(true);
                }}
                className="flex flex-col items-center justify-center p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                title="SMS"
              >
                <MessageCircle size={16} />
                <span className="text-xs mt-1">SMS</span>
              </button>
              <button 
                onClick={() => openReminderModal(invoice)}
                className="flex flex-col items-center justify-center p-2 text-orange-600 hover:bg-orange-50 rounded-md"
                title="Reminders"
              >
                <Bell size={16} />
                <span className="text-xs mt-1">Remind</span>
              </button>
              <button
                onClick={() => {
                  setDeleteInvoice(invoice);
                  setShowDeleteModal(true);
                }}
                className="flex flex-col items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-md"
                title="Delete"
              >
                <Trash2 size={16} />
                <span className="text-xs mt-1">Delete</span>
              </button>
            </div>
          </div>
        ))}
        
        {/* Mobile empty states */}
        {filteredInvoices.length === 0 && invoiceSearchTerm && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-sm text-gray-500">No invoices found matching "{invoiceSearchTerm}"</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your search terms</p>
          </div>
        )}
        
        {invoices.length === 0 && !invoiceSearchTerm && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm text-gray-500">No invoices created yet</p>
            <p className="text-xs text-gray-400 mt-1">Create your first invoice to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceList;