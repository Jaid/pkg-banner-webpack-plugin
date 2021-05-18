import "jest-extended"

import fsp from "@absolunet/fsp"
import ms from "ms.macro"
import path from "path"
import pify from "pify"
import webpack from "webpack"

const indexModule = require(process.env.MAIN ? path.resolve(process.env.MAIN) : path.join(__dirname, "..", "src"))
const {default: PkgBannerPlugin} = indexModule

it("should run", async () => {
  const generateWebpackConfig = require(path.join(__dirname, "..", "example", "webpack.config.js"))
  const webpackConfig = generateWebpackConfig(PkgBannerPlugin)
  await pify(webpack)(webpackConfig)
  const outputFile = path.join(webpackConfig.output.path, webpackConfig.output.filename)
  const exists = await fsp.pathExists(outputFile)
  expect(exists).toBeTruthy()
  const output = await fsp.readFile(outputFile, "utf8")
  const expectedBanner = await fsp.readFile(path.join(__dirname, "expected.txt"), "utf8")
  expect(output).toStartWith(expectedBanner)
}, ms`1 minute`)