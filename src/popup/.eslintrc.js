module.exports = {
  root: true,
  env: {
    node: true,
    webextensions: true
  },
  extends: [
    'plugin:vue/essential',
    '@vue/airbnb',
  ],
  parserOptions: {
    parser: 'babel-eslint',
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'quotes': 'off',
    'semi': 'off',
    'comma-dangle': 'off',
    "max-len": ["error", { "ignorePattern": 'd="([\\s\\S]*?)"' }],
    "operator-linebreak": 'off',
    "implicit-arrow-linebreak": 'off',
    'linebreak-style': 'off'
  },
};
