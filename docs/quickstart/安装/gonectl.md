---
sidebar_position: 1
hide_title: true
slug: /quickstart/install/gonectl
title: gonectl 安装
keywords: ["gonectl", "gone脚手架", "项目生成器", "开发工具", "命令行工具"]
description: "gonectl 是 gone 框架的官方脚手架工具，本文详细介绍了如何通过多种方式安装和配置 gonectl，帮助开发者快速搭建 gone 项目框架。"
---
# 安装 gonectl

## 概述
gonectl 是 gone 框架生态中的核心开发工具，它不仅可以帮助开发者快速生成标准的项目框架，还提供了丰富的项目管理功能。通过 gonectl，您可以轻松创建、配置和管理 gone 项目。

## 使用 go install 安装

### 1.1 查看 go 版本
```shell
go version
```
### 1.2 安装 gonectl
```shell
go install github.com/gone-io/gonectl@latest
```
### 1.3 查看 gonectl 版本
```shell
gonectl -v
```

## 下载安装

### 2.1 下载 gonectl 安装包

gonectl 的安装包可以在 [Gonectl Release](https://github.com/gone-io/gonectl/releases) 页面下载。
请根据你的操作系统选择合适的安装包。

### 2.2 解压 gonectl 安装包
将 gonectl 安装包解压到你想要安装的目录。

### 2.3 配置 gonectl 环境变量
将 gonectl 安装目录添加到系统的环境变量中。

### 2.4 验证 gonectl 安装
在命令行中输入 `gonectl -v` 命令，查看 gonectl 的版本信息。