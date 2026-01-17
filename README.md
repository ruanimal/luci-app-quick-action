# Quick Action

[中文](README_zh.md)

An OpenWrt package that allows users to configure rpcd-based quick commands.
Quick commands are used to manage OpenWrt system, such as restarting a network interface.

Users can invoke quick commands via token-authenticated HTTP requests.
Supports token management, with tokens passed via URL parameters or Authorization header.

## Features

- ✅ Manage quick commands via LuCI interface
- ✅ Support both **Shell commands** and **ubus calls**
- ✅ Multiple API tokens support
- ✅ Token authentication via URL parameter or Authorization header
- ✅ Token expiration support

## Installation

Download the latest ipk from [Releases](../../releases) and install:

```bash
opkg install luci-app-quick-action_*.ipk
```

## Usage

### LuCI Interface

After installation, navigate to: **System → Quick Action**

- **Commands**: Add/Edit/Delete commands
  - Shell command type
  - ubus call type
- **API Tokens**: Manage access tokens

### HTTP API

#### Token Authentication

| Method | Example |
|--------|---------|
| URL Parameter | `?token=YOUR_TOKEN` |
| Header | `Authorization: Bearer YOUR_TOKEN` |

#### API Endpoints

**List all commands:**
```bash
curl "http://192.168.1.1/cgi-bin/quick_action?action=list&token=YOUR_TOKEN"
```

**Run command (by name):**
```bash
curl "http://192.168.1.1/cgi-bin/quick_action?action=run&cmd=restart_wan&token=YOUR_TOKEN"
```

**With Authorization header:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "http://192.168.1.1/cgi-bin/quick_action?action=list"
```

#### Response Examples

```json
// List commands
{
  "success": true,
  "commands": [
    {
      "id": "example_restart_wan",
      "name": "restart_wan",
      "description": "Restart WAN interface",
      "type": "shell",
      "enabled": true
    },
    {
      "id": "example_ubus_network",
      "name": "network_status",
      "description": "Get network interface status",
      "type": "ubus",
      "enabled": true
    }
  ]
}

// Run command
{
  "success": true,
  "message": "Command executed successfully",
  "output": ""
}
```

## Configuration

Configuration is stored in `/etc/config/quick_action`:

```
config quick_action 'global'
    option enabled '1'

# Shell command example
config command 'example_restart_wan'
    option name 'restart_wan'
    option description 'Restart WAN interface'
    option type 'shell'
    option exec '/sbin/ifdown wan && /sbin/ifup wan'
    option enabled '1'

# ubus command example
config command 'example_ubus_network'
    option name 'network_status'
    option description 'Get network interface status'
    option type 'ubus'
    option ubus_object 'network.interface.wan'
    option ubus_method 'status'
    option enabled '1'

# ubus command with parameters
config command 'example_ubus_params'
    option name 'dns_add'
    option description 'Add DNS server'
    option type 'ubus'
    option ubus_object 'network.interface.wan'
    option ubus_method 'add_dns'
    option ubus_params '{"dns": "8.8.8.8"}'
    option enabled '1'

# Token example
config token 'token_xxx'
    option token 'your_secret_token'
    option remark 'My API token'
    option enabled '1'
    option expires '0'
```

### Command Types

| Type | Field | Description |
|------|-------|-------------|
| shell | `exec` | Shell command to execute |
| ubus | `ubus_object` | ubus object name, e.g. `network.interface.wan` |
| ubus | `ubus_method` | ubus method name, e.g. `status` |
| ubus | `ubus_params` | (Optional) JSON formatted parameters |

### Common ubus Examples

```bash
# List available ubus objects
ubus list

# List object methods
ubus -v list network.interface.wan

# Call methods
ubus call network.interface.wan status
ubus call system board
```

## Dependencies

- luci-base
- rpcd
- uhttpd

## License

Apache-2.0
