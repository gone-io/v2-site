---
sidebar_position: 5
hide_title: true
title: 从模板创建项目
keywords: [Gone, QuickStart, Template, Go, Web框架, 项目模板, Gin, XORM, Viper, 后端开发, 快速入门, 依赖注入]
description: 学习如何使用Gone框架的项目模板快速搭建Go Web应用。本教程将引导您通过gonectl工具，基于gin+xorm+viper模板创建、配置和运行一个功能完善的Web项目。
---

# 从模板创建项目

Gone框架为开发者提供了丰富的项目模板，让您能够快速搭建各种类型的应用程序。本教程将手把手教您如何使用`gonectl`工具，从模板创建一个完整的Web项目。

我们将创建一个集成了以下技术栈的项目：
- **Viper**：配置文件管理
- **XORM**：数据库ORM操作
- **Gin**：高性能Web框架

整个过程只需几分钟，让我们开始吧！

![Gone框架快速开始](/img/quickstart-tpl.gif)

## 第一步：安装gonectl工具

`gonectl`是Gone框架的命令行工具，它就像是您的项目管家，负责项目创建、代码生成等核心功能。

### 安装命令
```bash
go install github.com/gone-io/gonectl@latest
```

### 验证安装
安装完成后，在终端输入以下命令验证是否成功：
```bash
gonectl
```
如果看到命令帮助信息，说明安装成功！

> 💡 **提示**：如果遇到安装问题，请参考[gonectl详细安装指南](./安装/gonectl.md)。

## 第二步：探索可用模板

Gone框架内置了多种实用模板，让我们先看看都有哪些选择：

```bash
gonectl create -l
```

您将看到丰富的模板列表，包括：

```text
Available templates:
  - config_center/apollo	Apollo配置中心示例
  - config_center/consul	Consul配置中心示例
  - config_center/etcd  	Etcd配置中心示例
  - config_center/nacos 	Nacos配置中心示例
  - es                  	Elasticsearch示例项目
  - gin+gorm+viper      	使用Gin、GORM、Viper的简单Web演示
  - gin+xorm+viper      	使用Gin、XORM、Viper的Web演示
  - grpc                	Gone gRPC示例项目
  - grpc_use_discovery  	带服务发现的gRPC示例
  - http_use_discovery  	使用Gin的HTTP服务发现示例
  - openai              	OpenAI模型客户端集成
  - simple              	简单示例，使用Viper读取配置
  - urllib              	使用goner/urllib的HTTP客户端示例
  - zap                 	在Gone框架中使用Zap日志
  ... 还有更多模板
```

## 第三步：创建您的第一个项目

我们选择`gin+xorm+viper`模板，它是一个功能完整的Web应用骨架，非常适合学习和实际开发。

### 创建项目
```bash
gonectl create -t gin+xorm+viper my-project
```

命令执行后，`gonectl`会自动：
1. 下载模板文件
2. 创建项目目录结构
3. 初始化必要的配置文件

> 📝 **说明**：您可以将`my-project`替换为任何您喜欢的项目名称。

## 第四步：了解项目结构

项目创建完成后，让我们看看都生成了什么：

```bash
cd my-project
tree
```

项目结构清晰明了，每个目录都有其特定用途：

```text
my-project/
├── cmd/                    # 🚀 程序入口
│   └── server/
│       ├── import.gone.go  # 自动生成的导入文件
│       └── main.go         # 主程序入口
├── config/                 # ⚙️ 配置文件
│   └── default.properties  # 默认配置
├── internal/               # 🏗️ 核心业务代码
│   ├── controller/         # 控制器层 - 处理HTTP请求
│   ├── interface/          # 接口定义层
│   │   ├── entity/         # 数据实体
│   │   └── service/        # 服务接口
│   ├── module/             # 业务模块层
│   │   ├── user/           # 用户相关功能
│   │   └── dependent/      # 依赖管理示例
│   ├── router/             # 路由配置
│   └── pkg/                # 工具包
├── scripts/                # 📜 脚本文件
│   └── mysql/
│       └── initdb.d/
│           └── user.sql    # 数据库初始化脚本
├── tests/                  # 🧪 测试文件
│   └── api/
├── docker-compose.yaml     # Docker编排文件
├── Dockerfile             # Docker镜像构建文件
└── README.md              # 项目说明文档
```

这种结构遵循了Go项目的最佳实践，代码组织清晰，便于维护和扩展。

## 第五步：启动项目

现在让我们把项目跑起来！由于项目使用MySQL数据库，我们需要按顺序执行以下步骤：

### 5.1 启动数据库服务
```bash
# 使用Docker启动MySQL（后台运行）
docker compose up -d mysql
```

### 5.2 安装项目依赖
```bash
# 下载并安装Go模块依赖
go mod tidy
```

### 5.3 启动Web服务
```bash
# 使用gonectl运行项目
gonectl run ./cmd/server
```

如果一切顺利，您将看到类似以下的启动日志：
```text
🎉 服务启动成功！
🌐 服务地址：http://localhost:8080
📊 健康检查：http://localhost:8080/health
```

## 第六步：测试API功能

项目启动后，让我们测试一下提供的API功能。这个模板项目提供了完整的用户管理功能：

### 6.1 用户注册
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' \
  http://localhost:8080/api/users/register
```

### 6.2 用户登录
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' \
  http://localhost:8080/api/users/login
```

### 6.3 获取用户信息
```bash
# 先获取登录Token
token=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' \
  http://localhost:8080/api/users/login | jq -r '.data.token')

# 使用Token获取用户信息
curl -X GET \
  -H "Authorization: Bearer $token" \
  http://localhost:8080/api/users/me
```

> 💡 **小贴士**：您也可以使用项目中的`tests/api/user.http`文件，配合VS Code的REST Client插件来测试API，更加直观方便。

## 第七步：Docker部署（可选）

如果您想要将项目容器化部署，Gone框架已经为您准备好了完整的Docker配置。

### 7.1 配置环境变量
```bash
echo "ENVIRONMENT=dev" > .env
```

### 7.2 构建Docker镜像
```bash
docker compose build
```

### 7.3 启动完整服务栈
```bash
# 启动Web服务和数据库
docker compose up -d
```

## 第八步：停止服务

当您完成开发工作后，可以优雅地停止所有服务：

```bash
# 停止并清理Docker容器
docker compose down
```

## 🎯 总结

通过本教程，您已经成功：

✅ 安装了Gone框架的命令行工具  
✅ 了解了丰富的项目模板选择  
✅ 创建了一个功能完整的Web项目  
✅ 掌握了项目的目录结构和组织方式  
✅ 成功启动并测试了项目功能  
✅ 学会了Docker容器化部署  

import DocCardList from '@theme/DocCardList';

<DocCardList />