---
sidebar_position: 3
hide_title: true
title: 配置管理
keywords:
- Gone框架配置管理
- 配置注入
- 动态配置
- 多环境配置
- 远程配置中心
- 微服务配置
description: Gone框架提供了完整的三层配置管理体系：内核配置支持、本地配置支持和远程配置支持。内核配置通过环境变量实现配置注入，支持动态配置监听和自定义配置组件。本地配置基于viper组件，支持JSON、YAML、TOML等多种格式，提供多环境支持和配置文件覆盖机制。框架会自动搜索程序目录、config子目录等多个路径加载配置文件，支持default默认配置和环境特定配置文件。远程配置支持Apollo、Nacos、Consul等主流配置中心，实现配置的集中管理和动态更新。配置管理采用渐进增强设计，从简单的环境变量配置到复杂的微服务配置中心，满足不同场景需求。框架还提供了配置监听、配置覆盖优先级、测试环境支持等企业级特性，是构建现代Go应用程序的理想配置解决方案。
---

# 配置管理

Gone框架的配置分层三个级别: **1.内核配置支持** => **2.本地配置支持** => **3.远程配置支持**，逐层递进，渐进增强。


## 内核配置支持
只依赖框架内核模块，只需要引入`github.com/gone-io/gone`即可实现从环境变量中读取配置，自动注入到标记的结构体变量，下面讲解如何使用配置注入。

### 配置注入

```go
type Service struct {
    gone.Flag
    confKey string `gone:"config,config.key"`
}
func init(){
    gone.Load(&Service{})
}
```
配置注入的方式是通过标记`gone:"config,config.key"`，其中`config`是配置的名称，`config.key`是配置的键名。

:::tip
1. 需要将结构体变量加载到Gone框架中，才能实现配置注入；
2. 结构体需要匿名嵌入`gone.Flag`，才能使用gone.Load完成加载。
3. Gone框架启动后会尝试从环境变量`GONE_CONFIG_KEY`中读取配置，将配置注入到结构体变量中；
4. 注意环境变量`GONE_CONFIG_KEY`的命名以`GONE_`开头，后面的键名需要将小写字母替换大写字母，使用下划线代替键名中的`.`
:::


### 基础配置接口
```go
type Configure interface {
    // Get 从配置源中获取配置值
    // key: 配置的键名
    // valuePointer: 配置值的指针，用于存储配置值
    // defaultVal: 当配置不存在时，使用默认值
    Get(key string, valuePointer any, defaultVal string) error
}
```
实现`Configure`并且替换掉默认配置组件，即可实现自定义配置组件，参考代码：
```go
type CustomConfigure struct {
    gone.Flag
}
func (c *CustomConfigure) Get(key string, valuePointer any, defaultVal string) error {
    // 实现获取配置的逻辑
    return nil
}

func LoadCustomConfigure(loader gone.Loader) error {
    return loader.Load(
        &CustomConfigure{},
        gone.Name(gone.ConfigureName), //设置组件名称，这里为了替换默认的Configure组件，需要设置为gone.ConfigureName
        gone.IsDefault(new(gone.Configure)), //将CustomConfigure 设置为 Configure接口的默认实现
        gone.ForceReplace(), // 强制替换原有的配置提供者
    )
}
```


### 动态配置支持

#### 内核接口支持
```go
type ConfWatchFunc func(oldVal, newVal any)

// 定义动态配置接口，用于监听配置变化
type DynamicConfigure interface {
    Configure
    Notify(key string, callback ConfWatchFunc)
}

// 用于注入组件中，监听配置变化
type ConfWatcher func(key string, callback ConfWatchFunc)
```
#### 动态配置使用
```go
type Service struct {
    gone.Flag
    confKey *string `gone:"config,config.key"`
    watcher gone.ConfWatcher `gone:"*"`
}
func(s* Service) Init(){
    s.watcher("config.key", func(key string, value interface{}) {
        //todo 处理配置变化的逻辑
    })
}
```
:::tip
1. 需要动态变化的配置可以使用指针类型来接受值，配置变化时，对应的指针类型也会被更新，这种情况需要组件逻辑功能动态依赖配置值的变化；
2. 另外一种方式是，在组件中注入`gone.ConfWatcher`，使用`gone.ConfWatcher`可以监听配置变化，在回调函数中处理配置变化的逻辑；需要注意：回调函数不应该是阻塞的，如果存在比较耗时的操作应该新开一个协程处理。
:::


#### 已经支持动态配置的配置组件
- [goner/apollo](https://github.com/gone-io/goner/tree/main/apollo)
- [goner/nacos](https://github.com/gone-io/goner/tree/main/nacos)
- [goner/viper/remote](https://github.com/gone-io/goner/tree/main/viper/remote)

### 配置接口和实现原理
配置注入，本质是基于Gone框架的Provider机制做的扩展，在内核中实现了一个名为`config`的`gone.NamedProvider`，它实质上是接管了所有`gone:"config,xxx"`的配置注入，它会根据配置的键名，调用`Configure`的`Get`方法，获取配置值，并将配置值注入到标记的结构体变量中。


## 本地配置支持
内核配置支持，可以用于goner组件测试，但是实际在生产中我们更大的可能需要使用本地文件来对系统做配置。为了实现本地配置的支持，我们提供了`goner/viper`组件，它基于`viper`实现了本地配置的支持，得益于viper本身的强大，`goner/viper`组件可以支持多种配置格式的配置文件，包括`json`、`yaml`、`toml`、`properties`等。
另外在此基础上，我们做了多环境支持，和配置文件覆盖的优先级。

### 配置文件加载路径
1. 程序（可执行文件）所在目录
2. 程序所在目录下的`config`子目录
3. 用户当前工作目录
4. 用户当前工作目录下的`config`子目录
5. 如果使用`gone.Test()`启动程序，还行加载：
   - 5.1 当前module的根目录下的`config`子目录
   - 5.2 当前工作目录下的`testdata`子目录
   - 5.3 当前工作目录下的`testdata/config`子目录
6. 如果设置了环境变量 CONF 或启动时使用了 -conf 选项，还会查找指定的配置文件路径

:::tip
1. gone.Test()可以用于编写单元测试，一般 和 goner/viper 组件配合使用；
2. 方便对不同package的配置进行单独管理；
:::



### 多环境支持
- 默认配置文件，配置文件名为:`default.*`
- 环境配置文件，配置文件名为:`[环境名称].*`，例如：`dev.yaml`、`prod.properties`, 其中`[环境名称]`可以是任意字符串，环境配置文件将覆盖默认配置文件；
- 环境变量如何定义：
  - 启动时使用`-env`选项，例如：`-env=dev`
  - 启动时使用`ENV`环境变量，例如：`ENV=dev`
- 环境变量为空时，默认环境为`local`。


### 本地配置最佳实践
1. 所有配置文件都放在`config`子目录下，方便管理；
2. 使用一种配置文件格式，比如`yaml`;
3. 提供一个默认配置文件，例如：`config/default.yaml`；
4. 定义不同环境的配置文件，例如：`config/dev.yaml`，`config/prod.yaml`，覆盖默认配置文件；
5. 提供`local`环境的配置文件，例如：`config/local.yaml`，用于本地开发；
6. 本地开发配置应该是完整且开箱可用的，即 其他小伙伴下载代码后不需要做任何配置调整就能直接运行代码；

### 环境变量、启动参数作为配置
goner/viper 组件还支持从环境变量、启动参数中读取配置，从环境变量读取配置是兼容“内核配置支持”的，规则依然是`GONE_`开头，后面的键名需要将小写字母替换大写字母，使用下划线代替键名中的`.`。

## 远程配置支持

随着微服务的流行，一个系统动辄十几个服务，集中管理配置变成了一件很重要的事情，市面上也出现了许多优秀的配置管理系统，比如：`apollo`、`nacos`、`consul`等。
为了方便使用这些配置管理系统，我们提供了`goner/apollo`、`goner/nacos`、`goner/viper/remote`等组件，使用他们可以很方便的使用这些配置管理系统。
这些组件的设计逻辑，是基于`goner/viper`读取本地配置，拉取远程配置中心的配置，再合并本地配置，监控远程配置中心的配置变化，实现配置的动态更新。


## 更多内容
import DocCardList from '@theme/DocCardList';

<DocCardList />