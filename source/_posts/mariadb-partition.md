---
title: MariaDB 表分区
date: 2022-12-02 11:39:20
tags:
- mariadb
- partition
categories:
- database
---

## InnoDB逻辑存储结构

首先要先介绍一下InnoDB逻辑存储结构和区的概念，它的所有数据都被逻辑地存放在表空间，表空间又由段，区，页组成。

![](https://cdn.jsdelivr.net/gh/xbmlz/static/img/202212021202813.png)

### segment（段）

常见的段有数据段、索引段、回滚段等，在`InnoDB`存储引擎中，对段的管理都是由引擎自身所完成的

#### extent（区）

  区是由连续的页组成的空间，无论页的大小怎么变，区的大小默认总是为1MB。为了保证区中的页的连续性，`InnoDB`存储引擎一次从磁盘申请4-5个区，`InnoDB`页的大小默认为16kb，即一个区一共有64（1MB/16kb=16）个连续的页。每个段开始，先用32页（page）大小的碎片页来存放数据，在使用完这些页之后才是64个连续页的申请。这样做的目的是，对于一些小表或者是undo类的段，可以开始申请较小的空间，节约磁盘开销。

### page（页）

  上图的page区域，也可以叫块。页是`InnoDB`磁盘管理的最小单位。默认大小为16KB，可以通过参数`innodb_page_size`来设置。常见的页类型有：数据页，undo页，系统页，事务数据页，插入缓冲位图页，插入缓冲空闲列表页，未压缩的二进制大对象页，压缩的二进制大对象页等。

## 分区概述

  这里讲的分区，此“区”非彼“区”，这里讲的分区的意思是指将同一表中不同行的记录分配到不同的物理文件中，几个分区就有几个.idb文件，不是我们刚刚说的区。MySQL在5.1时添加了对水平分区的支持。分区是将一个表或索引分解成多个更小，更可管理的部分。每个区都是独立的，可以独立处理，也可以作为一个更大对象的一部分进行处理。这个是MySQL支持的功能，业务代码无需改动。要知道MySQL是面向OLTP的数据，它不像TIDB等其他DB。那么对于分区的使用应该非常小心，如果不清楚如何使用分区可能会对性能产生负面的影响。

  MySQL数据库的分区是局部分区索引，一个分区中既存了数据，又放了索引。也就是说，每个区的聚集索引和非聚集索引都放在各自区的（不同的物理文件）。目前MySQL数据库还不支持全局分区。

无论哪种类型的分区，如果表中存在主键或唯一索引时，分区列必须是唯一索引的一个组成部分。

## 分区类型

![](https://cdn.jsdelivr.net/gh/xbmlz/static/img/202212021206548.png)

[Partitioning Types Overview - MariaDB Knowledge Base](https://mariadb.com/kb/en/partitioning-types-overview/)

#### RANGE分区

`RANGE`分区类型用于为每个分区分配一个由分区表达式生成的值范围。范围必须有序、连续且不重叠。最小值总是包含在第一个范围内。最高值可能包含在最后一个范围内，也可能不包含在最后一个范围内。

这种分区方法的变体RANGE COLUMNS允许我们使用多个列和更多的数据类型。

[RANGE Partitioning Type - MariaDB Knowledge Base](https://mariadb.com/kb/en/range-partitioning-type/)

创建分区

```sql
CREATE TABLE `partition_test`.`range_partition` ( 
    `id` INT NOT NULL AUTO_INCREMENT,
    `create_time` INT NOT NULL, 
    `num` BIGINT NULL,
    PRIMARY KEY (`id`, `create_time`)
) 
PARTITION BY RANGE (create_time) PARTITIONS 3 
(
    PARTITION part0 VALUES LESS THAN (202101),
    PARTITION part1 VALUES LESS THAN (202102),
    PARTITION part2 VALUES LESS THAN (202103)
);
```

插入测试数据

```sql
INSERT INTO `partition_test`.`range_partition` (`id`, `create_time`, `num`) VALUES ('1', 202101, 500);
INSERT INTO `partition_test`.`range_partition` (`id`, `create_time`, `num`) VALUES ('2', 202102, 800);
INSERT INTO `partition_test`.`range_partition` (`id`, `create_time`, `num`) VALUES ('3', 202103, 1000);
```

通过`EXPLAIN PARTITION`命令发现SQL优化器只需搜对应的区，不会搜索所有分区

```sql
EXPLAIN PARTITIONS SELECT * FROM `partition_test`.`range_partition` WHERE create_time = 202101

```

![](https://cdn.jsdelivr.net/gh/xbmlz/static/img/202212021208190.png)

如果sql语句有问题，那么会走所有区。会很危险。所以分区表后，select语句必须走分区键

```sql
EXPLAIN PARTITIONS SELECT * FROM `partition_test`.`range_partition` WHERE num > 500

```

![](https://cdn.jsdelivr.net/gh/xbmlz/static/img/202212021208456.png)

增加分区

```sql
alter table range_partition add partition (partition part3 values LESS THAN (202104));
```

删除分区

```sql
alter table range_partition drop partition part3;
```

#### List分区

类似于按RANGE分区，区别在于LIST分区是基于列值匹配一个离散值集合中的某个值来进行选择

[LIST Partitioning Type - MariaDB Knowledge Base](https://mariadb.com/kb/en/list-partitioning-type/)

创建分区

```sql
CREATE TABLE `partition_test`.`list_partition`
( 
  `id` INT NOT NULL AUTO_INCREMENT, 
  `hos_code` BIGINT NOT NULL, 
  `name` VARCHAR (32) NULL, 
  PRIMARY KEY (`id`, `hos_code`) 
) 
PARTITION BY LIST (hos_code) 
(
  PARTITION part100 VALUES IN (100),
    PARTITION part200 VALUES IN (200),
    PARTITION part300 VALUES IN (300)
);
```

插入测试数据

```SQL
INSERT INTO `partition_test`.`list_partition` (`hos_code`, `name`) VALUES (100, "张三");
INSERT INTO `partition_test`.`list_partition` (`hos_code`, `name`) VALUES (200, "李四");
INSERT INTO `partition_test`.`list_partition` (`hos_code`, `name`) VALUES (300, "李四");
```

通过`EXPLAIN PARTITION`命令发现SQL优化器只需搜对应的区，不会搜索所有分区

```SQL
EXPLAIN PARTITIONS SELECT * FROM `partition_test`.`list_partition` WHERE hos_code = 100

```

![](https://cdn.jsdelivr.net/gh/xbmlz/static/img/202212021209483.png)

增加分区

```sql
alter table list_partition add partition (partition part400 values in (400));
```

删除分区

```sql
alter table list_partition drop partition part400;
```

#### HASH分区

`HASH`分区是一种分区形式，其中服务器负责放置数据的分区，以确保分区之间的均匀分布。

它需要一个列值，或者一个基于列值的表达式，该列值是散列的，还需要将表划分到的分区数。

`number_of_partitions `表达式需要返回一个非常量的确定整数。每次插入和更新都会对其求值，因此过于复杂的表达式可能会导致性能问题

是一个正整数，指定要将表划分到的分区数。如果省略PARTITIONS子句，则默认分区数为1。

创建分区

```sql
CREATE TABLE `partition_test`.`hash_partition`
( 
    `name` VARCHAR (32) NULL, 
  `birthdate` date NOT NULL
) 
PARTITION BY HASH (YEAR(birthdate)) 
PARTITIONS 4;
```

插入测试数据

```sql
INSERT INTO `partition_test`.`hash_partition` (`name`, `birthdate`) VALUES ("张三", '2001-01-01');
INSERT INTO `partition_test`.`hash_partition` (`name`, `birthdate`) VALUES ("李四", '2002-02-02');
INSERT INTO `partition_test`.`hash_partition` (`name`, `birthdate`) VALUES ("王五", '2003-03-03');
INSERT INTO `partition_test`.`hash_partition` (`name`, `birthdate`) VALUES ("赵六", '2004-04-04');
```

通过`EXPLAIN PARTITION`命令发现SQL优化器只需搜对应的区，不会搜索所有分区

```sql
EXPLAIN PARTITIONS SELECT * FROM `partition_test`.`hash_partition` WHERE birthdate = '2001-01-01'

```

![](https://cdn.jsdelivr.net/gh/xbmlz/static/img/202212021209124.png)

增加分区

```sql
alter table hash_partition add partition (partition p4);
```

删除分区(只能在RANGE或者LIST分区时被删除)

```sql
DROP PARTITION can only be used on RANGE/LIST partitions
```




