import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Star,
  Trash2,
  Send,
  Copy,
  Check,
  Eye,
  EyeOff,
  Calendar,
  User,
  X
} from 'lucide-react';
import { formatDateTimePacific } from '../../utils/dateUtils';
import { useLanguage } from '../../contexts/LanguageContext';

const TestimonialManager = ({ token, API_BASE, userRole }) => {
  const { t } = useLanguage();
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendLinkForm, setSendLinkForm] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    project_type: '',
    custom_project_type: '',
    send_via: 'email'
  });
  const [sendingLink, setSendingLink] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [copiedToken, setCopiedToken] = useState('');
  const [selectedTestimonials, setSelectedTestimonials] = useState(new Set());
  const [generatedTokens, setGeneratedTokens] = useState([]);

  const projectTypes = [
    t('testimonialManager.kitchenRemodeling'),
    t('testimonialManager.bathroomRenovation'),
    t('testimonialManager.customCarpentry'),
    t('testimonialManager.cabinetInstallation'),
    t('testimonialManager.homeRemodeling'),
    t('testimonialManager.commercialProject'),
    t('testimonialManager.other')
  ];

  useEffect(() => {
    loadTestimonials();
    loadGeneratedTokens();
  }, []);

  const loadTestimonials = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/testimonials`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTestimonials(data);
      }
    } catch (error) {
      console.error('Error loading testimonials:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGeneratedTokens = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/testimonial-tokens`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedTokens(data);
      }
    } catch (error) {
      console.error('Error loading tokens:', error);
    }
  };

  const sendTestimonialLink = async (e) => {
    e.preventDefault();
    setSendingLink(true);

    try {
      // Use custom project type if "Other" is selected
      const formData = {
        ...sendLinkForm,
        project_type: sendLinkForm.project_type === 'Other' ? sendLinkForm.custom_project_type : sendLinkForm.project_type
      };

      const response = await fetch(`${API_BASE}/api/admin/send-testimonial-link`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setLinkSent(true);
        setSendLinkForm({ client_name: '', client_email: '', client_phone: '', project_type: '', custom_project_type: '', send_via: 'email' });
        loadGeneratedTokens();

        // Show results if both were sent
        if (data.results && (data.results.email || data.results.sms)) {
          let message = 'Testimonial link sent successfully!\n';
          if (data.results.email?.success) message += '✓ Email sent\n';
          if (data.results.sms?.success) message += '✓ SMS sent\n';
          if (data.results.email?.success === false) message += '✗ Email failed\n';
          if (data.results.sms?.success === false) message += '✗ SMS failed\n';
          alert(message);
        }

        setTimeout(() => setLinkSent(false), 5000);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to send testimonial link');
      }
    } catch (error) {
      console.error('Error sending link:', error);
      alert('Error sending testimonial link');
    } finally {
      setSendingLink(false);
    }
  };

  const copyTestimonialLink = async (tokenValue) => {
    const link = `${window.location.origin}/testimonial/${tokenValue}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedToken(tokenValue);
      setTimeout(() => setCopiedToken(''), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const deleteTestimonialToken = async (tokenValue) => {
    if (!window.confirm(t('testimonialManager.deleteLinkConfirm'))) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/admin/testimonial-tokens/${tokenValue}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setGeneratedTokens(generatedTokens.filter(t => t.token !== tokenValue));
      } else {
        alert('Failed to delete testimonial link');
      }
    } catch (error) {
      console.error('Error deleting token:', error);
      alert('Error deleting testimonial link');
    }
  };

  const deleteTestimonial = async (testimonialId) => {
    if (!window.confirm(t('testimonialManager.deleteTestimonialConfirm'))) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/admin/testimonials/${testimonialId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setTestimonials(testimonials.filter(t => t.id !== testimonialId));
      } else {
        alert('Failed to delete testimonial');
      }
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      alert('Error deleting testimonial');
    }
  };

  const toggleTestimonialVisibility = async (testimonialId, currentStatus) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/testimonials/${testimonialId}/visibility`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_visible: !currentStatus })
      });

      if (response.ok) {
        setTestimonials(testimonials.map(t =>
          t.id === testimonialId ? { ...t, is_visible: !currentStatus } : t
        ));
      }
    } catch (error) {
      console.error('Error updating visibility:', error);
    }
  };

  const bulkDeleteTestimonials = async () => {
    if (selectedTestimonials.size === 0) return;

    if (!window.confirm(`${t('testimonialManager.delete')} ${selectedTestimonials.size} ${t('testimonialManager.selectedCount')}?`)) {
      return;
    }

    try {
      const deletePromises = Array.from(selectedTestimonials).map(id =>
        fetch(`${API_BASE}/api/admin/testimonials/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      );

      await Promise.all(deletePromises);
      setTestimonials(testimonials.filter(t => !selectedTestimonials.has(t.id)));
      setSelectedTestimonials(new Set());
    } catch (error) {
      console.error('Error bulk deleting:', error);
      alert('Error deleting some testimonials');
    }
  };

  const formatDate = (dateString) => {
    // Convert UTC timestamp to PST/PDT using shared utility
    return formatDateTimePacific(dateString, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">{t('testimonialManager.title')}</h2>
        <p className="text-gray-600">{t('testimonialManager.description')}</p>
      </div>

      {/* Send Testimonial Link Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Send className="w-5 h-5" />
          {t('testimonialManager.sendLink')}
        </h3>

        <form onSubmit={sendTestimonialLink} className="space-y-3">
          {/* Row 1: Name and Project Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                {t('testimonialManager.clientName')} *
              </label>
              <input
                type="text"
                value={sendLinkForm.client_name}
                onChange={(e) => setSendLinkForm({ ...sendLinkForm, client_name: e.target.value })}
                className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder={t('testimonialManager.enterName')}
                required
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                {t('testimonialManager.projectType')} *
              </label>
              <select
                value={sendLinkForm.project_type}
                onChange={(e) => setSendLinkForm({ ...sendLinkForm, project_type: e.target.value, custom_project_type: '' })}
                className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">{t('testimonialManager.selectType')}</option>
                {projectTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom Project Type (if Other selected) */}
          {sendLinkForm.project_type === t('testimonialManager.other') && (
            <div>
              <input
                type="text"
                value={sendLinkForm.custom_project_type}
                onChange={(e) => setSendLinkForm({ ...sendLinkForm, custom_project_type: e.target.value })}
                className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder={t('testimonialManager.enterCustomType')}
                required
              />
            </div>
          )}

          {/* Row 2: Email and Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                {t('testimonialManager.email')} {sendLinkForm.send_via === 'email' || sendLinkForm.send_via === 'both' ? '*' : ''}
              </label>
              <input
                type="email"
                value={sendLinkForm.client_email}
                onChange={(e) => setSendLinkForm({ ...sendLinkForm, client_email: e.target.value })}
                className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder={t('testimonialManager.enterEmail')}
                required={sendLinkForm.send_via === 'email' || sendLinkForm.send_via === 'both'}
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                {t('testimonialManager.phone')} {sendLinkForm.send_via === 'sms' || sendLinkForm.send_via === 'both' ? '*' : ''}
              </label>
              <input
                type="tel"
                value={sendLinkForm.client_phone}
                onChange={(e) => setSendLinkForm({ ...sendLinkForm, client_phone: e.target.value })}
                className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder={t('testimonialManager.enterPhone')}
                required={sendLinkForm.send_via === 'sms' || sendLinkForm.send_via === 'both'}
              />
            </div>
          </div>

          {/* Row 3: Send Via Options */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              {t('testimonialManager.sendVia')} *
            </label>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="email"
                  checked={sendLinkForm.send_via === 'email'}
                  onChange={(e) => setSendLinkForm({ ...sendLinkForm, send_via: e.target.value })}
                  className="mr-2"
                />
                <span className="text-sm">Email Only</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="sms"
                  checked={sendLinkForm.send_via === 'sms'}
                  onChange={(e) => setSendLinkForm({ ...sendLinkForm, send_via: e.target.value })}
                  className="mr-2"
                />
                <span className="text-sm">SMS Only</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="both"
                  checked={sendLinkForm.send_via === 'both'}
                  onChange={(e) => setSendLinkForm({ ...sendLinkForm, send_via: e.target.value })}
                  className="mr-2"
                />
                <span className="text-sm">Both</span>
              </label>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={sendingLink}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {sendingLink ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Testimonial Link
                </>
              )}
            </button>

            {linkSent && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md text-green-700">
                Testimonial link sent successfully!
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Generated Tokens */}
      {generatedTokens.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Generated Testimonial Links</h3>

          <div className="space-y-3">
            {generatedTokens.map((tokenData) => (
              <div key={tokenData.token} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div>
                  <p className="font-medium">{tokenData.client_name}</p>
                  <p className="text-sm text-gray-600">{tokenData.client_email} • {tokenData.project_type}</p>
                  <p className="text-xs text-gray-500">Created: {formatDate(tokenData.created_at)}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => copyTestimonialLink(tokenData.token)}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                  >
                    {copiedToken === tokenData.token ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Link
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => deleteTestimonialToken(tokenData.token)}
                    className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
                    title="Delete testimonial link"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedTestimonials.size > 0 && userRole === 'super_admin' && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedTestimonials.size} testimonial(s) selected
            </span>
            <button
              onClick={bulkDeleteTestimonials}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Testimonials List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Received Testimonials ({testimonials.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-500">Loading testimonials...</p>
          </div>
        ) : testimonials.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No testimonials received yet.</p>
            <p className="text-sm">Send testimonial links to clients to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedTestimonials.has(testimonial.id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedTestimonials);
                        if (e.target.checked) {
                          newSelected.add(testimonial.id);
                        } else {
                          newSelected.delete(testimonial.id);
                        }
                        setSelectedTestimonials(newSelected);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{testimonial.client_name}</h4>
                        <div className="flex items-center gap-1">
                          {renderStars(testimonial.rating)}
                        </div>
                      </div>

                      <p className="text-gray-700 mb-2">"{testimonial.message}"</p>

                      {testimonial.photos && testimonial.photos.length > 0 && (
                        <div className="testimonial-admin-photos mb-3">
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            {testimonial.photos.map((photo, photoIndex) => (
                              <div key={photoIndex} className="flex-shrink-0">
                                <img
                                  src={`${API_BASE}${photo.thumbnail_path || photo.file_path}`}
                                  alt={`Photo ${photoIndex + 1}`}
                                  className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => window.open(`${API_BASE}${photo.file_path}`, '_blank')}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {testimonial.project_type && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                            {testimonial.project_type}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(testimonial.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleTestimonialVisibility(testimonial.id, testimonial.is_visible)}
                      className={`p-2 rounded-md ${testimonial.is_visible
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-gray-400 hover:bg-gray-50'
                        }`}
                      title={testimonial.is_visible ? 'Visible on website' : 'Hidden from website'}
                    >
                      {testimonial.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    {userRole === 'super_admin' && (
                      <button
                        onClick={() => deleteTestimonial(testimonial.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestimonialManager;