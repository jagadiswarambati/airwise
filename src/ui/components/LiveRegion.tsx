import React, { useState, useEffect } from 'react';
import {
  subscribeLiveRegion,
  getCurrentAnnouncement,
} from './liveRegionAnnouncer';

/**
 * Global polite live region component for screen reader announcements.
 */
export const LiveRegion: React.FC = () => {
  const [message, setMessage] = useState<string>(getCurrentAnnouncement);

  useEffect(() => {
    return subscribeLiveRegion((msg) => {
      setMessage(msg);
    });
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      data-testid="live-region"
    >
      {message}
    </div>
  );
};
