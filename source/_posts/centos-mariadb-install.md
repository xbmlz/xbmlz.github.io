---
title: CentOS MariaDB 一键安装脚本
date: 2022-11-27 00:25:53
tags: 
- 开发
- 数据库
categories:
- 开发
---

```bash
#!/bin/bash

MARIADB_DIR=/usr/local/mariadb
DATA_DIR=/data/mariadb
MARIADB_VER=10.3.37
ROOT_PASSWORD=123456

# 安装依赖
yum install -y wget

# 创建目录
mkdir -p ${MARIADB_DIR}

# 创建mysql的用户做为mariadb的运行用户
useradd -r mysql -s /sbin/nologin

# 下载mariadb
cd /usr/local/src
wget https://mirrors.tuna.tsinghua.edu.cn/mariadb/mariadb-${MARIADB_VER}/bintar-linux-systemd-x86_64/mariadb-${MARIADB_VER}-linux-systemd-x86_64.tar.gz

# 解压
tar -zxvf mariadb-${MARIADB_VER}-linux-systemd-x86_64.tar.gz

# 移动到指定目录
mv mariadb-${MARIADB_VER}-linux-systemd-x86_64 ${MARIADB_DIR}

# 创建软连接
ln -s ${MARIADB_DIR} /usr/local/mysql

# 授权目录
chown -R mysql.mysql /usr/local/mysql/
chown -R mysql.mysql ${DATA_DIR}

# 创建配置文件
cat > /etc/my.cnf << EOF
[client]
port = 3306
socket = /tmp/mysql.sock

[mysqld]
port = 3306
socket = /tmp/mysql.sock
datadir = ${DATA_DIR}
binlog_cache_size = 256K
thread_stack = 512K
join_buffer_size = 8192K
query_cache_type = 1
max_heap_table_size = 2048M
default_storage_engine = InnoDB
performance_schema_max_table_instances = 400
table_definition_cache = 400
skip-external-locking
key_buffer_size = 1024M
max_allowed_packet = 100G
table_open_cache = 2048
sort_buffer_size = 4096K
net_buffer_length = 4K
read_buffer_size = 4096K
read_rnd_buffer_size = 2048K
myisam_sort_buffer_size = 16M
thread_cache_size = 256
query_cache_size = 384M
tmp_table_size = 2048M
sql-mode=NO_ENGINE_SUBSTITUTION,STRICT_TRANS_TABLES

explicit_defaults_for_timestamp = true
#skip-name-resolve
max_connections = 500
max_connect_errors = 100
open_files_limit = 65535

log-bin=mysql-bin
binlog_format=mixed
server-id = 1
expire_logs_days = 10
slow_query_log=1
slow-query-log-file=${DATA_DIR}/mysql-slow.log
long_query_time=3
log_bin_trust_function_creators = 1


innodb_data_home_dir = ${DATA_DIR}
innodb_data_file_path = ibdata1:10M:autoextend
innodb_log_group_home_dir = ${DATA_DIR}
innodb_buffer_pool_size = 4096M
innodb_log_file_size = 128M
innodb_log_buffer_size = 32M
innodb_flush_log_at_trx_commit = 1
innodb_lock_wait_timeout = 50
innodb_max_dirty_pages_pct = 90
innodb_read_io_threads = 2
innodb_write_io_threads = 2

[mysqldump]
quick
max_allowed_packet = 500M

[mysql]
no-auto-rehash

[myisamchk]
key_buffer_size = 64M
sort_buffer_size = 1M
read_buffer = 2M
write_buffer = 2M

[mysqlhotcopy]
interactive-timeout

EOF

# 初始化数据库
cd ${MARIADB_DIR}
./scripts/mysql_install_db --user=mysql --datadir=${DATA_DIR}

# 设置开机启动
cp support-files/mysql.server /etc/init.d/mysqld
chmod +x /etc/init.d/mysqld
chkconfig --add mysqld
chkconfig mysqld on

# 启动服务
service mysqld start

# 设置密码
${MARIADB_DIR}/bin/mysqladmin -u root password ${ROOT_PASSWORD}

# 设置环境变量
cat >> /etc/profile << EOF
export PATH=\$PATH:/usr/local/mysql/bin
EOF

# 使环境变量生效
source /etc/profile

```