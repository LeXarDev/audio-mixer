const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let tray = null;

// Auto-start on Windows boot
let autoLauncher = null;
try {
    const AutoLaunch = require('auto-launch');
    autoLauncher = new AutoLaunch({
        name: 'MIC Processor Pro',
        path: app.getPath('exe'),
    });
} catch (e) {
    console.log('Auto-launch not available in dev mode');
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        frame: false,
        transparent: false,
        backgroundColor: '#0a0a0f',
        icon: path.join(__dirname, 'assets', 'icon.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        show: false
    });

    // Load from Vite dev server or production build
    if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
        mainWindow.loadURL('http://localhost:5173');
        // mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
    }

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Minimize to tray instead of closing
    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });

    // Handle minimize to tray
    mainWindow.on('minimize', () => {
        mainWindow.hide();
    });
}

function createTray() {
    // Create a simple colored icon
    const icon = createDefaultIcon();

    tray = new Tray(icon);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: '🎛️ Open MIC Processor Pro',
            click: () => {
                mainWindow.show();
                mainWindow.focus();
            }
        },
        { type: 'separator' },
        {
            label: '🔊 Audio Active',
            enabled: false
        },
        { type: 'separator' },
        {
            label: '⚙️ Start with Windows',
            type: 'checkbox',
            checked: false,
            click: async (menuItem) => {
                if (autoLauncher) {
                    if (menuItem.checked) {
                        await autoLauncher.enable();
                    } else {
                        await autoLauncher.disable();
                    }
                }
            }
        },
        { type: 'separator' },
        {
            label: '❌ Quit',
            click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }
    ]);

    // Check current autostart status
    if (autoLauncher) {
        autoLauncher.isEnabled().then((isEnabled) => {
            contextMenu.items[4].checked = isEnabled;
        }).catch(() => { });
    }

    tray.setToolTip('MIC Processor Pro');
    tray.setContextMenu(contextMenu);

    // Double-click to show window
    tray.on('double-click', () => {
        mainWindow.show();
        mainWindow.focus();
    });
}

function createDefaultIcon() {
    // Create a 16x16 purple icon
    const size = 16;
    const buffer = Buffer.alloc(size * size * 4);

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const i = (y * size + x) * 4;
            // Create a circular purple icon
            const cx = size / 2, cy = size / 2;
            const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
            if (dist < size / 2 - 1) {
                buffer[i] = 99;      // R
                buffer[i + 1] = 102; // G
                buffer[i + 2] = 241; // B
                buffer[i + 3] = 255; // A
            } else {
                buffer[i + 3] = 0;   // Transparent
            }
        }
    }

    return nativeImage.createFromBuffer(buffer, { width: size, height: size });
}

// IPC handlers for window controls
ipcMain.on('minimize-window', () => {
    if (mainWindow) mainWindow.minimize();
});

ipcMain.on('maximize-window', () => {
    if (mainWindow) {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    }
});

ipcMain.on('close-window', () => {
    if (mainWindow) mainWindow.hide();
});

// Device change notification (Plug and Play)
ipcMain.on('devices-changed', (event, devices) => {
    if (tray && devices.currentInput) {
        tray.setToolTip(`MIC Processor Pro\n🎤 ${devices.currentInput}`);
    }
});

// VST folder selection
ipcMain.handle('select-vst-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Select VST Plugins Folder',
        properties: ['openDirectory'],
        defaultPath: 'C:\\Program Files\\VSTPlugins'
    });

    if (result.canceled || result.filePaths.length === 0) {
        return null;
    }

    const folder = result.filePaths[0];

    // Scan for VST plugins
    let plugins = [];
    try {
        const files = fs.readdirSync(folder);
        plugins = files.filter(file =>
            file.endsWith('.vst3') ||
            file.endsWith('.dll') ||
            file.endsWith('.vst')
        );
    } catch (err) {
        console.error('Error scanning VST folder:', err);
    }

    return { folder, plugins };
});

app.whenReady().then(() => {
    createWindow();
    createTray();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
        }
    });
}
