---
sidebar_position: 3
hide_title: true
title: 配置中心
keywords:
- Gone
- Gone框架
description: 配置
---

# 配置中心

## 支持的配置中心
goner组件已经支持多种配置中心的使用，包括：
### goner/apollo 组件
  - Apollo
### goner/nacos 组件
  - Nacos
### goner/viper/remote 组件
  - Etcd/Etcd3
  - Firestore
  - NATS

## 使用
使用也非常简单，使用对应的goner组件替换掉goner/viper组件，增加对应配置中心的链接配置即可。
:::tip
这些配置组件，都组合了goner/viper组件读取本地配置文件的能力，所以你可以使用goner/viper组件的方式读取本地配置文件。
:::

## 组件列表

import DocCardList from '@theme/DocCardList';

<DocCardList />