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

async function getExposedModules(projectId: string) {
    let exposedModules: Array<{ path: string, package: string, moduleName: string, fileName: string }> = []
    const { data } = await axios.get('https://federation-manager.dsolver.ca/api/projects/' + projectId)

    const { packages } = data as { packages: string[] }

    const packageNames: string[] = []

    for (let i = 0; i < packages.length; i++) {
        const resp = await axios.get('https://federation-manager.dsolver.ca/api/packages/' + packages[i])
        const { name, modules } = resp.data as { name: string, modules: Array<{ name: string, path: string }> }

        packageNames.push(name)
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

    return {
        packages: packageNames,
        exposedModules
    }
}

async function extractDirectory(dir: string, packageId: string) {

    let folders: string[] = []
    await new Promise((resolve) => {

        fs.readdir(dir, {}, (err, files) => {
            const _files = files.map(f => f.toString())
            folders = _files.filter((f: string) => {
                return fs.lstatSync(path.join(dir, f)).isDirectory()
            })

            resolve(folders)
        });
    })
    console.log("folders: ", folders)

    // identify the list of import modules from the remote config

    const { exposedModules, packages } = await getExposedModules(packageId)
    // console.log("Exposed Modules: ", exposedModules)

    const packageDirectories = packages.map((p) => {
        const potentials = folders.filter(f => f.indexOf(p) >= 0)


        if (potentials.length === 0) {
            console.log("did not find a folder matching " + p)
            return undefined;
        }

        potentials.sort((a, b) => {
            return a.indexOf(p) - b.indexOf(p)
        })
        return {
            package: p,
            directory: path.join(dir, potentials[0])
        }
    })

    console.log('packageDirectories: ', packageDirectories)

    // given paths of known packages, assume the package name is the root, find if these files exist


    const exportFiles: string[] = []
    exposedModules.forEach((im) => {
        console.log("looking for files for " + im.moduleName)
        glob(dir + '/**/' + im.package + '/' + im.path, { ignore: dir + '/**/node_modules/**' }).then((files) => {
            // console.log("Found files: ", files)
            exportFiles.push(...files)
            im.fileName = files[0]
        })
    })

    function filePathToModuleName(filepath: string) {
        // check the exportFiles
        if (exportFiles.includes(filepath)) {

            const exportModule = exposedModules.find(im => im.fileName === filepath)
            if (exportModule) {
                return exportModule.moduleName
            }
        }

        const pkgDir = packageDirectories.find(dir => {
            if (dir) {
                return filepath.startsWith(dir.directory)
            }
            return false
        })

        if (pkgDir) {
            return filepath.replace(pkgDir.directory, pkgDir.package)
        }
        return filepath
    }



    // find all ts, tsx files, and look for import references to known imports
    glob(dir + '/' + '**/*.{ts,tsx}', { ignore: dir + '/**/' + 'node_modules/**' }).then((files) => {

        // Create a Program to represent the project, then pull out the
        // source file to parse its AST.
        let program = ts.createProgram(files, { allowJs: true });

        const refRemotes: { [key: string]: string[] } = {}

        const remoteRefs: { [key: string]: string[] } = {}
        files.forEach((file) => {
            // find the imports using the extract function
            const fileResults = extract(program, file, exposedModules.map(i => i.moduleName))

            if (!isUndefined(fileResults) && fileResults.foundImports.size > 0) {
                // results[file] = fileResults.foundImports

                fileResults.foundImports.forEach((moduleName) => {
                    if (!refRemotes[moduleName]) {
                        refRemotes[moduleName] = []
                    }
                    const filepath = path.normalize(file)
                    refRemotes[moduleName].push(filePathToModuleName(filepath))


                    if (exportFiles.includes(filepath)) {

                        const exportModuleName = filePathToModuleName(filepath)
                        if (!remoteRefs[exportModuleName]) {
                            remoteRefs[exportModuleName] = []
                        }
                        remoteRefs[exportModuleName].push(filePathToModuleName(moduleName))

                    }
                })
            }
        })


        const refReport: { [key: string]: { references: string[], remoteImports: string[] } } = {}


        Object.keys(refRemotes).forEach((moduleName) => {
            if (!refReport[moduleName]) {
                refReport[moduleName] = { references: [], remoteImports: [] }
            }

            refReport[moduleName] = {
                references: refRemotes[moduleName],
                remoteImports: []
            }

            refRemotes[moduleName].forEach((rm) => {
                if (!refReport[rm]) {
                    refReport[rm] = {
                        references: [], remoteImports: []
                    }
                }
                refReport[rm].remoteImports.push(moduleName)
            })
        })

        Object.keys(remoteRefs).forEach((moduleName) => {
            if (!refReport[moduleName]) {
                refReport[moduleName] = { references: [], remoteImports: [] }
            }

            refReport[moduleName].remoteImports = remoteRefs[moduleName]
        })

        const plantuml = generatePlantUML(refReport)

        console.log(refReport)
        console.log(plantuml)

    })
}

function generatePlantUML(report: { [key: string]: { references: string[], remoteImports: string[] } }) {

    let text = ""

    const modules = Object.keys(report).map(m => m.replaceAll('\\', '/'))

    const packages: { [key: string]: string[] } = {}
    modules.forEach((m) => {
        const pkg = m.split('/')[0]
        if (!packages[pkg]) {
            packages[pkg] = []
        }
        packages[pkg].push(`[${m}]`)
    })

    text += Object.keys(packages).map((pkgName) => {
        return `package "${pkgName}" {
            ${packages[pkgName].join('\n')}
        }\n`
    }).join('\n')


    text += '\n'
    Object.keys(report).forEach((moduleName) => {
        report[moduleName].references.forEach((ref) => {
            text += `[${moduleName.replaceAll('\\', '/')}]<--[${ref.replaceAll('\\', '/')}]\n`
        })
    })



    return `@startuml\n${text} \n @enduml`
}

extractDirectory(process.argv[2], process.argv[3])