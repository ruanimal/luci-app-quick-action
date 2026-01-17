# Quick Action

一个 OpenWrt 软件包，支持用户配置基于 rpcd 的快捷命令。
快捷命令用于设置 OpenWrt 系统，如重启某个网络接口。

用户使用 token 鉴权的 HTTP 请求调用快捷命令。
支持管理 token，token 支持通过 URL 参数或 Authorization Header 传递。

## 功能特性

- ✅ 通过 LuCI 界面管理快捷命令
- ✅ 支持 **Shell 命令** 和 **ubus 调用** 两种命令类型
- ✅ 支持多个 API Token
- ✅ Token 支持 URL 参数和 Authorization Header 传递
- ✅ Token 支持设置过期时间

## 安装

从 [Releases](../../releases) 下载最新的 ipk 并安装：

```bash
opkg install luci-app-quick-action_*.ipk
```

## 使用方法

### LuCI 界面

安装后访问：**系统 → Quick Action**

- **Commands**：添加/编辑/删除命令
  - 支持 Shell 命令类型
  - 支持 ubus 调用类型
- **API Tokens**：管理访问令牌

### HTTP API

#### Token 传递方式

| 方式 | 示例 |
|------|------|
| URL 参数 | `?token=YOUR_TOKEN` |
| Header | `Authorization: Bearer YOUR_TOKEN` |

#### API 端点

**列出所有命令：**
```bash
curl "http://192.168.1.1/cgi-bin/quick_action?action=list&token=YOUR_TOKEN"
```

**执行命令（使用命令名称）：**
```bash
curl "http://192.168.1.1/cgi-bin/quick_action?action=run&cmd=restart_wan&token=YOUR_TOKEN"
```

**使用 Authorization Header：**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "http://192.168.1.1/cgi-bin/quick_action?action=list"
```

## 依赖

- luci-base
- rpcd
- uhttpd

## 许可证

Apache-2.0
