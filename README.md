## example

```ts
// vite.config.ts

import pkg from './package.json'

const qnConfig = {
    accessKey: '',
    secretKey: '',
    bucket: '',
    zone: 'z2',
}

/** 项目文件夹地址 */
const basePath = pkg.name

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
        uploadFileToQN(process.env.NODE_ENV == 'production')
        ...
    ]
})
```
