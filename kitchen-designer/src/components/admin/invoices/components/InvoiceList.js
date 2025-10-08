import React, { useState } from 'react';
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
  Bell,
  X,
  Settings,
  ChevronDown
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import InvoiceIcon from './InvoiceIcon';
import { formatDatePacific } from '../../../../utils/dateUtils';
import { useLanguage } from '../../../../contexts/LanguageContext';

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
  const { t } = useLanguage();
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);

  const openSidePanel = (invoice) => {
    setSelectedInvoice(invoice);
    setShowSidePanel(true);
  };

  const closeSidePanel = () => {
    setShowSidePanel(false);
    setSelectedInvoice(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">{t('invoiceManager.invoiceManagement')}</h2>
        <div className="flex gap-2 flex-wrap justify-center sm:justify-end">
          {/* Settings Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
              className="bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2 text-sm"
            >
              <Settings size={16} />
              {t('invoiceManager.settings')}
              <ChevronDown size={14} />
            </button>

            {showSettingsDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="py-2">
                  <button
                    onClick={() => {
                      setActiveView('clients');
                      setShowSettingsDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <User size={16} />
                    {t('invoiceManager.clients')}
                  </button>
                  <button
                    onClick={() => {
                      setActiveView('tax-rates');
                      setShowSettingsDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <DollarSign size={16} />
                    {t('invoiceManager.taxRates')}
                  </button>
                  <button
                    onClick={() => {
                      setActiveView('tracking');
                      setShowSettingsDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Eye size={16} />
                    {t('invoiceManager.liveTrackingMenu')}
                  </button>
                  <div className="border-t border-gray-200 my-1"></div>
                  <button
                    onClick={() => {
                      setShowClientModal(true);
                      setShowSettingsDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Plus size={16} />
                    {t('invoiceManager.addClient')}
                  </button>
                  <button
                    onClick={() => {
                      setActiveView('labels');
                      setShowSettingsDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FileText size={16} />
                    {t('invoiceManager.labels')}
                  </button>
                  <button
                    onClick={() => {
                      setShowLabelModal(true);
                      setShowSettingsDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Plus size={16} />
                    {t('invoiceManager.addLabel')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Create Invoice Button */}
          <button
            onClick={() => setActiveView('create')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={20} />
            {t('invoiceManager.createInvoice')}
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
                placeholder={t('invoiceManager.searchPlaceholder')}
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
              {filteredInvoices.length} {t('invoiceManager.of')} {invoices.length} {t('invoiceManager.invoicesPlural')}{invoices.length !== 1 ? t('invoiceManager.invoicesCount') : ''}
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
                {t('invoiceManager.invoice')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('invoiceManager.client')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('invoiceManager.amount')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('invoiceManager.status')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('invoiceManager.date')}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('invoiceManager.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredInvoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openSidePanel(invoice)}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <InvoiceIcon className="text-gray-400 mr-2" size={16} />
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
                  {formatDatePacific(invoice.invoice_date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      loadInvoiceDetails(invoice.id);
                      setActiveView('view');
                    }}
                    className="text-blue-600 hover:text-blue-900"
                    title={t('invoiceManager.viewInvoice')}
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      await loadInvoiceDetails(invoice.id, true);
                      setActiveView('view');
                      // Set the tab to edit after a brief delay to ensure view is rendered
                      setTimeout(() => {
                        const editTab = document.querySelector('[data-tab="edit"]');
                        if (editTab) editTab.click();
                      }, 100);
                    }}
                    className="text-purple-600 hover:text-purple-900"
                    title={t('invoiceManager.editInvoiceAction')}
                  >
                    <Edit size={16} />
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
                    <p className="text-sm">{t('invoiceManager.noInvoicesFound')} "{invoiceSearchTerm}"</p>
                    <p className="text-xs text-gray-400 mt-1">{t('invoiceManager.tryAdjusting')}</p>
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
                    <p className="text-sm">{t('invoiceManager.noInvoicesCreated')}</p>
                    <p className="text-xs text-gray-400 mt-1">{t('invoiceManager.createFirstInvoice')}</p>
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
                <InvoiceIcon className="text-gray-400 mr-2" size={16} />
                <span className="font-medium text-sm">{invoice.invoice_number}</span>
              </div>
              <StatusBadge status={invoice.status} />
            </div>
            
            <div className="mb-3">
              <div className="text-sm font-medium text-gray-900 mb-1">
                {invoice.is_business ? invoice.company_name : `${invoice.first_name} ${invoice.last_name}`}
              </div>
              <div className="text-sm text-gray-500">
                {formatDatePacific(invoice.invoice_date)}
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
                title={t('invoiceManager.view')}
              >
                <Eye size={18} />
                <span className="text-xs mt-1">{t('invoiceManager.view')}</span>
              </button>
              <button
                onClick={async () => {
                  await loadInvoiceDetails(invoice.id, true);
                  setActiveView('view');
                  // Set the tab to edit after a brief delay to ensure view is rendered
                  setTimeout(() => {
                    const editTab = document.querySelector('[data-tab="edit"]');
                    if (editTab) editTab.click();
                  }, 100);
                }}
                className="flex flex-col items-center justify-center p-2 text-purple-600 hover:bg-purple-50 rounded-md"
                title={t('invoiceManager.edit')}
              >
                <Edit size={18} />
                <span className="text-xs mt-1">{t('invoiceManager.edit')}</span>
              </button>
              <button
                onClick={() => {
                  setEmailInvoice(invoice);
                  setShowEmailModal(true);
                }}
                className="flex flex-col items-center justify-center p-2 text-green-600 hover:bg-green-50 rounded-md"
                title={t('invoiceManager.emailInvoiceAction')}
              >
                <Send size={18} />
                <span className="text-xs mt-1">{t('invoiceManager.emailInvoiceAction')}</span>
              </button>
              <button
                onClick={() => downloadInvoicePdf(invoice)}
                className="flex flex-col items-center justify-center p-2 text-gray-600 hover:bg-gray-50 rounded-md"
                title={t('invoiceManager.downloadPDFAction')}
              >
                <Download size={18} />
                <span className="text-xs mt-1">{t('invoiceManager.downloadPDFAction')}</span>
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
                title={t('invoiceManager.smsAction')}
              >
                <MessageCircle size={16} />
                <span className="text-xs mt-1">{t('invoiceManager.smsAction')}</span>
              </button>
              <button
                onClick={() => openReminderModal(invoice)}
                className="flex flex-col items-center justify-center p-2 text-orange-600 hover:bg-orange-50 rounded-md"
                title={t('invoiceManager.remindAction')}
              >
                <Bell size={16} />
                <span className="text-xs mt-1">{t('invoiceManager.remindAction')}</span>
              </button>
              <button
                onClick={() => {
                  setDeleteInvoice(invoice);
                  setShowDeleteModal(true);
                }}
                className="flex flex-col items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-md"
                title={t('invoiceManager.deleteAction')}
              >
                <Trash2 size={16} />
                <span className="text-xs mt-1">{t('invoiceManager.deleteAction')}</span>
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
            <p className="text-sm text-gray-500">{t('invoiceManager.noInvoicesFound')} "{invoiceSearchTerm}"</p>
            <p className="text-xs text-gray-400 mt-1">{t('invoiceManager.tryAdjusting')}</p>
          </div>
        )}

        {invoices.length === 0 && !invoiceSearchTerm && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm text-gray-500">{t('invoiceManager.noInvoicesCreated')}</p>
            <p className="text-xs text-gray-400 mt-1">{t('invoiceManager.createFirstInvoice')}</p>
          </div>
        )}
      </div>
      {/* Side Panel */}
        {showSidePanel && selectedInvoice && (
          <div className="fixed inset-0 z-50 overflow-hidden" style={{ top: '60px' }}>
            {/* Backdrop */}
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={closeSidePanel}></div>

          {/* Side Panel */}
          <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">{t('invoiceManager.invoiceActions')}</h2>
                  <button
                    onClick={closeSidePanel}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-600">{selectedInvoice.invoice_number}</p>
                  <p className="text-sm text-gray-500">
                    {selectedInvoice.is_business ? selectedInvoice.company_name : `${selectedInvoice.first_name} ${selectedInvoice.last_name}`}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex-1 px-6 py-4 space-y-3">
                <button
                  onClick={() => {
                    loadInvoiceDetails(selectedInvoice.id);
                    setActiveView('view');
                    closeSidePanel();
                  }}
                  className="w-full flex items-center px-4 py-3 text-left text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Eye size={18} className="mr-3" />
                  <span>{t('invoiceManager.viewInvoice')}</span>
                </button>

                <button
                  onClick={async () => {
                    const invoiceId = selectedInvoice.id;
                    closeSidePanel();
                    await loadInvoiceDetails(invoiceId, true);
                    setActiveView('view');
                    // Set the tab to edit after a brief delay to ensure view is rendered
                    setTimeout(() => {
                      const editTab = document.querySelector('[data-tab="edit"]');
                      if (editTab) editTab.click();
                    }, 100);
                  }}
                  className="w-full flex items-center px-4 py-3 text-left text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <Edit size={18} className="mr-3" />
                  <span>{t('invoiceManager.editInvoiceAction')}</span>
                </button>

                <button
                  onClick={() => {
                    setEmailInvoice(selectedInvoice);
                    setShowEmailModal(true);
                    closeSidePanel();
                  }}
                  className="w-full flex items-center px-4 py-3 text-left text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                >
                  <Send size={18} className="mr-3" />
                  <span>{t('invoiceManager.sendEmailAction')}</span>
                </button>

                <button
                  onClick={() => {
                    setSmsInvoice(selectedInvoice);
                    setShowSmsModal(true);
                    closeSidePanel();
                  }}
                  className="w-full flex items-center px-4 py-3 text-left text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <MessageCircle size={18} className="mr-3" />
                  <span>{t('invoiceManager.sendSMSAction')}</span>
                </button>

                <button
                  onClick={() => {
                    downloadInvoicePdf(selectedInvoice);
                    closeSidePanel();
                  }}
                  className="w-full flex items-center px-4 py-3 text-left text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Download size={18} className="mr-3" />
                  <span>{t('invoiceManager.downloadPDFFull')}</span>
                </button>

                <button
                  onClick={() => {
                    openReminderModal(selectedInvoice);
                    closeSidePanel();
                  }}
                  className="w-full flex items-center px-4 py-3 text-left text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                >
                  <Bell size={18} className="mr-3" />
                  <span>{t('invoiceManager.manageReminders')}</span>
                </button>

                <button
                  onClick={() => {
                    setDeleteInvoice(selectedInvoice);
                    setShowDeleteModal(true);
                    closeSidePanel();
                  }}
                  className="w-full flex items-center px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={18} className="mr-3" />
                  <span>{t('invoiceManager.deleteInvoiceAction')}</span>
                </button>
              </div>

              {/* Footer with invoice details */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('invoiceManager.amount')}:</span>
                    <span className="font-medium">${selectedInvoice.total_amount?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('invoiceManager.status')}:</span>
                    <StatusBadge status={selectedInvoice.status} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('invoiceManager.date')}:</span>
                    <span>{formatDatePacific(selectedInvoice.invoice_date)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceList;