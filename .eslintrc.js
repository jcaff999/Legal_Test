module.exports = {
  extends: ['standard', 'prettier', 'plugin:prettier/recommended'],
  plugins: ['simple-import-sort'],
  parserOptions: {
    c: 2017,
  },
  env: {
    node: true,
    es6: true,
    jest: true,
  },
  rules: {
    'new-cap': 0,
    'no-use-before-define': 'error',
    'prettier/prettier': 2,
    quotes: ['error', 'single'],
    'space-before-function-paren': 0,
    semi: [2, 'never'],
    'require-await': [2],
    'simple-import-sort/imports': [2],
  },
  globals: {
    strapi: 'readonly',
  },
}
