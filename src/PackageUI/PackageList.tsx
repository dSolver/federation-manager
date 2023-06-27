import { TableContainer, Paper, Table, TableBody, TableRow, TableCell, TableHead, Button, Dialog, DialogContent, DialogTitle, Stack } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { Link, redirect } from 'react-router-dom'
import { Package } from '../models/Package'
import { Project } from '../models/Project'
import { ProjectEditor } from '../ProjectUI/ProjectEditor'
import { createPackage, getPackages, updatePackage } from '../services/package.service'
import { createProject, getProjects } from '../services/project.service'
import { PackageEditor } from './PackageEditor'

export const PackageList = (props: {
    project: Project,
    updatePackages: (packageIds: string[]) => void
}) => {
    const [packages, setPackages] = useState<Package[]>([])
    const [toDelete, setToDelete] = useState<Package | undefined>()

    const [openConfirm, setOpenConfirm] = useState(false)
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

    const confirmDelete = (pkg: Package) => {
        setToDelete(pkg)
        setOpenConfirm(true)
    }

    // close the dialog and delete the package if the user confirms
    const confirmClose = (del?: boolean) => {
        if (del && toDelete) {
            const pkgs = packages.filter(p => p.id !== toDelete.id)

            // for each package, if it has a dependency on the package to delete, remove the dependency
            const toUpdate = pkgs.filter(pkg => pkg.remotes.some(d => d === toDelete.id))

            Promise.all(toUpdate.map(pkg => updatePackage(pkg.id, pkg))).then(() => {

                setPackages(pkgs)
                props.updatePackages(pkgs.map(p => p.id))
            })

        }

        setToDelete(undefined)
        setOpenConfirm(false)
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
                                <TableCell>Dev Port</TableCell>
                                <TableCell># of Exposed Modules</TableCell>
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
                                            {pkg.devPort}
                                        </TableCell>
                                        <TableCell>
                                            {pkg.modules.length}
                                        </TableCell>
                                        <TableCell>
                                            <Button component={Link} to={'packages/' + pkg.id + '/edit'} variant="text" >Edit</Button>
                                            <Button onClick={() => { confirmDelete(pkg) }} variant="contained">Delete</Button>
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
                    {
                        open && (
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
                        )
                    }

                </DialogContent>
            </Dialog>
            <Dialog open={openConfirm} onClose={() => confirmClose()}>
                <DialogContent>
                    <Stack gap={1}>
                        <div>
                            Are you sure you want to delete {toDelete?.name}?
                        </div>
                        <Stack direction="row" gap={1}>
                            <Button color='error' onClick={() => confirmClose(true)}>Delete</Button>
                            <Button color='primary' onClick={() => confirmClose()}>Cancel</Button>
                        </Stack>
                    </Stack>

                </DialogContent>
            </Dialog>
        </Stack>
    )
}