import React, { useState } from 'react';
import { Send } from 'lucide-react';

const QuoteForm = ({ 
  isVisible,
  onClose,
  clientInfo,
  setClientInfo,
  kitchenData,
  bathroomData,
  calculateTotalPrice,
  onSendQuote
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 overflow-y-auto" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-lg max-w-md w-full mt-24 mb-4 min-h-0">
        {/* Modal content */}
        <div className="p-6 pt-2 ">
          <h3 className="text-xl font-bold mb-2">Request Quote</h3>
          <p className="text-sm text-gray-600 mb-3">
            Fill out your information below and we'll send you a detailed quote.
          </p>

          <div className="space-y-4">
          {/* Customer name input */}
          <div>
            <label className="block text-sm font-medium mb-1">Your Name *</label>
            <input
              type="text"
              value={clientInfo.name}
              onChange={(e) => setClientInfo({ ...clientInfo, name: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Your full name"
            />
          </div>

          {/* Contact information - collect both email and phone */}
          <div>
            <label className="block text-sm font-medium mb-1">Your Email *</label>
            <input
              type="email"
              value={clientInfo.email}
              onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="your.email@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Your Phone Number *</label>
            <input
              type="tel"
              value={clientInfo.phone}
              onChange={(e) => setClientInfo({ ...clientInfo, phone: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="(555) 123-4567"
            />
          </div>

          {/* Contact preference selector - now for preferred method only */}
          <div>
            <label className="block text-sm font-medium mb-1">Preferred Contact Method *</label>
            <select
              value={clientInfo.contactPreference}
              onChange={(e) => setClientInfo({ ...clientInfo, contactPreference: e.target.value })}
              className="w-full p-2 border rounded"
            >
              <option value="email">Email</option>
              <option value="phone">Phone Call</option>
              <option value="text">Text Message</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              We'll collect both your email and phone, but contact you via your preferred method first.
            </p>
          </div>

          {/* Room inclusion options */}
          <div>
            <label className="block text-sm font-medium mb-2">Include in Quote:</label>
            <div className="space-y-2">
              {/* Kitchen inclusion checkbox */}
              {kitchenData.elements.length > 0 && (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={clientInfo.includeKitchen}
                    onChange={(e) => setClientInfo({ ...clientInfo, includeKitchen: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Kitchen ({kitchenData.elements.length} items - ${calculateTotalPrice(kitchenData).toFixed(2)})</span>
                </label>
              )}
              {/* Bathroom inclusion checkbox */}
              {bathroomData.elements.length > 0 && (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={clientInfo.includeBathroom}
                    onChange={(e) => setClientInfo({ ...clientInfo, includeBathroom: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Bathroom ({bathroomData.elements.length} items - ${calculateTotalPrice(bathroomData).toFixed(2)})</span>
                </label>
              )}
            </div>
          </div>

          {/* Additional comments field */}
          <div>
            <label className="block text-sm font-medium mb-1">Comments/Special Requests</label>
            <textarea
              value={clientInfo.comments}
              onChange={(e) => setClientInfo({ ...clientInfo, comments: e.target.value })}
              className="w-full p-2 border rounded h-24"
              placeholder="Any specific requirements, questions, or notes about wall modifications..."
            />
          </div>

          {/* Process information panel */}
          <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
            <p className="font-medium mb-1">What happens next?</p>
            <ul className="list-disc list-inside text-xs space-y-1">
              <li>Your design and quote will be sent to our team</li>
              <li>We'll contact you within 1-4 business days via your preferred method</li>
              <li>Once everything is confirmed, we'll schedule a measurement appointment</li>
            </ul>
          </div>

          {/* Modal action buttons */}
          <div className="flex gap-2 pt-6 mt-6 border-t border-gray-200">
            {/* Cancel button */}
            <button
              onClick={onClose}
              className="flex-1 p-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            {/* Submit quote request button */}
            <button
              onClick={onSendQuote}
              className="flex-1 p-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center gap-2"
            >
              <Send size={16} />
              Send Quote Request
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteForm;