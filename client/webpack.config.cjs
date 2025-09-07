// client/webpack.config.js
const path = require("path");
const webpack = require("webpack");
const dotenv = require("dotenv");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

dotenv.config(); // load .env from project root

const here = p => path.join(__dirname, p);
const ROOT_NODE_MODULES = path.resolve(__dirname, "../node_modules");

const entry = { main: [here("./src/index.js")] };

const modules = {
  rules: [
    {
      test: /\.js$/,
      test: /\.(js|jsx)$/,         // ⬅️ handle .jsx too
      exclude: /node_modules/,
      use: {
        loader: "babel-loader",
        options: { presets: ["@babel/preset-env", "@babel/preset-react"] }
      }
    },
    {
      test: /\.(sa|sc|c)ss$/,
      exclude: /node_modules/,
      use: [
        { loader: process.env.NODE_ENV !== "production" ? "style-loader" : MiniCssExtractPlugin.loader },
        { loader: "css-loader" },
        { loader: "sass-loader" }
      ]
    },
    // keep your existing image rule (not used for /public, only for imported images)
    {
      test: /\.(jpg|png)$/i,
      use: [
        {
          loader: "url-loader",
          options: {
            limit: 8192,
            name: "[name].[ext]",
            outputPath: "assets/",
            publicPath: "assets/"
          }
        }
      ]
    }
  ]
};

const plugins = [
  new MiniCssExtractPlugin({
    filename: "[name].css",
    chunkFilename: "[id].css"
  }),
  new HtmlWebpackPlugin({
    template: here("/public/index.html"),
    favicon: here("/public/favicon.ico")
  }),
  new webpack.DefinePlugin({
    "process.env.GOOGLE_CLIENT_ID": JSON.stringify(process.env.GOOGLE_CLIENT_ID || ""),
    "process.env.CDN_DOMAIN": JSON.stringify(process.env.CDN_DOMAIN || ""),
  }),
];

// ⬇️ define ONE devServer object and use it in the export
const devServer = {
  static: { directory: here("/public") },  // serve client/public at /
  port: 8080,                              // match the port you open in the browser
  hot: true,
  historyApiFallback: true,
  proxy: { "/api": "http://localhost:3001" }
};

module.exports = (_env, argv) => {
  const mode = argv?.mode || process.env.NODE_ENV || "development";
  const devMode = mode !== "production";

  // update MiniCssExtractPlugin filenames for prod if you want hashing
  if (!devMode) {
    plugins[0] = new MiniCssExtractPlugin({
      filename: "[name].[contenthash].css",
      chunkFilename: "[id].[contenthash].css"
    });
  }

  return {
    mode,
    entry,
    output: {
      path: here("/public/dist"),
      filename: "[name].bundle.js",
      publicPath: "/"                 // important for absolute asset URLs
    },
    module: modules,
    plugins,
    devtool: "inline-cheap-module-source-map",
    devServer,
    resolveLoader: {
      modules: ["node_modules", ROOT_NODE_MODULES]
    },
    resolve: {
      modules: ["node_modules", ROOT_NODE_MODULES],
      extensions: [".js", ".jsx"],
      fullySpecified: false
    }
  };
};
