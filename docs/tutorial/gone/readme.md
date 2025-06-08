---
sidebar_position: 1
hide_title: true
title: 整体介绍
keywords:
- Gone框架
description: Gone框架是Go语言的强大依赖注入框架，提供松耦合架构、自动装配、配置注入等功能。支持结构体注入、函数参数注入，助力构建可测试的企业级应用。
---

# 整体介绍
在本章内容将回答以下问题：
- Gone框架是什么？
- Gone框架的特点是什么？
- Gone框架的应用场景是什么？
- Gone框架的优势是什么？
- Gone框架的缺点是什么？
- Gone框架的未来规划是什么？

## Gone框架是什么？
Gone框架是一个基于Go语言的依赖注入框架，它提供了一种松耦合的架构方式，能够帮助开发者构建可测试的企业级应用。

## 三个模块
Gone框架由框 **架核库gone** + **组件库goner** + **脚手架工具gonectl** 构成：

[![](/img/architecture.png)](/img/architecture.png)

### gone
模块名：github.com/gone-io/gone

Gone框架的核心模块，提供了依赖注入、配置注入、函数参数注入、注入对象管理、启动流程管理和相关接口定义。

### goner
模块名：github.com/gone-io/goner

Gone框架的组件库，提供一系列封装为Goner的组件，能够无缝对接Gone框架；提供一组examples项目，用于展示Gone框架的用法。
这些Goner组件，包括：配置管理、日志管理、常用数据库对接、常用消息队列对接、注册中心对接、分布式锁、远程调用、链路追踪等，具体介绍请查看 [gone-io/goner](https://github.com/gone-io/goner)。


### gonectl
模块名：github.com/gone-io/gonectl

Gone框架的脚手架工具，提供Gone项目的工程化支持，包括项目创建、依赖安装、代码生成等功能。

## 五个核心接口

### Goner
```go
type Goner interface {
    goneFlag()
}

type Flag struct{}

func (g *Flag) goneFlag() {}
```
可以看到，Goner 接口只有一个方法，即 goneFlag()，是一个私有方法，用于标识当前对象是一个Goner对象。
由于是私有方法，第三方package只能通过嵌入`gone.Flag`或其指针来实现Goner接口，一般来说我们推荐嵌入`gone.Flag`而不是指针。
:::tip
实际上，我们规定：**一个嵌入了`gone.Flag`的结构体指针为Goner对象。**
:::

Goner接口规范了加载到Gone框架的对象，必须是Goner对象，这个设计是Gone框架的一层限制，一方面简化了框架的实现，另一方面避免了Gone框架的误用。

### GonerKeeper(Keeper)
```go
type GonerKeeper interface {
    // 通过名称获取Goner
    GetGonerByName(name string) any

    // 通过类型获取Goner
    GetGonerByType(t reflect.Type) any

    // 通过类型和通配符模式获取Goner的集合
    GetGonerByPattern(t reflect.Type, pattern string) []any
}

type Keeper = GonerKeeper
```
通过 GonerKeeper 接口，可以获取注册或者加载到Gone框架中的Goner实例；该接口的实现直接由内核提供，用户可以直接在业务中注入该接口使用。

### Loader
```go

type LoadFunc = func(Loader) error

type Loader interface {
    // 将一个Goner加载到Gone框架中
    Load(goner Goner, options ...Option) error

    // 将一个Goner加载到Gone框架中，如果加载失败，则panic, 允许参数是一个加载函数 LoadFunc
    MustLoadX(x any) Loader

    // 将一个Goner加载到Gone框架中，如果加载失败，则panic
    MustLoad(goner Goner, options ...Option) Loader
}
```
该接口的实现也由内核提供，但一般情况不会作为注入的对象来手动加载对象，而是在编写了业务对象后提供一个加载函数 LoadFunc，由gonectl生成辅助代码来加载业务对象。

:::warning
通过注入`gone.Loader`对象，手动加载对象，由于手动加载的过程放生在启动流程之后，不能改变已经完成注入的对象，只会影响手动调用StructInjector 或者 FuncInjector 注入的对象。

一般情况下，不推荐这样使用。
:::


### StructInjector
```go
type StructInjector interface {
    // 结构体注入：使用Gone框架中的Goner实例给标记了`gone`的字段赋值
    InjectStruct(obj any) error
}
```
使用`StructInjector`可以在程序中动态的给一个结构体进行注入；该接口的实现直接由内核提供，用户可以直接在业务中注入该接口使用。

### FuncInjector
```go
type FuncInjector interface {
    //  函数注入：使用Gone框架中的Goner实例给函数的参数赋值
    InjectFuncParameters(fn any, injectBefore FuncInjectHook, injectAfter FuncInjectHook) (args []reflect.Value, err error)

    // 函数注入：使用Gone框架中的Goner实例给函数的参数赋值，返回一个函数，该函数的返回值就是函数的返回值
    InjectWrapFunc(fn any, injectBefore FuncInjectHook, injectAfter FuncInjectHook) (func() []any, error)
}
```
使用`FuncInjector`可以在程序中动态的给一个函数进行注入；该接口的实现直接由内核提供，用户可以直接在业务中注入该接口使用。

## 注入机制扩展设计
### Provider机制
### FieldInjector机制

## 三类辅助接口
### 错误处理
### 配置注入
### 日志管理

## 核心Goner：gone.Application

### 1.流程管理
### 2.hook管理