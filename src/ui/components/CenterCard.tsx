import React from 'react';

interface CenterCardProps {
  children: React.ReactNode;
  className?: string;
}

const CenterCard: React.FC<CenterCardProps> = ({ children, className = '' }) => {
  return <div className={`center-card ${className}`.trim()}>{children}</div>;
};

export default CenterCard;
