---
title: CentOS7 安装 Oracle 11g
date: 2023-09-18 09:42:34
tags:
- oracle
categories:
- 数据库
---

#### 1. 关闭防火墙（root）

```bash
systemctl stop firewalld.service

# 关闭开机自启
systemctl disable firewalld.service
```

#### 2. 关闭selinux（root）

将`SELINUX= enforcing` 改为 `SELINUX=disabled`

```PowerShell
vi /etc/selinux/config

# This file controls the state of SELinux on the system.
# SELINUX= can take one of these three values:
#     enforcing - SELinux security policy is enforced.
#     permissive - SELinux prints warnings instead of enforcing.
#     disabled - No SELinux policy is loaded.
SELINUX=disabled
# SELINUXTYPE= can take one of three values:
#     targeted - Targeted processes are protected,
#     minimum - Modification of targeted policy. Only selected processes are protected.
#     mls - Multi Level Security protection.
SELINUXTYPE=targeted
```

#### 3. 安装Oracle11g r2 相关依赖（root）

直接复制执行即可

```PowerShell
yum -y install gcc make binutils gcc-c++ compat-libstdc++-33 elfutils-libelf-devel elfutils-libelf-devel-static elfutils-libelf-devel ksh libaio libaio-devel numactl-devel sysstat unixODBC unixODBC-devel pcre-devel
```

#### 4. 创建用户和组（root）

添加oinstall 、dba 组，新建oracle用户并加入oinstall、dba组中

```PowerShell
groupadd oinstall
groupadd dba
useradd -g oinstall -G dba oracle
passwd oracle
```

**注意：** 后面的-G(大写)，否则后面安装oracle报`[FATAL] [INS-35341] User is not a member of the following chosen OS groups: [oinstall]`

**验证：**

```PowerShell
[root@jfsoft /]# id oracle
uid=1000(oracle) gid=1000(oinstall) 组=1000(oinstall),1001(dba)
```

#### 5. 修改内核参数,优化TCP（root）

```PowerShell
vi /etc/sysctl.conf
```

添加以下设置，注释最好别复制：

```bash
# 同时可以拥有的的异步IO请求数目
fs.aio-max-nr = 1048576
# 文件句柄的最大数量
fs.file-max = 6815744
# 所有内存大小（单位：页，1页 = 4Kb），计算公式16G*1024*1024*1024/4KB(页)
kernel.shmall = 2097152
# 单个共享内存段的大小（单位：字节）限制，计算公式64G*1024*1024*1024(字节)
kernel.shmmax = 1073741824
# 整个系统的内存segment的总个数,设置系统级最大共享内存段数量
kernel.shmmni = 4096
kernel.sem = 250 32000 100 128
# 设置本地端口范围限制
net.ipv4.ip_local_port_range = 9000 65500
# 接收套接字缓冲区大小的缺省值(以字节为单位)
net.core.rmem_default = 262144
# 接收套接字缓冲区大小的最大值(以字节为单位)
net.core.rmem_max = 4194304
# 发送套接字缓冲区大小的缺省值(以字节为单位)
net.core.wmem_default = 262144
# 发送套接字缓冲区大小的最大值(以字节为单位)
net.core.wmem_max = 1048576
```

使参数生效：

```PowerShell
/sbin/sysctl -p
```

#### 6. 修改用户的限制文件（root）

```
vi /etc/security/limits.conf
```

添加以下配置：

```bash
# 进程的最大数目
oracle           soft    nproc           2047
oracle           hard    nproc           16384
# 系统最大打开文件数
oracle           soft    nofile          1024
oracle           hard    nofile          65536
# 最大栈大小
oracle           soft    stack           10240
```

#### 7. 修改`/etc/pam.d/login`文件（root）

```PowerShell
vi /etc/pam.d/login
```

添加以下配置：

```bash
session  required   /lib64/security/pam_limits.so
session  required   pam_limits.so
```

#### 8. 修改`/etc/profile`文件（root）

```PowerShell
vi /etc/profile
```

添加以下配置：

```bash
if [ $USER = "oracle" ]; then
  if [ $SHELL = "/bin/ksh" ]; then
   ulimit -p 16384
   ulimit -n 65536
  else
   ulimit -u 16384 -n 65536
  fi
fi
```

#### 9. 修改`/etc/redhat-release`文件（root）

修改如下：

```bash
redhat-7
```

#### 10. 修改`hostname`（root）

修改`/etc/hosts`如下：

```PowerShell
vi /etc/hosts
```

```bash
127.0.0.1   localhost localhost.localdomain localhost4 localhost4.localdomain4 jfsoft
::1         localhost localhost.localdomain localhost6 localhost6.localdomain6
```

修改`/etc/sysconfig/network`如下：

```PowerShell
vi /etc/sysconfig/network
```

```bash
NETWORKING=yes
HOSTNAME=jfsoft
GATEWAY=10.0.2.1
```

#### 11. 创建oracle安装目录并修改文件权限（root）

```PowerShell
mkdir /home/oracle/app
mkdir /home/oracle/app/oracle
mkdir /home/oracle/app/oradata
mkdir /home/oracle/app/oraInventory
mkdir /home/oracle/app/fast_recovery_area
mkdir /home/oracle/app/oracle/product

chown -R oracle:oinstall /home/oracle
chmod -R 775 /home/oracle
```

#### 12. 上传oracle安装包

这里我们上传到`/usr/local/oracle/`下，没有这个目录的可以自己新建

安装包下载链接：[https://pan.baidu.com/s/1rq9-MOzP9KynKceOK5Yknw](https://pan.baidu.com/s/1rq9-MOzP9KynKceOK5Yknw) 

提取码：knxm

#### 13. 使用xftp上传oracle安装包并解压

```
cd /usr/local/oracle/
unzip linux.x64_11gR2_database_1of2.zip && unzip linux.x64_11gR2_database_2of2.zip
```

如果出现`unzip is not command`，执行下面语句

```PowerShell
yum install -y unzip zip
```

#### 14. 切换到oracle用户，设置oracle用户环境变量（oracle）

```PowerShell
su oracle
```

```bash
export ORACLE_HOSTNAME=jfsoft # 这里填写之前设置的hostname
export ORACLE_BASE=/home/oracle/app
export ORACLE_HOME=$ORACLE_BASE/product/11.2.0/dbhome_1
export ORACLE_SID=orcl
export PATH=.:$ORACLE_HOME/bin:$ORACLE_HOME/OPatch:$ORACLE_HOME/jdk/bin:$PATH
export LC_ALL="en_US"
export LANG="en_US"
export NLS_LANG="AMERICAN_AMERICA.ZHS16GBK"
export NLS_DATE_FORMAT="YYYY-MM-DD HH24:MI:SS"
export DISPLAY=localhost:0.0 # 解决 配置监听时【DISPLAY environment variable not set!】
```

#### 15. 创建/etc/oraInst.loc文件，否则安装时会报错：（root）

```
SEVERE: [FATAL] [INS-32038] The operating system group specified for central inventory (oraInventory) ownership is invalid.
```

```PowerShell
vi /etc/oraInst.loc
inventory_loc=/home/oracle/app/oraInventory
inst_group=oinstall
```

#### 16. 编辑静默安装应答文件（root）

切换到`root`用户进入oracle安装包解压后的目录,备份`db_install.rsp`文件

```
cd /usr/local/oracle/database/response/
cp db_install.rsp db_install.rsp.bak
```

编辑`/usr/local/oracle/database/response/db_install.rsp `文件

```bash
vi /usr/local/oracle/database/response/db_install.rsp
```

修改后的文件如下：

```bash
oracle.install.responseFileVersion=/oracle/install/rspfmt_dbinstall_response_schema_v11_2_0
oracle.install.option=INSTALL_DB_AND_CONFIG
ORACLE_HOSTNAME=jfsoft #前面设置过的hostname
UNIX_GROUP_NAME=oinstall
INVENTORY_LOCATION=/home/oracle/app/oraInventory
SELECTED_LANGUAGES=en,zh_CN
ORACLE_HOME=/home/oracle/app/oracle/product/11.2.0/dbhome_1
ORACLE_BASE=/home/oracle/app
oracle.install.db.InstallEdition=EE
oracle.install.db.isCustomInstall=false
oracle.install.db.customComponents=oracle.server:11.2.0.1.0,oracle.sysman.ccr:10.2.7.0.0,oracle.xdk:11.2.0.1.0,oracle.rdbms.oci:11.2.0.1.0,oracle.network:11.2.0.1.0,oracle.network.listener:11.2.0.1.0,oracle.rdbms:11.2.0.1.0,oracle.options:11.2.0.1.0,oracle.rdbms.partitioning:11.2.0.1.0,oracle.oraolap:11.2.0.1.0,oracle.rdbms.dm:11.2.0.1.0,oracle.rdbms.dv:11.2.0.1.0,orcle.rdbms.lbac:11.2.0.1.0,oracle.rdbms.rat:11.2.0.1.0
oracle.install.db.DBA_GROUP=dba
oracle.install.db.OPER_GROUP=oinstall
oracle.install.db.CLUSTER_NODES=
oracle.install.db.config.starterdb.type=GENERAL_PURPOSE
oracle.install.db.config.starterdb.globalDBName=orcl
oracle.install.db.config.starterdb.SID=orcl
oracle.install.db.config.starterdb.characterSet=AL32UTF8
oracle.install.db.config.starterdb.memoryOption=true
oracle.install.db.config.starterdb.memoryLimit=400
oracle.install.db.config.starterdb.installExampleSchemas=false
oracle.install.db.config.starterdb.enableSecuritySettings=true
oracle.install.db.config.starterdb.password.ALL=1Password
oracle.install.db.config.starterdb.password.SYS=
oracle.install.db.config.starterdb.password.SYSTEM=
oracle.install.db.config.starterdb.password.SYSMAN=
oracle.install.db.config.starterdb.password.DBSNMP=
oracle.install.db.config.starterdb.control=DB_CONTROL
oracle.install.db.config.starterdb.gridcontrol.gridControlServiceURL=
oracle.install.db.config.starterdb.dbcontrol.enableEmailNotification=false
oracle.install.db.config.starterdb.dbcontrol.emailAddress=xxxx@xxxx.com
oracle.install.db.config.starterdb.dbcontrol.SMTPServer=
oracle.install.db.config.starterdb.automatedBackup.enable=false
oracle.install.db.config.starterdb.automatedBackup.osuid=
oracle.install.db.config.starterdb.automatedBackup.ospwd=
oracle.install.db.config.starterdb.storageType=FILE_SYSTEM_STORAGE
oracle.install.db.config.starterdb.fileSystemStorage.dataLocation=/home/oracle/app/oradata
oracle.install.db.config.starterdb.fileSystemStorage.recoveryLocation=/home/oracle/app/fast_recovery_area
oracle.install.db.config.asm.diskGroup=
oracle.install.db.config.asm.ASMSNMPPassword=
MYORACLESUPPORT_USERNAME=
MYORACLESUPPORT_PASSWORD=
SECURITY_UPDATES_VIA_MYORACLESUPPORT=
DECLINE_SECURITY_UPDATES=true
PROXY_HOST=
PROXY_PORT=
PROXY_USER=
PROXY_PWD=
```

#### 17. 改用oracle用户登录，开始静默安装（oracle）

```PowerShell
cd /usr/local/oracle/database/
./runInstaller -silent -ignorePrereq -responseFile /usr/local/oracle/database/response/db_install.rsp 
```

安装成功如下所示：

```bash
[oracle@localhost database]$ You can find the log of this install
session at:
/db/app/oracle/inventory/logs/installActions2018-09-11_09-36-40PM.log
The following configuration scripts need to be executed as the “root”
user. #!/bin/sh #Root scripts to run

/home/oracle/app/oracle/inventory/orainstRoot.sh(有时候不会出来这句，没有这句就不执行)
/home/oracle/app/oracle/product/11.2.0/root.sh To execute the configuration
scripts:
1. Open a terminal window
2. Log in as “root”
3. Run the scripts
4. Return to this window and hit “Enter” key to continue

Successfully Setup Software.
```

切换到root，执行`root.sh`

```bash
su root

sh /home/oracle/app/oracle/inventory/orainstRoot.sh(上面没有这句，这里也不执行)
sh /home/oracle/app/oracle/product/11.2.0/dbhome_1/root.sh
```

#### 18. 配置监听（oracle）

切换到oracle用户，并执行命令：

```bash
/home/oracle/app/oracle/product/11.2.0/dbhome_1/bin/netca -silent -responseFile /usr/local/oracle/database/response/netca.rsp
```

成功运行后，会在`/home/oracle/app/oracle/product/11.2.0/dbhome_1/network/admin/` 中生成`listener.ora`和`sqlnet.ora`两个文件。

查看监听端口：`netstat -tnulp | grep 1521`

#### 19. 建立新库，同时建立对应的实例（root）

切换到`root`用户，编辑`dbca.rsp`

```PowerShell
vi /usr/local/oracle/database/response/dbca.rsp
```

修改以下参数【根据自己需要修改】：

```bash
GDBNAME = "orcl"
SID = "orcl"
#开启并设置内置用户（sys、system、sysman、dbsnmp）的密码
SYSPASSWORD = "oracle"
SYSTEMPASSWORD = "oracle"
SYSMANPASSWORD = "oracle"
DBSNMPPASSWORD = "oracle"
DATAFILEDESTINATION =/home/oracle/app/oradata
RECOVERYAREADESTINATION=/home/oracle/app/fast_recovery_area
CHARACTERSET = "ZHS16GBK"
TOTALMEMORY = "1638"
```

切换到oracle用户，并执行静默安装

```PowerShell
su oracle
/home/oracle/app/oracle/product/11.2.0/dbhome_1/bin/dbca -silent -responseFile /usr/local/oracle/database/response/dbca.rsp
```

安装完成后，重启系统

```PowerShell
reboot
```

#### 20. 启动数据库

```PowerShell
sqlplus / as sysdba
startup
```

**常见错误：**

```
LRM-00109: could not open parameter file '/home/oracle/app/oracle/product/11.2.0/dbhome_1/dbs/initora11g.ora'
```

**解决方案：**

复制 /data/oracle/admin/orcl/pfile/init.ora.017202094913

```PowerShell
cp /data/oracle/admin/orcl/pfile/init.ora.017202094913 /home/oracle/app/oracle/product/11.2.0/dbhome_1/dbs/initORCL.ora
```

**常见错误：**

```PowerShell
bash: sqlplus: 未找到命令
```

**解决方案：**

```PowerShell
source ~/.bash_profile
```

#### 21. 关闭数据库

```PowerShell
shutdown immediate
```

#### 22. 各项检查

实例检查：

```PowerShell
ps -ef | grep ora_ | grep -v grep
```

监听状态：

```PowerShell
lsnrctl status
```

启动监听：

```PowerShell
lsnrctl start
```

停止监听：

```PowerShell
lsnrctl stop
```

#### 添加相关服务到开机启动(root)

```bash
vi /etc/rc.d/rc.local
# 添加如下代码
su oracle -lc "/home/oracle/app/oracle/product/11.2.0/dbhome_1/bin/emctl start dbconsole"

su oracle -lc "/home/oracle/app/oracle/product/11.2.0/dbhome_1/bin/lsnrctl start"

su oracle -lc "/home/oracle/app/oracle/product/11.2.0/dbhome_1/bin/dbstart"
```
