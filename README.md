# Yamibo

<div align="center">

运行于终端环境的百合会论坛 (bbs.yamibo.com)

[![npm version](https://img.shields.io/npm/v/yamibo.svg)](https://www.npmjs.com/package/yamibo)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

## 功能特性

- 🔐 登录认证
- 📝 贴文浏览
- ✅ 每日签到

## 📦 安装

### 通过 npm 安装

```bash
npm install -g yamibo
```

### 通过 pnpm 安装（推荐）

```bash
pnpm add -g yamibo
```

## 🚀 使用

### 启动应用

```bash
yamibo
```

<img src="snapshots/start.png" width="400"/>
<img src="snapshots/thread-list.png" width="400"/>

### 查看帮助

```bash
yamibo --help
# 或
yamibo -h
```

### 查看版本

```bash
yamibo --version
# 或
yamibo -v
```

## 🔧 技术栈

- [Ink](https://github.com/vadimdemedes/ink)
- [React](https://react.dev/)
- [Jotai](https://jotai.org/)
- [TanStack Query](https://tanstack.com/query)
- [Cheerio](https://cheerio.js.org/)
- [Zod](https://zod.dev/)

## 📝 配置文件

配置文件保存在 `~/.yamibo/config.json`

当无法通过终端进行登录时，可手动填入 bbs.yamibo.com 对应的 cookie 值

```json
{
  "auth": "认证令牌", // Cookie EeqY_2132_auth
  "saltkey": "加密密钥" // Cookie EeqY_2132_saltkey
}
```

## 📄 许可证

MIT © [KarasuShin](https://github.com/KarasuShin)
## 免责声明

本工具仅供学习和研究使用，请遵守[百合会论坛](https://bbs.yamibo.com)的使用规则。

---

<div align="center">
Made with ❤️ by <a href="https://github.com/KarasuShin">KarasuShin</a>
</div>
