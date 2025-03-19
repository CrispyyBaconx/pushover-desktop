import { contextBridge, ipcRenderer } from 'electron';

// Override the browser's Notification API
const originalNotification = window.Notification;

// Store the function to check if it's already been patched
let isNotificationPatched = false;

// Intercept notifications when the DOM is fully loaded
window.addEventListener('DOMContentLoaded', () => {
    if (!isNotificationPatched) {
        // Override the browser's Notification class
        // @ts-ignore - we're intentionally overriding the Notification class
        window.Notification = function(title: string, options: NotificationOptions) {
            // Still create the browser notification if needed (might be required for Pushover functionality)
            const browserNotification = new originalNotification(title, options);
            
            // But also send to Electron for a system notification using invoke
            ipcRenderer.invoke('show-notification', {
                title,
                body: options?.body || '',
                icon: options?.icon || ''
            }).catch(err => {
                console.error('Error showing system notification:', err);
            });
            
            // Return the browser notification to maintain expected behavior
            return browserNotification;
        };
        
        // Copy over static properties and prototype
        window.Notification.requestPermission = originalNotification.requestPermission;
        window.Notification.prototype = originalNotification.prototype;
        
        isNotificationPatched = true;
    }
    
    // Add initNotifications to the Pushover object when it's available
    const addPushoverInitFn = () => {
        if (window.Pushover) {
            // Add the initNotifications function to the Pushover object
            window.Pushover.initNotifications = (skipPermissionCheck: boolean = false) => {
                console.log('Initializing notifications in Electron context');
                
                // Always return granted permission since we're in Electron
                if (typeof Notification.requestPermission === 'function') {
                    Notification.requestPermission().then(permission => {
                        console.log('Notification permission:', permission);
                        // Simulate successful initialization
                        if (window.Pushover && typeof window.Pushover.initializePushoverClient === 'function') {
                            window.Pushover.initializePushoverClient();
                        }
                    });
                } else {
                    // For older browsers
                    const permission = Notification.permission;
                    console.log('Notification permission (static):', permission);
                    // Simulate successful initialization
                    if (window.Pushover && typeof window.Pushover.initializePushoverClient === 'function') {
                        window.Pushover.initializePushoverClient();
                    }
                }
                
                return true;
            };
            
            console.log('Added initNotifications function to Pushover object');
        } else {
            // If Pushover is not available yet, retry after a delay
            setTimeout(addPushoverInitFn, 100);
        }
    };
    
    // Start trying to add the function
    addPushoverInitFn();
});

// Expose safe APIs to the renderer process using contextBridge
contextBridge.exposeInMainWorld('electronAPI', {
    // Modern approach using invoke, which returns a Promise
    showNotification: (title: string, body: string, icon?: string) => {
        return ipcRenderer.invoke('show-notification', { title, body, icon });
    }
});

// TypeScript interface declaration for the Pushover object
declare global {
    interface Window {
        Pushover: any;
        Notification: any;
    }
}

