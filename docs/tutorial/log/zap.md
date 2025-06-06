---
sidebar_position: 1
hide_title: true
title: goner/zap 组件
keywords:
- Gone
- Gone框架
- Zap
- 日志组件
- 日志管理
- Logger
- OpenTelemetry
description: Gone框架的zap日志组件详细介绍，包括安装配置、使用方法、日志轮转、远程配置以及与OpenTelemetry的集成
---

# goner/zap 组件
在生产环境，我们推荐使用goner/zap来打印日志，得益于zap的性能优势，goner/zap的性能也非常出色。

## 安装组件
```bash
gonectl install goner/zap
```
:::tip
gonectl 是Gone框架的脚手架工具，工具的安装请参考：[gonectl 安装](/docs/quickstart/install/gonectl.md)
:::

## 配置组件
| 参数                      | 描述                                                                          | 默认值  | 是否必须 |
| ------------------------- | ----------------------------------------------------------------------------- | ------- | -------- |
| log.level                 | 日志级别，支持级别：debug,info,warn,error                                     | info    | 否       |
| log.disable-stacktrace    | 是否禁用堆栈信息                                                              | false   | 否       |
| log.stacktrace-level      | 堆栈信息级别                                                                  | error   | 否       |
| log.report-caller         | 是否报告调用者                                                                | true    | 否       |
| log.encoder               | 日志编码器，支持console和json                                                 | console | 否       |
| log.outputs               | 日志输出目标，支持stdout和文件路径，多个目标使用逗号分割                      | stdout  | 否       |
| log.error-outputs         | 错误日志输出目标，支持stdout、stderr和文件路径，不设置时使用outputs           | 无      | 否       |
| log.rotation.output       | 日志轮转输出目标，支持设置一个文件路径                                        | 无      | 否       |
| log.rotation.error-output | 日志轮转错误输日志出目标，支持设置一个文件路径                                | 无      | 否       |
| log.rotation.max-size     | 日志轮转最大文件大小，单位为MB                                                | 100     | 否       |
| log.rotation.max-files    | 日志轮转最大文件数                                                            | 10      | 否       |
| log.rotation.max-age      | 日志轮转最大文件保留时间，单位为天                                            | 30      | 否       |
| log.rotation.local-time   | 日志轮转，是否使用本地时间                                                    | false   | 否       |
| log.rotation.compress     | 日志轮转，是否压缩日志文件                                                    | false   | 否       |
| log.otel.enable           | 是否开启otel日志，需要同时安装`goner/otel/log`                                | false   | 否       |
| log.otel.only             | 是否只输出otel日志，设置为true时日志只通过otel exporter导出，将不会有其他输出 | true    | 否       |
| log.otel.log-name         | otel日志名                                                                    | zap     | 否       |

### 配置示例
```yaml
log:
  level: debug
  outputs: stdout
  error-outputs: stderr
  rotation:
    output: ./log/app.rotation.log
    error-output: ./log/app.rotation.err.log
    max-size: 100
    max-files: 10
    max-age: 30
```

## 使用

### 通过gone.Logger接口使用
```go
type Service struct {
    gone.Flag
    logger gone.Logger `gone:"*"` // 注入日志组件
}
func (s *Service) Run(ctx context.Context) error {
    s.logger.Infof("hello world")
    return nil
}
```

### 直接注入*zap.Logger使用
在goner/zap中实现了`gone.Logger`接口，是通过对`zap.SugaredLogger`封装来实现的，在对性能要求特别高的情况，可以直接注入`*zap.Logger`使用：

```go
type Service struct {
    gone.Flag
    logger *zap.Logger `gone:"*"` // 注入日志组件
}
func (s *Service) Run(ctx context.Context) error {
    s.logger.Info("hello world")
    return nil
}
```

### 给zap.Logger设置名字
```go
type Service struct {
    gone.Flag
    logger *zap.Logger `gone:"*,service-log"` // 注入日志组件, 第二参数为日志组件的名字
}
```

### 配合远程配置组件，动态修改日志级别

远程配置组件的使用，请参考：[配置中心/远程配置](/docs/tutorial/config/config-center/config-center.md)

在对应的配置管理界面修改`log.level`的值，即可动态修改日志级别。

### 配合goner/otel 系列组件使用
这里的otel是opentelemetry的缩写。

#### 使用`g.CtxLogger`接口打印日志

```go
type service struct {
    gone.Flag
    logger g.CtxLogger `gone:"*"` // 注入日志组件
}
func (s *service) Run(ctx context.Context) error {
    s.logger.Ctx(ctx).Info("hello world")
    return nil
}
```
使用`g.CtxLogger`的好处是，组件能够自动从上下文中获取相关trace信息，需要配合`goner/otel/tracer`等组件一起使用，如果没有安装对应组件，将不能正常活动到tracer信息并打印。

#### 使用`goner/otel/log`收集日志

1. 安装`goner/otel/log/grpc`或者`goner/otel/log/http`组件

```bash
gonectl install goner/otel/log/grpc
# 或者
# gonectl install goner/otel/log/http
```
2. 配置otel 日志收集服务地址
```yaml
otel:
  service:
    name: "log-collect-example"
  log:
    http:
      endpoint: localhost:4318
      insecure: true
```

3. 配置`log.otel.enable`为true，即可开启otel日志收集。

需要修改配置：
```yaml
logger:
  otel:
    enable: true
    only: false # 是否只输出otel日志，设置为true时日志只通过otel exporter导出，将不会有其他输出
    log-name: "my-log-name"
```

## 日志收集
除了前面通过opentelemetry的exporter收集日志外；在云原生环境下，日志收集的核心方案是通过​​DaemonSet部署采集代理（如Fluentd/Filebeat/Promtail/Loggie）​​，
自动采集节点上容器的标准输出或挂载目录的日志，并注入Kubernetes元数据标签，最终结合流处理层（如Kafka/Flink）和存储系统（如Elasticsearch/Loki）实现高效管理。
网上已经存在大量的技术资料，在此不再赘述。