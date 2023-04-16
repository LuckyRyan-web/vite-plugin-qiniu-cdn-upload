import qiniu from 'qiniu'
import globby from 'globby'
import type { PluginOption } from 'vite'
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
    /** 是否输出日志 */
    log?: boolean
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
    /** 可能是因为 DNS 解析错误，无法正确的访问存储桶地址 */
    NetWorkError = -1,
}

function print(isPrint: boolean) {
    return function (message: any) {
        if (isPrint) {
            console.log('qiniu plugin log = ', message)
        }
    }
}

export default function qiniuPlugin(options: Options): PluginOption {
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
        log = true,
    } = options
    const mac = new qiniu.auth.digest.Mac(accessKey, secretKey)
    const putPolicy = new qiniu.rs.PutPolicy({ scope: bucket })
    const uploadToken = putPolicy.uploadToken(mac)
    const config = new qiniu.conf.Config()

    // @ts-ignore
    config.zone = qiniu.zone[zone]
    const formUploader = new qiniu.form_up.FormUploader(config)
    const putExtra = new qiniu.form_up.PutExtra()

    const logger = print(log)

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
                                logger(`文件被排除${file}`)
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

                                        logger(respInfo)

                                        // TODO: 补充剩余常见的错误码
                                        switch (respInfo?.statusCode) {
                                            case StatusCode.Success:
                                                logger(`上传成功${dirPath}`)
                                                resolve(respBody)
                                                break
                                            case StatusCode.Exist:
                                                if (!overwrite) {
                                                    logger(`文件已存在${dirPath}`)
                                                    resolve(respBody)
                                                } else {
                                                    // TODO: 补充覆盖文件的方法
                                                    reject(respBody)
                                                }
                                                break
                                            case StatusCode.NetWorkError:
                                                reject('DNS 解析错误，无法正确访问存储桶地址')
                                                break
                                            default:
                                                reject(respBody)
                                        }
                                    }
                                )
                            })
                        })
                        Promise.all(promises)
                            .then((res) => {
                                logger(`上传成功${res.length}个文件`)
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
