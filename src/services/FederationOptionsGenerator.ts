import { Project } from '../models/Project';
import { Package } from './../models/Package';
import { DynamicRemotesGenerator } from './DynamicRemotesGenerator';
import { getPackage } from './package.service';

export const FederationsOptionsGenerator = async (proj: Project, pkg: Package) => {

    const stages: { [stage: string]: { [pkgId: string]: string } } = {}

    const promises: { [pkgId: string]: string } = {}
    proj.stages.forEach((stage) => {
        stages[stage] = {}
    })
    for (let remote of pkg.remotes) {
        const _pkg = await getPackage(remote)
        proj.stages.forEach((stage) => {
            stages[stage][_pkg.name] = [_pkg.stages[stage], 'remoteEntry.js'].join('/')
        })

        promises[_pkg.name] = DynamicRemotesGenerator.generate(_pkg)
    }

    const exposes: { [key: string]: string } = {}

    pkg.modules.forEach((m) => {
        exposes[m.name] = m.path
    })


    JSON.stringify(stages, null, 2)

    let remotes = JSON.stringify(promises, null, 2)

    const matches = remotes.match(/(["])(?:(?=(\\?))\2.)*?\1/gm)
    matches?.forEach((m) => {
        console.log('match: ', m)
        if (m.includes('\\n')) {
            remotes = remotes.replace(m, m.replaceAll('"', '`'))
        }
    })

    remotes = remotes.replaceAll('\\n', '\n')

    const shared = JSON.stringify([...proj.shared, ...pkg.shared].reduce((s, dep) => {
        return {
            ...s,
            [dep.name]: {
                requiredVersion: dep.requiredVersion,
                singleton: dep.singleton,
                eager: dep.eager
            }
        }
    }, {} as {
        [key: string]: {
            requiredVersion: string;
            singleton?: boolean;
            eager?: boolean;
        }
    }), null, 2)

    const ret = `
    // ${pkg.name} federation.config.js

    const fs = require('fs')
    const path = require('path')
    const stage = process.env.BUILD_STAGE ?? "beta"

    const remoteUrls = ${JSON.stringify(stages, null, 2)}

    federationConfig = {
        name: "${pkg.name}",
        filename: 'remoteEntry.js',
        remotes: ${remotes},
        exposes: ${JSON.stringify(exposes, null, 2)},
        shared: ${shared}
    }
    
    if (stage === "prod") {
        // do not provide override capability
        federationConfig.remotes = Object.keys(remoteUrls.prod).reduce((s, k)=> {
            return {
                ...s,
                [k]: k+'@'+remoteUrls.prod[k]
            }
        }, {})
    }

    if(process.env.DEV_DOMAIN !== undefined) {
        federationConfig.remotes = Object.keys(federationConfig.remotes).reduce((s, k)=> {
            return {
                ...s,
                [k]: federationConfig.remotes[k].replace("localhost", process.env.DEV_DOMAIN)
            }
        }, {})
    }

    
    exports.federationConfig = federationConfig;
    `

    // console.log(ret);
    return ret;
}
