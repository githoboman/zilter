'use client';

import React from 'react';
import ProtocolDetails from './ProtocolDetails';

export default function TransferOwnership({ onSuccess }: { onSuccess?: (txHash: string) => void }) {
  // Replaced Stacks manual ownership transfer with BOT Chain Protocol Details & Deployment Info
  return <ProtocolDetails onSuccess={onSuccess} />;
}
