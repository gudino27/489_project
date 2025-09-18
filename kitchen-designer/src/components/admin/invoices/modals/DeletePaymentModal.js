import React from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';

const DeletePaymentModal = ({
  show,
  payment,
  invoice,
  onCancel,
  onConfirm,
  isDeleting
}) => {
  if (!show || !payment || !invoice) return null;

  const clientName = invoice.is_business
    ? invoice.company_name
    : `${invoice.first_name} ${invoice.last_name}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Delete Payment</h3>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-4">
            Are you sure you want to delete this payment? This action cannot be undone.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">Invoice:</span>
              <span className="text-sm text-gray-900">{invoice.invoice_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">Client:</span>
              <span className="text-sm text-gray-900">{clientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">Amount:</span>
              <span className="text-sm font-semibold text-red-600">
                ${parseFloat(payment.payment_amount).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">Method:</span>
              <span className="text-sm text-gray-900 capitalize">
                {payment.payment_method.replace('_', ' ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">Date:</span>
              <span className="text-sm text-gray-900">
                {new Date(payment.payment_date).toLocaleDateString()}
              </span>
            </div>
            {payment.check_number && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Check #:</span>
                <span className="text-sm text-gray-900">{payment.check_number}</span>
              </div>
            )}
            {payment.notes && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Notes:</span>
                <span className="text-sm text-gray-900">{payment.notes}</span>
              </div>
            )}
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  <strong>Warning:</strong> Deleting this payment will increase the invoice balance by ${parseFloat(payment.payment_amount).toFixed(2)}.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Delete Payment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeletePaymentModal;