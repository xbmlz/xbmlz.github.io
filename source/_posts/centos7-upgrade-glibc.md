---
title: CentOS 7 升级 glibc 到 2.31
date: 2023-03-18 09:33:11
tags:
- centos7
- glibc
- devops
categories:
- devops
---

## 升级目标

libc 2.17 → libc 2.31

## 当前版本

```Bash
[root@localhost gmp-6.1.0]# ldd --version
ldd (GNU libc) 2.17
Copyright (C) 2012 Free Software Foundation, Inc.
This is free software; see the source for copying conditions.  There is NO
warranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
由 Roland McGrath 和 Ulrich Drepper 编写。

[root@localhost gmp-6.1.0]# gcc -v
使用内建 specs。
COLLECT_GCC=gcc
COLLECT_LTO_WRAPPER=/usr/libexec/gcc/x86_64-redhat-linux/4.8.5/lto-wrapper
目标：x86_64-redhat-linux
配置为：../configure --prefix=/usr --mandir=/usr/share/man --infodir=/usr/share/info --with-bugurl=http://bugzilla.redhat.com/bugzilla --enable-bootstrap --enable-shared --enable-threads=posix --enable-checking=release --with-system-zlib --enable-__cxa_atexit --disable-libunwind-exceptions --enable-gnu-unique-object --enable-linker-build-id --with-linker-hash-style=gnu --enable-languages=c,c++,objc,obj-c++,java,fortran,ada,go,lto --enable-plugin --enable-initfini-array --disable-libgcj --with-isl=/builddir/build/BUILD/gcc-4.8.5-20150702/obj-x86_64-redhat-linux/isl-install --with-cloog=/builddir/build/BUILD/gcc-4.8.5-20150702/obj-x86_64-redhat-linux/cloog-install --enable-gnu-indirect-function --with-tune=generic --with-arch_32=x86-64 --build=x86_64-redhat-linux
线程模型：posix
gcc 版本 4.8.5 20150623 (Red Hat 4.8.5-44) (GCC) 

[root@localhost gmp-6.1.0]# make -v
GNU Make 3.82
Built for x86_64-redhat-linux-gnu
Copyright (C) 2010  Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <http://gnu.org/licenses/gpl.html>
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.

```

### 安装依赖

```Bash
yum install -y m4 gmp-devel.x86_64 mpfr-devel.x86_64 zlib-devel.x86_64 gcc-c++ python3 bison
```

## 升级 gcc

```Bash
cd /opt
wget https://mirrors.aliyun.com/gnu/gcc/gcc-9.3.0/gcc-9.3.0.tar.gz
tar -zxf gcc-9.3.0.tar.gz
cd gcc-9.3.0/

./contrib/download_prerequisites # ftp://gcc.gnu.org/pub/gcc/infrastructure/

mkdir build
cd build
../configure --enable-checking=release --enable-language=c,c++ --disable-multilib --prefix=/usr

make -j6
make install

```

验证安装

```Bash
[root@localhost build]# gcc --version
gcc (GCC) 9.3.0
Copyright © 2019 Free Software Foundation, Inc.
本程序是自由软件；请参看源代码的版权声明。本软件没有任何担保；
包括没有适销性和某一专用目的下的适用性担保。
```

## 升级 make

```Bash
cd /opt
wget https://mirrors.aliyun.com/gnu/make/make-4.3.tar.gz
tar -zxf make-4.3.tar.gz
cd make-4.3
mkdir build
cd build
../configure --prefix=/usr
make && make install

```

验证安装

```Bash
[root@localhost build]# make --version
GNU Make 4.3
为 x86_64-pc-linux-gnu 编译
Copyright (C) 1988-2020 Free Software Foundation, Inc.
许可证：GPLv3+：GNU 通用公共许可证第 3 版或更新版本<http://gnu.org/licenses/gpl.html>。
本软件是自由软件：您可以自由修改和重新发布它。
在法律允许的范围内没有其他保证。
```

## 升级glibc

```Bash
cd /opt
wget https://mirrors.aliyun.com/gnu/glibc/glibc-2.31.tar.gz
tar -zxf glibc-2.31.tar.gz
cd glibc-2.31

mkdir build
cd build
../configure  --prefix=/usr --disable-profile --enable-add-ons --with-headers=/usr/include --with-binutils=/usr/bin --disable-sanity-checks --disable-werror

make -j6
make install
make localedata/install-locales
```

如出现如下错误可以忽略

```Bash
LD_SO=ld-linux-x86-64.so.2 CC="gcc -B/usr/bin/" /usr/bin/perl scripts/test-installation.pl /opt/glibc-2.31/build/
/usr/bin/ld: cannot find -lnss_test2
collect2: error: ld returned 1 exit status
Execution of gcc -B/usr/bin/ failed!
The script has found some problems with your installation!
Please read the FAQ and the README file and check the following:
- Did you change the gcc specs file (necessary after upgrading from
  Linux libc5)?
- Are there any symbolic links of the form libXXX.so to old libraries?
  Links like libm.so -> libm.so.5 (where libm.so.5 is an old library) are wrong,
  libm.so should point to the newly installed glibc file - and there should be
  only one such link (check e.g. /lib and /usr/lib)
You should restart this script from your build directory after you've
fixed all problems!
Btw. the script doesn't work if you're installing GNU libc not as your
primary library!
make[1]: *** [Makefile:120: install] Error 1
make[1]: Leaving directory '/opt/glibc-2.31'
make: *** [Makefile:12：install] 错误 2
```

验证libc安装

```Bash
[root@localhost build]# ll /lib64/libc.so*
-rw-r--r--. 1 root root 253 3月  14 19:11 /lib64/libc.so
lrwxrwxrwx. 1 root root  12 3月  14 19:11 /lib64/libc.so.6 -> libc-2.31.so

```