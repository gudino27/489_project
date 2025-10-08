import React from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { formatDatePacific } from '../../../../utils/dateUtils';
import { useLanguage } from '../../../../contexts/LanguageContext';

const DeleteModal = ({
  show,
  deleteInvoice,
  deleting,
  onCancel,
  onConfirm
}) => {
  const { t } = useLanguage();
  if (!show || !deleteInvoice) return null;
  
  const clientName = deleteInvoice.is_business 
    ? deleteInvoice.company_name 
    : `${deleteInvoice.first_name} ${deleteInvoice.last_name}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* Mobile: Full width with margins, Desktop: Fixed width */}
      <div className="bg-white rounded-lg w-full max-w-md mx-auto max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
          <div className="flex items-center">
            <AlertTriangle className="text-red-600 mr-3" size={24} />
            <h3 className="text-lg font-semibold text-red-800">{t('invoiceManager.delete')}</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
            disabled={deleting}
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 overflow-y-auto">
          <div className="mb-4 md:mb-6">
            <p className="text-gray-700 mb-4 text-base">
              {t('invoiceManager.deleteConfirm')}
            </p>

            {/* Invoice Details */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4 mb-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-red-800">{t('invoiceManager.invoiceNumber')}:</span>
                  <span className="text-red-900">{deleteInvoice.invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-red-800">{t('invoiceManager.client')}:</span>
                  <span className="text-red-900">{clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-red-800">{t('invoiceManager.amount')}:</span>
                  <span className="text-red-900">${(deleteInvoice.total_amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-red-800">{t('invoiceManager.date')}:</span>
                  <span className="text-red-900">{formatDatePacific(deleteInvoice.invoice_date)}</span>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="p-3 md:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm font-medium flex items-center">
                <AlertTriangle size={16} className="mr-2" />
                {t('invoiceManager.deleteConfirm')}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 md:p-6 border-t border-gray-200">
          <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 md:py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 text-base md:text-sm disabled:opacity-50"
              disabled={deleting}
            >
              {t('invoiceManager.cancel')}
            </button>
            <button
              onClick={onConfirm}
              disabled={deleting}
              className="flex-1 px-4 py-3 md:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center justify-center text-base md:text-sm"
            >
              {deleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {t('invoiceManager.deleting')}
                </>
              ) : (
                <>
                  <Trash2 size={16} className="mr-2" />
                  {t('invoiceManager.delete')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;