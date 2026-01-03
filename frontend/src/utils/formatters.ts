import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';

// Currency formatter for INR
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Format large numbers in Indian system (lakhs, crores)
export const formatIndianNumber = (num: number): string => {
  if (num >= 10000000) {
    return `${(num / 10000000).toFixed(2)} Cr`;
  }
  if (num >= 100000) {
    return `${(num / 100000).toFixed(2)} L`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(2)} K`;
  }
  return num.toFixed(2);
};

// Format compact number
export const formatCompactNumber = (num: number): string => {
  return new Intl.NumberFormat('en-IN', {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(num);
};

// Date formatters
export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return 'Invalid date';
  return format(d, 'dd MMM yyyy');
};

export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return 'Invalid date';
  return format(d, 'dd MMM yyyy, hh:mm a');
};

export const formatRelativeTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return 'Invalid date';
  return formatDistanceToNow(d, { addSuffix: true });
};

export const formatShortDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return 'Invalid date';
  return format(d, 'dd/MM/yyyy');
};

export const formatMonthYear = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return 'Invalid date';
  return format(d, 'MMM yyyy');
};

// Percentage formatter
export const formatPercentage = (value: number, decimals = 1): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
};

// Phone number formatter (Indian)
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
};

// Mask Aadhaar (show only last 4 digits)
export const maskAadhaar = (aadhaar: string): string => {
  if (aadhaar.length < 4) return aadhaar;
  return `XXXX XXXX ${aadhaar.slice(-4)}`;
};

// Mask Phone number (show only last 4 digits)
export const maskPhone = (phone: string): string => {
  if (phone.length < 4) return phone;
  return `XXXXXX${phone.slice(-4)}`;
};

// Mask PAN (show only last 4 characters)
export const maskPAN = (pan: string): string => {
  if (pan.length < 4) return pan;
  return `XXXXXX${pan.slice(-4)}`;
};

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// Format duration in seconds to readable
export const formatDuration = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

// Format uptime percentage
export const formatUptime = (uptime: number): string => {
  return `${(uptime * 100).toFixed(2)}%`;
};

// Format number with locale
export const formatNumber = (num: number): string => {
  return num.toLocaleString('en-IN');
};
