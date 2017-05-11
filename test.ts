import * as ts from "typescript";
import * as fs from "fs";
import { Identifier, PropertyAccessExpression, SourceFile } from 'typescript';

declare var process: any;
declare var console: { log: Function, error: Function };

const enum DetectableFeatures {
  ArrayIncludes = 0
};

const detectedFeatures = {};

const program = ts.createProgram(process.argv.slice(2), { });
const sourceFiles = program.getSourceFiles();
console.log('sourceFiles', sourceFiles.map(f => f.fileName));

let checker = program.getTypeChecker();

// Visit every sourceFile in the program.
for (const sourceFile of sourceFiles) {
    ts.forEachChild(sourceFile, visit);
}

console.log('Project uses "Array.includes":', Boolean(detectedFeatures[DetectableFeatures.ArrayIncludes]));

function visit (node: ts.Node) {
  if (ifNodeIsArrayIncludes(node) === true) {
    detectedFeatures[DetectableFeatures.ArrayIncludes] = true;
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
