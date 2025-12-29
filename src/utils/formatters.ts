import { format, formatDistanceToNow } from 'date-fns';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

const createUtcDate = (dateString: string): Date => {
  if (!dateString) {
    return new Date(NaN); // Return an invalid date for invalid input
  }
  // If the date string doesn't end with 'Z', append it to ensure it's parsed as UTC.
  const correctedDateString = dateString.endsWith('Z') ? dateString : `${dateString}Z`;
  return new Date(correctedDateString);
}

export const formatDate = (date: string): string => {
  const d = createUtcDate(date);
  if (isNaN(d.getTime())) return "Invalid date";
  return format(d, 'MMM d, yyyy');
};

export const formatDateTime = (date: string): string => {
  const d = createUtcDate(date);
  console.log('####### dd', d, date)
  if (isNaN(d.getTime())) return "Invalid date";
  return format(d, 'MMM d, yyyy h:mm a');
};

export const formatTimeAgo = (date: string): string => {
  const d = createUtcDate(date);
  if (isNaN(d.getTime())) return "";
  return formatDistanceToNow(d, { addSuffix: true });
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
