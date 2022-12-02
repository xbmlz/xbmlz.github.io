---
title: MariaDB 主从同步
date: 2022-12-02 12:16:14
tags:
- mariadb
categories:
- database
---

### 1. 准备两台服务器

- master (主服务器192.168.23.132)
- slave  (从服务器192.168.23.133)

### 2. 安装MariaDB

注意：此步骤在主、从服务器执行同样的操作即可

新建安装脚本：

```bash
vi install-mariadb.sh
```

加入以下内容:

```bash
#!/bin/bash

MARIADB_DIR=/usr/local/mariadb
DATA_DIR=/data/mariadb
MARIADB_VER=10.3.27
ROOT_PASSWORD=123456

yum -y install wget

# 创建数据存放目录
mkdir -p ${DATA_DIR}

# 创建mysql的用户做为mariadb的运行用户
useradd -r mysql -s /sbin/nologin

# 下载
cd /usr/local/src
wget https://mirrors.tuna.tsinghua.edu.cn/mariadb/mariadb-${MARIADB_VER}/bintar-linux-systemd-x86_64/mariadb-${MARIADB_VER}-linux-systemd-x86_64.tar.gz

tar -zxvf mariadb-${MARIADB_VER}-linux-systemd-x86_64.tar.gz 

mv mariadb-${MARIADB_VER}-linux-systemd-x86_64 ${MARIADB_DIR}

ln -s ${MARIADB_DIR} /usr/local/mysql

chown -R mysql.mysql /usr/local/mysql/

# 授权
chown -R mysql.mysql ${DATA_DIR}

# my.conf configuration
cat > /etc/my.cnf <<EOF
[mysqld]
port            = 3306
character-set-server = utf8
collation-server = utf8_general_ci
datadir = ${DATA_DIR}
socket = /tmp/mysql.sock
skip-external-locking
key_buffer_size = 384M
max_allowed_packet = 1M
table_open_cache = 512
sort_buffer_size = 2M
read_buffer_size = 2M
read_rnd_buffer_size = 8M
myisam_sort_buffer_size = 64M
thread_cache_size = 8
query_cache_size = 32M
EOF

cd ${MARIADB_DIR}

./scripts/mysql_install_db --datadir=${DATA_DIR} --user=mysql

# 设置开机自启动
cp ${MARIADB_DIR}/support-files/mysql.server /etc/init.d/mysqld

chkconfig --add mysqld

chkconfig mysqld on

service mysqld start

${MARIADB_DIR}/bin/mysql -e "grant all privileges on *.* to root@'127.0.0.1' identified by \"${ROOT_PASSWORD}\" with grant option;"

${MARIADB_DIR}/bin/mysql -e "grant all privileges on *.* to root@'localhost' identified by \"${ROOT_PASSWORD}\" with grant option;"

${MARIADB_DIR}/bin/mysql -uroot -p${ROOT_PASSWORD} -e "delete from mysql.user where Password='';"

${MARIADB_DIR}/bin/mysql -uroot -p${ROOT_PASSWORD} -e "delete from mysql.db where User='';"

${MARIADB_DIR}/bin/mysql -uroot -p${ROOT_PASSWORD} -e "delete from mysql.proxies_priv where Host!='localhost';"

${MARIADB_DIR}/bin/mysql -uroot -p${ROOT_PASSWORD} -e "drop database test;"

# 添加环境变量
echo 'PATH=/usr/local/mysql/bin:$PATH' >> /etc/profile.d/mysql.sh
# 刷新环境变量
. /etc/profile.d/mysql.sh
```

执行安装：

```bash
bash install-mariadb.sh
```

### 3. 主库配置(在master服务器操作)

修改mariadb配置文件

```
vi /etc/my.cnf
```

在[mysqld]节点下添加如下配置

```bash
#集群配置 - 主服务器
server-id = 1 //配置server-id,不能和从库重复
read_only = 0 //0表示可读可写，1表示只读（也可写成on）
# binlog-do-db = Test //只记录Test库变化,多个库用‘,’分隔
binlog-ignore-db = mysql //忽略mysql库变化，多个库用‘,’分隔
log-bin = /var/lib/mysql/master-bin.log
```

重启mariadb

```
service mysqld restart
```

创建同步数据所需要的用户，并记录文件信息

```bash
# 登录数据库
mysql -u root -p

# 创建 slave 用户
CREATE USER 'slave'@'%' IDENTIFIED BY '123456';

# 分配 REPLICATION SLAVE 权限
GRANT REPLICATION SLAVE ON *.* TO 'slave'@'%';

# 刷新权限表
FLUSH PRIVILEGES;

# 启用读锁
FLUSH TABLES WITH READ LOCK;

# 列出主服务器的状态
SHOW MASTER STATUS;

```

![](https://cdn.jsdelivr.net/gh/xbmlz/static/img/202212021217371.png)

记录文件信息, 从库配会用到

- File: master-bin.000001 
- Position: 329

### 4. 从库配置(在slave服务器操作)

修改mariadb配置文件

```
vi /etc/my.cnf
```

在[mysqld]节点下添加如下配置

```bash
# 集群配置 - 从服务器  
server-id = 2
# binlog-do-db = Test //只记录Test库变化,多个库用‘,’分隔
# binlog-ignore-db = mysql
read_only = 1 //0表示可读可写，1表示只读（也可写成on）
```

重启mariadb

```
service mysqld restart
```

登录从服务器mariadb, 修改 SLAVE 配置

```bash
# 进入数据库
mysql -u root -p

# 配置 SLAVE
CHANGE MASTER TO
MASTER_HOST='192.168.23.132',
MASTER_USER='slave',
MASTER_PASSWORD='123456',
MASTER_PORT=3306,
MASTER_LOG_FILE='master-bin.000001 ', # 主服务器数据库文件名称
MASTER_LOG_POS=329, # 主服务器数据库文件定位                 
MASTER_CONNECT_RETRY=10;

# 启动进程
start slave;
 
# 查看进程状态
SHOW SLAVE STATUS\G;

```

### 5. 解除主服务数据库锁定

```bash
# 登录数据库
mysql -u root -p

# 主服务器解除读锁
UNLOCK TABLES;

# 退出会话
quit
```