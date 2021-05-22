const OptimizeCssAssetsWebpackPlugin = require('optimize-css-assets-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const FileManagerPlugin = require('filemanager-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const UglifyJS = require("uglify-js");
const { merge } = require('webpack-merge');
const { resolve } = require('path');
const common = require('./webpack.common.js');
const { name, version } = require('./package.json');

module.exports = (env, options = {}) => {
    const fileName = `${name}-${env}-v${version}`;
    return merge(
        common,
        {
            mode: 'production',
            output: {
                path: resolve(__dirname, `build/${fileName}`),
            },
            plugins: [
                new OptimizeCssAssetsWebpackPlugin(),
                new HtmlWebpackPlugin({
                    template: './src/options/options.html',
                    filename: 'options/options.html',
                    chunks: ['options'],
                    minify: {
                        collapseWhitespace: true,
                        removeComments: true
                    }
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
                            from: './src/popup/dist',
                            to: 'popup'
                        },
                        {
                            from: './src/content/inject/wapi.js',
                            to: 'content',
                            transform(content) {
                                return UglifyJS.minify(content.toString()).code;
                            }
                        },
                    ]
                }),
                new FileManagerPlugin({
                    events: {
                        onEnd: {
                            archive: [
                                {
                                    source: './build/' + fileName,
                                    destination: './build/' + fileName + '.zip'
                                },
                            ]
                        }
                    }
                }),
            ]
        },
        options
    );
};