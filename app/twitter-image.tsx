import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Newsroom AIOS - AI-Powered Local Newspaper Platform';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #3b82f6 100%)',
          padding: '60px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          <div
            style={{
              fontSize: '72px',
              fontWeight: 800,
              color: 'white',
              textAlign: 'center',
              lineHeight: 1.1,
              letterSpacing: '-2px',
            }}
          >
            Newsroom AIOS
          </div>
          <div
            style={{
              fontSize: '32px',
              fontWeight: 400,
              color: '#bfdbfe',
              textAlign: 'center',
              marginTop: '8px',
            }}
          >
            AI-Powered Local Newspaper Platform
          </div>
          <div
            style={{
              display: 'flex',
              gap: '24px',
              marginTop: '32px',
            }}
          >
            {['AI Content', 'Advertising', 'Directory', 'Subscriptions'].map(
              (item) => (
                <div
                  key={item}
                  style={{
                    color: 'white',
                    fontSize: '18px',
                    padding: '8px 20px',
                    borderRadius: '24px',
                    border: '1px solid rgba(255,255,255,0.3)',
                    background: 'rgba(255,255,255,0.1)',
                  }}
                >
                  {item}
                </div>
              )
            )}
          </div>
          <div
            style={{
              fontSize: '20px',
              color: '#93c5fd',
              marginTop: '24px',
            }}
          >
            Launch in Minutes — Keep 100% of Revenue
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
