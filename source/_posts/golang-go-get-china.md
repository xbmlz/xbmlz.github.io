---
title: Golang go get 国内镜像
date: 2023-09-14 11:26:31
tags:
---

## 解决办法

使用国内七牛云的 go module 镜像。

参考 [https://github.com/goproxy/goproxy.cn。](https://github.com/goproxy/goproxy.cn。)

golang 1.13 可以直接执行：

```bash
go env -w GO111MODULE=auto
go env -w GOPROXY=https://goproxy.cn,direct
```

## 阿里云 Go Module 国内镜像仓库服务

除了七牛云，还可以使用阿里云的 golang 国内镜像。

[https://mirrors.aliyun.com/goproxy/](https://mirrors.aliyun.com/goproxy/)

设置方法

```bash
go env -w GO111MODULE=auto
go env -w GOPROXY=https://mirrors.aliyun.com/goproxy/,direct
```


