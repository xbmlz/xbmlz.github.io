---
title: Python 离线部署
date: 2024-03-26 23:47:44
tags:
- python
categories:
- python
---

### 环境准备

以下步骤需要在有网络的环境下操作

### 1. 下载Python 3.7.9 压缩文件

下载[Windows x86-64 embeddable zip file](https://www.python.org/ftp/python/3.7.9/python-3.7.9-embed-amd64.zip)并解压到`.runtime`目录下

### 2. 安装PIP

下载安装pip脚本，在浏览器打开下面地址，复制内容到`get-pip.py`

https://bootstrap.pypa.io/get-pip.py

在`.runtime`目录下执行如下命令

```bash
python.exe get-pip.py
```

修改`python37._pth`文件，将`import site`取消注释，完整文件内容如下

```python
python37.zip
.

# Uncomment to run site.main() automatically
import site
```

### 3. 下载项目所需依赖

将`.runtime`文件夹复制到项目根目录

在项目根目录下执行如下命令

```bash
.runtime\Python37\python.exe .runtime\Python37\Scripts\pip3.exe download -d .runtime\Packages\ -r requirements.txt
```

到此，python离线环境已准备完毕

### 离线部署

以下步骤在离线环境下操作

### 1. 安装依赖

```bash
.runtime\Python37\python.exe .runtime\Python37\Scripts\pip3.exe install --no-index --find-links=.runtime\Packages\ -r requirements.txt
```

### 2. 启动项目

```bash
.runtime\Python37\python.exe app.py
```