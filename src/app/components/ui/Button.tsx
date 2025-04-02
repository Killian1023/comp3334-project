import React from 'react';

export interface ButtonProps {
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  onClick?: () => void;
  disabled?: boolean; // Added this property
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  type = 'button', 
  className = '', 
  onClick,
  disabled = false // Added this prop with default value
}) => {
  const baseClasses = 'px-4 py-2 rounded font-medium focus:outline-none transition-colors';
  const variantClasses = 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50';
  const disabledClasses = 'opacity-50 cursor-not-allowed';
  
  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses} ${disabled ? disabledClasses : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;