---
sidebar_position: 2
hide_title: true
title: 第2章 快速入门
keywords:
- Gone框架
- 快速入门
- 项目初始化
description: Gone框架是Go语言的强大依赖注入框架，提供松耦合架构、自动装配、配置注入等功能。支持结构体注入、函数参数注入，助力构建可测试的企业级应用。
---

## 2.1 第一个Gone应用

### 2.1.1 项目初始化

创建一个新的Gone项目：

```bash
# 创建项目目录
mkdir hello-gone
cd hello-gone

# 初始化Go模块
go mod init hello-gone

# 安装Gone框架
go get github.com/gone-io/gone
```

### 2.1.2 基础配置

创建主程序文件`main.go`：

```go
package main

import (
    "github.com/gone-io/gone"
    "github.com/gone-io/gone/goner"
)

// HelloService 定义一个简单的服务
type HelloService struct {
    goner.Base
}

func NewHelloService() *HelloService {
    return &HelloService{}
}

func (s *HelloService) Say() string {
    return "Hello, Gone!"
}

func main() {
    // 启动应用
    gone.Run(
        gone.WithGoner(NewHelloService()),
    )
}
```

### 2.1.3 启动流程解析

Gone应用的启动流程：

1. 初始化配置
2. 注册组件
3. 依赖注入
4. 启动服务

## 2.2 核心概念理解

### 2.2.1 Goner接口详解

Goner是Gone框架中的核心接口：

```go
type Goner interface {
    GoneName() string  // 返回组件名称
}
```

常用的Goner实现：

- `goner.Base`：基础实现
- `goner.Config`：配置组件
- `goner.Http`：HTTP服务组件

### 2.2.2 Cemetery概念

Cemetery（墓地）是Gone框架的IoC容器：

- 管理组件生命周期
- 处理依赖注入
- 维护组件关系

使用示例：

```go
// 创建Cemetery实例
cemetery := gone.NewCemetery()

// 注册组件
cemetery.Bury(NewHelloService())

// 启动应用
cemetery.Start()
```

### 2.2.3 依赖注入基础

基本的依赖注入方式：

```go
type UserService struct {
    goner.Base
    repo *UserRepository `gone:"*"`  // 注入依赖
}

func NewUserService() *UserService {
    return &UserService{}
}
```

## 2.3 基本项目结构

### 2.3.1 目录组织规范

推荐的项目结构：

```
├── cmd/                # 主程序入口
│   └── main.go
├── internal/           # 内部代码
│   ├── config/        # 配置
│   ├── service/       # 业务逻辑
│   └── repository/    # 数据访问
├── pkg/               # 公共代码
├── go.mod
└── go.sum
```

### 2.3.2 配置文件管理

配置文件示例（`config.yaml`）：

```yaml
app:
  name: hello-gone
  port: 8080

database:
  driver: mysql
  dsn: root:password@tcp(localhost:3306)/gone
```

加载配置：

```go
type AppConfig struct {
    goner.Config
    Name string `yaml:"name"`
    Port int    `yaml:"port"`
}
```

### 2.3.3 代码分层架构

推荐的分层架构：

1. 表示层（API/UI）
   - 处理请求响应
   - 参数验证
   - 错误处理

2. 业务层（Service）
   - 业务逻辑
   - 事务管理
   - 领域模型

3. 数据层（Repository）
   - 数据访问
   - 缓存处理
   - 持久化

