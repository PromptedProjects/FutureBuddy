import { captureScreen } from '../../services/screen.service.js';
import { wsManager } from '../ws-manager.js';
import { createWSMessage } from '../ws-protocol.js';

/** Handle screen capture request over WS */
export function handleScreenCapture(sessionId: string, msgId: string, payload: { display_id?: number }): void {
  try {
    const image = captureScreen(payload.display_id);
    wsManager.send(sessionId, createWSMessage('screen.frame', msgId, {
      image,
      format: 'png',
      encoding: 'base64',
    }));
  } catch (err) {
    wsManager.send(sessionId, createWSMessage('chat.error', msgId, {
      error: err instanceof Error ? err.message : 'Screen capture failed',
    }));
  }
}
