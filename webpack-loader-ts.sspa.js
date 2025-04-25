/**
 * Custom webpack loader to replace WEBPACK_PUBLIC_PATH
 * anywhere it's found in the .ts code.
 **/
module.exports = function normalizeAssets(source) {
  const { baseUrl } = this.getOptions();

  return source.replace(/WEBPACK_PUBLIC_PATH/gm, baseUrl);
}
