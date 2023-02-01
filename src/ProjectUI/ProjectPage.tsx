import { Button, IconButton, Paper } from '@mui/material'
import { Stack } from '@mui/system'
import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Project } from '../models/Project'
import { PackageList } from '../PackageUI/PackageList'
import { getProject, updateProject } from '../services/project.service'

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getPackage } from '../services/package.service'
import { FederationsOptionsGenerator } from '../services/FederationOptionsGenerator'
import Editor from '@monaco-editor/react'
import { DependenciesList } from '../dependencies/DependenciesList'
import { Dependency } from '../models/Dependency'

export const ProjectPage = () => {
    const { id } = useParams()

    const [project, setProject] = useState<Project>()
    const [config, setConfig] = useState<string[]>([])
    useEffect(() => {
        setProject(undefined)
        getProject(id as string).then(setProject)
    }, [id])

    if (!project) {
        return <div>loading project {id}</div>
    }

    const output = config.join('\n\n\n')
    return (
        <Stack spacing={2} data-component="ProjectPage">
            <Stack spacing={2} direction={"row"}>
                <IconButton component={Link} to={'..'} relative={'path'}>
                    <ArrowBackIcon />
                </IconButton>
                <h1>{project.name}</h1>
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
                                }, 100)
                            }} key={index} height="50vh" defaultLanguage='javascript' value={_config} />
                        </Paper>
                    ))
                }

            </Stack>

        </Stack>
    )
}