---
title: MathJax Test
date: 2022-07-21 08:53:56
tags:
- markdown
categories:
- markdown
excerpt: 测试MathJax语法
---

## 行内公式与块公式

```markdown
$f(x)=ax+b$ 这是行内公式.
$$f(x)=ax+b$$ 这是块公式，单独占一行.
```
$f(x)=ax+b$ 这是行内公式.
$$f(x)=ax+b$$ 这是块公式，单独占一行.

## 上标与下标

使用 ^ 表示上标，使用 _ 表示下标，如果上下标的内容多于一个字符，可以使用大括号括起来：

```markdown
$$f(x) = a_1x^n + a_2x^{n-1} + a_3x^{n-2}$$
```

显示效果：

$$f(x) = a_1x^n + a_2x^{n-1} + a_3x^{n-2}$$

如果左右两边都有上下标可以使用 \sideset 语法：

```markdown
$$\sideset{^n_k}{^x_y}a$$
```

显示效果：

$$\sideset{^n_k}{^x_y}a$$

## 括号

在 markdown 语法中，\, $, {, }, _都是有特殊含义的，所以需要加\转义。小括号与方括号可以使用原始的() [] 大括号需要转义\也可以使用\lbrace和 \rbrace

```markdown
$$ \\{x*y\\} $$  --注：大括号在markdown中已有一次转义，在mathjax中还要再转一次，所以为两个斜杠

$$\lbrace x*y \rbrace$$
```

显示效果：

$$ \\{x*y\\} $$

$$\lbrace x*y \rbrace$$

原始符号不会随着公式大小自动缩放，需要使用 \left 和 \right 来实现自动缩放：

```markdown
$$\left \lbrace \sum_{i=0}^n i^3 = \frac{(n^2+n)(n+6)}{9} \right \rbrace$$
```

显示效果：

$$\left \lbrace \sum_{i=0}^n i^3 = \frac{(n^2+n)(n+6)}{9} \right \rbrace$$

不使用\left 和 \right的效果：

```markdown
$$ \lbrace \sum_{i=0}^n i^3 = \frac{(n^2+n)(n+6)}{9}  \rbrace$$
```

显示效果：

$$ \lbrace \sum_{i=0}^n i^3 = \frac{(n^2+n)(n+6)}{9}  \rbrace$$

## 分数与开方

可以使用\frac 或者 \over 实现分数的显示：

```markdown
$\frac xy$
$ x+3 \over y+5 $
```

显示为 $\frac xy$ 和 $ x+3 \over y+5 $

开方使用\sqrt:

```markdown
$ \sqrt{x^5} $
$ \sqrt[3]{\frac xy} $
```

显示为 $ \sqrt{x^5} $ 和 $ \sqrt[3]{\frac xy} $

## 求和与积分

求和使用\sum,可加上下标，积分使用\int可加上下限，双重积分用\iint

```markdown
$ \sum_{i=0}^n $
$ \int_1^\infty $
$ \iint_1^\infty $
```

显示为 $ \sum_{i=0}^n $ 和 $ \int_1^\infty $ 以及 $ \iint_1^\infty $

## 极限

极限使用\lim:

```markdown
$ \lim_{x \to 0} $
```

显示为: $ \lim_{x \to 0} $

## 表格与矩阵

表格样式lcr表示居中，|加入一条竖线，\hline表示行间横线，列之间用&分隔，行之间用\分隔：

```markdown
$$\begin{array}{c|lcr}
n & \text{Left} & \text{Center} & \text{Right} \\\\
\hline
1 & 1.97 & 5 & 12 \\\\
2 & -11 & 19 & -80 \\\\
3 & 70 & 209 & 1+i \\\\
\end{array}$$
```

显示效果：

$$\begin{array}{c|lcr}
n & \text{Left} & \text{Center} & \text{Right} \\\\
\hline
1 & 1.97 & 5 & 12 \\\\
2 & -11 & 19 & -80 \\\\
3 & 70 & 209 & 1+i \\\\
\end{array}$$

## 矩阵

```markdown
$$\left[
\begin{matrix}
V_A \\\\
V_B \\\\
V_C \\\\
\end{matrix}
\right] =
\left[
\begin{matrix}
1 & 0 & L \\\\
-cosψ & sinψ & L \\\\
-cosψ & -sinψ & L
\end{matrix}
\right]
\left[
\begin{matrix}
V_x \\\\
V_y \\\\
W \\\\
\end{matrix}
\right] $$
```

显示效果:

$$\left[
\begin{matrix}
V_A \\\\
V_B \\\\
V_C \\\\
\end{matrix}
\right] =
\left[
\begin{matrix}
1 & 0 & L \\\\
-cosψ & sinψ & L \\\\
-cosψ & -sinψ & L
\end{matrix}
\right]
\left[
\begin{matrix}
V_x \\\\
V_y \\\\
W \\\\
\end{matrix}
\right] $$

<hr>

综合测试：

```markdown
$$\frac{\partial u}{\partial t}
= h^2 \left( \frac{\partial^2 u}{\partial x^2} +
\frac{\partial^2 u}{\partial y^2} +
\frac{\partial^2 u}{\partial z^2}\right)$$

$$ \lbrace \sum_{i=0}^n i^3 = \frac{(n^2+n)(n+6)}{9}  \rbrace$$
```
显示效果:

$$\frac{\partial u}{\partial t}
= h^2 \left( \frac{\partial^2 u}{\partial x^2} +
\frac{\partial^2 u}{\partial y^2} +
\frac{\partial^2 u}{\partial z^2}\right)$$

$$ \lbrace \sum_{i=0}^n i^3 = \frac{(n^2+n)(n+6)}{9}  \rbrace$$