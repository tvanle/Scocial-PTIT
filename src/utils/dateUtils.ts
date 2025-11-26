import { Strings } from '../constants/strings';

export const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) {
    return Strings.common.justNow;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} ${Strings.common.minutesAgo}`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} ${Strings.common.hoursAgo}`;
  }

  const days = Math.floor(hours / 24);
  if (days === 1) {
    return Strings.common.yesterday;
  }

  if (days < 7) {
    return `${days} ${Strings.common.daysAgo}`;
  }

  // Format as date
  return formatDate(date);
};

export const formatDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatDateTime = (date: Date): string => {
  const formattedDate = formatDate(date);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${formattedDate} ${hours}:${minutes}`;
};

export const formatTime = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export const isYesterday = (date: Date): boolean => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
};

export const getRelativeDate = (dateString: string): string => {
  const date = new Date(dateString);

  if (isToday(date)) {
    return formatTime(date);
  }

  if (isYesterday(date)) {
    return `${Strings.common.yesterday} ${formatTime(date)}`;
  }

  return formatDateTime(date);
};

export default {
  formatTimeAgo,
  formatDate,
  formatDateTime,
  formatTime,
  isToday,
  isYesterday,
  getRelativeDate,
};
