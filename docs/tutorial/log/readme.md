---
sidebar_position: 4
hide_title: true
title: 日志管理
keywords:
- Gone
- Gone框架
description: 配置
---

# 日志管理
在Gone框架中，内核定义了日志接口，并提供了一个简单的日志组件实现，可以在不依赖其他组件的情况下使用`gone.Logger`接口。
在组件中使用日志组件非常简单，只需要在组件中定义一个`gone.Logger`类型的字段，然后使用`gone:"*"`标签注入即可：
```go
type Service struct {
    gone.Flag
    logger gone.Logger `gone:"*"` // 注入日志组件
}
```

## gone.Logger 接口
gone.Logger接口定义如下：
```go
type LoggerLevel int8

const (
	DebugLevel LoggerLevel = -1
	InfoLevel  LoggerLevel = 0
	WarnLevel  LoggerLevel = 1
	ErrorLevel LoggerLevel = 2
)

type Logger interface {
	Infof(msg string, args ...any)
	Errorf(msg string, args ...any)
	Warnf(msg string, args ...any)
	Debugf(msg string, args ...any)

	GetLevel() LoggerLevel
	SetLevel(level LoggerLevel)
}
```
:::tip
gone.Logger接口的实现可以是任何第三方日志组件，只要实现了Logger接口即可,并替换掉默认的Logger组件即可。
```go
func Load(loader gone.Loader) error {
	loader.
		MustLoad(
			&customerLogger{},
            gone.Name(gone.LoggerName),
			gone.IsDefault(new(gone.Logger)),
			gone.ForceReplace(),
		)
	return nil
}
```
:::

## goner/zap 组件
goner/zap 组件是一个日志组件，基于zap实现。


import DocCardList from '@theme/DocCardList';

<DocCardList />