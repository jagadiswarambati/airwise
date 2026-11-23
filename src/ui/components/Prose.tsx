import React from 'react';

interface ProseProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Text wrapper that restricts prose width to 70ch with comfortable reading typography.
 */
export const Prose: React.FC<ProseProps> = ({ children, className = '' }) => {
  return <div className={`aw-prose ${className}`.trim()}>{children}</div>;
};
