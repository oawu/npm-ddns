# OA's Node DDNS

給予我的 IP 一個漂亮的名稱吧 DDNS 🌐

## 說明

目前只支援 [Cloudflare](https://www.cloudflare.com/zh-tw/)，主要是將目前對外的網際網路 IP 更新至 DNS 服務平台上。

## 安裝

```shell
npm install @oawu/ddns
```

## 使用

1. 更新

```javascript
  const DDNS = require('@oawu/ddns')
  const cloudflare = DDNS.Cloudflare('auth_token', 'domain', ['sub'])

  // 第二餐數為 是否先是 log
  cloudflare.update((error, data) => {
    console.error(error, data);
  }, true)
```

2. 監控


```javascript
  const DDNS = require('@oawu/ddns')
  const cloudflare = DDNS.Cloudflare('auth_token', 'domain', ['sub'])

  DDNS.Watch(cloudflare, 1000)
```


