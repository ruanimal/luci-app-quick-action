#!/bin/sh

# 加载环境变量
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
if [ -f "$SCRIPT_DIR/.env" ]; then
    . "$SCRIPT_DIR/.env"
fi

# 同步源码到 feeds/luci/applications/
rsync -a --delete ~/projects/luci-app-quick-action/ $SDK_PATH/feeds/luci/applications/luci-app-quick-action/

cd $SDK_PATH

# 清理旧的安装链接
rm -rf package/feeds/luci/luci-app-quick-action 2>/dev/null

# 安装依赖
sudo apt install -y \
 build-essential \
 clang \
 flex \
 bison \
 gawk \
 gettext \
 libncurses-dev \
 libssl-dev \
 rsync \
 unzip \
 zlib1g-dev \
 file \
 wget \
 libelf-dev \
 ccache \
 python3-distutils-extra

# 更新 feeds 索引
./scripts/feeds update -i

# 强制安装 (-f 强制覆盖)
./scripts/feeds install -f luci-app-quick-action

# 编译
make -j8 package/luci-app-quick-action/compile V=s
