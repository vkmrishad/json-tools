import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

export type AdPosition = 'header' | 'middle' | 'footer';

interface AdUnitProps {
  position?: AdPosition;
  type?: 'leaderboard' | 'rectangle' | 'banner';
  className?: string;
  slot?: string;
}

const AD_CONFIG: Record<AdPosition, { slot: string; width: number; height: number; comment: string }> = {
  header: {
    slot: '4224839518',
    width: 728,
    height: 90,
    comment: 'Header - JSONTools',
  },
  middle: {
    slot: '8298097262',
    width: 160,
    height: 160,
    comment: 'Middle - JSONTools',
  },
  footer: {
    slot: '4033267828',
    width: 728,
    height: 90,
    comment: 'Footer - JSONTools',
  },
};

const CLIENT_ID = 'ca-pub-3521551439702220';

export const AdUnit: React.FC<AdUnitProps> = ({
  position = 'header',
  className = '',
  slot,
}) => {
  const adRef = useRef<HTMLModElement>(null);
  const isPushed = useRef(false);

  const config = AD_CONFIG[position] || AD_CONFIG.header;
  const adSlot = slot || config.slot;

  useEffect(() => {
    // Only push once per mount cycle
    if (!isPushed.current && adRef.current) {
      try {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
        isPushed.current = true;
      } catch (err) {
        console.debug('AdSense push error (expected during dev or adblock):', err);
      }
    }
  }, []);

  const isMiddle = position === 'middle';

  return (
    <div
      className={`ad-unit ad-${position} ${isMiddle ? 'center-ad-wrapper' : ''} ${className}`}
      role="complementary"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        minHeight: config.height,
      }}
    >
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{
          display: 'inline-block',
          width: config.width,
          height: config.height,
        }}
        data-ad-client={CLIENT_ID}
        data-ad-slot={adSlot}
      />
    </div>
  );
};
