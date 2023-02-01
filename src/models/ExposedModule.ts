export type ExposedModule = {
    name: string; //e.g. ./AwesomeButton
    path: string; //e.g. ./src/components/AwesomeButton
    typePath?: string; // optional string, if omitted, the default is the same as path but ./types/ instead of ./src/
}