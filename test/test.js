import fsp from "@absolunet/fsp"
import {CleanWebpackPlugin} from "clean-webpack-plugin"
import ms from "ms.macro"
import path from "path"
import pify from "pify"
import webpack from "webpack"

const indexModule = (process.env.MAIN ? path.resolve(process.env.MAIN) : path.join(__dirname, "..", "src")) |> require
const {default: PkgBannerWebpackPlugin} = indexModule

jest.setTimeout(ms`1 minute`)

const getWepbackConfig = name => ({
  mode: "production",
  context: path.join(__dirname, name),
  entry: path.join(__dirname, name),
  output: {
    path: path.join(__dirname, "..", "dist", "test", name),
  },
})

it("should run", async () => {
  const name = "basic"
  const webpackConfig = {
    ...getWepbackConfig(name),
    plugins: [
      new CleanWebpackPlugin,
      new PkgBannerWebpackPlugin({
        identifier: "cep-example",
        title: "CEP Example",
      }),
    ],
  }
  await pify(webpack)(webpackConfig)
  const xml = await fsp.readXml(path.join(__dirname, "..", "dist", "test", name, "CSXS", "manifest.xml"))
})