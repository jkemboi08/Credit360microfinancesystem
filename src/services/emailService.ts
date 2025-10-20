import { supabase } from '../lib/supabaseClient';

export interface EmailData {
  to: string;
  subject: string;
  body: string;
  attachments?: Array<{
    filename: string;
    content: string; // base64 encoded
    type: string;
  }>;
}

export class EmailService {
  // Send contract via email
  static async sendContract(
    clientEmail: string,
    clientName: string,
    contractPdf: Blob,
    loanAmount: number
  ): Promise<boolean> {
    try {
      // Convert PDF blob to base64
      const base64Pdf = await this.blobToBase64(contractPdf);
      
      const emailData = {
        to: clientEmail,
        subject: `Loan Contract - ${clientName}`,
        body: `
Dear ${clientName},

Please find attached your loan contract for the amount of ${loanAmount.toLocaleString()} TZS.

This contract contains all the terms and conditions of your loan agreement. Please review it carefully and keep a copy for your records.

If you have any questions, please don't hesitate to contact us.

Best regards,
MFI Team
        `,
        attachments: [{
          filename: `loan-contract-${clientName.replace(/\s+/g, '-')}.pdf`,
          content: base64Pdf,
          type: 'application/pdf'
        }]
      };

      // In a real implementation, you would call your email service here
      // For now, we'll simulate the email sending
      console.log('Sending email:', emailData);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, show success
      alert(`Contract sent successfully to ${clientEmail}`);
      return true;
      
    } catch (error) {
      console.error('Error sending contract email:', error);
      alert(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  // Convert blob to base64
  private static async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Generate PDF from contract text (simplified version)
  static async generateContractPdf(contractText: string): Promise<Blob> {
    // This is a simplified implementation
    // In a real app, you'd use a proper PDF generation library like jsPDF or Puppeteer
    
    // Create a simple HTML document
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Loan Contract</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              margin: 40px;
              font-size: 12px;
            }
            .contract-content {
              /* Remove white-space: pre-wrap since we're handling HTML */
            }
          </style>
        </head>
        <body>
          <div class="contract-content">${contractText}</div>
        </body>
      </html>
    `;

    // For demo purposes, create a simple text blob
    // In production, you'd use a proper PDF generation library
    const blob = new Blob([htmlContent], { type: 'text/html' });
    return blob;
  }
}
