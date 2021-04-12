const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsWebpackPlugin = require('optimize-css-assets-webpack-plugin');
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');
const FileManagerPlugin = require('filemanager-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { name, version } = require('./package.json');
const UglifyJS = require("uglify-js");
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

process.env.NODE_ENV = 'production';

const commonCssLoader = [
    MiniCssExtractPlugin.loader,
    'css-loader',
    {
        loader: 'postcss-loader',
        options: {
            ident: 'postcss',
            plugins: () => [require('postcss-preset-env')()]
        }
    }
];

module.exports = merge(common, {
    mode: 'production',
    module: {
        rules: [
            // {
            //     test: /\.js$/,
            //     exclude: /node_modules/,
            //     enforce: 'pre',
            //     loader: 'eslint-loader',
            //     options: {
            //         fix: true
            //     }
            // },
            {
                oneOf: [
                    {
                        test: /\.css$/,
                        use: [...commonCssLoader]
                    },
                    {
                        test: /\.less$/,
                        use: [...commonCssLoader, 'less-loader']
                    },
                    {
                        test: /\.js$/,
                        exclude: /node_modules/,
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                [
                                    '@babel/preset-env',
                                    {
                                        useBuiltIns: 'usage',
                                        corejs: { version: 3 },
                                        targets: {
                                            chrome: '60',
                                            firefox: '50'
                                        }
                                    }
                                ]
                            ]
                        }
                    },
                    {
                        test: /\.(jpg|png|gif)/,
                        loader: 'url-loader',
                        options: {
                            limit: 8 * 1024,
                            name: '[hash:10].[ext]',
                            outputPath: 'imgs',
                            esModule: false
                        }
                    },
                    {
                        exclude: /\.(js|css|less|html|jpg|png|gif)/,
                        loader: 'file-loader',
                        options: {
                            outputPath: 'source'
                        }
                    }
                ]
            }
        ]
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: '[name]/[name].css'
        }),
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
        new CleanWebpackPlugin(),
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
                            source: './build/' + name + '-v' + version,
                            destination: './build/' + name + '-v' + version + '.zip'
                        },
                    ]
                }
            }
        }),
    ]
});