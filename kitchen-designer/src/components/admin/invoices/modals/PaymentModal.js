import React, { useState, useEffect } from 'react';
import { DollarSign, CreditCard } from 'lucide-react';

const PaymentModal = ({
  show,
  invoice,
  onCancel,
  onSubmit,
  isSubmitting
}) => {
  const [paymentData, setPaymentData] = useState({
    payment_amount: '',
    payment_method: 'cash',
    check_number: '',
    payment_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (show && invoice) {
      // Reset form when modal opens
      setPaymentData({
        payment_amount: '',
        payment_method: 'cash',
        check_number: '',
        payment_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setErrors({});
    }
  }, [show, invoice]);

  if (!show || !invoice) return null;

  const clientName = invoice.is_business
    ? invoice.company_name
    : `${invoice.first_name} ${invoice.last_name}`;

  const balanceDue = parseFloat(invoice.balance_due || invoice.total_amount || 0);

  const validateForm = () => {
    const newErrors = {};

    if (!paymentData.payment_amount || parseFloat(paymentData.payment_amount) <= 0) {
      newErrors.payment_amount = 'Payment amount is required and must be greater than 0';
    }

    if (parseFloat(paymentData.payment_amount) > balanceDue) {
      newErrors.payment_amount = 'Payment amount cannot exceed balance due';
    }

    if (!paymentData.payment_method) {
      newErrors.payment_method = 'Payment method is required';
    }

    if (paymentData.payment_method === 'check' && !paymentData.check_number) {
      newErrors.check_number = 'Check number is required for check payments';
    }

    if (!paymentData.payment_date) {
      newErrors.payment_date = 'Payment date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        ...paymentData,
        payment_amount: parseFloat(paymentData.payment_amount)
      });
    }
  };

  const handleInputChange = (field, value) => {
    setPaymentData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <DollarSign size={20} />
          Add Payment
        </h3>

        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">
            <strong>Invoice:</strong> {invoice.invoice_number}
          </p>
          <p className="text-sm text-gray-600 mb-1">
            <strong>Client:</strong> {clientName}
          </p>
          <p className="text-sm text-gray-600 mb-1">
            <strong>Balance Due:</strong> ${balanceDue.toFixed(2)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Payment Amount *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">$</span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={balanceDue}
                value={paymentData.payment_amount}
                onChange={(e) => handleInputChange('payment_amount', e.target.value)}
                className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:border-blue-500 focus:outline-none ${
                  errors.payment_amount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
                disabled={isSubmitting}
              />
            </div>
            {errors.payment_amount && (
              <p className="text-red-500 text-sm mt-1">{errors.payment_amount}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Payment Method *
            </label>
            <select
              value={paymentData.payment_method}
              onChange={(e) => handleInputChange('payment_method', e.target.value)}
              className={`w-full p-2 border rounded-lg focus:border-blue-500 focus:outline-none ${
                errors.payment_method ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            >
              <option value="cash">Cash</option>
              <option value="check">Check</option>
              <option value="other">Other</option>
            </select>
            {errors.payment_method && (
              <p className="text-red-500 text-sm mt-1">{errors.payment_method}</p>
            )}
          </div>

          {paymentData.payment_method === 'check' && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Check Number *
              </label>
              <input
                type="text"
                value={paymentData.check_number}
                onChange={(e) => handleInputChange('check_number', e.target.value)}
                className={`w-full p-2 border rounded-lg focus:border-blue-500 focus:outline-none ${
                  errors.check_number ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter check number"
                disabled={isSubmitting}
              />
              {errors.check_number && (
                <p className="text-red-500 text-sm mt-1">{errors.check_number}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Payment Date *
            </label>
            <input
              type="date"
              value={paymentData.payment_date}
              onChange={(e) => handleInputChange('payment_date', e.target.value)}
              className={`w-full p-2 border rounded-lg focus:border-blue-500 focus:outline-none ${
                errors.payment_date ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            />
            {errors.payment_date && (
              <p className="text-red-500 text-sm mt-1">{errors.payment_date}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={paymentData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="Add any notes about this payment..."
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Adding...
                </>
              ) : (
                <>
                  <CreditCard size={16} />
                  Add Payment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;