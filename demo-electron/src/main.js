const { app, BrowserWindow,ipcMain } = require('electron')
const  path=require('path');



const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    })
    ipcMain.handle('ping', () => 'pong')
    win.loadFile(path.join(__dirname,'ui/index.html'))
}

app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {//避免重复创建窗口
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});