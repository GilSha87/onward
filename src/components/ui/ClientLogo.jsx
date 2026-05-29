import React from 'react';

export default function ClientLogo({ client, size }) {
  return (
    <span
      className={`client-logo ${size === 'lg' ? 'lg' : ''}`}
      style={{ background: client.color }}
    >
      {client.mono}
    </span>
  );
}
