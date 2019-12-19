import fsp from "@absolunet/fsp"
import {CleanWebpackPlugin} from "clean-webpack-plugin"
import ms from "ms.macro"
import path from "path"
import pify from "pify"
import webpack from "webpack"

const indexModule = (process.env.MAIN ? path.resolve(process.env.MAIN) : path.join(__dirname, "..", "src")) |> require
const {default: PkgBannerPlugin} = indexModule

jest.setTimeout(ms`1 minute`)

const getWebpackConfig = name => ({
  mode: "production",
  context: path.join(__dirname, name),
  entry: path.join(__dirname, name),
  output: {
    path: path.join(__dirname, "..", "dist", "test", name),
    filename: "index.js",
  },
})

it("should run", async () => {
  const name = "basic"
  const webpackConfig = {
    ...getWebpackConfig(name),
    plugins: [
      new CleanWebpackPlugin,
      new PkgBannerPlugin,
    ],
  }
  await pify(webpack)(webpackConfig)
  const outputFile = path.join(webpackConfig.output.path, webpackConfig.output.filename)
  const exists = await fsp.pathExists(outputFile)
  expect(exists).toBeTruthy()
  const output = await fsp.readFile(outputFile, "utf8")
  const expectedBanner = await fsp.readFile(path.join(__dirname, "basic", "expected.txt"), "utf8")
  expect(output.startsWith(expectedBanner)).toBeTruthy()
})