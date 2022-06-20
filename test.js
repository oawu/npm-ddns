/**
 * @author      OA Wu <oawu.tw@gmail.com>
 * @copyright   Copyright (c) 2015 - 2022, @oawu/ddns
 * @license     http://opensource.org/licenses/MIT  MIT License
 * @link        https://www.ioa.tw/
 */

const DDNS = require('./index.js')

const cloudflare = DDNS.Cloudflare('token', 'domain', ['sub'])

// DDNS.Watch(cloudflare)

// cloudflare.update((error, data) => {
  
// })
