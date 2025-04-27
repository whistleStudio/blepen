import { app, shell, BrowserWindow, ipcMain, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import cfgFile from "../../resources/app.cfg?asset"
const robot = require("robotjs")
const fs = require("fs")


let selectBleDevCallback = undefined
let timer_BleSearch = 0
let primaryServiceUUID, msgStartIdx

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    title: "蓝牙遥控映射助手",
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    icon,
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

let screenW, screenH
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // 获取主显示器的宽高
  const mainDisplay = screen.getPrimaryDisplay()
  screenW = mainDisplay.size.width;
  screenH = mainDisplay.size.height;

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  /* 模拟计算机操作 */
  ipcMain.on("r:mockCmd", (_, cmd) => {
    cmd = JSON.parse(cmd)
    console.log("get mockCmd:", cmd)
    setTimeout(() => {
      try{
        if (/鼠标/.test(cmd.label)) {
          mockMouse(cmd)
        } else robot.keyTap(cmd.value)
      } catch(e) {console.log(e)}
    }, 100)
  })

  /* 跳转网页 */
  ipcMain.on("r:jump", (_, href) => shell.openExternal(href))

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

solveCustomCfg()


/* 模拟计算机操作：鼠标行为 */
function mockMouse (cmd) {
  const curMousePos = robot.getMousePos()
  console.log(curMousePos)
  switch (true) {
    case /单击/.test(cmd.label):
      robot.mouseClick(cmd.value.toLowerCase())
      break
    case /双击/.test(cmd.label):
      robot.mouseClick("left", true)
      break
    case /滚轮向上/.test(cmd.label):
      robot.scrollMouse(0, 200)
      break
    case /滚轮向下/.test(cmd.label):
      robot.scrollMouse(0, -200)
      break
    case /鼠标左移/.test(cmd.label):
      if (curMousePos.x-30 >= 0)
        robot.moveMouseSmooth(curMousePos.x-30, curMousePos.y, 5)
      break
    case /鼠标右移/.test(cmd.label):
      if (curMousePos.x+30 <= screenW)
        robot.moveMouseSmooth(curMousePos.x+30, curMousePos.y, 5)
      break
    case /鼠标上移/.test(cmd.label):
      if (curMousePos.y-30 >= 0)
        robot.moveMouseSmooth(curMousePos.x, curMousePos.y-30, 5)
      break
    case /鼠标下移/.test(cmd.label):
      if (curMousePos.y+30 <= screenH)
        robot.moveMouseSmooth(curMousePos.x, curMousePos.y+30, 5)
      break
  }
}

/* 读取配置文件 */
function solveCustomCfg () {
  try {
    const buf = fs.readFileSync(cfgFile)
    const cfgStr = buf.toString()
    // console.log(cfgStr.split('\n'))
    for (let v of cfgStr.split('\n')) {
      v = v.replace(/[\r\n]/g, "").trim()
      switch(true) {
        case v[0]=='#' || v[0]=='//':
          break
        case /primaryServiceUUID/.test(v):
          primaryServiceUUID = v.split('=')[1]?.trim()
          console.log(primaryServiceUUID)
          // console.log(v.split('primaryServiceUUID:')[1])
          break
        case /msgStartIdx/.test(v):
          msgStartIdx = parseInt(v.split('=')[1]?.trim())
          console.log(msgStartIdx)
          break
      }
      // console.log(v)
    }
  } catch(e) {console.log(e)}
  process.env.primaryServiceUUID = primaryServiceUUID ? primaryServiceUUID : "Generic Access"
  process.env.msgStartIdx = msgStartIdx ? msgStartIdx : 0
}
