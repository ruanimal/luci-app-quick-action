#!/bin/sh

SDK_PATH=~/projects/openwrt-sdk-23.05.4-x86-64_gcc-12.3.0_musl.Linux-x86_64

# 同步源码到 feeds/luci/applications/
rsync -a --delete ~/projects/luci-app-quick-action/ $SDK_PATH/feeds/luci/applications/luci-app-quick-action/

cd $SDK_PATH

# 清理旧的安装链接
rm -rf package/feeds/luci/luci-app-quick-action 2>/dev/null

# 更新 feeds 索引
./scripts/feeds update -i

# 强制安装 (-f 强制覆盖)
./scripts/feeds install -f luci-app-quick-action

# 编译
make package/luci-app-quick-action/compile V=s
