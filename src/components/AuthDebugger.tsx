'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '../lib/store/auth';

export default function AuthDebugger() {
  const { token, email, level, isAdmin, isTokenValid } = useAuthStore();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const updateDebugInfo = () => {
      const info = {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        tokenStart: token?.substring(0, 30) + '...' || 'null',
        email,
        level,
        isAdmin,
        isTokenValid: token ? isTokenValid() : false,
        localStorage: typeof window !== 'undefined' ? 
          localStorage.getItem('auth-storage') : 'N/A (SSR)',
        timestamp: new Date().toISOString()
      };
      setDebugInfo(info);
    };

    updateDebugInfo();
    
    // Update debug info every 5 seconds
    const interval = setInterval(updateDebugInfo, 5000);
    
    return () => clearInterval(interval);
  }, [token, email, level, isAdmin, isTokenValid]);

  // Only show in development or when specifically enabled
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      maxWidth: '300px',
      wordBreak: 'break-all'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>🔍 Auth Debug</div>
      <pre style={{ margin: 0, fontSize: '10px' }}>
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  );
}
