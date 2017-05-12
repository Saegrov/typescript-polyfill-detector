import * as ts from 'typescript';
import * as fs from 'fs';
import { LeftHandSideExpression, PropertyAccessExpression } from 'typescript';

interface LeftHandSideExpressionHiddenApi extends LeftHandSideExpression {
  flowNode: {
    node: any
  }
}

interface PropertyAccessExpressionHiddenApi extends PropertyAccessExpression {
  expression: LeftHandSideExpressionHiddenApi
}

const features = {
  ArrayIncludes: {
    name: 'Array.prototype.includes()',
    used: false
  }
};

const entryPoint = process.argv.slice(2)[0];
const output = process.argv.slice(3)[0];

if (!entryPoint || !output) {
  console.log('Usage: test.ts entryPoint output');
  process.exit();
}

const program = ts.createProgram([entryPoint], {});
const sourceFiles = program.getSourceFiles();

// Visit every sourceFile in the program.
for (const sourceFile of sourceFiles) {
  ts.forEachChild(sourceFile, visit);
}

// print out the doc
fs.writeFileSync(output, JSON.stringify(features, undefined, 2));
// console.log('Project uses "Array.includes":', features.ArrayIncludes.used);

function visit (node: ts.Node) {
  if (ifNodeIsArrayIncludes(<PropertyAccessExpressionHiddenApi>node)) {
    features.ArrayIncludes.used = true;
  }

  ts.forEachChild(node, visit);
}

function ifNodeIsArrayIncludes (node: PropertyAccessExpressionHiddenApi): boolean {
  if (node.kind !== ts.SyntaxKind.PropertyAccessExpression) {
    return false;
  }

  const nodeName = node.name.text;

  if (nodeName !== 'includes' || typeof node.expression.flowNode === 'undefined') {
    return false;
  }

  const leftHandSideExpression = node.expression.flowNode.node;

  if (typeof leftHandSideExpression === 'undefined') {
    return false;
  }

  // We need to use the typeName text to find out if the node is of type "Array"
  // See http://stackoverflow.com/a/39359772
  const leftHandSideExpressionName = leftHandSideExpression.type.typeName.text;  // Or `leftHandSideExpression.type.getText()`

  return leftHandSideExpressionName === 'Array';
}
