import { execSync } from 'node:child_process';
import { wsManager } from '../ws/ws-manager.js';
import { createWSMessage } from '../ws/ws-protocol.js';

export interface DesktopNotification {
  title: string;
  message: string;
  icon?: string;
  sound?: boolean;
}

/** Send a desktop notification (Windows toast + WS broadcast) */
export function sendDesktopNotification(notification: DesktopNotification): void {
  // Broadcast to all connected WS clients
  wsManager.broadcast(createWSMessage('notification.info', 'desktop-notification', {
    type: 'desktop',
    title: notification.title,
    message: notification.message,
  }));

  // Windows toast notification via PowerShell
  try {
    const title = notification.title.replace(/'/g, "''");
    const message = notification.message.replace(/'/g, "''");
    const script = `
      [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
      [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null
      $template = @"
      <toast>
        <visual>
          <binding template="ToastGeneric">
            <text>${title}</text>
            <text>${message}</text>
          </binding>
        </visual>
      </toast>
"@
      $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
      $xml.LoadXml($template)
      $toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
      [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('FutureBox').Show($toast)
    `;
    execSync(`powershell -NoProfile -Command "${script.replace(/\n/g, ' ')}"`, {
      timeout: 10000,
      stdio: 'ignore',
    });
  } catch {
    // Toast failed — WS broadcast was still sent
  }
}
