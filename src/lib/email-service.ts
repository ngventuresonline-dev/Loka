/**
 * Email Service
 * Handles sending emails to users
 * 
 * For production, integrate with:
 * - Resend (recommended): https://resend.com
 * - SendGrid: https://sendgrid.com
 * - Nodemailer: https://nodemailer.com
 * - AWS SES: https://aws.amazon.com/ses
 */

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Send email (placeholder implementation)
 * Replace this with your actual email service integration
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    // TODO: Replace with actual email service
    // Example with Resend:
    // const resend = new Resend(process.env.RESEND_API_KEY)
    // await resend.emails.send({
    //   from: 'Lokazen <noreply@lokazen.com>',
    //   to: options.to,
    //   subject: options.subject,
    //   html: options.html,
    //   text: options.text,
    // })

    // For now, log the email (useful for development)
    console.log('📧 Email would be sent:', {
      to: options.to,
      subject: options.subject,
      // Don't log full HTML in production
      preview: options.html.substring(0, 100) + '...',
    })

    // In development, you might want to actually send emails
    // For production, integrate with a real email service
    if (process.env.NODE_ENV === 'development' && process.env.ENABLE_EMAIL_LOGGING === 'true') {
      console.log('📧 Email Content:', {
        to: options.to,
        subject: options.subject,
        html: options.html,
      })
    }

    return { success: true }
  } catch (error: any) {
    console.error('[Email Service] Error sending email:', error)
    return { success: false, error: error.message || 'Failed to send email' }
  }
}

/**
 * Send welcome email with login credentials to property owner
 */
export async function sendOwnerWelcomeEmail(
  email: string,
  name: string,
  userId: string,
  password: string,
  dashboardUrl: string = 'https://lokazen.com/dashboard/owner'
): Promise<{ success: boolean; error?: string }> {
  const subject = 'Welcome to Lokazen - Your Property Dashboard Access'
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Lokazen</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #FF5200 0%, #E4002B 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Lokazen!</h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-top: 0;">Hi ${name},</p>
        
        <p style="font-size: 16px;">
          Thank you for listing your property with Lokazen! Your property is now under review and will be visible to brands once approved.
        </p>
        
        <div style="background: #f9fafb; border-left: 4px solid #FF5200; padding: 20px; margin: 25px 0; border-radius: 4px;">
          <h2 style="margin-top: 0; color: #111827; font-size: 20px;">Your Login Credentials</h2>
          <p style="margin-bottom: 10px; font-size: 14px; color: #6b7280;">Use these credentials to access your dashboard:</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #374151; width: 120px;">Email:</td>
              <td style="padding: 8px 0; color: #111827; font-family: monospace;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #374151;">Password:</td>
              <td style="padding: 8px 0; color: #111827; font-family: monospace; font-size: 16px; letter-spacing: 1px;">${password}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #374151;">User ID:</td>
              <td style="padding: 8px 0; color: #111827; font-family: monospace; font-size: 12px;">${userId}</td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardUrl}" 
             style="display: inline-block; background: linear-gradient(135deg, #FF5200 0%, #E4002B 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Access Your Dashboard
          </a>
        </div>
        
        <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
          <strong>Security Note:</strong> Please change your password after your first login for security purposes.
        </p>
        
        <p style="font-size: 14px; color: #6b7280;">
          If you have any questions, feel free to reach out to our support team.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
          This is an automated email. Please do not reply to this message.<br>
          © ${new Date().getFullYear()} Lokazen. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `

  const text = `
Welcome to Lokazen!

Hi ${name},

Thank you for listing your property with Lokazen! Your property is now under review and will be visible to brands once approved.

Your Login Credentials:
Email: ${email}
Password: ${password}
User ID: ${userId}

Access your dashboard: ${dashboardUrl}

Security Note: Please change your password after your first login for security purposes.

If you have any questions, feel free to reach out to our support team.

---
This is an automated email. Please do not reply to this message.
© ${new Date().getFullYear()} Lokazen. All rights reserved.
  `

  return sendEmail({
    to: email,
    subject,
    html,
    text,
  })
}

/**
 * Generate a secure random password
 */
export function generateSecurePassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '!@#$%&*'
  const allChars = uppercase + lowercase + numbers + symbols

  // Ensure at least one character from each set
  let password = ''
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('')
}


