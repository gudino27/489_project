import React, { useState } from 'react';
import { X, Send, Mail, MessageSquare, Receipt } from 'lucide-react';
import { useLanguage } from '../../../../contexts/LanguageContext';

const SendReceiptModal = ({
  payment,
  invoice,
  clientEmail,
  clientPhone,
  onClose,
  onSend,
}) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    send_via: 'email',
    recipients: clientEmail ? [clientEmail] : [],
    language: 'en',
  });
  const [customRecipient, setCustomRecipient] = useState('');
  const [sending, setSending] = useState(false);

  const handleAddRecipient = () => {
    if (customRecipient.trim()) {
      setFormData({
        ...formData,
        recipients: [...formData.recipients, customRecipient.trim()],
      });
      setCustomRecipient('');
    }
  };

  const handleRemoveRecipient = (index) => {
    setFormData({
      ...formData,
      recipients: formData.recipients.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await onSend(formData);
      onClose();
    } catch (error) {
      console.error('Error sending receipt:', error);
    } finally {
      setSending(false);
    }
  };

  // Auto-add client phone when switching to SMS
  React.useEffect(() => {
    if (formData.send_via === 'sms' && clientPhone && !formData.recipients.includes(clientPhone)) {
      setFormData({
        ...formData,
        recipients: [clientPhone],
      });
    } else if (formData.send_via === 'email' && clientEmail && formData.recipients.length === 0) {
      setFormData({
        ...formData,
        recipients: [clientEmail],
      });
    }
  }, [formData.send_via]);

  const invoiceShortNumber = invoice?.invoice_number?.split('-').pop() || '';
  const paymentAmount = parseFloat(payment?.payment_amount || 0).toFixed(2);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <div className="flex items-center gap-3">
            <Receipt className="text-green-600" size={24} />
            <h2 className="text-lg sm:text-xl font-semibold">{t('receipt.send')}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {/* Receipt Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('receipt.invoice')}:</span>
                <span className="font-medium">#{invoiceShortNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('receipt.paymentAmount')}:</span>
                <span className="font-medium text-green-600">${paymentAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('receipt.paymentDate')}:</span>
                <span className="font-medium">
                  {payment?.payment_date ? new Date(payment.payment_date).toLocaleDateString() : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Send Via Radio Buttons */}
          <div>
            <label className="block text-sm font-medium mb-2">{t('receipt.sendVia')}</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, send_via: 'email' })}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                  formData.send_via === 'email'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                style={{ minHeight: '44px' }}
              >
                <Mail size={18} />
                <span className="font-medium">{t('receipt.email')}</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, send_via: 'sms' })}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                  formData.send_via === 'sms'
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                style={{ minHeight: '44px' }}
              >
                <MessageSquare size={18} />
                <span className="font-medium">{t('receipt.sms')}</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, send_via: 'both' })}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                  formData.send_via === 'both'
                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                style={{ minHeight: '44px' }}
              >
                <span className="font-medium">{t('receipt.both')}</span>
              </button>
            </div>
          </div>

          {/* Recipients */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {formData.send_via === 'sms' ? t('receipt.phoneNumbers') : t('receipt.recipients')}
            </label>
            <div className="space-y-2">
              {formData.recipients.map((recipient, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={recipient}
                    readOnly
                    className="flex-1 px-3 py-2 border rounded-lg bg-gray-50"
                    style={{ minHeight: '44px' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveRecipient(index)}
                    className="text-red-600 hover:text-red-900 px-3"
                    style={{ minHeight: '44px', minWidth: '44px' }}
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customRecipient}
                  onChange={(e) => setCustomRecipient(e.target.value)}
                  placeholder={
                    formData.send_via === 'sms'
                      ? t('receipt.phonePlaceholder')
                      : t('receipt.emailPlaceholder')
                  }
                  className="flex-1 px-3 py-2 border rounded-lg"
                  style={{ minHeight: '44px' }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddRecipient();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddRecipient}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  style={{ minHeight: '44px' }}
                >
                  {t('receipt.addRecipient')}
                </button>
              </div>
            </div>
          </div>

          {/* Language Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">{t('receipt.language')}</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, language: 'en' })}
                className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                  formData.language === 'en'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                style={{ minHeight: '44px' }}
              >
                {t('language.english')}
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, language: 'es' })}
                className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                  formData.language === 'es'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                style={{ minHeight: '44px' }}
              >
                {t('language.spanish')}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              style={{ minHeight: '44px' }}
              disabled={sending}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ minHeight: '44px' }}
              disabled={sending || formData.recipients.length === 0}
            >
              <Send size={18} />
              {sending ? t('receipt.sending') : t('receipt.send')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SendReceiptModal;
