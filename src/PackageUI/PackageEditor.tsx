import { Alert, ListItemText, Menu, MenuItem, Paper, Stack } from '@mui/material';
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
import { getPackage } from '../services/package.service';
import { ExposedModule } from '../models/ExposedModule';
import { DependenciesList } from '../dependencies/DependenciesList';
import { Dependency } from '../models/Dependency';


const defaultPackage = (): Package => ({
    id: uuidv4(),
    name: '',
    version: '0.0.1',
    modules: [],
    remotes: [],
    shared: [],
    stages: {}
})

function acceptableProtocol(url: string) {
    return url.toLowerCase().startsWith('http://') || url.toLowerCase().startsWith('https://') || url.toLowerCase().startsWith('file://')
}

function initStageUrls(pkg: Package) {
    const stageUrls: { [key: string]: string } = {}
    if (pkg.stages) {
        Object.keys(pkg.stages).forEach(stage => {
            const val = pkg.stages[stage]
            if (val && !acceptableProtocol(val)) {
                stageUrls[stage] = `//${val}`
            } else {
                stageUrls[stage] = val;
            }
        })
    }

    pkg.stages = stageUrls
    return pkg
}

export const PackageEditor = (props: { onCreate: (pkg: Package) => void, onCancel: () => void, package?: Package, project: Project }) => {


    const createMode = isUndefined(props.package)

    const [pkg, setPackage] = useState<Package>(cloneDeep(initStageUrls(props.package ?? defaultPackage())))

    const [pkgNames, setPkgNames] = useState<{ [pkgId: string]: string }>({})

    const [newModule, setNewModule] = useState<ExposedModule | undefined>()

    const [remoteAnchorEl, setRemoteAnchorEl] = React.useState<null | HTMLElement>(null);

    const [devPort, setDevPort] = useState<number | undefined>(pkg.devPort)

    const [stageUrls, setStageUrls] = useState<{ [stage: string]: string }>(pkg.stages)

    const [invalidStageUrls, setInvalidStageUrls] = useState<{ [stage: string]: boolean }>({})
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

    let localPortWarning = false;
    if (pkg.stages.local && pkg.devPort) {
        const localUrl = new URL(pkg.stages.local)
        const localPort = localUrl.port
        if (localPort !== pkg.devPort.toString()) {
            localPortWarning = true;
        }
    }
    return (
        <Stack spacing={2} data-component="PackageCreator" sx={{ marginBottom: 4 }}>
            {createMode && <h2>Create a Package</h2>}
            {!createMode && <h2>Edit Package</h2>}

            <Paper sx={{ padding: 2 }}>
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

                    <TextField label="Local Development Port" value={devPort}
                        onChange={(evt) => {
                            const port = parseInt(evt.target.value)
                            if (!isNaN(port)) {
                                setDevPort(port)
                            }
                        }}
                        onBlur={(evt) => {
                            const port = parseInt(evt.target.value)
                            if (!isNaN(port)) {
                                setPackage((_pkg) => {
                                    return {
                                        ..._pkg,
                                        devPort: port
                                    }
                                })
                            }
                        }} />
                    {localPortWarning && <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => {
                        const localUrl = new URL(pkg.stages.local)
                        const localPort = localUrl.port;
                        const port = parseInt(localPort)
                        console.log(localUrl, localPort, port)
                        if (!isNaN(port)) {
                            setDevPort(port)

                            setPackage((_pkg) => {
                                return {
                                    ..._pkg,
                                    devPort: port
                                }
                            })
                        }
                    }}>Fix Dev Port to match URL</Button>}>The development port and local stage does not match</Alert>}
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
                                                value={stageUrls[stage] ?? ''}
                                                error={invalidStageUrls[stage]}
                                                helperText={invalidStageUrls[stage] && 'Invalid URL. URL must start with http://, https:// or file://'}
                                                onChange={(evt) => {
                                                    let val = evt.target.value;
                                                    setStageUrls((_urls) => {
                                                        return {
                                                            ..._urls,
                                                            [stage]: val
                                                        }
                                                    })


                                                }}
                                                onBlur={(evt) => {

                                                    try {
                                                        const url = new URL(evt.target.value)
                                                        console.log(url)
                                                        if (url.protocol !== 'file:' && url.protocol !== 'http:' && url.protocol !== 'https:') {
                                                            throw new Error('invalid protocol')
                                                        }
                                                        setPackage((_pkg) => {
                                                            return {
                                                                ..._pkg,
                                                                stages: {
                                                                    ..._pkg.stages,
                                                                    [stage]: evt.target.value
                                                                }
                                                            }
                                                        })
                                                        setInvalidStageUrls((_invalid) => {
                                                            return {
                                                                ..._invalid,
                                                                [stage]: false
                                                            }
                                                        })
                                                    } catch (e) {
                                                        console.error('invalid url: ', evt.target.value)
                                                        setInvalidStageUrls((_invalid) => {
                                                            return {
                                                                ..._invalid,
                                                                [stage]: true
                                                            }
                                                        })
                                                    }


                                                }}
                                            />
                                        </div>
                                    )
                                })
                            }
                        </Stack>
                        {localPortWarning && <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => {
                            const localUrl = new URL(pkg.stages.local)

                            localUrl.port = pkg.devPort!.toString()

                            setStageUrls((_urls) => {
                                return {
                                    ..._urls,
                                    local: localUrl.toString()
                                }
                            })
                            setPackage((_pkg) => {
                                return {
                                    ..._pkg,
                                    stages: {
                                        ..._pkg.stages,
                                        local: localUrl.toString()
                                    }
                                }
                            })
                        }}>Fix Dev Port to match URL</Button>}>The development port and local stage does not match</Alert>}
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
                                            <Button onClick={() => {
                                                setPackage((_pkg) => {
                                                    return {
                                                        ..._pkg,
                                                        modules: _pkg.modules.filter(m => m.name !== _module.name)
                                                    }
                                                })
                                            }}>Remove</Button>
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
                                            id: '',
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
                                        id: '',
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
                                            modules: [..._pkg.modules, { ...newModule, id: uuidv4() }]
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