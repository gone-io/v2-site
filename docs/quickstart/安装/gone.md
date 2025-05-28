---
sidebar_position: 2
hide_title: true
slug: /quickstart/install/gone
title: gone 安装
keywords: ["gone", "golang", "依赖管理", "go modules", "安装教程"]
description: "本文详细介绍了如何在项目中安装和配置 gone 框架，包括环境准备、依赖管理以及常见问题解决方案。"
---

# gone 安装

## 概述​
在 Golang 项目开发中，我们推荐使用 go module 进行依赖管理。为了确保安装过程顺畅，建议提前配置 GOPROXY 环境变量，这可以有效解决依赖下载时的网络访问问题。

## 安装
```shell
mkdir <project name> && cd <project name> # project name 为具体值
go mod init <module name> # module name 为具体值
go get github.com/gone-io/gone
```

## 常见问题
确保设置 GOPROXY 的方式是正确的，并通过 go env GOPROXY 命令确认设置成功，如下：
```shell
$ go env -w GOPROXY=https://goproxy.cn,direct
$ go env GOPROXY
https://goproxy.cn,direct
```