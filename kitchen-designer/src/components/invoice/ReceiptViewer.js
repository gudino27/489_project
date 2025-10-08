import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Receipt, Download, CheckCircle, AlertCircle, ArrowLeft, Globe } from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.gudinocustom.com';

const ReceiptViewer = () => {
  const { token, paymentId } = useParams();
  const navigate = useNavigate();
  const [receiptData, setReceiptData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState('en');

  const translations = {
    en: {
      title: 'Payment Receipt',
      loading: 'Loading receipt...',
      notFound: 'Receipt Not Found',
      goHome: 'Go Home',
      viewInvoice: 'View Invoice',
      paidInFull: 'Invoice Paid in Full',
      partialPayment: 'Partial Payment Received',
      remainingBalance: 'Remaining Balance',
      amountPaid: 'Amount Paid',
      paymentDetails: 'Payment Details',
      invoiceNumber: 'Invoice Number',
      paymentDate: 'Payment Date',
      paymentMethod: 'Payment Method',
      checkNumber: 'Check Number',
      totalPaid: 'Total Paid to Date',
      invoiceTotal: 'Invoice Total',
      notes: 'Notes',
      downloadReceipt: 'Download this receipt:',
      downloadEnglish: 'Download (English)',
      downloadSpanish: 'Descargar (Español)',
      companyName: 'Gudino Custom Woodworking',
      phone: 'Phone',
      thankYou: 'Thank you for your business! If you have any questions about this payment, please contact us.',
    },
    es: {
      title: 'Recibo de Pago',
      loading: 'Cargando recibo...',
      notFound: 'Recibo No Encontrado',
      goHome: 'Ir al Inicio',
      viewInvoice: 'Ver Factura',
      paidInFull: 'Factura Pagada Completamente',
      partialPayment: 'Pago Parcial Recibido',
      remainingBalance: 'Saldo Restante',
      amountPaid: 'Monto Pagado',
      paymentDetails: 'Detalles del Pago',
      invoiceNumber: 'Número de Factura',
      paymentDate: 'Fecha de Pago',
      paymentMethod: 'Método de Pago',
      checkNumber: 'Número de Cheque',
      totalPaid: 'Total Pagado Hasta la Fecha',
      invoiceTotal: 'Total de la Factura',
      notes: 'Notas',
      downloadReceipt: 'Descargar este recibo:',
      downloadEnglish: 'Download (English)',
      downloadSpanish: 'Descargar (Español)',
      companyName: 'Gudino Custom Woodworking',
      phone: 'Teléfono',
      thankYou: '¡Gracias por su negocio! Si tiene alguna pregunta sobre este pago, contáctenos.',
    },
  };

  const t = translations[language];

  useEffect(() => {
    fetchReceiptData();
  }, [token, paymentId]);

  const fetchReceiptData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/invoice/${token}/payment/${paymentId}`);

      if (!response.ok) {
        throw new Error('Receipt not found or access expired');
      }

      const data = await response.json();
      setReceiptData(data);
    } catch (err) {
      console.error('Error fetching receipt:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async (language = 'en') => {
    try {
      const response = await fetch(`${API_BASE}/invoice/${token}/payment/${paymentId}/pdf?lang=${language}`);

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Failed to download receipt PDF');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t.notFound}</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            style={{ minHeight: '44px' }}
          >
            {t.goHome}
          </button>
        </div>
      </div>
    );
  }

  if (!receiptData) return null;

  const { payment, invoice, totals } = receiptData;
  const isPaidInFull = totals.is_paid_in_full;

  return (
    <div className="min-h-screen py-4 px-2" style={{ backgroundColor: 'rgba(110, 110, 110, 1)' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-2">
          <div className="bg-gradient-to-r from-gray-600 to-gray-800 px-6 py-8 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Receipt size={32} />
                <h1 className="text-2xl font-bold">{t.title}</h1>
              </div>
              <div className="flex items-center gap-3">
                {/* Language Toggle */}
                <button
                  onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
                  className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  style={{ minHeight: '44px', minWidth: '44px' }}
                  title={language === 'en' ? 'Cambiar a Español' : 'Switch to English'}
                >
                  <Globe size={20} />
                  <span className="text-sm font-medium">{language === 'en' ? 'ES' : 'EN'}</span>
                </button>
                <button
                  onClick={() => navigate(`/invoice/${token}`)}
                  className="flex items-center gap-2 text-white hover:text-blue-100"
                  style={{ minHeight: '44px' }}
                >
                  <ArrowLeft size={20} />
                  <span className="hidden sm:inline">{t.viewInvoice}</span>
                </button>
              </div>
            </div>
            <p className="text-blue-100">{t.companyName}</p>
          </div>

          {/* Payment Status Banner */}
          <div className={`px-6 py-1 ${isPaidInFull ? 'bg-green-50' : 'bg-yellow-50'}`}>
            <div className="flex items-center gap-3">
              <CheckCircle className={isPaidInFull ? 'text-green-600' : 'text-yellow-600'} size={24} />
              <div>
                <p className={`font-semibold ${isPaidInFull ? 'text-green-900' : 'text-yellow-900'}`}>
                  {isPaidInFull ? t.paidInFull : t.partialPayment}
                </p>
                {!isPaidInFull && (
                  <p className="text-sm text-yellow-700">
                    {t.remainingBalance}: ${totals.remaining_balance}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Payment Amount */}
          <div className="px-6 py-6 text-center border-b">
            <p className="text-gray-600 mb-2">{t.amountPaid}</p>
            <p className="text-5xl font-bold text-black-600">${parseFloat(payment.amount).toFixed(2)}</p>
          </div>

          {/* Payment Details */}
          <div className="px-6 py-7 space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.paymentDetails}</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">{t.invoiceNumber}</p>
                <p className="font-medium text-gray-900">#{invoice.invoice_number.split('-').pop()}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">{t.paymentDate}</p>
                <p className="font-medium text-gray-900">
                  {new Date(payment.date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">{t.paymentMethod}</p>
                <p className="font-medium text-gray-900 capitalize">
                  {payment.method.replace('_', ' ')}
                </p>
              </div>

              {payment.check_number && (
                <div>
                  <p className="text-sm text-gray-600">{t.checkNumber}</p>
                  <p className="font-medium text-gray-900">{payment.check_number}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600">{t.totalPaid}</p>
                <p className="font-medium text-gray-900">${totals.total_paid}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">{t.invoiceTotal}</p>
                <p className="font-medium text-gray-900">${parseFloat(invoice.total_amount).toFixed(2)}</p>
              </div>
            </div>

            {payment.notes && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">{t.notes}</p>
                <p className="text-gray-900">{payment.notes}</p>
              </div>
            )}
          </div>

          {/* Download Buttons */}
          <div className="px-6 py-1 bg-gray-50 border-t">
            <p className="text-sm text-gray-600 mb-4">{t.downloadReceipt}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => downloadPDF('en')}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                style={{ minHeight: '44px' }}
              >
                <Download size={20} />
                <span>{t.downloadEnglish}</span>
              </button>
              <button
                onClick={() => downloadPDF('es')}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                style={{ minHeight: '44px' }}
              >
                <Download size={20} />
                <span>{t.downloadSpanish}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-white text-md" style={{ fontWeight: "bold" }}>
          <p className="mb-1">{t.companyName}</p>
          <p>{t.phone}: (509) 515-4090</p>
          <p className="mt-1 text-md text-white" style={{ fontWeight: "bold" }}>
            {t.thankYou}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReceiptViewer;
