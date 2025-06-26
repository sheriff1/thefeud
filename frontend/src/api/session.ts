import socket from '../utils/socket';

// Fallback HTTP validation function
async function validateSessionIdHttp(sessionId: string): Promise<boolean> {
  try {
    const backendUrl = import.meta.env.VITE_API_BASE || 'http://localhost:4000';
    const response = await fetch(`${backendUrl}/api/session-exists/${sessionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.exists;
  } catch (error) {
    console.error('HTTP session validation failed:', error);
    throw error;
  }
}

export function validateSessionId(sessionId: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    let resolved = false;
    
    // Set a longer timeout to allow for socket connection
    const timeout = setTimeout(() => {
      if (!resolved) {
        console.error('Socket timeout when validating session:', sessionId);
        console.log('Falling back to HTTP validation...');
        
        // Fallback to HTTP API
        validateSessionIdHttp(sessionId)
          .then((exists) => {
            if (!resolved) {
              resolved = true;
              resolve(exists);
            }
          })
          .catch((error) => {
            if (!resolved) {
              resolved = true;
              reject(new Error(`Both socket and HTTP validation failed: ${error.message}`));
            }
          });
      }
    }, 8000);
    
    // Function to attempt validation
    const attemptValidation = () => {
      if (resolved) return;
      
      socket.emit('validate-session', { sessionId }, (response: { exists: boolean }) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);
        resolve(response.exists);
      });
    };
    
    // Check if socket is already connected
    if (socket.connected) {
      attemptValidation();
    } else {
      // Wait for connection then validate
      const onConnect = () => {
        socket.off('connect', onConnect);
        attemptValidation();
      };
      
      // Also handle connection errors
      const onError = (error: any) => {
        if (resolved) return;
        console.error('Socket connection error:', error);
        socket.off('connect', onConnect);
        socket.off('connect_error', onError);
        
        // Don't reject immediately, let the timeout handle fallback to HTTP
        console.log('Socket connection failed, waiting for HTTP fallback...');
      };
      
      socket.on('connect', onConnect);
      socket.on('connect_error', onError);
    }
  });
}
