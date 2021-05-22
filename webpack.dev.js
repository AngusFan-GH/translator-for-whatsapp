const { name, version } = require('./package.json');
const { resolve } = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require("webpack");
const dev = require('./_env/dev');

const fileName = name + '-dev-v' + version;

module.exports = merge(common, {
    mode: 'development',
    devtool: 'inline-source-map',
    output: {
        path: resolve(__dirname, 'build/' + fileName),
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': dev,
        }),
        new HtmlWebpackPlugin({
            template: './src/options/options.html',
            filename: 'options/options.html',
            chunks: ['options']
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: './src/manifest.json',
                    to: './'
                },
                {
                    from: './src/icons',
                    to: 'icons'
                },
                {
                    from: './src/content/inject/wapi.js',
                    to: 'content'
                }
            ]
        })
    ]
});