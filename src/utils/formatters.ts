import { format, formatDistanceToNow, parseISO } from 'date-fns';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (date: string): string => {
  return format(parseISO(date), 'MMM d, yyyy');
};

export const formatDateTime = (date: string): string => {
  return format(parseISO(date), 'MMM d, yyyy h:mm a');
};

export const formatTimeAgo = (date: string): string => {
  return formatDistanceToNow(parseISO(date), { addSuffix: true });
};

export const formatPhone = (phone: string = ''): string => {
  if (phone.startsWith('+91')) {
    const number = phone.slice(3);
    return `+91 ${number.slice(0, 5)} ${number.slice(5)}`;
  }
  return phone;
};

export const truncateId = (id: string, length = 8): string => {
  return id.slice(0, length).toUpperCase();
};
