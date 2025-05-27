---
slug: /quickstart/install/goner
title: goner 组件安装
sidebar_position: 3
keywords: ["goner", "gone组件", "组件安装", "插件系统", "模块化开发"]
description: "goner 是 gone 框架的组件系统，本文介绍如何使用 gonectl 工具安装和管理官方及第三方 goner 组件，帮助开发者实现模块化开发。"
---

# goner 组件安装

## 概述
gone 框架设计了一套完整的 goner 组件规范，通过这套规范，开发者可以轻松实现功能模块的封装和复用。借助 gonectl 工具，您可以便捷地安装和管理各类 goner 组件，无论是官方提供的核心组件还是社区贡献的第三方组件。

## 安装
### 安装gonectl工具
参考： [gonectl安装](./gonectl.md)


### 安装官方goner组件库中的组件

```bash
gonectl install goner/<组件名>
```
例如：
```bash
# 安装goner/gin组件
gonectl install goner/gin
```

### 安装第三方goner组件库中的组件
```bash
gonectl install <第三方组件仓库地址>
```