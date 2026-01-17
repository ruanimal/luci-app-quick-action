#!/bin/sh

set -xe

SDK_PATH=~/projects/openwrt-sdk-23.05.4-x86-64_gcc-12.3.0_musl.Linux-x86_64

IPK_FILE=$SDK_PATH/bin/packages/x86_64/luci/luci-app-quick-action_1.0.0_all.ipk
IPK_NAME=$(basename "$IPK_FILE")

# 通过 SSH 管道传输文件 (不需要 scp)
cat "$IPK_FILE" | ssh root@192.168.10.1 "cat > /tmp/$IPK_NAME"

# 安装
ssh root@192.168.10.1 "opkg install /tmp/$IPK_NAME"
