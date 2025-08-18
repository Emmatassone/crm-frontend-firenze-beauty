'use client';

import { useEffect, useState } from 'react';

export default function HydrationDebugger() {
  const [hydrationInfo, setHydrationInfo] = useState<any>({
    isClient: false,
    hasWindow: false,
    localStorage: 'N/A',
    hydrationTime: null
  });

  useEffect(() => {
    const startTime = Date.now();
    
    const info = {
      isClient: true,
      hasWindow: typeof window !== 'undefined',
      localStorage: typeof window !== 'undefined' ? 
        localStorage.getItem('auth-storage') : 'N/A',
      hydrationTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
    
    console.log('🔍 [HYDRATION DEBUG] Client hydration complete:', info);
    setHydrationInfo(info);
  }, []);

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: 'rgba(0,0,255,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>🔍 Hydration Debug</div>
      <pre style={{ margin: 0, fontSize: '10px' }}>
        {JSON.stringify(hydrationInfo, null, 2)}
      </pre>
    </div>
  );
}
