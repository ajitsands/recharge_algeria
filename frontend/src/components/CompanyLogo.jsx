import React from 'react';

export default function CompanyLogo({ logo, size = 40 }) {
  if (logo) {
    return (
      <img
        src={logo}
        alt=""
        style={{ width: size, height: size, objectFit: 'contain', borderRadius: '8px', background: '#ffffff' }}
      />
    );
  }

  return (
    <svg viewBox="0 0 48 48" style={{ width: size, height: size }} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="24" cy="24" r="23" fill="#ffffff" />
      <path d="M24 4C13 4 4 13 4 24s9 20 20 20c3.2 0 6.2-.8 8.8-2.1-1.8.7-3.7 1.1-5.8 1.1-8.8 0-16-7.2-16-16s7.2-16 16-16c2.1 0 4 .4 5.8 1.1C30.2 4.8 27.2 4 24 4z" fill="#008744" />
      <polygon points="32,16 34.5,21.5 40.5,22 36,26 37.5,32 32,29 26.5,32 28,26 23.5,22 29.5,21.5" fill="#d21034" />
    </svg>
  );
}
