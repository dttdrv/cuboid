import React from 'react';

interface InlineNoticeProps {
  type: 'error' | 'success' | 'warn';
  message: string | null;
}

const classByType: Record<InlineNoticeProps['type'], string> = {
  error: 'inline-notice-error',
  success: 'inline-notice-success',
  warn: 'inline-notice-warn'
};

const InlineNotice: React.FC<InlineNoticeProps> = ({ type, message }) => {
  if (!message) return null;
  return <p className={classByType[type]}>{message}</p>;
};

export default InlineNotice;
