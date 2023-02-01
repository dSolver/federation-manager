import { Package } from "../models/Package";

export const DynamicRemotesGenerator = {
    generate: (pkg: Package, isProd = false) => {
        const name = pkg.name

        if (!isProd) {

            return `promise new Promise(resolve => {
            const urlParams = new URLSearchParams(window.location.search)
            const override = urlParams.get('${name}')
            // This part depends on how you plan on hosting and versioning your federated modules
            const remoteUrl = override || '\${remoteUrls[stage]['${name}']}'
            const script = document.createElement('script')
            script.src = remoteUrl
            script.onload = () => {
              // the injected script has loaded and is available on window
              // we can now resolve this Promise
              const proxy = {
                get: (request) => window['${name}'].get(request),
                init: (arg) => {
                  try {
                    return window['${name}'].init(arg)
                  } catch(e) {
                    console.log('remote container already initialized')
                  }
                }
              }
              resolve(proxy)
            }
            // inject this script with the src set to the versioned remoteEntry.js
            document.head.appendChild(script);
          })
          `

        } else {
            return `promise new Promise(resolve => {
                // This part depends on how you plan on hosting and versioning your federated modules
                const remoteUrl = '\${remoteUrls[stage]['${name}']}'
                const script = document.createElement('script')
                script.src = remoteUrl
                script.onload = () => {
                  // the injected script has loaded and is available on window
                  // we can now resolve this Promise
                  const proxy = {
                    get: (request) => window['${name}'].get(request),
                    init: (arg) => {
                      try {
                        return window.['${name}].init(arg)
                      } catch(e) {
                        console.log('remote container already initialized')
                      }
                    }
                  }
                  resolve(proxy)
                }
                // inject this script with the src set to the versioned remoteEntry.js
                document.head.appendChild(script);
              })
              `
    
        }
    }
}