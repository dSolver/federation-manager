export type Dependency = {
    name: string;
    eager?: boolean; 
    singleton?: boolean;
    requiredVersion: string;
}