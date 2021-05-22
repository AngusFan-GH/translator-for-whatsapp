const common = require('./webpack.build-common.js');
const webpack = require("webpack");
const dev = require('./_env/dev');

module.exports = common('dev', {
    plugins: [
        new webpack.DefinePlugin({
            'process.env': dev,
        })
    ]
});