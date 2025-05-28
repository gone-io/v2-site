---
sidebar_position: 1
hide_title: true
slug: /quickstart/inject
title: 依赖注入
keywords: [Gone框架, 依赖注入, IoC容器, 组件管理, 自动装配, Go语言]
description: Gone框架的依赖注入系统让组件管理变得简单高效。通过简单的标签声明，实现自动的依赖创建、注入和生命周期管理。
---

# 依赖注入
Gone框架的依赖注入功能让组件管理变得简单。你只需要在结构体字段上添加`gone`标签，框架就会自动帮你完成依赖的创建和注入。

举个例子：
```go
type Dep struct {
    gone.flag  // 标记这个结构体可以被注入
}

type Foo struct {
    Dep *Dep `gone:""`  // 标记这个字段需要注入Dep实例
}
```

框架会自动完成以下工作：
1. 创建`Dep`的实例
2. 将这个实例注入到`Foo`的`Dep`字段中
3. 管理这些实例的生命周期

这样你就不用自己手动创建和管理这些依赖关系了。

更多内容参考 [gone的依赖注入详解](/docs/tutorial/inject)


