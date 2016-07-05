const code = require('fs').readFileSync('code.js', 'utf-8');

const ast = require("babylon").parse(code, {
  // parse in strict mode and allow module declarations
  sourceType: 'module',
  filename: 'test.js'
});

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
};

traverse(ast, myVisitor);

const generate = require('babel-generator').default;

console.log(generate(ast, {
    retainLines: false,
  }, code).code);
