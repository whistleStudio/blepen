<template>
  <!-- <img alt="logo" class="logo" src="./assets/electron.svg" />
  <div class="creator">Powered by electron-vite</div>
  <div class="text">
    Build an Electron app with
    <span class="vue">Vue</span>
  </div>
  <p class="tip">Please try pressing <code>F12</code> to open the devTool</p>
  <div class="actions">
    <div class="action">
      <a href="https://electron-vite.org/" target="_blank" rel="noreferrer">Documentation</a>
    </div>
    <div class="action">
      <a target="_blank" rel="noreferrer" @click="ipcHandle">Send IPC</a>
    </div>
  </div> -->
  <!-- <Versions /> -->
  <button @click="ipcHandle">Send IPC</button>
  <a-alert class="alert" :message="alertInfo.msg" :type="alertInfo.tp" show-icon v-show="alertInfo.isShow"/>
  <div class="menu">
    <a-input v-model:value="bleName" placeholder="请输入蓝牙名称" class="ipBleName"
    />
    <!-- <a-select ref="select"  style="width: 120px" placeholder="请选择"
      @focus="focus" @select="bleSelectChange" @dropdownVisibleChange="dropdownChange">
      <a-select-option v-for="(v, i) in bleDevs" :key="i" :value="v.deviceName">{{ v.deviceName }}</a-select-option>
    </a-select> -->

    <a-button type="primary" :loading="connectSta==1" @click="connectBtnClick(connectSta)">{{ connectSta==2 ? "已":"" }}连接</a-button>
  </div>

  

</template>

<script setup>
// import Versions from './components/Versions.vue'
import { ref, reactive } from 'vue'

const ipcHandle = () => window.electron.ipcRenderer.send('ping')
const bleDevs = ref([]) // 下拉列表展示的蓝牙设备
const connectSta = ref(0)
const bleName = ref("")
const alertInfo = reactive({
  isShow: false,
  msg: "",
  tp: "info", //success info warning error
})

let isBleRefresh = true
let curBleDevs  = [] // 当前发现的蓝牙设备
let bleSelcted = undefined

function bleSelectChange (v, opt) {
  try {
    bleSelcted = bleDevs.value[opt.key]
  } catch (e) {console.log("bleSelect err")}
  console.log(bleSelcted.deviceId, "----", opt.key)
}
let bleDev
// async function dropdownChange (ev) {
//   if (ev) {
//     isBleRefresh = false
//     bleDevs.value = curBleDevs // 下拉打开时更新蓝牙设备列表，避免动态刷新
//     // window.electron.ipcRenderer.send("searchBle")
//     try {
//         d = await navigator.bluetooth.requestDevice({
//           filters: [{ namePrefix: 'CFun' }]
//           // acceptAllDevices: true,
//           // optionalServices: ['generic_access']
//         });
//         console.log("....", d)
//       } catch (error) {
//         console.error('请求设备失败:', error);
//       }
//   } else isBleRefresh = true
// }

// window.electron.ipcRenderer.on("m:bleDevsFound", (_, args) => {
//   // console.log(args)
//   curBleDevs = args
// })

function connectBtnClick (staCode) {
  switch (staCode) {
    case 0:
      if (bleName.value.trim()) {
        connectSta.value = 1
        ;(async ()=> {
          try {
            bleDev = await navigator.bluetooth.requestDevice({filters: [{ name: bleName.value }]})
            console.log("⭐", bleDev)
            // const res = await window.electron.ipcRenderer.invoke("r:connectBle", bleSelcted.deviceId)
            // console.log(res, "⭐",d)
            bleDev.addEventListener('gattserverdisconnected', onDisconnectEvent)
            connectSta.value = 2
          } catch (e) {console.log("connect err:", e); changeAlertInfo("为搜索到目标设备", "error"); connectSta.value = 0}
        })()
      } else changeAlertInfo("蓝牙名称不能为空", "warning")
      break
    case 2:
      // navigator.bluetooth.requestDevice({filters: [{ name: bleName.value }]})
      // window.electron.ipcRenderer.invoke("r:connectBle", "")
      console.log(bleDev.gatt.connected)
      if (bleDev && bleDev.gatt.connected) bleDev.gatt.disconnect()
      console.log(bleDev.gatt.connected)
      connectSta.value = 0
      break
    default:
      console.log("断开连接")
  }
}

const onDisconnectEvent = () => {
  changeAlertInfo("蓝牙已断开", "info")
  connectSta.value = 0
  bleDev.removeEventListener('gattserverdisconnected', onDisconnectEvent)
}
// async function requestBluetoothDevice() {
//       try {
//         const device = await navigator.bluetooth.requestDevice({
//           acceptAllDevices: true,
//           optionalServices: ['generic_access']
//         });
//         this.connectToDevice(device);
//       } catch (error) {
//         console.error('请求设备失败:', error);
//       }
//     }
//     async function connectToDevice(device) {
//       if (!device) return;
//       try {
//         const server = await device.gatt.connect();
//         const service = await server.getPrimaryService('generic_access');
//         const characteristics = await service.getCharacteristics();
//         console.log('设备特性:', characteristics);
//         this.devices.push({
//           name: device.name,
//           id: device.id
//         });
//       } catch (error) {
//         console.error('连接设备失败:', error);
//       }
//     }

let timer_alert = 0
function changeAlertInfo(msg="", tp="info", isShow=true) {
  clearTimeout(timer_alert)
  console.log("changeAlertInfo")
  if (isShow) {
    alertInfo.isShow = true; alertInfo.msg = msg; alertInfo.tp = tp;
    setTimeout(() => {alertInfo.isShow=false}, 1000)
  } else alertInfo.isShow = false
}
</script>

<style lang="scss">
.alert {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 50%;
  top: 10px;
  z-index: 2;
}
.ipBleName {
  width: 200px;
  // background-color: #fff !important;
}
</style>