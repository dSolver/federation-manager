import { ExposedModule } from './ExposedModule';
import { Dependency } from './Dependency';

export type Package = {
    id: string;
    name: string;
    version: string;
    stages: { // hashmap of where this package will be available on each stage
        [stage: string]: string 
    };
    modules: ExposedModule[]; // what will be exposed
    remotes: string[]; // what will be imported, array of strings representing package ids
    shared: Dependency[];
    devPort?: number;
}
