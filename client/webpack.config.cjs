/*
 * Environment and Imports
*/
var env = process.env.NODE_ENV ? process.env.NODE_ENV.trim() : "development";
var devMode = env != "production";

const webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");

const here = p => path.join(__dirname, p);

const ROOT_NODE_MODULES = path.resolve(__dirname, "../node_modules");

/*
 * Entry
 */
const entry = {
    main: [here("./src/index.js")]
};

/*
 * Output
 */
const output = {
    path: here("/public/dist"),
    filename: "[name].bundle.js"
};

/*
 * Module
 */
const modules = {
    rules: [
        {
            test: /\.js$/,
            exclude: /node_modules/,
            use: {
                loader: "babel-loader",
                options: {
                    presets: ["@babel/preset-env", "@babel/preset-react"]
                }
            }
        },
        {
            test: /\.(sa|sc|c)ss$/,
            exclude: [/node_modules/],
            use: [
                {
                    loader: devMode ? 'style-loader' : MiniCssExtractPlugin.loader
                },
                {
                    loader: 'css-loader',
                },
                {
                    loader: 'sass-loader'
                }
            ]
        },
        {
            test: /\.(jpg|png)$/,
            use: [
                {
                    loader: 'url-loader',
                    options: {
                        limit: 8192, // Limit the base64 inline image size
                        name: '[name].[ext]',
                        outputPath: 'assets/', // Output path for the images
                        publicPath: 'assets/' // Public URL path for the images
                    }
                }
            ]
        }
    ]
};

/*
 * Plugins
 */
const plugins = [
    new MiniCssExtractPlugin({
        filename: devMode ? "[name].css" : "[name].[hash].css",
        chunkFilename: devMode ? "[id].css" : "[id].[hash].css"
    }),
    new HtmlWebpackPlugin({
        template: here("/public/index.html"),
        favicon: here("/public/favicon.ico"),
    }),
];

// Enabling HMR only if dev mode is enabled
if (devMode) {
    plugins.push(new webpack.HotModuleReplacementPlugin())
}

/*
 * Exporting configuration
 */
var configObject = {
    mode: env,
    entry,
    devServer: {
        port: 3000,                 // <-- add
        hot: true,                  // <-- add
        historyApiFallback: true,
        proxy: {
            "/api": "http://localhost:3001",  // <-- was 5000, change to 3001
            secure: false
        }
        },
    devtool: "inline-cheap-module-source-map",
    output,
    resolveLoader: {
        modules: ['node_modules', path.resolve(__dirname, '../node_modules')],
        },
    module: modules,
    plugins
};


module.exports = (env, argv) => {
  const configObject = {
    mode: env,
    entry,
    devServer: { /* your existing */ },
    devtool: "inline-cheap-module-source-map",
    output,

    // 👇 let webpack find loaders at the repo root too
    resolveLoader: {
      modules: ["node_modules", ROOT_NODE_MODULES],
    },

    // 👇 optional but helpful for imports, keeps your earlier fullySpecified tweak
    resolve: {
      modules: [ "node_modules", ROOT_NODE_MODULES ],
      extensions: [".js", ".jsx"],
      fullySpecified: false,
    },

    module: modules,
    plugins,
  };

  configObject.mode = argv.mode;
  return configObject;
};
