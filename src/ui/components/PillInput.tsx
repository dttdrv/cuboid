import React from 'react';

interface PillInputProps {
  id: string;
  type?: string;
  value: string;
  placeholder?: string;
  autoFocus?: boolean;
  onChange: (value: string) => void;
  errorText?: string | null;
}

const PillInput: React.FC<PillInputProps> = ({
  id,
  type = 'text',
  value,
  placeholder,
  autoFocus,
  onChange,
  errorText
}) => {
  return (
    <div>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
        className="input-field"
      />
      <span className="input-error-slot">{errorText || ' '}</span>
    </div>
  );
};

export default PillInput;
