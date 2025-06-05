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

# Apollo配置中心

## 介绍

Apollo是由携程框架部门研发并开源的企业级分布式配置管理平台。自2016年开源以来，已成为业界标杆级的配置中心解决方案，在GitHub上获得超过2.7万星标，并被451家企业在生产环境中广泛应用，充分验证了其稳定性和实用性。


## 快速开始

### 1. 安装Apollo组件

使用Gone框架的命令行工具一键安装：

```shell
gonectl install goner/apollo
```

:::tip 提示
gonectl是Gone框架的官方命令行工具，用于快速安装和管理框架组件。

如需安装gonectl，请参考：[gonectl安装指南](/docs/quickstart/install/gonectl.md)
:::

### 2. 卸载Viper组件（可选）

如果您之前安装了goner/viper，建议先进行卸载以避免冲突：

```shell
gonectl install goner/apollo
```

在弹出的选择界面中，取消勾选"github.com/gone-io/goner/viper.Load"，然后确认执行。

![viper卸载界面](/img/viper-uninstall.png)

### 3. 配置Apollo连接

#### 默认配置文件

创建`config/default.*`文件（支持yaml、json、toml、properties格式）：

```yaml title="config/default.yaml"
apollo:
  appId: SampleApp                    # 应用标识符
  cluster: default                    # 集群名称
  ip: http://127.0.0.1:8080          # Apollo服务器地址
  namespace: application,test.yml     # 命名空间列表，多个用逗号分隔
  secret: c946bca94cc041a08354233a1ef9f94a  # 访问密钥
  isBackupConfig: false              # 是否启用配置备份
  watch: true                        # 是否监听配置变化
  useLocalConfIfKeyNotExist: true    # Key不存在时是否使用本地配置
```

#### 环境特定配置

可创建环境相关配置文件：`config/${env}.*`

:::tip 配置说明
Apollo相关配置属于本地配置范畴，详细规则请参考[本地配置文档](../local-config.md)。
:::

### 配置参数详解

| 参数名称                  | 功能说明                           | 默认值      | 是否必填 |
| ------------------------- | ---------------------------------- | ----------- | -------- |
| appId                     | 在Apollo中注册的应用唯一标识       | 无          | 是       |
| cluster                   | 集群环境标识，用于区分不同部署环境 | default     | 否       |
| ip                        | Apollo配置服务的访问地址           | 无          | 是       |
| namespace                 | 命名空间配置，支持多个空间同时管理 | application | 否       |
| secret                    | 应用访问Apollo的安全密钥           | 无          | 是       |
| isBackupConfig            | 是否在本地备份远程配置             | true        | 否       |
| watch                     | 是否启用配置变更实时监听           | false       | 否       |
| useLocalConfIfKeyNotExist | 远程配置缺失时是否回退到本地配置   | true        | 否       |

## 快速体验

通过模板快速创建Apollo集成项目：

```shell
gonectl create -t config/center/apollo apollo-demo
```

## 高级功能

### 动态配置监听

#### 启用配置监听

首先在配置文件中开启监听功能：

```yaml
apollo:
  watch: true
```

#### 自动配置更新

使用指针类型接收配置注入，实现配置变更时的自动更新：

```go
type DatabaseConfig struct {
    gone.Flag
    Host     *string `gone:"config,key=db.host"`
    Port     *int    `gone:"config,key=db.port"`
    Username *string `gone:"config,key=db.username"`
}
```

#### 主动监听配置变化

通过gone.ConfWatcher实现对特定配置项的变化监听：

```go
type ConfigManager struct {
    gone.Flag
    watcher gone.ConfWatcher `gone:"*"`
}

func (c *ConfigManager) Init() {
    // 监听数据库连接配置变化
    c.watcher("db.host", func(oldVal, newVal any) {
        log.Printf("数据库地址从 %v 变更为 %v", oldVal, newVal)
        // 在此处理配置变更逻辑，如重建连接池等
    })

    // 监听多个配置项
    c.watcher("cache.redis.addr", func(oldVal, newVal any) {
        log.Printf("Redis地址配置更新: %v -> %v", oldVal, newVal)
    })
}
```

### 多命名空间管理

#### 配置多命名空间

在Apollo管理控制台中合理规划命名空间结构，然后在配置文件中指定：

```yaml
apollo:
  namespace: application,database.yml,redis.properties,mq.json
```

#### 命名空间优先级

:::tip 重要提醒
- 配置多个命名空间时，系统按指定顺序依次加载
- 当同一配置键在多个命名空间中存在时，后加载的命名空间配置会覆盖前面的
- 命名空间名称必须包含正确的文件扩展名（如.yml、.properties、.json等）
- 建议按照配置重要性和覆盖关系合理安排命名空间顺序
:::

#### 最佳实践示例

```yaml
apollo:
  # 推荐的命名空间加载顺序：
  # 1. 基础应用配置（最低优先级）
  # 2. 数据库配置
  # 3. 缓存配置  
  # 4. 环境特定配置（最高优先级）
  namespace: application,database.yml,cache.properties,env-specific.json
```

通过这种配置方式，可以实现配置的分层管理和灵活覆盖，满足复杂业务场景的配置需求。