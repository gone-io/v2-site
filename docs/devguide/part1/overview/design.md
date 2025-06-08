---
sidebar_position: 2
hide_title: true
title: 1.2 Gone框架架构设计
keywords:
- Gone框架架构
- 依赖注入机制
- Goner接口
- 核心组件
- 生命周期管理
- Application
- 组件管理
- 函数参数注入
- 结构体注入
description: 深入了解Gone框架的核心架构设计，包括Goner接口、核心组件、依赖注入机制和完整的生命周期管理。掌握Application的创建、启动和停止流程，以及组件间的依赖关系处理。
---

# 1.2 Gone框架架构设计

## 1.2.1 核心组件介绍
### 1.2.1.1 Goner接口
Goner是Gone框架中所有可管理组件必须实现的接口。任何实现了Goner接口的结构体都可以被Gone框架管理。Goner接口定义了一个私有方法，这个私有方法只能通过嵌入Gone框架的`gone.Flag`来实现，从而约束了Gone框架组件的实现方式。
```go
type Goner interface {
    goneFlag()
}

type Flag struct{}

func (g *Flag) goneFlag() {}
```
:::tip
文档中说的某个接口或者结构体的实例，没有特别说明都是指的指针类型：比如Goner实例，就是实现了Goner接口的指针；结构体实例，结构体的指针。
:::

### 1.2.1.2 core（内核对象）

core是Gone框架的运行时对象，Gone框架启动时，会创建一个core对象，core对象负责所有Goner对象的管理，包括依赖分析、初始化，依赖注入等。core对象也实现了Goner接口并纳入了Gone框架的管理中，从而支持在业务组件中直接注入内核实现的接口。这些接口包含：
- **GonerKeeper**

    Goner保管员，用于在业务组件中动态获取Gone框架管理的对象：
    ```go
    type GonerKeeper interface {
        // GetGonerByName retrieves a component by its name.
        // The name should match either the component's explicit name
        // set via gone.Name() option or the name returned by its GonerName()
        // method if it implements NamedGoner.
        //
        // Parameters:
        //   - name: The name of the component to retrieve
        //
        // Returns:
        //   - any: The component instance if found, nil otherwise
        GetGonerByName(name string) any

        // GetGonerByType retrieves a component by its type.
        // The type should match either the exact type of the component or
        // an interface type that the component implements.
        //
        // Parameters:
        //   - t: The reflect.Type of the component to retrieve
        //
        // Returns:
        //   - any: The component instance if found, nil otherwise
        GetGonerByType(t reflect.Type) any

        GetGonerByPattern(t reflect.Type, pattern string) []any
    }
    ```
- **FuncInjector**

    函数注入器，用于在业务代码中，动态对函数进行参数注入：
    ```go
    type FuncInjector interface {
        // InjectFuncParameters injects dependencies into function parameters by:
        // 1. Using injectBefore hook if provided
        // 2. Using standard dependency injection
        // 3. Creating and filling struct parameters if needed
        // 4. Using injectAfter hook if provided
        // Returns the injected parameter values or error if injection fails
        InjectFuncParameters(
            fn any,
            injectBefore FuncInjectHook,
            injectAfter FuncInjectHook，
        ) (args []reflect.Value, err error)

        // InjectWrapFunc wraps a function with dependency injection.
        // It injects dependencies into the function parameters and
        // returns a wrapper function that:
        // 1. Calls the original function with injected parameters
        // 2. Converts return values to []any, handling nil interface
        // values appropriately
        // Returns wrapper function and error if injection fails
        InjectWrapFunc(
            fn any,
            injectBefore FuncInjectHook,
            injectAfter FuncInjectHook，
        ) (func() []any, error)
    }
    ```
- **StructInjector**

    结构体注入器，用于在业务代码中，动态对结构体进行字段注入：
    ```go
    type StructInjector interface {
        // InjectStruct performs dependency injection on the provided
        // Goner struct.
        // It scans the struct's fields for `gone` tags and injects the
        // appropriate dependencies.
        //
        // Parameters:
        //   - goner: goner: Should be a struct pointer.
        //
        // Returns:
        //   - error: Any error that occurred during injection
        InjectStruct(goner any) error
    }
    ```
- **Loader**

    加载器，支持在框架启动后给框架继续加载Goner，但是需要注意：新加载的对象不再影响已经完成依赖注入的对象，一般业务代码编写不推荐这样使用。
    ```go
    type Loader interface {
        // Load a Goner to the Gone Framework with optional configuration.
        //
        // Parameters:
        //   - goner: Struct pointer， which must implement Goner interface.
        //   - options: Optional configuration for how the component
        //     should be loaded.
        //
        // Returns:
        //   - error: Any error that occurred during loading
        Load(goner Goner, options ...Option) error

        // MustLoadX for Load a Goner to the Gone Framework without optional configuration
        // if the parameter x is a goner。
        // And if the parameter x LoadFunc function，it will be executed directly for loading
        // more goners. If LoadFunc return error, it will be panic.
        // Otherwise, it will panic.
        //   - x: Struct pointer， which must implement Goner interface.
        // Returns:
        //   - Loader: The Loader instance for further loading operations
        MustLoadX(x any) Loader

        // MustLoad a Goner to the Gone Framework with optional configuration.
        // If an error occurs during loading, it panics.
        //
        // Parameters:
        //   - goner: Struct pointer， which must implement Goner interface.
        //   - options: Optional configuration for how the component
        //     should be loaded.
        //
        // Returns:
        //   - Loader: The Loader instance for further loading operations
        MustLoad(goner Goner, options ...Option) Loader
    }
    ```


### 1.2.1.3 Application（程序运行时）

Application是一个结构体，代表一个应用程序，它包含一个core核心对象，实现了Goner的加载，生命周期的管理 和 程序的启停控制。

- **Application实例创建**
  1. 框架提供了一个全局函数`NewApp`用于创建一个新的Application实例，该函数支持传入多个 **LoadFunc 加载函数** 来加载业务Goner。
  ```go
  type LoadFunc = func(Loader) error

  func NewApp(loads ...LoadFunc) *Application {
      //...
  }
  ```
  2. 为了使用方便，框架还提供了一个**Application**实例的全局变量`Default`。同样为了方便使用，在Gone框架中定义了一些和Application方法同名的全局函数，比如`Load`、`Loads`、`Run`等，他们都是直接调用Default实例上的对应方法。
  ```go
  var Default = NewApp()
  ```

- **Goner加载**

  1. 在Application创建时，支持通过`NewApp`函数传入多个 **LoadFunc 加载函数** 来加载业务Goner。

  2. 在Application创建后，支持通过`Application.Load`方法链式调用加载业务Goner。
  ```go
  func (s *Application) Load(goner Goner, options ...Option) *Application{
      //...
      return s
  }
  ```
  3. 创建Application实例后，支持通过`Application.Loads`方法传入多个 **LoadFunc 加载函数** 批量加载业务Goner，并且支持链式调用。
  ```go
  func (s *Application) Loads(loads ...LoadFunc) *Application {
      //...
      return s
  }
  ```

    :::tip
    **LoadFunc 加载函数** 是一个有趣的设计：
    1. 它的参数是一个`gone.Loader`接口，这让支持加载Goner的同时，还支持调用一个子加载函数，加载函数可以成一个树状结构。
    2. 另外，我们在将某个功能封装成一个package时，可以提供一个`LoadFunc`加载函数，用于加载这个package中的所有Goner。
    :::



- **Application的启动**

  1. 使用`Run`方法启动Application实例。

        **Run** 方法支持多个参数，参数的类型可以是函数，也可以是`gone.RunOption`接口。

        函数类型参数：作为参数的函数本身，参数个数不受限制，参数类型必须是 **可注入的对象**，即是被加载到Gone框架中的对象，或者可以由**Provider**提供的对象。
        `gone.RunOption`接口类型参数：作为参数的结构体，结构体必须实现`gone.RunOption`接口，可以是自定义的选项，也可以是Gone框架提供的选项。Gone框架目前提供了一个选项结：`gone.OpWaitEnd()`，它的作用是调用Application的`WaitEnd`方法，阻塞主携程，等待操作系统的退出信号后结束运行。

        **RunOption接口的定义**
        ```go
        type RunOption interface {
            Apply(*Application)
        }
        ```

    1. 使用`Serve`方法启动Application实例。

        **Serve方法** 是 **Run方法** 的封装，它会在参数列表中增加一个`gone.OpWaitEnd()`选项，用于阻塞主携程，等待操作系统的退出信号后结束运行。
        ```go
        func (s *Application) Serve(funcList ...any) {
            funcList = append(funcList, OpWaitEnd())
            s.Run(funcList...)
        }
        ```
        :::tip 什么情况下需要阻塞主携程？
        当我们的程序需要在后台运行，比如提供Web服务时。
        :::


- **Application的停止**

    没有阻塞的应用，运行完后会自动停止。对于需要阻塞的服务性应用，我们可以调用 `Application.End`方法给Application实例发送结束信号，让Application实例停止运行。


## 1.2.2 依赖注入机制
我们将在 [**第3章 依赖注入系统**](/docs/devguide/part1/injection.md) 中详细介绍依赖注入机制，所以在这里只做简单介绍。

### 1.2.2.1 Goner字段注入
实现了Goner接口（嵌入了`gone.Flag`）的结构体，框架会自动对其标记了`gone`标签的字段进行依赖注入。
**标签语法**
```go
type Example struct {
  gone.Flag
  Field  string `gone:"${pattern}[,${extend}]"`
}
```
标签参数说明：
- **`${pattern}`**：匹配模式，用于查找目标对象
  - 具体名称：精确匹配指定名称的对象
  - `*` 或 ”空字符串”：按类型匹配
  - 通配符模式：支持`*`（任意字符）和`?`（单个字符）
- **`${extend}`**（可选）：扩展参数，传递给Provider的`Provide`方法

举例说明：
```go
type Service struct {
    gone.Flag
    db    *Database `gone:"*"`              // 按类型匹配
    cache *Redis    `gone:"main-cache"`     // 按名称匹配
    logs  []Logger  `gone:"log-*"`          // 通配符匹配
    config string   `gone:"config,app.name"` // 配置注入
}
```

### 1.2.2.2 函数参数注入
Gone框架除了支持**Goner字段注入**，还支持函数参数注入。函数参数注入，就是由Gone框架自动给函数提供部分或者全部参数，将原函数封装为另一个函数。
前面提供到的在启动函数，支持任意参数，就是通过函数参数注入实现的。
另外，我们在业务代码中，还可以注入**FuncInjector**来，使用它来封装函数，实现函数参数注入。

:::tip 注意
函数注入也是使用golang的反射机制实现，性能较低，不推荐在性能敏感的场景使用。
如果确实需要使用，建议将函数的注入和函数的调用分开，在启动阶段完成函数的注入，在运行阶段对函数进行调用。
:::

```go
package main

import (
    "github.com/gone-io/gone/v2"
    "testing"
)

func TestFuncInject(t *testing.T) {
    type Database struct {
        gone.Flag
        ID int
    }

    // 需要注入参数的函数
    handler := func(db *Database) {
        println("Database ID:", db.ID)
    }

    gone.
        NewApp().
        Load(&Database{ID: 1}).
        Run(func(injector gone.FuncInjector) {
            // 包装函数，自动注入参数
            wrappedHandler, err := injector.InjectWrapFunc(handler, nil, nil)
            if err != nil {
                t.Fatal(err)
            }

            // 调用包装后的函数，参数自动注入
            _ = wrappedHandler()
        })
}
```

## 1.2.3 生命周期管理

### 1.2.3.1 Application 的生命周期
Gone应用程序的生命周期分为下面几个阶段：
#### 1. Goner加载阶段

这个阶段，调用**Application.Load** 或者 **Application.Loads** 方法，完成所有Goner的加载。

#### 2. Goner组件的依赖分析阶段

这个阶段，**Application** 调用核心对象（**core**）完成对Goner组件的依赖分析，找出最优的初始化顺序，如果组件间存在循环依赖，Application会抛出panic。

#### 3. Goner的依赖注入和初始化阶段

这个阶段，**Application** 调用核心对象（**core**）使用上一阶段分析出的最佳初始化顺序，完成组件的依赖注入和初始化，如果某个组件初始化失败，Application也会抛出panic。

#### 4. 启动阶段
这个阶段，**Application**会获取所有**DaemonGoner**，并调用他们的**Start**方法，启动他们。

:::tip DaemonGoner的定义
**DaemonGoner** 指实现了**Daemon**接口的Goner，它的**Start**方法会在Application启动时被调用，**Stop**方法会在Application停止时被调用。

**Daemon** 接口的定义：

```go
type Daemon interface {
	Start() error
	Stop() error
}
```
:::

#### 5. 运行阶段
这个阶段，所有的Goner都准备好了，所有的DaemonGoner都已经启动完成，这个阶段应该是应用生命周期最长的阶段，业务逻辑和业务服务应该在这个阶段完成。

#### 6. 停止阶段
这个阶段，**Application**会获取所有**DaemonGoner**，并调用他们的**Stop**方法，停止他们，然后调用Goner的**AfterStop**方法（如果实现了该方法），进行一些清理工作。

:::tip DaemonGoner的启停顺序
加载Goner时，可以使用`gone.Order(order int)`来指定Goner的启动顺序，order越小，启动越早，如：
```go
gone.Load(&MyDaemon{}, gone.Order(1))
```
另外，Gone框架还提供几个默认的选项：
- gone.HighStartPriority()，order=-100
- gone.MediumStartPriority()， order=0
- gone.LowStartPriority()， order=100

:::



### 1.2.3.2 Goner的生命周期
在一个普通Goner上定义生命周期的特殊方法，这些方法会在Goner的生命周期中被调用。

#### 1.初始化前
初始化前，对应两个接口，分别是 **BeforeInitiator** 和 **BeforeInitiatorNoError**，如下：
```go
// 有错误返回的接口，返回错误，会导致Gone框整体加载失败抛出panic
type BeforeInitiator interface {
	BeforeInit() error
}

// 无错误参数返回的接口
type BeforeInitiatorNoError interface {
	BeforeInit()
}
```
如果实现 **BeforeInit** 方法，该方法会在 Goner 初始化之前被调用。

:::tip
**BeforeInit** 方法在调用时，使用依赖注入的字段还没有准备好，不应该在 **BeforeInit** 方法中访问依赖注入的字段。
:::

#### 2.初始化中
初始化中，也对应两个接口，分别为 **Initiator** 和 **InitiatorNoError**，接口如下：


```go
// 有错误返回的接口，返回错误，会导致Gone框整体加载失败抛出panic
type Initiator interface {
	Init() error
}
// 无错误参数返回的接口
type InitiatorNoError interface {
	Init()
}
```
如果实现了 **Init** 方法，Gone框架会调用该方法完成初始化，该方法被调用时使用依赖注入的字段已经准备好，可以被访问和使用，在该方法中可以完成组件初始化的逻辑。


#### 3.程序启动前
程序启动前，对应一个接口 **BeforeStarter**，如下：
```go
type BeforeStarter interface {
	BeforeStart()
}
```
如果实现了 **BeforeStart** 方法，Gone框架会在 **“Goner的依赖注入和初始化阶段“后 与 “启动阶段”前** 调用该方法。

#### 4.程序启动后
程序启动后，对应一个接口 **AfterStarter**，如下：
```go
type AfterStarter interface {
	AfterStart()
}
```
如果实现了 **AfterStart** 方法，Gone框架会在 **“启动阶段”后 与 “运行阶段”前** 调用该方法。


#### 5.程序停止前
程序停止前，对应一个接口 **BeforeStopper**，如下：
```go
type BeforeStopper interface {
	BeforeStop()
}
```
如果实现了 **BeforeStop** 方法，Gone框架会在 **“运行阶段”后 与 “停止阶段”前** 调用该方法。

#### 6.程序停止后
程序停止后，对应一个接口 **AfterStopper**，如下：
```go
type AfterStopper interface {
	AfterStop()
}
```
如果实现了 **AfterStop**方法，Gone框架会在 **“停止阶段”后期** 调用该方法，完成资源清理工作。


### 1.2.3.4 HookRegister
我们初了在Goner上实现Goner生命周期接口外，还可以通过注入 **HookRegisters** 来实现在特定生命周期的回调，他们是一组函数：

#### BeforeStart
```go
type AfterStart func(Process)
```
#### AfterStart
```go
type BeforeStop func(Process)
```
#### BeforeStop
```go
```
#### AfterStop
```go
type AfterStop func(Process)
```

使用方法如下：
```go
type Example struct {
    gone.Flag
    beforeStart gone.BeforeStart `gone:"*"`
    afterStart gone.AfterStart `gone:"*"`
    beforeStop gone.BeforeStop `gone:"*"`
    afterStop gone.AfterStop `gone:"*"`
}

func (e *Example) Init() {
    e.beforeStart(func(){
        log.Println("before start")
    })
    e.afterStart(func(){
        log.Println("after start")
    })
    e.beforeStop(func(){
        log.Println("before stop")
    })
    e.afterStop(func(){
        log.Println("after stop")
    })
}