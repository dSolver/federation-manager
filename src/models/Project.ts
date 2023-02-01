import { Dependency } from './Dependency';
export type Project = {
    id: string;
    name: string;

    stages: string[];
    shared: Dependency[];

    packages: string[];
}

export type ProjectCreatePayload = Omit<Project, 'id'>