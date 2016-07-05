var babel = require('babel-core');

const myVisitor = {
  IfStatement(path) {
    const t = require('babel-types');

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

babel.transformFile('code.js', {
  plugins: [{
    visitor: myVisitor
  }]
}, function(err, result){
  console.log(err || result.code);
});
