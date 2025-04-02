import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string; // Make label optional
}

const Input: React.FC<InputProps> = ({ label, ...props }) => {
  return (
    <div className="input-container">
      {label && <label className="input-label">{label}</label>}
      <input className="input-field" {...props} />
    </div>
  );
};

export default Input;