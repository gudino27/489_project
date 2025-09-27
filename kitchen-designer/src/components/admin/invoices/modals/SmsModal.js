import React from 'react';
import { X, Send, MessageCircle } from 'lucide-react';

const SmsModal = ({
  show,
  smsInvoice,
  smsMessage,
  setSmsMessage,
  smsSending,
  userRole,
  useCustomPhone,
  setUseCustomPhone,
  customPhoneNumber,
  setCustomPhoneNumber,
  onCancel,
  onSend
}) => {
  if (!show || !smsInvoice) return null;
  
  const clientName = smsInvoice.is_business 
    ? smsInvoice.company_name 
    : `${smsInvoice.first_name} ${smsInvoice.last_name}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {/* Mobile: Full width with margins, Desktop: Fixed width */}
      <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MessageCircle size={20} className="text-blue-600" />
            Send Invoice SMS
          </h3>
          <button
            onClick={onCancel}
            className="p-1 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={smsSending}
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 overflow-y-auto">
          {/* Invoice Info */}
          <div className="mb-4 md:mb-6 p-3 bg-gray-50 rounded-lg">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Invoice:</span>
                <span className="text-gray-900">{smsInvoice.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Client:</span>
                <span className="text-gray-900">{clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Phone:</span>
                <span className="text-gray-900">{smsInvoice.phone || 'Not provided'}</span>
              </div>
            </div>
          </div>

          {/* Super Admin Phone Override */}
          {userRole === 'super_admin' && (
            <div className="mb-4 md:mb-6 p-3 border border-orange-200 bg-orange-50 rounded-lg">
              <label className="flex items-start mb-3">
                <input
                  type="checkbox"
                  checked={useCustomPhone}
                  onChange={(e) => setUseCustomPhone(e.target.checked)}
                  className="mt-1 mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Send to different phone number</span>
                  <p className="text-xs text-gray-500 mt-1">Override the client's phone number</p>
                </div>
              </label>

              {useCustomPhone && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Custom Phone Number
                  </label>
                  <input
                    type="tel"
                    value={customPhoneNumber}
                    onChange={(e) => setCustomPhoneNumber(e.target.value)}
                    className="w-full px-3 py-3 md:py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base md:text-sm"
                    placeholder="e.g., (509) 790-3516"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the phone number in any format. System will clean it up.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Message Input */}
          <div className="mb-4 md:mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SMS Message (Optional)
            </label>
            <textarea
              value={smsMessage}
              onChange={(e) => setSmsMessage(e.target.value)}
              rows={4}
              maxLength={160}
              className="w-full px-3 py-3 md:py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base md:text-sm resize-none"
              placeholder="Add a personal message to include with the invoice link..."
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500">
                A link to view the invoice will be automatically included.
              </p>
              <span className={`text-xs ${smsMessage.length > 140 ? 'text-red-500' : 'text-gray-400'}`}>
                {smsMessage.length}/160
              </span>
            </div>
          </div>

          {/* Preview */}
          {smsMessage.trim() && (
            <div className="mb-4 md:mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Message Preview:</h4>
              <div className="text-sm text-blue-700">
                <p>{smsMessage}</p>
                <p className="mt-2 font-medium">View invoice: [Link will be inserted]</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 md:p-6 border-t border-gray-200">
          <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 md:py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base md:text-sm disabled:opacity-50"
              disabled={smsSending}
            >
              Cancel
            </button>
            <button
              onClick={onSend}
              disabled={smsSending || (!smsInvoice.phone && (!useCustomPhone || !customPhoneNumber))}
              className="flex-1 px-4 py-3 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center text-base md:text-sm"
            >
              {smsSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send size={16} className="mr-2" />
                  Send SMS
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmsModal;