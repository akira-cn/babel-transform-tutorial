const code = require('fs').readFileSync('code.js', 'utf-8');

const ast = require("babylon").parse(code, {
  // parse in strict mode and allow module declarations
  sourceType: "module"
});

const JSONprint = require('json-print');

console.log(JSONprint(JSON.stringify(ast)));
