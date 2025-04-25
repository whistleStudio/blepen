<template>
  <!-- <Versions /> -->
  <button @click="ipcHandle">Send IPC</button>
  <a-alert class="alert" :message="alertInfo.msg" :type="alertInfo.tp" show-icon v-if="alertInfo.isShow"/>
  <div class="menu">
    <a-input v-model:value="bleName" placeholder="请输入蓝牙名称" class="ipBleName"
    :disabled="connectBtnSta.code>0" :class="{'disabled-bgc': connectBtnSta.code>0}"
    />
    <a-button type="primary" :loading="connectBtnSta.code==1" @click="connectBtnClick">{{ connectBtnSta.code==2 ? "断开":"" }}连接</a-button>

    <ul class="ulCmdMap">
      <li v-for="(v, i) in cmdMap">
        <a-checkbox v-model:checked="v.checked"></a-checkbox>
        <a-input class="ipBleMsg" v-model:value="v.bleMsg" placeholder="接收语句" :key="v"/>
        ➡️ &nbsp;
        <a-select v-model:value="v.val" :options="v.cmds"  size="middle"  style="width: 200px"></a-select>
      </li>
    </ul>

    <a-button @click="testBtnClick">test</a-button>
  </div>

  

</template>

<script setup>
// import Versions from './components/Versions.vue'
import { ref, reactive, onBeforeUnmount } from 'vue'
import codeMap from './assets/docs/code-map'

const ipcHandle = () => window.electron.ipcRenderer.send('ping')
const bleName = ref("CFun001")
const alertInfo = reactive({
  isShow: false,
  msg: "",
  tp: "info", //success info warning error
})
const connectBtnSta = reactive({ code: 0, text: "连接"})
const cmdMap = reactive([
  {checked: false, bleMsg: "", cmds: codeMap.map(v => ({value: v[0], label: v[1]})), val: "A"},
  {checked: false, bleMsg: "", cmds: codeMap.map(v => ({value: v[0], label: v[1]})), val: "A"},
  {checked: false, bleMsg: "", cmds: codeMap.map(v => ({value: v[0], label: v[1]})), val: "A"},
  {checked: false, bleMsg: "", cmds: codeMap.map(v => ({value: v[0], label: v[1]})), val: "A"},
  {checked: false, bleMsg: "", cmds: codeMap.map(v => ({value: v[0], label: v[1]})), val: "A"}
]) 

let primaryServiceUUID = "55535343-fe7d-4ae5-8fa9-9fafd205e455"
let bleDev

function connectBtnClick () {
  let bleGatt, errMsg=""
  switch (connectBtnSta.code) {
    case 0:
      if (bleName.value.trim()) {
        connectBtnSta.code = 1
        bleConnect(bleGatt, errMsg)
      } else changeAlertInfo("蓝牙名称不能为空", "warning")
      break
    case 2:
      // navigator.bluetooth.requestDevice({filters: [{ name: bleName.value }]})
      // window.electron.ipcRenderer.invoke("r:connectBle", "")
      console.log(bleDev.gatt.connected)
      if (bleDev && bleDev.gatt.connected) bleDev.gatt.disconnect()
      console.log(bleDev.gatt.connected)
      connectBtnSta.code = 0
      break
    default:
      console.log("断开连接")
  }
}

/* 设备连接 */
async function bleConnect (bleGatt, errMsg) {
  try {
    errMsg = "未搜索到目标设备"
    bleDev = await navigator.bluetooth.requestDevice({optionalServices: [primaryServiceUUID], filters: [{ name: bleName.value }]})
    errMsg = "连接异常"
    console.log("⭐", bleDev)
    bleGatt = await bleDev.gatt.connect()
    if (bleGatt?.connected) {
      onBleStatus()
      changeAlertInfo("连接成功", "success")
      connectBtnSta.code = 2
      errMsg=""
      const sv = await bleGatt.getPrimaryService(primaryServiceUUID)
      // const ch = await sv.getCharacteristic("49535343-8841-43f4-a8d4-ecbe34729bb3")
      for (let ch of await sv.getCharacteristics()) {
        ch.startNotifications()
        ch.addEventListener(
        	  'characteristicvaluechanged', e => {
        		//监听设备端的操作 获取到值之后再解析
            const decoder = new TextDecoder("utf-8")
            const penCmd = (decoder.decode(e.target.value.buffer.slice(4)).trim())
            console.log('get info:', penCmd)
            detectBleCmd(penCmd)
        	}
        )
      }
    } else {changeAlertInfo(msg, "error"); connectBtnSta.code = 0}
  } catch (e) {
    console.log("connect err:", e) 
    if(errMsg) changeAlertInfo(errMsg, "error") 
    if (!bleGatt?.connected) connectBtnSta.code = 0  
  }
}

/* 设备连接-监听指令 */
function detectBleCmd (penCmd) {
  for (let v of cmdMap) {
    if (v.checked) {
      console.log(`--${penCmd}--${v.bleMsg}--`)
      if (penCmd == v.bleMsg.trim()) {
        window.electron.ipcRenderer.send("r:mockCmd", v.val)
      }
    }
  }
}



let tim_onBleStatus
function onBleStatus () {
  clearInterval(tim_onBleStatus)
  tim_onBleStatus = setInterval(() => {
    if (!bleDev.gatt.connected) {
      clearInterval(tim_onBleStatus)
      changeAlertInfo("蓝牙已断开", "info")
      connectBtnSta.code = 0
    }
  }, 200)
}

let timer_alert = 0
function changeAlertInfo(msg="", tp="info", isShow=true) {
  clearTimeout(timer_alert)
  if (isShow) {
    alertInfo.isShow = true; alertInfo.msg = msg; alertInfo.tp = tp;
    setTimeout(() => {alertInfo.isShow=false}, 1000)
  } else alertInfo.isShow = false
}

onBeforeUnmount(() => {
  if (bleDev?.gatt?.connected) {bleDev.gatt.disconnect()}
})

function testBtnClick () {
  console.log(cmdMap[0].val)
  // setTimeout(() => {window.electron.ipcRenderer.send("r:mockCmd", "a")}, 3000)
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
  margin: 20px 5px 30px 0;
  // background-color: #fff !important;
}

.ulCmdMap {
  padding: 0;
  >li {
    margin: 10px 0;
  }
  .ipBleMsg {
    width: 200px;
    margin: 0 10px;
  }
}





</style>