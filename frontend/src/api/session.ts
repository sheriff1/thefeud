import socket from '../utils/socket';

export function validateSessionId(sessionId: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        reject(new Error('Socket timeout'));
      }
    }, 5000);
    socket.emit('validate-session', sessionId, (response: { exists: boolean }) => {
      resolved = true;
      clearTimeout(timeout);
      resolve(response.exists);
    });
  });
}
