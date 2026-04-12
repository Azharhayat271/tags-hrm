'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLoading } from './LoadingContext';

export function useRouteChangeLoader() {
  const router = useRouter();
  const { startLoading, stopLoading } = useLoading();
  const hideTimeoutRef = useRef<NodeJS.Timeout>();
  const navigationTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      // Only show loader for internal links
      if (link && link.href && !link.href.includes('javascript:')) {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('#')) {
          startLoading('Loading...');
          
          // Safety timeout to hide loader after 5 seconds if page doesn't load
          navigationTimeoutRef.current = setTimeout(() => {
            stopLoading();
          }, 5000);
        }
      }
    };

    // Add click listener to document
    document.addEventListener('click', handleClick, true);

    // Hide loader when page becomes visible (after navigation completes)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Clear the safety timeout
        if (navigationTimeoutRef.current) {
          clearTimeout(navigationTimeoutRef.current);
        }
        
        // Small delay to ensure page has rendered
        hideTimeoutRef.current = setTimeout(() => {
          stopLoading();
        }, 300);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      if (navigationTimeoutRef.current) clearTimeout(navigationTimeoutRef.current);
    };
  }, [startLoading, stopLoading]);
}
