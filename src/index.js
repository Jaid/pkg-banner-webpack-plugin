/** @module pkg-banner-webpack-plugin */

import fsp from "@absolunet/fsp"
import Handlebars from "handlebars"
import path from "path"
import {ConcatSource} from "webpack-sources"

// TODO: handlebars-loader does not work anymore for some reason, so I temporarily installed handlebars as prod dependency
const template = Handlebars.compile(`/*!
{{#if pkg.version}}
*** {{{title}}} {{{pkg.version}}}
{{else}}
*** {{{title}}}
{{/if}}
{{#if pkg.author}}
*** Copyright © {{{year}}}, {{{pkg.author}}}
{{else}}
*** Copyright © {{{year}}}
{{/if}}
*** @license {{{license}}}
{{#if pkg.homepage}}
*** See {{{pkg.homepage}}}
{{/if}}
!*/`)

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
          title: pkg.title || pkg.domain || pkg.name || path.basename(compiler.context),
          license: pkg.license || "MIT",
          year: (new Date).getFullYear(),
        }
        debug(`Title: ${context.title}`)
        debug(`License: ${context.license}`)
        debug(`Year: ${context.year}`)
        const banner = template(context)
        for (const chunk of chunks) {
          for (const chunkFile of chunk.files) {
            debug(`Applying to: ${chunkFile}`)
            compilation.updateAsset(chunkFile, source => new ConcatSource(banner, "\n", source))
          }
        }
      })
    })
  }

}