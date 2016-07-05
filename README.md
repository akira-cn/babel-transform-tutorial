# Babel for ES6? And Beyond!

以下是我在 2016/7/4 奇舞团泛前端分享会上的[分享](http://matrix.h5jun.com/slide/show?id=120#/)的文字内容。

## 什么是 Babel

较早接触 ES6 的同学对 Babel 应该并不陌生，它是一款能将 ES6+ 编译成 ES5 的编译器。

> Babel is a JavaScript compiler.
> 
> Use next generation JavaScript, today.
> 

_Babel 官网对它的文字介绍_

喜欢用 React 的同学也对它可能不陌生，它可以处理 JSX。

>Babel can convert JSX syntax and strip out type annotations. Check out our React preset to get started. Use it together with the babel-sublime package to bring syntax highlighting to a whole new level.

_Babel 可以处理 JSX_

然而，不管是作为 ES6 向后编译为 ES5 的工具，还是作为处理 JSX 的替代，Babel 是否都是以一个**临时方案**而存在的呢？

我的观点是，Babel 的作用远远超过作为 ES6 到 ES5 的编译器，以及处理 JSX。就算是在未来浏览器和各种 JS 环境已经完全普及 ES6+，Babel 还是有存在的价值和作用。

在上个月我写了[一篇文章](https://www.h5jun.com/post/code-coverage-with-babel-plugin.html)，介绍了用 Babel 实现代码覆盖度检查插件，我把[代码](https://github.com/akira-cn/babel-plugin-transform-coverage)放在 GitHub 上，有兴趣的同学可以看一下那篇文章，同时研究一下这个插件（我还为它写了一个 [Demo](https://github.com/akira-cn/transform-coverage-demo)）。

今天，我要通过一个更简单的例子来演示，我们能够使用 Babel 来做什么。

在这之前，我们先来看一些基础概念。

## 编译工作流与抽象语法树（AST）

一般来说，将一种结构化语言的代码编译成另一种类似的结构化语言的代码包括以下几个步骤：

<img src="https://p.ssl.qhimg.com/d/inn/fe85afd2/compile.png" style="border:none;">

<div style="display:flex;float:right;width:80%;text-align:center;color:#c00;">
	<div style="flex:1">babylon</div>
	<div style="flex:1">babel-traverse</div>
	<div style="flex:1">babel-generator</div>
</div>
<div style="clear:both"></div>

首先是 parse，将代码解析成抽象语法树（Abstract Syntex Tree），然后对 AST 进行遍历（traverse）和替换(replace)（这对于前端来说其实并不陌生，可以类比 DOM 树的操作），最后是 generate，根据新的 AST 生成编译后的代码。

在 Babel 6 中，parse、traverse 以及 generator 是通过三个不同的工具来完成的，它们分别是 [babylon](https://github.com/babel/babylon/blob/master/ast/spec.md)、[babel-traverse](https://github.com/thejameskyle/babel-handbook/blob/master/translations/zh-Hans/plugin-handbook.md#toc-babel-traverse) 以及 [babel-generator](https://github.com/thejameskyle/babel-handbook/blob/master/translations/zh-Hans/plugin-handbook.md#toc-babel-generator)。

### 抽象语法树（AST）

[AST](https://en.wikipedia.org/wiki/Abstract_syntax_tree)是将程序 token 解析出来，组织成与程序结构对应的树状结构表示：

<img src="https://p.ssl.qhimg.com/d/inn/bf9f4f0d/AST.png" style="border:none;">

上图的 AST 对应的代码段为：

```js
while(b !== 0){
  if(a > b){
  	a -= b;
  }else{
  	b -= a
  }
}
```

Babel 发布了 [Babylon AST 规范](https://github.com/babel/babylon/blob/master/ast/spec.md)对 AST 的 node 的每一个类型做了详细说明。

## 动手实践

下面我们考虑一个实际例子，将一段包含 if / else 的 return 语句替换成 return 一个三目表达式：

```js
function max(a, b){
  if(a > b){
    return a;
  }else{
    return b;
  }
}
```

替换为：

```js
function max(a, b){
  return a > b ? a : b;
}
```

要做到这个，我们可以先用 babylon 解析出原始的 AST：

```js
const code = require('fs').readFileSync('code.js', 'utf-8');

const ast = require("babylon").parse(code, {
  // parse in strict mode and allow module declarations
  sourceType: "module"
});
```

<img src="https://p.ssl.qhimg.com/d/inn/9040ca6f/source.png" style="border:none">

### 遍历 AST，操作节点

前面我们已经看到 AST 是一棵树，现在我们需要对它进行遍历，而这是可以通过 babel-traverse 来实现的：

```js
const code = require('fs').readFileSync('code.js', 'utf-8');

const ast = require("babylon").parse(code, {
  // parse in strict mode and allow module declarations
  sourceType: 'module',
  filename: 'test.js'
});

const traverse = require('babel-traverse').default;
var indent = '';

traverse(ast, {
  enter(path) {
    console.log(indent + '<' + path.node.type + '>');
    indent += '  ';
  },
  exit(path){
    indent = indent.slice(0, -2);
    console.log(indent + '<' + '/' + path.node.type + '>');
  }
});
```

上面的代码将 AST 输出为 XML 的文档结构，从而我们可以直观地看出一段代码转成 AST 之后的树状结构：

```xml
<Program>
  <FunctionDeclaration>
    <Identifier>
    </Identifier>
    <Identifier>
    </Identifier>
    <Identifier>
    </Identifier>
    <BlockStatement>
      <IfStatement>
        <BinaryExpression>
          <Identifier>
          </Identifier>
          <Identifier>
          </Identifier>
        </BinaryExpression>
        <BlockStatement>
          <ReturnStatement>
            <Identifier>
            </Identifier>
          </ReturnStatement>
        </BlockStatement>
        <BlockStatement>
          <ReturnStatement>
            <Identifier>
            </Identifier>
          </ReturnStatement>
        </BlockStatement>
      </IfStatement>
    </BlockStatement>
  </FunctionDeclaration>
</Program>
```

### enter 和 exit

我们可以看到，babel-traverse 会遍历 AST 上的所有节点，而访问每一个节点有两个时机： `enter` 和 `exit`。实际上这也很好理解，`enter` 是在节点中包含的子节点内容还没被解析时，而 `exit` 是在包含的子节点被解析完成之后，可以类比 HTML 的开始和结束标签，如果在开始标签下方处理 JS，那么因为子内容还没有开始解析，所以还不能处理其中的子元素，而在结束标签之前，则子元素已经加载完成：

```html
<div class="container">
	<script>traverse_enter()</script>
    ...some stuff
	<script>traverse_exit()</script>
</div>
```

_enter 和 exit 类似于上面两段 JS 处理 HTML DOM 节点的时机。_

### 简单的节点选择器：visitor pattern

一般情况下，与 DOM 操作类似，我们不需要遍历和处理所有的节点，而只需要处理某些特定节点（比如 if 语句），这种情况下，babel-traverse 提供了简单的“选择器”来过滤节点，而这个简单的“选择器”是一个 [visitor pattern](https://en.wikipedia.org/wiki/Visitor_pattern)。

```js
const myVisitor = {
  IfStatement(path) {
  	 ...
  }
};

traverse(ast, myVisitor);
```

_只处理 if 语句_

选择器也支持 `enter` 和 `exit`：

```js
const myVisitor = {
  IfStatement: {
  	enter(path){
  		...
  	}
  	exit(path){
  		...
  	}
  }
};
```

### 替换节点

现在我们可以动手替换节点了，对比一下从 if 语句和三目运算符：

```js
interface IfStatement <: Statement {
  type: "IfStatement";
  test: Expression;
  consequent: Statement;
  alternate: Statement | null;
}

interface ConditionalExpression <: Expression {
  type: "ConditionalExpression";
  test: Expression;
  consequent: Expression;
  alternate: Expression;
}
```

发现它们其实很类似（都有 test、consquent 和 alternate）。

所以我们现在就可以进行处理了，处理代码也并不复杂：

```js
const traverse = require('babel-traverse').default;
const t = require('babel-types');

const myVisitor = {
  IfStatement(path) {
    var consequent = path.node.consequent,
      alternate = path.node.alternate,
      test = path.node.test;

    if(consequent && alternate){
      var consequentExp = consequent.body[0],
          alternateExp = alternate.body[0];

      if(t.isReturnStatement(consequentExp) 
        && t.isReturnStatement(alternateExp)){

        var node = t.returnStatement(
          t.conditionalExpression(
            test,
            consequentExp.argument,
            alternateExp.argument
          )
        ); 
        
        path.replaceWith(node);
      }
    }
  }
};

traverse(ast, myVisitor);
```

需要注意的几点：

- 我们可以通过 visitor 来访问 IfStatement
- 我们要判断 IfStatement 的 consequent 和 alternate 都存在（因为可以允许只有 if 没有 else）
- 我们要判断 consequent 和 alternate 里面都只有 ReturnStatement
- Babel 提供了 babel-types 来处理节点，它可以用来判断节点类型和构造节点
- 通过 babel-types 构造一个返回三目表达式（ConditionalExpression）的 ReturnStatement，最后通过 `path.replaceWith` 用新的节点替换原来的节点

```js
var node = t.returnStatement(
  t.conditionalExpression(
    test,
    consequentExp.argument,
    alternateExp.argument
  )
); 

traverse(ast, myVisitor);
```

这样就实现了将 AST 中的 if / else 替换为三目表达式的功能。

### 生成代码

处理完 AST 之后，我们可以通过 babel-generator 将新代码生成：

```js
const generate = require('babel-generator').default;

console.log(generate(ast, {
    retainLines: false,
  }, code).code);
``` 

得到的结果为：

```js
function max(a, b) {
  return a > b ? a : b;
}
```

为了调试方便，babel 提供了编译保留行号的功能，可以通过设置 `retainLines: true` 来实现：

```js
function 
max(a, b) {return (
    a > b ? 
    a : 

    b);}
```

_保留行号的输出_

以上，将 if / else 优化为三目运算的功能就使用 Babel 实现了，以下是完整代码：

```js
const code = require('fs').readFileSync('code.js', 'utf-8');

const ast = require("babylon").parse(code, {
  // parse in strict mode and allow module declarations
  sourceType: 'module',
  filename: 'test.js'
});

const traverse = require('babel-traverse').default;
const t = require('babel-types');

traverse(ast, {
  enter(path) {
    if(t.isIfStatement(path.node)){

      var consequent = path.node.consequent,
        alternate = path.node.alternate,
        test = path.node.test;

      if(consequent && alternate){
        var consequentExp = consequent.body[0],
            alternateExp = alternate.body[0];

        if(t.isReturnStatement(consequentExp) 
          && t.isReturnStatement(alternateExp)){
          //console.log(alternateExp.argument);
          var node = t.returnStatement(
            t.conditionalExpression(
              test,
              consequentExp.argument,
              alternateExp.argument
            )
          ); 
          path.replaceWith(node);
        }
      }
    }
  }
});

var generate = require('babel-generator').default;

console.log(generate(ast, {
    retainLines: false,
  }, code).code);
```

## 更简单的做法

### Babel-core 与 transformFile

上面实现的过程中，我们自己通过 File API 读取文件，通过 babel-parse 将文件内容解析成 AST，然后将 AST 传入 babel-traverse 处理，最后将处理好的 AST 通过 babel-generator 生成。

事实上，babel-core 提供了更简单的 API 来处理文件：

```
var babel = require('babel-core');

const myVisitor = {
  IfStatement(path) {
	...
  }
};

babel.transformFile('code.js', {
  plugins: [{
    visitor: myVisitor
  }]
}, function(err, result){
  console.log(err || result.code);
});
```

这样我们不需要自己读取文件，也不需要手动传 AST 给 babel-traverse 然后再手动 generate。`babel.transformFile` 接受文件名作为参数，在 options 里面可以传一个或多个 visitor 对象作为插件，然后通过 callback 返回处理结果，生成的代码在 result.code 中。

### 使用 Babel-cli

Babel 还提供了命令行工具 babel-cli，有了 babel-cli，我们也可以不用自己调用 babel.transformFile，我们所要做的全部事情只是定义一个 visitor 就可以了：

```js
//transform-plugin.js
module.exports = {
  IfStatement(path) {
	...
  }
};
```

这样，我们就可以通过 babel 命令来执行插件了：

```bash
babel src --plugins ./transform-plugin.js
```

## 总结

Babel 并不仅仅是作为将 ES6 编译成 ES5 的工具，或者处理 JSX 的替代工具，事实上它几乎可以将 ES6 代码**转换为任何结构语言**。因此，在很多情况下我们可以拿它来做非常神奇的事情。如果你有兴趣，你可以通过阅读 [babel-handbook](https://github.com/thejameskyle/babel-handbook/blob/master/translations/zh-Hans/plugin-handbook.md#toc-visitors) 来发掘它的潜力。你会发现它使用起来简单而且非常有趣的 😎。

最后，本文的所有代码在 [GitHub repo]()，如果有任何问题，欢迎在评论区讨论~~
