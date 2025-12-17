import { SalesRecord, EmailConfig, WhatsAppConfig } from "../types";

export const GS_SCRIPT_CODE = `function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var payload = JSON.parse(e.postData.contents);
    
    // 1. Handle Sheet Sync
    if (payload.records && payload.records.length > 0) {
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["Date", "Invoice No", "Customer", "Mobile", "Email", "Taxable", "GST", "Total"]);
      }

      payload.records.forEach(function(row) {
        sheet.appendRow([
          row.date,
          row.invoiceNumber,
          row.customerName,
          "'" + row.mobile,
          row.email || '-',
          row.taxableAmount,
          row.gstAmount,
          row.grandTotal
        ]);
      });
    }

    var statuses = {};

    // 2. Handle Email Sending
    if (payload.emailConfig && payload.emailConfig.to && payload.emailConfig.pdfBase64) {
      try {
        var pdfBlob = Utilities.newBlob(
          Utilities.base64Decode(payload.emailConfig.pdfBase64), 
          'application/pdf', 
          'Invoice_' + payload.emailConfig.invoiceNumber + '.pdf'
        );

        MailApp.sendEmail({
          to: payload.emailConfig.to,
          subject: "Invoice: " + payload.emailConfig.invoiceNumber + " from BillKaro",
          body: "Dear " + payload.emailConfig.customerName + ",\\n\\nPlease find attached the invoice for your recent purchase.\\n\\nRegards,\\nBillKaro Team",
          attachments: [pdfBlob]
        });
        statuses.email = "sent";
      } catch (err) {
        statuses.email = "failed: " + err.toString();
      }
    }

    // 3. Handle WhatsApp Forwarding (Generic 3rd Party API)
    if (payload.whatsappConfig && payload.whatsappConfig.apiUrl) {
       try {
          var waPayload = {
             "phone": payload.whatsappConfig.mobile,
             "message": payload.whatsappConfig.message,
             "filename": payload.whatsappConfig.filename,
             "pdfBase64": payload.whatsappConfig.pdfBase64
             // Some providers might need 'media': 'base64...' 
             // This is a generic payload. You can adjust the script if your provider has a specific schema.
          };
          
          var options = {
             'method' : 'post',
             'contentType': 'application/json',
             'payload' : JSON.stringify(waPayload),
             'muteHttpExceptions': true
          };
          
          var waResponse = UrlFetchApp.fetch(payload.whatsappConfig.apiUrl, options);
          statuses.whatsapp = "forwarded: " + waResponse.getResponseCode();
       } catch (waErr) {
          statuses.whatsapp = "failed: " + waErr.toString();
       }
    }

    return ContentService.createTextOutput(JSON.stringify({result: "success", statuses: statuses}))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({result: "error", error: e.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}`;

export const sendToGoogleSheet = async (
  url: string, 
  records: SalesRecord[], 
  emailConfig?: EmailConfig,
  whatsappConfig?: WhatsAppConfig
) => {
  if (!url) return false;
  
  try {
    const payload = {
      records: records,
      emailConfig: emailConfig,
      whatsappConfig: whatsappConfig
    };

    await fetch(url, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain",
      },
      body: JSON.stringify(payload),
    });
    return true;
  } catch (error) {
    console.error("Google Sheet Sync Failed:", error);
    return false;
  }
};