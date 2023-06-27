import React, { useEffect, useState } from 'react'
import { Project } from '../models/Project'
import { createProject, getProjects } from '../services/project.service'
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { ProjectEditor } from './ProjectEditor';
import { Paper, TableBody, TableContainer } from '@mui/material';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Table from '@mui/material/Table';
import { Link } from 'react-router-dom';
export const ProjectList = () => {

    const [projects, setProjects] = useState<Project[]>([])
    useEffect(() => {
        getProjects().then((projects) => {
            setProjects(projects)
        })
    }, [])

    const [open, setOpen] = useState(false)
    const handleClose = () => {
        setOpen(false)
    }
    return (
        <div data-component="ProjectList">
            <h1>Projects</h1>
            <div style={{ display: 'flex' }}>
                <TableContainer component={Paper}>
                    <Table>
                        <TableBody>
                            {
                                projects.map((proj) => {
                                    return <TableRow key={proj.id}>
                                        <TableCell>
                                            <Link to={proj.id}>{proj.name}</Link>
                                        </TableCell>
                                        <TableCell>
                                            {proj.stages.join(', ')}
                                        </TableCell>
                                    </TableRow>
                                })
                            }
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
            <Button variant="text" onClick={() => { setOpen(true) }}>Create</Button>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle></DialogTitle>
                <DialogContent>
                    <ProjectEditor onCreate={(newProject: Project) => {
                        handleClose()
                        createProject(newProject)
                            .then(getProjects)
                            .then(setProjects)
                    }} />
                </DialogContent>
            </Dialog>
        </div >
    )
}