---
sidebar_position: 3
hide_title: true
title: 第3章 依赖注入系统
keywords:
- Gone框架
- 依赖注入
- IoC容器
description: Gone框架是Go语言的强大依赖注入框架，提供松耦合架构、自动装配、配置注入等功能。支持结构体注入、函数参数注入，助力构建可测试的企业级应用。
---

## 3.1 依赖注入原理

### 3.1.1 IoC容器机制

IoC（Inversion of Control）是一种设计原则，在Gone框架中，IoC容器负责管理所有组件的生命周期和依赖关系。通过IoC容器，我们可以：

- 集中管理组件实例
- 自动解析依赖关系
- 控制组件的初始化顺序
- 管理组件的生命周期

### 3.1.2 组件注册与发现

Gone框架提供了多种组件注册方式：

- 通过`gone.Goner`接口注册
- 使用注解自动注册
- 配置文件声明式注册

组件发现过程：

1. 扫描项目代码
2. 识别组件定义
3. 解析依赖关系
4. 注册到IoC容器

### 3.1.3 循环依赖处理

Gone框架采用多种策略处理循环依赖：

- 依赖检测算法
- 延迟初始化
- 代理注入

## 3.2 Goner组件开发

### 3.2.1 实现Goner接口

一个基本的Goner组件实现示例：

```go
type UserService struct {
    userRepo *UserRepository  `gone:"*"` // 依赖注入
}

func NewUserService() *UserService {
    return &UserService{}
}

// 实现Goner接口
func (s *UserService) GoneName() string {
    return "userService"
}
```

### 3.2.2 组件生命周期

Goner组件的生命周期包括：

1. 实例化阶段
   - 创建组件实例
   - 注入基本属性

2. 初始化阶段
   - 注入依赖
   - 执行初始化方法

3. 就绪阶段
   - 提供服务
   - 响应请求

4. 销毁阶段
   - 释放资源
   - 清理连接

### 3.2.3 初始化顺序控制

可以通过以下方式控制组件的初始化顺序：

- 使用`@Order`注解
- 实现`InitializingGoner`接口
- 配置依赖关系

## 3.3 依赖注入实践

### 3.3.1 构造函数注入

推荐使用构造函数注入方式：

```go
type OrderService struct {
    userService  *UserService
    orderRepo    *OrderRepository
}

func NewOrderService(userService *UserService, orderRepo *OrderRepository) *OrderService {
    return &OrderService{
        userService: userService,
        orderRepo:   orderRepo,
    }
}
```

### 3.3.2 属性注入

使用标签进行属性注入：

```go
type ProductService struct {
    // 必须注入
    Repo *ProductRepository `gone:"*"`
    
    // 可选注入
    Cache *Cache `gone:"?"`
    
    // 按名称注入
    Logger *Logger `gone:"#accessLogger"`
}
```

### 3.3.3 接口注入技巧

推荐使用接口注入来降低耦合：

```go
type MessageSender interface {
    Send(message string) error
}

type NotificationService struct {
    sender MessageSender `gone:"*"`  // 注入接口实现
}
```

常见注入技巧：

1. 使用接口而不是具体实现
2. 注入切片实现多实例注入
3. 使用别名解决冲突
4. 条件注入