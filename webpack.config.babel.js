import configure from "webpack-config-jaid"

export default configure({
  documentation: {babel: true},
  output: {
    libraryTarget: "module",
  },
})