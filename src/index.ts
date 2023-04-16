import qiniu from 'qiniu'
import globby from 'globby'
import { Plugin } from 'vite'
import _ from 'lodash'

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
}

enum StatusCode {
    Success = 200,
    /** 指定资源不存在或已被删除 */
    NoFound = 612,
    /** 资源已经存在 */
    Exist = 614,
    /** 已创建的空间数量达到上限，无法创建新空间 */
    ExceededLimit = 630,
    /** 指定空间不存在 */
    NoFoundSite = 631,
}

export default function qiniuPlugin(options: Options): Plugin {
    const {
        accessKey,
        secretKey,
        bucket,
        exclude = /(\.map|\.html)$/,
        zone = 'z0',
        concurrent = 50,
        overwrite = false,
        prefix = '',
        distDir = 'dist',
    } = options
    const mac = new qiniu.auth.digest.Mac(accessKey, secretKey)
    const putPolicy = new qiniu.rs.PutPolicy({ scope: bucket })
    const uploadToken = putPolicy.uploadToken(mac)
    const config = new qiniu.conf.Config()

    // @ts-ignore
    config.zone = qiniu.zone[zone]
    const formUploader = new qiniu.form_up.FormUploader(config)
    const putExtra = new qiniu.form_up.PutExtra()

    return {
        name: 'qiniu-plugin',
        async writeBundle() {
            const files = await globby([`${distDir}/**/*`])
            const chunkedFiles = _.chunk(files, concurrent)
            await Promise.all(
                chunkedFiles.map((chunk) => {
                    return new Promise((resolve, reject) => {
                        const promises = chunk.map((file) => {
                            if (exclude.test(file)) {
                                console.log(`文件被排除${file}`)
                                return Promise.resolve()
                            }
                            const dirPath = file.replace('dist/', '')
                            let preStr = prefix || 'upqn-prefix/'

                            if (!preStr.endsWith('/')) {
                                preStr += '/'
                            }
                            if (preStr.startsWith('/')) {
                                preStr = preStr.substring(1, preStr.length)
                            }

                            const remotePath = preStr + dirPath

                            return new Promise((resolve, reject) => {
                                formUploader.putFile(
                                    uploadToken,
                                    remotePath,
                                    file,
                                    putExtra,
                                    function (respErr, respBody, respInfo) {
                                        if (respErr) {
                                            reject(respErr)
                                        }

                                        if (respInfo?.statusCode === StatusCode.Success) {
                                            console.log(`上传成功${dirPath}`)
                                            resolve(respBody)
                                        } else {
                                            if (respInfo?.statusCode === StatusCode.Exist && !overwrite) {
                                                console.log(`文件已存在${dirPath}`)
                                                resolve(respBody)
                                            } else {
                                                reject(respBody)
                                            }
                                        }
                                    }
                                )
                            })
                        })
                        Promise.all(promises)
                            .then((res) => {
                                console.log(`上传成功${res.length}个文件`)
                                resolve(res)
                            })
                            .catch((err) => {
                                reject(err)
                            })
                    })
                })
            )
        },
    }
}
