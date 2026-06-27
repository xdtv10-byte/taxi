'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import type { LeafletMapInnerProps } from './LeafletMapInner';

const LeafletMapInner = dynamic(() => import('./LeafletMapInner'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-xl bg-card">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  ),
}) as ComponentType<LeafletMapInnerProps>;

export function LeafletMap(props: LeafletMapInnerProps) {
  return <LeafletMapInner {...props} />;
}
