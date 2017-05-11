import * as ts from "typescript";
import * as fs from "fs";
import { Identifier, PropertyAccessExpression, SourceFile } from 'typescript';

interface DocEntry {
    name?: string,
    fileName?: string,
    documentation?: string,
    type?: string,
    constructors?: DocEntry[],
    parameters?: DocEntry[],
    returnType?: string
}
;

/** Generate documentation for all classes in a set of .ts files */
function generateDocumentation (fileNames: string[], options: ts.CompilerOptions): void {
    // Build a program using the set of root file names in fileNames
    let program = ts.createProgram(fileNames, options);

    // console.log(program.getSourceFiles());
    // Get the checker, we will use it to find more about classes
    let checker = program.getTypeChecker();

    let output: DocEntry[] = [];

    let sourceFiles = program.getSourceFiles().reduce((acc: Array<SourceFile>, val: SourceFile) => {
        if (!acc.map(e => e.fileName).includes(val.fileName)) {

            acc.push(val);
        }
        return acc;
    }, []);

    // console.error(sourceFiles.length, program.getSourceFiles().length);

    // Visit every sourceFile in the program
    for (const sourceFile of sourceFiles) {
        // Walk the tree to search for classes
        ts.forEachChild(sourceFile, visit);
    }

    // print out the doc
    fs.writeFileSync("classes.json", JSON.stringify(output, undefined, 4));

    return;

    /** visit nodes finding exported classes */
    function visit (node: ts.Node) {
        // Only consider exported nodes

        // console.log('node.kind', ts.SyntaxKind[node.kind]);
        // console.error(node)
        if (node.kind === ts.SyntaxKind.PropertyAccessExpression) {
            let theNode: PropertyAccessExpression = <PropertyAccessExpression>node;

            if (theNode.name.text === 'includes') {
                console.error('TheNode', theNode);
                let ident: Identifier = theNode.expression;
                console.error('ident', ident);
                // checker.getTypeFromTypeNode(theNode);
            }

            // console.log('node', node);
            // console.log('node.flowNode', node.flowNode);

            // let symbol = node.flowNode.node.symbol;

            // console.log('sdfsd', checker.typeToString(checker.getTypeFromTypeNode(node.flowNode.node)));
            // console.log('node.parent.kind', ts.SyntaxKind[node.parent.kind]);

            // console.log('node.expression.flowNode.node.kind', ts.SyntaxKind[node.expression.flowNode.node.kind]);
            // console.log('node.expression.flowNode.node', node.expression.flowNode.node);
            // console.log('node.name.text', node.name.text);

            // let symbol = checker.getApparentType();
            // console.error('type', node.expression.flowNode.node.type);
            // console.error('ah', checker.typeToString(node.expression.flowNode.node.type))
            // let symbol = checker.getSymbolAtLocation(node.expression.flowNode.node.name);
            // console.log('huh?',symbol.checker.getApparentType());
            // console.error('test',checker.typeToString(checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration)));
        }
        // checker.
        ts.forEachChild(node, visit);
    }

    /** Serialize a symbol into a json object */
    function serializeSymbol (symbol: ts.Symbol): DocEntry {
        return {
            name: symbol.getName(),
            documentation: ts.displayPartsToString(symbol.getDocumentationComment()),
            type: checker.typeToString(checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration))
        };
    }

    /** Serialize a class symbol infomration */
    function serializeClass (symbol: ts.Symbol) {
        let details = serializeSymbol(symbol);

        // Get the construct signatures
        let constructorType = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
        details.constructors = constructorType.getConstructSignatures().map(serializeSignature);
        return details;
    }

    /** Serialize a signature (call or construct) */
    function serializeSignature (signature: ts.Signature) {
        return {
            parameters: signature.parameters.map(serializeSymbol),
            returnType: checker.typeToString(signature.getReturnType()),
            documentation: ts.displayPartsToString(signature.getDocumentationComment())
        };
    }

    /** True if this is visible outside this file, false otherwise */
    function isNodeExported (node: ts.Node): boolean {
        return (node.flags & ts.NodeFlags.Export) !== 0 || (node.parent && node.parent.kind === ts.SyntaxKind.SourceFile);
    }
}

declare var process: any;
declare var console: { log: Function, error: Function };

generateDocumentation(process.argv.slice(2), {
    target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS, lib: []
});
/**
 * Created by n635662 on 11/05/2017.
 */
