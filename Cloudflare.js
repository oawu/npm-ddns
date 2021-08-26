/**
 * @author      OA Wu <oawu.tw@gmail.com>
 * @copyright   Copyright (c) 2015 - 2022, @oawu/ddns
 * @license     http://opensource.org/licenses/MIT  MIT License
 * @link        https://www.ioa.tw/
 */

const { title, done, fail } = require('@oawu/cli-progress')
const { create: Queue }     = require('@oawu/queue')

const Request  = require('./lib/Request.js')
const Platform = require('./lib/Platform.js')
const IP       = require('./lib/IP.js')

const Cloudflare = function(token, domain, subDomainNames) {
  if (!(this instanceof Cloudflare)) return new Cloudflare(token, domain, subDomainNames)

  Platform.call(this, 'Cloudflare')

  this._token      = token
  this._domain     = domain
  this._subDomains = subDomainNames.map(name => name + '.' + domain)
}

Cloudflare.prototype = Object.create(Platform.prototype)

Cloudflare.prototype.upload = function(closure, showLog = false) {
  return this._ip
    ? Queue()
      .enqueue(next => Request('https://api.cloudflare.com/client/v4/zones')
        .headers('Authorization', 'Bearer ' + this._token)
        .headers('Content-Type', 'application/json')
        .get((error, data) => {
          if (error) return closure(error, showLog && fail('失敗'))
          data = data.result.map(({ id, name }) => ({ id, name })).filter(({ name }) => name == this._domain).shift()
          data && data.id ? next(data.id, showLog && done()) : closure(new Error('找不到符合的網域：' + this._domain), showLog && fail('失敗'))
        }, showLog && title('取得 Cloudflare 可讀的 zone')))
      .enqueue((next, zoneId) => Request('https://api.cloudflare.com/client/v4/zones/' + zoneId + '/dns_records')
        .headers('Authorization', 'Bearer ' + this._token)
        .headers('Content-Type', 'application/json')
        .get((error, data) => {
          if (error) return closure(error, showLog && fail('失敗'))
          data = data.result.map(({ id, name }) => ({ id, name })).filter(({ name }) => this._subDomains.includes(name))
          data.length ? next(zoneId, data, Queue(), showLog && done()) : closure(new Error('找不到符合的子網域：' + this._subDomain), showLog && fail('失敗'))
        }, showLog && title('取得 Cloudflare 可讀 dns_records')))
      .enqueue((next, zoneId, records, queue) => {
        records.forEach(record => queue.enqueue(next => Request('https://api.cloudflare.com/client/v4/zones/' + zoneId + '/dns_records/' + record.id)
          .headers('Authorization', 'Bearer ' + this._token)
          .headers('Content-Type', 'application/json')
          .get((error, data) => !error
            ? data.result.name === record.name && data.result.type === 'A'
              ? next(showLog && done())
              : closure(new Error('資料格式錯誤'), showLog && fail('失敗'))
            : closure(error, showLog && fail('失敗')), showLog && title('檢查 ' + record.name + ' 格式'))))
        queue.enqueue(_ => next(zoneId, records, queue, _()))
      })
      .enqueue((next, zoneId, records, queue) => {
        records.forEach(record => queue.enqueue(next => Request('https://api.cloudflare.com/client/v4/zones/' + zoneId + '/dns_records/' + record.id)
          .headers('Authorization', 'Bearer ' + this._token)
          .headers('Content-Type', 'application/json')
          .params('type', 'A')
          .params('name', record.name)
          .params('content', this._ip.public)
          .put((error, data) => error
            ? closure(error, showLog && fail('失敗'))
            : next(showLog && done()), showLog && title('更新 ' +  record.name + ' ➜ [A]' + this._ip.public))))
        queue.enqueue(_ => next(this._ip, records.map(({ name }) => name), _()))
      })
      .enqueue((next, ip, records) => next(closure(null, { ip, records: records })))
    : closure(new Error('沒有 IP 資料')), this
}

Cloudflare.prototype.update = function(closure, showLog = false) {
  return IP((error, { privateIP: private, publicIP: public } = {}) => error ? closure(error) : this.ip({ private, public }).upload(closure, showLog), showLog), this
}

module.exports = Cloudflare
