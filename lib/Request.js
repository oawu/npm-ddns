/**
 * @author      OA Wu <oawu.tw@gmail.com>
 * @copyright   Copyright (c) 2015 - 2022, @oawu/ddns
 * @license     http://opensource.org/licenses/MIT  MIT License
 * @link        https://www.ioa.tw/
 */

const URL = require('url')

const parseJson = text => {
  try {
    return JSON.parse(text)
  } catch (e) {
    return null
  }
}

const Request = function(url) {
  if (!(this instanceof Request))
    return new Request(url)

  const { protocol, host, path } = URL.parse(url)

  this._url = url
  this._params = {}
  this._headers = {}
  this._method = 'GET'

  if (protocol === null || host === null || path === null)
    return this._error = new Error('網址 ' + this._url + ' 失敗，錯誤原因：結構錯誤')

  this._protocol = protocol.slice(0, -1)
  this._host     = host
  this._path     = path
  this._error    = null
}

Request.prototype.params = function(key, val) { return this._params[key] = val, this }
Request.prototype.headers = function(key, val) { return this._headers[key] = val, this }
Request.prototype.method = function(val) { return val = val.toUpperCase(), this._method = ['GET', 'POST', 'PUT', 'DELETE'].includes(val) ? val : 'GET', this }
Request.prototype.send = function(closure) {
  if (this._error)
    return closure && closure(this._error, null)

  const request = require(this._protocol)
    .request({
      hostname: this._host,
      path: this._path,
      method: this._method,
      headers: this._headers
    }, response => {

      if (response.statusCode != 200)
        return closure && closure(this._error = new Error('取得 ' + this._url + ' 失敗，錯誤原因：狀態不是 200，狀態：' + response.statusCode))

      const param = []
      response.on('data', chunk => param.push(chunk))
      response.on('end', _ => {

        const data = Buffer.concat(param).toString('utf8')

        for (let header in response.headers)
          if (header.toLowerCase() == 'content-type' && response.headers[header].split(';').map(t => t.trim()).filter(t => t.length).shift() === 'application/json' && parseJson(data) !== null)
            return closure && closure(null, parseJson(data))

        return closure && closure(null, data)
      })
  })

  request.on('error', error => closure && closure(this._error = new Error('取得 ' + this._url + ' 失敗，錯誤原因：' + error.message)))
  request.write(JSON.stringify(this._params))
  request.end()
  return this
}

Request.prototype.get = function(closure) { return this.method('get').send(closure) }
Request.prototype.post = function(closure) { return this.method('post').send(closure) }
Request.prototype.put = function(closure) { return this.method('put').send(closure) }
Request.prototype.delete = function(closure) { return this.method('delete').send(closure) }

module.exports = Request
