import React from 'react';

export interface AudienceItem {
  title: string;
  description: string;
  focusPoint: string;
}

interface AudienceListProps {
  audiences: AudienceItem[];
  className?: string;
}

export const AudienceList: React.FC<AudienceListProps> = ({ audiences, className = '' }) => {
  return (
    <div className={`aw-audience-grid ${className}`.trim()}>
      {audiences.map((aud, idx) => (
        <article key={idx} className="aw-audience-card">
          <h3 className="aw-audience-title">{aud.title}</h3>
          <p className="aw-audience-desc">{aud.description}</p>
          <div className="aw-audience-focus">
            <span className="aw-audience-focus-label">Key focus:</span>{' '}
            <span>{aud.focusPoint}</span>
          </div>
        </article>
      ))}
    </div>
  );
};
