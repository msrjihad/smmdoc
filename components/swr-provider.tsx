'use client';
import * as React from 'react';
import { SWRConfig } from 'swr';

export const SWRProvider = ({ children }: { children: React.ReactNode }) => {
  return <SWRConfig>{children}</SWRConfig>;
};
