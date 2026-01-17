include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-quick-action
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_LICENSE:=MIT
PKG_MAINTAINER:=GitHub Copilot

LUCI_TITLE:=LuCI support for Quick Action
LUCI_DEPENDS:=+rpcd +rpcd-mod-file +ucode
LUCI_PKGARCH:=all

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
