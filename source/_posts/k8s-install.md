---
title: k8s集群安装
date: 2023-04-18 13:32:56
tags: devOps
---

## 环境准备

> 需要准备3（2cpu2G）台虚拟机，192.168.1.10,192.168.1.11,192.168.1.12

### 主节点

- docker
- kubectl集群命令行交互工具
- kubeadm集群初始化工具

### 工作节点

- docker
- kubelet管理Pod和容器，确保他们稳定运行
- kube-proxy网络代理，负责网络相关的工作

## 开始安装

### 环境设置

每个节点分别修改对应的主机名

```Bash
hostnamectl set-hostname master
hostnamectl set-hostname node1
hostnamectl set-hostname node2
```

所有节点修改hosts, 添加如下内容

```Bash
vi /etc/hosts
```

```Bash
192.168.1.10 master
192.168.1.11 node1
192.168.1.12 node2

```

所有节点关闭 SELinux

```Bash
setenforce 0
sed -i --follow-symlinks 's/SELINUX=enforcing/SELINUX=disabled/g' /etc/sysconfig/selinux

```

所有节点关闭swap

```Bash
sed -ri 's/.*swap.*/#&/' /etc/fstab
swapoff  -a

```

所有节点关闭防火墙

```Bash
systemctl disable --now firewalld
```

所有节点修改阿里镜像

```Bash
# 备份
mkdir -p /etc/yum.repos.d/bak
cd /etc/yum.repos.d
mv * /etc/yum.repos.d/bak
# 添加阿里源
curl -o /etc/yum.repos.d/CentOS-Base.repo http://mirrors.aliyun.com/repo/Centos-7.repo
# 清空并重建缓存
yum clean all
yum makecache

```

所有节点添加k8s源

```Bash
cat <<EOF > /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64
enabled=1
gpgcheck=0
repo_gpgcheck=0
gpgkey=https://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg https://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg
EOF
```

所有节点添加docker源

```Bash
yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
```

### 安装k8s组件

所有节点安装所需组件

> 必须安装1.24.x以下的版本，k8s在1.24.x及以上版本已放弃使用docker作为容器

```Bash
yum install -y kubelet-1.23.17 kubectl-1.23.17 kubeadm-1.23.17 docker-ce
```

修改docker配置

```JSON
cat <<EOF > /etc/docker/daemon.json
{
    "data-root": "/home/docker", 
    "exec-opts": ["native.cgroupdriver=systemd"],
    "registry-mirrors": [
        "https://registry.docker-cn.com", 
        "http://hub-mirror.c.163.com", 
        "https://docker.mirrors.ustc.edu.cn"
    ]
}
EOF
```

```Bash
systemctl daemon-reload
```

所有节点加载所需容器模块

```Bash
cat <<EOF > /etc/modules-load.d/containerd.conf
overlay
br_netfilter
EOF
```

```Bash
modprobe overlay
modprobe br_netfilter

```

所有节点配置网络

```Bash
cat <<EOF > /etc/sysctl.d/kubernetes.conf
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
net.ipv4.ip_forward = 1
EOF
```

```Bash
sysctl --system
```

所有节点启动kubelet、docker，并设置开机自启

```Bash
systemctl start kubelet
systemctl start docker
systemctl enable kubelet
systemctl enable docker

```

在主节点编辑kubelet配置

```Bash
cat <<EOF > /etc/default/kubelet
KUBELET_EXTRA_ARGS="--cgroup-driver=systemd"
EOF
```

```Bash
systemctl daemon-reload
systemctl restart kubelet
```

在主节点编辑kubeadm 配置文件

```Bash
vi /etc/systemd/system/kubelet.service.d/10-kubeadm.conf
```

添加如下内容

```Bash
Environment="KUBELET_EXTRA_ARGS=--fail-swap-on=false"
```

### 初始化k8s

在主节点初始化集群

>  kubelet 只能使用 Docker CRI v1 runtime，而 containerd 默认使用了 CRI v2 runtime

```Bash
# 初始化集群控制台 Control plane
# 失败了可以用 kubeadm reset 重置
kubeadm init --apiserver-advertise-address=$(hostname -i) \
--apiserver-cert-extra-sans=127.0.0.1 \
--pod-network-cidr=10.244.0.0/16 \
--image-repository=registry.aliyuncs.com/google_containers

# 记得把 kubeadm join xxx 保存起来
# 忘记了重新获取：kubeadm token create --print-join-command

# 复制授权文件，以便 kubectl 可以有权限访问集群
# 如果你其他节点需要访问集群，需要从主节点复制这个文件过去其他节点


# 在其他机器上创建 ~/.kube/config 文件也能通过 kubectl 访问到集群

```

输入以下内容创建k8s集群目录

```Bash
mkdir -p $HOME/.kube
cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
chown $(id -u):$(id -g) $HOME/.kube/config
```

### 添加工作节点

在主节点复制配置到子节点

```Bash
scp -r /etc/kubernetes/admin.conf node1:/etc/kubernetes/admin.conf
```

```Bash
scp -r /etc/kubernetes/admin.conf node2:/etc/kubernetes/admin.conf
```

在子节点配置环境变量

```Bash
echo "export KUBECONFIG=/etc/kubernetes/admin.conf" >> ~/.bash_profile
source ~/.bash_profile

```

将子节点加入到集群

```Bash
kubeadm join 192.168.1.10:6443 --token lptfl6.oy8gag26iz0vu37f \
  --discovery-token-ca-cert-hash sha256:cdfbf4490f212f38ff82f73d5d91340e44e273cf5c16f1729110af0d4c932c4b
```

在主节点输入如下命令

```Bash
kubectl get nodes
```

```Bash
[root@master /]# kubectl get nodes
NAME     STATUS     ROLES                  AGE     VERSION
master   NotReady   control-plane,master   8m37s   v1.23.17
node1    NotReady   <none>                 62s     v1.23.17
node2    NotReady   <none>                 48s     v1.23.17
```

### 安装网络插件

```Bash
kubectl apply -f https://ghproxy.com/https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml

```

### 配置Dashboard

[https://github.com/kubernetes/dashboard](https://github.com/kubernetes/dashboard)

下载安装文件

```Bash
cd /opt
curl -O https://ghproxy.com/https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml

```

修改kind.spec.type为NodePort

```YAML
---

kind: Service
apiVersion: v1
metadata:
  labels:
    k8s-app: kubernetes-dashboard
  name: kubernetes-dashboard
  namespace: kubernetes-dashboard
spec:
  type: NodePort
  ports:
    - port: 443
      targetPort: 8443
      nodePort: 31443
  selector:
    k8s-app: kubernetes-dashboard

---
```

安装dashboard

```Bash
kubectl apply -f recommended.yaml
```

```Bash
[root@master opt]# kubectl apply -f recommended.yaml
namespace/kubernetes-dashboard created
serviceaccount/kubernetes-dashboard created
service/kubernetes-dashboard created
secret/kubernetes-dashboard-certs created
secret/kubernetes-dashboard-csrf created
secret/kubernetes-dashboard-key-holder created
configmap/kubernetes-dashboard-settings created
role.rbac.authorization.k8s.io/kubernetes-dashboard created
clusterrole.rbac.authorization.k8s.io/kubernetes-dashboard created
rolebinding.rbac.authorization.k8s.io/kubernetes-dashboard created
clusterrolebinding.rbac.authorization.k8s.io/kubernetes-dashboard created
deployment.apps/kubernetes-dashboard created
service/dashboard-metrics-scraper created
deployment.apps/dashboard-metrics-scraper created
```

在浏览器打开http://192.168.1.10:31443就可以访问k8s dashboard了

![](https://secure2.wostatic.cn/static/dH89FGHQaM3gpoh7sgy5Cc/image.png?auth_key=1681795904-o14LbFaUeKVqEb8t7s6jiB-0-d1422c14ad721cbf1475faeeaff7c660)

### 创建dashboard登录token

创建一个ServiceAccount: dashboard-admin

```Bash
kubectl create serviceaccount dashboard-admin -n kubernetes-dashboard
```

将dashboard-admin 绑定到集群管理角色

```Bash
kubectl create clusterrolebinding dashboard-cluster-admin --clusterrole=cluster-admin --serviceaccount=kubernetes-dashboard:dashboard-admin

```

查看dashboard-admin的登陆Token

```Bash
kubectl get secret -n kubernetes-dashboard
kubectl describe secret dashboard-admin-token-5pglz -n kubernetes-dashboard

```

如下所示

```Bash
[root@master opt]# kubectl get secret -n kubernetes-dashboard
NAME                               TYPE                                  DATA   AGE
dashboard-admin-token-kq7mk        kubernetes.io/service-account-token   3      10s
default-token-fj4rh                kubernetes.io/service-account-token   3      12m
kubernetes-dashboard-certs         Opaque                                0      12m
kubernetes-dashboard-csrf          Opaque                                1      12m
kubernetes-dashboard-key-holder    Opaque                                2      12m
kubernetes-dashboard-token-hmfp9   kubernetes.io/service-account-token   3      12m
[root@master opt]# kubectl describe secret dashboard-admin-token-kq7mk -n kubernetes-dashboard
Name:         dashboard-admin-token-kq7mk
Namespace:    kubernetes-dashboard
Labels:       <none>
Annotations:  kubernetes.io/service-account.name: dashboard-admin
              kubernetes.io/service-account.uid: 1e672d9b-1f51-4725-bced-0e601fb0c7a5

Type:  kubernetes.io/service-account-token

Data
====
token:      eyJhbGciOiJSUzI1NiIsImtpZCI6IktobGdiSzUzUkxXek1FSU00Y1Q5WGd0Ml9fWl9ZcFJGc3VpQWprZFZiTTQifQ.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJrdWJlcm5ldGVzLWRhc2hib2FyZCIsImt1YmVybmV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VjcmV0Lm5hbWUiOiJkYXNoYm9hcmQtYWRtaW4tdG9rZW4ta3E3bWsiLCJrdWJlcm5ldGVzLmlvL3NlcnZpY2VhY2NvdW50L3NlcnZpY2UtYWNjb3VudC5uYW1lIjoiZGFzaGJvYXJkLWFkbWluIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQudWlkIjoiMWU2NzJkOWItMWY1MS00NzI1LWJjZWQtMGU2MDFmYjBjN2E1Iiwic3ViIjoic3lzdGVtOnNlcnZpY2VhY2NvdW50Omt1YmVybmV0ZXMtZGFzaGJvYXJkOmRhc2hib2FyZC1hZG1pbiJ9.T8cbJzgUXD8yLUKp-Hec3ISFrIwXT9B8yN5gwQQKhlVdYXpkB3WWZ542lC0UA4GufGEwhJHMmMEdllHxYgemmcFin28AeUxP2EqDOYYHiGlR-2kWNOYGOqzL-fEuaQnYjngk_GJJRLXIZkHbDuBO6s5HWd8i8BQvKzE5SECedf0JxwwsEzObRY6z6UR1Zd25mePba2qXCW9UBgx-m07GrbO_DPbhC9hN_-lsHEivQ_WaTAkybWJruHjy5MYI9wCx1Pc7JdVQm07p3HAZAt6ft6-CObM9-jkviIOYyCC6F174yMW5Ty_rRzP7kmVanLP_wPdnnnziLMcmKz6bbg6hRw
ca.crt:     1099 bytes
namespace:  20 bytes
```

## 常见问题

### 初始化报错

```Bash
[init] Using Kubernetes version: v1.24.1
[preflight] Running pre-flight checks
error execution phase preflight: [preflight] Some fatal errors occurred:
        [ERROR CRI]: container runtime is not running: output: time="2023-01-19T15:05:35Z" level=fatal msg="validate service connection: CRI v1 runtime API is not implemented for endpoint \"unix:///var/run/containerd/containerd.sock\": rpc error: code = Unimplemented desc = unknown service runtime.v1.RuntimeService"
, error: exit status 1
[preflight] If you know what you are doing, you can make a check non-fatal with `--ignore-preflight-errors=...`
To see the stack trace of this error execute with --v=5 or higher
```

```Bash
yum remove -y containerd
yum update -y 
yum install -y containerd.io
rm -rf /etc/containerd/config.toml
systemctl restart containerd

```

### 忘了加入节点命令

```Bash
kubeadm token create --print-join-command
```

