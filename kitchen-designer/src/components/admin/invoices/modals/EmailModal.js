import React from 'react';
import { Send } from 'lucide-react';

const EmailModal = ({
  show,
  emailInvoice,
  emailMessage,
  setEmailMessage,
  emailSending,
  onCancel,
  onSend
}) => {
  if (!show || !emailInvoice) return null;
  
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
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            disabled={emailSending}
          >
            Cancel
          </button>
          <button
            onClick={onSend}
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

export default EmailModal;