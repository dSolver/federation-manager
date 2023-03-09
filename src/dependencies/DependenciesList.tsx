import { Button, Checkbox, FormControlLabel, FormGroup, List, ListItem, Paper, TextField } from '@mui/material';
import { Stack } from '@mui/system';
import { isUndefined, update } from 'lodash';
import React, { useRef, useState } from 'react';

import { Dependency } from '../models/Dependency';

export interface DependenciesListProps {
    fixedDeps: Dependency[]
    editableDeps: Dependency[]
    update?: (dependencies: Dependency[]) => void
}

export const DependenciesList = ({ fixedDeps, editableDeps, update }: DependenciesListProps) => {

    const [newDep, setNewDep] = useState<Dependency>({
        name: '',
        requiredVersion: '',
        eager: false,
        singleton: false
    })

    const editable = !isUndefined(update)

    const refs = [useRef<HTMLInputElement>(), useRef<HTMLInputElement>(), useRef<HTMLInputElement>(), useRef<HTMLInputElement>()]
    return (<Stack spacing={2}>

        {fixedDeps.length > 0 && (

            <Paper elevation={1}>
                <List>
                    {
                        fixedDeps.map((dep) => {
                            return <ListItem key={dep.name}>
                                <Stack direction="row" spacing={1}>
                                    <div>{dep.name}</div>
                                    <div>version: {dep.requiredVersion}</div>
                                    <div>eager: {dep.eager ? "true" : "false"}</div>
                                    <div>singleton: {dep.singleton ? "true" : "false"}</div>
                                </Stack>
                            </ListItem>
                        })
                    }
                </List>
            </Paper>
        )}
        <List>

            {
                !editable && editableDeps.map((dep, index) => {
                    return <ListItem key={index}>
                        <Stack direction="row" spacing={1}>
                            <div>{dep.name}</div>
                            <div>version: {dep.requiredVersion}</div>
                            <div>eager: {dep.eager ? "true" : "false"}</div>
                            <div>singleton: {dep.singleton ? "true" : "false"}</div>
                        </Stack>
                    </ListItem>
                })
            }
            {
                editable &&
                editableDeps.map((dep, index) => {
                    return <ListItem key={index}>
                        <Stack direction="row" spacing={1}>
                            <TextField label="Name" error={fixedDeps.some(d => d.name === dep.name)} defaultValue={dep.name} onBlur={(evt) => {
                                const newName = evt.target.value.trim()
                                // name did not change
                                if (newName === dep.name) {
                                    return false
                                }

                                // match another dependency
                                if ([...fixedDeps, ...editableDeps].some(d => d.name === newName)) {
                                    return false
                                }

                                update([
                                    ...editableDeps.map((d, i) => {
                                        if (i === index) {
                                            return {
                                                ...dep,
                                                name: newName
                                            }
                                        }
                                        return d
                                    })
                                ])
                            }} />
                            <TextField label="Version" defaultValue={dep.requiredVersion} onBlur={(evt) => {
                                let newVersion: string = evt.target.value.trim()
                                if (newVersion.length === 0) {
                                    return false
                                }

                                // name did not change
                                if (newVersion === dep.requiredVersion) {
                                    return false
                                }

                                update([
                                    ...editableDeps.map((d, i) => {
                                        if (i === index) {
                                            return {
                                                ...dep,
                                                requiredVersion: newVersion
                                            }
                                        }
                                        return d
                                    })
                                ])
                            }} />
                            <FormControlLabel control={<Checkbox checked={dep.eager} onChange={(evt) => {
                                const checked = evt.target.checked;
                                update([
                                    ...editableDeps.map((d, i) => {
                                        if (i === index) {
                                            return {
                                                ...dep,
                                                eager: checked
                                            }
                                        }
                                        return d
                                    })
                                ])
                            }} />} label="Eager" />

                            <FormControlLabel control={<Checkbox checked={dep.singleton} onChange={(evt) => {
                                const checked = evt.target.checked;
                                update([
                                    ...editableDeps.map((d, i) => {
                                        if (i === index) {
                                            return {
                                                ...dep,
                                                singleton: checked
                                            }
                                        }
                                        return d
                                    })
                                ])
                            }} />} label="Singleton" />
                            <Button onClick={() => {
                                update(editableDeps.filter(d => d.name !== dep.name))
                            }}>Remove</Button>
                        </Stack>
                    </ListItem>
                })
            }
            {
                editable && (
                    <FormGroup>
                        <h3>Add new dependency</h3>
                        <Stack spacing={1} direction="row">
                            <TextField label="Name" inputRef={refs[0]} onBlur={(evt) => {
                                const newName = evt.target.value.trim()
                                // name did not change
                                if (newName === newDep.name) {
                                    return false
                                }

                                // match another dependency
                                if ([...fixedDeps, ...editableDeps].some(d => d.name === newName)) {
                                    return false
                                }

                                setNewDep((dep) => {
                                    return {
                                        ...dep,
                                        name: newName
                                    }
                                })
                            }} />
                            <TextField label="Version" inputRef={refs[1]} onBlur={(evt) => {
                                let newVersion: string = evt.target.value.trim()
                                if (newVersion.length === 0) {
                                    return false
                                }

                                // name did not change
                                if (newVersion === newDep.requiredVersion) {
                                    return false
                                }

                                setNewDep((dep) => {
                                    return {
                                        ...dep,
                                        requiredVersion: newVersion
                                    }
                                })
                            }} />
                            <FormControlLabel control={<Checkbox checked={newDep.eager} onChange={(evt) => {
                                const checked = evt.target.checked;
                                setNewDep((dep) => {
                                    return {
                                        ...dep,
                                        eager: checked
                                    }
                                }) 
                            }} />} label="Eager" />

                            <FormControlLabel control={<Checkbox checked={newDep.singleton} onChange={(evt) => {
                                const checked = evt.target.checked;
                                setNewDep((dep) => {
                                    return {
                                        ...dep,
                                        singleton: checked
                                    }
                                })
                            }} />} label="Singleton" />

                            <Button variant="contained" onClick={() => {
                                if (newDep.name.length > 0 && newDep.requiredVersion.length > 0 && ![...fixedDeps, ...editableDeps].some(d => d.name === newDep.name)) {
                                    if (refs[0].current) refs[0].current.value = ""
                                    if (refs[1].current) refs[1].current.value = ""
                                    if (refs[2].current) refs[2].current.checked = false
                                    if (refs[3].current) refs[3].current.checked = false
                                    update([...editableDeps, newDep])

                                    setNewDep({
                                        name: '',
                                        requiredVersion: '',
                                        eager: false,
                                        singleton: false
                                    })
                                }
                            }}>Add</Button>
                        </Stack>
                    </FormGroup>
                )
            }

        </List>

    </Stack>)
}