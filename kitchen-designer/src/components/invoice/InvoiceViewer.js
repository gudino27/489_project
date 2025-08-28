import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Download, 
  FileText, 
  Building, 
  User, 
  Calendar, 
  DollarSign, 
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Phone,
  Mail
} from 'lucide-react';

const InvoiceViewer = () => {
  const { token } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL || 'https://api.gudinocustom.com';

  useEffect(() => {
    fetchInvoice();
  }, [token]);

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/invoice/${token}`);
      if (response.ok) {
        const data = await response.json();
        setInvoice(data);
      } else {
        setError('Invoice not found or access link expired');
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      setError('Failed to load invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/invoice/${token}/pdf`);

      if (response.ok) {
        const pdfBlob = await response.blob();
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${invoice.invoice_number}.pdf`;
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      } else {
        alert('Failed to generate PDF. Please try again or contact support.');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'text-green-600';
      case 'overdue': return 'text-red-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <CheckCircle className="inline w-5 h-5" />;
      case 'overdue': return <XCircle className="inline w-5 h-5" />;
      case 'pending': return <Clock className="inline w-5 h-5" />;
      default: return <AlertCircle className="inline w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your invoice...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invoice Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">
            If you believe this is an error, please contact Gudino Custom Cabinets
          </p>
        </div>
      </div>
    );
  }

  const clientName = invoice.is_business 
    ? invoice.company_name 
    : `${invoice.first_name} ${invoice.last_name}`;

  const totalPaid = invoice.payments?.reduce((sum, payment) => sum + parseFloat(payment.payment_amount), 0) || 0;
  const remainingBalance = invoice.total_amount - totalPaid;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Invoice {invoice.invoice_number}
              </h1>
              <p className="text-gray-600 flex items-center gap-2 mt-1">
                <Building className="w-4 h-4" />
                Gudino Custom Cabinets
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={downloadPDF}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
              >
                <Download size={16} />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Status and Basic Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Status */}
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-500 mb-1">Status</p>
              <p className={`text-lg font-semibold ${getStatusColor(invoice.status)} flex items-center gap-2 justify-center md:justify-start`}>
                {getStatusIcon(invoice.status)}
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </p>
            </div>

            {/* Invoice Date */}
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-500 mb-1">Invoice Date</p>
              <p className="text-lg font-semibold text-gray-900 flex items-center gap-2 justify-center md:justify-start">
                <Calendar className="w-4 h-4" />
                {new Date(invoice.invoice_date).toLocaleDateString()}
              </p>
            </div>

            {/* Due Date */}
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-500 mb-1">Due Date</p>
              <p className="text-lg font-semibold text-gray-900 flex items-center gap-2 justify-center md:justify-start">
                <Clock className="w-4 h-4" />
                {new Date(invoice.due_date).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bill To */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                {invoice.is_business ? <Building className="w-5 h-5" /> : <User className="w-5 h-5" />}
                Bill To
              </h3>
              <div className="space-y-2">
                <p className="font-semibold text-gray-900">{clientName}</p>
                {invoice.email && (
                  <p className="text-gray-600 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {invoice.email}
                  </p>
                )}
                {invoice.phone && (
                  <p className="text-gray-600 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {invoice.phone}
                  </p>
                )}
                {invoice.address && (
                  <p className="text-gray-600">{invoice.address}</p>
                )}
                {invoice.tax_exempt_number && (
                  <p className="text-sm text-blue-600">
                    Tax Exempt: {invoice.tax_exempt_number}
                  </p>
                )}
              </div>
            </div>

            {/* Line Items */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Items & Services
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Description
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Qty
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Unit Price
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {invoice.line_items?.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{item.description}</p>
                            {item.notes && (
                              <p className="text-sm text-gray-500 mt-1">{item.notes}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-900">
                          ${parseFloat(item.unit_price).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-gray-900">
                          ${(item.quantity * parseFloat(item.unit_price)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h3>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Invoice Total */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Invoice Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">${invoice.subtotal_amount.toFixed(2)}</span>
                </div>
                {invoice.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-${invoice.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                {invoice.markup_amount > 0 && (
                  <div className="flex justify-between">
                    <span>Markup:</span>
                    <span>${invoice.markup_amount.toFixed(2)}</span>
                  </div>
                )}
                {invoice.tax_amount > 0 && (
                  <div className="flex justify-between">
                    <span>Tax ({(invoice.tax_rate * 100).toFixed(2)}%):</span>
                    <span>${invoice.tax_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span className="text-blue-600">${invoice.total_amount.toFixed(2)}</span>
                  </div>
                </div>
                {totalPaid > 0 && (
                  <>
                    <div className="flex justify-between text-green-600">
                      <span>Amount Paid:</span>
                      <span>-${totalPaid.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Remaining Balance:</span>
                        <span className={remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}>
                          ${remainingBalance.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Payment History */}
            {invoice.payments && invoice.payments.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
                <div className="space-y-3">
                  {invoice.payments.map((payment, index) => (
                    <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-green-800">
                            ${parseFloat(payment.payment_amount).toFixed(2)}
                          </p>
                          <p className="text-sm text-green-600">
                            {payment.payment_method}
                            {payment.check_number && ` - Check #${payment.check_number}`}
                          </p>
                          {payment.notes && (
                            <p className="text-xs text-green-600 mt-1">{payment.notes}</p>
                          )}
                        </div>
                        <p className="text-sm text-green-600">
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Questions?</h3>
              <div className="space-y-3">
                <p className="text-gray-600">
                  If you have any questions about this invoice, please contact us:
                </p>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    contact@gudinocustom.com
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    (509) 790-3516
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceViewer;