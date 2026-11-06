import React from 'react';

export default function LanguageSelector({ lang, setLang, style = {} }) {
  return (
    <select
      aria-label="Language"
      title="Language"
      value={lang}
      onChange={(event) => setLang(event.target.value)}
      style={{
        padding: '8px 10px',
        border: '1px solid var(--border-subtle)',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
        ...style,
        colorScheme: 'light',
        backgroundColor: '#ffffff',
        color: '#111827'
      }}
    >
      <option value="en">English</option>
      <option value="fr">Français</option>
      <option value="ar">العربية</option>
    </select>
  );
}
