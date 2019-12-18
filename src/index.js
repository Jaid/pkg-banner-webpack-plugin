/** @module pkg-banner-webpack-plugin */

import fsp from "@absolunet/fsp"
import ensureArray from "ensure-array"
import ensureObject from "ensure-object"
import ow from "ow"
import resolveAny from "resolve-any"
import xmlWriter from "xmlbuilder"

import applications from "lib/applications.yml"

const webpackId = "PkgBannerWebpackPlugin"

/**
 * @typedef {Object} Options
 * @prop {string} fileName=CSXS/manifest.xml
 * @prop {string} identifier
 * @prop {string} version=1.0.0
 * @prop {string} title
 * @prop {string} requiredCefVersion=5.0
 * @prop {Object<"photoshop"|"illustrator"|"indesign"|"incopy"|"premierePro"|"prelude"|"afterEffects"|"animate"|"audition"|"dreamweaver"|"muse"|"bridge"|"rush",string|string[]>} apps={photoshop: "20"}
 * @prop {string} mainPath=./index.html
 * @prop {boolean|PanelOptions} panel=false
 * @prop {boolean} minify=true
 * @prop {boolean} debug=`webpackMode==="development"`
 * @prop {number} debugPort=8400
 * @prop {string} debugFileName=".debug"
 * @prop {string} [scriptSourceFile] Absolute path to a JavaScript file that will be used as the host script entry point
 * @prop {string} scriptFileName=client.jsx
 * @prop {string|string[]} cefParams=["--enable-nodejs","--mixed-context"]
 */

/**
 * @typedef {Object} PanelOptions
 * @prop {string} title=this.options.title
 * @prop {number} width=200
 * @prop {number} height=600
 */

const xmlCreateOptions = {encoding: "UTF-8"}

/**
 * @class
 */
export default class {

  /**
   * @constructor
   * @param {Options} [options] Plugin options
   */
  constructor(options) {
    const optionsObject = ensureObject(options, "identifier")
    /**
     * @type {Options}
     */
    this.options = {
      fileName: "CSXS/manifest.xml",
      version: "1.0.0",
      title: optionsObject.title || optionsObject.identifier,
      requiredCefVersion: "9.0",
      apps: {
        photoshop: "20",
      },
      mainPath: "./index.html",
      panel: true,
      minify: true,
      debug: null,
      debugPort: 8400,
      debugFileName: ".debug",
      scriptSourceFile: null,
      scriptFileName: "client.jsx",
      cefParams: ["--enable-nodejs", "--mixed-context"],
      ...optionsObject,
    }
    ow(this.options.identifier, ow.string.nonEmpty)
  }

  /**
   * @param {import("webpack").Compiler} compiler
   */
  apply(compiler) {
    compiler.hooks.emit.tapPromise(webpackId, async compilation => {
      const extensionManifestVersion = "8.0"
      const extensionId = `${this.options.identifier}.extension`
      const hosts = []
      for (const [appId, requiredVersion] of Object.entries(this.options.apps)) {
        const app = applications[appId]
        hosts.push({
          "@Name": app.host,
          "@Version": requiredVersion,
        })
      }
      const model = {
        ExtensionManifest: {
          "@xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
          "@Version": extensionManifestVersion,
          "@ExtensionBundleId": this.options.identifier,
          "@ExtensionBundleVersion": this.options.version,
          "@ExtensionBundleName": this.options.title,
          ExtensionList: {
            Extension: {
              "@Id": extensionId,
              "@Version": this.options.version,
            },
          },
          ExecutionEnvironment: {
            RequiredRuntimeList: {
              RequiredRuntime: {
                "@Name": "CSXS",
                "@Version": this.options.requiredCefVersion,
              },
            },
            HostList: {
              Host: hosts,
            },
            LocaleList: {
              Locale: {
                "@Code": "All",
              },
            },
          },
          DispatchInfoList: {
            Extension: {
              "@Id": extensionId,
              DispatchInfo: {
                Resources: {
                  MainPath: this.options.mainPath,
                },
                Lifecycle: {
                  AutoVisible: true,
                },
              },
            },
          },
        },
      }
      if (this.options.panel) {
        const panelOptions = {
          title: this.options.title,
          height: 600,
          width: 200,
        }
        model.ExtensionManifest.DispatchInfoList.Extension.DispatchInfo.UI = {
          Type: "Panel",
          Menu: panelOptions.title,
          Geometry: {
            Size: {
              Height: panelOptions.height,
              Width: panelOptions.width,
            },
          },
        }
      }
      if (this.options.cefParams) {
        const params = ensureArray(this.options.cefParams)
        model.ExtensionManifest.DispatchInfoList.Extension.DispatchInfo.Resources.CEFCommandLine = {
          Parameter: params,
        }
      }
      if (this.options.scriptSourceFile) {
        const scriptContent = await fsp.readFile(this.options.scriptSourceFile, "utf8")
        const scriptFileName = await resolveAny(this.options.scriptFileName)
        compilation.assets[scriptFileName] = {
          source: () => scriptContent,
          size: () => scriptContent.length,
        }
        model.ExtensionManifest.DispatchInfoList.Extension.DispatchInfo.Resources.ScriptPath = `./${scriptFileName}`
      }
      const content = xmlWriter.create(model, xmlCreateOptions).end({pretty: !this.options.minify})
      const fileName = await resolveAny(this.options.fileName)
      compilation.assets[fileName] = {
        source: () => content,
        size: () => content.length,
      }
      const isDevelopmentMode = compilation.compiler.options.mode === "development"
      const shouldEmitDebug = this.options.debug === null ? isDevelopmentMode : Boolean(this.options.debug)
      if (shouldEmitDebug) {
        let currentDebugPort = this.options.debugPort
        const debugModel = {
          ExtensionList: {
            Extension: {
              "@Id": extensionId,
              HostList: {
                Host: hosts.map(host => {
                  const debugPort = currentDebugPort
                  currentDebugPort++
                  return {
                    "@Name": host["@Name"],
                    "@Port": debugPort,
                  }
                }),
              },
            },
          },
        }
        const debugContent = xmlWriter.create(debugModel, xmlCreateOptions).end({pretty: !this.options.minify})
        compilation.assets[this.options.debugFileName] = {
          source: () => debugContent,
          size: () => debugContent.length,
        }
      }
    })
  }

}