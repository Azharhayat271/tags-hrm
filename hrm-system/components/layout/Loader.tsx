'use client';

import { useLoading } from '@/lib/hooks/LoadingContext';
import styles from './Loader.module.css';

export default function Loader() {
  const { isLoading, message } = useLoading();

  if (!isLoading) return null;

  return (
    <div className={styles.loaderOverlay}>
      <div className={styles.loaderContainer}>
        <div className={styles.loader} />
        {message && <p className={styles.message}>{message}</p>}
      </div>
    </div>
  );
}
