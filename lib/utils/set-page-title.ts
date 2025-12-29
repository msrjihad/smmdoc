'use client';

export function setPageTitle(pageTitle: string, appName: string) {
  if (typeof document !== 'undefined') {
    document.title = `${pageTitle} — ${appName}`;
  }
}