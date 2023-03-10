import { Button, IconButton, List, ListItem, Paper, TextField } from '@mui/material'
import { Stack } from '@mui/system'
import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Project } from '../models/Project'
import { PackageList } from '../PackageUI/PackageList'
import { getProject, isWatched, unwatch, updateProject, watch } from '../services/project.service'

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getPackage } from '../services/package.service'
import { FederationsOptionsGenerator } from '../services/FederationOptionsGenerator'
import Editor from '@monaco-editor/react'
import { DependenciesList } from '../dependencies/DependenciesList'
import { Dependency } from '../models/Dependency'

import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';

export const ProjectPage = () => {
    const { id } = useParams()

    const [project, setProject] = useState<Project>()
    const [config, setConfig] = useState<string[]>([])

    const [watching, setWatching] = useState<boolean>(false)
    useEffect(() => {
        if (id) {
            setProject(undefined)
            getProject(id as string).then(setProject)
            setWatching(isWatched(id as string))
        }
    }, [id])

    if (!project || !id) {
        return <div>loading project {id}</div>
    }

    return (
        <Stack spacing={2} data-component="ProjectPage">
            <Stack spacing={2} direction={"row"}>
                <IconButton component={Link} to={'..'} relative={'path'}>
                    <ArrowBackIcon />
                </IconButton>
                <h1>{project.name}</h1>
                {
                    watching ? (<IconButton onClick={() => {
                        unwatch(id)
                        setWatching(false)
                    }}>
                        <StarIcon />
                    </IconButton>) : (<IconButton onClick={() => {
                        watch(id)
                        setWatching(true)
                    }}>
                        <StarBorderIcon />
                    </IconButton>)
                }

            </Stack>
            <Stack>
                <h3>Stages</h3>
                <List>
                    {
                        project.stages.map((stage: string, index: number) => {
                            return (
                                <ListItem key={index}>
                                    <TextField label="Stage"
                                        defaultValue={stage}
                                        onBlur={(evt) => {
                                            const val = evt.target.value
                                            if (val.length === 0 || project.stages.some(s => s === val)) {
                                                return
                                            }

                                            setProject({
                                                ...project,
                                                stages: project.stages.map(_s => _s === stage ? evt.target.value : _s)
                                            })
                                        }}
                                    />
                                    <Button onClick={() => {
                                        setProject({
                                            ...project,
                                            stages: project.stages.filter((_s, i) => i !== index)
                                        })
                                    }}>Remove</Button>
                                </ListItem>
                            )
                        })
                    }
                </List>
                <Button onClick={() => {
                    setProject({
                        ...project,
                        stages: [...project.stages, 'new stage']
                    })
                }}>Add Stage</Button>
            </Stack>
            <PackageList
                project={project}
                updatePackages={(packageIds: string[]) => {
                    updateProject(project.id, {
                        ...project,
                        packages: packageIds
                    }).then(setProject)
                }} />


            <h2>Shared Dependencies</h2>
            <DependenciesList editableDeps={project.shared} fixedDeps={[]} update={(deps: Dependency[]) => {
                if (project) {
                    const next = {
                        ...project,
                        shared: deps
                    }
                    updateProject(project.id, next).then(setProject)
                }
            }} />

            <Button variant="contained" onClick={async () => {
                setConfig([])
                for (let i = 0; i < project.packages.length; i++) {
                    const pkg = await getPackage(project.packages[i])
                    const output = await FederationsOptionsGenerator(project, pkg)
                    setConfig((_config) => {
                        return [..._config, output]
                    })
                }
            }}>Generate</Button>

            <Stack spacing={4}>
                {
                    config.map((_config, index) => (
                        <Paper key={index}>

                            <Editor onMount={(editor) => {
                                setTimeout(() => {

                                    editor.trigger('', 'editor.action.formatDocument', 'editor.action.formatDocument')
                                }, 500)
                            }} key={index} height="50vh" defaultLanguage='javascript' value={_config} />
                        </Paper>
                    ))
                }

            </Stack>

        </Stack>
    )
}