import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateExpiryDate(issue_date: string, duration_months: number): string {
  const date = new Date(issue_date);
  date.setMonth(date.getMonth() + duration_months);
  date.setDate(date.getDate() - 1);
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${month}/${day}/${year}`;
}

export function formatDate(date: string): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateDB(date: string): string {
  if (!date) return '';
  const parts = date.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[0]}-${parts[1]}`;
  }
  return date;
}

export function daysUntilExpiry(expiry_date: string): number {
  const expiry = new Date(expiry_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = expiry.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
}

const WHATSAPP_TEMPLATE_KEY = 'whatsapp-global-template-v1';

export const DEFAULT_WHATSAPP_TEMPLATE = `Namaste {customer_name}, your fire extinguisher certificate {certificate_no} {timing} ({expiry_date}). Please contact {shop} for renewal.`;

export function getWhatsAppTemplate(): string {
  if (typeof window === 'undefined') return DEFAULT_WHATSAPP_TEMPLATE;
  try {
    const stored = localStorage.getItem(WHATSAPP_TEMPLATE_KEY);
    return stored || DEFAULT_WHATSAPP_TEMPLATE;
  } catch {
    return DEFAULT_WHATSAPP_TEMPLATE;
  }
}

export function setWhatsAppTemplate(template: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(WHATSAPP_TEMPLATE_KEY, template);
}

export function getWhatsAppRenewalLink(params: {
  customer_name: string;
  certificate_no: string;
  mobile: string;
  expiry_date: string;
  days_left: number;
  shop_name?: string;
  shop_phone?: string;
  template?: string;
}): string {
  const digits = params.mobile.replace(/\D/g, '');
  const phone = digits.length > 10 ? digits.slice(-10) : digits;
  if (!phone) return '#';

  const expiryFormatted = new Date(params.expiry_date).toLocaleDateString('en-GB');
  const timing =
    params.days_left < 0
      ? `expired ${Math.abs(params.days_left)} days ago`
      : params.days_left === 0
        ? 'expires today'
        : `expires in ${params.days_left} days`;

  const shop = params.shop_name || 'Rakesh Gas Suppliers';
  const shopPhone = params.shop_phone || '9377548793';

  const template = params.template || getWhatsAppTemplate();

  const message = template
    .replace(/\{customer_name\}/g, params.customer_name)
    .replace(/\{certificate_no\}/g, params.certificate_no)
    .replace(/\{expiry_date\}/g, expiryFormatted)
    .replace(/\{timing\}/g, timing)
    .replace(/\{days_left\}/g, String(params.days_left))
    .replace(/\{shop\}/g, shop);

  return `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
}
