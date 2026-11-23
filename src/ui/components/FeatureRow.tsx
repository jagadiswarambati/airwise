import React from 'react';
import { Icon, IconName } from '../icons';

export interface FeatureItem {
  icon: IconName;
  title: string;
  description: string;
}

interface FeatureRowProps {
  features: FeatureItem[];
  className?: string;
}

export const FeatureRow: React.FC<FeatureRowProps> = ({ features, className = '' }) => {
  return (
    <div className={`aw-feature-grid ${className}`.trim()}>
      {features.map((feature, idx) => (
        <article key={idx} className="aw-feature-card">
          <div className="aw-feature-icon-wrapper" aria-hidden="true">
            <Icon name={feature.icon} size={24} />
          </div>
          <div className="aw-feature-body">
            <h3 className="aw-feature-title">{feature.title}</h3>
            <p className="aw-feature-description">{feature.description}</p>
          </div>
        </article>
      ))}
    </div>
  );
};
