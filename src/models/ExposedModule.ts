export type ExposedModule = {
    id: string;
    name: string; //e.g. ./AwesomeButton
    path: string; //e.g. ./src/components/AwesomeButton
    typePath?: string; // optional string, if omitted, the default is the same as path but ./types/ instead of ./src/
    remoteModuleDependencies?: string[]; // optional set of remote modules that this module is dependent on, used for warning about cyclical dependencies
}