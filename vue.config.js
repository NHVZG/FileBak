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
      //添加babel.js对注解的支持
      chainWebpackMainProcess: config => {
        let rule=config.module
            .rule('babel')
            .test(/\.js$/)
            // .include.add(path.resolve(__dirname,'src/test')).add(path.resolve(__dirname,'src/background')).end()
            .exclude.add(/node_modules/).add(path.resolve(__dirname,'src/frontEnd')).end()
            .use('babel')
            .loader('babel-loader')
            .options({
              presets: [['@babel/preset-env', { modules: false }]],
              plugins: [
                ['@babel/plugin-proposal-decorators', { legacy: true }],
                ['@babel/plugin-proposal-class-properties', { loose: true }]
              ]
            });
      //自动扫描方式1-自定义loader
        /*config.module.rule('tes')
            .test(/\.js$/)
            .exclude.add(/node_modules/).add(path.resolve(__dirname,'src/frontEnd')).end()
            .use('tes')
            .loader(path.resolve(__dirname,'src/backend/v4/loader/loader.js'));*/
      },

      preload: {
        //preload:'src/backend/v1/preload.js',
        //preload:'src/backend/v2/preload.js',
        //preload:'src/backend/v3/preload.js',
        preload:'src/backend/v4/init/preload.js',
        otherPreload:'src/test/backend/preload-test.js'
      },
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
        files: ["**/*",{
          from:"../../src",
          to:"./src",
          filter:["**/*"]
        }],
        asar: true
      }
    },
  }

})
