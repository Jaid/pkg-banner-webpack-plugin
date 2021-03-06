/** @module pkg-banner-webpack-plugin */

import fsp from "@absolunet/fsp"
import path from "path"
import webpack from "webpack"
import {ConcatSource} from "webpack-sources"

import template from "./template.hbs"

const debug = require("debug")(process.env.REPLACE_PKG_NAME)

/**
 * @typedef {Object} Options
 * @prop {Object} pkg If given, package.json will not be read and this value will be used instead
 * @prop {string} [defaultLicense="MIT"]
 */

/**
 * @class
 */
export default class PkgBannerPlugin {

  /**
   * @constructor
   * @param {Options} [options] Plugin options
   */
  constructor(options) {
    this.options = {
      defaultLicense: "MIT",
      ...options,
    }
  }

  /**
   * @param {import("webpack").Compiler} compiler
   */
  apply(compiler) {
    // This code is based on the very similar official BannerPlugin
    // See https://github.com/webpack/webpack/blob/master/lib/BannerPlugin.js
    const processAssetsTapIdentifier = {
      name: process.env.REPLACE_PKG_NAME,
      stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
    }
    compiler.hooks.compilation.tap(process.env.REPLACE_PKG_NAME, compilation => {
      compilation.hooks.processAssets.tapPromise(processAssetsTapIdentifier, async () => {
        let pkg = this.options.pkg
        if (!pkg) {
          const file = path.join(compiler.context, "package.json")
          debug(`Reading ${file}`)
          const fileExists = await fsp.pathExists(file)
          if (!fileExists) {
            return
          }
          pkg = await fsp.readJson(file)
        }
        const context = {
          pkg,
          options: this.options,
          title: pkg.title || pkg.domain || pkg.name || path.basename(compiler.context),
          license: pkg.license || this.options.defaultLicense,
          year: (new Date).getFullYear(),
        }
        debug(`Title: ${context.title}`)
        debug(`License: ${context.license}`)
        debug(`Year: ${context.year}`)
        const banner = template(context)
        for (const chunk of compilation.chunks) {
          for (const chunkFile of chunk.files) {
            debug(`Applying to: ${chunkFile}`)
            compilation.updateAsset(chunkFile, source => new ConcatSource(banner, "\n", source))
          }
        }
      })
    })
  }

}