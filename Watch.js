/**
 * @author      OA Wu <comdan66@gmail.com>
 * @copyright   Copyright (c) 2015 - 2021, @oawu/ddns
 * @license     http://opensource.org/licenses/MIT  MIT License
 * @link        https://www.ioa.tw/
 */

const Path       = require('path')
const FileSystem = require('fs')

const Platform   = require('./lib/Platform.js')
const IP         = require('./lib/ip.js')

const { title, done, fail } = require('@oawu/cli-progress')
const { create: Queue }     = require('@oawu/queue')

const rootPath = Path.resolve(__dirname, ('..' + Path.sep).repeat(0)) + Path.sep

const doing = (platform, showLog, time) => Queue()

  .enqueue(next => IP((error, { privateIP: private, publicIP: public } = {}) => error
    ? setTimeout(_ => doing(platform, showLog, time), time, process.stdout.write("\r" + error.message + "\n"))
    : next({private, public}), showLog))

  .enqueue((next, ip) => FileSystem.readFile(rootPath + platform.cache, 'utf8', (error, data) => error || data !== ip.public
    ? next(ip, platform.ip(ip), showLog && done('需要更新'))
    : setTimeout(_ => doing(platform, showLog, time), time, showLog && done('沒有，不需要動作')), showLog && title('讀取快取，確認是否有改變過')))

  .enqueue((next, ip) => platform.upload((error, data) => error
    ? setTimeout(_ => doing(platform, showLog, time), time, process.stdout.write("\r" + error.message + "\n"))
    : next(ip, platform), showLog))

  .enqueue((next, ip) => FileSystem.writeFile(rootPath + platform.cache, ip.public, 'utf8', error => error
    ? next(process.stdout.write("\r" + error.message + "\n"), showLog && fail('失敗'))
    : next(ip, showLog && done()), showLog && title('儲存快取')))

module.exports = (platform, time = 60 * 1000, showLog = true) => platform instanceof Platform && doing(platform, showLog, time)
