// Appointment Booking Routes
// Handles appointment creation, management, and employee availability

const express = require('express');
const router = express.Router();
const { appointmentDb } = require('../db-helpers');
const { authenticateUser, requireRole } = require('../middleware/auth');
const { handleError } = require('../utils/error-handler');
const {
  emailTransporter,
  generateAppointmentConfirmationEmail,
  generateAppointmentReminderEmail,
  generateAppointmentCancellationEmail,
} = require('../utils/email');
const { sendSmsWithRouting } = require('../utils/sms');
const crypto = require('crypto');

// PUBLIC ROUTES - Customer Appointment Booking

// Get available time slots for a specific date and appointment type
router.get('/api/appointments/available-slots', async (req, res) => {
  try {
    const { date, appointmentType, duration } = req.query;

    if (!date || !appointmentType) {
      return res.status(400).json({ error: 'Date and appointment type are required' });
    }

    const durationMinutes = parseInt(duration) || 60;

    // Get all employee availability for the day of week
    const dayOfWeek = new Date(date).getDay();
    const availability = await appointmentDb.getEmployeeAvailabilityByDay(dayOfWeek);

    if (!availability || availability.length === 0) {
      return res.json({ availableSlots: [] });
    }

    // Get existing appointments for this date
    const existingAppointments = await appointmentDb.getAppointmentsByDate(date);

    // Get blocked times for this date
    const blockedTimes = await appointmentDb.getBlockedTimesByDate(date);

    // Generate available time slots
    const availableSlots = generateTimeSlots(
      availability,
      existingAppointments,
      blockedTimes,
      date,
      durationMinutes
    );

    res.json({ availableSlots });
  } catch (error) {
    handleError(error, 'Failed to fetch available slots', res, 500);
  }
});

// Book an appointment (public endpoint)
router.post('/api/appointments/book', async (req, res) => {
  try {
    const {
      client_name,
      client_email,
      client_phone,
      client_language,
      appointment_type,
      appointment_date,
      duration,
      location_address,
      notes,
    } = req.body;

    // Validate required fields
    if (!client_name || !client_email || !client_phone || !appointment_type || !appointment_date) {
      return res.status(400).json({
        error: 'Missing required fields: client_name, client_email, client_phone, appointment_type, and appointment_date are required',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(client_email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate appointment type
    const validTypes = ['consultation', 'measurement', 'estimate', 'followup'];
    if (!validTypes.includes(appointment_type)) {
      return res.status(400).json({
        error: 'Invalid appointment_type. Must be one of: consultation, measurement, estimate, followup',
      });
    }

    // Generate cancellation token for this appointment
    const cancellationToken = crypto.randomBytes(32).toString('hex');

    // Find an available employee for this appointment
    const assignedEmployee = await appointmentDb.findAvailableEmployee(appointment_date, duration || 60);

    // Create appointment
    const appointmentId = await appointmentDb.createAppointment({
      client_name,
      client_email,
      client_phone,
      client_language: client_language || 'en',
      appointment_type,
      appointment_date,
      duration: duration || 60,
      status: 'pending',
      location_address: location_address || null,
      notes: notes || null,
      assigned_employee_id: assignedEmployee ? assignedEmployee.id : null,
      cancellation_token: cancellationToken,
    });

    const appointment = await appointmentDb.getAppointmentById(appointmentId);

    // Send confirmation email to client
    try {
      const confirmationEmailOptions = generateAppointmentConfirmationEmail({
        clientName: client_name,
        clientEmail: client_email,
        appointmentType: appointment_type,
        appointmentDate: appointment_date,
        duration: duration || 60,
        language: client_language || 'en',
        cancellationToken,
      });
      await emailTransporter.sendMail(confirmationEmailOptions);
      console.log(`✉️  Appointment confirmation email sent to ${client_email}`);
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    // Send SMS notification to admin
    try {
      const appointmentTypeLabels = {
        consultation: 'Consultation',
        measurement: 'Measurement',
        estimate: 'Estimate',
        followup: 'Follow-up',
      };
      const formattedDate = new Date(appointment_date).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
      const smsMessage = `New Appointment Booked!\n\nClient: ${client_name}\nType: ${appointmentTypeLabels[appointment_type]}\nDate: ${formattedDate}\nPhone: ${client_phone}\n\nView details in admin panel: https://gudinocustom.com/admin`;

      await sendSmsWithRouting('appointment_booking', smsMessage);
      console.log(`📱 SMS notification sent to admin`);
    } catch (smsError) {
      console.error('Failed to send SMS notification:', smsError);
    }

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      appointmentId,
      appointment,
      cancellationUrl: `https://gudinocustom.com/appointment/cancel/${cancellationToken}`,
    });
  } catch (error) {
    handleError(error, 'Failed to book appointment', res, 500);
  }
});

// Cancel appointment (public endpoint with token)
router.post('/api/appointments/cancel/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { reason } = req.body;

    const appointment = await appointmentDb.getAppointmentByToken(token);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found or invalid cancellation link' });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({ error: 'Appointment is already cancelled' });
    }

    // Cancel the appointment
    await appointmentDb.cancelAppointment(appointment.id, reason || 'Client requested cancellation');

    // Send cancellation confirmation email
    try {
      const cancellationEmailOptions = generateAppointmentCancellationEmail({
        clientName: appointment.client_name,
        clientEmail: appointment.client_email,
        appointmentType: appointment.appointment_type,
        appointmentDate: appointment.appointment_date,
        language: appointment.client_language,
      });
      await emailTransporter.sendMail(cancellationEmailOptions);
      console.log(`✉️  Appointment cancellation email sent to ${appointment.client_email}`);
    } catch (emailError) {
      console.error('Failed to send cancellation email:', emailError);
    }

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
    });
  } catch (error) {
    handleError(error, 'Failed to cancel appointment', res, 500);
  }
});

// Get appointment details by token (for cancel/reschedule page)
router.get('/api/appointments/details/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const appointment = await appointmentDb.getAppointmentByToken(token);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Return limited appointment details (no sensitive info)
    res.json({
      id: appointment.id,
      client_name: appointment.client_name,
      appointment_type: appointment.appointment_type,
      appointment_date: appointment.appointment_date,
      duration: appointment.duration,
      status: appointment.status,
      location_address: appointment.location_address,
    });
  } catch (error) {
    handleError(error, 'Failed to fetch appointment details', res, 500);
  }
});

// ADMIN ROUTES - Appointment Management

// Get all appointments (admin only)
router.get('/api/admin/appointments', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;

    let appointments;
    if (startDate && endDate) {
      appointments = await appointmentDb.getAppointmentsByDateRange(startDate, endDate, status);
    } else {
      appointments = await appointmentDb.getAllAppointments(status);
    }

    res.json(appointments);
  } catch (error) {
    handleError(error, 'Failed to fetch appointments', res, 500);
  }
});

// Get appointment by ID (admin only)
router.get('/api/admin/appointments/:id', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await appointmentDb.getAppointmentById(parseInt(id));

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json(appointment);
  } catch (error) {
    handleError(error, 'Failed to fetch appointment', res, 500);
  }
});

// Update appointment status (admin only)
router.patch('/api/admin/appointments/:id/status', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await appointmentDb.updateAppointmentStatus(parseInt(id), status);
    const appointment = await appointmentDb.getAppointmentById(parseInt(id));

    res.json({ success: true, appointment });
  } catch (error) {
    handleError(error, 'Failed to update appointment status', res, 500);
  }
});

// Update appointment (admin only)
router.patch('/api/admin/appointments/:id', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    await appointmentDb.updateAppointment(parseInt(id), updates);
    const appointment = await appointmentDb.getAppointmentById(parseInt(id));

    res.json({ success: true, appointment });
  } catch (error) {
    handleError(error, 'Failed to update appointment', res, 500);
  }
});

// Delete appointment (admin only)
router.delete('/api/admin/appointments/:id', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;

    await appointmentDb.deleteAppointment(parseInt(id));

    res.json({ success: true, message: 'Appointment deleted successfully' });
  } catch (error) {
    handleError(error, 'Failed to delete appointment', res, 500);
  }
});

// EMPLOYEE AVAILABILITY ROUTES (admin only)

// Get all employee availability
router.get('/api/admin/employee-availability', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { employeeId } = req.query;

    let availability;
    if (employeeId) {
      availability = await appointmentDb.getEmployeeAvailability(parseInt(employeeId));
    } else {
      availability = await appointmentDb.getAllEmployeeAvailability();
    }

    res.json(availability);
  } catch (error) {
    handleError(error, 'Failed to fetch employee availability', res, 500);
  }
});

// Create employee availability
router.post('/api/admin/employee-availability', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { employee_id, day_of_week, start_time, end_time } = req.body;

    if (employee_id === undefined || day_of_week === undefined || !start_time || !end_time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const availabilityId = await appointmentDb.createEmployeeAvailability({
      employee_id,
      day_of_week,
      start_time,
      end_time,
      is_available: true,
    });

    const availability = await appointmentDb.getEmployeeAvailabilityById(availabilityId);

    res.status(201).json({ success: true, availability });
  } catch (error) {
    handleError(error, 'Failed to create employee availability', res, 500);
  }
});

// Update employee availability
router.patch('/api/admin/employee-availability/:id', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    await appointmentDb.updateEmployeeAvailability(parseInt(id), updates);
    const availability = await appointmentDb.getEmployeeAvailabilityById(parseInt(id));

    res.json({ success: true, availability });
  } catch (error) {
    handleError(error, 'Failed to update employee availability', res, 500);
  }
});

// Delete employee availability
router.delete('/api/admin/employee-availability/:id', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;

    await appointmentDb.deleteEmployeeAvailability(parseInt(id));

    res.json({ success: true, message: 'Employee availability deleted successfully' });
  } catch (error) {
    handleError(error, 'Failed to delete employee availability', res, 500);
  }
});

// BLOCKED TIMES ROUTES (admin only)

// Get blocked times
router.get('/api/admin/blocked-times', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.query;

    let blockedTimes;
    if (startDate && endDate) {
      blockedTimes = await appointmentDb.getBlockedTimesByDateRange(startDate, endDate, employeeId);
    } else if (employeeId) {
      blockedTimes = await appointmentDb.getBlockedTimesByEmployee(parseInt(employeeId));
    } else {
      blockedTimes = await appointmentDb.getAllBlockedTimes();
    }

    res.json(blockedTimes);
  } catch (error) {
    handleError(error, 'Failed to fetch blocked times', res, 500);
  }
});

// Create blocked time
router.post('/api/admin/blocked-times', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { employee_id, start_datetime, end_datetime, reason, notes } = req.body;

    if (!employee_id || !start_datetime || !end_datetime || !reason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const blockedTimeId = await appointmentDb.createBlockedTime({
      employee_id,
      start_datetime,
      end_datetime,
      reason,
      notes: notes || null,
      created_by: req.user.id,
    });

    const blockedTime = await appointmentDb.getBlockedTimeById(blockedTimeId);

    res.status(201).json({ success: true, blockedTime });
  } catch (error) {
    handleError(error, 'Failed to create blocked time', res, 500);
  }
});

// Update blocked time
router.patch('/api/admin/blocked-times/:id', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    await appointmentDb.updateBlockedTime(parseInt(id), updates);
    const blockedTime = await appointmentDb.getBlockedTimeById(parseInt(id));

    res.json({ success: true, blockedTime });
  } catch (error) {
    handleError(error, 'Failed to update blocked time', res, 500);
  }
});

// Delete blocked time
router.delete('/api/admin/blocked-times/:id', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;

    await appointmentDb.deleteBlockedTime(parseInt(id));

    res.json({ success: true, message: 'Blocked time deleted successfully' });
  } catch (error) {
    handleError(error, 'Failed to delete blocked time', res, 500);
  }
});

// HELPER FUNCTIONS

// Generate available time slots based on employee availability, existing appointments, and blocked times
function generateTimeSlots(availability, existingAppointments, blockedTimes, date, durationMinutes) {
  const slots = [];
  const appointmentDate = new Date(date);

  // For each available employee
  availability.forEach((avail) => {
    const [startHour, startMinute] = avail.start_time.split(':').map(Number);
    const [endHour, endMinute] = avail.end_time.split(':').map(Number);

    let currentTime = new Date(appointmentDate);
    currentTime.setHours(startHour, startMinute, 0, 0);

    const endTime = new Date(appointmentDate);
    endTime.setHours(endHour, endMinute, 0, 0);

    // Generate slots in 30-minute intervals
    while (currentTime < endTime) {
      const slotEnd = new Date(currentTime.getTime() + durationMinutes * 60000);

      if (slotEnd <= endTime) {
        // Check if slot conflicts with existing appointments
        const hasConflict = existingAppointments.some((apt) => {
          const aptStart = new Date(apt.appointment_date);
          const aptEnd = new Date(aptStart.getTime() + apt.duration * 60000);
          return (
            apt.assigned_employee_id === avail.employee_id &&
            apt.status !== 'cancelled' &&
            ((currentTime >= aptStart && currentTime < aptEnd) || (slotEnd > aptStart && slotEnd <= aptEnd))
          );
        });

        // Check if slot conflicts with blocked times
        const isBlocked = blockedTimes.some((blocked) => {
          const blockedStart = new Date(blocked.start_datetime);
          const blockedEnd = new Date(blocked.end_datetime);
          return (
            blocked.employee_id === avail.employee_id &&
            ((currentTime >= blockedStart && currentTime < blockedEnd) || (slotEnd > blockedStart && slotEnd <= blockedEnd))
          );
        });

        if (!hasConflict && !isBlocked) {
          slots.push({
            time: currentTime.toISOString(),
            employeeId: avail.employee_id,
            employeeName: avail.employee_name,
            duration: durationMinutes,
          });
        }
      }

      // Move to next 30-minute slot
      currentTime = new Date(currentTime.getTime() + 30 * 60000);
    }
  });

  return slots;
}

module.exports = router;
