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
  'Array.prototype.includes': false
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

// Print out the features JSON.
fs.writeFileSync(output, JSON.stringify(features, undefined, 2));

function visit (node: ts.Node) {
  if (ifNodeIsArrayIncludes(<PropertyAccessExpressionHiddenApi>node)) {
    features['Array.prototype.includes'] = true;
  }

  ts.forEachChild(node, visit);
}

function ifNodeIsArrayIncludes (node: PropertyAccessExpressionHiddenApi): boolean {
  if (node.kind !== ts.SyntaxKind.PropertyAccessExpression) {
    return false;
  }

  if (typeof node.expression.flowNode === 'undefined') {
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
