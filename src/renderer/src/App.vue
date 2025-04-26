<template>
  <!-- <Versions /> -->
  <!-- <button @click="ipcHandle">Send IPC</button> -->
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
        <a-space>
          <a-select v-model:value="v.valBase" label-in-value style="width: 120px" :options="cmdBase"></a-select>
          <a-select v-model:value="v.val" label-in-value style="width: 120px" :options="cmdsOpts[i]" ></a-select>
        </a-space>
      </li>
    </ul>

    <a-button @click="testBtnClick">test</a-button>
  </div>

  

</template>

<script setup>
// import Versions from './components/Versions.vue'
import { ref, reactive, onBeforeUnmount, computed, watch } from 'vue'
import codeMap from './assets/docs/code-map'

const ipcHandle = () => window.electron.ipcRenderer.send('ping')
const bleName = ref("CFun001")
const alertInfo = reactive({
  isShow: false,
  msg: "",
  tp: "info", //success info warning error
})
const connectBtnSta = reactive({ code: 0, text: "连接"})
const cmdBase = [{value: "MOUSE", label: "鼠标"}, {value: "KEY", label: "键盘"}]
const cmdMap = reactive([
  {checked: false, bleMsg: "", valBase: {value: "KEY", label: "键盘"},  val: {value: "A", label: "A"}},
  {checked: false, bleMsg: "", valBase: {value: "KEY", label: "键盘"},  val: {value: "A", label: "A"}},
  {checked: false, bleMsg: "", valBase: {value: "KEY", label: "键盘"},  val: {value: "A", label: "A"}},
  {checked: false, bleMsg: "", valBase: {value: "KEY", label: "键盘"},  val: {value: "A", label: "A"}},
  {checked: false, bleMsg: "", valBase: {value: "KEY", label: "键盘"},  val: {value: "A", label: "A"}}
]) 

let primaryServiceUUID = "55535343-fe7d-4ae5-8fa9-9fafd205e455"
let bleDev

let cmdsOpts = []

for (let v of cmdMap) {
  cmdsOpts.push(computed(() => codeMap[v.valBase.value].map(item => ({value: item[0], label: item[1]})))) 
}
watch(
  () => cmdMap.map(v => v.valBase.value),
  (newV, oldV) => {
    for (let i in newV) {
      if (newV[i] != oldV[i]) {
        cmdMap[i].val = cmdsOpts[i].value[0]
        continue
      }
    }
  }
)

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

/* 设备连接-判定指令 */
function detectBleCmd (penCmd) {
  for (let v of cmdMap) {
    if (v.checked) {
      console.log(`--${penCmd}--${v.bleMsg}--`)
      if (penCmd == v.bleMsg.trim()) {
        window.electron.ipcRenderer.send("r:mockCmd", JSON.stringify(v.val))
      }
    }
  }
}


/* 事件监听：蓝牙连接状态 */
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
/* alert通知 */
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
  // console.log(cmdsOpts[0])
  // console.log(cmdMap[0].val.value)
  setTimeout(() => {window.electron.ipcRenderer.send("r:mockCmd", JSON.stringify(cmdMap[0].val))}, 3000)
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