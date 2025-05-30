---
sidebar_position: 2
hide_title: true
title: 极简项目
keywords: [Gone框架, Go语言, Hello World, 入门教程, 依赖注入, 日志组件]
description: 通过一个简单的Hello World程序，快速上手Gone框架的核心功能，包括依赖注入和日志记录。适合Gone框架初学者。
---

# 极简项目

## 适合谁看？
本文适合第一次接触Gone框架的开发者，我们将通过一个打印"Hello World"的示例，带您快速体验依赖注入和日志记录这两个核心功能。

## 第一步：准备项目目录
打开终端，依次执行这些命令来创建你的第一个Gone项目：
```bash
mkdir my-project  # 创建项目目录
cd my-project     # 进入目录
go mod init my-project  # 初始化Go模块
```

## 2. 编写主程序
创建main.go文件，内容如下：
```go
package main

import "github.com/gone-io/gone/v2"

// 这个结构体代表我们的应用程序
type App struct {
    gone.Flag  // 每个Gone程序都需要这个标识
    gone.Logger `gone:"*"`  // 这个注释会自动帮我们准备好日志功能

// Init方法会在应用启动时自动调用
func (app *App) Init() {
    app.Infof("Hello, World!")  // 使用日志组件输出信息
}

func main() {
    // 加载App并运行框架
    gone.Load(&App{}).Run()
}
```
## 第三步：启动程序
回到终端，按顺序运行这两个命令（请先确保在项目目录中）：
```bash
go mod tidy   # 下载依赖

go run main.go  # 运行程序
```
## 看到结果啦！
当程序成功运行时，你会在终端看到这样的欢迎信息（时间戳可能不同）：
```bash
2025/05/27 11:18:07 Hello, World!
```

🎉 恭喜完成首个Gone程序！

遇到问题先看看这些：
1. 确保所有命令都在项目目录执行
2. 如果报错找不到包，再次运行`go mod tidy`
3. 查看[常见问题解答](#)获取更多帮助