import { Button, List, ListItem, ListItemButton, ListItemText } from '@mui/material'
import IconButton from '@mui/material/IconButton/IconButton'
import React, { useEffect, useState } from 'react'
import { Link, redirect, useNavigate, useParams } from 'react-router-dom'
import { Package } from '../models/Package'
import { Project } from '../models/Project'
import { getPackage, updatePackage } from '../services/package.service'
import { getProject } from '../services/project.service'
import { PackageEditor } from './PackageEditor'
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Stack } from '@mui/system'
import { ExposedModule } from '../models/ExposedModule'
import { DependenciesList } from '../dependencies/DependenciesList'

export const PackagePage = () => {
    const { projectId, packageId } = useParams()

    const [pkg, setPackage] = useState<Package>()
    const [project, setProject] = useState<Project>()

    const [pkgNames, setPkgNames] = useState<{ [pkgId: string]: string }>({})

    useEffect(() => {
        if (packageId) {
            getPackage(packageId).then(setPackage)
        }
    }, [packageId])

    useEffect(() => {
        if (projectId) {
            getProject(projectId).then(setProject)
        }
    }, [projectId])


    useEffect(() => {
        project?.packages.forEach((pkgId) => {
            getPackage(pkgId).then((p) => {
                setPkgNames((_names) => {
                    return {
                        ..._names,
                        [pkgId]: p.name
                    }
                })
            })
        })
    }, [project?.packages])

    if (!project || !pkg) {
        return <div>Loading</div>
    }

    return (
        <div data-component="PackagePage">
            <Stack spacing={4}>

                <Stack direction="row" spacing={2} justifyContent={'space-between'}>
                    <IconButton component={Link} to={'../..'} relative={'path'}>
                        <ArrowBackIcon />
                    </IconButton>
                    <h2>Package {pkg.name}</h2>
                    <Button variant="contained" component={Link} to={'edit'} relative={'path'}>Edit</Button>

                </Stack>
                <div>
                    {
                        project.stages.map((stage) => {
                            return <PackageStage key={stage} pkg={pkg} stage={stage} />
                        })
                    }
                </div>

                <div>
                    <h3>Remotes</h3>
                    {pkg.remotes.length === 0 && <div>No remotes listed</div>}
                    <List sx={{ maxWidth: 480 }}>
                        {
                            pkg.remotes.map((pkgId: string) => (
                                <ListItem key={pkgId} >
                                    <ListItemButton component={Link} to={'../' + pkgId} relative={'path'}>
                                        {
                                            pkgNames[pkgId]
                                        }
                                    </ListItemButton>
                                </ListItem>
                            ))
                        }
                    </List>
                </div>

                <div>

                    <h3>Modules</h3>
                    {
                        pkg.modules.length === 0 && <div>No modules listed.</div>
                    }
                    <List sx={{ maxWidth: 480 }}>
                        {
                            pkg.modules.map((_module: ExposedModule) => (
                                <ListItem key={_module.path}>
                                    "{_module.name}": "{_module.path}"
                                </ListItem>
                            ))
                        }
                    </List>

                </div>

                <div>
                    <h3>Shared Dependencies</h3>
                    <DependenciesList fixedDeps={[...project.shared, ...pkg.shared]} editableDeps={[]} />
                </div>
            </Stack>
        </div>
    )
}

const PackageStage = (props: { pkg: Package, stage: string }) => {
    return (
        <div>
            <b>{props.stage} URL:</b> {props.pkg.stages[props.stage]}
        </div>
    )
}