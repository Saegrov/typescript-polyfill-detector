import * as ts from "typescript";
import * as fs from "fs";
import { Identifier, PropertyAccessExpression, SourceFile } from 'typescript';

declare var process: any;
declare var console: { log: Function, error: Function };

const features = {
  ArrayIncludes: {
    name: 'Array.prototype.includes()',
    used: false
  }
};

const entryPoint = process.argv.slice(2)[0]
const output = process.argv.slice(3)[0]

if (!entryPoint || !output) {
  console.log('Usage: test.ts entryPoint output');
  process.exit();
}

const program = ts.createProgram([entryPoint], { });
const sourceFiles = program.getSourceFiles();

let checker = program.getTypeChecker();

// Visit every sourceFile in the program.
for (const sourceFile of sourceFiles) {
  ts.forEachChild(sourceFile, visit);
}

// print out the doc
fs.writeFileSync(output, JSON.stringify(features, undefined, 2));
// console.log('Project uses "Array.includes":', features.ArrayIncludes.used);

function visit (node: ts.Node) {
  if (ifNodeIsArrayIncludes(node) === true) {
    features.ArrayIncludes.used = true;
  }

  ts.forEachChild(node, visit);
}

function ifNodeIsArrayIncludes(node) {
  if (node.kind !== ts.SyntaxKind.PropertyAccessExpression) {
    return false;
  }

  const leftHandSideExpression = node.expression.flowNode.node;

  if (typeof leftHandSideExpression === 'undefined') {
    return false;
  }

  const nodeName = node.name.text;

  // We need to use the typeName text to find out if the node is of type "Array"
  // See http://stackoverflow.com/a/39359772
  const leftHandSideExpressionName = leftHandSideExpression.type.typeName.text;  // Or `leftHandSideExpression.type.getText()`

  return nodeName === 'includes' && leftHandSideExpressionName === 'Array';
}
