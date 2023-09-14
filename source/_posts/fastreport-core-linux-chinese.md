---
title: FastReport Core Linux 中文支持
date: 2023-09-14 11:30:12
tags:
- fastreport
- C#
categories:
- C#
---

#### 1. 安装中文字体

在Linux下创建中文字体目录

```bash
mkdir -p /usr/share/fonts/chinese
```

将Windows下`C:\Windows\Fonts\`中需要的字体拷贝到Linux中的`/usr/share/fonts/chinese/`下面

安装字体索引命令

```bash
yum install mkfontscale
```

进入中文字体目录生成字体索引

```bash
cd  /usr/share/fonts/chinese
mkfontscale
```

验证安装

```bash
fc-list :lang=zh
```

如显示`/usr/share/fonts/chinese/`相关信息则表示中文字体安装成功

#### 2. 启动FastReport服务

设置中文字体目录的环境变量（解决问题的关键！！！）

```bash
export FONTDIR=/usr/share/fonts/
```

启动服务即可...
