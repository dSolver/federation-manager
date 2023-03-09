import { isUndefined } from 'lodash';
import * as ts from "typescript";
import * as fs from 'fs';
import glob from 'glob';
import axios from 'axios';
import * as path from 'path';

/**
 * Prints out particular nodes from a source file
 * 
 * @param file a path to a file
 * @param identifiers top level identifiers available
 */
function extract(program: ts.Program, file: string, imports: string[]): { file: string, foundImports: Set<string> } | undefined {
    const sourceFile = program.getSourceFile(file);

    // To print the AST, we'll use TypeScript's printer
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed, removeComments: true, omitTrailingSemicolon: false });

    const foundImports = new Set<string>()
    // Loop through the root AST nodes of the file
    if (!sourceFile) {
        console.log("Did not find source: ", file)
        return
    }

    const handleImports = (node: ts.Node) => {
        if (ts.isImportDeclaration(node)) {
            const moduleSpecifier = node.moduleSpecifier as any
            const content = moduleSpecifier.text;
            const match = imports.some(m => m === content)
            if (match) {
                foundImports.add(moduleSpecifier.text)
            }

        }

        if (ts.isCallExpression(node)) {
            if (node.getFirstToken(sourceFile)?.getText(sourceFile).trim() === "import") {
                // this is an import statement
                const match = matchStringInNode(sourceFile, node, imports)

                if (match) {
                    // console.log("Matches!", match)
                    foundImports.add(match)
                    return true;
                }
            }
        }
        if (ts.isFunctionLike(node)) {
            const text = printer.printNode(ts.EmitHint.Unspecified, node, sourceFile)
            // console.log("Function-like", text)
            if (text.indexOf("import") >= 0) {
                // check the string literal
                const match = matchStringInNode(sourceFile, node, imports)

                if (match) {
                    foundImports.add(match)
                    return true;
                }
            }
        }

        node.forEachChild(handleImports)
    }

    ts.forEachChild(sourceFile, handleImports);

    // TODO: generate a report on dependencies, then encode it as base 64, and link to it on the website.
    // TODO 2: the website should be able to visualize the dependencies
    return {
        file,
        foundImports
    }
}

function matchStringInNode(sourceFile: ts.SourceFile, node: ts.Node, strs: string[]): string | undefined {
    if (ts.isStringLiteral(node)) {
        const text = node.getText(sourceFile).trim();
        const content = text.substring(1, text.length - 1);
        return strs.find(s => s === content)
    }
    let match;
    node.forEachChild((n) => {
        const _match = matchStringInNode(sourceFile, n, strs)
        if (_match) {
            match = _match
        }
    })
    return match
}

async function getExposedModules(packageId: string) {
    let exposedModules: Array<{ path: string, package: string, moduleName: string, fileName: string }> = []
    const { data } = await axios.get('https://federation-manager.dsolver.ca/api/projects/' + packageId)

    const { packages } = data as { packages: string[] }

    for (let i = 0; i < packages.length; i++) {
        const resp = await axios.get('https://federation-manager.dsolver.ca/api/packages/' + packages[i])
        const { name, modules } = resp.data as { name: string, modules: Array<{ name: string, path: string }> }

        modules.forEach((m) => {
            let moduleName = m.name.trim();
            if (moduleName.startsWith('./')) {
                moduleName = moduleName.replace('./', '')
            }

            exposedModules.push({
                package: name,
                moduleName: `${name}/${moduleName}`,
                path: m.path,
                fileName: path.parse(m.path).base
            })
        })
    }

    return exposedModules;
}

async function extractDirectory(dir: string, packageId: string) {

    // identify the list of import modules from the remote config

    const imports = await getExposedModules(packageId)
    console.log("imports: ", imports)

    // given paths of known packages, assume the package name is the root, find if these files exist

    const exportFiles: string[] = []
    imports.forEach((im) => {
        console.log("looking for files for " + im.moduleName)
        glob(dir + '/**/' + im.package + '/' + im.path, { ignore: dir + '/**/node_modules/**' }).then((files) => {
            // console.log("Found files: ", files)
            exportFiles.push(...files)
            im.fileName = files[0]
        })
    })

    // find all ts, tsx files, and look for import references to known imports
    glob(dir + '/' + '**/*.{ts,tsx}', { ignore: dir + '/**/' + 'node_modules/**' }).then((files) => {

        // Create a Program to represent the project, then pull out the
        // source file to parse its AST.
        let program = ts.createProgram(files, { allowJs: true });

        const refRemotes: { [key: string]: string[] } = {}

        const remoteRefs: { [key: string]: string[] } = {}
        files.forEach((file) => {
            // find the imports using the extract function
            const fileResults = extract(program, file, imports.map(i => i.moduleName))

            if (!isUndefined(fileResults) && fileResults.foundImports.size > 0) {
                // results[file] = fileResults.foundImports

                fileResults.foundImports.forEach((moduleName) => {
                    if (!refRemotes[moduleName]) {
                        refRemotes[moduleName] = []
                    }
                    const filepath = path.normalize(file)
                    refRemotes[moduleName].push(filepath)
                    if (exportFiles.includes(filepath)) {

                        const exportModule = imports.find(im => im.fileName === filepath)
                        if (exportModule) {
                            if (!remoteRefs[exportModule.moduleName]) {
                                remoteRefs[exportModule.moduleName] = []
                            }
                            remoteRefs[exportModule.moduleName].push(moduleName)
                        }
                    }
                })
            }
        })


        const refReport: { [key: string]: { references: string[], remoteImports: string[] } } = {}

        Object.keys(refRemotes).forEach((moduleName) => {
            refReport[moduleName] = {
                references: refRemotes[moduleName],
                remoteImports: []
            }
        })

        Object.keys(remoteRefs).forEach((moduleName) => {
            if (!refReport[moduleName]) {
                refReport[moduleName] = { references: [], remoteImports: [] }
            }

            refReport[moduleName].remoteImports = remoteRefs[moduleName]
        })

        console.log(refReport)

    })
}


extractDirectory(process.argv[2], process.argv[3])