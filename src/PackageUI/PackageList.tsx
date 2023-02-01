import { TableContainer, Paper, Table, TableBody, TableRow, TableCell, TableHead, Button, Dialog, DialogContent, DialogTitle, Stack } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { Link, redirect } from 'react-router-dom'
import { Package } from '../models/Package'
import { Project } from '../models/Project'
import { ProjectEditor } from '../ProjectUI/ProjectEditor'
import { createPackage, getPackages } from '../services/package.service'
import { createProject, getProjects } from '../services/project.service'
import { PackageEditor } from './PackageEditor'

export const PackageList = (props: {
    project: Project,
    updatePackages: (packageIds: string[]) => void
}) => {
    const [packages, setPackages] = useState<Package[]>([])
    useEffect(() => {
        if (props.project.packages.length === 0) {

            setPackages([])
        } else {

            getPackages(props.project.packages).then((_packages) => {
                setPackages(_packages)
            })
        }
    }, [props.project.packages])

    const [open, setOpen] = useState(false)
    const handleClose = () => {
        setOpen(false)
    }

    return (
        <Stack spacing={2} data-component="PackageList">
            <h2>Packages</h2>
            <div style={{ display: 'flex' }}>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Version</TableCell>
                                <TableCell>Number of Modules</TableCell>
                                <TableCell>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {
                                packages.map((pkg) => {
                                    return <TableRow key={pkg.id}>
                                        <TableCell>
                                            <Link to={'packages/' + pkg.id}>{pkg.name}</Link>
                                        </TableCell>
                                        <TableCell>
                                            {pkg.version}
                                        </TableCell>
                                        <TableCell>
                                            {pkg.modules.length}
                                        </TableCell>
                                        <TableCell>
                                            <Button component={Link} to={'packages/' + pkg.id + '/edit'} variant="text" >Edit</Button>
                                        </TableCell>
                                    </TableRow>
                                })
                            }
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
            <div>
                <Button variant="contained" onClick={() => { setOpen(true) }}>Add package</Button>
            </div>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle></DialogTitle>
                <DialogContent>
                    <PackageEditor
                        project={props.project}
                        onCreate={(newPackage: Package) => {
                            handleClose()

                            createPackage(newPackage)
                                .then(() => {
                                    props.updatePackages([...packages.map(p => p.id), newPackage.id])
                                })
                        }}
                        onCancel={() => {
                            handleClose()
                        }}
                    />
                </DialogContent>
            </Dialog>
        </Stack>
    )
}