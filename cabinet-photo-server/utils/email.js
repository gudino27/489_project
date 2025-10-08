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

module.exports = {
  emailTransporter,
  generateInvoiceEmailOptions,
  generateReceiptEmailOptions,
};
