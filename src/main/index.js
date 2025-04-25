import { app, shell, BrowserWindow, ipcMain, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
const robot = require("robotjs")

const BluetoothHciSocket = require('@stoprocent/bluetooth-hci-socket')
let selectBleDevCallback = undefined
let timer_BleSearch = 0

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  /* 检测指定蓝牙设备并选择 */
  mainWindow.webContents.on('select-bluetooth-device', (event, deviceList, callback) => {
    event.preventDefault() //important, otherwise first available device will be selected
    console.log(deviceList.length, "---", deviceList) //if you want to see the devices in the shell
    if (!selectBleDevCallback) {
      selectBleDevCallback = callback
      timer_BleSearch = setTimeout(() => {
        selectBleDevCallback("")
        console.log("search overtime")
        selectBleDevCallback = undefined
      }, 5000)
    }
    if (deviceList.length>0) {
      clearTimeout(timer_BleSearch)
      selectBleDevCallback = undefined
      callback(deviceList[0].deviceId)
    }
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}


app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // 获取主显示器的宽高
  const mainDisplay = screen.getPrimaryDisplay()
  const screenW = mainDisplay.size.width;
  const screenH = mainDisplay.size.height;

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  /* 模拟计算机操作 */
  ipcMain.on("r:mockCmd", (_, cmd) => {
    console.log("get mockCmd:", cmd)
    setTimeout(() => {
      try{
        robot.keyTap(cmd)
      } catch(e) {console.log(e)}
    }, 5000)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})


