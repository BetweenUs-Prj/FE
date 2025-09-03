import React from 'react';

interface PixelFormGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const PixelFormGroup: React.FC<PixelFormGroupProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`form-group ${className}`}>
      {children}
    </div>
  );
};

interface PixelLabelProps {
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
}

export const PixelLabel: React.FC<PixelLabelProps> = ({ 
  children, 
  htmlFor, 
  required = false,
  className = '' 
}) => {
  return (
    <label htmlFor={htmlFor} className={`form-label ${className}`}>
      {children}
      {required && <span style={{ color: '#e76f51' }}> *</span>}
    </label>
  );
};

interface PixelInputProps {
  type?: 'text' | 'password' | 'email' | 'number' | 'tel';
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  name?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  maxLength?: number;
}

export const PixelInput: React.FC<PixelInputProps> = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  name,
  id,
  disabled = false,
  required = false,
  className = '',
  maxLength
}) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      name={name}
      id={id}
      disabled={disabled}
      required={required}
      maxLength={maxLength}
      className={`form-input ${className}`}
    />
  );
};

interface PixelSelectProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  name?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const PixelSelect: React.FC<PixelSelectProps> = ({
  value,
  onChange,
  name,
  id,
  disabled = false,
  required = false,
  className = '',
  children
}) => {
  return (
    <select
      value={value}
      onChange={onChange}
      name={name}
      id={id}
      disabled={disabled}
      required={required}
      className={`form-input ${className}`}
    >
      {children}
    </select>
  );
};