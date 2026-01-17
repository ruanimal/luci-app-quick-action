# Quick Action

一个 OpenWrt 软件包，支持用户配置基于 rpcd 的快捷命令。
快捷命令用于设置 OpenWrt 系统，如重启某个网络接口。

用户使用 token 鉴权的 HTTP 请求调用快捷命令。
支持管理 token，token 支持通过 URL 参数或 Header 传递。

## 功能特性

- ✅ 通过 LuCI 界面管理快捷命令
- ✅ 支持 **Shell 命令** 和 **ubus 调用** 两种命令类型
- ✅ 支持多个 API Token
- ✅ Token 支持 URL 参数和 Header 两种传递方式
- ✅ Token 支持设置过期时间


## 使用方法

### LuCI 界面

安装后访问：**系统 → Quick Action**

- **快捷命令**：添加/编辑/删除/执行命令
  - 支持 Shell 命令类型
  - 支持 ubus 调用类型
- **API Tokens**：管理访问令牌

### HTTP API

#### Token 传递方式

| 方式 | 示例 |
|------|------|
| URL 参数 | `?token=YOUR_TOKEN` |
| Header | `X-Quick-Action-Token: YOUR_TOKEN` |

#### API 端点

**列出所有命令：**
```bash
curl "http://192.168.1.1/cgi-bin/quick_action?action=list&token=YOUR_TOKEN"
```

**执行命令（使用命令名称）：**
```bash
curl "http://192.168.1.1/cgi-bin/quick_action?action=run&cmd=restart_wan&token=YOUR_TOKEN"
```

**使用 Header 方式：**
```bash
curl -H "X-Quick-Action-Token: YOUR_TOKEN" \
     "http://192.168.1.1/cgi-bin/quick_action?action=list"
```

#### 响应示例

```json
// 列出命令
{
  "success": true,
  "commands": [
    {
      "id": "example_restart_wan",
      "name": "restart_wan",
      "description": "重启 WAN 接口",
      "type": "shell",
      "enabled": true
    },
    {
      "id": "example_ubus_network",
      "name": "network_status",
      "description": "获取网络接口状态",
      "type": "ubus",
      "enabled": true
    }
  ]
}

// 执行命令
{
  "success": true,
  "message": "Command executed successfully",
  "output": ""
}
```

## 配置文件

配置存储在 `/etc/config/quick_action`:

```
config quick_action 'global'
    option enabled '1'

# Shell 命令示例
config command 'example_restart_wan'
    option name 'restart_wan'
    option description '重启 WAN 接口'
    option type 'shell'
    option exec '/sbin/ifdown wan && /sbin/ifup wan'
    option enabled '1'

# ubus 命令示例
config command 'example_ubus_network'
    option name 'network_status'
    option description '获取网络接口状态'
    option type 'ubus'
    option ubus_object 'network.interface.wan'
    option ubus_method 'status'
    option enabled '1'

# ubus 命令示例（带参数）
config command 'example_ubus_params'
    option name 'dns_add'
    option description '添加 DNS 服务器'
    option type 'ubus'
    option ubus_object 'network.interface.wan'
    option ubus_method 'add_dns'
    option ubus_params '{"dns": "8.8.8.8"}'
    option enabled '1'

# Token 示例
config token 'token_xxx'
    option name 'my_token'
    option token 'your_secret_token'
    option enabled '1'
    option expires '0'
```

### 命令类型说明

| 类型 | 字段 | 说明 |
|------|------|------|
| shell | `exec` | 执行 Shell 命令 |
| ubus | `ubus_object` | ubus 对象名称，如 `network.interface.wan` |
| ubus | `ubus_method` | ubus 方法名称，如 `status` |
| ubus | `ubus_params` | (可选) JSON 格式的参数 |

### 常用 ubus 调用示例

```bash
# 查看可用的 ubus 对象
ubus list

# 查看对象的方法
ubus -v list network.interface.wan

# 调用方法
ubus call network.interface.wan status
ubus call system board
```

## 依赖

- luci-base
- rpcd
- uhttpd

## 许可证

Apache-2.0
