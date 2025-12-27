// Schedule Manager Component
// Admin interface for managing appointments, employee availability, and blocked times

import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const DEFAULT_API_URL = process.env.REACT_APP_API_URL || 'https://api.gudinocustom.com';

// Status badge component
const StatusBadge = ({ status }) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
    no_show: 'bg-gray-100 text-gray-800',
    needs_reschedule: 'bg-orange-100 text-orange-800'
  };

  const labels = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No Show',
    needs_reschedule: 'Needs Reschedule'
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.pending}`}>
      {labels[status] || status}
    </span>
  );
};

function ScheduleManager({ token, API_BASE }) {
  const { t, language } = useLanguage();
  const apiUrl = API_BASE || DEFAULT_API_URL;

  // State
  const [activeSubTab, setActiveSubTab] = useState('appointments');
  const [appointments, setAppointments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [blockedTimes, setBlockedTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('upcoming');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rescheduleMessage, setRescheduleMessage] = useState('');

  // Availability form state
  const [newSchedule, setNewSchedule] = useState({
    day_of_week: 1, // Monday
    start_time: '09:00',
    end_time: '17:00'
  });

  // Blocked time form state
  const [blockedTimeForm, setBlockedTimeForm] = useState({
    employee_id: '',
    start_date: '',
    start_time: '09:00',
    end_date: '',
    end_time: '17:00',
    reason: ''
  });

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch appointments
      const appointmentsRes = await fetch(
        `${apiUrl}/api/admin/appointments?status=${statusFilter}&filter=${dateFilter}`,
        { headers }
      );
      if (appointmentsRes.ok) {
        const data = await appointmentsRes.json();
        setAppointments(data.appointments || []);
      }

      // Fetch employees (for availability management)
      const employeesRes = await fetch(`${apiUrl}/api/employees`, { headers });
      if (employeesRes.ok) {
        const data = await employeesRes.json();
        setEmployees(data || []);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load schedule data');
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter, dateFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch availability for a specific employee
  const fetchAvailability = async (employeeId) => {
    try {
      const res = await fetch(
        `${apiUrl}/api/admin/employees/${employeeId}/availability`,
        { headers: { 'Authorization': `Bearer ${token}` }}
      );
      if (res.ok) {
        const data = await res.json();
        setAvailability(data.availability || []);
      }
    } catch (err) {
      console.error('Error fetching availability:', err);
    }
  };

  // Create new availability slot
  const createAvailability = async (employeeId) => {
    setActionLoading(true);
    try {
      const res = await fetch(
        `${apiUrl}/api/admin/employee-availability`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            employee_id: employeeId,
            day_of_week: parseInt(newSchedule.day_of_week),
            start_time: newSchedule.start_time,
            end_time: newSchedule.end_time
          })
        }
      );

      if (res.ok) {
        // Refresh availability list
        await fetchAvailability(employeeId);
        // Reset form
        setNewSchedule({ day_of_week: 1, start_time: '09:00', end_time: '17:00' });
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create schedule');
      }
    } catch (err) {
      console.error('Error creating availability:', err);
      setError('Failed to create schedule');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete availability slot
  const deleteAvailability = async (availabilityId, employeeId) => {
    if (!window.confirm(language === 'es' ? '¿Eliminar este horario?' : 'Delete this schedule?')) return;

    try {
      const res = await fetch(
        `${apiUrl}/api/admin/employee-availability/${availabilityId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (res.ok) {
        await fetchAvailability(employeeId);
      } else {
        setError('Failed to delete schedule');
      }
    } catch (err) {
      console.error('Error deleting availability:', err);
      setError('Failed to delete schedule');
    }
  };

  // Fetch blocked times
  const fetchBlockedTimes = async () => {
    try {
      const res = await fetch(
        `${apiUrl}/api/admin/blocked-times`,
        { headers: { 'Authorization': `Bearer ${token}` }}
      );
      if (res.ok) {
        const data = await res.json();
        setBlockedTimes(data.blockedTimes || []);
      }
    } catch (err) {
      console.error('Error fetching blocked times:', err);
    }
  };

  // Update appointment status
  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    setActionLoading(true);
    try {
      const res = await fetch(
        `${apiUrl}/api/admin/appointments/${appointmentId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: newStatus })
        }
      );

      if (res.ok) {
        fetchData();
        setShowModal(false);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update status');
      }
    } catch (err) {
      setError('Failed to update appointment status');
    } finally {
      setActionLoading(false);
    }
  };

  // Assign employee to appointment
  const assignEmployee = async (appointmentId, employeeId) => {
    setActionLoading(true);
    try {
      const res = await fetch(
        `${apiUrl}/api/admin/appointments/${appointmentId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ assigned_employee_id: employeeId || null })
        }
      );

      if (res.ok) {
        const data = await res.json();
        // Update the selected item with new assignment
        if (data.appointment) {
          setSelectedItem(data.appointment);
        }
        fetchData();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to assign employee');
      }
    } catch (err) {
      setError('Failed to assign employee');
    } finally {
      setActionLoading(false);
    }
  };

  // Request client to reschedule
  const requestReschedule = async (appointmentId) => {
    setActionLoading(true);
    try {
      const res = await fetch(
        `${apiUrl}/api/admin/appointments/${appointmentId}/request-reschedule`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message: rescheduleMessage })
        }
      );

      if (res.ok) {
        fetchData();
        setShowModal(false);
        setRescheduleMessage('');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to request reschedule');
      }
    } catch (err) {
      setError('Failed to request reschedule');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete appointment
  const deleteAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) return;

    try {
      const res = await fetch(
        `${apiUrl}/api/admin/appointments/${appointmentId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (res.ok) {
        fetchData();
      } else {
        setError('Failed to delete appointment');
      }
    } catch (err) {
      setError('Failed to delete appointment');
    }
  };

  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'es' ? 'es-US' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString(language === 'es' ? 'es-US' : 'en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Appointment type labels
  const typeLabels = {
    consultation: language === 'es' ? 'Consulta' : 'Consultation',
    measurement: language === 'es' ? 'Medición' : 'Measurement',
    estimate: language === 'es' ? 'Estimación' : 'Estimate',
    followup: language === 'es' ? 'Seguimiento' : 'Follow-up'
  };

  // Render appointments list
  const renderAppointments = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="upcoming">Upcoming</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="past">Past</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      {/* Appointments table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-3 text-gray-500">Loading appointments...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p>No appointments found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Date & Time</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Client</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Assigned To</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((apt) => (
                <tr key={apt.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{formatDate(apt.appointment_date)}</div>
                    <div className="text-sm text-gray-500">{formatTime(apt.appointment_date)}</div>
                    <div className="text-xs text-gray-400">{apt.duration} min</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{apt.client_name}</div>
                    <div className="text-sm text-gray-500">{apt.client_email}</div>
                    <div className="text-sm text-gray-500">{apt.client_phone}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-700">{typeLabels[apt.appointment_type] || apt.appointment_type}</span>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={apt.status} />
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {apt.assigned_employee_name || (language === 'es' ? 'Sin asignar' : 'Unassigned')}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end gap-2">
                      {apt.status === 'pending' && (
                        <button
                          onClick={() => updateAppointmentStatus(apt.id, 'confirmed')}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Confirm"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      )}
                      {apt.status === 'confirmed' && (
                        <button
                          onClick={() => updateAppointmentStatus(apt.id, 'completed')}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Mark Complete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedItem(apt);
                          setModalType('view');
                          setShowModal(true);
                        }}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                        <button
                          onClick={() => updateAppointmentStatus(apt.id, 'cancelled')}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Cancel"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // Render availability management
  const renderAvailability = () => {
    const dayNames = language === 'es'
      ? ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
      : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return (
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <p className="text-sm text-blue-800">
            {language === 'es'
              ? 'Configure los horarios de disponibilidad para cada empleado. Estos horarios se utilizarán para el sistema de reserva de citas.'
              : 'Configure availability schedules for each employee. These schedules will be used for the appointment booking system.'}
          </p>
        </div>

        {employees.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p>No employees found. Add employees first.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {employees.map((emp) => (
              <div key={emp.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium">{emp.name?.charAt(0)?.toUpperCase()}</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{emp.name}</h3>
                      <p className="text-sm text-gray-500">{emp.role || 'Employee'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedItem(emp);
                      fetchAvailability(emp.id);
                      setModalType('availability');
                      setShowModal(true);
                    }}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {language === 'es' ? 'Gestionar Horario' : 'Manage Schedule'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render blocked times management
  const renderBlockedTimes = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg flex-1">
          <p className="text-sm text-yellow-800">
            {language === 'es'
              ? 'Bloquee horarios para vacaciones, reuniones u otros eventos. Los clientes no podrán reservar durante estos períodos.'
              : 'Block times for vacations, meetings, or other events. Customers will not be able to book during these periods.'}
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedItem(null);
            setModalType('blockTime');
            setShowModal(true);
          }}
          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          {language === 'es' ? 'Agregar Bloqueo' : 'Add Block'}
        </button>
      </div>

      {blockedTimes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p>{language === 'es' ? 'No hay horarios bloqueados' : 'No blocked times'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {blockedTimes.map((block) => {
            const startDt = new Date(block.start_datetime);
            const endDt = new Date(block.end_datetime);
            const sameDay = startDt.toDateString() === endDt.toDateString();

            const formatDateTime = (dt) => {
              return dt.toLocaleString(language === 'es' ? 'es-US' : 'en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              });
            };

            const formatTimeOnly = (dt) => {
              return dt.toLocaleTimeString(language === 'es' ? 'es-US' : 'en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              });
            };

            return (
              <div key={block.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{block.reason}</div>
                  <div className="text-sm text-gray-500">
                    {sameDay ? (
                      <>
                        {formatDate(block.start_datetime)} • {formatTimeOnly(startDt)} - {formatTimeOnly(endDt)}
                      </>
                    ) : (
                      <>
                        {formatDateTime(startDt)} - {formatDateTime(endDt)}
                      </>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {block.employee_name || (language === 'es' ? 'Todos los empleados' : 'All Employees')}
                  </div>
                </div>
                <button
                  onClick={() => deleteBlockedTime(block.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // Delete blocked time
  const deleteBlockedTime = async (blockId) => {
    if (!window.confirm('Are you sure you want to remove this block?')) return;

    try {
      const res = await fetch(
        `${apiUrl}/api/admin/blocked-times/${blockId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (res.ok) {
        fetchBlockedTimes();
      }
    } catch (err) {
      setError('Failed to delete blocked time');
    }
  };

  // Create blocked time
  const createBlockedTime = async () => {
    if (!blockedTimeForm.employee_id || !blockedTimeForm.start_date || !blockedTimeForm.end_date || !blockedTimeForm.reason) {
      setError(language === 'es' ? 'Por favor complete todos los campos requeridos' : 'Please fill in all required fields');
      return;
    }

    setActionLoading(true);
    try {
      const startDatetime = `${blockedTimeForm.start_date}T${blockedTimeForm.start_time}:00`;
      const endDatetime = `${blockedTimeForm.end_date}T${blockedTimeForm.end_time}:00`;

      const res = await fetch(
        `${apiUrl}/api/admin/blocked-times`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            employee_id: parseInt(blockedTimeForm.employee_id),
            start_datetime: startDatetime,
            end_datetime: endDatetime,
            reason: blockedTimeForm.reason
          })
        }
      );

      if (res.ok) {
        fetchBlockedTimes();
        setShowModal(false);
        setBlockedTimeForm({
          employee_id: '',
          start_date: '',
          start_time: '09:00',
          end_date: '',
          end_time: '17:00',
          reason: ''
        });
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create blocked time');
      }
    } catch (err) {
      console.error('Error creating blocked time:', err);
      setError('Failed to create blocked time');
    } finally {
      setActionLoading(false);
    }
  };

  // View appointment modal
  const renderViewModal = () => {
    if (!selectedItem) return null;
    const apt = selectedItem;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="bg-white rounded-xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Appointment Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <StatusBadge status={apt.status} />
              <span className="text-gray-500">#{apt.id}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Date & Time</label>
                <p className="font-medium">{formatDate(apt.appointment_date)}</p>
                <p className="text-gray-600">{formatTime(apt.appointment_date)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Duration</label>
                <p className="font-medium">{apt.duration} minutes</p>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-500">Type</label>
              <p className="font-medium">{typeLabels[apt.appointment_type]}</p>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Client Information</h3>
              <div className="space-y-1">
                <p><span className="text-gray-500">Name:</span> {apt.client_name}</p>
                <p><span className="text-gray-500">Email:</span> {apt.client_email}</p>
                <p><span className="text-gray-500">Phone:</span> {apt.client_phone}</p>
                {apt.location_address && (
                  <p><span className="text-gray-500">Address:</span> {apt.location_address}</p>
                )}
              </div>
            </div>

            {apt.notes && (
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Notes</h3>
                <p className="text-gray-600">{apt.notes}</p>
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">{language === 'es' ? 'Asignación' : 'Assignment'}</h3>
              <div className="flex items-center gap-3">
                <select
                  value={apt.assigned_employee_id || ''}
                  onChange={(e) => assignEmployee(apt.id, e.target.value ? parseInt(e.target.value) : null)}
                  disabled={actionLoading}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="">{language === 'es' ? 'Sin asignar' : 'Unassigned'}</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
                {actionLoading && (
                  <span className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></span>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex flex-wrap justify-end gap-3">
            {apt.status === 'pending' && (
              <>
                <button
                  onClick={() => updateAppointmentStatus(apt.id, 'confirmed')}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Loading...' : 'Confirm Appointment'}
                </button>
                <button
                  onClick={() => {
                    setModalType('reschedule');
                  }}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Request Different Time
                </button>
              </>
            )}
            {apt.status === 'confirmed' && (
              <button
                onClick={() => updateAppointmentStatus(apt.id, 'completed')}
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading ? 'Loading...' : 'Mark as Completed'}
              </button>
            )}
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Reschedule request modal
  const renderRescheduleModal = () => {
    if (!selectedItem) return null;
    const apt = selectedItem;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {language === 'es' ? 'Solicitar Reprogramación' : 'Request Reschedule'}
            </h2>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-gray-600">
              {language === 'es'
                ? `Se enviará un correo electrónico a ${apt.client_name} solicitando que elija un nuevo horario.`
                : `An email will be sent to ${apt.client_name} asking them to choose a new time.`}
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'es' ? 'Mensaje (opcional)' : 'Message (optional)'}
              </label>
              <textarea
                value={rescheduleMessage}
                onChange={(e) => setRescheduleMessage(e.target.value)}
                rows={3}
                placeholder={language === 'es'
                  ? 'Explique por qué necesita reprogramar...'
                  : 'Explain why you need to reschedule...'}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
            <button
              onClick={() => {
                setModalType('view');
                setRescheduleMessage('');
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              {language === 'es' ? 'Cancelar' : 'Cancel'}
            </button>
            <button
              onClick={() => requestReschedule(apt.id)}
              disabled={actionLoading}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              {actionLoading
                ? (language === 'es' ? 'Enviando...' : 'Sending...')
                : (language === 'es' ? 'Enviar Solicitud' : 'Send Request')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {language === 'es' ? 'Gestión de Citas' : 'Schedule Management'}
          </h1>
          <p className="text-gray-500">
            {language === 'es'
              ? 'Administre citas, disponibilidad y horarios bloqueados'
              : 'Manage appointments, availability, and blocked times'}
          </p>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-500 hover:text-red-700">×</button>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {[
            { id: 'appointments', label: language === 'es' ? 'Citas' : 'Appointments', icon: '📅' },
            { id: 'availability', label: language === 'es' ? 'Disponibilidad' : 'Availability', icon: '⏰' },
            { id: 'blocked', label: language === 'es' ? 'Tiempos Bloqueados' : 'Blocked Times', icon: '🚫' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id);
                if (tab.id === 'blocked') fetchBlockedTimes();
              }}
              className={`pb-3 px-1 font-medium text-sm transition-colors flex items-center gap-2
                ${activeSubTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {activeSubTab === 'appointments' && renderAppointments()}
        {activeSubTab === 'availability' && renderAvailability()}
        {activeSubTab === 'blocked' && renderBlockedTimes()}
      </div>

      {/* Modal */}
      {showModal && modalType === 'view' && renderViewModal()}
      {showModal && modalType === 'reschedule' && renderRescheduleModal()}
      {showModal && modalType === 'blockTime' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {language === 'es' ? 'Bloquear Horario' : 'Block Time'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'es' ? 'Empleado' : 'Employee'} *
                </label>
                <select
                  value={blockedTimeForm.employee_id}
                  onChange={(e) => setBlockedTimeForm({ ...blockedTimeForm, employee_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{language === 'es' ? 'Seleccionar empleado...' : 'Select employee...'}</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'es' ? 'Fecha Inicio' : 'Start Date'} *
                  </label>
                  <input
                    type="date"
                    value={blockedTimeForm.start_date}
                    onChange={(e) => setBlockedTimeForm({ ...blockedTimeForm, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'es' ? 'Hora Inicio' : 'Start Time'}
                  </label>
                  <input
                    type="time"
                    value={blockedTimeForm.start_time}
                    onChange={(e) => setBlockedTimeForm({ ...blockedTimeForm, start_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'es' ? 'Fecha Fin' : 'End Date'} *
                  </label>
                  <input
                    type="date"
                    value={blockedTimeForm.end_date}
                    onChange={(e) => setBlockedTimeForm({ ...blockedTimeForm, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'es' ? 'Hora Fin' : 'End Time'}
                  </label>
                  <input
                    type="time"
                    value={blockedTimeForm.end_time}
                    onChange={(e) => setBlockedTimeForm({ ...blockedTimeForm, end_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'es' ? 'Razón' : 'Reason'} *
                </label>
                <input
                  type="text"
                  value={blockedTimeForm.reason}
                  onChange={(e) => setBlockedTimeForm({ ...blockedTimeForm, reason: e.target.value })}
                  placeholder={language === 'es' ? 'Ej: Vacaciones, Reunión, etc.' : 'E.g., Vacation, Meeting, etc.'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setBlockedTimeForm({
                    employee_id: '',
                    start_date: '',
                    start_time: '09:00',
                    end_date: '',
                    end_time: '17:00',
                    reason: ''
                  });
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                onClick={createBlockedTime}
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading
                  ? (language === 'es' ? 'Guardando...' : 'Saving...')
                  : (language === 'es' ? 'Guardar Bloqueo' : 'Save Block')}
              </button>
            </div>
          </div>
        </div>
      )}
      {showModal && modalType === 'availability' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {language === 'es' ? 'Gestionar Disponibilidad' : 'Manage Availability'} - {selectedItem?.name}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {/* Add New Schedule Form */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-medium text-gray-900 mb-3">
                  {language === 'es' ? 'Agregar Horario' : 'Add Schedule'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      {language === 'es' ? 'Día' : 'Day'}
                    </label>
                    <select
                      value={newSchedule.day_of_week}
                      onChange={(e) => setNewSchedule({ ...newSchedule, day_of_week: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {(language === 'es'
                        ? ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
                        : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                      ).map((day, index) => (
                        <option key={index} value={index}>{day}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      {language === 'es' ? 'Hora Inicio' : 'Start Time'}
                    </label>
                    <input
                      type="time"
                      value={newSchedule.start_time}
                      onChange={(e) => setNewSchedule({ ...newSchedule, start_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      {language === 'es' ? 'Hora Fin' : 'End Time'}
                    </label>
                    <input
                      type="time"
                      value={newSchedule.end_time}
                      onChange={(e) => setNewSchedule({ ...newSchedule, end_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => createAvailability(selectedItem.id)}
                      disabled={actionLoading}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                      {actionLoading ? (
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                      )}
                      {language === 'es' ? 'Agregar' : 'Add'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Current Schedules */}
              <h3 className="font-medium text-gray-900 mb-3">
                {language === 'es' ? 'Horarios Actuales' : 'Current Schedules'}
              </h3>

              {availability.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>{language === 'es' ? 'No hay horarios configurados' : 'No schedule configured'}</p>
                  <p className="text-sm mt-2">
                    {language === 'es'
                      ? 'Use el formulario de arriba para agregar horarios.'
                      : 'Use the form above to add schedules.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                  {availability.map((slot) => {
                    const dayNames = language === 'es'
                      ? ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
                      : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    return (
                      <div key={slot.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 text-sm font-medium">
                              {dayNames[slot.day_of_week]?.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">{dayNames[slot.day_of_week]}</span>
                            <span className="text-gray-500 ml-2">
                              {slot.start_time} - {slot.end_time}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${slot.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {slot.is_available
                              ? (language === 'es' ? 'Disponible' : 'Available')
                              : (language === 'es' ? 'No disponible' : 'Unavailable')}
                          </span>
                          <button
                            onClick={() => deleteAvailability(slot.id, selectedItem.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title={language === 'es' ? 'Eliminar' : 'Delete'}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  {language === 'es'
                    ? 'Los clientes solo podrán reservar citas durante los horarios configurados aquí.'
                    : 'Customers can only book appointments during the times configured here.'}
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end flex-shrink-0 bg-white">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                {language === 'es' ? 'Cerrar' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScheduleManager;
