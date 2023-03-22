const { defineConfig } = require('@vue/cli-service')
const path =require('path');

module.exports = defineConfig({
  transpileDependencies: true,
  //禁用eslint
  chainWebpack: config => {
    config.module.rules.delete('eslint');
  },
  configureWebpack: {
    devtool: 'source-map'
  },
  pluginOptions: {
    electronBuilder: {
      preload: {preload:'src/backend/preload.js',otherPreload:'src/test/backend/preload-test.js'},
      // Or, for multiple preload files:
      // preload: { preload: 'src/preload.js', otherPreload: 'src/preload2.js' }
      outputDir: "dist/electron",
      mainProcessFile:'src/backend/background.js',
      mainProcessWatch: ["src/backend"],
      builderOptions: {
        win: {
          target: ["portable"]
        },
        portable: {
          artifactName: "fbu_portable.exe"
        },
        productName:"fbu",
        files: ["**/*"],
        asar: true
      }
    },
  }

})
