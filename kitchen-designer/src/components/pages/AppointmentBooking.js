// Appointment Booking Component
// Allows customers to book consultations, measurements, estimates, and follow-ups
// Features: Calendar-based date selection, time slot picker, bilingual support

import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import Navigation from '../ui/Navigation';
import Footer from '../ui/Footer';

const API_URL = process.env.REACT_APP_API_URL || 'https://api.gudinocustom.com';

// Appointment type configurations
const APPOINTMENT_TYPES = {
  consultation: { duration: 90, icon: '💬' },
  measurement: { duration: 180, icon: '📐' },
  estimate: { duration: 90, icon: '📋' },
  followup: { duration: 30, icon: '🔄' }
};

function AppointmentBooking() {
  const { t, language } = useLanguage();

  // Booking flow state
  const [step, setStep] = useState(1); // 1: Type, 2: Date/Time, 3: Info, 4: Confirmation
  const [appointmentType, setAppointmentType] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableDates, setAvailableDates] = useState([]);

  // Fetch available dates when type is selected
  useEffect(() => {
    if (appointmentType) {
      fetchAvailableDates();
    }
  }, [appointmentType, currentMonth]);

  // Fetch available time slots when date is selected
  useEffect(() => {
    if (selectedDate && appointmentType) {
      fetchAvailableSlots();
    }
  }, [selectedDate, appointmentType]);

  const fetchAvailableDates = async () => {
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const response = await fetch(
        `${API_URL}/api/appointments/available-dates/${year}/${month}`
      );
      if (response.ok) {
        const data = await response.json();
        setAvailableDates(data.availableDates || []);
      }
    } catch (err) {
      console.error('Error fetching available dates:', err);
    }
  };

  const fetchAvailableSlots = async () => {
    setLoading(true);
    setError(null);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const duration = APPOINTMENT_TYPES[appointmentType]?.duration || 60;

      const response = await fetch(
        `${API_URL}/api/appointments/available-slots/${dateStr}?duration=${duration}`
      );

      if (response.ok) {
        const data = await response.json();
        setAvailableSlots(data.slots || []);
      } else {
        setAvailableSlots([]);
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
      setError(t('appointments.errorLoadingSlots'));
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Combine date and time
      const [hours, minutes] = selectedTime.split(':');
      const appointmentDate = new Date(selectedDate);
      appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const response = await fetch(`${API_URL}/api/appointments/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: formData.name,
          client_email: formData.email,
          client_phone: formData.phone,
          client_language: language,
          appointment_type: appointmentType,
          appointment_date: appointmentDate.toISOString(),
          duration: APPOINTMENT_TYPES[appointmentType]?.duration || 60,
          notes: formData.notes
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setBookingResult(data);
        setBookingComplete(true);
        setStep(4);
      } else {
        setError(data.error || t('appointments.bookingFailed'));
      }
    } catch (err) {
      console.error('Booking error:', err);
      setError(t('appointments.bookingFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  // Calendar rendering helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];

    // Previous month padding
    for (let i = 0; i < startingDay; i++) {
      days.push({ date: null, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const dayDate = new Date(year, month, i);
      const dateStr = dayDate.toISOString().split('T')[0];
      const isAvailable = availableDates.includes(dateStr);
      const isPast = dayDate < new Date().setHours(0, 0, 0, 0);

      days.push({
        date: dayDate,
        day: i,
        isCurrentMonth: true,
        isAvailable: isAvailable && !isPast,
        isPast
      });
    }

    return days;
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString(language === 'es' ? 'es-US' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Render appointment type selection (Step 1)
  const renderTypeSelection = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800 text-center">
        {t('appointments.selectType')}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(APPOINTMENT_TYPES).map(([type, config]) => (
          <button
            key={type}
            onClick={() => {
              setAppointmentType(type);
              setStep(2);
            }}
            className={`p-6 rounded-xl border-2 transition-all duration-200 text-left hover:shadow-lg
              ${appointmentType === type
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300 bg-white'
              }`}
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">{config.icon}</span>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900">
                  {t(`appointments.type.${type}`)}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {t(`appointments.typeDesc.${type}`)}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {config.duration} {t('appointments.minutes')}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  // Render date/time selection (Step 2)
  const renderDateTimeSelection = () => {
    const days = getDaysInMonth(currentMonth);
    const weekDays = language === 'es'
      ? ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="space-y-6">
        <button
          onClick={() => { setStep(1); setSelectedDate(null); setSelectedTime(null); }}
          className="flex items-center text-blue-600 hover:text-blue-700"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          {t('appointments.back')}
        </button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Calendar */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h3 className="font-semibold text-lg">
                {currentMonth.toLocaleDateString(language === 'es' ? 'es-US' : 'en-US', {
                  month: 'long',
                  year: 'numeric'
                })}
              </h3>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {weekDays.map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
              {days.map((day, index) => (
                <button
                  key={index}
                  disabled={!day.isCurrentMonth || !day.isAvailable}
                  onClick={() => day.isAvailable && setSelectedDate(day.date)}
                  className={`
                    aspect-square flex items-center justify-center text-sm rounded-lg transition-all
                    ${!day.isCurrentMonth ? 'text-gray-300' : ''}
                    ${day.isPast ? 'text-gray-300 cursor-not-allowed' : ''}
                    ${day.isAvailable && !day.isPast
                      ? 'hover:bg-blue-50 cursor-pointer font-medium text-gray-800'
                      : 'cursor-not-allowed'
                    }
                    ${selectedDate && day.date &&
                      selectedDate.toDateString() === day.date.toDateString()
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : ''
                    }
                  `}
                >
                  {day.day}
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-600 rounded"></div>
                {t('appointments.selected')}
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 border border-gray-300 rounded"></div>
                {t('appointments.available')}
              </div>
            </div>
          </div>

          {/* Time slots */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-lg mb-4">
              {selectedDate
                ? formatDate(selectedDate)
                : t('appointments.selectDateFirst')
              }
            </h3>

            {!selectedDate ? (
              <div className="text-center text-gray-500 py-12">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>{t('appointments.pleaseSelectDate')}</p>
              </div>
            ) : loading ? (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-3 text-gray-500">{t('appointments.loadingSlots')}</p>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>{t('appointments.noSlotsAvailable')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {availableSlots.map(slot => (
                  <button
                    key={slot}
                    onClick={() => setSelectedTime(slot)}
                    className={`
                      py-2 px-3 rounded-lg text-sm font-medium transition-all
                      ${selectedTime === slot
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                      }
                    `}
                  >
                    {formatTime(slot)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedDate && selectedTime && (
          <div className="flex justify-end">
            <button
              onClick={() => setStep(3)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {t('appointments.continue')}
            </button>
          </div>
        )}
      </div>
    );
  };

  // Render contact info form (Step 3)
  const renderContactForm = () => (
    <div className="space-y-6">
      <button
        onClick={() => setStep(2)}
        className="flex items-center text-blue-600 hover:text-blue-700"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
        {t('appointments.back')}
      </button>

      {/* Appointment Summary */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <h3 className="font-semibold text-blue-900 mb-2">{t('appointments.summary')}</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-blue-700">{t('appointments.type')}:</span>
            <span className="ml-2 font-medium text-blue-900">
              {APPOINTMENT_TYPES[appointmentType]?.icon} {t(`appointments.type.${appointmentType}`)}
            </span>
          </div>
          <div>
            <span className="text-blue-700">{t('appointments.duration')}:</span>
            <span className="ml-2 font-medium text-blue-900">
              {APPOINTMENT_TYPES[appointmentType]?.duration} {t('appointments.minutes')}
            </span>
          </div>
          <div className="col-span-2">
            <span className="text-blue-700">{t('appointments.dateTime')}:</span>
            <span className="ml-2 font-medium text-blue-900">
              {formatDate(selectedDate)} - {formatTime(selectedTime)}
            </span>
          </div>
        </div>
      </div>

      {/* Contact Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">
          {t('appointments.yourInfo')}
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('appointments.name')} *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={t('appointments.namePlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('appointments.email')} *
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={t('appointments.emailPlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('appointments.phone')} *
          </label>
          <input
            type="tel"
            required
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={t('appointments.phonePlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('appointments.notes')}
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={t('appointments.notesPlaceholder')}
          />
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className={`w-full py-4 rounded-lg font-semibold text-white transition-colors
            ${submitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
            }`}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
              {t('appointments.booking')}
            </span>
          ) : (
            t('appointments.confirmBooking')
          )}
        </button>
      </form>
    </div>
  );

  // Render confirmation (Step 4)
  const renderConfirmation = () => (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-gray-900">
        {t('appointments.confirmed')}
      </h2>

      <p className="text-gray-600 max-w-md mx-auto">
        {t('appointments.confirmationMessage')}
      </p>

      <div className="bg-gray-50 rounded-xl p-6 max-w-md mx-auto text-left">
        <h3 className="font-semibold text-gray-900 mb-4">{t('appointments.details')}</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">{t('appointments.type')}:</span>
            <span className="font-medium">{t(`appointments.type.${appointmentType}`)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">{t('appointments.date')}:</span>
            <span className="font-medium">{formatDate(selectedDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">{t('appointments.time')}:</span>
            <span className="font-medium">{formatTime(selectedTime)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">{t('appointments.duration')}:</span>
            <span className="font-medium">
              {APPOINTMENT_TYPES[appointmentType]?.duration} {t('appointments.minutes')}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-gray-500">
          {t('appointments.emailSent')}
        </p>

        <button
          onClick={() => window.location.href = '/'}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          {t('appointments.backToHome')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50"style={{background:'rgba(110, 110, 110, 1)'}}>
      <Navigation />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {t('appointments.title')}
            </h1>
            <p className="text-gray-600 md:text-lg">
              {t('appointments.subtitle')}
            </p>
          </div>

          {/* Progress indicator */}
          {!bookingComplete && (
            <div className="flex items-center justify-center mb-8">
              {[1, 2, 3].map((s) => (
                <React.Fragment key={s}>
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${step >= s
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                    }
                  `}>
                    {s}
                  </div>
                  {s < 3 && (
                    <div className={`w-16 h-1 mx-2 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Main content card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
            {step === 1 && renderTypeSelection()}
            {step === 2 && renderDateTimeSelection()}
            {step === 3 && renderContactForm()}
            {step === 4 && renderConfirmation()}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default AppointmentBooking;
