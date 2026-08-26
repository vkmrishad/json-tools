import React from 'react';

interface AdUnitProps {
  type: 'leaderboard' | 'rectangle' | 'banner';
  className?: string;
  slot?: string;
}

export const AdUnit: React.FC<AdUnitProps> = ({ type, className = '' }) => {
  const sizeClass = {
    leaderboard: 'ad-leaderboard',
    rectangle: 'ad-rectangle',
    banner: 'ad-banner',
  }[type];

  const sizeHint = {
    leaderboard: '728 × 90',
    rectangle: '300 × 250',
    banner: '970 × 90',
  }[type];

  return (
    <div className={`ad-unit ${sizeClass} ${className}`} role="complementary">
      <div className="ad-content">
        <div className="ad-placeholder-inner">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity={0.4}>
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <path d="M8 21h8M12 17v4"/>
          </svg>
          <span style={{ fontSize: 11, opacity: 0.6 }}>{sizeHint}</span>
        </div>
      </div>
    </div>
  );
};
