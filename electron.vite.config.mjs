import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import compression from 'vite-plugin-compression'

export default defineConfig({
  main: {
    plugins: [
      externalizeDepsPlugin(),
      compression({
        verbose: true, // 输出压缩日志
        disable: false, // 是否禁用压缩
        threshold: 10240, // 对超过 10KB 的文件进行压缩
        algorithm: 'gzip', // 使用 gzip 压缩算法
        ext: '.gz', // 压缩后文件的扩展名
      }),
    ]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [
      vue(),
      compression({
        verbose: true, // 输出压缩日志
        disable: false, // 是否禁用压缩
        threshold: 10240, // 对超过 10KB 的文件进行压缩
        algorithm: 'gzip', // 使用 gzip 压缩算法
        ext: '.gz', // 压缩后文件的扩展名
      }),
    ]
  }
})
