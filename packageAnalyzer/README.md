# package_analyzer

## How to use

`pnpm run analyze <directory> <project id>`

For a module-federation project using the federation-manager, this program generates a dependency graph focused on exposed modules.

It scans the .ts, .tsx files in the directory, and look for references to importing an exposed module as defined in the federation-manager config.

It also makes the assumption that the package names e.g. `shared`, `host` are match the name of the directories, and that they are in the same directory, e.g.

```
project/
  ├── host/
  ├── shared/
  └── mfe-1/

```

You will need an internet connection to get the project and package details. (TODO: offline version to reference a JSON instead of checking online).

## What's an import?

We check 3 types of import statements: 

`import x from 'remote/module'`
`import('remote/module')`
`()=> import('remote/module')`

We only care about what is imported, not what happens after the import statement, or if the import statement is reachable, or if the imported module is used.

## What's the output?
For each exposed module throughout the project, assuming that it was identified in the code, we generate a block of JSON:

```
"package/Module": {
    "references": [], // array of strings where this module was imported via module federation, this corresponds to fan-out metric
    "remoteImports": [], // array of strings that represent any remote modules *imported* by this exposed module, this corresponds to fan-in metric
}

```

## FAQs

* What if an exposed module indirectly imports a remote module by importing a local module which then imports the remote?
    * This case is not covered yet, since we do not analyze all modules in the system
* Can I use require?
    * No