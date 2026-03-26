export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {
      overrideBrowserslist: [
        ">= 1%",
        "last 2 versions",
        "not dead",
        "not ie 11"
      ]
    },
    'postcss-remove-warnings': {
      rules: {
        '-webkit-text-size-adjust': true
      }
    }
  },
}