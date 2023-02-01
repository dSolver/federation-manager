import { Box, Chip, ListItemText, Menu, MenuItem, OutlinedInput, Paper, Select, Stack } from '@mui/material';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import TextField from '@mui/material/TextField';
import { cloneDeep, isUndefined } from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import DeleteIcon from '@mui/icons-material/Delete';


import { Package } from '../models/Package';
import { Project } from '../models/Project';
import { PackageName } from './PackageName';
import { getPackage } from '../services/package.service';
import { ExposedModule } from '../models/ExposedModule';
import { DependenciesList } from '../dependencies/DependenciesList';
import { Dependency } from '../models/Dependency';

export const PackageEditor = (props: { onCreate: (pkg: Package) => void, onCancel: () => void, package?: Package, project: Project }) => {

    const defaultPackage: Package = {
        id: uuidv4(),
        name: '',
        version: '0.0.1',
        modules: [],
        remotes: [],
        shared: [],
        stages: {}
    }

    if (props.project.stages) {
        props.project.stages.forEach(s => defaultPackage.stages[s] = '')
    }

    const createMode = isUndefined(props.package)

    const [pkg, setPackage] = useState<Package>(cloneDeep(props.package) ?? defaultPackage)

    const [pkgNames, setPkgNames] = useState<{ [pkgId: string]: string }>({})

    const [newModule, setNewModule] = useState<ExposedModule | undefined>()

    const [remoteAnchorEl, setRemoteAnchorEl] = React.useState<null | HTMLElement>(null);

    const open = Boolean(remoteAnchorEl);

    const newModuleInputRefs = [useRef<HTMLInputElement>(), useRef<HTMLInputElement>()]
    const handleClickRemotes = (event: React.MouseEvent<HTMLButtonElement>) => {
        setRemoteAnchorEl(event.currentTarget);
    };
    const handleCloseRemotes = () => {
        setRemoteAnchorEl(null);
    };

    useEffect(() => {
        props.project.packages.forEach((pkgId) => {
            getPackage(pkgId).then((p) => {
                setPkgNames((_names) => {
                    return {
                        ..._names,
                        [pkgId]: p.name
                    }
                })
            })
        })
    }, [props.project.packages])

    const availableRemotes = props.project.packages.filter(r => r !== pkg.id && !pkg.remotes.includes(r))

    return (
        <Stack spacing={2} data-component="PackageCreator" sx={{marginBottom: 4}}>
            {createMode && <h2>Create a Package</h2>}
            {!createMode && <h2>Edit Package</h2>}

            <Paper sx={{padding: 2}}>
                <Stack spacing={2}>
                    <TextField label="Name"
                        defaultValue={pkg.name}
                        onBlur={(evt) => {
                            setPackage((_pkg) => {
                                return {
                                    ..._pkg,
                                    name: evt.target.value
                                }
                            })
                        }} />

                    <div>
                        <h3>URLs</h3>
                        <Stack spacing={2}>
                            {
                                props.project.stages.map((stage) => {
                                    return (
                                        <div
                                            key={stage}>
                                            <TextField
                                                label={stage}
                                                defaultValue={pkg.stages[stage]}
                                                onBlur={(evt) => {
                                                    setPackage((_pkg) => {
                                                        return {
                                                            ..._pkg,
                                                            stages: {
                                                                ..._pkg.stages,
                                                                [stage]: evt.target.value
                                                            }
                                                        }
                                                    })

                                                }}
                                            />
                                        </div>
                                    )
                                })
                            }
                        </Stack>
                    </div>
                    <div>
                        <h3>Remotes (dependencies of this package)</h3>
                        {
                            pkg.remotes.length === 0 && <div>No remotes configured for this package</div>
                        }
                        <List sx={{ maxWidth: 480 }}>
                            {
                                pkg.remotes.map((pkgId: string) => (
                                    <ListItem key={pkgId} secondaryAction={
                                        <IconButton edge="end" onClick={() => {
                                            setPackage((_pkg) => {
                                                return {
                                                    ..._pkg,
                                                    remotes: _pkg.remotes.filter(r => r !== pkgId)
                                                }
                                            })
                                        }}>
                                            <DeleteIcon />
                                        </IconButton>
                                    }>
                                        <ListItemText>
                                            {
                                                pkgNames[pkgId]
                                            }
                                        </ListItemText>
                                    </ListItem>
                                ))
                            }
                        </List>

                        {
                            availableRemotes.length === 0 && <div>No remotes to add</div>
                        }
                        {
                            availableRemotes.length >= 1 && (<>

                                <Button
                                    id="basic-button"
                                    aria-haspopup="true"
                                    onClick={handleClickRemotes}
                                >
                                    Add a remote
                                </Button>
                                <Menu
                                    id="basic-menu"
                                    anchorEl={remoteAnchorEl}
                                    open={open}
                                    onClose={handleCloseRemotes}
                                    MenuListProps={{
                                        'aria-labelledby': 'basic-button',
                                    }}
                                >
                                    {
                                        availableRemotes.map((remotePkgId: string) => {
                                            return (
                                                <MenuItem key={remotePkgId} onClick={() => {
                                                    setPackage((_pkg) => {
                                                        return {
                                                            ..._pkg,
                                                            remotes: [..._pkg.remotes, remotePkgId]
                                                        }
                                                    })
                                                    handleCloseRemotes()
                                                }}>{pkgNames[remotePkgId]}</MenuItem>
                                            )
                                        })
                                    }
                                </Menu>
                            </>)
                        }
                    </div>
                    <div>

                        <h3>Modules (exports of this package)</h3>
                        {
                            pkg.modules.length === 0 && <div>No exported modules</div>
                        }
                        <List>
                            {
                                pkg.modules.map((_module: ExposedModule) => (
                                    <ListItem key={_module.name}>
                                        <Stack spacing={2} direction="row">
                                            <TextField label="name" defaultValue={_module.name} onBlur={(evt) => {
                                                const newName = evt.target.value.trim();
                                                if (newName !== _module.name && !pkg.modules.some(m => m.name === newName)) {
                                                    setPackage((_pkg) => {
                                                        return {
                                                            ..._pkg,
                                                            modules: _pkg.modules.map((m) => {
                                                                if (m.name === _module.name) {
                                                                    return {
                                                                        ...m,
                                                                        name: newName
                                                                    }
                                                                }
                                                                return m
                                                            })
                                                        }
                                                    })
                                                }
                                            }} />

                                            <TextField label="path" defaultValue={_module.path} onBlur={(evt) => {
                                                const newPath = evt.target.value.trim();
                                                if (newPath !== _module.path) {
                                                    setPackage((_pkg) => {
                                                        return {
                                                            ..._pkg,
                                                            modules: _pkg.modules.map((m) => {
                                                                if (m.name === _module.name) {
                                                                    return {
                                                                        ...m,
                                                                        path: newPath
                                                                    }
                                                                }
                                                                return m
                                                            })
                                                        }
                                                    })
                                                }
                                            }} />
                                        </Stack>
                                    </ListItem>
                                ))
                            }
                        </List>
                        <h4>Add a module</h4>
                        <Stack spacing={2} direction="row">
                            <TextField label="name" inputRef={newModuleInputRefs[0]} onBlur={(evt) => {
                                const newName = evt.target.value.trim();
                                if (!pkg.modules.some(m => m.name === newName)) {
                                    setNewModule((_module) => {
                                        return {
                                            name: newName,
                                            path: _module?.path ?? '',
                                            typePath: _module?.typePath
                                        }
                                    })
                                }
                            }} />

                            <TextField label="path" inputRef={newModuleInputRefs[1]} onBlur={(evt) => {
                                const newPath = evt.target.value.trim();
                                setNewModule((_module) => {
                                    return {
                                        name: _module?.name ?? '',
                                        path: newPath,
                                        typePath: _module?.typePath
                                    }
                                })
                            }} />

                            <Button variant="contained" onClick={() => {
                                if (!isUndefined(newModule)) {
                                    setPackage((_pkg) => {
                                        return {
                                            ..._pkg,
                                            modules: [..._pkg.modules, newModule]
                                        }
                                    })

                                    setNewModule(undefined)
                                    if (newModuleInputRefs[0].current)
                                        newModuleInputRefs[0].current.value = ""
                                    if (newModuleInputRefs[1].current)
                                        newModuleInputRefs[1].current.value = ""
                                }
                            }}>Add</Button>
                        </Stack>


                    </div>

                    <div>
                        <h3>Shared Dependencies</h3>
                        <DependenciesList fixedDeps={props.project.shared} editableDeps={pkg.shared} update={(deps: Dependency[]) => {
                            setPackage((_pkg) => {
                                return {
                                    ..._pkg,
                                    shared: deps
                                }
                            })
                        }} />
                    </div>

                </Stack>
            </Paper>


            <Stack direction={'row'} spacing={2}>
                <Button variant="contained" onClick={() => {
                    props.onCreate(pkg)
                }}>{createMode ? 'Create' : 'Update'}</Button>
                <Button variant="outlined" onClick={() => {
                    props.onCancel()
                }}>Cancel</Button>
            </Stack>
        </Stack>
    )
}