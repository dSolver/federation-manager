import { Button } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { Link, redirect, useNavigate, useParams } from 'react-router-dom'
import { Package } from '../models/Package'
import { Project } from '../models/Project'
import { getPackage, updatePackage } from '../services/package.service'
import { getProject } from '../services/project.service'
import { PackageEditor } from './PackageEditor'


export const PackageName = ({ packageId }: { packageId: string }) => {

    const [pkg, setPackage] = useState<Package>()
    useEffect(() => {
        if (packageId) {
            getPackage(packageId).then(setPackage)
        }
    }, [packageId])

    if (!pkg) {
        return <></>
    }

    return <>{pkg.name}</>
}