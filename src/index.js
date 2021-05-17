/** @module pkg-banner-webpack-plugin */

import fsp from "@absolunet/fsp"
import path from "path"
import {ConcatSource} from "webpack-sources"

import template from "./template.hbs"

const debug = require("debug")(process.env.REPLACE_PKG_NAME)

/**
 * @typedef {Object} Options
 * @prop {Object} pkg If given, package.json will not be read and this value will be used instead
 */

const webpackId = "PkgBannerPlugin"

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
      ...options,
    }
  }

  /**
   * @param {import("webpack").Compiler} compiler
   */
  apply(compiler) {
    compiler.hooks.compilation.tap(webpackId, compilation => {
      compilation.hooks.optimizeChunkAssets.tapPromise(webpackId, async chunks => {
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
          title: pkg.title || pkg.domain || pkg.name,
          license: pkg.license || "MIT",
          year: (new Date).getFullYear(),
        }
        if (!context.title) {
          context.title = path.basename(compiler.context)
        }
        debug(`Title: ${context.title}`)
        const banner = template(context)
        for (const chunk of chunks) {
          for (const chunkFile of chunk.files) {
            compilation.assets[chunkFile] = new ConcatSource(banner, "\n", compilation.assets[chunkFile])
          }
        }
      })
    })
  }

}