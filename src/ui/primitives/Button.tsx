import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  className = '',
  type = 'button',
  ...rest
}) => {
  return (
    <button
      type={type}
      className={`aw-btn aw-btn-${variant} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
};
