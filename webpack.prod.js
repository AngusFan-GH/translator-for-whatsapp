const common = require('./webpack.build-common.js');
const webpack = require("webpack");
const prod = require('./_env/prod');

module.exports = common('prod', {
    plugins: [
        new webpack.DefinePlugin({
            'process.env': prod,
        })
    ]
});