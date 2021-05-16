const { resolve } = require('path');
const { name, version } = require('./package.json');



module.exports = {
    entry: {
        'background': ['./src/background/background.js'],
        'content': ['./src/content/content.js'],
        'options': ['./src/options/options.js'],
        'contact': ['./src/content/inject/contact.js'],
    },
    output: {
        path: resolve(__dirname, 'build/' + name + '-v' + version),
        filename: (chunkData) => {
            switch (chunkData.chunk.name) {
                case 'contact':
                    return 'content/[name].js';
                default:
                    return '[name]/[name].js';
            }
        }
    }
};