---
title: Windows XP SP3 下安装 Golang
date: 2023-09-14 11:24:11
tags:
- golang
categories:
- golang
---


## 1. 安装 golang

目前支持Windows XP的最高版本是 `1.10.7`

下载地址 [https://studygolang.com/dl/golang/go1.10.7.windows-386.msi](https://studygolang.com/dl/golang/go1.10.7.windows-386.msi)

## 2. 安装 git

目前支持Windows XP的最高版本是 `2.10.0`

下载地址 [https://github.com/git-for-windows/git/releases/download/v2.10.0.windows.1/Git-2.10.0-32-bit.exe](https://github.com/git-for-windows/git/releases/download/v2.10.0.windows.1/Git-2.10.0-32-bit.exe)

## 3. 配置环境变量

在系统环境变量中添加如下内容

```
GOPATH=C:\gopath
GOROOT=C:\Go
```

