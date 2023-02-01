import { Button } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { Link, redirect, useNavigate, useParams } from 'react-router-dom'
import { Package } from '../models/Package'
import { Project } from '../models/Project'
import { getPackage, updatePackage } from '../services/package.service'
import { getProject } from '../services/project.service'
import { PackageEditor } from './PackageEditor'


export const PackageEditorPage = (props: { edit?: boolean }) => {
    const { projectId, packageId } = useParams()

    const [pkg, setPackage] = useState<Package>()
    const [project, setProject] = useState<Project>()

    const navigate = useNavigate()
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

    if (!project || !pkg) {
        return <div>Loading</div>
    }

    return (
        <PackageEditor project={project} package={pkg}
            onCreate={function (pkg: Package): void {
                updatePackage(pkg.id, pkg).then(() => {
                    navigate('..', { relative: "path" })
                })
            }}

            onCancel={() => {
                navigate('..', { relative: "path" })
            }} />
    )

}