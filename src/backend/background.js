'use strict'

import { app, protocol, BrowserWindow,ipcMain } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'
import * as path from "path";
import {ipcHandleInit} from "./v1/ipcProcess";
import {initIpcMain,setWin} from "./v3/bridge";
import {testIpcHandleInit} from "../test/backend/index";
import {fbu_config_init} from "./v1/config/config-center";



const isDevelopment = process.env.NODE_ENV !== 'production'


const current_env='prod';
const config={
  test:{
    preload:path.resolve(__dirname,'otherPreload.js')//构建完（dist）目录相对路径
  },
  prod:{
    preload:path.join(__dirname,'preload.js')
  }
};



//自定义协议
// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

async function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 1400,
    height: 800,
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
      preload:config[current_env].preload
    }
  })


  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }
  return win;
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
//` 发生在vue mounted 之后
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS3_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  // .v3 - 先注册监听事件 再设置窗体句柄，否则vue在窗体创建后便可执行mounted，而ipcMain未注册导致调用失败
  initIpcMain();
  //创建窗口
  let win=await createWindow();
  //let win1=await createWindow();

  //测试入口
  testIpcHandleInit(win);
  //. v1
  //主进程事件监听
  //ipcHandleInit(win);
  //配置初始化
  //fbu_config_init();
  //. v3
  setWin(win);


})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
