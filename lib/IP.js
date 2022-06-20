/**
 * @author      OA Wu <oawu.tw@gmail.com>
 * @copyright   Copyright (c) 2015 - 2022, @oawu/ddns
 * @license     http://opensource.org/licenses/MIT  MIT License
 * @link        https://www.ioa.tw/
 */

const { networkInterfaces } = require('os')
const { title, done, fail } = require('@oawu/cli-progress')
const { create: Queue }     = require('@oawu/queue')

const Request = require('./Request.js')

const getPrivateIPs = _ => {
  const nets = networkInterfaces()
  const ips = []
  for (const key in nets)
    for (const net of nets[key])
      if (net.family === 'IPv4' && !net.internal)
        ips.push(net.address)
  return ips
}

module.exports = function(closure, showLog = false) {
  return Queue()
    .enqueue(next => {
      showLog && title('取得區域網路 IP')
      const rivateIP = getPrivateIPs().shift()
      rivateIP ? next(rivateIP, showLog && done()) : closure(new Error('無法取得區域網路 IP'), showLog && fail('失敗'))
    })
    .enqueue((next, privateIP) => Request('http://ip-api.com/json').get((error, { query: publicIP } = {}) => error ? next(privateIP, null, showLog && fail('失敗')) : next(privateIP, publicIP, showLog && done()), showLog && title('取得網際網路 IP')))
    .enqueue((next, privateIP, publicIP) => publicIP ? next(privateIP, publicIP) : Request('http://ipv4bot.whatismyipaddress.com').get((error, data) => error ? closure(new Error('無法取得網際網路 IP'), showLog && fail('失敗')) : next(privateIP, data, showLog && done()), showLog && title('取得網際網路 IP')))
    .enqueue((next, privateIP, publicIP) => {
      const pattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/

      if (showLog) {
        title('檢查區域網路 IP 格式')
        pattern.test(privateIP) ? done() : closure(new Error('區域網路 IP ' + privateIP + ' 格式錯誤'), fail('失敗'))
        title('檢查網際網路 IP 格式')
        pattern.test(publicIP)  ? done() : closure(new Error('網際網路 IP ' + publicIP + ' 格式錯誤'), fail('失敗'))
      } else {
        pattern.test(privateIP) || closure(new Error('區域網路 IP ' + privateIP + ' 格式錯誤'))
        pattern.test(publicIP)  || closure(new Error('網際網路 IP ' + publicIP + ' 格式錯誤'))
      }

      return next(closure(null, { privateIP, publicIP }))
    })
}
