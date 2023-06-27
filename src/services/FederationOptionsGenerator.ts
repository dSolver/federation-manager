import { Project } from '../models/Project';
import { Package } from './../models/Package';
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
            if (_pkg.stages[stage] === undefined) {
                throw new Error(`Package ${_pkg.name} does not have a stage ${stage}`)
            }

            stages[stage][_pkg.name] = [_pkg.stages[stage], 'remoteEntry.js'].join('/')
        })

        promises[_pkg.name] = `dynamicRemote('${_pkg.name}', stage !== 'prod')`
    }

    const exposes: { [key: string]: string } = {}

    pkg.modules.forEach((m) => {
        exposes[m.name] = m.path
    })


    JSON.stringify(stages, null, 2)

    let remotes = promises;

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

    const fs = require("fs")
    const path = require("path")
    const stage = process.env.BUILD_STAGE ?? "beta"

    const remoteUrls = ${JSON.stringify(stages, null, 2)}

    federationConfig = {
        name: "${pkg.name}",
        filename: "remoteEntry.js",
        remotes: {
            ${Object.keys(remotes).map((k) => {
                return `"${k}": ${remotes[k]}`
            }).join(',\n')}
        },
        exposes: ${JSON.stringify(exposes, null, 2)},
        shared: ${shared}
    }

    if(process.env.DEV_DOMAIN !== undefined) {
        federationConfig.remotes = Object.keys(federationConfig.remotes).reduce((s, k)=> {
            return {
                ...s,
                [k]: federationConfig.remotes[k].replace("localhost", process.env.DEV_DOMAIN)
            }
        }, {})
    }

    let rootDir = __dirname;
    // find the root dir by iteratively going up until we find a package.json
    while (!fs.existsSync(path.resolve(rootDir, "package.json")) && rootDir !== process.cwd() && rootDir !== "/") {
        rootDir = path.resolve(rootDir, "..");
    }

    Object.keys(federationConfig.exposes).forEach((k) => {
        const exposePath = path.resolve(rootDir, federationConfig.exposes[k]);
        if (!fs.existsSync(exposePath)) {
            console.warn("expose path does not exist: " + exposePath + " omitting from config")
            delete federationConfig.exposes[k];
        }
    })
    
    exports.federationConfig = federationConfig;

    function dynamicRemote(name, useUrlParams) {
        const remoteUrl = useUrlParams ? \`const urlParams = new URLSearchParams(window.location.search)
        const override = urlParams.get("\${name}")
        // This part depends on how you plan on hosting and versioning your federated modules
        const remoteUrl = override || '\${remoteUrls[stage][name]}'\` : \`const remoteUrl = '\${remoteUrls[stage][name]}'\`
      
        return \`promise new Promise((resolve, reject) => {
          \${remoteUrl}
          const script = document.createElement('script')
          script.src = remoteUrl
          script.onload = () => {
            // the injected script has loaded and is available on window
            // we can now resolve this Promise
            if(!window['\${name}']) {
              reject('remote container not found')
            }
            const proxy = {
              get: (request) => window['\${name}'].get(request),
              init: (arg) => {
                try {
                  return window['\${name}'].init(arg)
                } catch(e) {
                  console.log('remote container already initialized')
                }
              }
            }
            resolve(proxy)
          }
          script.onerror = (e) => {
              // the injected script errored during loading
              console.error("error loading remote entry "+ name)
              reject(e)
          }
          // inject this script with the src set to the remote remoteEntry.js
          document.head.appendChild(script);
        })
        \`
    }
    `

    return ret;
}
