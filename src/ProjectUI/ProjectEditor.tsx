import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import TextField from '@mui/material/TextField';
import { cloneDeep, isUndefined } from 'lodash';
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { DependenciesList } from '../dependencies/DependenciesList';
import { Dependency } from '../models/Dependency';

import { Project } from '../models/Project';

export const ProjectEditor = (props: { onCreate: (proj: Project) => void, project?: Project }) => {

    const defaultProject: Project = {
        id: uuidv4(),
        name: '',
        stages: ['beta', 'gamma', 'prod'],
        shared: [],
        packages: []
    }

    const createMode = isUndefined(props.project)

    const [project, setProject] = useState<Project>(cloneDeep(props.project) ?? defaultProject)
    return (
        <div data-component="ProjectCreator">
            {createMode && <h2>Create a Project</h2>}
            {!createMode && <h2>Edit Project</h2>}
            <TextField label="Name"
                defaultValue={project.name}
                onBlur={(evt) => {
                    setProject((_proj) => {
                        return {
                            ..._proj,
                            name: evt.target.value
                        }
                    })
                }} />


            <h3>Stages</h3>
            <List>
                {
                    project.stages.map((stage: string) => {
                        return (
                            <ListItem key={stage}>
                                <TextField label="Stage"
                                    defaultValue={stage}
                                    onBlur={(evt) => {
                                        const val = evt.target.value
                                        if (val.length === 0 || project.stages.some(s => s === val)) {
                                            return
                                        }

                                        setProject((_proj) => {
                                            return {
                                                ..._proj,
                                                stages: _proj.stages.map(_s => _s === stage ? evt.target.value : _s)
                                            }
                                        })
                                    }}
                                />
                            </ListItem>
                        )
                    })
                }
            </List>


            <h3>Shared Dependencies</h3>
            <DependenciesList fixedDeps={[]} editableDeps={project.shared} update={(deps: Dependency[]) => {
                setProject((_proj) => {
                    return {
                        ..._proj,
                        shared: deps
                    }
                })
            }} />

            <Button variant="contained" onClick={() => {
                props.onCreate(project)
            }}>{createMode ? 'Create' : 'Update'}</Button>

        </div>
    )
}