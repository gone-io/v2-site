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

想要深入了解Gone框架的"内部构造"吗？就像拆解一台精密的瑞士手表一样，让我们一起探索Gone框架的核心组件，看看这个"智能管家"是如何运作的。

## 1.2.1 核心组件介绍
### 1.2.1.1 Goner接口：组件的"身份证"
Goner接口就像是Gone框架世界里的"身份证"——任何想要被Gone框架管理的组件都必须持有这张"身份证"。这是一个非常巧妙的设计：通过一个私有方法来确保只有"正规渠道"才能获得这张"身份证"。
```go
type Goner interface {
    goneFlag()  // 这是一个"私有方法"，外部无法直接实现
}

type Flag struct{}  // Gone框架提供的"万能钥匙"

func (g *Flag) goneFlag() {}  // 只有嵌入Flag才能获得"身份证"
```

**设计精髓**：就像办身份证需要到指定的派出所一样，想要成为Goner只能通过嵌入`gone.Flag`这个"官方印章"。这样设计的好处是：
- 🔒 **安全性**：防止"假冒伪劣"组件混入系统
- 🎯 **一致性**：确保所有组件都遵循相同的"入籍"流程
- 🛡️ **可控性**：框架能够完全掌控组件的生命周期

:::tip 💡 关于指针类型的说明
文档中提到的"实例"默认都是指针类型：
- **Goner实例** = 实现了Goner接口的结构体指针
- **结构体实例** = 结构体的指针

就像我们说"这个人"时，通常指的是这个人的"地址"（内存地址），而不是这个人的"复制品"。
:::

### 1.2.1.2 core（内核对象）：框架的"大脑中枢"

core就像是Gone框架的"大脑中枢"——一个超级智能的"总指挥官"。当Gone框架启动时，这个"总指挥官"就开始工作了，负责协调管理所有的Goner组件。

**core的职责清单**：
- 🧠 **依赖分析师**：分析组件之间的依赖关系，就像理清家族关系图一样
- 🏗️ **初始化工程师**：按照最优顺序初始化组件，避免"先有鸡还是先有蛋"的问题
- 💉 **注入专家**：自动完成依赖注入，就像智能输液泵一样精准

**有趣的设计**：core对象本身也是一个Goner！这就像"总指挥官"也要遵守军队纪律一样，它把自己也纳入了管理体系中。这样设计的好处是，业务组件可以直接"面见总指挥官"，获取框架的核心能力。

**core提供的"超能力"接口**：
- **GonerKeeper：组件的"档案管理员"**

    GonerKeeper就像是一个超级智能的"档案管理员"，它知道系统中每一个组件的"家庭住址"。无论你是想通过"姓名"（name）找人，还是通过"职业"（类型）找人，它都能快速定位。

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

    **实用场景**：
    - 🔍 **动态查找**：在运行时根据需要查找特定组件
    - 🎯 **精确定位**：通过name或类型快速定位目标组件
    - 📋 **模式匹配**：使用通配符模式批量获取组件
- **FuncInjector：函数的"智能助手"**

    FuncInjector就像是一个贴心的"智能助手"，它能够自动识别函数需要什么参数，然后从"仓库"中找到对应的组件，自动"投喂"给函数。这就像点外卖时，外卖小哥会根据你的订单自动配齐所有菜品一样。

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

    **魔法原理**：
    - 🔍 **参数识别**：自动分析函数签名，了解需要哪些类型的参数
    - 🎯 **智能匹配**：从已注册的组件中找到匹配的实例
    - 🚀 **自动调用**：将找到的组件作为参数，调用目标函数

    **典型应用**：
    - 🎮 **控制器方法**：Web请求处理函数的参数自动注入
    - 🔧 **工具函数**：需要多个依赖的工具函数调用
    - 🧪 **测试场景**：测试函数的依赖自动装配
- **StructInjector：结构体的"装配工"**

    StructInjector就像是一个经验丰富的"装配工"，它能够自动识别结构体中哪些字段需要"安装组件"，然后从"零件库"中找到合适的组件，精确地"安装"到指定位置。这就像组装电脑时，装配工会根据主板上的接口自动安装对应的硬件一样。

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

    **工作流程**：
    - 🔍 **字段扫描**：检查结构体中带有特定标签的字段
    - 🎯 **组件匹配**：根据字段类型和标签信息查找对应组件
    - 🔧 **精确安装**：将找到的组件"安装"到对应字段

    **应用场景**：
    - 🏗️ **组件初始化**：在组件创建后自动装配其依赖
    - 🧪 **测试准备**：为测试对象自动注入模拟依赖
    - 🔄 **动态装配**：运行时为已存在的对象补充依赖
    ```
- **Loader：组件的"入职办理员"**

    Loader就像是公司的"入职办理员"，负责为新来的组件办理"入职手续"。它会为每个新组件分配"工号"、建立"档案"，并将其正式纳入Gone框架的"员工花名册"中。

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

    **办理流程**：
    - 📝 **身份验证**：确认组件实现了Goner接口（持有"身份证"）
    - 🏷️ **分配ID**：为组件分配唯一标识符
    - 📋 **建立档案**：记录组件的类型、依赖关系等信息
    - 🗂️ **归档管理**：将组件信息存入框架的管理系统

    **使用时机**：
    - 🚀 **应用启动**：批量加载应用的核心组件
    - 🔌 **插件加载**：动态加载插件组件
    - 🧪 **测试环境**：为测试加载特定的模拟组件

    :::warning 注意事项
    支持在框架启动后给框架继续加载Goner，但是需要注意：新加载的对象不再影响已经完成依赖注入的对象，一般业务代码编写不推荐这样使用。
    :::


### 1.2.1.3 Application（程序运行时）：应用的"总司令部"

Application就像是整个应用的"总司令部"——它是Gone框架世界的"最高指挥中心"。如果说core是"大脑中枢"，那么Application就是"司令官"，负责统筹全局、发号施令。

**Application的角色定位**：
- 🏛️ **应用门面**：对外提供统一的应用程序接口
- 🎮 **生命周期管理**：控制应用的启动、运行、停止全过程
- 🏗️ **资源协调**：协调core和其他核心资源的工作
- 🚪 **入口控制**：作为Gone框架的唯一入口点

Application是一个结构体，代表一个应用程序，它包含一个core核心对象，实现了Goner的加载，生命周期的管理 和 程序的启停控制。

```go
type Application struct {
    core *core  // 内嵌的"大脑中枢"，负责具体的组件管理工作
}
```

**设计亮点**：
- 🎯 **单一职责**：Application专注于应用级别的控制，具体的组件管理委托给core
- 🔗 **组合模式**：通过组合core来获得强大的组件管理能力
- 🛡️ **封装性**：对外隐藏core的复杂性，提供简洁的应用接口

- **Application实例创建：搭建你的"指挥部"**

  创建Application就像搭建一个"指挥部"——你需要先建好"司令部大楼"，然后把各个"部门"（组件）搬进来。

  1. **NewApp："指挥部"建造师**

     框架提供了一个专业的"建造师"函数`NewApp`，它能够快速搭建一个功能完整的"指挥部"，并支持在建造过程中就安排好各个"部门"的入驻。

     ```go
     type LoadFunc = func(Loader) error  // 搬家公司的"作业流程"

     func NewApp(loads ...LoadFunc) *Application {  // 建造指挥部并安排部门入驻
         //...
     }
     ```

     **LoadFunc："搬家公司"**

     LoadFunc就像是专业的"搬家公司"，负责把各种组件"搬运"到Gone框架中。每个LoadFunc都知道如何正确地"打包"和"安置"特定类型的组件。

     **LoadFunc的工作流程**：
     - 📦 **打包组件**：将业务组件准备好
     - 🚚 **运输装载**：通过Loader将组件加载到框架
     - 📋 **确认清单**：返回加载结果（成功或错误）

  2. **Default："总部大楼"**

     为了使用方便，框架还提供了一个现成的"总部大楼"——全局变量`Default`。这就像有一个预建好的"标准指挥部"，开箱即用。

     ```go
     var Default = NewApp()  // 预建的"总部大楼"
     ```

     **便民服务**：Gone框架还提供了一些"便民服务"——全局函数如`Load`、`Loads`、`Run`等，它们都是直接调用Default实例的对应方法，让你无需手动创建Application就能快速开始工作。

- **Goner加载：组建你的"梦之队"**

  Application提供了多种"招聘"方式来组建你的组件"梦之队"：

  1. **创建时批量招聘**：在Application创建时，支持通过`NewApp`函数传入多个 **LoadFunc 加载函数** 来加载业务Goner。

  2. **逐个精准招聘**：在Application创建后，支持通过`Application.Load`方法链式调用加载业务Goner。
  ```go
  func (s *Application) Load(goner Goner, options ...Option) *Application{
      //...
      return s
  }
  ```

  3. **委托批量招聘**：创建Application实例后，支持通过`Application.Loads`方法传入多个 **LoadFunc 加载函数** 批量加载业务Goner，并且支持链式调用。
  ```go
  func (s *Application) Loads(loads ...LoadFunc) *Application {
      //...
      return s
  }
  ```

  **三种招聘模式对比**：

  🎯 **精准招聘（Load）**：
  - 适合已经明确知道要招聘哪些"员工"（组件）的情况
  - 直接把组件"简历"（实例）递交给HR（Application）
  - 简单直接，立即生效

  🏢 **批量招聘（Loads）**：
  - 适合需要"猎头公司"（LoadFunc）帮忙招聘的情况
  - 可以委托多个"猎头公司"同时工作
  - 支持复杂的招聘逻辑和条件筛选

  🚀 **启动时招聘（NewApp）**：
  - 在"公司成立"时就确定核心团队
  - 一步到位，高效便捷
  - 适合标准化的组件配置

  **链式调用**：所有方法都返回Application实例，支持"流水线"式的连续操作，就像搭积木一样简单。

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


## 1.2.2 依赖注入机制：智能的"管家服务"
我们将在 [**第3章 依赖注入系统**](/docs/devguide/part1/injection.md) 中详细介绍依赖注入机制，所以在这里只做简单介绍。

依赖注入就像是一个贴心的"智能管家"——它会自动识别每个组件需要什么"工具"或"服务"，然后从"仓库"中找到对应的组件，精确地"送"到需要的地方。这样，组件们就不用自己去"找东西"，专心做好自己的本职工作就行了。

### 1.2.2.1 Goner字段注入：组件的"专属配送"

实现了Goner接口（持有"身份证"）的结构体，就像是VIP客户一样，可以享受框架提供的"专属配送"服务。只要在需要的字段上贴上`gone`标签这个"订单标签"，"智能管家"就会自动识别并配送对应的组件。

**配送流程**：
- 🏷️ **识别标签**：框架扫描所有带`gone`标签的字段
- 🔍 **查找库存**：根据字段类型在"组件仓库"中查找匹配的组件
- 📦 **精准配送**：将找到的组件"配送"到对应字段
- ✅ **确认签收**：完成依赖注入，组件可以正常使用

**标签语法："订单"的填写规范**

```go
type Example struct {
  gone.Flag  // VIP身份证
  Field  string `gone:"${pattern}[,${extend}]"`  // 订单标签
}
```

**"订单标签"参数说明**：
- **`${pattern}`**：匹配模式，告诉"管家"要找什么
  - 具体名称："给我那个叫XXX的组件"
  - `*` 或 "空字符串"："给我一个这种类型的组件，任何都行"
  - 通配符模式："给我所有名字像XXX的组件"（支持`*`和`?`通配符）
- **`${extend}`**（可选）：额外说明，传递给Provider的特殊要求

**实际"下单"示例**：
```go
type Service struct {
    gone.Flag
    db    *Database `gone:"*"`              // "给我一个Database，任何都行"
    cache *Redis    `gone:"main-cache"`     // "给我那个叫main-cache的Redis"
    logs  []Logger  `gone:"log-*"`          // "给我所有名字以log-开头的Logger"
    config string   `gone:"config,app.name"` // "给我配置中app.name的值"
}
```

**三种"购物"模式**：

🎯 **按类型购买（`gone:"*"`）**：
- 就像说"给我一台电脑"，不指定品牌型号
- 框架会在"仓库"中找到第一个匹配类型的组件
- 适合只有一个同类型组件的情况
- 简单便捷，最常用的方式

🏷️ **按名称购买（`gone:"specific-name"`）**：
- 就像说"给我那台编号为ABC123的电脑"
- 框架会精确查找指定名称的组件
- 适合有多个同类型组件需要区分的情况
- 精确控制，避免"拿错东西"

🔍 **批量购买（`gone:"pattern-*"`）**：
- 就像说"给我所有苹果牌的设备"
- 框架会找到所有匹配模式的组件
- 适合需要同时使用多个相似组件的情况
- 灵活强大，支持复杂的组件管理

### 1.2.2.2 函数参数注入：函数的"智能助理"

Gone框架除了支持**Goner字段注入**，还提供了更加灵活的**函数参数注入**。这就像给每个函数配备了一个"智能助理"——它会自动准备好函数需要的"工具"和"材料"，让函数专心处理核心业务逻辑。

**工作原理**：框架会分析函数的"需求清单"（参数列表），然后从"工具库"中自动取出对应的组件，最后把原函数"包装"成一个更简洁的新函数。

```go
// 原函数：需要很多"工具"的复杂函数
func HandleUser(db Database, logger Logger, userID string) error {
    // 处理用户逻辑
    return nil
}

// 框架"包装"后：只需要提供核心参数的简洁函数
func(userID string) error {
    // "智能助理"自动准备好db和logger
    return HandleUser(db, logger, userID)
}
```

**注入策略**：
- 🔧 **自动识别**：框架自动识别哪些参数可以从"工具库"中获取
- 🎯 **精准匹配**：根据参数类型精确匹配对应的组件
- 📦 **智能包装**：将复杂函数包装成简洁易用的新函数
- 🚀 **即插即用**：新函数可以直接使用，无需手动传递依赖

前面提到的启动函数支持任意参数，就是通过函数参数注入实现的。另外，我们在业务代码中，还可以注入**FuncInjector**来使用它封装函数，实现函数参数注入。

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