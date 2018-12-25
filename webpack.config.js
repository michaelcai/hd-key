const webpack = require('webpack')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const path = require('path')
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
//   .BundleAnalyzerPlugin

const baseConfig = {
  bail: true,
  mode: 'production',
  performance: {
    maxAssetSize: 550000,
    maxEntrypointSize: 550000
  },
  entry: {
    index: path.resolve(__dirname, './src/index.ts')
  },
  stats: "errors-only",
  cache: true,
  resolve: {
    extensions: ['.ts', '.js'],
    plugins: []
  },
  externals: ["bindings"],
  plugins: [
    new webpack.ContextReplacementPlugin(/bindings$/, /^$/),
    new UglifyJsPlugin({
      uglifyOptions: {
        parse: {
          // we want uglify-js to parse ecma 8 code. However we want it to output
          // ecma 5 compliant code, to avoid issues with older browsers, this is
          // whey we put `ecma: 5` to the compress and output section
          // https://github.com/facebook/create-react-app/pull/4234
          ecma: 8
        },
        compress: {
          ecma: 5,
          warnings: false,
          // Disabled because of an issue with Uglify breaking seemingly valid code:
          // https://github.com/facebook/create-react-app/issues/2376
          // Pending further investigation:
          // https://github.com/mishoo/UglifyJS2/issues/2011
          comparisons: false
        },
        mangle: {
          safari10: true
        },
        output: {
          ecma: 5,
          comments: false,
          // Turned on because emoji and regex is not minified properly using default
          // https://github.com/facebook/create-react-app/issues/2488
          ascii_only: true
        }
      },
      parallel: true,
      cache: true,
      sourceMap: true
    })
    // new BundleAnalyzerPlugin({
    //   analyzerMode: 'disabled'
    // })
  ],
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'awesome-typescript-loader',
        exclude: /node_modules/,
        query: {
          declaration: true,
          configFileName: path.resolve(__dirname, 'tsconfig.build.json'),
          useCache: true
        }
      }
    ]
  }
}

const webConfig = {
  ...baseConfig,
  target: 'web',
  output: {
    path: path.resolve(__dirname, 'build/web'),
    filename: 'chainstack.js',
    libraryTarget: 'umd',
    library: {
      root: 'Chainstack',
      amd: 'Chainstack',
      commonjs: 'Chainstack'
    },
    umdNamedDefine: true
  }
}

const nodeConfig = {
  ...baseConfig,
  target: 'node',
  output: {
    path: path.resolve(__dirname, 'build/main'),
    filename: '[name].js',
    libraryTarget: 'commonjs2'
  }
}

module.exports = [webConfig, nodeConfig]
