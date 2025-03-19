import { app, BrowserWindow, dialog, ipcMain, Notification } from 'electron';
import * as path from 'path';
import * as log from 'electron-log';
import { autoUpdater } from 'electron-updater';

if (require('electron-squirrel-startup')) {
    app.quit();
}

log.transports.file.level = 'info';
autoUpdater.logger = log;
autoUpdater.autoDownload = true;
const UPDATE_CHECK_INTERVAL = 60000 * 60; // 1 hour

let mainWindow: BrowserWindow | null = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: true,
        },
        icon: path.join(__dirname, '../assets/icon.png')
    });
    
    mainWindow.loadURL('https://client.pushover.net/');
    
    // if (process.env.NODE_ENV === 'development') {
        console.log(process.env.NODE_ENV);
        mainWindow.webContents.openDevTools({
            mode: 'detach'
        });
    // }
    
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    createWindow();
    
    if (process.env.NODE_ENV === 'production' || !process.env.NODE_ENV) {
        checkForUpdates();
    }
    
    app.on('activate', () => {
        if (mainWindow === null) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.handle('show-notification', async (_, notificationData) => {
    const { title, body, icon } = notificationData;
    
    try {
        new Notification({
            title,
            body,
            icon: icon || path.join(__dirname, '../assets/icon.png')
        }).show();
        
        return { success: true };
    } catch (error) {
        console.error('Notification error:', error);
        return { success: false, error: (error as Error).message };
    }
});

async function checkForUpdates() {
    try {
        log.info('Checking for updates...');
        await autoUpdater.checkForUpdates();
    } catch (error) {
        log.error('Error checking for updates:', error);
    }
}

// Set up auto-updater events
autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...');
    sendStatusToWindow('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info);
    sendStatusToWindow('Update available');
    
    if (mainWindow) {
        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Update Available',
            message: `Version ${info.version} is available. Do you want to download it now?`,
            buttons: ['Yes', 'No'],
            defaultId: 0
        }).then((result) => {
            if (result.response === 0) {
                autoUpdater.downloadUpdate();
            }
        });
    }
});

autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available:', info);
    sendStatusToWindow('Update not available');
});

autoUpdater.on('error', (err) => {
    log.error('Error in auto-updater:', err);
    sendStatusToWindow(`Error in auto-updater: ${err.message}`);
});

autoUpdater.on('download-progress', (progressObj) => {
    const logMessage = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`;
    log.info(logMessage);
    sendStatusToWindow(logMessage);
});

autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info);
    sendStatusToWindow('Update downloaded');
    
    if (mainWindow) {
        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Update Ready',
            message: 'A new version has been downloaded. Restart the application to apply the updates.',
            buttons: ['Restart', 'Later'],
            defaultId: 0
        }).then((result) => {
            if (result.response === 0) {
                autoUpdater.quitAndInstall();
            }
        });
    }
});

// Function to send status to renderer
function sendStatusToWindow(text: string) {
    log.info(text);
    if (mainWindow) {
        mainWindow.webContents.send('update-status', text);
    }
}

// Make auto-update functions available via IPC
ipcMain.handle('check-for-updates', async () => {
    try {
        await checkForUpdates();
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
});
