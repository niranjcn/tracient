/**
 * Email Service
 * Handles all email notifications
 */
import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.util.js';

// Create transporter
const createTransporter = () => {
  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  };
  
  // For development, use ethereal or skip email
  if (process.env.NODE_ENV !== 'production' && !process.env.SMTP_USER) {
    logger.warn('Email service not configured. Emails will be logged only.');
    return null;
  }
  
  return nodemailer.createTransport(config);
};

let transporter = null;

/**
 * Initialize email service
 */
export const initEmailService = async () => {
  try {
    transporter = createTransporter();
    if (transporter) {
      await transporter.verify();
      logger.info('Email service initialized');
    }
  } catch (error) {
    logger.error('Email service initialization failed:', error.message);
    transporter = null;
  }
};

/**
 * Send email
 */
const sendEmail = async (options) => {
  try {
    if (!transporter) {
      logger.info('Email (mock):', { to: options.to, subject: options.subject });
      return { success: true, mock: true };
    }
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Tracient" <noreply@tracient.gov.in>',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };
    
    const info = await transporter.sendMail(mailOptions);
    logger.info('Email sent:', { to: options.to, messageId: info.messageId });
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Failed to send email:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send welcome email to new user
 */
export const sendWelcomeEmail = async (user) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2563eb;">Welcome to Tracient!</h1>
      <p>Dear ${user.name},</p>
      <p>Welcome to Tracient - the Blockchain-Based Income Traceability System for Equitable Welfare Distribution.</p>
      <p>Your account has been successfully created with the role: <strong>${user.role}</strong></p>
      <p>You can now log in and access the platform's features.</p>
      <br>
      <p>Best regards,<br>The Tracient Team</p>
    </div>
  `;
  
  return sendEmail({
    to: user.email,
    subject: 'Welcome to Tracient',
    html
  });
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2563eb;">Password Reset Request</h1>
      <p>Dear ${user.name},</p>
      <p>You have requested to reset your password. Click the button below to proceed:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
          Reset Password
        </a>
      </div>
      <p>If you didn't request this, please ignore this email.</p>
      <p>This link will expire in 1 hour.</p>
      <br>
      <p>Best regards,<br>The Tracient Team</p>
    </div>
  `;
  
  return sendEmail({
    to: user.email,
    subject: 'Password Reset - Tracient',
    html
  });
};

/**
 * Send verification status email
 */
export const sendVerificationEmail = async (user, status, notes) => {
  const statusColor = status === 'verified' ? '#16a34a' : '#dc2626';
  const statusText = status === 'verified' ? 'Verified' : 'Rejected';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2563eb;">Verification Status Update</h1>
      <p>Dear ${user.name},</p>
      <p>Your verification status has been updated:</p>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="font-size: 18px; margin: 0;">Status: <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span></p>
        ${notes ? `<p style="margin-top: 10px;">Notes: ${notes}</p>` : ''}
      </div>
      ${status === 'verified' 
        ? '<p>You can now access all platform features.</p>' 
        : '<p>Please contact support if you have questions about this decision.</p>'}
      <br>
      <p>Best regards,<br>The Tracient Team</p>
    </div>
  `;
  
  return sendEmail({
    to: user.email,
    subject: `Verification ${statusText} - Tracient`,
    html
  });
};

/**
 * Send payment notification email
 */
export const sendPaymentNotification = async (worker, transaction) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2563eb;">Payment Received!</h1>
      <p>Dear ${worker.name},</p>
      <p>You have received a payment:</p>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Amount:</strong> ₹${transaction.amount.toLocaleString()}</p>
        <p><strong>From:</strong> ${transaction.employerName || 'Employer'}</p>
        <p><strong>Reference:</strong> ${transaction.referenceNumber}</p>
        <p><strong>Date:</strong> ${new Date(transaction.timestamp).toLocaleString()}</p>
      </div>
      <p>This transaction has been recorded on the blockchain for transparency.</p>
      <br>
      <p>Best regards,<br>The Tracient Team</p>
    </div>
  `;
  
  // Note: Workers might not have email, so this might need phone SMS instead
  if (worker.email) {
    return sendEmail({
      to: worker.email,
      subject: `Payment Received - ₹${transaction.amount}`,
      html
    });
  }
  
  return { success: true, skipped: true, reason: 'No email address' };
};

/**
 * Send anomaly alert to government official
 */
export const sendAnomalyAlert = async (official, alert) => {
  const severityColors = {
    low: '#fbbf24',
    medium: '#f97316',
    high: '#ef4444',
    critical: '#dc2626'
  };
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #dc2626;">⚠️ Anomaly Alert</h1>
      <p>Dear ${official.name},</p>
      <p>A new anomaly has been detected that requires your attention:</p>
      <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${severityColors[alert.severity]};">
        <p><strong>Type:</strong> ${alert.alertType}</p>
        <p><strong>Severity:</strong> <span style="color: ${severityColors[alert.severity]}; font-weight: bold;">${alert.severity.toUpperCase()}</span></p>
        <p><strong>Description:</strong> ${alert.description}</p>
        <p><strong>Detected:</strong> ${new Date(alert.detectedAt).toLocaleString()}</p>
      </div>
      <p>Please log in to the dashboard to review and take appropriate action.</p>
      <br>
      <p>Best regards,<br>Tracient System</p>
    </div>
  `;
  
  return sendEmail({
    to: official.email,
    subject: `[${alert.severity.toUpperCase()}] Anomaly Alert - ${alert.alertType}`,
    html
  });
};

/**
 * Send welfare scheme notification
 */
export const sendSchemeNotification = async (worker, scheme) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #16a34a;">🎉 You're Eligible for a Welfare Scheme!</h1>
      <p>Dear ${worker.name},</p>
      <p>Based on your verified income records, you are now eligible for:</p>
      <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2 style="margin-top: 0; color: #166534;">${scheme.name}</h2>
        <p>${scheme.description}</p>
        <p><strong>Benefits:</strong> ${scheme.benefits.description}</p>
      </div>
      <p>Log in to your dashboard to enroll in this scheme.</p>
      <br>
      <p>Best regards,<br>The Tracient Team</p>
    </div>
  `;
  
  if (worker.email) {
    return sendEmail({
      to: worker.email,
      subject: `You're Eligible: ${scheme.name}`,
      html
    });
  }
  
  return { success: true, skipped: true, reason: 'No email address' };
};

export default {
  initEmailService,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendPaymentNotification,
  sendAnomalyAlert,
  sendSchemeNotification
};
