// EMAIL UTILITIES
const nodemailer = require("nodemailer");

const emailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function generateInvoiceEmailOptions({
  recipients,
  invoice,
  clientName,
  viewLink,
  language = "english",
  message = "",
  pdfBuffer,
  translations,
}) {
  const t = translations;

  return {
    from: process.env.EMAIL_FROM,
    to: recipients.join(", "),
    subject: `${t.subject} ${invoice.invoice_number.split("-").pop()}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: rgba(109, 109, 109, 1); color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">${t.companyName}</h1>
        </div>

        <div style="padding: 30px; background: #f8fafc;">
          <h2 style="color: black; margin-top: 0;">${
            t.invoiceTitle
          } ${invoice.invoice_number.split("-").pop()}</h2>

          <p style="color: black;">${t.greeting} ${clientName},</p>

          <p style="color: black;">${
            language === "spanish"
              ? "Adjunto encontrará su factura. También puede verla y descargarla usando el enlace seguro de abajo:"
              : "Please find your invoice attached. You can also view and download your invoice using the secure link below:"
          }</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${viewLink}"
               style="background: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              ${t.viewOnline}
            </a>
          </div>

          <div style="background: white; padding: 20px; border-radius: 5px; border: 1px solid #e2e8f0;">
            <h3 style="margin-top: 0; color: black;">${
              language === "spanish"
                ? "Detalles de la Factura:"
                : "Invoice Details:"
            }</h3>
            <p style="color: black;"><strong>${
              language === "spanish"
                ? "Número de Factura:"
                : "Invoice Number:"
            }</strong> ${invoice.invoice_number.split("-").pop()}</p>
            <p style="color: black;"><strong>${
              t.invoiceDate
            }:</strong> ${new Date(
      invoice.invoice_date
    ).toLocaleDateString()}</p>
            <p style="color: black;"><strong>${
              t.dueDate
            }:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
            <p style="color: black;"><strong>${
              language === "spanish" ? "Cantidad Total:" : "Total Amount:"
            }</strong> $${(invoice.total_amount || 0).toFixed(2)}</p>
          </div>

          ${
            message
              ? `
          <div style="margin: 20px 0; padding: 15px; background: #eff6ff; border-left: 4px solid #1e3a8a;">
            <p style="margin: 0; color: black;"><strong>${
              language === "spanish"
                ? "Mensaje Adicional:"
                : "Additional Message:"
            }</strong></p>
            <p style="margin: 5px 0 0 0; color: black;">${message}</p>
          </div>
          `
              : ""
          }

          <p style="margin-top: 30px; color: black;">${t.questions}</p>

          <p style="color: black;">${t.thankYou}</p>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #6b7280; font-size: 14px;">
            <p>${t.companyName}</p>
            <p>Email: ${process.env.ADMIN_EMAIL}</p>
            <p>${
              language === "spanish"
                ? "Este enlace permanecerá activo permanentemente para sus registros."
                : "This link will remain active permanently for your records."
            }</p>
          </div>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: `invoice-${invoice.invoice_number.split("-").pop()}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  };
}

function generateReceiptEmailOptions({
  recipients,
  payment,
  invoice,
  clientName,
  language = "en",
  pdfBuffer,
  receiptLink = null,
}) {
  const isPaidInFull = parseFloat(payment.remaining_balance || 0) <= 0;

  const translations = {
    en: {
      subject: 'Payment Receipt',
      title: 'Payment Received',
      greeting: 'Dear',
      message: 'Thank you for your payment! Please find your receipt attached.',
      amountPaid: 'Amount Paid',
      paymentDate: 'Payment Date',
      paymentMethod: 'Payment Method',
      invoiceNumber: 'Invoice Number',
      remainingBalance: 'Remaining Balance',
      paidInFull: 'Paid in Full',
      viewInvoice: 'View Full Invoice',
      viewReceipt: 'View Receipt Online',
      downloadReceipt: 'Download PDF',
      questions: 'If you have any questions about this payment, please contact us.',
      companyName: 'Gudino Custom Woodworking'
    },
    es: {
      subject: 'Recibo de Pago',
      title: 'Pago Recibido',
      greeting: 'Estimado',
      message: '¡Gracias por su pago! Adjunto encontrará su recibo.',
      amountPaid: 'Monto Pagado',
      paymentDate: 'Fecha de Pago',
      paymentMethod: 'Método de Pago',
      invoiceNumber: 'Número de Factura',
      remainingBalance: 'Saldo Restante',
      paidInFull: 'Pagado Completo',
      viewInvoice: 'Ver Factura Completa',
      viewReceipt: 'Ver Recibo en Línea',
      downloadReceipt: 'Descargar PDF',
      questions: 'Si tiene alguna pregunta sobre este pago, contáctenos.',
      companyName: 'Gudino Custom Woodworking'
    }
  };

  const t = translations[language] || translations.en;

  return {
    from: process.env.EMAIL_FROM,
    to: recipients.join(", "),
    subject: `${t.subject} - ${invoice.invoice_number.split("-").pop()}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e3a8a; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">${t.companyName}</h1>
        </div>

        <div style="padding: 30px; background: #f8fafc;">
          <h2 style="color: #1e3a8a; margin-top: 0;">${t.title}</h2>

          <p style="color: black;">${t.greeting} ${clientName},</p>

          <p style="color: black;">${t.message}</p>

          <div style="background: ${isPaidInFull ? '#dcfce7' : '#fef3c7'}; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <div style="font-size: 14px; color: ${isPaidInFull ? '#166534' : '#92400e'}; font-weight: bold; margin-bottom: 10px;">
              ${isPaidInFull ? t.paidInFull : t.remainingBalance + ': $' + parseFloat(payment.remaining_balance || 0).toFixed(2)}
            </div>
            <div style="font-size: 36px; font-weight: bold; color: ${isPaidInFull ? '#166534' : '#1e3a8a'};">
              $${parseFloat(payment.payment_amount).toFixed(2)}
            </div>
            <div style="font-size: 14px; color: #6b7280; margin-top: 5px;">${t.amountPaid}</div>
          </div>

          <div style="background: white; padding: 20px; border-radius: 5px; border: 1px solid #e2e8f0;">
            <h3 style="margin-top: 0; color: black;">${language === 'es' ? 'Detalles del Pago' : 'Payment Details'}</h3>
            <p style="color: black;"><strong>${t.invoiceNumber}:</strong> ${invoice.invoice_number.split("-").pop()}</p>
            <p style="color: black;"><strong>${t.paymentDate}:</strong> ${new Date(payment.payment_date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')}</p>
            <p style="color: black;"><strong>${t.paymentMethod}:</strong> ${payment.payment_method}</p>
            ${payment.transaction_id ? `<p style="color: black;"><strong>${language === 'es' ? 'ID de Transacción' : 'Transaction ID'}:</strong> ${payment.transaction_id}</p>` : ''}
          </div>

          ${receiptLink ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${receiptLink}" style="display: inline-block; background: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                ${t.viewReceipt}
              </a>
            </div>
          ` : ''}

          <p style="margin-top: 30px; color: black;">${t.questions}</p>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #6b7280; font-size: 14px; text-align: center;">
            <p>${t.companyName}</p>
            <p>Email: ${process.env.ADMIN_EMAIL} | Phone: (509) 515-4090</p>
          </div>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: `receipt-${invoice.invoice_number.split("-").pop()}-${payment.id}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  };
}

// Quick quote confirmation email for clients (bilingual)
function generateQuickQuoteConfirmationEmail({
  clientName,
  clientEmail,
  projectType,
  language = "en",
  submissionId,
}) {
  const translations = {
    en: {
      subject: "Quote Request Received - Gudino Custom Woodworking",
      title: "We Received Your Quote Request!",
      greeting: "Dear",
      message:
        "Thank you for your interest in Gudino Custom Woodworking. We have received your quote request and will get back to you within 2-4 buisness days.",
      projectType: "Project Type",
      nextSteps: "What Happens Next?",
      step1: "Our team will review your project details",
      step2: "We'll contact you to schedule a consultation",
      step3: "We'll provide you with a detailed quote",
      questions: "If you have any immediate questions, feel free to contact us:",
      companyName: "Gudino Custom Woodworking",
      phone: "Phone",
      email: "Email",
    },
    es: {
      subject: "Solicitud de Cotización Recibida - Gudino Custom Woodworking",
      title: "¡Recibimos Su Solicitud de Cotización!",
      greeting: "Estimado",
      message:
        "Gracias por su interés en Gudino Custom Woodworking. Hemos recibido su solicitud de cotización y nos comunicaremos con usted dentro de 2-4 días hábiles.",
      projectType: "Tipo de Proyecto",
      nextSteps: "¿Qué Sigue?",
      step1: "Nuestro equipo revisará los detalles de su proyecto",
      step2: "Nos pondremos en contacto para programar una consulta",
      step3: "Le proporcionaremos una cotización detallada",
      questions:
        "Si tiene alguna pregunta inmediata, no dude en contactarnos:",
      companyName: "Gudino Custom Woodworking",
      phone: "Teléfono",
      email: "Correo Electrónico",
    },
  };

  const t = translations[language] || translations.en;

  return {
    from: process.env.EMAIL_FROM,
    to: clientEmail,
    subject: t.subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: rgba(109, 109, 109, 1); color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">${t.companyName}</h1>
        </div>

        <div style="padding: 30px; background: #f8fafc;">
          <h2 style="color: #1e3a8a; margin-top: 0;">${t.title}</h2>

          <p style="color: black;">${t.greeting} ${clientName},</p>

          <p style="color: black;">${t.message}</p>

          <div style="background: white; padding: 20px; border-radius: 5px; border: 1px solid #e2e8f0; margin: 20px 0;">
            <p style="color: black;"><strong>${t.projectType}:</strong> ${projectType}</p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">
              ${language === "es" ? "Número de referencia" : "Reference number"}: #${submissionId}
            </p>
          </div>

          <div style="background: #eff6ff; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #1e3a8a; margin-top: 0;">${t.nextSteps}</h3>
            <ol style="color: black; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 10px;">${t.step1}</li>
              <li style="margin-bottom: 10px;">${t.step2}</li>
              <li>${t.step3}</li>
            </ol>
          </div>

          <p style="color: black; margin-top: 30px;">${t.questions}</p>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #6b7280; font-size: 14px; text-align: center;">
            <p style="margin: 5px 0;"><strong>${t.companyName}</strong></p>
            <p style="margin: 5px 0;">${t.phone}: (509) 515-4090</p>
            <p style="margin: 5px 0;">${t.email}: ${process.env.ADMIN_EMAIL}</p>
          </div>
        </div>
      </div>
    `,
  };
}

// Quick quote admin notification email
function generateQuickQuoteAdminNotification({
  clientName,
  clientEmail,
  clientPhone,
  projectType,
  roomDimensions,
  budgetRange,
  preferredMaterials,
  preferredColors,
  message,
  photoCount,
  language,
  submissionId,
  ipAddress,
  geolocation,
}) {
  const projectTypeLabels = {
    kitchen: "Kitchen Cabinets",
    bathroom: "Bathroom Vanities",
    custom: "Custom Woodworking",
  };

  return {
    from: process.env.EMAIL_FROM,
    to: process.env.ADMIN_EMAIL,
    subject: `New Quote Request: ${projectTypeLabels[projectType] || projectType} - ${clientName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e3a8a; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">New Quote Request</h1>
        </div>

        <div style="padding: 30px; background: #f8fafc;">
          <div style="background: #dcfce7; padding: 15px; border-radius: 5px; border-left: 4px solid #16a34a; margin-bottom: 20px;">
            <p style="margin: 0; color: #166534; font-weight: bold;">
              New quote request from ${clientName}
            </p>
            <p style="margin: 5px 0 0 0; color: #166534; font-size: 14px;">
              Reference: #${submissionId} | Language: ${language === "es" ? "Spanish" : "English"}
            </p>
          </div>

          <div style="background: white; padding: 20px; border-radius: 5px; border: 1px solid #e2e8f0;">
            <h3 style="margin-top: 0; color: black;">Client Information</h3>
            <p style="color: black;"><strong>Name:</strong> ${clientName}</p>
            <p style="color: black;"><strong>Email:</strong> <a href="mailto:${clientEmail}">${clientEmail}</a></p>
            ${clientPhone ? `<p style="color: black;"><strong>Phone:</strong> <a href="tel:${clientPhone}">${clientPhone}</a></p>` : ""}
            <p style="color: black;"><strong>Preferred Language:</strong> ${language === "es" ? "Spanish (Español)" : "English"}</p>
          </div>

          <div style="background: white; padding: 20px; border-radius: 5px; border: 1px solid #e2e8f0; margin-top: 20px;">
            <h3 style="margin-top: 0; color: black;">Project Details</h3>
            <p style="color: black;"><strong>Project Type:</strong> ${projectTypeLabels[projectType] || projectType}</p>
            ${roomDimensions ? `<p style="color: black;"><strong>Room Dimensions:</strong> ${roomDimensions}</p>` : ""}
            ${budgetRange ? `<p style="color: black;"><strong>Budget Range:</strong> ${budgetRange}</p>` : ""}
            ${preferredMaterials ? `<p style="color: black;"><strong>Preferred Materials:</strong> ${preferredMaterials}</p>` : ""}
            ${preferredColors ? `<p style="color: black;"><strong>Preferred Colors:</strong> ${preferredColors}</p>` : ""}
            ${photoCount > 0 ? `<p style="color: black;"><strong>Inspiration Photos:</strong> ${photoCount} photo(s) attached</p>` : ""}
          </div>

          ${
            message
              ? `
          <div style="background: #fef3c7; padding: 20px; border-radius: 5px; border-left: 4px solid #f59e0b; margin-top: 20px;">
            <h3 style="margin-top: 0; color: black;">Client Message</h3>
            <p style="color: black; white-space: pre-wrap;">${message}</p>
          </div>
          `
              : ""
          }

          <div style="background: white; padding: 20px; border-radius: 5px; border: 1px solid #e2e8f0; margin-top: 20px;">
            <h3 style="margin-top: 0; color: black;">Technical Information</h3>
            <p style="color: #6b7280; font-size: 14px;">IP Address: ${ipAddress || "N/A"}</p>
            ${geolocation ? `<p style="color: #6b7280; font-size: 14px;">Location: ${geolocation}</p>` : ""}
            <p style="color: #6b7280; font-size: 14px;">Submitted: ${new Date().toLocaleString()}</p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://gudinocustom.com/admin"
               style="display: inline-block; background: #1e3a8a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              View in Admin Panel
            </a>
          </div>
        </div>
      </div>
    `,
  };
}

// Generate appointment confirmation email
function generateAppointmentConfirmationEmail({
  clientName,
  clientEmail,
  appointmentType,
  appointmentDate,
  duration,
  language = "en",
  cancellationToken,
}) {
  const appointmentTypeLabels = {
    consultation: language === "es" ? "Consulta" : "Consultation",
    measurement: language === "es" ? "Medición" : "Measurement",
    estimate: language === "es" ? "Estimación" : "Estimate",
    followup: language === "es" ? "Seguimiento" : "Follow-up",
  };

  const formattedDate = new Date(appointmentDate).toLocaleString(
    language === "es" ? "es-US" : "en-US",
    {
      dateStyle: "full",
      timeStyle: "short",
    }
  );

  return {
    from: process.env.EMAIL_FROM,
    to: clientEmail,
    subject:
      language === "es"
        ? "Confirmación de Cita - Gudino Custom"
        : "Appointment Confirmation - Gudino Custom",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: rgba(109, 109, 109, 1); color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Gudino Custom</h1>
        </div>

        <div style="padding: 30px; background: #f8fafc;">
          <h2 style="color: black; margin-top: 0;">
            ${language === "es" ? "¡Cita Confirmada!" : "Appointment Confirmed!"}
          </h2>

          <p style="color: black;">
            ${language === "es" ? "Hola" : "Hello"} ${clientName},
          </p>

          <p style="color: black;">
            ${
              language === "es"
                ? "Su cita ha sido confirmada. Esperamos verle pronto."
                : "Your appointment has been confirmed. We look forward to seeing you."
            }
          </p>

          <div style="background: white; padding: 20px; border-radius: 5px; border: 1px solid #e2e8f0; margin: 20px 0;">
            <h3 style="margin-top: 0; color: black;">
              ${language === "es" ? "Detalles de la Cita" : "Appointment Details"}
            </h3>
            <p style="color: black;"><strong>${language === "es" ? "Tipo:" : "Type:"}</strong> ${appointmentTypeLabels[appointmentType]}</p>
            <p style="color: black;"><strong>${language === "es" ? "Fecha y Hora:" : "Date & Time:"}</strong> ${formattedDate}</p>
            <p style="color: black;"><strong>${language === "es" ? "Duración:" : "Duration:"}</strong> ${duration} ${language === "es" ? "minutos" : "minutes"}</p>
          </div>

          <div style="background: #eff6ff; padding: 20px; border-radius: 5px; border-left: 4px solid #1e3a8a; margin: 20px 0;">
            <p style="margin: 0; color: black;">
              ${
                language === "es"
                  ? "Si necesita cancelar o reprogramar su cita, por favor use el enlace de abajo:"
                  : "If you need to cancel or reschedule your appointment, please use the link below:"
              }
            </p>
            <div style="text-align: center; margin-top: 15px;">
              <a href="https://gudinocustom.com/appointment/cancel/${cancellationToken}"
                 style="display: inline-block; background: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                ${language === "es" ? "Cancelar Cita" : "Cancel Appointment"}
              </a>
            </div>
          </div>

          <p style="color: black;">
            ${
              language === "es"
                ? "Si tiene alguna pregunta, no dude en contactarnos."
                : "If you have any questions, please don't hesitate to contact us."
            }
          </p>

          <p style="color: black;">
            ${language === "es" ? "Gracias," : "Thank you,"}
          </p>
          <p style="color: black;"><strong>Gudino Custom Team</strong></p>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #6b7280; font-size: 14px;">
            <p>Gudino Custom</p>
            <p>${language === "es" ? "Gabinetes Personalizados de Calidad" : "Quality Custom Cabinets"}</p>
          </div>
        </div>
      </div>
    `,
  };
}

// Generate appointment reminder email
function generateAppointmentReminderEmail({
  clientName,
  clientEmail,
  appointmentType,
  appointmentDate,
  language = "en",
  cancellationToken,
}) {
  const appointmentTypeLabels = {
    consultation: language === "es" ? "Consulta" : "Consultation",
    measurement: language === "es" ? "Medición" : "Measurement",
    estimate: language === "es" ? "Estimación" : "Estimate",
    followup: language === "es" ? "Seguimiento" : "Follow-up",
  };

  const formattedDate = new Date(appointmentDate).toLocaleString(
    language === "es" ? "es-US" : "en-US",
    {
      dateStyle: "full",
      timeStyle: "short",
    }
  );

  return {
    from: process.env.EMAIL_FROM,
    to: clientEmail,
    subject:
      language === "es"
        ? "Recordatorio de Cita - Mañana"
        : "Appointment Reminder - Tomorrow",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: rgba(109, 109, 109, 1); color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Gudino Custom</h1>
        </div>

        <div style="padding: 30px; background: #f8fafc;">
          <h2 style="color: black; margin-top: 0;">
            ${language === "es" ? "Recordatorio de Cita" : "Appointment Reminder"}
          </h2>

          <p style="color: black;">
            ${language === "es" ? "Hola" : "Hello"} ${clientName},
          </p>

          <p style="color: black;">
            ${
              language === "es"
                ? "Este es un recordatorio amistoso de su próxima cita mañana:"
                : "This is a friendly reminder of your upcoming appointment tomorrow:"
            }
          </p>

          <div style="background: white; padding: 20px; border-radius: 5px; border: 1px solid #e2e8f0; margin: 20px 0;">
            <p style="color: black;"><strong>${language === "es" ? "Tipo:" : "Type:"}</strong> ${appointmentTypeLabels[appointmentType]}</p>
            <p style="color: black;"><strong>${language === "es" ? "Fecha y Hora:" : "Date & Time:"}</strong> ${formattedDate}</p>
          </div>

          <p style="color: black;">
            ${
              language === "es"
                ? "Esperamos verle. Si necesita cancelar, por favor use el enlace de abajo:"
                : "We look forward to seeing you. If you need to cancel, please use the link below:"
            }
          </p>

          <div style="text-align: center; margin: 20px 0;">
            <a href="https://gudinocustom.com/appointment/cancel/${cancellationToken}"
               style="display: inline-block; background: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              ${language === "es" ? "Cancelar Cita" : "Cancel Appointment"}
            </a>
          </div>

          <p style="color: black;">
            ${language === "es" ? "Gracias," : "Thank you,"}
          </p>
          <p style="color: black;"><strong>Gudino Custom Team</strong></p>
        </div>
      </div>
    `,
  };
}

// Generate appointment cancellation email
function generateAppointmentCancellationEmail({
  clientName,
  clientEmail,
  appointmentType,
  appointmentDate,
  language = "en",
}) {
  const appointmentTypeLabels = {
    consultation: language === "es" ? "Consulta" : "Consultation",
    measurement: language === "es" ? "Medición" : "Measurement",
    estimate: language === "es" ? "Estimación" : "Estimate",
    followup: language === "es" ? "Seguimiento" : "Follow-up",
  };

  const formattedDate = new Date(appointmentDate).toLocaleString(
    language === "es" ? "es-US" : "en-US",
    {
      dateStyle: "full",
      timeStyle: "short",
    }
  );

  return {
    from: process.env.EMAIL_FROM,
    to: clientEmail,
    subject:
      language === "es"
        ? "Cita Cancelada - Gudino Custom"
        : "Appointment Cancelled - Gudino Custom",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: rgba(109, 109, 109, 1); color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Gudino Custom</h1>
        </div>

        <div style="padding: 30px; background: #f8fafc;">
          <h2 style="color: black; margin-top: 0;">
            ${language === "es" ? "Cita Cancelada" : "Appointment Cancelled"}
          </h2>

          <p style="color: black;">
            ${language === "es" ? "Hola" : "Hello"} ${clientName},
          </p>

          <p style="color: black;">
            ${
              language === "es"
                ? "Su cita ha sido cancelada exitosamente:"
                : "Your appointment has been successfully cancelled:"
            }
          </p>

          <div style="background: white; padding: 20px; border-radius: 5px; border: 1px solid #e2e8f0; margin: 20px 0;">
            <p style="color: black;"><strong>${language === "es" ? "Tipo:" : "Type:"}</strong> ${appointmentTypeLabels[appointmentType]}</p>
            <p style="color: black;"><strong>${language === "es" ? "Fecha y Hora:" : "Date & Time:"}</strong> ${formattedDate}</p>
          </div>

          <p style="color: black;">
            ${
              language === "es"
                ? "Si desea programar una nueva cita, por favor visite nuestro sitio web o contáctenos directamente."
                : "If you'd like to schedule a new appointment, please visit our website or contact us directly."
            }
          </p>

          <div style="text-align: center; margin: 20px 0;">
            <a href="https://gudinocustom.com/book"
               style="display: inline-block; background: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
              ${language === "es" ? "Programar Nueva Cita" : "Schedule New Appointment"}
            </a>
          </div>

          <p style="color: black;">
            ${language === "es" ? "Gracias," : "Thank you,"}
          </p>
          <p style="color: black;"><strong>Gudino Custom Team</strong></p>
        </div>
      </div>
    `,
  };
}

module.exports = {
  emailTransporter,
  generateInvoiceEmailOptions,
  generateReceiptEmailOptions,
  generateQuickQuoteConfirmationEmail,
  generateQuickQuoteAdminNotification,
  generateAppointmentConfirmationEmail,
  generateAppointmentReminderEmail,
  generateAppointmentCancellationEmail,
};
