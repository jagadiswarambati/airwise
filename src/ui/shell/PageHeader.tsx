import React from 'react';
import { Chip } from '../primitives';
import { Icon } from '../icons';

interface PageHeaderProps {
  title: string;
  description: string;
  isLowCostMode?: boolean;
  chips?: React.ReactNode;
}

/**
 * Standard PageHeader for every AirWise screen.
 * Provides h1 with tabIndex={-1} for router focus targeting,
 * a plain descriptive sentence, and an optional status chip row.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  isLowCostMode,
  chips,
}) => {
  return (
    <header className="aw-page-header">
      <div className="aw-page-header-text">
        <h1 tabIndex={-1} className="aw-page-title">
          {title}
        </h1>
        <p className="aw-page-description">{description}</p>
      </div>

      {(isLowCostMode || chips) && (
        <div className="aw-page-header-chips" role="status">
          {isLowCostMode && (
            <Chip
              label="Low-cost mode on"
              icon={<Icon name="emissions" size={16} aria-hidden="true" />}
              aria-label="Low-Cost Protection Mode active: recommendations use zero-cost or minimal equipment"
            />
          )}
          {chips}
        </div>
      )}
    </header>
  );
};
