import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 192, height: 192 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
          borderRadius: '32px',
        }}
      >
        <div
          style={{
            fontSize: '96px',
            fontWeight: 800,
            color: 'white',
            letterSpacing: '-4px',
          }}
        >
          NA
        </div>
      </div>
    ),
    { ...size }
  );
}
