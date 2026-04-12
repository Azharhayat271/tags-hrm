'use client';

import { useRouteChangeLoader } from '@/lib/hooks/client';

export function RouteChangeLoaderProvider() {
  useRouteChangeLoader();
  return null;
}
