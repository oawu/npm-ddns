/**
 * @author      OA Wu <comdan66@gmail.com>
 * @copyright   Copyright (c) 2015 - 2021, @oawu/ddns
 * @license     http://opensource.org/licenses/MIT  MIT License
 * @link        https://www.ioa.tw/
 */

const Platform = function(key) {
  if (!(this instanceof Platform)) return new Platform(key)
  this._ip = null
  this.cache = key + '.cache'
}
Platform.prototype.ip = function(ip) { return this._ip = ip, this }
Platform.prototype.upload = function(closure, showLog = false) { return this }
Platform.prototype.update = function(closure, showLog = false) { return this }

module.exports = Platform
