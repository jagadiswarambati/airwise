import React, { useState } from 'react';
import { Icon } from '../icons';
import { announce } from './liveRegionAnnouncer';

export interface BriefingPreviewProps {
  briefingText: string;
  societyName?: string;
  className?: string;
}

export const BriefingPreview: React.FC<BriefingPreviewProps> = ({
  briefingText,
  className = '',
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  // Strip any accidental markdown asterisks or emoji just in case
  const cleanText = briefingText
    .replace(/\*/g, '')
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1FA00}-\u{1FAFF}]/gu, '');

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(cleanText);
      } else if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.value = cleanText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      announce('Daily clean-air briefing copied to clipboard.');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className={`aw-briefing-preview card ${className}`.trim()}>
      <div className="aw-briefing-preview-header">
        <span className="aw-briefing-label text-sm font-semibold">
          Message you can paste into your building's group chat
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="btn-secondary aw-briefing-copy-btn"
          aria-label="Copy plain text briefing to clipboard"
        >
          <Icon name={copied ? 'check' : 'copy'} size={16} aria-hidden="true" />
          <span>{copied ? 'Copied' : 'Copy briefing'}</span>
        </button>
      </div>

      <pre className="aw-briefing-preview-text" tabIndex={0} aria-label="Society clean-air briefing text">
        {cleanText}
      </pre>

      {copied && (
        <div
          role="status"
          className="box-highlight-emissions text-xs font-semibold mt-2"
        >
          Daily clean-air briefing copied to clipboard. Ready to paste into group chat.
        </div>
      )}
    </div>
  );
};

export default BriefingPreview;
