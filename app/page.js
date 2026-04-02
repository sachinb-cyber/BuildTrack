'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function Root() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [isEntering, setIsEntering] = useState(false);

  useEffect(() => {
    // Simulate loading environment
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setReady(true);
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  const handleEnterWorkspace = () => {
    setIsEntering(true);
    setTimeout(() => {
      router.replace(user ? '/dashboard' : '/login');
    }, 800);
  };

  return (
    <div className={`${styles.splashContainer} ${isEntering ? styles.fadeScaleOut : ''}`}>
      <div className={styles.splashContent}>
        {/* Animated Brand Concept */}
        <div className={styles.brandIconWrapper}>
          <div className={styles.brandIconRing1}></div>
          <div className={styles.brandIconRing2}></div>
          <div className={styles.brandIconCenter}></div>
        </div>
        
        <h1 className={styles.splashTitle}>Samarth OS</h1>
        <p className={styles.splashSubtitle}>Enterprise Management Suite</p>

        <div className={styles.loadingSection}>
          {!ready ? (
            <div className={styles.progressWrapper}>
              <div 
                className={styles.progressBar} 
                style={{ width: `${progress}%` }}
              ></div>
              <div className={styles.progressStatus}>
                <span>Initializing Environment...</span>
                <span>{progress}%</span>
              </div>
            </div>
          ) : (
            <button 
              className={styles.enterButton}
              onClick={handleEnterWorkspace}
              disabled={authLoading}
            >
              <span>{authLoading ? 'Authenticating...' : 'Enter Workspace'}</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {/* Structural Ambient Background */}
      <div className={styles.ambientLight}></div>
    </div>
  );
}
