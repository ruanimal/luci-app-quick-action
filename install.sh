#!/bin/sh

set -xe

SDK_PATH=~/projects/openwrt-sdk-23.05.4-x86-64_gcc-12.3.0_musl.Linux-x86_64
IPK_DIR=$SDK_PATH/bin/packages/x86_64/luci

# 安装主包
IPK_FILE=$(ls $IPK_DIR/luci-app-quick-action_*.ipk | head -1)
IPK_NAME=$(basename "$IPK_FILE")
cat "$IPK_FILE" | ssh root@192.168.10.1 "cat > /tmp/$IPK_NAME"
ssh root@192.168.10.1 "opkg install --force-reinstall /tmp/$IPK_NAME"

# 安装中文翻译包
I18N_FILE=$(ls $IPK_DIR/luci-i18n-quick-action-zh-cn_*.ipk 2>/dev/null | head -1)
if [ -n "$I18N_FILE" ]; then
    I18N_NAME=$(basename "$I18N_FILE")
    cat "$I18N_FILE" | ssh root@192.168.10.1 "cat > /tmp/$I18N_NAME"
    ssh root@192.168.10.1 "opkg install --force-reinstall /tmp/$I18N_NAME"
fi

echo "Installation complete!"
