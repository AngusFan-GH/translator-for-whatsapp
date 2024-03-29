const { resolve } = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsWebpackPlugin = require('optimize-css-assets-webpack-plugin');
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');
const FileManagerPlugin = require('filemanager-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { name, version } = require('./package.json');
const { options } = require('less');

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

module.exports = {
    entry: {
        'background': ['./src/background/background.js'],
        'content': ['./src/content/content.js'],
        'options': ['./src/options/options.js'],
    },
    output: {
        path: resolve(__dirname, 'build/' + name + '-v' + version),
        filename: '[name]/[name].js'
    },
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
    ],
    mode: 'production'
};