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
        base: process.env.NODE_ENV == 'production' ? cdnPrePath : `./`,
        uploadFileToQN(process.env.NODE_ENV == 'production')
        ...
    ]
})
```
