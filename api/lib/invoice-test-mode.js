export function isInvoiceTestMode() {
  return process.env.INVOICE_TEST_MODE === 'true';
}

export function getInvoiceTestRecipient() {
  return process.env.INVOICE_TEST_RECIPIENT?.trim() || '';
}

export function resolveInvoiceEmailRecipient(customerEmail) {
  const testMode = isInvoiceTestMode();
  const testRecipient = getInvoiceTestRecipient();
  const fallbackRecipient = customerEmail || '';

  if (testMode) {
    return {
      testMode,
      recipient: testRecipient || fallbackRecipient,
      originalRecipient: customerEmail || null,
      redirected: Boolean(testRecipient),
    };
  }

  return {
    testMode,
    recipient: fallbackRecipient,
    originalRecipient: customerEmail || null,
    redirected: false,
  };
}

export function getInvoiceEmailSubject(invoiceNumber) {
  const baseSubject = `Invoice ${invoiceNumber} - ${process.env.COMPANY_NAME || 'Berry Brazil Açai'}`;
  return isInvoiceTestMode() ? `[TEST] ${baseSubject}` : baseSubject;
}

export function getInvoiceAttachmentName(invoiceNumber) {
  return `${isInvoiceTestMode() ? 'TEST-' : ''}invoice-${invoiceNumber}.pdf`;
}
