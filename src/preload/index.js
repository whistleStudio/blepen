import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import packageJson from '../../package.json'
// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('appVersion', packageJson.version)
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('cfg', {
      primaryServiceUUID: process.env.primaryServiceUUID,
      msgStartIdx: process.env.msgStartIdx
    })
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}


