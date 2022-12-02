---
title: MariaDB Galera Cluster 集群部署
date: 2022-12-02 12:11:35
tags:
- mariadb
categories:
- database
---

### MariaDB Galera Cluster 介绍

Galera Cluster是Codership公司开发的一套免费开源的高可用方案，Galera Cluster即安装了Galera的Mariadb集群。其本身具有multi-master特性，支持多点写入。Galera Cluster的三个（或多个）节点是对等关系，每个节点均支持写入，集群内部会保证写入数据的一致性与完整性。

官网：[http://galeracluster.com](http://galeracluster.com)

文档：[https://galeracluster.com/library/documentation/index.html](https://galeracluster.com/library/documentation/index.html)

优势：

- 真正的多主集群，Active-Active架构，即所有节点可以同时读写数据库
- 同步复制，没有复制延迟
- 多线程复制
- 没有主从切换操作，无需使用虚IP
- 热备份，单个节点故障期间不会影响数据库业务
- 支持节点自动加入，无需手动拷贝数据，自动的节点成员控制,失效节点自动被清除;新节点加入数据自动复制
- 支持InnoDB存储引擎
- 对应用程序透明，原生MySQL接口
- 无需做读写分离
- 部署使用简单

缺点：

- 加入新节点时开销大,需要复制完整数据
- 不能有效地解决写扩展的问题,所有的写操作都发生在所有的节点
- 有多少个节点,就有多少份重复的数据
- 由于事务提交需要跨节点通信,即涉及分布式事务操作,因此写入会比主从复制慢很多,节点越多,写入越慢,死锁和回滚也会更加频繁;
- 对网络要求比较高,如果网络出现波动不稳定,则可能会造成两个节点失联,Galera Cluster集群会发生脑裂,服务将不可用
- 仅支持InnoDB/XtraDB存储引擎,任何写入其他引擎的表,包括mysql.*表都不会被复制,DDL语句可以复制,但是insert into mysql.user(MyISAM存储引擎)之类的插入数据不会被复制
- Delete操作不支持没有主键的表,因为没有主键的表在不同的节点上的顺序不同,如果执行select … limit …将出现不同的结果集
- 整个集群的写入吞吐量取决于最弱的节点限制,集群要使用同一的配置

![](https://cdn.jsdelivr.net/gh/xbmlz/static/img/202212021213506.png)

基于认证的复制原理

[https://galeracluster.com/library/documentation/tech-desc-introduction.html](https://galeracluster.com/library/documentation/tech-desc-introduction.html)

Galera集群的复制功能基于Galeralibrary实现,为了让MySQL与Galera library通讯，特别针对MySQL开发了wsrep API。

Galera插件保证集群同步数据，保持数据的一致性，靠的就是可认证的复制，工作原理如下图：

### 集群部署

![](https://cdn.jsdelivr.net/gh/xbmlz/static/img/202212021214471.png)

#### 准备3台Centos7

|名称|IP地址|
|-|-|
|galera1|10.0.2.191|
|galera2|10.0.2.192|
|galera3|10.0.2.193|


#### 关闭防火墙和selinxu

在`galera1`、`galera2`、`galera3`分别执行如下命令

```bash
systemctl disable --now firewalld
sed -i 's/^SELINUX=enforcing$/SELINUX=disabled/' /etc/selinux/config && setenforce 0
```

#### 配置主机名

在`galera1`、`galera2`、`galera3`分别执行如下命令

```bash
hostnamectl set-hostname <galera1、galera2、galera3>
```

#### 配置主机名解析

在`galera1`、`galera2`、`galera3`分别执行如下命令

```bash
cat > /etc/hosts <<EOF
10.0.2.191 galera1
10.0.2.192 galera2
10.0.2.193 galera3
EOF
```

#### 安装MariaDB

在`galera1`、`galera2`、`galera3`分别执行如下命令

配置yum

```bash
cat > /etc/yum.repos.d/mariadb.repo <<EOF
[mariadb]
name=MariaDB
baseurl=http://mirrors.ustc.edu.cn/mariadb/yum/10.3/centos7-amd64
gpgkey=https://mirrors.ustc.edu.cn/mariadb/yum/RPM-GPG-KEY-MariaDB
gpgcheck=1
EOF
```

安装mariadb、galera和rsync,其中galera作为依赖自动安装

```bash
yum install -y MariaDB-server MariaDB-client rsync
```

#### 配置mariadb-galera-cluste

[https://mariadb.com/kb/en/configuring-mariadb-galera-cluster/](https://mariadb.com/kb/en/configuring-mariadb-galera-cluster/)

[https://galeracluster.com/library/training/tutorials/galera-on-aws.html](https://galeracluster.com/library/training/tutorials/galera-on-aws.html)

在`galera1`节点执行如下命令

```bash
cat > /etc/my.cnf.d/server.cnf <<EOF
[mysqld]
datadir=/var/lib/mysql
socket=/var/lib/mysql/mysql.sock
bind-address=0.0.0.0
user=mysql

default_storage_engine=InnoDB
innodb_autoinc_lock_mode=2
innodb_flush_log_at_trx_commit=0
innodb_buffer_pool_size=128M

binlog_format=ROW
log-error=/var/log/mysqld.log

[galera]
wsrep_on=ON
wsrep_provider=/usr/lib64/galera/libgalera_smm.so

wsrep_node_name='galera1'
wsrep_node_address="10.0.2.191"
wsrep_cluster_name='galera-cluster'
wsrep_cluster_address="gcomm://10.0.2.191,10.0.2.192,10.0.2.193"

wsrep_provider_options="gcache.size=300M; gcache.page_size=300M"
wsrep_slave_threads=4
wsrep_sst_method=rsync
EOF
```

在`galera2`节点执行如下命令

```bash
cat > /etc/my.cnf.d/server.cnf <<EOF
[mysqld]
datadir=/var/lib/mysql
socket=/var/lib/mysql/mysql.sock
bind-address=0.0.0.0
user=mysql

default_storage_engine=InnoDB
innodb_autoinc_lock_mode=2
innodb_flush_log_at_trx_commit=0
innodb_buffer_pool_size=128M

binlog_format=ROW
log-error=/var/log/mysqld.log

[galera]
wsrep_on=ON
wsrep_provider=/usr/lib64/galera/libgalera_smm.so

wsrep_node_name='galera2'
wsrep_node_address="10.0.2.192"
wsrep_cluster_name='galera-cluster'
wsrep_cluster_address="gcomm://10.0.2.191,10.0.2.192,10.0.2.193"

wsrep_provider_options="gcache.size=300M; gcache.page_size=300M"
wsrep_slave_threads=4
wsrep_sst_method=rsync
EOF
```

在`galera3`节点执行如下命令

```bash
cat > /etc/my.cnf.d/server.cnf <<EOF
[mysqld]
datadir=/var/lib/mysql
socket=/var/lib/mysql/mysql.sock
bind-address=0.0.0.0
user=mysql

default_storage_engine=InnoDB
innodb_autoinc_lock_mode=2
innodb_flush_log_at_trx_commit=0
innodb_buffer_pool_size=128M

binlog_format=ROW
log-error=/var/log/mysqld.log

[galera]
wsrep_on=ON
wsrep_provider=/usr/lib64/galera/libgalera_smm.so

wsrep_node_name='galera3'
wsrep_node_address="10.0.2.193"
wsrep_cluster_name='galera-cluster'
wsrep_cluster_address="gcomm://10.0.2.191,10.0.2.192,10.0.2.193"

wsrep_provider_options="gcache.size=300M; gcache.page_size=300M"
wsrep_slave_threads=4
wsrep_sst_method=rsync
EOF
```

#### 启动集群，在集群任意一个节点上执行

在`galera1`执行如下命令

```bash
galera_new_cluster
systemctl enable mariadb
```

在`galera2`和`galera3`执行如下命令

```bash
systemctl enable --now mariadb
```

#### 验证集群部署

在任意节点执行如下命令

```bash
mysql -uroot -p -e "SHOW STATUS LIKE 'wsrep_cluster_size'"
```

显示如下（默认没有密码直接回车）

```bash
[root@localhost ~]# mysql -uroot -p -e "SHOW STATUS LIKE 'wsrep_cluster_size'"
Enter password: 
+--------------------+-------+
| Variable_name      | Value |
+--------------------+-------+
| wsrep_cluster_size | 3     |
+--------------------+-------+
[root@localhost ~]# 
```

#### 验证数据同步

在`galera1`节点新建数据库`galera_test`，然后在`galera2`和`galera3`节点查询，如果可以查询到`galera_test`库，说明数据同步成功，集群运行正常

```
mysql -e "create database galera_test character set utf8 collate utf8_general_ci;"
```

在`galera2`和`galera3`分别执行

```bash
mysql -e "show databases;"
```

#### 配置代理

[https://galeracluster.com/library/documentation/ha-proxy.html](https://galeracluster.com/library/documentation/ha-proxy.html)

在`galera1`、`galera2`、`galera3`节点分别执行如下命令

```bash
yum install -y haproxy keepalived
```

修改`keepalived`配置文件，使用非抢占模式

`galera1`配置

```bash
cat > /etc/keepalived/keepalived.conf <<EOF
! Configuration File for keepalived

global_defs {
   router_id galera
}

vrrp_script check_haproxy {
    script "pidof haproxy"
    interval 2
    fall 2
    rise 2
}

vrrp_instance VI_1 {
    state BACKUP
    interface ens33
    virtual_router_id 51
    priority 100
    advert_int 1
    nopreempt
    authentication {
        auth_type PASS
        auth_pass 1111
    }
    virtual_ipaddress {
        10.0.2.191
    }
    track_script {
        check_haproxy
    }
}
EOF
```

`galera2`配置

```bash
cat > /etc/keepalived/keepalived.conf <<EOF
! Configuration File for keepalived

global_defs {
   router_id galera
}

vrrp_script check_haproxy {
    script "pidof haproxy"
    interval 2
    fall 2
    rise 2
}

vrrp_instance VI_1 {
    state BACKUP
    interface ens33
    virtual_router_id 51
    priority 100
    advert_int 1
    nopreempt
    authentication {
        auth_type PASS
        auth_pass 1111
    }
    virtual_ipaddress {
        10.0.2.192
    }
    track_script {
        check_haproxy
    }
}
EOF
```

`galera3`配置

```bash
cat > /etc/keepalived/keepalived.conf <<EOF
! Configuration File for keepalived

global_defs {
   router_id galera
}

vrrp_script check_haproxy {
    script "pidof haproxy"
    interval 2
    fall 2
    rise 2
}

vrrp_instance VI_1 {
    state BACKUP
    interface ens33
    virtual_router_id 51
    priority 100
    advert_int 1
    nopreempt
    authentication {
        auth_type PASS
        auth_pass 1111
    }
    virtual_ipaddress {
        10.0.2.193
    }
    track_script {
        check_haproxy
    }
}
EOF
```

修改haproxy配置文件，每个节点配置相同

```bash
cat > /etc/haproxy/haproxy.cfg <<EOF
global
    log         127.0.0.1 local2

    chroot      /var/lib/haproxy
    pidfile     /var/run/haproxy.pid
    maxconn     4000
    user        haproxy
    group       haproxy
    daemon

    stats socket /var/lib/haproxy/stats

defaults
    mode                    http
    log                     global
    option                  httplog
    option                  dontlognull
    option http-server-close
    option forwardfor       except 127.0.0.0/8
    option                  redispatch
    retries                 3
    timeout http-request    10s
    timeout queue           1m
    timeout connect         10s
    timeout client          1m
    timeout server          1m
    timeout http-keep-alive 10s
    timeout check           10s
    maxconn                 3000

listen haproxy_stats
    bind *:1080
    mode http
    balance roundrobin
    stats uri /haproxy-stats
    stats auth admin:admin

listen galera 
     bind *:3307
     balance roundrobin
     mode tcp
     option tcpka
     option mysql-check user haproxy
     server galera1 10.0.2.191:3306 check weight 1
     server galera2 10.0.2.192:3306 check weight 1
     server galera3 10.0.2.193:3306 check weight 1
EOF
```

任意节点创建haproxy针对数据库检查用户haproxy

```
mysql -e "CREATE USER 'haproxy'@'%'"
```

3个节点启动启动haproxy和keepalived服务

```bash
systemctl enable --now haproxy keepalived
```

查看vip在哪个节点，可以停止某个节点或vip所在节点haproxy服务，验证vip会发生漂移：

```bash
[root@localhost ~]# ip a | grep 93
.    inet 10.0.2.193/24 brd 10.0.2.255 scope global noprefixroute ens33
    inet 10.0.2.193/32 scope global ens33
[root@localhost ~]# 
```

~~查看haproxy状态：~~[~~http://192.168.93.20:8084/haproxy-stats~~](http://192.168.93.20:8084/haproxy/stats)~~，用户名密码admin/admin。~~

配置maraidb root用户允许远程连接，任意节点执行即可

```bash
mysql -uroot -p
set password for root@localhost = password('123456');
mysql -e "GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' IDENTIFIED BY '123456' WITH GRANT OPTION;"
```

客户端通过vip的3307端口可以成功访问galera集群

```bash
mysql -uroot -p123456 -h10.0.2.193 -P 3307
```




