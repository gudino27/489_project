import React, { useState } from 'react';
import { Send, Globe, Plus, X, User } from 'lucide-react';
import { useLanguage } from '../../../../contexts/LanguageContext';

const EmailModal = ({
  show,
  emailInvoice,
  emailMessage,
  setEmailMessage,
  emailSending,
  onCancel,
  onSend
}) => {
  const { t } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [sendToSelf, setSendToSelf] = useState(false);
  const [additionalEmails, setAdditionalEmails] = useState(['']);
  const [selfEmail, setSelfEmail] = useState('');
  const [useCustomClientEmail, setUseCustomClientEmail] = useState(false);
  const [customClientEmail, setCustomClientEmail] = useState('');

  if (!show || !emailInvoice) return null;

  const clientName = emailInvoice.is_business
    ? emailInvoice.company_name
    : `${emailInvoice.first_name} ${emailInvoice.last_name}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ overflowY: 'auto' }}>
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-3 overflow-y-auto z-60" style={{ maxHeight: '75vh'}}>
        <h3 className="text-lg font-semibold mb-4">{t('emailModal.title')}</h3>

        <div className="mb-3">
          <p className="text-sm text-gray-600 mb-1">
            <strong>{t('invoiceManager.invoiceNumber')}:</strong> {emailInvoice.invoice_number}
          </p>
          <p className="text-sm text-gray-600 mb-1">
            <strong>{t('invoiceManager.client')}:</strong> {clientName}
          </p>
          <p className="text-sm text-gray-600 mb-3">
            <strong>{t('clientManagement.isPrimaryEmail')}:</strong> {emailInvoice.email}
          </p>
        </div>

        {/* Email Recipients Section */}
        <div className="mb-3">
          <h4 className="text-sm font-medium mb-2">{t('emailModal.to')}</h4>

          {/* Primary Recipient Options */}
          <div className=" p-1 border rounded-lg bg-blue-50">
            <h5 className="text-sm font-medium mb-1">Primary Recipient (Client)</h5>

            <label className="flex items-center gap-2 mb-1">
              <input
                type="radio"
                name="clientEmailOption"
                checked={!useCustomClientEmail}
                onChange={() => setUseCustomClientEmail(false)}
                className="form-radio"
              />
              <span className="text-sm">{t('clientManagement.email')}: {emailInvoice.email}</span>
            </label>

            <label className="flex items-center gap-2 mb-1">
              <input
                type="radio"
                name="clientEmailOption"
                checked={useCustomClientEmail}
                onChange={() => setUseCustomClientEmail(true)}
                className="form-radio"
              />
              <span className="text-sm">{t('smsModal.useCustomPhone')}</span>
            </label>

            {useCustomClientEmail && (
              <input
                type="email"
                value={customClientEmail}
                onChange={(e) => setCustomClientEmail(e.target.value)}
                placeholder={t('clientManagement.email')}
                className="w-full p-2 border rounded-lg focus:border-blue-500 focus:outline-none text-sm mt-1"
              />
            )}
          </div>

          {/* Send to Self Option */}
          <div className=" p-3 border rounded-lg">
            <label className="flex items-center gap-2 mb-1">
              <input
                type="checkbox"
                checked={sendToSelf}
                onChange={(e) => setSendToSelf(e.target.checked)}
                className="form-checkbox"
              />
              <User size={16} />
              <span className="text-sm font-medium">{t('emailModal.to')}</span>
            </label>
            {sendToSelf && (
              <input
                type="email"
                value={selfEmail}
                onChange={(e) => setSelfEmail(e.target.value)}
                placeholder={t('clientManagement.email')}
                className="w-full p-2 border rounded-lg focus:border-blue-500 focus:outline-none text-sm mt-1"
              />
            )}
          </div>

          {/* Additional Recipients */}
          <div className="p-3 border rounded-lg">
            <h5 className="text-sm font-medium mb-1">{t('emailModal.to')}</h5>
            <div className="space-y-2">
              {additionalEmails.map((email, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      const newEmails = [...additionalEmails];
                      newEmails[index] = e.target.value;
                      setAdditionalEmails(newEmails);
                    }}
                    placeholder={t('clientManagement.email')}
                    className="flex-1 p-2 border rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                  />
                  {additionalEmails.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newEmails = additionalEmails.filter((_, i) => i !== index);
                        setAdditionalEmails(newEmails.length === 0 ? [''] : newEmails);
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}

              {additionalEmails.length < 5 && (
                <button
                  type="button"
                  onClick={() => setAdditionalEmails([...additionalEmails, ''])}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                >
                  <Plus size={16} />
                  {t('emailModal.to')}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mb-1">
          <label className="block text-sm font-medium mb-1 flex items-center gap-2">
            <Globe size={16} />
            Language / Idioma
          </label>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none mb-1"
          >
            <option value="english">English</option>
            <option value="spanish">Español</option>
          </select>
        </div>

        <div className="mb-2">
          <label className="block text-sm font-medium mb-1">
            {t('emailModal.message')}
          </label>
          <textarea
            value={emailMessage}
            onChange={(e) => setEmailMessage(e.target.value)}
            rows={4}
            className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
            placeholder={selectedLanguage === 'spanish'
              ? "Agregue un mensaje personal para incluir con la factura..."
              : "Add a personal message to include with the invoice..."
            }
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4  border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            disabled={emailSending}
          >
            {t('emailModal.cancel')}
          </button>
          <button
            onClick={() => {
              const emailData = {
                language: selectedLanguage,
                sendToSelf,
                selfEmail: sendToSelf ? selfEmail : '',
                additionalEmails: additionalEmails.filter(email => email.trim() !== ''),
                useCustomClientEmail,
                customClientEmail: useCustomClientEmail ? customClientEmail : ''
              };
              onSend(emailData);
            }}
            disabled={
              emailSending ||
              (sendToSelf && !selfEmail.trim()) ||
              (useCustomClientEmail && !customClientEmail.trim())
            }
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {emailSending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {t('emailModal.sending')}
              </>
            ) : (
              <>
                <Send size={16} />
                {t('emailModal.send')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailModal;