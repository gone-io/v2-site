---
sidebar_position: 3
hide_title: true
title: 其他
keywords:
- Gone
- Gone框架
- 配置中心
- etcd
- etcd3
- consul
- nats
- firestore
description: 如何使用goner/viper/remote组件对接etcd、consul、nats、firestore等配置中心。
---

# 其他注册中心


goner/viper/remote组件 通过集成`github.com/spf13/viper/remote`，可以支持多种配置中心的使用，包括：
- Etcd/Etcd3
- Consul
- NATS

## 组件安装
```bash
gonectl install goner/viper/remote
```

## 配置
```yaml
viper.remote:
  providers:
    - provider: consul
      endpoint:  http://127.0.0.1:8848
      path: /config.yaml
      configType: yaml
      keyring:
  watch: true
  watchDuration: 5s
  useLocalConfIfKeyNotExist: true
```

**配置说明**
| 配置项                                 | 说明                                                     | 默认值 | 是否必选 |
| -------------------------------------- | -------------------------------------------------------- | ------ | -------- |
| viper.remote.providers                 | 配置中心地址，数组，支持多个配置中心                     | 无     | 是       |
| viper.remote.providers.provider        | 配置中心类型，取值：consul、etcd、etcd3、nats、firestore | 无     | 是       |
| viper.remote.providers.endpoint        | 配置中心地址                                             | 无     | 是       |
| viper.remote.providers.path            | 配置中心路径                                             | 无     | 是       |
| viper.remote.providers.configType      | 配置中心格式                                             | 无     | 是       |
| viper.remote.providers.keyring         | 配置中心密钥，用于加密存储的gpg密钥                      | 无     | 否       |
| viper.remote.watch                     | 是否监听配置变化                                         | false  | 否       |
| viper.remote.watchDuration             | 监听配置变化的时间周期                                   | 5s     | 否       |
| viper.remote.useLocalConfIfKeyNotExist | 如果 key 不存在，是否使用本地配置                        | true   | 否       |

## 示例

### consul
执行下面命令，从模块创建项目：
```bash
gonectl create -t config/center/consul consul-demo
```

### etcd
执行下面命令，从模块创建项目：
```bash
gonectl create -t config/center/etcd etcd-demo
```

## 注意事项
goner/viper/remote 组件实现动态配置，是通过周期性的拉取配置中心的配置，然后更新本地配置，不能做到实时推送配置，所以不能保证配置的实时性。
