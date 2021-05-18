const TerserPlugin = require("terser-webpack-plugin")

const {CleanWebpackPlugin} = require("clean-webpack-plugin")
const path = require("path")

/**
 * @function
 * @param {Object} TestPlugin
 * @return {import("webpack").Configuration}
 */
module.exports = TestPlugin => {
  const terserPlugin = new TerserPlugin({
    extractComments: false,
    terserOptions: {
      compress: {
        passes: 10,
        unsafe_comps: true,
        unsafe_math: true,
        unsafe_regexp: true,
        unsafe_undefined: true,
      },
      output: {
        ecma: 2020,
        comments: (_astTop, astToken) => {
          return astToken.line === 1
        },
      },
      toplevel: true,
      module: true,
    },
  })
  return {
    mode: "production",
    optimization: {
      minimize: true,
      minimizer: [terserPlugin],
    },
    context: path.join(__dirname, "..", "example"),
    entry: path.join(__dirname, "..", "example", "src"),
    output: {
      path: path.join(__dirname, "..", "example", "dist"),
      filename: "index.js",
    },
    plugins: [
      new CleanWebpackPlugin,
      new TestPlugin,
    ],
  }
}