// Project Timeline Routes
// Handles project timeline creation, updates, and client viewing

const express = require('express');
const router = express.Router();
const { timelineDb } = require('../db-helpers');
const { authenticateUser, requireRole } = require('../middleware/auth');
const { handleError } = require('../utils/error-handler');
const { sendSmsWithRouting, sendSMS } = require('../utils/sms');

// ADMIN ROUTES - Timeline Management

// Get all timelines (admin only)
router.get('/admin/timelines', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const timelines = await timelineDb.getAllTimelines();
    res.json(timelines);
  } catch (error) {
    handleError(error, 'Failed to fetch timelines', res, 500);
  }
});

// Get timeline by timeline ID (admin only) - supports both invoice and standalone timelines
router.get('/admin/timeline/:id', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const timeline = await timelineDb.getTimelineById(parseInt(id));

    if (!timeline) {
      return res.status(404).json({ error: 'Timeline not found' });
    }

    res.json(timeline);
  } catch (error) {
    handleError(error, 'Failed to fetch timeline', res, 500);
  }
});

// Get timeline by invoice ID (admin only)
router.get('/admin/timeline/invoice/:invoiceId', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const timeline = await timelineDb.getTimelineByInvoiceId(parseInt(invoiceId));

    if (!timeline) {
      return res.status(404).json({ error: 'Timeline not found for this invoice' });
    }

    res.json(timeline);
  } catch (error) {
    handleError(error, 'Failed to fetch timeline', res, 500);
  }
});

// Create timeline for an invoice (admin only)
router.post('/admin/timeline', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { invoice_id, client_language } = req.body;

    if (!invoice_id) {
      return res.status(400).json({ error: 'Invoice ID is required' });
    }

    // Check if timeline already exists for this invoice
    const existing = await timelineDb.getTimelineByInvoiceId(invoice_id);
    if (existing) {
      return res.status(400).json({ error: 'Timeline already exists for this invoice' });
    }

    const timelineId = await timelineDb.createTimeline(invoice_id, client_language || 'en');
    const timeline = await timelineDb.getTimelineById(timelineId);

    res.json({ success: true, timeline });
  } catch (error) {
    handleError(error, 'Failed to create timeline', res, 500);
  }
});

// Create standalone timeline (without invoice) (admin only)
router.post('/admin/timeline/standalone', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { client_name, client_email, client_phone, client_language, send_email } = req.body;

    if (!client_name || !client_email) {
      return res.status(400).json({ error: 'Client name and email are required' });
    }

    const { timelineId, accessToken } = await timelineDb.createStandaloneTimeline(
      client_name,
      client_email,
      client_phone || null,
      client_language || 'en'
    );

    const timeline = await timelineDb.getTimelineById(timelineId);
    const timelineUrl = `https://gudinocustom.com/project/${accessToken}`;

    // Only send email if explicitly requested (send_email parameter)
    if (send_email !== false) {
      // Send email to client with timeline link
      try {
        const emailOptions = {
        from: process.env.EMAIL_FROM,
        to: client_email,
        subject: client_language === 'es'
          ? 'Seguimiento de su proyecto - Gudino Custom Woodworking'
          : 'Your Project Timeline - Gudino Custom Woodworking',
        html: client_language === 'es'
          ? `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #1e3a8a;">Hola ${client_name},</h1>
              <p>Hemos creado un portal de seguimiento de proyecto para usted. Puede ver el progreso de su proyecto en cualquier momento usando el siguiente enlace:</p>
              <p><a href="${timelineUrl}" style="background: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Ver Mi Proyecto</a></p>
              <p>Este enlace es privado y único para usted. Le notificaremos cuando haya actualizaciones.</p>
              <p>Saludos,<br>Gudino Custom Woodworking</p>
            </div>
          `
          : `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #1e3a8a;">Hi ${client_name},</h1>
              <p>We've created a project timeline portal for you. You can track the progress of your project anytime using the link below:</p>
              <p><a href="${timelineUrl}" style="background: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View My Project</a></p>
              <p>This link is private and unique to you. We'll notify you when there are updates.</p>
              <p>Best regards,<br>Gudino Custom Woodworking</p>
            </div>
          `
      };

        const { emailTransporter } = require('../utils/email');
        await emailTransporter.sendMail(emailOptions);
        console.log(`✉️  Timeline link sent to ${client_email}`);
      } catch (emailError) {
        console.error('Failed to send timeline email:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.json({ success: true, timeline, accessToken, timelineUrl });
  } catch (error) {
    handleError(error, 'Failed to create standalone timeline', res, 500);
  }
});

// Update timeline settings (admin only)
router.put('/admin/timeline/:id', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};

    if (req.body.client_language !== undefined) {
      updates.client_language = req.body.client_language;
    }

    await timelineDb.updateTimeline(parseInt(id), updates);
    const timeline = await timelineDb.getTimelineById(parseInt(id));

    res.json({ success: true, timeline });
  } catch (error) {
    handleError(error, 'Failed to update timeline', res, 500);
  }
});

// Add custom phase to timeline (admin only)
router.post('/admin/timeline/:timelineId/phase', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { timelineId } = req.params;
    const { phase_name_key, status, start_date, estimated_completion, notes, photos, sendNotification } = req.body;

    if (!phase_name_key) {
      return res.status(400).json({ error: 'Phase name key is required' });
    }

    const db = require('../db-helpers').getDb();
    const dbInstance = await db;

    // Get the highest phase_order for this timeline
    const maxOrder = await dbInstance.get(
      'SELECT MAX(phase_order) as max_order FROM timeline_phases WHERE timeline_id = ?',
      [parseInt(timelineId)]
    );
    const nextOrder = (maxOrder?.max_order || 0) + 1;

    // Insert the new phase
    const result = await dbInstance.run(
      `INSERT INTO timeline_phases
       (timeline_id, phase_name_key, status, start_date, estimated_completion, notes, photos, phase_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        parseInt(timelineId),
        phase_name_key,
        status || 'pending',
        start_date || null,
        estimated_completion || null,
        notes || null,
        photos ? JSON.stringify(photos) : null,
        nextOrder
      ]
    );

    const phaseId = result.lastID;

    // Get timeline info for notifications
    const timeline = await dbInstance.get('SELECT * FROM project_timelines WHERE id = ?', [parseInt(timelineId)]);

    await dbInstance.close();

    // Send notification if requested
    if (sendNotification && timeline) {
      try {
        let clientEmail = null;
        let clientName = null;
        let clientPhone = null;
        let language = timeline.client_language || 'en';

        // Get client info (from invoice or standalone)
        if (timeline.invoice_id) {
          const db2 = await require('../db-helpers').getDb();
          const invoice = await db2.get(
            `SELECT i.*, c.first_name, c.email, c.phone
             FROM invoices i
             JOIN clients c ON i.client_id = c.id
             WHERE i.id = ?`,
            [timeline.invoice_id]
          );
          await db2.close();

          if (invoice) {
            clientEmail = invoice.email;
            clientName = invoice.first_name;
            clientPhone = invoice.phone;
          }
        } else {
          // Standalone timeline
          clientEmail = timeline.client_email;
          clientName = timeline.client_name;
          clientPhone = timeline.client_phone;
        }

        // Send email notification
        if (clientEmail) {
          const phaseLabels = {
            en: {
              design: 'Design',
              materials: 'Materials Ordered',
              fabrication: 'Fabrication',
              installation: 'Installation',
              completion: 'Completion'
            },
            es: {
              design: 'Diseño',
              materials: 'Materiales Pedidos',
              fabrication: 'Fabricación',
              installation: 'Instalación',
              completion: 'Finalización'
            }
          };

          const phaseName = phaseLabels[language]?.[phase_name_key] || phase_name_key;

          const emailOptions = {
            from: process.env.EMAIL_FROM,
            to: clientEmail,
            subject: language === 'es'
              ? `Nueva fase agregada a su proyecto - ${phaseName}`
              : `New Phase Added to Your Project - ${phaseName}`,
            html: language === 'es'
              ? `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h1 style="color: #1e3a8a;">Hola ${clientName},</h1>
                  <p>Hemos agregado una nueva fase a su proyecto:</p>
                  <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h2 style="margin: 0 0 10px 0; color: #2563EB;">${phaseName}</h2>
                    ${notes ? `<p style="margin: 5px 0;">${notes}</p>` : ''}
                  </div>
                  <p>Puede ver el progreso completo de su proyecto en su portal de seguimiento.</p>
                  <p>Saludos,<br>Gudino Custom Woodworking</p>
                </div>
              `
              : `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h1 style="color: #1e3a8a;">Hi ${clientName},</h1>
                  <p>We've added a new phase to your project:</p>
                  <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h2 style="margin: 0 0 10px 0; color: #2563EB;">${phaseName}</h2>
                    ${notes ? `<p style="margin: 5px 0;">${notes}</p>` : ''}
                  </div>
                  <p>You can view the full progress of your project in your timeline portal.</p>
                  <p>Best regards,<br>Gudino Custom Woodworking</p>
                </div>
              `
          };

          const { emailTransporter } = require('../utils/email');
          await emailTransporter.sendMail(emailOptions);
          console.log(`✉️  New phase notification sent to ${clientEmail}`);
        }

        // Send SMS if phone number available
        if (clientPhone) {
          // Format phone number for Twilio (add US country code)
          let formattedPhone = clientPhone.replace(/\D/g, ''); // Remove non-digits
          if (formattedPhone.length === 10) {
            formattedPhone = `+1${formattedPhone}`; // Add US country code
          } else if (formattedPhone.length === 11 && formattedPhone.startsWith('1')) {
            formattedPhone = `+${formattedPhone}`;
          } else if (!formattedPhone.startsWith('+')) {
            formattedPhone = `+1${formattedPhone}`;
          }

          const phaseLabels = {
            en: {
              design: 'Design',
              materials: 'Materials Ordered',
              fabrication: 'Fabrication',
              installation: 'Installation',
              completion: 'Completion'
            },
            es: {
              design: 'Diseño',
              materials: 'Materiales Pedidos',
              fabrication: 'Fabricación',
              installation: 'Instalación',
              completion: 'Finalización'
            }
          };

          const phaseName = phaseLabels[language]?.[phase_name_key] || phase_name_key;
          const message = language === 'es'
            ? `Hola ${clientName}, nueva fase agregada a su proyecto: ${phaseName}. Vea más detalles en su portal de seguimiento.`
            : `Hi ${clientName}, new phase added to your project: ${phaseName}. View details in your timeline portal.`;

          await sendSMS(formattedPhone, message);
          console.log(`📱 New phase SMS sent to ${formattedPhone}`);
        }
      } catch (notificationError) {
        console.error('Failed to send new phase notification:', notificationError);
        // Don't fail the request if notification fails
      }
    }

    res.json({ success: true, phaseId });
  } catch (error) {
    handleError(error, 'Failed to add custom phase', res, 500);
  }
});

// Update phase (admin only)
router.put('/admin/timeline/phase/:phaseId', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { phaseId } = req.params;
    const updates = {};

    // Extract allowed fields
    const allowedFields = ['status', 'start_date', 'estimated_completion', 'actual_completion', 'notes', 'photos'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    await timelineDb.updatePhase(parseInt(phaseId), updates);

    // If status changed, send SMS notification to client
    if (updates.status) {
      try {
        // Get timeline and invoice details for SMS
        const db = require('../db-helpers').getDb();
        const dbInstance = await db;

        const phase = await dbInstance.get(
          'SELECT tp.*, pt.client_language FROM timeline_phases tp JOIN project_timelines pt ON tp.timeline_id = pt.id WHERE tp.id = ?',
          [parseInt(phaseId)]
        );

        const invoice = await dbInstance.get(`
          SELECT i.*, c.first_name, c.phone
          FROM invoices i
          JOIN clients c ON i.client_id = c.id
          JOIN project_timelines pt ON pt.invoice_id = i.id
          JOIN timeline_phases tp ON tp.timeline_id = pt.id
          WHERE tp.id = ?
        `, [parseInt(phaseId)]);

        await dbInstance.close();

        if (invoice && invoice.phone) {
          // Format phone number for Twilio (add US country code)
          let formattedPhone = invoice.phone.replace(/\D/g, ''); // Remove non-digits
          if (formattedPhone.length === 10) {
            formattedPhone = `+1${formattedPhone}`; // Add US country code
          } else if (formattedPhone.length === 11 && formattedPhone.startsWith('1')) {
            formattedPhone = `+${formattedPhone}`;
          } else if (!formattedPhone.startsWith('+')) {
            formattedPhone = `+1${formattedPhone}`;
          }

          // Prepare SMS message (bilingual)
          const phaseNames = {
            design: { en: 'Design', es: 'Diseño' },
            materials: { en: 'Materials Ordered', es: 'Materiales Pedidos' },
            fabrication: { en: 'Fabrication', es: 'Fabricación' },
            installation: { en: 'Installation', es: 'Instalación' },
            completion: { en: 'Completion', es: 'Finalización' }
          };

          const statusMessages = {
            pending: { en: 'is pending', es: 'está pendiente' },
            in_progress: { en: 'is now in progress', es: 'está ahora en progreso' },
            completed: { en: 'has been completed', es: 'ha sido completado' }
          };

          const lang = phase.client_language || 'en';
          const phaseName = phaseNames[phase.phase_name_key][lang];
          const statusMsg = statusMessages[updates.status][lang];

          const message = lang === 'es'
            ? `Hola ${invoice.first_name}, actualización de proyecto: ${phaseName} ${statusMsg}. Factura #${invoice.invoice_number}.`
            : `Hi ${invoice.first_name}, project update: ${phaseName} ${statusMsg}. Invoice #${invoice.invoice_number}.`;

          await sendSMS(formattedPhone, message);
        }
      } catch (smsError) {
        console.error('[TIMELINE SMS] Failed to send notification:', smsError);
        // Don't fail the request if SMS fails
      }
    }

    res.json({ success: true });
  } catch (error) {
    handleError(error, 'Failed to update phase', res, 500);
  }
});

// Delete timeline (admin only)
router.delete('/admin/timeline/:id', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    await timelineDb.deleteTimeline(parseInt(id));
    res.json({ success: true, message: 'Timeline deleted successfully' });
  } catch (error) {
    handleError(error, 'Failed to delete timeline', res, 500);
  }
});

// Send timeline link to client (admin only)
router.post('/admin/timeline/:id/send-link', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { method } = req.body; // 'email', 'sms', or 'both'

    if (!method || !['email', 'sms', 'both'].includes(method)) {
      return res.status(400).json({ error: 'Invalid method. Must be email, sms, or both' });
    }

    // Get timeline details
    const timeline = await timelineDb.getTimelineById(parseInt(id));
    if (!timeline) {
      return res.status(404).json({ error: 'Timeline not found' });
    }

    let clientEmail = null;
    let clientName = null;
    let clientPhone = null;
    let timelineUrl = null;
    const language = timeline.client_language || 'en';

    // Get client info and timeline URL
    if (timeline.invoice_id) {
      // Invoice-based timeline
      const db = require('../db-helpers').getDb();
      const dbInstance = await db;

      const invoice = await dbInstance.get(
        `SELECT i.*, c.first_name, c.last_name, c.email, c.phone, c.company_name
         FROM invoices i
         JOIN clients c ON i.client_id = c.id
         WHERE i.id = ?`,
        [timeline.invoice_id]
      );

      // Get invoice token
      const tokenRecord = await dbInstance.get(
        'SELECT token FROM invoice_tokens WHERE invoice_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1',
        [timeline.invoice_id]
      );

      await dbInstance.close();

      if (invoice) {
        clientEmail = invoice.email;
        clientName = invoice.company_name || `${invoice.first_name} ${invoice.last_name}`;
        clientPhone = invoice.phone;
        timelineUrl = tokenRecord ? `https://gudinocustom.com/project/${tokenRecord.token}` : null;
      }
    } else {
      // Standalone timeline
      clientEmail = timeline.client_email;
      clientName = timeline.client_name;
      clientPhone = timeline.client_phone;
      timelineUrl = timeline.access_token ? `https://gudinocustom.com/project/${timeline.access_token}` : null;
    }

    if (!timelineUrl) {
      return res.status(400).json({ error: 'Timeline URL not available. Timeline may not be properly configured.' });
    }

    const results = {
      email: null,
      sms: null
    };

    // Send email if requested
    if ((method === 'email' || method === 'both') && clientEmail) {
      try {
        const emailOptions = {
          from: process.env.EMAIL_FROM,
          to: clientEmail,
          subject: language === 'es'
            ? 'Enlace a su Portal de Proyecto - Gudino Custom Woodworking'
            : 'Your Project Timeline Portal - Gudino Custom Woodworking',
          html: language === 'es'
            ? `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #1e3a8a;">Hola ${clientName},</h1>
                <p>Aquí está el enlace a su portal de seguimiento de proyecto. Puede ver el progreso de su proyecto en cualquier momento:</p>
                <p style="text-align: center; margin: 30px 0;">
                  <a href="${timelineUrl}" style="background: #2563EB; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">Ver Mi Proyecto</a>
                </p>
                <p style="color: #6B7280; font-size: 14px;">Este enlace es privado y único para usted. Le notificaremos cuando haya actualizaciones en su proyecto.</p>
                <p>Saludos,<br>Gudino Custom Woodworking</p>
              </div>
            `
            : `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #1e3a8a;">Hi ${clientName},</h1>
                <p>Here's the link to your project timeline portal. You can track the progress of your project anytime:</p>
                <p style="text-align: center; margin: 30px 0;">
                  <a href="${timelineUrl}" style="background: #2563EB; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">View My Project</a>
                </p>
                <p style="color: #6B7280; font-size: 14px;">This link is private and unique to you. We'll notify you when there are updates to your project.</p>
                <p>Best regards,<br>Gudino Custom Woodworking</p>
              </div>
            `
        };

        const { emailTransporter } = require('../utils/email');
        await emailTransporter.sendMail(emailOptions);
        results.email = 'sent';
        console.log(`✉️  Timeline link sent via email to ${clientEmail}`);
      } catch (emailError) {
        console.error('Failed to send timeline email:', emailError);
        results.email = 'failed';
      }
    } else if (method === 'email' || method === 'both') {
      results.email = 'no_email';
    }

    // Send SMS if requested
    if ((method === 'sms' || method === 'both') && clientPhone) {
      try {
        // Format phone number for Twilio (add US country code)
        let formattedPhone = clientPhone.replace(/\D/g, ''); // Remove non-digits
        if (formattedPhone.length === 10) {
          formattedPhone = `+1${formattedPhone}`; // Add US country code
        } else if (formattedPhone.length === 11 && formattedPhone.startsWith('1')) {
          formattedPhone = `+${formattedPhone}`;
        } else if (!formattedPhone.startsWith('+')) {
          formattedPhone = `+1${formattedPhone}`;
        }

        const message = language === 'es'
          ? `Hola ${clientName}, aquí está el enlace a su portal de proyecto:\n ${timelineUrl}`
          : `Hi ${clientName}, here's your project timeline portal link:\n ${timelineUrl}`;

        await sendSMS(formattedPhone, message);
        results.sms = 'sent';
        console.log(`📱 Timeline link sent via SMS to ${formattedPhone}`);
      } catch (smsError) {
        console.error('Failed to send timeline SMS:', smsError);
        results.sms = 'failed';
      }
    } else if (method === 'sms' || method === 'both') {
      results.sms = 'no_phone';
    }

    res.json({
      success: true,
      message: 'Timeline link sent successfully',
      results,
      timelineUrl
    });
  } catch (error) {
    handleError(error, 'Failed to send timeline link', res, 500);
  }
});

// PUBLIC ROUTES - Client Timeline Viewing

// Get timeline by token (for client viewing)
// Supports both invoice tokens and standalone timeline tokens
router.get('/timeline/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // First, check if it's a standalone timeline access token
    const standaloneTimeline = await timelineDb.getTimelineByAccessToken(token);
    if (standaloneTimeline) {
      return res.json(standaloneTimeline);
    }

    // If not standalone, check if it's an invoice token
    const db = require('../db-helpers').getDb();
    const dbInstance = await db;

    const invoice = await dbInstance.get(
      'SELECT i.* FROM invoices i JOIN invoice_tokens it ON i.id = it.invoice_id WHERE it.token = ? AND it.is_active = 1',
      [token]
    );

    if (!invoice) {
      await dbInstance.close();
      return res.status(404).json({ error: 'Timeline not found or token is invalid' });
    }

    await dbInstance.close();

    // Get timeline for this invoice
    const timeline = await timelineDb.getTimelineByInvoiceId(invoice.id);

    if (!timeline) {
      return res.status(404).json({ error: 'Timeline not found for this invoice' });
    }

    res.json(timeline);
  } catch (error) {
    handleError(error, 'Failed to fetch timeline', res, 500);
  }
});

module.exports = router;
