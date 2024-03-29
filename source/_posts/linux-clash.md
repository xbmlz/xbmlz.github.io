---
title: linux 下使用 Clash
date: 2023-01-18 11:08:55
tags:
- linux
- clash
categories:
- devops
---


### 下载 Clash

[Clash Download)](https://www.clash.la/releases/)

新建安装目录

```bash
mkdir -p /opt/clash
```

下载clash

> 无法直接用命令下载，需要先下载到本地，再上传到服务器 `/opt/clash/` 目录下

```bash
curl -o /opt/clash/clash-linux-amd64-v1.18.0.gz https://down.clash.la/Clash/Core/Releases/clash-linux-amd64-v1.18.0.gz
```

解压

```bash
gunzip /opt/clash/clash-linux-amd64-v1.18.0.gz

```

重命名

```bash
mv /opt/clash/clash-linux-amd64-v1.18.0 /opt/clash/clash
```

### 配置并运行Clash

下载配置文件

```bash
wget -O /opt/clash/config.yaml [订阅链接]
```

授权clash

```Bash
chmod +x clash
```

启动clash

```bash
sudo ./clash -d .
```

### 启动系统代理

> 以下命令适用于Gnome桌面环境

```bash
gsettings set org.gnome.system.proxy mode 'manual'
gsettings set org.gnome.system.proxy.http port 7890
gsettings set org.gnome.system.proxy.http host '127.0.0.1'
gsettings set org.gnome.system.proxy.socks port 7891
gsettings set org.gnome.system.proxy.socks host '127.0.0.1'
gsettings set org.gnome.system.proxy ignore-hosts "['localhost', '127.0.0.0/8', '::1']"

```

### 配置开机启动

新建系统服务文件

```bash
cat > /etc/systemd/system/clash.service <<EOF
[Unit]
Description=clash daemon

[Service]
Type=simple
User=root
ExecStart=/opt/clash/clash -d /opt/clash/
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF
```

重载配置

```bash
systemctl daemon-reload
```

启动Clash

```bash
systemctl start clash.service
```

配置开机启动

```bash
systemctl enable clash.service
```

### 配置订阅定时更新

```bash
crontab -e
```

填入以下内容

```bash
29 6    * * *   root    pgrep clash | xargs kill -s 9 
30 6    * * *   root    mv /opt/clash/config.yaml /opt/clash/configbackup.yaml 
31 6    * * *   root    wget -P /opt/clash/ -O config.yaml https://mojie.best/api/v1/client/subscribe?token=e4510668985ed132db4668feda6ba318&flag=clash
32 6    * * *   root    nohup /opt/clash/clash -d /opt/clash/
```

重启定时任务使之生效

```bash
systemctl restart crond.service
```

```Bash
https://sub.back2me.cn/sub?target=clash&url=https%3A%2F%2Fmojie.best%2Fapi%2Fv1%2Fclient%2Fsubscribe%3Ftoken%3De4510668985ed132db4668feda6ba318&insert=false
```

### 检查环境变量

```Bash
env | grep -E 'http_proxy|https_proxy'
```

### 使用代理

```Bash
export https_proxy=http://127.0.0.1:7890;export http_proxy=http://127.0.0.1:7890;export all_proxy=socks5://127.0.0.1:7890
```