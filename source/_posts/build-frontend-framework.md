---
title: 构建一个前端框架-响应式，组合式，零依赖
date: 2023-09-20 18:10:46
tags:
- Web
categories:
- Web
excerpt: 构建一个前端框架-响应式，组合式，零依赖
---

> 原文地址：[https://18alan.space/posts/how-hard-is-it-to-build-a-frontend-framework.html#how-hard-is-it-to-build-a-frontend-framework](https://18alan.space/posts/how-hard-is-it-to-build-a-frontend-framework.html#how-hard-is-it-to-build-a-frontend-framework)

在开始之前设定一些背景，所谓的前端框架是指一个能够让我们**避免**编写传统的HTML和JavaScript代码的框架，例如：

```HTML
<p id="cool-para"></p>
<script>
  const coolPara = 'Lorem ipsum.';
  const el = document.getElementById('cool-para');
  el.innerText = coolPara;
</script>
```

而是允许我们编写类似这样的神奇HTML和JavaScript代码 ([Vue](https://vuejs.org/guide/scaling-up/sfc.html#introduction)):

```HTML
<script setup>
  const coolPara = 'Lorem ipsum.';
</script>
<template>
  <p>{{ coolPara }}</p>
</template>
```

或者是([React](https://react.dev/learn/your-first-component#defining-a-component)):

```JSX
export default function Para() {
  const coolPara = 'Lorem ipsum';
  return <p>{ coolPara }</p>;
}
```

这样一个框架的好处是可以理解的。记住像 `document`、`innerText` 和 `getElementById` 这样的单词或短语非常困难，因为它们音节太长了。

好吧，音节太长并不是主要原因。

> 响应式✨

第一个主要原因是，在第二和第三个示例中，我们只需要设置或者更新变量`coolPara`和标记的值，更新`<p>`元素时不需要显式的设置它的`innerText`。

这被称为***响应式***，UI与数据绑定在一起，只需要更改即可更新UI

> 组合式✨

第二个主要原因是可以定一个组件并重用它，而不必在每次需要时都重新定义它，这就是所谓的***组合式***。

默认情况下，普通的HTML+JavaScript没有这个属性。因此，下面的代码并没有做它认为应该做的事情：

```HTML
<!-- Defining the component -->
<component name="cool-para">
  <p>
    <content />
  </p>
</component>

<!-- Using the component -->
<cool-para>Lorem ipsum.</cool-para>
```

响应式和组合式时Vue、React等常用的前端框架提供的两个主要特性。

这些抽象并不是没有代价的，人们必须预先在加载一些特定于框架的概念，当事情以令人费解的神奇方式工作时处理它们的漏洞，更不用说，还有一大堆容易失败的依赖关系。

但事实证明，使用现代Web API，实现这两个目标并不难。在大多数情况下，我们实际上可能并不需要传统的框架和它们复杂的混乱…

## 响应式（Reactivity）

一个简单的陈述来解释响应式就是***当数据更新时，自动更新用户界面***。

第一部分是了解***数据何时更新***，不幸的是，这不是一个普通的对象可以做到的事情。我们不能简单的调用一个`ondateupdate`的监听器来监听数据的变化。

幸运的是，JavaScript刚好有一个可以让我们做到这一点的工具，它叫做代理（[`Proxy`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)）。

### 代理对象（Proxy Objects）

`Proxy`允许我们从一个***普通对象***创建一个***代理对象***：

```JavaScript
const user = { name: 'Lin' };
const proxy = new Proxy(user, {});
```

并且这个***代理对象***可以监听到数据变化

在上面的例子中，我们有一个***代理对象***，但是当知道名称已经改变时，它并没有真正做任何事情。

为此，我们需要一个***处理程序***，它是一个对象，告诉***代理对象***在更新数据时应该做什么。

```JavaScript
// Handler that listens to data assignment operations
const handler = {
  set(user, value, property) {
    console.log(`${property} is being updated`);
    return Reflect.set(user, value, property);
  },
};

// Creating a proxy with the handler
const user = { name: 'Lin' };
const proxy = new Proxy(user, handler);
```

现在，每当我们使用对代理对象更新`name`时，都会收到一条消息，并输出`name is being updated`。

如果你在想，这有什么了不起，我本来可以使用普通的[*setter*](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/set)来做到这一点，我来告诉你其中的妙处：

- 代理方法是通用的，并且可以重用。
- 在代理对象上设置的任何值都可以递归转换为代理。
- 现在你拥有了这个神奇的对象，它可以对数据更新做出反应，无论嵌套多深。

除此之外，你还可以处理其他访问[事件](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy#handler_functions)，例如当属性被[读取](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy/get)、[更新](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy/set)、[删除](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy/deleteProperty)等等。

既然我们有能力监听操作，我们就需要以一种有意义的方式对它们作出反应。

### 更新用户界面

如果您还记得，第二部分的***响应式***是***自动更新UI***。为此，我们需要获取要更新的***适当***UI元素。但在此之前，我们需要首先标记一个***适当***的UI元素。

为此，我们将使用[data-attributes](https://developer.mozilla.org/en-US/docs/Learn/HTML/Howto/Use_data_attributes)，这个特性允许我们在元素上设置任意值。

```HTML
<div>
  <!-- Mark the h1 as appropriate for when "name" changes -->
  <h1 data-mark="name"></h1>
</div>
```

`data-attributes`的精确性在于，我们现在可以使用以下方法找到所有***适当***的元素。

```JavaScript
document.querySelectorAll('[data-mark="name"]');
```

现在我们只需要设置所有适当元素的`innerText`:

```JavaScript
const handler = {
  set(user, value, property) {
    const query = `[data-mark="${property}"]`;
    const elements = document.querySelectorAll(query);

    for (const el of elements) {
      el.innerText = value;
    }

    return Reflect.set(user, value, property);
  },
};

// Regular object is omitted cause it's not needed.
const user = new Proxy({ name: 'Lin' }, handler);
```

就是这样，这就是***响应式***的关键！

由于我们处理程序的通用性质，对于用户的任何设置的属性，所有适当的用户界面元素都将被更新。

这就是 JavaScript 代理功能的强大之处，没有任何依赖项，并且经过一些巧妙的处理，它可以为我们提供这些神奇的响应式对象。

现在转向第二个主要内容...

## 组合式（Composibility）

事实证明，浏览器已经有一个专门的功能，称为 [Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components)，谁知道呢！

很少有人使用它，因为使用起来有点麻烦（而且大多数人在开始项目时都会默认选择传统的框架，而不考虑项目的范围）。

要实现组件的可组合性，我们首先需要定义这些组件。

### 使用模板和插槽（template 和 slot）来定义组件

`<template>` 标签用于包含浏览器不会渲染的标记。例如，你可以在你的 HTML 中添加以下标记：

```HTML
<template>
  <h1>Will not render!</h1>
</template>
```

它们不会被渲染。你可以将它们视为组件的隐形容器。

下一个构建块是 `<slot>` 元素，它定义了组件的内容将放置在哪里。这使得组件可以与不同的内容重复使用，即它变得具有可组合性。

例如，这是一个将其文本颜色设为红色的 `<h1>` 元素的示例。

```HTML
<template>
  <h1 style="color: red">
    <slot />
  </h1>
</template>
```

在我们开始使用组件之前，就像上面的红色 `<h1>` 一样，我们需要***注册***它们。

### 注册组件

在注册红色 `<h1>` 组件之前，我们需要一个名称来注册它。我们可以使用 name 属性来实现：

```HTML
<template name="red-h1">
  <h1 style="color: red">
    <slot />
  </h1>
</template>
```

现在，使用一些 JavaScript 代码，我们可以获取组件及其名称：

```JavaScript
const template = document.getElementsByTagName('template')[0];
const componentName = template.getAttribute('name');
```

最后，使用 `customElements.define` 来注册它：

```JavaScript
customElements.define(
  componentName,
  class extends HTMLElement {
    constructor() {
      super();
      const component = template.content.children[0].cloneNode(true);
      this.attachShadow({ mode: 'open' }).appendChild(component);
    }
  }
);
```

上面的代码块中有很多内容：

- 我们调用 `customElements.define` 方法，传递了两个参数。
- 第一个参数是组件的名称（例如 "red-h1"）。
- 第二个参数是一个类，它将我们的自定义组件定义为 `HTMLElement`。

在类构造函数中，我们使用 `red-h1` 模板的副本来设置阴影 DOM 树。

- 什么是 Shadow DOM?

  阴影 DOM 是设置多个默认元素的样式的方式，例如范围输入（[range input](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/range)）或视频元素（[video element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video)）。

  元素的阴影 DOM 默认是隐藏的，这就是为什么我们不能在开发工具控制台中看到它的原因，但在这里，我们将`mode`设置为 `'open'`。

  这允许我们检查元素并看到红色的 `<h1>` 附加到了 [#shadow-root](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot)。

调用 `customElements.define` 将允许我们像使用常规 HTML 元素一样使用定义的组件。

```HTML
<red-h1>This will render in red!</red-h1>
```

现在让我们把这两个概念结合起来吧！如果你有任何与这个主题相关的问题或需要进一步的解释，请随时提问。

## 组合式+响应式

简单回顾一下，我们做了两件事:

1. 我们创建了一个响应式数据结构，即***代理对象***，当设置一个值时，它可以更新我们已经标记为***适当***的任何元素。
2. 我们定义了一个自定义组件 `red-h1`，它会将其内容呈现为红色的 `<h1>`。

现在我们可以将它们组合在一起了：

```HTML
<div>
  <red-h1 data-mark="name"></red-h1>
</div>

<script>
  const user = new Proxy({}, handler);
  user.name = 'Lin';
</script>
```

然后，我们可以使用自定义组件来呈现我们的数据，并在更改数据时更新用户界面。

## 最后

当然，传统的前端框架不只是这样做，它们有专门的语法，例如Vue中的[模板语法](https://vuejs.org/guide/essentials/template-syntax.html)和React中的[JSX](https://react.dev/learn/writing-markup-with-jsx)，使得编写复杂的前端相对更加简洁。

由于这种专门的语法不是常规的 JavaScript 或 HTML，因此浏览器无法解析它们，所以它们都需要专门的工具将它们编译成常规的 JavaScript、HTML 和 CSS，然后浏览器才能理解它们。因此，[很少有人再手动编写 JavaScript](https://fly.io/blog/js-ecosystem-delightfully-wierd#nobody-writes-javascript-any-more)。

即使没有专门的语法，只要使用 `Proxy` 和 `WebComponents`，你也可以做到与传统的前端框架类似的许多事情，而且代码同样简洁。

这里的代码过于简化，要将其转化为一个框架，你需要进一步完善。以下是我尝试做到这一点的示例，一个名为 [Strawberry](https://18alan.space/strawberry) 的框架。

在开发这个框架时，我计划保持两个硬性约束：

1. 无依赖。
2. 在使用之前不需要构建步骤。

还有一个轻松的约束是保持代码库的精简。在撰写本文时，它只是一个不到 400 行代码的[单个文件](https://github.com/18alantom/strawberry/blob/52cc4e3c88924d112559d0547c533c1fafa61140/index.ts)，让我们看看它会发展到哪里。

