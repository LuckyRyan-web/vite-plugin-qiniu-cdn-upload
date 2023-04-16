## 参数说明

```ts
export interface Options {
    accessKey: string
    secretKey: string
    bucket: string
    exclude?: RegExp
    /** 七牛云区域 */
    zone?: string
    /** 并发数 */
    concurrent?: number
    /** 是否覆盖相同文件名的文件 */
    overwrite?: boolean
    /** key 前缀 */
    prefix?: string
    /** 打包文件目录 */
    distDir?: string
    /** 是否输出日志 */
    log?: boolean
}
```

## example

```
yarn add @ryan-liu/vite-plugin-qiniu-cdn-upload -D
```

```ts
// vite.config.ts

import qiniuPlugin from '@ryan-liu/vite-plugin-qiniu-cdn-upload'
import pkg from './package.json'

const qnConfig = {
    accessKey: '',
    secretKey: '',
    bucket: '',
    zone: 'z2',
}

/** 项目文件夹地址 */
const basePath = pkg.name

/** cdn 地址 */
const cdnPrePath = ''

function uploadFileToQN(isUpload: boolean) {
    if (!isUpload) {
        return
    }
    return qiniuPlugin({
        accessKey: qnConfig.accessKey,
        secretKey: qnConfig.secretKey,
        bucket: qnConfig.bucket,
        zone: 'z2',
        overwrite: false,
        prefix: basePath,
    })
}

export default defineConfig({
    plugins: [
        ...,
        base: process.env.NODE_ENV == 'production' ? cdnPrePath : `/`,
        uploadFileToQN(process.env.NODE_ENV == 'production')
        ...
    ]
})
```
