---
sidebar_position: 1
hide_title: true
title: Apollo
keywords:
- Apollo配置中心
- Gone框架
- 实时配置推送
- 多命名空间管理
- 动态配置监听
description: Apollo是携程开源的企业级分布式配置中心，自2016年开源以来已获得2.7万+GitHub星标，被451家企业生产环境采用。该工具提供四层配置管理维度（应用/环境/集群/命名空间），支持配置实时推送、灰度发布和企业级权限管控。在Gone框架中集成Apollo非常简便，通过gonectl工具一键安装，支持多种配置文件格式（YAML/JSON/TOML/Properties）。核心特性包括：配置变更秒级生效、支持多命名空间管理、提供动态配置监听机制，以及完善的版本回滚和操作审计功能，是现代微服务架构中配置管理的理想选择。
---

# Apollo

## 介绍
Apollo配置中心是由携程框架部门研发的分布式配置管理工具，自2016年开源以来已成为业界广泛采用的解决方案。截至2025年，其GitHub仓库已收获超2.7万星标，被451家企业在生产环境中登记使用，足见其技术影响力和社区活跃度。

​​核心功能​​：
- ​​灵活的配置维度​​：支持应用、环境、集群、命名空间四层管理，可通过公共命名空间实现多应用共享配置，或通过关联类型覆盖特定场景需求。
- ​实时生效与灰度发布​​：配置修改后通过长连接秒级推送至客户端，支持灰度发布（仅部分实例生效），无需重启服务。
- ​企业级安全管控​​：提供编辑与发布分离的权限控制、操作审计日志及版本回滚机制，确保配置变更的规范性和可追溯性。

## 使用

### 1. 使用gonectl安装goner/apollo

```shell
gonectl install goner/apollo
```
:::tip
gonectl是Gone框架的命令行工具，用于快速安装和管理Gone框架的各种组件。

安装参考：[gonectl安装](/dcs/quickstart/install/gonectl.md)
:::

### 2. 卸载goner/viper（如果已经安装）
执行下面命令，去掉"github.com/gone-io/goner/viper.Load"的勾选，然后回车确认。
```shell
gonectl install goner/apollo
```
![](/img/viper-uninstall.png)

### 3. 创建配置文件

- 默认配置文件：`config/default.*`，支持yaml、json、toml、properties等格式。

```yaml title="config/default.yaml"
apollo:
  appId: SampleApp # 应用 ID
  cluster: default # 集群名称
  ip: http://127.0.0.1:8080 # Apollo 服务器地址
  namespace: application,test.yml # namespace 名称，支持多个，用逗号分隔
  secret: c946bca94cc041a08354233a1ef9f94a # 密钥
  isBackupConfig: false # 是否备份配置文件
  watch: true # 是否监听配置变化
  useLocalConfIfKeyNotExist: true # 如果 key 不存在，是否使用本地配置
```

- 环境相关配置文件：`config/${env}.*`，支持yaml、json、toml、properties等格式。

:::tip
apollo相关配置属于本地配置部分，可以参考[本地配置](../local-config.md)规则。
:::

**配置说明**
| 配置项                    | 说明                              | 默认值      |
| ------------------------- | --------------------------------- | ----------- |
| appId                     | 应用 ID                           | 无          |
| cluster                   | 集群名称                          | default     |
| ip                        | Apollo 服务器地址                 | 无          |
| namespace                 | 命名空间                          | application |
| secret                    | 密钥                              | 无          |
| isBackupConfig            | 是否备份配置文件                  | true        |
| watch                     | 是否监听配置变化                  | false       |
| useLocalConfIfKeyNotExist | 如果 key 不存在，是否使用本地配置 | true        |

## 示例
从模板创建一个项目：
```shell
gonectl create -t config/center/apollo apollo-demo
```
## 高级用法
### 使用动态配置

#### 1. 将配置apollo.watch 设置为 true
```yaml
apollo:
  watch: true
```

#### 2. 使用指针类型接受配置注入，并在配置变化时自动更新

```go
type Config struct {
    gone.Flag
    AppId *string `gone:"config,key=appId"`
}
```

#### 3. 使用gone.ConfWatcher主动监听某个key的变化

```go
type Config struct {
    gone.Flag
    watcher gone.ConfWatcher `gone:"*"
}

func (c *Config) Init() {
    c.watcher("key", func(oldVal, newVal any){
        // 配置变化
        log.Printf("key change from %v to %v", oldVal, newVal)
    })
}
```

### 配置多个命名空间
在apollo上合理规划命名空间，然后在配置文件中配置多个命名空间，用逗号分隔。
```yaml
apollo:
  namespace: application,database.yml
```
:::tip
配置多个命名空间时，会按照顺序依次读取，如果某个key在多个命名空间中都存在，会使用最后一个命名空间的值，空间名称需要包含后缀。
:::