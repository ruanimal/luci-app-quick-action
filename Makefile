# SPDX-License-Identifier: Apache-2.0

include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI Quick Action
LUCI_DESCRIPTION:=LuCI support for Quick Action commands with token authentication
LUCI_DEPENDS:=+luci-base +rpcd +uhttpd
LUCI_PKGARCH:=all

PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_LICENSE:=Apache-2.0

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-quick-action/conffiles
/etc/config/quick_action
endef

# call BuildPackage - OpenWrt buildroot signature
