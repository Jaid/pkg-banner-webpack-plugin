const {CleanWebpackPlugin} = require("clean-webpack-plugin")
const path = require("path")

/**
 * @function
 * @param {Object} TestPlugin
 * @return {import("webpack").Configuration}
 */
module.exports = TestPlugin => {
  return {
    mode: "production",
    optimization: {
      minimize: false,
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