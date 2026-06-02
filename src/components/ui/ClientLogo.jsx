import React from 'react';

export default function ClientLogo({ client, size }) {
  const cls = `client-logo${size === 'lg' ? ' lg' : ''}`;
  if (client.logoUrl) {
    return (
      <span className={cls} style={{ background: client.color, overflow: 'hidden', padding: 0 }}>
        <img
          src={client.logoUrl}
          alt={client.name}
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
        />
      </span>
    );
  }
  return (
    <span className={cls} style={{ background: client.color }}>
      {client.mono}
    </span>
  );
}
